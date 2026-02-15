"""Servicio de Reportes Inteligentes - generación automática con IA."""
import json
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.documents import Invoice, CreditNote, DebitNote
from app.models.clients import Client
from app.services.ai.llm_client import chat_completion

logger = logging.getLogger(__name__)


async def generate_sales_book(
    db: AsyncSession,
    client_id,
    year: int,
    month: int,
) -> dict:
    """Genera el Libro de Ventas del período con análisis IA."""
    start = datetime(year, month, 1, tzinfo=timezone.utc)
    if month == 12:
        end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end = datetime(year, month + 1, 1, tzinfo=timezone.utc)

    # Obtener todas las facturas del período
    invoices_q = await db.execute(
        select(Invoice).where(
            Invoice.client_id == client_id,
            Invoice.fecha_emision >= start,
            Invoice.fecha_emision < end,
        ).order_by(Invoice.numero_control)
    )
    invoices = invoices_q.scalars().all()

    # Totales
    total_base_imponible = sum(float(i.base_imponible or 0) for i in invoices if i.status != "anulado")
    total_base_exenta = sum(float(i.base_exenta or 0) for i in invoices if i.status != "anulado")
    total_iva_16 = sum(float(i.monto_iva_16 or 0) for i in invoices if i.status != "anulado")
    total_iva_8 = sum(float(i.monto_iva_8 or 0) for i in invoices if i.status != "anulado")
    total_general = sum(float(i.total or 0) for i in invoices if i.status != "anulado")
    voided_count = sum(1 for i in invoices if i.status == "anulado")

    entries = [
        {
            "numero_control": i.numero_control,
            "fecha": i.fecha_emision.strftime("%d/%m/%Y") if i.fecha_emision else "",
            "rif_cliente": i.receptor_rif,
            "razon_social": i.receptor_razon_social,
            "numero_factura": i.document_number,
            "base_imponible": float(i.base_imponible or 0),
            "base_exenta": float(i.base_exenta or 0),
            "iva_16": float(i.monto_iva_16 or 0),
            "iva_8": float(i.monto_iva_8 or 0),
            "total": float(i.total or 0),
            "status": i.status,
        }
        for i in invoices
    ]

    # Generar análisis IA del libro
    analysis_prompt = f"""Analiza este Libro de Ventas de {month:02d}/{year} y genera un resumen ejecutivo:

Totales:
- Facturas: {len(invoices)} ({voided_count} anuladas)
- Base Imponible: Bs. {total_base_imponible:,.2f}
- Base Exenta: Bs. {total_base_exenta:,.2f}
- IVA 16%: Bs. {total_iva_16:,.2f}
- IVA 8%: Bs. {total_iva_8:,.2f}
- Total General: Bs. {total_general:,.2f}

Top 3 clientes por monto: {json.dumps(sorted(
    [{"rif": e["rif_cliente"], "name": e["razon_social"], "total": e["total"]}
     for e in entries if e["status"] != "anulado"],
    key=lambda x: x["total"], reverse=True
)[:3], indent=2)}

Genera:
1. Resumen ejecutivo del período
2. Observaciones sobre la tasa de anulación
3. Distribución gravado vs exento
4. Recomendaciones para la declaración de IVA"""

    ai_analysis = None
    try:
        result = await chat_completion(
            messages=[{"role": "user", "content": analysis_prompt}],
            system_prompt="Eres un contador fiscal venezolano experto. Analiza libros de ventas y da recomendaciones precisas.",
            temperature=0.3,
        )
        ai_analysis = result["content"]
    except Exception as e:
        logger.warning(f"AI analysis failed for sales book: {e}")
        ai_analysis = "Análisis IA no disponible."

    return {
        "report_type": "libro_ventas",
        "period": f"{month:02d}/{year}",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "total_invoices": len(invoices),
            "voided": voided_count,
            "active": len(invoices) - voided_count,
            "total_base_imponible": total_base_imponible,
            "total_base_exenta": total_base_exenta,
            "total_iva_16": total_iva_16,
            "total_iva_8": total_iva_8,
            "total_general": total_general,
        },
        "entries": entries,
        "ai_analysis": ai_analysis,
    }


async def generate_tax_summary(
    db: AsyncSession,
    client_id,
    year: int,
    month: int,
) -> dict:
    """Genera resumen de IVA para declaración."""
    start = datetime(year, month, 1, tzinfo=timezone.utc)
    if month == 12:
        end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end = datetime(year, month + 1, 1, tzinfo=timezone.utc)

    # Ventas
    sales_q = await db.execute(
        select(
            func.count().label("count"),
            func.coalesce(func.sum(Invoice.base_imponible), 0).label("base_imponible"),
            func.coalesce(func.sum(Invoice.base_exenta), 0).label("base_exenta"),
            func.coalesce(func.sum(Invoice.monto_iva_16), 0).label("iva_16"),
            func.coalesce(func.sum(Invoice.monto_iva_8), 0).label("iva_8"),
            func.coalesce(func.sum(Invoice.total), 0).label("total"),
        ).where(
            Invoice.client_id == client_id,
            Invoice.fecha_emision >= start,
            Invoice.fecha_emision < end,
            Invoice.status != "anulado",
        )
    )
    sales = sales_q.one()

    # Notas de crédito
    cn_q = await db.execute(
        select(
            func.count().label("count"),
            func.coalesce(func.sum(CreditNote.monto_total), 0).label("total"),
        ).where(
            CreditNote.client_id == client_id,
            CreditNote.fecha_emision >= start,
            CreditNote.fecha_emision < end,
            CreditNote.status != "anulado",
        )
    )
    credit_notes = cn_q.one()

    # Notas de débito
    dn_q = await db.execute(
        select(
            func.count().label("count"),
            func.coalesce(func.sum(DebitNote.monto_total), 0).label("total"),
        ).where(
            DebitNote.client_id == client_id,
            DebitNote.fecha_emision >= start,
            DebitNote.fecha_emision < end,
            DebitNote.status != "anulado",
        )
    )
    debit_notes = dn_q.one()

    debito_fiscal = float(sales.iva_16) + float(sales.iva_8)
    # En un escenario real, restaríamos crédito fiscal de compras
    iva_a_pagar = debito_fiscal

    summary = {
        "report_type": "resumen_iva",
        "period": f"{month:02d}/{year}",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "ventas": {
            "cantidad": sales.count,
            "base_imponible": float(sales.base_imponible),
            "base_exenta": float(sales.base_exenta),
            "iva_16_pct": float(sales.iva_16),
            "iva_8_pct": float(sales.iva_8),
            "total": float(sales.total),
        },
        "notas_credito": {
            "cantidad": credit_notes.count,
            "total": float(credit_notes.total),
        },
        "notas_debito": {
            "cantidad": debit_notes.count,
            "total": float(debit_notes.total),
        },
        "resumen_iva": {
            "debito_fiscal": debito_fiscal,
            "credito_fiscal": 0,  # Requiere libro de compras
            "iva_a_pagar": iva_a_pagar,
            "nota": "El crédito fiscal requiere registro del libro de compras.",
        },
    }

    # Análisis IA
    try:
        result = await chat_completion(
            messages=[{"role": "user", "content": f"""Genera recomendaciones para esta declaración de IVA:
{json.dumps(summary, indent=2)}

Incluye:
1. Si los números son consistentes
2. Recordatorio de plazos de declaración
3. Sugerencias de optimización"""}],
            system_prompt="Eres un asesor fiscal venezolano. Ayuda con declaraciones de IVA al SENIAT.",
            temperature=0.3,
        )
        summary["ai_recommendations"] = result["content"]
    except Exception as e:
        logger.warning(f"AI analysis failed: {e}")
        summary["ai_recommendations"] = "Recomendaciones IA no disponibles."

    return summary


async def generate_client_report(
    db: AsyncSession,
    client_id,
    customer_rif: str,
) -> dict:
    """Reporte detallado de un cliente final específico."""
    now = datetime.now(timezone.utc)
    year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

    # Facturas del cliente en el año
    inv_q = await db.execute(
        select(
            func.count().label("count"),
            func.coalesce(func.sum(Invoice.total), 0).label("total"),
            func.coalesce(func.avg(Invoice.total), 0).label("avg"),
            func.min(Invoice.fecha_emision).label("first"),
            func.max(Invoice.fecha_emision).label("last"),
        ).where(
            Invoice.client_id == client_id,
            Invoice.receptor_rif == customer_rif,
            Invoice.fecha_emision >= year_start,
            Invoice.status != "anulado",
        )
    )
    inv = inv_q.one()

    # Detalle mensual
    monthly_q = await db.execute(
        select(
            func.date_trunc("month", Invoice.fecha_emision).label("mes"),
            func.count().label("count"),
            func.sum(Invoice.total).label("total"),
        ).where(
            Invoice.client_id == client_id,
            Invoice.receptor_rif == customer_rif,
            Invoice.fecha_emision >= year_start,
            Invoice.status != "anulado",
        ).group_by("mes").order_by("mes")
    )
    monthly = [
        {"month": row[0].strftime("%Y-%m"), "invoices": row[1], "total": float(row[2] or 0)}
        for row in monthly_q.all()
    ]

    return {
        "report_type": "reporte_cliente",
        "customer_rif": customer_rif,
        "generated_at": now.isoformat(),
        "year": now.year,
        "summary": {
            "total_invoices": inv.count,
            "total_amount": float(inv.total),
            "average_invoice": float(inv.avg),
            "first_invoice": inv.first.isoformat() if inv.first else None,
            "last_invoice": inv.last.isoformat() if inv.last else None,
        },
        "monthly_detail": monthly,
    }

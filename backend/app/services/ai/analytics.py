"""Servicio de Analytics avanzado con IA - tendencias, predicciones, KPIs."""
import json
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func, case, extract
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.documents import Invoice, CreditNote, DebitNote
from app.models.clients import Client
from app.models.control_numbers import ControlNumberRange
from app.models.customers import Customer

logger = logging.getLogger(__name__)


async def get_advanced_analytics(db: AsyncSession, client_id, period_days: int = 90) -> dict:
    """Dashboard de analytics avanzado con múltiples KPIs."""
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=period_days)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # --- KPIs principales ---
    kpis = await _compute_kpis(db, client_id, month_start, today_start)

    # --- Tendencia diaria (últimos N días) ---
    daily_trend = await _daily_trend(db, client_id, since)

    # --- Distribución por tipo de impuesto ---
    tax_distribution = await _tax_distribution(db, client_id, month_start)

    # --- Top clientes ---
    top_customers = await _top_customers(db, client_id, month_start)

    # --- Distribución por forma de pago ---
    payment_distribution = await _payment_distribution(db, client_id, month_start)

    # --- Documentos por hora del día (patrón de facturación) ---
    hourly_pattern = await _hourly_pattern(db, client_id, since)

    # --- Predicción simple (media móvil) ---
    prediction = await _simple_prediction(db, client_id)

    # --- NC consumption rate ---
    nc_stats = await _nc_consumption(db, client_id)

    return {
        "period_days": period_days,
        "kpis": kpis,
        "daily_trend": daily_trend,
        "tax_distribution": tax_distribution,
        "top_customers": top_customers,
        "payment_distribution": payment_distribution,
        "hourly_pattern": hourly_pattern,
        "prediction": prediction,
        "control_numbers": nc_stats,
    }


async def get_ai_insights(db: AsyncSession, client_id) -> dict:
    """Genera insights con IA basándose en los analytics."""
    from app.services.ai.llm_client import chat_completion

    analytics = await get_advanced_analytics(db, client_id, period_days=30)

    prompt = f"""Analiza estos KPIs de facturación del último mes y dame 3-5 insights accionables:

```json
{json.dumps(analytics["kpis"], indent=2)}
```

Tendencia diaria (últimos 30 días): {len(analytics["daily_trend"])} días con datos
Top clientes: {json.dumps(analytics["top_customers"][:5], indent=2)}
Distribución IVA: {json.dumps(analytics["tax_distribution"], indent=2)}
Predicción próximo mes: {json.dumps(analytics["prediction"], indent=2)}
NC restantes: {json.dumps(analytics["control_numbers"], indent=2)}

Dame insights en formato:
- **Insight**: descripción breve
- **Impacto**: alto/medio/bajo
- **Acción recomendada**: qué hacer

Sé específico con números y porcentajes."""

    result = await chat_completion(
        messages=[{"role": "user", "content": prompt}],
        system_prompt="Eres un analista fiscal experto en Venezuela. Tus insights deben ser prácticos y basados en datos.",
        temperature=0.4,
    )

    return {
        "insights": result["content"],
        "analytics_summary": analytics["kpis"],
        "prediction": analytics["prediction"],
        "usage": result["usage"],
    }


# ---------------------------------------------------------------------------
# Funciones de cálculo
# ---------------------------------------------------------------------------

async def _compute_kpis(db, client_id, month_start, today_start) -> dict:
    now = datetime.now(timezone.utc)
    prev_month_start = (month_start - timedelta(days=1)).replace(day=1)

    # Este mes
    current_q = await db.execute(
        select(
            func.count().label("count"),
            func.coalesce(func.sum(Invoice.total), 0).label("total"),
            func.coalesce(func.avg(Invoice.total), 0).label("avg"),
            func.coalesce(func.sum(Invoice.monto_iva_16), 0).label("iva_16"),
            func.coalesce(func.sum(Invoice.monto_iva_8), 0).label("iva_8"),
        ).where(
            Invoice.client_id == client_id,
            Invoice.fecha_emision >= month_start,
            Invoice.status != "anulado",
        )
    )
    current = current_q.one()

    # Mes anterior
    prev_q = await db.execute(
        select(
            func.count().label("count"),
            func.coalesce(func.sum(Invoice.total), 0).label("total"),
        ).where(
            Invoice.client_id == client_id,
            Invoice.fecha_emision >= prev_month_start,
            Invoice.fecha_emision < month_start,
            Invoice.status != "anulado",
        )
    )
    prev = prev_q.one()

    # Hoy
    today_q = await db.execute(
        select(
            func.count().label("count"),
            func.coalesce(func.sum(Invoice.total), 0).label("total"),
        ).where(
            Invoice.client_id == client_id,
            Invoice.fecha_emision >= today_start,
            Invoice.status != "anulado",
        )
    )
    today = today_q.one()

    # Anulados este mes
    voided_q = await db.execute(
        select(func.count()).select_from(Invoice).where(
            Invoice.client_id == client_id,
            Invoice.fecha_emision >= month_start,
            Invoice.status == "anulado",
        )
    )
    voided = voided_q.scalar() or 0

    # Variación mensual
    prev_total = float(prev.total) if prev.total else 0
    current_total = float(current.total) if current.total else 0
    variation = ((current_total - prev_total) / prev_total * 100) if prev_total > 0 else 0

    return {
        "today_invoices": today.count,
        "today_total": float(today.total),
        "month_invoices": current.count,
        "month_total": current_total,
        "month_avg_invoice": float(current.avg),
        "month_iva_16": float(current.iva_16),
        "month_iva_8": float(current.iva_8),
        "month_voided": voided,
        "prev_month_invoices": prev.count,
        "prev_month_total": prev_total,
        "month_variation_pct": round(variation, 1),
        "void_rate_pct": round((voided / current.count * 100) if current.count > 0 else 0, 1),
    }


async def _daily_trend(db, client_id, since) -> list[dict]:
    result = await db.execute(
        select(
            func.date(Invoice.fecha_emision).label("dia"),
            func.count().label("facturas"),
            func.coalesce(func.sum(Invoice.total), 0).label("total"),
        ).where(
            Invoice.client_id == client_id,
            Invoice.fecha_emision >= since,
            Invoice.status != "anulado",
        ).group_by("dia").order_by("dia")
    )
    return [
        {"date": str(row[0]), "invoices": row[1], "total": float(row[2])}
        for row in result.all()
    ]


async def _tax_distribution(db, client_id, since) -> dict:
    result = await db.execute(
        select(
            func.coalesce(func.sum(Invoice.base_imponible), 0).label("gravado"),
            func.coalesce(func.sum(Invoice.base_exenta), 0).label("exento"),
            func.coalesce(func.sum(Invoice.monto_iva_16), 0).label("iva_16"),
            func.coalesce(func.sum(Invoice.monto_iva_8), 0).label("iva_8"),
        ).where(
            Invoice.client_id == client_id,
            Invoice.fecha_emision >= since,
            Invoice.status != "anulado",
        )
    )
    row = result.one()
    total = float(row.gravado) + float(row.exento)
    return {
        "base_gravada": float(row.gravado),
        "base_exenta": float(row.exento),
        "iva_16": float(row.iva_16),
        "iva_8": float(row.iva_8),
        "pct_gravado": round((float(row.gravado) / total * 100) if total > 0 else 0, 1),
        "pct_exento": round((float(row.exento) / total * 100) if total > 0 else 0, 1),
    }


async def _top_customers(db, client_id, since) -> list[dict]:
    result = await db.execute(
        select(
            Invoice.receptor_razon_social,
            Invoice.receptor_rif,
            func.count().label("facturas"),
            func.sum(Invoice.total).label("total"),
        ).where(
            Invoice.client_id == client_id,
            Invoice.fecha_emision >= since,
            Invoice.status != "anulado",
        ).group_by(Invoice.receptor_razon_social, Invoice.receptor_rif)
        .order_by(func.sum(Invoice.total).desc()).limit(10)
    )
    return [
        {
            "name": row[0] or "Sin nombre",
            "rif": row[1],
            "invoices": row[2],
            "total": float(row[3] or 0),
        }
        for row in result.all()
    ]


async def _payment_distribution(db, client_id, since) -> list[dict]:
    result = await db.execute(
        select(
            Invoice.forma_pago,
            func.count().label("count"),
            func.sum(Invoice.total).label("total"),
        ).where(
            Invoice.client_id == client_id,
            Invoice.fecha_emision >= since,
            Invoice.status != "anulado",
        ).group_by(Invoice.forma_pago)
        .order_by(func.sum(Invoice.total).desc())
    )
    return [
        {"method": row[0] or "No especificado", "count": row[1], "total": float(row[2] or 0)}
        for row in result.all()
    ]


async def _hourly_pattern(db, client_id, since) -> list[dict]:
    result = await db.execute(
        select(
            extract("hour", Invoice.fecha_emision).label("hora"),
            func.count().label("count"),
        ).where(
            Invoice.client_id == client_id,
            Invoice.fecha_emision >= since,
            Invoice.status != "anulado",
        ).group_by("hora").order_by("hora")
    )
    return [{"hour": int(row[0]), "count": row[1]} for row in result.all()]


async def _simple_prediction(db, client_id) -> dict:
    """Predicción simple basada en media móvil de 3 meses."""
    now = datetime.now(timezone.utc)
    three_months = now - timedelta(days=90)

    result = await db.execute(
        select(
            func.date_trunc("month", Invoice.fecha_emision).label("mes"),
            func.count().label("facturas"),
            func.coalesce(func.sum(Invoice.total), 0).label("total"),
        ).where(
            Invoice.client_id == client_id,
            Invoice.fecha_emision >= three_months,
            Invoice.status != "anulado",
        ).group_by("mes").order_by("mes")
    )
    months = result.all()

    if len(months) < 2:
        return {"predicted_invoices": 0, "predicted_total": 0, "confidence": "low", "trend": "insufficient_data"}

    totals = [float(m[2]) for m in months]
    counts = [m[1] for m in months]

    avg_total = sum(totals) / len(totals)
    avg_count = sum(counts) / len(counts)

    # Tendencia: comparar último con promedio
    if totals[-1] > avg_total * 1.1:
        trend = "growing"
    elif totals[-1] < avg_total * 0.9:
        trend = "declining"
    else:
        trend = "stable"

    return {
        "predicted_invoices": round(avg_count),
        "predicted_total": round(avg_total, 2),
        "confidence": "medium" if len(months) >= 3 else "low",
        "trend": trend,
        "monthly_avg": round(avg_total, 2),
    }


async def _nc_consumption(db, client_id) -> dict:
    """Análisis de consumo de números de control."""
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # NC usados este mes
    used_q = await db.execute(
        select(func.count()).select_from(Invoice).where(
            Invoice.client_id == client_id,
            Invoice.fecha_emision >= month_start,
        )
    )
    used_this_month = used_q.scalar() or 0

    # NC disponibles
    avail_q = await db.execute(
        select(
            func.sum(ControlNumberRange.numero_fin - ControlNumberRange.numero_actual)
        ).where(
            ControlNumberRange.client_id == client_id,
            ControlNumberRange.is_active == True,
        )
    )
    available = avail_q.scalar() or 0

    # Ritmo diario
    days_passed = max(now.day, 1)
    daily_rate = used_this_month / days_passed

    # Días hasta agotar NC
    days_until_empty = (available / daily_rate) if daily_rate > 0 else 999

    return {
        "used_this_month": used_this_month,
        "available": available,
        "daily_rate": round(daily_rate, 1),
        "estimated_days_remaining": round(days_until_empty),
        "needs_refill": days_until_empty < 30,
    }

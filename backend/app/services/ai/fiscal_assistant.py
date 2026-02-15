"""Asistente Fiscal IA - Agente inteligente para consultas fiscales venezolanas.

Funciona como un experto en:
- Legislación fiscal venezolana (SENIAT, Providencias)
- Facturación electrónica y números de control
- IVA, ISLR, retenciones
- Interpretación de estados de cuenta
- Recomendaciones de optimización fiscal
"""
import json
import logging
from datetime import datetime, timezone
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.ai.llm_client import chat_completion

logger = logging.getLogger(__name__)

FISCAL_SYSTEM_PROMPT = """Eres el Asistente Fiscal de AIDA, una plataforma de Imprenta Digital autorizada por el SENIAT en Venezuela.

Tu rol es asistir a usuarios (contadores, facturadores, administradores) con:

1. **Facturación**: Cómo emitir facturas, notas de crédito/débito, guías de despacho. Números de control, series.
2. **Impuestos Venezuela**: IVA (16% general, 8% reducido, exento), ISLR, retenciones.
3. **Normativa SENIAT**: Providencias SNAT/2024/000102, 000121, 2011/0071. Requisitos de imprentas digitales.
4. **Números de Control**: Cómo funcionan, asignación, consecutividad, rangos autorizados.
5. **Reportes fiscales**: Libro de ventas, libro de compras, declaraciones.
6. **Uso de AIDA**: Cómo usar el sistema de facturación, integrar con ERPs, configurar webhooks.

Reglas:
- Responde siempre en español.
- Sé conciso pero preciso. Cita la normativa cuando sea relevante.
- Si no estás seguro de algo fiscal, dilo claramente. No inventes normativas.
- Cuando el usuario pregunte sobre datos específicos de su cuenta, usa el contexto proporcionado.
- Formatea con markdown cuando ayude a la lectura.
- Si detectas un error en cómo el usuario está facturando, adviértelo.
"""


async def chat_with_context(
    db: AsyncSession,
    client_id,
    user_message: str,
    conversation_history: list[dict] | None = None,
    include_account_context: bool = True,
) -> dict:
    """Chat con el asistente fiscal, enriquecido con datos de la cuenta.

    Returns: {"response": str, "context_used": list, "usage": dict}
    """
    messages = []
    context_parts = []

    # Enriquecer con datos de la cuenta del cliente
    if include_account_context and client_id:
        account_context = await _build_account_context(db, client_id)
        if account_context:
            context_parts.append(account_context)

    # Detectar si la pregunta necesita datos específicos
    query_context = await _detect_query_context(user_message, db, client_id)
    if query_context:
        context_parts.append(query_context)

    # Construir system prompt con contexto
    system = FISCAL_SYSTEM_PROMPT
    if context_parts:
        system += "\n\n--- CONTEXTO DE LA CUENTA ---\n" + "\n".join(context_parts)

    # Añadir historial de conversación
    if conversation_history:
        messages.extend(conversation_history[-10:])  # Últimos 10 mensajes

    messages.append({"role": "user", "content": user_message})

    result = await chat_completion(
        messages=messages,
        system_prompt=system,
        temperature=0.3,
    )

    return {
        "response": result["content"],
        "context_used": [c[:100] + "..." for c in context_parts] if context_parts else [],
        "usage": result["usage"],
        "model": result["model"],
    }


async def analyze_document(
    db: AsyncSession,
    client_id,
    document_data: dict,
) -> dict:
    """Analiza un documento fiscal y da recomendaciones."""
    prompt = f"""Analiza el siguiente documento fiscal y dame:
1. Verificación de que los campos están correctos según la normativa SENIAT
2. Si los cálculos de IVA son correctos
3. Si falta algún campo obligatorio
4. Recomendaciones de mejora

Documento:
```json
{json.dumps(document_data, indent=2, default=str)}
```

Responde en formato estructurado con secciones claras."""

    result = await chat_completion(
        messages=[{"role": "user", "content": prompt}],
        system_prompt=FISCAL_SYSTEM_PROMPT,
        temperature=0.2,
    )

    return {
        "analysis": result["content"],
        "usage": result["usage"],
    }


async def generate_fiscal_summary(
    db: AsyncSession,
    client_id,
    period: str = "month",
) -> dict:
    """Genera un resumen fiscal inteligente del período."""
    from app.models.documents import Invoice
    from app.models.control_numbers import ControlNumberRange

    now = datetime.now(timezone.utc)
    if period == "month":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        period_label = now.strftime("%B %Y")
    elif period == "week":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        from datetime import timedelta
        start = start - timedelta(days=now.weekday())
        period_label = f"Semana del {start.strftime('%d/%m')}"
    else:
        start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        period_label = str(now.year)

    # Obtener datos del período
    invoices_q = await db.execute(
        select(
            func.count().label("total"),
            func.sum(Invoice.total).label("monto_total"),
            func.sum(Invoice.monto_iva_16).label("iva_16"),
            func.sum(Invoice.monto_iva_8).label("iva_8"),
            func.sum(Invoice.base_exenta).label("exento"),
            func.sum(Invoice.base_imponible).label("base_imponible"),
        ).where(
            Invoice.client_id == client_id,
            Invoice.fecha_emision >= start,
            Invoice.status != "anulado",
        )
    )
    row = invoices_q.one()

    voided_q = await db.execute(
        select(func.count()).select_from(Invoice).where(
            Invoice.client_id == client_id,
            Invoice.fecha_emision >= start,
            Invoice.status == "anulado",
        )
    )
    voided = voided_q.scalar() or 0

    nc_q = await db.execute(
        select(
            func.sum(ControlNumberRange.numero_fin - ControlNumberRange.numero_actual)
        ).where(
            ControlNumberRange.client_id == client_id,
            ControlNumberRange.is_active == True,
        )
    )
    nc_remaining = nc_q.scalar() or 0

    data_context = f"""Datos del período ({period_label}):
- Facturas emitidas: {row.total or 0}
- Facturas anuladas: {voided}
- Monto total facturado: Bs. {float(row.monto_total or 0):,.2f}
- Base imponible: Bs. {float(row.base_imponible or 0):,.2f}
- IVA 16%: Bs. {float(row.iva_16 or 0):,.2f}
- IVA 8%: Bs. {float(row.iva_8 or 0):,.2f}
- Base exenta: Bs. {float(row.exento or 0):,.2f}
- Números de control disponibles: {nc_remaining}"""

    prompt = f"""Con base en los siguientes datos fiscales, genera un resumen ejecutivo que incluya:

1. **Resumen del período**: Totales, tendencias
2. **Análisis de IVA**: Desglose, proporción gravado vs exento
3. **Alertas**: Cualquier anomalía o punto de atención
4. **Recomendaciones**: Optimización fiscal, planificación
5. **Estado de números de control**: Si necesitan solicitar más

{data_context}

Sé específico con los números y porcentajes. Formatea con markdown."""

    result = await chat_completion(
        messages=[{"role": "user", "content": prompt}],
        system_prompt=FISCAL_SYSTEM_PROMPT,
        temperature=0.3,
    )

    return {
        "summary": result["content"],
        "period": period_label,
        "raw_data": {
            "total_invoices": row.total or 0,
            "voided": voided,
            "total_amount": float(row.monto_total or 0),
            "iva_16": float(row.iva_16 or 0),
            "iva_8": float(row.iva_8 or 0),
            "base_exempt": float(row.exento or 0),
            "control_numbers_remaining": nc_remaining,
        },
        "usage": result["usage"],
    }


async def suggest_tax_optimization(
    db: AsyncSession,
    client_id,
) -> dict:
    """Sugiere optimizaciones fiscales basadas en patrones de facturación."""
    from app.models.documents import Invoice
    from datetime import timedelta

    now = datetime.now(timezone.utc)
    three_months_ago = now - timedelta(days=90)

    # Análisis de 3 meses
    monthly_q = await db.execute(
        select(
            func.date_trunc("month", Invoice.fecha_emision).label("mes"),
            func.count().label("facturas"),
            func.sum(Invoice.total).label("total"),
            func.sum(Invoice.monto_iva_16).label("iva"),
            func.avg(Invoice.total).label("promedio"),
        ).where(
            Invoice.client_id == client_id,
            Invoice.fecha_emision >= three_months_ago,
            Invoice.status != "anulado",
        ).group_by("mes").order_by("mes")
    )
    monthly_data = [
        {
            "mes": row[0].strftime("%Y-%m") if row[0] else "N/A",
            "facturas": row[1],
            "total": float(row[2] or 0),
            "iva": float(row[3] or 0),
            "promedio": float(row[4] or 0),
        }
        for row in monthly_q.all()
    ]

    prompt = f"""Analiza los siguientes datos de facturación de los últimos 3 meses y sugiere optimizaciones:

```json
{json.dumps(monthly_data, indent=2)}
```

Enfócate en:
1. **Tendencias**: ¿Crecimiento o decrecimiento? ¿Estacionalidad?
2. **Carga fiscal**: Proporción de IVA sobre total
3. **Planificación**: Recomendaciones para próximos meses
4. **Alertas**: Si el volumen sugiere cambio de plan o solicitud de más NC
5. **Mejores prácticas**: Según normativa SENIAT vigente

Sé práctico y específico."""

    result = await chat_completion(
        messages=[{"role": "user", "content": prompt}],
        system_prompt=FISCAL_SYSTEM_PROMPT,
        temperature=0.4,
    )

    return {
        "suggestions": result["content"],
        "monthly_data": monthly_data,
        "usage": result["usage"],
    }


# ---------------------------------------------------------------------------
# Helpers para construir contexto
# ---------------------------------------------------------------------------

async def _build_account_context(db: AsyncSession, client_id) -> str | None:
    """Construye contexto de la cuenta del cliente para el LLM."""
    from app.models.clients import Client
    from app.models.documents import Invoice

    client_q = await db.execute(
        select(Client).where(Client.id == client_id)
    )
    client = client_q.scalar_one_or_none()
    if not client:
        return None

    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    docs_q = await db.execute(
        select(func.count()).select_from(Invoice).where(
            Invoice.client_id == client_id,
            Invoice.fecha_emision >= month_start,
        )
    )
    docs_month = docs_q.scalar() or 0

    return f"""Cliente: {client.razon_social} (RIF: {client.rif})
Plan: {client.plan} | Límite mensual: {client.max_documentos_mes} docs
Documentos este mes: {docs_month}/{client.max_documentos_mes}
Moneda principal: {client.moneda_principal}
Zona horaria: {client.zona_horaria}"""


async def _detect_query_context(
    message: str,
    db: AsyncSession,
    client_id,
) -> str | None:
    """Detecta si el mensaje necesita datos específicos y los obtiene."""
    msg_lower = message.lower()

    if any(kw in msg_lower for kw in ["número de control", "numeros de control", "nc disponible", "rango"]):
        from app.services.fiscal.control_numbers import get_available_count
        nc_data = await get_available_count(db, client_id)
        return f"Números de control:\n{json.dumps(nc_data, indent=2, default=str)}"

    if any(kw in msg_lower for kw in ["última factura", "ultimo documento", "factura reciente"]):
        from app.models.documents import Invoice
        last_q = await db.execute(
            select(Invoice).where(Invoice.client_id == client_id)
            .order_by(Invoice.fecha_emision.desc()).limit(3)
        )
        invoices = last_q.scalars().all()
        if invoices:
            data = [
                {
                    "numero_control": i.numero_control,
                    "total": float(i.total) if i.total else 0,
                    "status": i.status,
                    "fecha": i.fecha_emision.isoformat() if i.fecha_emision else None,
                    "receptor": i.receptor_razon_social,
                }
                for i in invoices
            ]
            return f"Últimas facturas:\n{json.dumps(data, indent=2, default=str)}"

    return None

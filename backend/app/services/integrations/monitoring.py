"""Servicio de monitoreo - métricas, health checks y alertas."""
import json
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func, and_, case
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.integrations import (
    IntegrationConnection, IntegrationError, MonitoringMetric, Webhook,
)
from app.models.clients import Client
from app.models.documents import Invoice
from app.models.control_numbers import ControlNumberRange, ControlNumber

logger = logging.getLogger(__name__)


async def record_metric(
    db: AsyncSession,
    metric_name: str,
    value: float,
    unit: str = "count",
    period: str = "minute",
    client_id=None,
    connection_id=None,
    tags: dict | None = None,
):
    """Registra un punto de métrica."""
    now = datetime.now(timezone.utc)

    if period == "minute":
        period_start = now.replace(second=0, microsecond=0)
        period_end = period_start + timedelta(minutes=1)
    elif period == "hourly":
        period_start = now.replace(minute=0, second=0, microsecond=0)
        period_end = period_start + timedelta(hours=1)
    elif period == "daily":
        period_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        period_end = period_start + timedelta(days=1)
    else:
        period_start = now
        period_end = now + timedelta(minutes=1)

    metric = MonitoringMetric(
        client_id=client_id,
        connection_id=connection_id,
        metric_name=metric_name,
        metric_value=value,
        metric_unit=unit,
        tags=json.dumps(tags) if tags else None,
        period=period,
        period_start=period_start,
        period_end=period_end,
    )
    db.add(metric)
    await db.flush()


async def get_monitoring_dashboard(db: AsyncSession) -> dict:
    """Dashboard global de monitoreo para Portal 5."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    last_24h = now - timedelta(hours=24)

    # Clientes activos
    clients_q = await db.execute(
        select(func.count()).select_from(Client).where(Client.is_active == True)
    )
    total_clients = clients_q.scalar() or 0

    # Conexiones activas y su salud
    conn_q = await db.execute(
        select(
            func.count().label("total"),
            func.sum(case((IntegrationConnection.health_status == "healthy", 1), else_=0)).label("healthy"),
            func.sum(case((IntegrationConnection.health_status == "degraded", 1), else_=0)).label("degraded"),
            func.sum(case((IntegrationConnection.health_status == "down", 1), else_=0)).label("down"),
        ).select_from(IntegrationConnection).where(
            IntegrationConnection.status == "activa"
        )
    )
    conn_row = conn_q.one()
    total_connections = conn_row.total or 0
    healthy = conn_row.healthy or 0
    degraded = conn_row.degraded or 0
    down = conn_row.down or 0

    # Documentos emitidos hoy
    docs_q = await db.execute(
        select(func.count()).select_from(Invoice).where(
            Invoice.fecha_emision >= today_start
        )
    )
    docs_today = docs_q.scalar() or 0

    # Errores abiertos
    errors_q = await db.execute(
        select(func.count()).select_from(IntegrationError).where(
            IntegrationError.status.in_(["open", "investigating"])
        )
    )
    errors_open = errors_q.scalar() or 0

    # Documentos por hora (últimas 24h)
    docs_per_hour = await _get_hourly_metric(db, "documents_emitted", last_24h)

    # Errores por hora
    errors_per_hour = await _get_hourly_errors(db, last_24h)

    # Tiempo de respuesta promedio
    avg_response = await _get_hourly_metric(db, "avg_response_time", last_24h)

    # Top errores
    top_errors_q = await db.execute(
        select(IntegrationError).where(
            IntegrationError.status.in_(["open", "investigating"])
        ).order_by(
            IntegrationError.severity.desc(),
            IntegrationError.occurrence_count.desc(),
        ).limit(10)
    )
    top_errors = top_errors_q.scalars().all()

    # Alertas activas
    alerts = await _generate_alerts(db)

    return {
        "total_clients_active": total_clients,
        "total_connections_active": total_connections,
        "total_documents_today": docs_today,
        "total_errors_open": errors_open,
        "connections_healthy": healthy,
        "connections_degraded": degraded,
        "connections_down": down,
        "documents_per_hour": docs_per_hour,
        "errors_per_hour": errors_per_hour,
        "avg_response_time": avg_response,
        "top_errors": [
            {
                "id": e.id,
                "client_id": e.client_id,
                "connection_id": e.connection_id,
                "error_code": e.error_code,
                "category": e.category,
                "severity": e.severity,
                "title": e.title,
                "message": e.message,
                "context_json": json.loads(e.context_json) if e.context_json else None,
                "status": e.status,
                "resolved_at": e.resolved_at,
                "resolution_notes": e.resolution_notes,
                "is_retryable": e.is_retryable,
                "retry_count": e.retry_count,
                "occurrence_count": e.occurrence_count,
                "first_seen_at": e.first_seen_at,
                "last_seen_at": e.last_seen_at,
            }
            for e in top_errors
        ],
        "alerts": alerts,
    }


async def get_clients_health(db: AsyncSession, skip: int = 0, limit: int = 50) -> dict:
    """Estado de salud de todos los clientes."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    clients_q = await db.execute(
        select(Client).where(Client.is_active == True)
        .order_by(Client.razon_social)
        .offset(skip).limit(limit)
    )
    clients = clients_q.scalars().all()

    total_q = await db.execute(
        select(func.count()).select_from(Client).where(Client.is_active == True)
    )
    total = total_q.scalar() or 0

    results = []
    for client in clients:
        # Conexiones
        conn_q = await db.execute(
            select(
                func.count().label("total"),
                func.sum(case((IntegrationConnection.status == "activa", 1), else_=0)).label("active"),
            ).select_from(IntegrationConnection).where(
                IntegrationConnection.client_id == client.id
            )
        )
        conn_row = conn_q.one()

        # Docs hoy
        docs_today_q = await db.execute(
            select(func.count()).select_from(Invoice).where(
                Invoice.client_id == client.id,
                Invoice.fecha_emision >= today_start,
            )
        )
        docs_today = docs_today_q.scalar() or 0

        # Docs mes
        docs_month_q = await db.execute(
            select(func.count()).select_from(Invoice).where(
                Invoice.client_id == client.id,
                Invoice.fecha_emision >= month_start,
            )
        )
        docs_month = docs_month_q.scalar() or 0

        # Errores abiertos
        errors_q = await db.execute(
            select(func.count()).select_from(IntegrationError).where(
                IntegrationError.client_id == client.id,
                IntegrationError.status.in_(["open", "investigating"]),
            )
        )
        errors_open = errors_q.scalar() or 0

        # NC disponibles
        nc_q = await db.execute(
            select(
                func.sum(ControlNumberRange.numero_fin - ControlNumberRange.numero_actual)
            ).where(
                ControlNumberRange.client_id == client.id,
                ControlNumberRange.is_active == True,
            )
        )
        nc_remaining = nc_q.scalar() or 0

        # Última actividad
        last_doc_q = await db.execute(
            select(Invoice.fecha_emision).where(
                Invoice.client_id == client.id
            ).order_by(Invoice.fecha_emision.desc()).limit(1)
        )
        last_activity = last_doc_q.scalar_one_or_none()

        # Determinar salud
        health = "healthy"
        if errors_open > 5 or nc_remaining < 50:
            health = "critical"
        elif errors_open > 0 or nc_remaining < 200:
            health = "degraded"

        results.append({
            "client_id": client.id,
            "client_name": client.razon_social,
            "rif": client.rif,
            "plan": client.plan,
            "connections_count": conn_row.total or 0,
            "active_connections": conn_row.active or 0,
            "health_status": health,
            "documents_today": docs_today,
            "documents_month": docs_month,
            "errors_open": errors_open,
            "control_numbers_remaining": nc_remaining,
            "last_activity": last_activity,
        })

    return {"clients": results, "total": total}


async def run_health_checks(db: AsyncSession) -> dict:
    """Ejecuta health checks en todas las conexiones activas.
    Llamar periódicamente (cada 5 min) desde un task worker.
    """
    from app.services.integrations.connectors import get_connector

    result = await db.execute(
        select(IntegrationConnection).where(
            IntegrationConnection.status == "activa"
        )
    )
    connections = result.scalars().all()

    checked = 0
    issues = 0
    for conn in connections:
        tpl_q = await db.execute(
            select(IntegrationConnection).where(IntegrationConnection.id == conn.id)
        )
        # Obtener template code
        from app.models.integrations import IntegrationTemplate
        tpl_result = await db.execute(
            select(IntegrationTemplate.code).where(IntegrationTemplate.id == conn.template_id)
        )
        tpl_code = tpl_result.scalar_one_or_none() or "api_directa"

        connector = get_connector(conn, tpl_code, db)
        health = await connector.health_check()

        conn.health_status = health["status"]
        conn.last_health_check = datetime.now(timezone.utc)

        if health["status"] == "healthy":
            conn.consecutive_failures = 0
        else:
            conn.consecutive_failures += 1
            issues += 1

        checked += 1

    await db.flush()
    return {"checked": checked, "issues": issues}


async def _get_hourly_metric(db: AsyncSession, metric_name: str, since: datetime) -> list[dict]:
    """Obtiene métricas agrupadas por hora."""
    result = await db.execute(
        select(
            MonitoringMetric.period_start,
            func.sum(MonitoringMetric.metric_value),
        ).where(
            MonitoringMetric.metric_name == metric_name,
            MonitoringMetric.period_start >= since,
        ).group_by(MonitoringMetric.period_start)
        .order_by(MonitoringMetric.period_start)
    )
    rows = result.all()
    return [{"timestamp": row[0], "value": row[1] or 0} for row in rows]


async def _get_hourly_errors(db: AsyncSession, since: datetime) -> list[dict]:
    """Obtiene errores agrupados por hora."""
    # Usar first_seen_at para agrupar errores
    result = await db.execute(
        select(
            func.date_trunc("hour", IntegrationError.first_seen_at).label("hour"),
            func.count().label("count"),
        ).where(
            IntegrationError.first_seen_at >= since,
        ).group_by("hour").order_by("hour")
    )
    rows = result.all()
    return [{"timestamp": row[0], "value": row[1]} for row in rows]


async def _generate_alerts(db: AsyncSession) -> list[dict]:
    """Genera alertas automáticas basadas en el estado del sistema."""
    alerts = []
    now = datetime.now(timezone.utc)

    # Alerta: conexiones caídas
    down_q = await db.execute(
        select(IntegrationConnection, Client.razon_social).join(
            Client, Client.id == IntegrationConnection.client_id
        ).where(
            IntegrationConnection.health_status == "down",
            IntegrationConnection.status == "activa",
        )
    )
    for conn, client_name in down_q.all():
        alerts.append({
            "id": f"conn_down_{conn.id}",
            "severity": "critical" if conn.consecutive_failures > 5 else "high",
            "title": f"Conexión caída: {conn.name}",
            "message": f"Cliente {client_name} - {conn.consecutive_failures} fallos consecutivos",
            "connection_id": conn.id,
            "client_name": client_name,
            "timestamp": conn.last_health_check or now,
        })

    # Alerta: errores críticos sin resolver
    crit_q = await db.execute(
        select(IntegrationError).where(
            IntegrationError.severity == "critical",
            IntegrationError.status == "open",
        ).limit(5)
    )
    for err in crit_q.scalars().all():
        alerts.append({
            "id": f"err_critical_{err.id}",
            "severity": "critical",
            "title": err.title,
            "message": f"Error crítico: {err.message[:100]}",
            "connection_id": err.connection_id,
            "client_name": None,
            "timestamp": err.last_seen_at,
        })

    # Alerta: números de control bajos
    nc_q = await db.execute(
        select(
            ControlNumberRange.client_id,
            Client.razon_social,
            func.sum(ControlNumberRange.numero_fin - ControlNumberRange.numero_actual).label("remaining"),
        ).join(Client, Client.id == ControlNumberRange.client_id)
        .where(ControlNumberRange.is_active == True)
        .group_by(ControlNumberRange.client_id, Client.razon_social)
        .having(func.sum(ControlNumberRange.numero_fin - ControlNumberRange.numero_actual) < 100)
    )
    for client_id, client_name, remaining in nc_q.all():
        sev = "critical" if remaining < 20 else "high"
        alerts.append({
            "id": f"nc_low_{client_id}",
            "severity": sev,
            "title": f"Números de control bajos: {client_name}",
            "message": f"Quedan {remaining} números de control disponibles",
            "connection_id": None,
            "client_name": client_name,
            "timestamp": now,
        })

    return alerts

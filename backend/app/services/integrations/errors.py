"""Servicio de gestión de errores de integración."""
import json
import hashlib
import logging
from datetime import datetime, timezone
from sqlalchemy import select, func, and_, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.integrations import IntegrationError, IntegrationConnection

logger = logging.getLogger(__name__)


async def track_error(
    db: AsyncSession,
    client_id,
    error_code: str,
    category: str,
    title: str,
    message: str,
    severity: str = "medium",
    connection_id=None,
    context: dict | None = None,
    stack_trace: str | None = None,
    is_retryable: bool = True,
) -> IntegrationError:
    """Registra o agrupa un error de integración.
    Agrupa errores similares usando fingerprint para evitar duplicados masivos.
    """
    fingerprint = hashlib.md5(
        f"{client_id}:{connection_id}:{error_code}:{title}".encode()
    ).hexdigest()

    # Buscar error existente abierto con mismo fingerprint
    result = await db.execute(
        select(IntegrationError).where(
            IntegrationError.fingerprint == fingerprint,
            IntegrationError.status.in_(["open", "investigating"]),
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.occurrence_count += 1
        existing.last_seen_at = datetime.now(timezone.utc)
        existing.message = message
        if context:
            existing.context_json = json.dumps(context)
        if severity_rank(severity) > severity_rank(existing.severity):
            existing.severity = severity
        await db.flush()
        return existing

    error = IntegrationError(
        client_id=client_id,
        connection_id=connection_id,
        error_code=error_code,
        category=category,
        severity=severity,
        title=title,
        message=message,
        stack_trace=stack_trace,
        context_json=json.dumps(context) if context else None,
        is_retryable=is_retryable,
        fingerprint=fingerprint,
    )
    db.add(error)
    await db.flush()
    return error


async def list_errors(
    db: AsyncSession,
    client_id=None,
    connection_id=None,
    status: str | None = None,
    category: str | None = None,
    severity: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> dict:
    """Lista errores con filtros."""
    query = select(IntegrationError)
    count_query = select(func.count()).select_from(IntegrationError)

    conditions = []
    if client_id:
        conditions.append(IntegrationError.client_id == client_id)
    if connection_id:
        conditions.append(IntegrationError.connection_id == connection_id)
    if status:
        conditions.append(IntegrationError.status == status)
    if category:
        conditions.append(IntegrationError.category == category)
    if severity:
        conditions.append(IntegrationError.severity == severity)

    if conditions:
        query = query.where(and_(*conditions))
        count_query = count_query.where(and_(*conditions))

    # Conteos adicionales
    open_q = await db.execute(
        select(func.count()).select_from(IntegrationError).where(
            IntegrationError.status.in_(["open", "investigating"]),
            *(conditions[:2] if conditions else []),  # Solo filtros de client/connection
        )
    )
    open_count = open_q.scalar() or 0

    critical_q = await db.execute(
        select(func.count()).select_from(IntegrationError).where(
            IntegrationError.severity == "critical",
            IntegrationError.status.in_(["open", "investigating"]),
            *(conditions[:2] if conditions else []),
        )
    )
    critical_count = critical_q.scalar() or 0

    total_q = await db.execute(count_query)
    total = total_q.scalar() or 0

    result = await db.execute(
        query.order_by(
            IntegrationError.status.asc(),
            IntegrationError.severity.desc(),
            IntegrationError.last_seen_at.desc(),
        ).offset(skip).limit(limit)
    )
    errors = result.scalars().all()

    return {
        "items": [_error_to_dict(e) for e in errors],
        "total": total,
        "open_count": open_count,
        "critical_count": critical_count,
    }


async def resolve_error(
    db: AsyncSession,
    error_id,
    resolved_by,
    resolution_notes: str,
    status: str = "resolved",
) -> IntegrationError | None:
    """Resuelve un error."""
    result = await db.execute(
        select(IntegrationError).where(IntegrationError.id == error_id)
    )
    error = result.scalar_one_or_none()
    if not error:
        return None

    error.status = status
    error.resolved_at = datetime.now(timezone.utc)
    error.resolved_by = resolved_by
    error.resolution_notes = resolution_notes
    await db.flush()
    return error


async def bulk_resolve(
    db: AsyncSession,
    error_ids: list,
    resolved_by,
    resolution_notes: str = "Resuelto en lote",
    status: str = "resolved",
) -> int:
    """Resuelve múltiples errores a la vez."""
    now = datetime.now(timezone.utc)
    result = await db.execute(
        update(IntegrationError).where(
            IntegrationError.id.in_(error_ids),
            IntegrationError.status.in_(["open", "investigating"]),
        ).values(
            status=status,
            resolved_at=now,
            resolved_by=resolved_by,
            resolution_notes=resolution_notes,
        )
    )
    await db.flush()
    return result.rowcount


async def retry_error(db: AsyncSession, error_id) -> IntegrationError | None:
    """Reintenta un error (marca como abierto e incrementa retry_count)."""
    result = await db.execute(
        select(IntegrationError).where(IntegrationError.id == error_id)
    )
    error = result.scalar_one_or_none()
    if not error or not error.is_retryable:
        return None

    if error.retry_count >= error.max_retries:
        return None

    error.retry_count += 1
    error.last_retry_at = datetime.now(timezone.utc)
    error.status = "open"
    await db.flush()
    return error


async def get_error_stats(db: AsyncSession, client_id=None) -> dict:
    """Estadísticas de errores para dashboards."""
    conditions = []
    if client_id:
        conditions.append(IntegrationError.client_id == client_id)

    # Por categoría
    cat_q = await db.execute(
        select(
            IntegrationError.category,
            func.count().label("count"),
        ).where(
            IntegrationError.status.in_(["open", "investigating"]),
            *conditions,
        ).group_by(IntegrationError.category)
    )
    by_category = {row[0]: row[1] for row in cat_q.all()}

    # Por severidad
    sev_q = await db.execute(
        select(
            IntegrationError.severity,
            func.count().label("count"),
        ).where(
            IntegrationError.status.in_(["open", "investigating"]),
            *conditions,
        ).group_by(IntegrationError.severity)
    )
    by_severity = {row[0]: row[1] for row in sev_q.all()}

    # Por error_code (top 10)
    code_q = await db.execute(
        select(
            IntegrationError.error_code,
            IntegrationError.title,
            func.count().label("count"),
            func.sum(IntegrationError.occurrence_count).label("total_occurrences"),
        ).where(
            IntegrationError.status.in_(["open", "investigating"]),
            *conditions,
        ).group_by(
            IntegrationError.error_code, IntegrationError.title
        ).order_by(func.count().desc()).limit(10)
    )
    top_codes = [
        {"code": row[0], "title": row[1], "count": row[2], "occurrences": row[3]}
        for row in code_q.all()
    ]

    return {
        "by_category": by_category,
        "by_severity": by_severity,
        "top_error_codes": top_codes,
    }


def severity_rank(severity: str) -> int:
    return {"low": 0, "medium": 1, "high": 2, "critical": 3}.get(severity, 0)


def _error_to_dict(e: IntegrationError) -> dict:
    return {
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

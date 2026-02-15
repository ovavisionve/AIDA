"""
Servicio de asignación de números de control SENIAT.

Gestiona la asignación secuencial, consecutiva e inalterable de números
de control según Providencia SNAT/2024/000121.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.control_numbers import ControlNumberRange, ControlNumber, ControlNumberAudit


class ControlNumberError(Exception):
    pass


class NoRangeAvailableError(ControlNumberError):
    pass


class RangeExhaustedError(ControlNumberError):
    pass


async def assign_control_number(
    db: AsyncSession,
    client_id: uuid.UUID,
    document_type: str,
    document_id: uuid.UUID,
    user_id: uuid.UUID | None = None,
    ip_address: str | None = None,
) -> str:
    """
    Asigna el próximo número de control disponible al documento.

    Es una operación atómica: usa SELECT FOR UPDATE para evitar
    números duplicados en concurrencia.
    """
    # Buscar rango activo con números disponibles (con lock)
    result = await db.execute(
        select(ControlNumberRange)
        .where(
            ControlNumberRange.client_id == client_id,
            ControlNumberRange.is_active == True,
            ControlNumberRange.numero_actual < ControlNumberRange.numero_fin,
        )
        .order_by(ControlNumberRange.numero_actual)
        .with_for_update()
        .limit(1)
    )
    rango = result.scalar_one_or_none()

    if not rango:
        raise NoRangeAvailableError(
            f"No hay rangos de números de control disponibles para el cliente {client_id}. "
            "Solicite nuevos rangos al administrador."
        )

    # Incrementar el número actual
    siguiente = rango.numero_actual + 1
    rango.numero_actual = siguiente

    # Formatear el número de control
    prefijo = rango.prefijo or ""
    sufijo = rango.sufijo or ""
    serie = rango.serie
    numero_formateado = f"{prefijo}{serie}-{siguiente:08d}{sufijo}"

    # Crear registro del número de control
    control_number = ControlNumber(
        range_id=rango.id,
        client_id=client_id,
        numero_control=numero_formateado,
        numero_secuencial=siguiente,
        document_type=document_type,
        document_id=document_id,
        status="usado",
        asignado_por_user_id=user_id,
        ip_asignacion=ip_address,
    )
    db.add(control_number)

    # Auditoría
    audit = ControlNumberAudit(
        control_number_id=control_number.id,
        action="assigned",
        performed_by_user_id=user_id,
        ip_address=ip_address,
        details=f"Asignado a {document_type} {document_id}",
    )
    db.add(audit)

    # Verificar si el rango está por agotarse (< 20% disponible)
    total_rango = rango.numero_fin - rango.numero_inicio + 1
    disponibles = rango.numero_fin - siguiente
    if total_rango > 0 and (disponibles / total_rango) < 0.20:
        # Marcar para alerta (se puede enviar notificación)
        pass

    # Si se agotó, desactivar el rango
    if siguiente >= rango.numero_fin:
        rango.is_active = False

    await db.flush()

    return numero_formateado


async def void_control_number(
    db: AsyncSession,
    numero_control: str,
    motivo: str,
    user_id: uuid.UUID | None = None,
    ip_address: str | None = None,
) -> ControlNumber:
    """Anula un número de control (cuando se anula el documento)."""
    result = await db.execute(
        select(ControlNumber)
        .where(ControlNumber.numero_control == numero_control)
        .with_for_update()
    )
    cn = result.scalar_one_or_none()

    if not cn:
        raise ControlNumberError(f"Número de control {numero_control} no encontrado")

    if cn.status == "anulado":
        raise ControlNumberError(f"Número de control {numero_control} ya está anulado")

    cn.status = "anulado"
    cn.fecha_anulacion = datetime.now(timezone.utc)
    cn.motivo_anulacion = motivo

    audit = ControlNumberAudit(
        control_number_id=cn.id,
        action="voided",
        performed_by_user_id=user_id,
        ip_address=ip_address,
        details=f"Anulado: {motivo}",
    )
    db.add(audit)
    await db.flush()

    return cn


async def get_available_count(db: AsyncSession, client_id: uuid.UUID) -> dict:
    """Obtiene estadísticas de números de control disponibles para un cliente."""
    result = await db.execute(
        select(ControlNumberRange).where(
            ControlNumberRange.client_id == client_id,
            ControlNumberRange.is_active == True,
        )
    )
    ranges = result.scalars().all()

    total_disponibles = 0
    total_usados = 0
    rangos_info = []

    for r in ranges:
        disponibles = r.numero_fin - r.numero_actual
        usados = r.numero_actual - r.numero_inicio
        total_disponibles += disponibles
        total_usados += usados
        rangos_info.append({
            "serie": r.serie,
            "inicio": r.numero_inicio,
            "fin": r.numero_fin,
            "actual": r.numero_actual,
            "disponibles": disponibles,
            "porcentaje_uso": round(r.porcentaje_uso, 1),
        })

    return {
        "total_disponibles": total_disponibles,
        "total_usados": total_usados,
        "rangos": rangos_info,
    }

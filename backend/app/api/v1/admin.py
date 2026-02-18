"""Portal 6 Admin - Configuración Global, Roles, Auditoría, Números de Control."""
import uuid
import math
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.core.deps import get_current_user, require_permissions, log_audit
from app.core.permissions import (
    P6_SYSTEM_CONFIG, P6_ROLES_MANAGE, P6_AUDIT_VIEW, P6_CLIENTS_VIEW,
    P6_CONTROL_NUMBERS_GLOBAL,
    ALL_PERMISSIONS, DEFAULT_ROLES,
)
from app.models.security import User, Role, Permission, RolePermission, AuditLog
from app.models.config import SystemSetting
from app.models.control_numbers import ControlNumberRange, ControlNumber
from app.models.clients import Client
from pydantic import BaseModel, Field

router = APIRouter()


# --- System Settings ---

class SettingResponse(BaseModel):
    id: uuid.UUID
    key: str
    value: str
    description: str | None
    category: str

    model_config = {"from_attributes": True}


class SettingUpdate(BaseModel):
    value: str


@router.get("/settings", response_model=list[SettingResponse])
async def list_settings(
    category: str | None = None,
    user: User = require_permissions(P6_SYSTEM_CONFIG),
    db: AsyncSession = Depends(get_db),
):
    query = select(SystemSetting)
    if category:
        query = query.where(SystemSetting.category == category)
    query = query.order_by(SystemSetting.category, SystemSetting.key)
    result = await db.execute(query)
    settings = result.scalars().all()

    # Mask sensitive values
    responses = []
    for s in settings:
        resp = SettingResponse.model_validate(s)
        if s.is_sensitive:
            resp.value = "********"
        responses.append(resp)
    return responses


@router.put("/settings/{key}", response_model=SettingResponse)
async def update_setting(
    key: str,
    data: SettingUpdate,
    request: Request,
    user: User = require_permissions(P6_SYSTEM_CONFIG),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(SystemSetting).where(SystemSetting.key == key))
    setting = result.scalar_one_or_none()
    if not setting:
        raise HTTPException(status_code=404, detail="Configuración no encontrada")

    old_value = setting.value
    setting.value = data.value
    await db.flush()

    await log_audit(
        db, user.id, "update", "system_setting", key,
        details=f"changed from '{old_value}' to '{data.value}'" if not setting.is_sensitive else "value changed",
        request=request,
    )

    return SettingResponse.model_validate(setting)


# --- Roles ---

class RoleResponse(BaseModel):
    id: uuid.UUID
    name: str
    display_name: str
    description: str | None
    level: str
    is_system: bool

    model_config = {"from_attributes": True}


class PermissionResponse(BaseModel):
    code: str
    name: str
    module: str
    category: str

    model_config = {"from_attributes": True}


@router.get("/roles", response_model=list[RoleResponse])
async def list_roles(
    level: str | None = None,
    user: User = require_permissions(P6_ROLES_MANAGE),
    db: AsyncSession = Depends(get_db),
):
    query = select(Role)
    if level:
        query = query.where(Role.level == level)
    result = await db.execute(query.order_by(Role.level, Role.name))
    return [RoleResponse.model_validate(r) for r in result.scalars().all()]


@router.get("/roles/{role_id}/permissions", response_model=list[PermissionResponse])
async def get_role_permissions(
    role_id: uuid.UUID,
    user: User = require_permissions(P6_ROLES_MANAGE),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Permission)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .where(RolePermission.role_id == role_id)
    )
    return [PermissionResponse.model_validate(p) for p in result.scalars().all()]


@router.get("/permissions", response_model=list[PermissionResponse])
async def list_permissions(
    module: str | None = None,
    user: User = require_permissions(P6_ROLES_MANAGE),
    db: AsyncSession = Depends(get_db),
):
    query = select(Permission)
    if module:
        query = query.where(Permission.module == module)
    result = await db.execute(query.order_by(Permission.module, Permission.category, Permission.code))
    return [PermissionResponse.model_validate(p) for p in result.scalars().all()]


# --- Seed roles and permissions ---

@router.post("/seed")
async def seed_roles_and_permissions(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Seed default roles and permissions. Only super admin can do this."""
    if not user.is_superadmin:
        raise HTTPException(status_code=403, detail="Solo super admin puede ejecutar seed")

    # Create permissions
    created_perms = 0
    for code, (name, module, category) in ALL_PERMISSIONS.items():
        existing = await db.execute(select(Permission).where(Permission.code == code))
        if not existing.scalar_one_or_none():
            db.add(Permission(code=code, name=name, module=module, category=category))
            created_perms += 1
    await db.flush()

    # Create roles
    created_roles = 0
    for role_name, role_data in DEFAULT_ROLES.items():
        existing = await db.execute(select(Role).where(Role.name == role_name))
        if not existing.scalar_one_or_none():
            role = Role(
                name=role_name,
                display_name=role_data["display_name"],
                description=role_data["description"],
                level=role_data["level"],
                is_system=True,
            )
            db.add(role)
            await db.flush()

            # Assign permissions to role
            for perm_code in role_data["permissions"]:
                perm_result = await db.execute(select(Permission).where(Permission.code == perm_code))
                perm = perm_result.scalar_one_or_none()
                if perm:
                    db.add(RolePermission(role_id=role.id, permission_id=perm.id))
            created_roles += 1

    await db.flush()
    await log_audit(db, user.id, "seed", "system", details=f"roles={created_roles}, perms={created_perms}", request=request)

    return {
        "message": "Seed completado",
        "permissions_created": created_perms,
        "roles_created": created_roles,
    }


# --- Audit Logs ---

class AuditLogResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID | None
    action: str
    resource_type: str
    resource_id: str | None
    details: str | None
    ip_address: str | None
    timestamp: datetime

    model_config = {"from_attributes": True}


class AuditLogListResponse(BaseModel):
    items: list[AuditLogResponse]
    total: int
    page: int
    page_size: int


@router.get("/audit-logs", response_model=AuditLogListResponse)
async def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    action: str | None = None,
    resource_type: str | None = None,
    user_id: uuid.UUID | None = None,
    user: User = require_permissions(P6_AUDIT_VIEW),
    db: AsyncSession = Depends(get_db),
):
    query = select(AuditLog)
    if action:
        query = query.where(AuditLog.action == action)
    if resource_type:
        query = query.where(AuditLog.resource_type == resource_type)
    if user_id:
        query = query.where(AuditLog.user_id == user_id)

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    query = query.order_by(AuditLog.timestamp.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    logs = result.scalars().all()

    return AuditLogListResponse(
        items=[AuditLogResponse.model_validate(log) for log in logs],
        total=total,
        page=page,
        page_size=page_size,
    )


# --- Dashboard Admin ---

class AdminDashboardResponse(BaseModel):
    total_clients: int
    active_clients: int
    total_users: int
    total_documents_today: int
    total_documents_month: int
    alerts: list[str]


@router.get("/dashboard", response_model=AdminDashboardResponse)
async def admin_dashboard(
    user: User = require_permissions(P6_CLIENTS_VIEW),
    db: AsyncSession = Depends(get_db),
):
    from datetime import datetime, timezone, timedelta
    from app.models.clients import Client
    from app.models.documents import Invoice

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    total_clients = (await db.execute(select(func.count(Client.id)))).scalar() or 0
    active_clients = (await db.execute(
        select(func.count(Client.id)).where(Client.is_active == True)
    )).scalar() or 0
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    docs_today = (await db.execute(
        select(func.count(Invoice.id)).where(Invoice.fecha_emision >= today_start)
    )).scalar() or 0
    docs_month = (await db.execute(
        select(func.count(Invoice.id)).where(Invoice.fecha_emision >= month_start)
    )).scalar() or 0

    alerts = []
    if active_clients == 0:
        alerts.append("No hay clientes activos en el sistema")

    return AdminDashboardResponse(
        total_clients=total_clients,
        active_clients=active_clients,
        total_users=total_users,
        total_documents_today=docs_today,
        total_documents_month=docs_month,
        alerts=alerts,
    )


# --- Control Number Ranges (Números de Control) ---

class ControlNumberRangeResponse(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    client_name: str | None = None
    client_rif: str | None = None
    serie: str
    numero_inicio: int
    numero_fin: int
    numero_actual: int
    prefijo: str | None
    sufijo: str | None
    is_active: bool
    fecha_asignacion: datetime
    fecha_vencimiento: datetime | None
    autorizacion_seniat: str | None
    notas: str | None
    numeros_disponibles: int
    porcentaje_uso: float


class ControlNumberRangeListResponse(BaseModel):
    items: list[ControlNumberRangeResponse]
    total: int
    page: int
    pages: int


class CreateControlNumberRangeRequest(BaseModel):
    client_id: uuid.UUID
    serie: str = Field(max_length=10)
    numero_inicio: int = Field(ge=1)
    numero_fin: int = Field(ge=1)
    prefijo: str | None = Field(default=None, max_length=10)
    sufijo: str | None = Field(default=None, max_length=10)
    autorizacion_seniat: str | None = Field(default=None, max_length=100)
    fecha_vencimiento: datetime | None = None
    notas: str | None = None


class UpdateControlNumberRangeRequest(BaseModel):
    is_active: bool | None = None
    autorizacion_seniat: str | None = None
    fecha_vencimiento: datetime | None = None
    notas: str | None = None


@router.get("/control-numbers/ranges", response_model=ControlNumberRangeListResponse)
async def list_control_number_ranges(
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    client_id: uuid.UUID | None = None,
    is_active: bool | None = None,
    user: User = require_permissions(P6_CONTROL_NUMBERS_GLOBAL),
    db: AsyncSession = Depends(get_db),
):
    """List all control number ranges, optionally filtered by client."""
    query = select(ControlNumberRange)
    if client_id:
        query = query.where(ControlNumberRange.client_id == client_id)
    if is_active is not None:
        query = query.where(ControlNumberRange.is_active == is_active)

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0
    total_pages = math.ceil(total / page_size) if total > 0 else 0

    query = query.order_by(ControlNumberRange.fecha_asignacion.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    ranges = result.scalars().all()

    # Fetch client names for display
    client_ids = {r.client_id for r in ranges}
    clients_map: dict[uuid.UUID, Client] = {}
    if client_ids:
        clients_result = await db.execute(
            select(Client).where(Client.id.in_(client_ids))
        )
        for c in clients_result.scalars().all():
            clients_map[c.id] = c

    items = []
    for r in ranges:
        client = clients_map.get(r.client_id)
        items.append(ControlNumberRangeResponse(
            id=r.id,
            client_id=r.client_id,
            client_name=client.razon_social if client else None,
            client_rif=client.rif if client else None,
            serie=r.serie,
            numero_inicio=r.numero_inicio,
            numero_fin=r.numero_fin,
            numero_actual=r.numero_actual,
            prefijo=r.prefijo,
            sufijo=r.sufijo,
            is_active=r.is_active,
            fecha_asignacion=r.fecha_asignacion,
            fecha_vencimiento=r.fecha_vencimiento,
            autorizacion_seniat=r.autorizacion_seniat,
            notas=r.notas,
            numeros_disponibles=r.numeros_disponibles,
            porcentaje_uso=round(r.porcentaje_uso, 1),
        ))

    return ControlNumberRangeListResponse(
        items=items, total=total, page=page, pages=total_pages,
    )


@router.post("/control-numbers/ranges", response_model=ControlNumberRangeResponse, status_code=201)
async def create_control_number_range(
    data: CreateControlNumberRangeRequest,
    request: Request,
    user: User = require_permissions(P6_CONTROL_NUMBERS_GLOBAL),
    db: AsyncSession = Depends(get_db),
):
    """Create a new control number range for a client."""
    if data.numero_fin <= data.numero_inicio:
        raise HTTPException(status_code=400, detail="numero_fin debe ser mayor que numero_inicio")

    # Verify client exists
    client_result = await db.execute(select(Client).where(Client.id == data.client_id))
    client = client_result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    # Check for overlapping ranges on same client + serie
    overlap = await db.execute(
        select(ControlNumberRange).where(
            ControlNumberRange.client_id == data.client_id,
            ControlNumberRange.serie == data.serie,
            ControlNumberRange.numero_inicio <= data.numero_fin,
            ControlNumberRange.numero_fin >= data.numero_inicio,
        )
    )
    if overlap.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail=f"Ya existe un rango que se superpone con {data.serie} {data.numero_inicio}-{data.numero_fin} para este cliente",
        )

    rango = ControlNumberRange(
        client_id=data.client_id,
        serie=data.serie,
        numero_inicio=data.numero_inicio,
        numero_fin=data.numero_fin,
        numero_actual=data.numero_inicio,
        prefijo=data.prefijo,
        sufijo=data.sufijo,
        is_active=True,
        fecha_asignacion=datetime.now(timezone.utc),
        fecha_vencimiento=data.fecha_vencimiento,
        autorizacion_seniat=data.autorizacion_seniat,
        notas=data.notas,
    )
    db.add(rango)
    await db.flush()

    await log_audit(
        db, user.id, "create", "control_number_range", str(rango.id),
        details=f"Rango {data.serie} {data.numero_inicio}-{data.numero_fin} para {client.razon_social} ({client.rif})",
        request=request,
    )

    return ControlNumberRangeResponse(
        id=rango.id,
        client_id=rango.client_id,
        client_name=client.razon_social,
        client_rif=client.rif,
        serie=rango.serie,
        numero_inicio=rango.numero_inicio,
        numero_fin=rango.numero_fin,
        numero_actual=rango.numero_actual,
        prefijo=rango.prefijo,
        sufijo=rango.sufijo,
        is_active=rango.is_active,
        fecha_asignacion=rango.fecha_asignacion,
        fecha_vencimiento=rango.fecha_vencimiento,
        autorizacion_seniat=rango.autorizacion_seniat,
        notas=rango.notas,
        numeros_disponibles=rango.numeros_disponibles,
        porcentaje_uso=round(rango.porcentaje_uso, 1),
    )


@router.put("/control-numbers/ranges/{range_id}", response_model=ControlNumberRangeResponse)
async def update_control_number_range(
    range_id: uuid.UUID,
    data: UpdateControlNumberRangeRequest,
    request: Request,
    user: User = require_permissions(P6_CONTROL_NUMBERS_GLOBAL),
    db: AsyncSession = Depends(get_db),
):
    """Update a control number range (activate/deactivate, notes, etc.)."""
    result = await db.execute(
        select(ControlNumberRange).where(ControlNumberRange.id == range_id)
    )
    rango = result.scalar_one_or_none()
    if not rango:
        raise HTTPException(status_code=404, detail="Rango no encontrado")

    changes = []
    if data.is_active is not None and data.is_active != rango.is_active:
        rango.is_active = data.is_active
        changes.append(f"is_active={data.is_active}")
    if data.autorizacion_seniat is not None:
        rango.autorizacion_seniat = data.autorizacion_seniat
        changes.append("autorizacion_seniat actualizada")
    if data.fecha_vencimiento is not None:
        rango.fecha_vencimiento = data.fecha_vencimiento
        changes.append("fecha_vencimiento actualizada")
    if data.notas is not None:
        rango.notas = data.notas
        changes.append("notas actualizadas")

    if changes:
        await db.flush()
        await log_audit(
            db, user.id, "update", "control_number_range", str(range_id),
            details=", ".join(changes),
            request=request,
        )

    # Fetch client for response
    client_result = await db.execute(select(Client).where(Client.id == rango.client_id))
    client = client_result.scalar_one_or_none()

    return ControlNumberRangeResponse(
        id=rango.id,
        client_id=rango.client_id,
        client_name=client.razon_social if client else None,
        client_rif=client.rif if client else None,
        serie=rango.serie,
        numero_inicio=rango.numero_inicio,
        numero_fin=rango.numero_fin,
        numero_actual=rango.numero_actual,
        prefijo=rango.prefijo,
        sufijo=rango.sufijo,
        is_active=rango.is_active,
        fecha_asignacion=rango.fecha_asignacion,
        fecha_vencimiento=rango.fecha_vencimiento,
        autorizacion_seniat=rango.autorizacion_seniat,
        notas=rango.notas,
        numeros_disponibles=rango.numeros_disponibles,
        porcentaje_uso=round(rango.porcentaje_uso, 1),
    )


@router.get("/control-numbers/stats")
async def control_numbers_stats(
    user: User = require_permissions(P6_CONTROL_NUMBERS_GLOBAL),
    db: AsyncSession = Depends(get_db),
):
    """Global stats for all control number ranges."""
    total_ranges = (await db.execute(
        select(func.count(ControlNumberRange.id))
    )).scalar() or 0
    active_ranges = (await db.execute(
        select(func.count(ControlNumberRange.id)).where(ControlNumberRange.is_active == True)
    )).scalar() or 0
    total_used = (await db.execute(
        select(func.count(ControlNumber.id))
    )).scalar() or 0
    total_voided = (await db.execute(
        select(func.count(ControlNumber.id)).where(ControlNumber.status == "anulado")
    )).scalar() or 0

    # Ranges with low stock (< 20% available)
    all_active = await db.execute(
        select(ControlNumberRange).where(ControlNumberRange.is_active == True)
    )
    low_stock = []
    for r in all_active.scalars().all():
        total = r.numero_fin - r.numero_inicio + 1
        disponibles = r.numero_fin - r.numero_actual
        if total > 0 and (disponibles / total) < 0.20:
            # Fetch client name
            c = (await db.execute(select(Client).where(Client.id == r.client_id))).scalar_one_or_none()
            low_stock.append({
                "range_id": str(r.id),
                "client_name": c.razon_social if c else "Desconocido",
                "serie": r.serie,
                "disponibles": disponibles,
                "porcentaje_uso": round(r.porcentaje_uso, 1),
            })

    return {
        "total_ranges": total_ranges,
        "active_ranges": active_ranges,
        "total_numbers_used": total_used,
        "total_numbers_voided": total_voided,
        "low_stock_ranges": low_stock,
    }

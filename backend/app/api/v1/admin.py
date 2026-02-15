"""Portal 6 Admin - Configuración Global, Roles, Auditoría."""
import uuid
import math
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.core.deps import get_current_user, require_permissions, log_audit
from app.core.permissions import (
    P6_SYSTEM_CONFIG, P6_ROLES_MANAGE, P6_AUDIT_VIEW,
    ALL_PERMISSIONS, DEFAULT_ROLES,
)
from app.models.security import User, Role, Permission, RolePermission, AuditLog
from app.models.config import SystemSetting
from pydantic import BaseModel

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
    timestamp: str

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

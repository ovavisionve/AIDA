"""Portal 6 Admin - Gestión de Usuarios."""
import uuid
import math
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.database import get_db
from app.core.security import hash_password
from app.core.deps import get_current_user, log_audit, require_permissions
from app.core.permissions import P6_USERS_VIEW, P6_USERS_CREATE, P6_USERS_EDIT, P6_USERS_DELETE
from app.models.security import User, Role, UserRole
from app.models.clients import Client, ClientUser
from app.schemas.users import UserCreate, UserUpdate, UserResponse, UserListResponse, AssignRoleRequest

router = APIRouter()


class ClientInfo(BaseModel):
    id: uuid.UUID
    rif: str
    razon_social: str
    nombre_comercial: str | None
    plan: str
    is_active: bool

    model_config = {"from_attributes": True}


class UserProfileResponse(BaseModel):
    id: uuid.UUID
    email: str
    first_name: str
    last_name: str
    phone: str | None
    is_active: bool
    is_superadmin: bool
    is_verified: bool
    totp_enabled: bool
    language: str
    timezone: str
    theme: str
    roles: list[str]
    client: ClientInfo | None

    model_config = {"from_attributes": True}


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    user: User = Depends(get_current_user),
):
    """Retorna el perfil del usuario autenticado."""
    return UserResponse.model_validate(user)


@router.get("/me/profile", response_model=UserProfileResponse)
async def get_current_user_full_profile(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retorna el perfil completo del usuario con info de cliente y roles."""
    # Get user roles
    role_result = await db.execute(
        select(Role.display_name)
        .join(UserRole, UserRole.role_id == Role.id)
        .where(UserRole.user_id == user.id)
    )
    roles = [row[0] for row in role_result.all()]

    # Get primary client
    cu_result = await db.execute(
        select(Client)
        .join(ClientUser, ClientUser.client_id == Client.id)
        .where(ClientUser.user_id == user.id, ClientUser.is_active == True)
        .order_by(ClientUser.is_primary.desc())
        .limit(1)
    )
    client = cu_result.scalar_one_or_none()

    return UserProfileResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone,
        is_active=user.is_active,
        is_superadmin=user.is_superadmin,
        is_verified=user.is_verified,
        totp_enabled=user.totp_enabled,
        language=user.language,
        timezone=user.timezone,
        theme=user.theme,
        roles=roles,
        client=ClientInfo.model_validate(client) if client else None,
    )


@router.get("", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    is_active: bool | None = None,
    client_id: uuid.UUID | None = None,
    user: User = require_permissions(P6_USERS_VIEW),
    db: AsyncSession = Depends(get_db),
):
    query = select(User)

    if search:
        query = query.where(
            or_(
                User.email.ilike(f"%{search}%"),
                User.first_name.ilike(f"%{search}%"),
                User.last_name.ilike(f"%{search}%"),
            )
        )
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    if client_id:
        query = query.join(ClientUser, ClientUser.user_id == User.id).where(
            ClientUser.client_id == client_id
        )

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    query = query.order_by(User.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    users = result.scalars().all()

    return UserListResponse(
        items=[UserResponse.model_validate(u) for u in users],
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size) if total > 0 else 0,
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: uuid.UUID,
    current_user: User = require_permissions(P6_USERS_VIEW),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return UserResponse.model_validate(user)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    data: UserCreate,
    request: Request,
    current_user: User = require_permissions(P6_USERS_CREATE),
    db: AsyncSession = Depends(get_db),
):
    # Check duplicates
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Ya existe un usuario con este email")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
        is_active=data.is_active,
    )
    db.add(user)
    await db.flush()

    # Assign role if provided
    if data.role_name:
        role_result = await db.execute(select(Role).where(Role.name == data.role_name))
        role = role_result.scalar_one_or_none()
        if role:
            user_role = UserRole(user_id=user.id, role_id=role.id, client_id=data.client_id, assigned_by=current_user.id)
            db.add(user_role)

    # Associate with client if provided
    if data.client_id:
        client_user = ClientUser(client_id=data.client_id, user_id=user.id, is_primary=True)
        db.add(client_user)

    await db.flush()
    await db.refresh(user)

    await log_audit(db, current_user.id, "create", "user", str(user.id), request=request)

    return UserResponse.model_validate(user)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    data: UserUpdate,
    request: Request,
    current_user: User = require_permissions(P6_USERS_EDIT),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    await db.flush()
    await db.refresh(user)

    await log_audit(
        db, current_user.id, "update", "user", str(user.id),
        details=str(update_data), request=request,
    )

    return UserResponse.model_validate(user)


@router.delete("/{user_id}")
async def delete_user(
    user_id: uuid.UUID,
    request: Request,
    current_user: User = require_permissions(P6_USERS_DELETE),
    db: AsyncSession = Depends(get_db),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puede eliminarse a sí mismo")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user.is_active = False
    await log_audit(db, current_user.id, "deactivate", "user", str(user.id), request=request)

    return {"message": "Usuario desactivado exitosamente"}


@router.post("/{user_id}/roles")
async def assign_role(
    user_id: uuid.UUID,
    data: AssignRoleRequest,
    request: Request,
    current_user: User = require_permissions(P6_USERS_EDIT),
    db: AsyncSession = Depends(get_db),
):
    # Verify user exists
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Find role
    role_result = await db.execute(select(Role).where(Role.name == data.role_name))
    role = role_result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Rol no encontrado")

    # Check if already assigned
    existing = await db.execute(
        select(UserRole).where(
            UserRole.user_id == user_id,
            UserRole.role_id == role.id,
            UserRole.client_id == data.client_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="El usuario ya tiene este rol asignado")

    user_role = UserRole(
        user_id=user_id,
        role_id=role.id,
        client_id=data.client_id,
        assigned_by=current_user.id,
    )
    db.add(user_role)
    await db.flush()

    await log_audit(
        db, current_user.id, "assign_role", "user_role",
        str(user_id), details=f"role={data.role_name}", request=request,
    )

    return {"message": f"Rol '{role.display_name}' asignado exitosamente"}


@router.delete("/{user_id}/roles/{role_name}")
async def remove_role(
    user_id: uuid.UUID,
    role_name: str,
    client_id: uuid.UUID | None = None,
    request: Request = None,
    current_user: User = require_permissions(P6_USERS_EDIT),
    db: AsyncSession = Depends(get_db),
):
    role_result = await db.execute(select(Role).where(Role.name == role_name))
    role = role_result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Rol no encontrado")

    query = select(UserRole).where(UserRole.user_id == user_id, UserRole.role_id == role.id)
    if client_id:
        query = query.where(UserRole.client_id == client_id)
    result = await db.execute(query)
    user_role = result.scalar_one_or_none()
    if not user_role:
        raise HTTPException(status_code=404, detail="Asignación de rol no encontrada")

    await db.delete(user_role)

    await log_audit(
        db, current_user.id, "remove_role", "user_role",
        str(user_id), details=f"role={role_name}", request=request,
    )

    return {"message": f"Rol '{role.display_name}' removido exitosamente"}

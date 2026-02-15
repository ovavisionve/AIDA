"""Dependencias de FastAPI para inyección (auth, permisos, DB)."""
import uuid
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.core.security import decode_token
from app.models.security import User, UserRole, RolePermission

security_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
        )
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuario desactivado")
    if user.locked_until:
        from datetime import datetime, timezone
        if user.locked_until > datetime.now(timezone.utc):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cuenta bloqueada temporalmente")

    return user


async def get_current_active_user(
    user: User = Depends(get_current_user),
) -> User:
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuario inactivo")
    return user


async def get_user_permissions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> set[str]:
    """Obtiene todos los permisos del usuario a través de sus roles."""
    if user.is_superadmin:
        from app.core.permissions import ALL_PERMISSIONS
        return set(ALL_PERMISSIONS.keys())

    query = (
        select(RolePermission)
        .join(UserRole, UserRole.role_id == RolePermission.role_id)
        .where(UserRole.user_id == user.id)
        .options(selectinload(RolePermission.permission))
    )
    result = await db.execute(query)
    role_permissions = result.scalars().all()
    return {rp.permission.code for rp in role_permissions}


class PermissionChecker:
    """Dependency para verificar permisos específicos."""

    def __init__(self, required_permissions: list[str], require_all: bool = True):
        self.required_permissions = required_permissions
        self.require_all = require_all

    async def __call__(
        self,
        user: User = Depends(get_current_user),
        user_permissions: set[str] = Depends(get_user_permissions),
    ) -> User:
        if user.is_superadmin:
            return user

        if self.require_all:
            missing = set(self.required_permissions) - user_permissions
            if missing:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permisos insuficientes. Faltan: {', '.join(missing)}",
                )
        else:
            if not set(self.required_permissions) & user_permissions:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tiene ninguno de los permisos requeridos",
                )
        return user


def require_permissions(*permissions: str, require_all: bool = True):
    """Shortcut para crear un PermissionChecker."""
    return Depends(PermissionChecker(list(permissions), require_all))


async def get_client_id_from_token(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> uuid.UUID | None:
    """Extrae el client_id del token JWT si existe."""
    payload = decode_token(credentials.credentials)
    if payload and "client_id" in payload:
        return uuid.UUID(payload["client_id"])
    return None


async def log_audit(
    db: AsyncSession,
    user_id: uuid.UUID | None,
    action: str,
    resource_type: str,
    resource_id: str | None = None,
    details: str | None = None,
    request: Request | None = None,
    client_id: uuid.UUID | None = None,
):
    """Registra una acción en el log de auditoría."""
    from app.models.security import AuditLog
    log = AuditLog(
        user_id=user_id,
        client_id=client_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=request.client.host if request and request.client else None,
        user_agent=request.headers.get("user-agent") if request else None,
    )
    db.add(log)
    await db.flush()

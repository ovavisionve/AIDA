import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.core.security import (
    verify_password, hash_password, hash_token, create_access_token,
    create_refresh_token, decode_token, generate_totp_secret, get_totp_uri,
    verify_totp, generate_qr_code_base64,
)
from app.core.deps import get_current_user, log_audit
from app.models.security import User, Session, UserRole, RolePermission
from app.schemas.auth import (
    LoginRequest, LoginResponse, UserInfo, RefreshTokenRequest,
    Setup2FAResponse, Verify2FARequest, ChangePasswordRequest, RegisterRequest,
)
from app.config import get_settings

router = APIRouter()
settings = get_settings()

MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_MINUTES = 30


@router.post("/register")
async def register(
    data: RegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Registro público de usuario.

    Si no existe ningún usuario en el sistema, el primero será superadmin.
    Los demás se crean como usuarios normales (requiere activación por admin).
    """
    # Check if email already taken
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    # First user ever? Make them superadmin automatically
    count = (await db.execute(select(func.count(User.id)))).scalar() or 0
    is_first_user = count == 0

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
        is_active=True,
        is_superadmin=is_first_user,
        is_verified=is_first_user,
    )
    db.add(user)
    await db.flush()

    await log_audit(db, user.id, "register", "auth", str(user.id), request=request)

    return {
        "id": str(user.id),
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "is_superadmin": user.is_superadmin,
        "message": "Usuario registrado exitosamente" + (
            ". Como primer usuario, tiene permisos de super administrador." if is_first_user else ""
        ),
    }


@router.post("/login", response_model=LoginResponse)
async def login(
    data: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")

    # Check lockout
    if user.locked_until and user.locked_until > datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cuenta bloqueada temporalmente. Intente más tarde.",
        )

    if not verify_password(data.password, user.hashed_password):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= MAX_LOGIN_ATTEMPTS:
            user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES)
        await db.flush()
        await log_audit(db, user.id, "login_failed", "auth", request=request)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cuenta desactivada")

    # Check 2FA
    if user.totp_enabled:
        if not data.totp_code:
            return LoginResponse(
                access_token="",
                refresh_token="",
                user=UserInfo.model_validate(user),
                requires_2fa=True,
            )
        if not verify_totp(user.totp_secret, data.totp_code):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Código 2FA inválido")

    # Get user permissions through roles
    query = (
        select(RolePermission)
        .join(UserRole, UserRole.role_id == RolePermission.role_id)
        .where(UserRole.user_id == user.id)
    )
    result = await db.execute(query)
    role_perms = result.scalars().all()
    perm_ids = [str(rp.permission_id) for rp in role_perms]

    # Generate tokens
    access_token = create_access_token(user.id, permissions=perm_ids[:50])
    refresh_token = create_refresh_token(user.id)

    # Save session
    session = Session(
        user_id=user.id,
        refresh_token_hash=hash_token(refresh_token),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(session)

    # Update user
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login = datetime.now(timezone.utc)
    user.last_login_ip = request.client.host if request.client else None

    await log_audit(db, user.id, "login_success", "auth", request=request)

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserInfo.model_validate(user),
    )


@router.post("/refresh", response_model=LoginResponse)
async def refresh_token(
    data: RefreshTokenRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token inválido")

    user_id = uuid.UUID(payload["sub"])
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no válido")

    access_token = create_access_token(user.id)
    new_refresh = create_refresh_token(user.id)

    return LoginResponse(
        access_token=access_token,
        refresh_token=new_refresh,
        user=UserInfo.model_validate(user),
    )


@router.post("/logout")
async def logout(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Revoke all sessions for user
    result = await db.execute(
        select(Session).where(Session.user_id == user.id, Session.is_revoked == False)
    )
    sessions = result.scalars().all()
    for session in sessions:
        session.is_revoked = True

    await log_audit(db, user.id, "logout", "auth", request=request)
    return {"message": "Sesión cerrada exitosamente"}


@router.post("/2fa/setup", response_model=Setup2FAResponse)
async def setup_2fa(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.totp_enabled:
        raise HTTPException(status_code=400, detail="2FA ya está habilitado")

    secret = generate_totp_secret()
    uri = get_totp_uri(secret, user.email)
    qr = generate_qr_code_base64(uri)

    user.totp_secret = secret
    await db.flush()

    return Setup2FAResponse(secret=secret, qr_code_base64=qr, uri=uri)


@router.post("/2fa/verify")
async def verify_2fa(
    data: Verify2FARequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user.totp_secret:
        raise HTTPException(status_code=400, detail="Primero debe configurar 2FA")

    if not verify_totp(user.totp_secret, data.totp_code):
        raise HTTPException(status_code=400, detail="Código inválido")

    user.totp_enabled = True
    await db.flush()
    return {"message": "2FA habilitado exitosamente"}


@router.post("/2fa/disable")
async def disable_2fa(
    data: Verify2FARequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user.totp_enabled:
        raise HTTPException(status_code=400, detail="2FA no está habilitado")

    if not verify_totp(user.totp_secret, data.totp_code):
        raise HTTPException(status_code=400, detail="Código inválido")

    user.totp_enabled = False
    user.totp_secret = None
    await db.flush()
    return {"message": "2FA deshabilitado"}


@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(data.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")

    user.hashed_password = hash_password(data.new_password)
    await db.flush()
    return {"message": "Contraseña actualizada exitosamente"}

"""
Servicio de onboarding rápido de clientes.

Crea un cliente completo a partir de un template: cuenta, usuarios,
rangos de números de control, API keys, y toda la configuración
necesaria para que pueda emitir documentos de inmediato.

La idea: el primer cliente toma algo de tiempo configurar.
Del segundo en adelante, es prácticamente automático.
"""
import uuid
import secrets
import hashlib
from datetime import date, datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.security import User, Role, UserRole
from app.models.clients import Client, ClientUser, ClientSetting
from app.models.control_numbers import ControlNumberRange
from app.schemas.fiscal import ClientTemplateConfig, OnboardingResponse


# Planes con sus límites
PLAN_LIMITS = {
    "basico": {"docs": 100, "users": 1, "storage": 5},
    "profesional": {"docs": 500, "users": 5, "storage": 20},
    "empresarial": {"docs": 99999, "users": 99, "storage": 100},
    "enterprise": {"docs": 99999, "users": 999, "storage": 500},
}

# Rango inicial de números de control por defecto
DEFAULT_CONTROL_RANGE_SIZE = 1000


async def onboard_client(
    db: AsyncSession,
    config: ClientTemplateConfig,
    admin_user_id: uuid.UUID | None = None,
    initial_range_start: int = 1,
    initial_range_size: int = DEFAULT_CONTROL_RANGE_SIZE,
) -> OnboardingResponse:
    """
    Crea un cliente completo listo para facturar.

    Pasos:
    1. Crear cuenta del cliente
    2. Generar API key y secret
    3. Crear usuario admin del cliente
    4. Asignar rol client_admin
    5. Crear rango de números de control
    6. Configurar series de documentos
    7. Devolver credenciales y configuración
    """
    # 1. Verificar que no exista
    existing = await db.execute(select(Client).where(Client.rif == config.rif))
    if existing.scalar_one_or_none():
        raise ValueError(f"Ya existe un cliente con RIF {config.rif}")

    limits = PLAN_LIMITS.get(config.plan, PLAN_LIMITS["basico"])

    client = Client(
        rif=config.rif,
        razon_social=config.razon_social,
        direccion_fiscal=config.direccion_fiscal,
        telefono_principal=config.telefono,
        email_principal=config.email,
        plan=config.plan,
        fecha_inicio=date.today(),
        max_documentos_mes=limits["docs"],
        max_usuarios=limits["users"],
        max_almacenamiento_gb=limits["storage"],
        is_active=True,
    )
    db.add(client)
    await db.flush()

    # 2. Generar API credentials
    api_key = f"aida_{config.rif.replace('-', '')}_{secrets.token_hex(16)}"
    api_secret = secrets.token_hex(32)
    api_secret_hash = hashlib.sha256(api_secret.encode()).hexdigest()

    # Guardar como settings del cliente
    settings_to_create = [
        ("api_key", api_key, "API Key para integraciones"),
        ("api_secret_hash", api_secret_hash, "Hash del API Secret"),
        ("series.facturas", config.series_facturas, "Serie para facturas"),
        ("series.notas_credito", config.series_nc, "Serie para notas de crédito"),
        ("series.notas_debito", config.series_nd, "Serie para notas de débito"),
        ("tipo_sistema", config.tipo_sistema, "Tipo de sistema del cliente"),
        ("webhook_url", "", "URL para webhooks"),
        ("webhook_secret", secrets.token_hex(16), "Secret para validar webhooks"),
    ]

    for key, value, desc in settings_to_create:
        db.add(ClientSetting(client_id=client.id, key=key, value=value, description=desc))

    # 3. Crear usuario admin
    password = config.admin_password or secrets.token_urlsafe(12)
    admin_user_result = await db.execute(select(User).where(User.email == config.admin_email))
    admin_user = admin_user_result.scalar_one_or_none()

    if not admin_user:
        admin_user = User(
            email=config.admin_email,
            hashed_password=hash_password(password),
            first_name=config.admin_nombre.split()[0] if " " in config.admin_nombre else config.admin_nombre,
            last_name=config.admin_nombre.split()[-1] if " " in config.admin_nombre else "",
            is_active=True,
            is_verified=True,
        )
        db.add(admin_user)
        await db.flush()

    # 4. Asociar usuario al cliente
    db.add(ClientUser(client_id=client.id, user_id=admin_user.id, is_primary=True))

    # 5. Asignar rol client_admin
    role_result = await db.execute(select(Role).where(Role.name == "client_admin"))
    role = role_result.scalar_one_or_none()
    if role:
        # Check if already has this role for this client
        existing_role = await db.execute(
            select(UserRole).where(
                UserRole.user_id == admin_user.id,
                UserRole.role_id == role.id,
                UserRole.client_id == client.id,
            )
        )
        if not existing_role.scalar_one_or_none():
            db.add(UserRole(
                user_id=admin_user.id,
                role_id=role.id,
                client_id=client.id,
                assigned_by=admin_user_id,
            ))

    # 6. Crear rango de números de control
    rango = ControlNumberRange(
        client_id=client.id,
        serie=config.series_facturas,
        numero_inicio=initial_range_start,
        numero_fin=initial_range_start + initial_range_size - 1,
        numero_actual=initial_range_start,
        is_active=True,
        fecha_asignacion=datetime.now(timezone.utc),
    )
    db.add(rango)

    await db.flush()

    # 7. Respuesta
    return OnboardingResponse(
        client_id=client.id,
        message=f"Cliente {config.razon_social} creado y configurado exitosamente",
        api_key=api_key,
        api_secret=api_secret,
        api_base_url="/api/v1/fiscal",
        docs_url="/api/docs",
        plan=config.plan,
        rango_numeros_control=f"{config.series_facturas}-{initial_range_start:08d} a {config.series_facturas}-{initial_range_start + initial_range_size - 1:08d}",
        series_configuradas={
            "facturas": config.series_facturas,
            "notas_credito": config.series_nc,
            "notas_debito": config.series_nd,
        },
    )


async def clone_client_config(
    db: AsyncSession,
    source_client_id: uuid.UUID,
    new_config: ClientTemplateConfig,
    admin_user_id: uuid.UUID | None = None,
) -> OnboardingResponse:
    """
    Clona la configuración de un cliente existente para crear uno nuevo.

    Copia: settings, reglas de negocio, configuración de series,
    pero genera nuevas credenciales y rangos de control.
    """
    # Obtener settings del cliente fuente
    result = await db.execute(
        select(ClientSetting).where(ClientSetting.client_id == source_client_id)
    )
    source_settings = result.scalars().all()

    # Crear el nuevo cliente con onboarding estándar
    response = await onboard_client(db, new_config, admin_user_id)

    # Copiar settings adicionales del cliente fuente (excepto API keys y series)
    skip_keys = {"api_key", "api_secret_hash", "series.facturas", "series.notas_credito",
                 "series.notas_debito", "tipo_sistema", "webhook_url", "webhook_secret"}

    for setting in source_settings:
        if setting.key not in skip_keys:
            existing = await db.execute(
                select(ClientSetting).where(
                    ClientSetting.client_id == response.client_id,
                    ClientSetting.key == setting.key,
                )
            )
            if not existing.scalar_one_or_none():
                db.add(ClientSetting(
                    client_id=response.client_id,
                    key=setting.key,
                    value=setting.value,
                    description=setting.description,
                ))

    await db.flush()
    return response

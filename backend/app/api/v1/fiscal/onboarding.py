"""
Endpoints de onboarding rápido de clientes.

Solo accesible por admins de AIDA (Portal 6).
Permite crear clientes listos para facturar en segundos.
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.deps import get_current_user, require_permissions, log_audit
from app.core.permissions import P6_CLIENTS_CREATE
from app.models.security import User
from app.schemas.fiscal import ClientTemplateConfig, OnboardingResponse
from app.services.fiscal.onboarding import onboard_client, clone_client_config

router = APIRouter()


@router.post(
    "/new",
    response_model=OnboardingResponse,
    summary="Crear cliente listo para facturar",
    description="""
    Onboarding express: crea un cliente con todo lo necesario para emitir
    documentos fiscales de inmediato.

    Genera automáticamente:
    - Cuenta del cliente con plan seleccionado
    - API Key y Secret para integración
    - Usuario admin con rol client_admin
    - Rango inicial de 1000 números de control
    - Series de documentos configuradas

    El cliente puede empezar a facturar inmediatamente usando la API Fiscal.
    """,
)
async def create_client_quick(
    config: ClientTemplateConfig,
    request: Request,
    user: User = require_permissions(P6_CLIENTS_CREATE),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await onboard_client(db, config, admin_user_id=user.id)

        await log_audit(
            db, user.id, "onboard_client", "client",
            str(result.client_id),
            details=f"Plan: {config.plan}, RIF: {config.rif}",
            request=request,
        )

        return result

    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.post(
    "/clone/{source_client_id}",
    response_model=OnboardingResponse,
    summary="Clonar configuración de cliente existente",
    description="""
    Crea un nuevo cliente copiando la configuración de uno existente.

    Ideal para onboarding masivo: configura el primer cliente correctamente,
    luego clona para los demás. Se copian settings y reglas de negocio,
    pero se generan nuevas credenciales y rangos de control.
    """,
)
async def clone_client(
    source_client_id: uuid.UUID,
    config: ClientTemplateConfig,
    request: Request,
    user: User = require_permissions(P6_CLIENTS_CREATE),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await clone_client_config(db, source_client_id, config, admin_user_id=user.id)

        await log_audit(
            db, user.id, "clone_client", "client",
            str(result.client_id),
            details=f"Clonado de {source_client_id}, Plan: {config.plan}",
            request=request,
        )

        return result

    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

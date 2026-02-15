"""
Autenticación por API Key para la API Fiscal Estándar.

Los clientes se autentican con su api_key en el header X-API-Key.
Esto es independiente del JWT (que se usa en los portales web).
"""
import uuid
import hashlib
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.clients import Client, ClientSetting

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def get_client_from_api_key(
    api_key: str | None = Security(api_key_header),
    db: AsyncSession = Depends(get_db),
) -> Client:
    """
    Valida el API Key y retorna el cliente asociado.

    El cliente envía su api_key en el header X-API-Key.
    """
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API Key requerida. Envíe el header X-API-Key.",
        )

    # Buscar el setting que tenga este api_key
    result = await db.execute(
        select(ClientSetting).where(
            ClientSetting.key == "api_key",
            ClientSetting.value == api_key,
        )
    )
    setting = result.scalar_one_or_none()

    if not setting:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API Key inválida.",
        )

    # Obtener el cliente
    client_result = await db.execute(select(Client).where(Client.id == setting.client_id))
    client = client_result.scalar_one_or_none()

    if not client:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Cliente no encontrado.")

    if not client.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cuenta suspendida o inactiva.")

    if client.is_suspended:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Cuenta suspendida: {client.suspension_reason or 'Contacte al administrador'}",
        )

    return client

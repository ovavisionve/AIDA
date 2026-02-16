"""
Endpoints de upload de archivos (logos, banners).

Permite a los clientes subir sus archivos de personalización de documentos.
"""
import uuid
import os
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.database import get_db
from app.config import get_settings
from app.core.deps import get_current_user
from app.models.clients import Client
from app.models.templates import ClientBanner

router = APIRouter()
settings = get_settings()

ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp"}
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2 MB


def _save_file(file_bytes: bytes, filename: str, subfolder: str) -> str:
    """Guardar archivo en storage local y retornar path relativo."""
    upload_dir = os.path.join(settings.STORAGE_PATH, "uploads", subfolder)
    os.makedirs(upload_dir, exist_ok=True)

    # Nombre único
    ext = os.path.splitext(filename)[1] or ".png"
    unique_name = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(upload_dir, unique_name)

    with open(filepath, "wb") as f:
        f.write(file_bytes)

    return f"/uploads/{subfolder}/{unique_name}"


@router.post("/logo")
async def upload_logo(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Subir logo de empresa. Se guarda en el perfil del cliente."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, f"Tipo de archivo no permitido: {file.content_type}. Usa PNG, JPG o WebP.")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(400, f"Archivo muy grande. Máximo: {MAX_FILE_SIZE // (1024*1024)} MB.")

    # Buscar el client_id del usuario
    client_id = getattr(current_user, "client_id", None)
    if not client_id:
        raise HTTPException(400, "Usuario no asociado a un cliente.")

    path = _save_file(content, file.filename or "logo.png", f"logos/{client_id}")

    # Actualizar logo_url del cliente
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if client:
        client.logo_url = path
        await db.flush()

    return {"url": path, "filename": file.filename, "size": len(content)}


@router.post("/banner")
async def upload_banner(
    document_type: str = Query(..., description="Tipo: factura, nota_credito, nota_debito, guia_despacho, todos"),
    position: str = Query("footer", description="Posición: header, footer"),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Subir banner publicitario para un tipo de documento."""
    valid_types = {"factura", "nota_credito", "nota_debito", "guia_despacho", "retencion", "todos"}
    if document_type not in valid_types:
        raise HTTPException(400, f"Tipo inválido. Opciones: {', '.join(valid_types)}")

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, f"Tipo de archivo no permitido: {file.content_type}. Usa PNG, JPG o WebP.")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(400, f"Archivo muy grande. Máximo: {MAX_FILE_SIZE // (1024*1024)} MB.")

    client_id = getattr(current_user, "client_id", None)
    if not client_id:
        raise HTTPException(400, "Usuario no asociado a un cliente.")

    path = _save_file(content, file.filename or "banner.png", f"banners/{client_id}")

    # Desactivar banner anterior del mismo tipo y posición
    existing = await db.execute(
        select(ClientBanner).where(
            and_(
                ClientBanner.client_id == client_id,
                ClientBanner.document_type == document_type,
                ClientBanner.position == position,
                ClientBanner.is_active == True,
            )
        )
    )
    for old_banner in existing.scalars().all():
        old_banner.is_active = False

    # Crear nuevo banner
    banner = ClientBanner(
        client_id=client_id,
        document_type=document_type,
        banner_image_url=path,
        position=position,
        is_active=True,
    )
    db.add(banner)
    await db.flush()

    return {
        "id": str(banner.id),
        "document_type": document_type,
        "position": position,
        "url": path,
    }


@router.get("/banners")
async def list_banners(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Listar banners activos del cliente."""
    client_id = getattr(current_user, "client_id", None)
    if not client_id:
        raise HTTPException(400, "Usuario no asociado a un cliente.")

    result = await db.execute(
        select(ClientBanner).where(
            and_(ClientBanner.client_id == client_id, ClientBanner.is_active == True)
        )
    )
    banners = result.scalars().all()

    return [
        {
            "id": str(b.id),
            "document_type": b.document_type,
            "position": b.position,
            "url": b.banner_image_url,
        }
        for b in banners
    ]


@router.delete("/banners/{banner_id}")
async def delete_banner(
    banner_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Desactivar un banner."""
    client_id = getattr(current_user, "client_id", None)
    result = await db.execute(
        select(ClientBanner).where(
            and_(ClientBanner.id == banner_id, ClientBanner.client_id == client_id)
        )
    )
    banner = result.scalar_one_or_none()
    if not banner:
        raise HTTPException(404, "Banner no encontrado.")

    banner.is_active = False
    return {"message": "Banner eliminado."}

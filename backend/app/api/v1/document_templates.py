"""
Endpoints de gestión de plantillas de documentos.

Permite:
  - Listar plantillas disponibles
  - Ver detalles/preview de una plantilla
  - Configurar preferencia de plantilla por cliente y tipo de documento
"""
import uuid
import json
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.database import get_db
from app.core.auth import get_current_user
from app.models.templates import DocumentTemplate, ClientTemplatePreference

router = APIRouter()


# ── Seed de plantillas por defecto ──────────────────────────────────────────

DEFAULT_TEMPLATES = [
    {
        "name": "Clásica SENIAT",
        "code": "clasica",
        "description": "Formato tradicional verde/oliva inspirado en los formatos oficiales del SENIAT. Incluye todas las secciones requeridas por la Providencia SNAT/2024/000102.",
        "layout_config": json.dumps({
            "header_color": "#4a6741",
            "accent_color": "#5c8a4f",
            "text_color": "#1a1a1a",
            "header_bg": "#e8f0e5",
            "table_header_bg": "#4a6741",
            "table_header_text": "#ffffff",
            "table_alt_row": "#f5f8f4",
            "border_color": "#4a6741",
            "font_family": "Helvetica",
            "logo_position": "top-left",
            "qr_position": "top-right",
            "barcode_position": "bottom-center",
            "banner_position": "footer",
            "style": "formal",
        }),
        "is_default": True,
        "sort_order": 1,
    },
    {
        "name": "Moderna AIDA",
        "code": "moderna",
        "description": "Diseño azul moderno con la identidad visual de AIDA. Líneas limpias, tipografía contemporánea. Ideal para empresas tecnológicas.",
        "layout_config": json.dumps({
            "header_color": "#0a1628",
            "accent_color": "#3b82f6",
            "text_color": "#0f172a",
            "header_bg": "#eef4ff",
            "table_header_bg": "#0a1628",
            "table_header_text": "#ffffff",
            "table_alt_row": "#f8fafc",
            "border_color": "#3b82f6",
            "font_family": "Helvetica",
            "logo_position": "top-left",
            "qr_position": "top-right",
            "barcode_position": "bottom-center",
            "banner_position": "footer",
            "style": "modern",
        }),
        "is_default": False,
        "sort_order": 2,
    },
    {
        "name": "Corporativa",
        "code": "corporativa",
        "description": "Estilo sobrio gris/negro profesional. Ideal para empresas grandes, firmas de abogados, consultoras. Apariencia ejecutiva.",
        "layout_config": json.dumps({
            "header_color": "#1f2937",
            "accent_color": "#6b7280",
            "text_color": "#111827",
            "header_bg": "#f3f4f6",
            "table_header_bg": "#1f2937",
            "table_header_text": "#ffffff",
            "table_alt_row": "#f9fafb",
            "border_color": "#d1d5db",
            "font_family": "Helvetica",
            "logo_position": "top-left",
            "qr_position": "top-right",
            "barcode_position": "bottom-center",
            "banner_position": "footer",
            "style": "corporate",
        }),
        "is_default": False,
        "sort_order": 3,
    },
    {
        "name": "Compacta",
        "code": "compacta",
        "description": "Optimizada para imprimir en media carta o en formato reducido. Fuentes más pequeñas, márgenes ajustados. Ideal para alto volumen de impresión.",
        "layout_config": json.dumps({
            "header_color": "#1e40af",
            "accent_color": "#3b82f6",
            "text_color": "#1e293b",
            "header_bg": "#eff6ff",
            "table_header_bg": "#1e40af",
            "table_header_text": "#ffffff",
            "table_alt_row": "#f8fafc",
            "border_color": "#93c5fd",
            "font_family": "Helvetica",
            "font_size_factor": 0.85,
            "margins_factor": 0.7,
            "logo_position": "top-left",
            "qr_position": "top-right",
            "barcode_position": "bottom-right",
            "banner_position": "none",
            "style": "compact",
        }),
        "is_default": False,
        "sort_order": 4,
    },
]


@router.get("/")
async def list_templates(
    document_type: str | None = Query(None, description="Filtrar por tipo de documento"),
    db: AsyncSession = Depends(get_db),
):
    """Listar todas las plantillas activas."""
    query = select(DocumentTemplate).where(DocumentTemplate.is_active == True).order_by(DocumentTemplate.sort_order)
    result = await db.execute(query)
    templates = result.scalars().all()

    output = []
    for t in templates:
        if document_type and document_type not in (t.document_types or ""):
            continue
        output.append({
            "id": str(t.id),
            "name": t.name,
            "code": t.code,
            "description": t.description,
            "document_types": t.document_types.split(",") if t.document_types else [],
            "preview_image_url": t.preview_image_url,
            "is_default": t.is_default,
            "layout_config": json.loads(t.layout_config) if t.layout_config else {},
        })

    return output


@router.get("/{template_id}")
async def get_template(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Obtener detalles de una plantilla."""
    result = await db.execute(select(DocumentTemplate).where(DocumentTemplate.id == template_id))
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(404, "Plantilla no encontrada.")

    return {
        "id": str(t.id),
        "name": t.name,
        "code": t.code,
        "description": t.description,
        "document_types": t.document_types.split(",") if t.document_types else [],
        "preview_image_url": t.preview_image_url,
        "is_default": t.is_default,
        "layout_config": json.loads(t.layout_config) if t.layout_config else {},
    }


@router.post("/preference")
async def set_preference(
    document_type: str = Query(..., description="factura, nota_credito, nota_debito, guia_despacho, retencion"),
    template_id: uuid.UUID = Query(..., description="ID de la plantilla a usar"),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Configurar qué plantilla usa el cliente para un tipo de documento."""
    client_id = getattr(current_user, "client_id", None)
    if not client_id:
        raise HTTPException(400, "Usuario no asociado a un cliente.")

    # Verificar que la plantilla existe
    result = await db.execute(select(DocumentTemplate).where(DocumentTemplate.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(404, "Plantilla no encontrada.")

    # Buscar preferencia existente
    result = await db.execute(
        select(ClientTemplatePreference).where(
            and_(
                ClientTemplatePreference.client_id == client_id,
                ClientTemplatePreference.document_type == document_type,
            )
        )
    )
    pref = result.scalar_one_or_none()

    if pref:
        pref.template_id = template_id
    else:
        pref = ClientTemplatePreference(
            client_id=client_id,
            document_type=document_type,
            template_id=template_id,
        )
        db.add(pref)

    await db.flush()

    return {
        "document_type": document_type,
        "template_id": str(template_id),
        "template_name": template.name,
    }


@router.get("/preferences/me")
async def get_my_preferences(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Obtener las preferencias de plantilla del cliente actual."""
    client_id = getattr(current_user, "client_id", None)
    if not client_id:
        raise HTTPException(400, "Usuario no asociado a un cliente.")

    result = await db.execute(
        select(ClientTemplatePreference).where(ClientTemplatePreference.client_id == client_id)
    )
    prefs = result.scalars().all()

    output = {}
    for p in prefs:
        # Buscar nombre de plantilla
        t_result = await db.execute(select(DocumentTemplate).where(DocumentTemplate.id == p.template_id))
        t = t_result.scalar_one_or_none()
        output[p.document_type] = {
            "template_id": str(p.template_id),
            "template_name": t.name if t else "Desconocida",
            "template_code": t.code if t else "",
        }

    return output


@router.post("/seed")
async def seed_templates(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Crear las plantillas por defecto si no existen."""
    created = 0
    for tpl_data in DEFAULT_TEMPLATES:
        result = await db.execute(
            select(DocumentTemplate).where(DocumentTemplate.code == tpl_data["code"])
        )
        if result.scalar_one_or_none():
            continue

        template = DocumentTemplate(
            name=tpl_data["name"],
            code=tpl_data["code"],
            description=tpl_data["description"],
            layout_config=tpl_data["layout_config"],
            is_default=tpl_data["is_default"],
            sort_order=tpl_data["sort_order"],
        )
        db.add(template)
        created += 1

    await db.flush()
    return {"message": f"Seed completado. {created} plantillas creadas.", "total": len(DEFAULT_TEMPLATES)}

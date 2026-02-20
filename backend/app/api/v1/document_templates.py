"""
Endpoints de gestión de plantillas de documentos.

Permite:
  - Listar plantillas disponibles
  - Ver detalles/preview de una plantilla
  - Generar PDF de ejemplo con una plantilla específica
  - Configurar preferencia de plantilla por cliente y tipo de documento
"""
import uuid
import json
from datetime import datetime, timezone, date
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.database import get_db
from app.core.deps import get_current_user
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
    {
        "name": "Elegante Vino",
        "code": "elegante",
        "description": "Tonos vino/burdeos con acentos dorados. Transmite exclusividad y seriedad. Ideal para firmas de abogados, joyerías, restaurantes premium.",
        "layout_config": json.dumps({
            "header_color": "#7f1d1d",
            "accent_color": "#991b1b",
            "text_color": "#1c1917",
            "header_bg": "#fef2f2",
            "table_header_bg": "#7f1d1d",
            "table_header_text": "#ffffff",
            "table_alt_row": "#fdf2f2",
            "border_color": "#b91c1c",
            "font_family": "Helvetica",
            "logo_position": "top-left",
            "qr_position": "top-right",
            "barcode_position": "bottom-center",
            "banner_position": "footer",
            "style": "elegant",
        }),
        "is_default": False,
        "sort_order": 5,
    },
    {
        "name": "Tropical Caribe",
        "code": "tropical",
        "description": "Colores cálidos naranja/ámbar con energía caribeña. Perfecto para agencias de viajes, restaurantes, hoteles, negocios turísticos.",
        "layout_config": json.dumps({
            "header_color": "#92400e",
            "accent_color": "#d97706",
            "text_color": "#1c1917",
            "header_bg": "#fffbeb",
            "table_header_bg": "#92400e",
            "table_header_text": "#ffffff",
            "table_alt_row": "#fefce8",
            "border_color": "#f59e0b",
            "font_family": "Helvetica",
            "logo_position": "top-left",
            "qr_position": "top-right",
            "barcode_position": "bottom-center",
            "banner_position": "footer",
            "style": "tropical",
        }),
        "is_default": False,
        "sort_order": 6,
    },
    {
        "name": "Minimalista",
        "code": "minimalista",
        "description": "Ultra limpia con bordes finos y colores sutiles. Sin distracciones, máxima legibilidad. Ideal para consultoras, startups, freelancers.",
        "layout_config": json.dumps({
            "header_color": "#374151",
            "accent_color": "#9ca3af",
            "text_color": "#1f2937",
            "header_bg": "#f9fafb",
            "table_header_bg": "#374151",
            "table_header_text": "#ffffff",
            "table_alt_row": "#f9fafb",
            "border_color": "#e5e7eb",
            "font_family": "Helvetica",
            "logo_position": "top-left",
            "qr_position": "top-right",
            "barcode_position": "bottom-center",
            "banner_position": "footer",
            "style": "minimal",
        }),
        "is_default": False,
        "sort_order": 7,
    },
    {
        "name": "Esmeralda Premium",
        "code": "esmeralda",
        "description": "Verde esmeralda intenso con acabados premium. Evoca confianza y prosperidad. Para bancos, aseguradoras, inmobiliarias.",
        "layout_config": json.dumps({
            "header_color": "#065f46",
            "accent_color": "#059669",
            "text_color": "#111827",
            "header_bg": "#ecfdf5",
            "table_header_bg": "#065f46",
            "table_header_text": "#ffffff",
            "table_alt_row": "#f0fdf4",
            "border_color": "#10b981",
            "font_family": "Helvetica",
            "logo_position": "top-left",
            "qr_position": "top-right",
            "barcode_position": "bottom-center",
            "banner_position": "footer",
            "style": "premium",
        }),
        "is_default": False,
        "sort_order": 8,
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


@router.get("/{template_id}/preview-pdf")
async def preview_template_pdf(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Genera un PDF de ejemplo usando esta plantilla para previsualización."""
    result = await db.execute(select(DocumentTemplate).where(DocumentTemplate.id == template_id))
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(404, "Plantilla no encontrada.")

    from app.services.fiscal.pdf_generator import generate_invoice_pdf

    # Crear un documento de ejemplo
    class _SampleDoc:
        pass

    doc = _SampleDoc()
    doc.document_number = "FAC-DEMO-001"
    doc.control_number = "00-00000001"
    doc.uuid_seniat = "demo-uuid-1234-5678-9012"
    doc.emisor_rif = "J-12345678-9"
    doc.emisor_razon_social = "Empresa Demo, C.A."
    doc.emisor_direccion = "Av. Principal, Torre AIDA, Piso 5, Caracas 1010"
    doc.emisor_telefono = "0212-555-0123"
    doc.emisor_ciudad = "Caracas"
    doc.emisor_zona_postal = "1010"
    doc.receptor_rif = "V-98765432-1"
    doc.receptor_razon_social = "Cliente Ejemplo, S.A."
    doc.receptor_direccion = "Calle Comercio, Local 42, Valencia"
    doc.receptor_telefono = "0241-555-9876"
    doc.receptor_email = "cliente@ejemplo.com"
    doc.fecha_emision = datetime.now(timezone.utc)
    doc.fecha_vencimiento = None
    doc.subtotal = 1000.00
    doc.descuento = 50.00
    doc.cargo_administrativo = 0
    doc.base_imponible = 950.00
    doc.base_exenta = 0
    doc.base_no_sujeta = 0
    doc.monto_iva_16 = 152.00
    doc.monto_iva_8 = 0
    doc.alicuota_iva_16 = 16.00
    doc.alicuota_iva_8 = 8.00
    doc.base_imponible_igtf = 1102.00
    doc.porcentaje_igtf = 3.00
    doc.monto_igtf = 33.06
    doc.total = 1102.00
    doc.total_con_igtf = 1135.06
    doc.moneda = "USD"
    doc.tasa_cambio = 36.50
    doc.forma_pago = "transferencia"
    doc.condicion_pago = "contado"
    doc.status = "emitido"
    doc.observaciones = "Documento de ejemplo generado para previsualización de plantilla."
    doc.firma_digital = "a1b2c3d4e5f6789012345678901234567890abcd1234567890abcdef12345678"
    doc.imprenta_rif = "J-50000000-0"
    doc.imprenta_razon_social = "AIDA Imprenta Digital, C.A."
    doc.imprenta_autorizacion = "SNAT/2024/000102"
    doc.imprenta_fecha_autorizacion = date(2024, 1, 15)
    doc.control_rango_desde = "00-00000001"
    doc.control_rango_hasta = "00-00005000"
    doc.control_fecha_asignacion = date(2024, 1, 15)
    doc.providencia_referencia = "Providencia SNAT/2024/000102"
    doc.supervisor_nombre = "María García"
    doc.supervisor_cedula = "V-12345678"
    doc.entrega_direccion = "Calle Comercio, Local 42, Valencia"
    doc.entrega_fecha = date.today()
    doc.entrega_responsable = "José Pérez"
    doc.qr_code = ""

    # Items de ejemplo
    class _SampleItem:
        pass

    items = []
    for i, (desc, qty, price, tax) in enumerate([
        ("Servicio de Facturación Electrónica - Plan Profesional", 1, 500.00, 16),
        ("Licencia de Integración API REST (mensual)", 2, 150.00, 16),
        ("Soporte Técnico Premium 24/7", 1, 200.00, 16),
    ], 1):
        item = _SampleItem()
        item.line_number = i
        item.product_code = f"SRV-{i:03d}"
        item.description = desc
        item.unit_of_measure = "UND"
        item.quantity = qty
        item.unit_price = price
        item.discount_amount = 50 / 3 if i == 1 else 0
        item.subtotal = qty * price - (50 / 3 if i == 1 else 0)
        item.tax_type = "G"
        item.tax_rate = tax
        item.tax_amount = item.subtotal * tax / 100
        item.total = item.subtotal + item.tax_amount
        items.append(item)

    layout_config = t.layout_config
    pdf_bytes = generate_invoice_pdf(doc, items, doc_type="factura", layout_config=layout_config)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="preview_{t.code}.pdf"'},
    )


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

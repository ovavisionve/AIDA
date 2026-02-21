"""
Endpoints de descarga, exportación y procesamiento batch de documentos fiscales.

- GET /fiscal/documents/{id}/pdf  → Descargar PDF
- GET /fiscal/documents/{id}/xml  → Descargar XML
- POST /fiscal/export             → Exportar documentos (CSV/Excel/TXT SENIAT)
- POST /fiscal/emit-batch         → Emitir múltiples documentos
- POST /fiscal/send-email/{id}    → Reenviar documento por email
"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import Response
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.clients import Client
from app.models.documents import Invoice, CreditNote, DebitNote, DispatchGuide, DocumentItem
from app.models.templates import DocumentTemplate, ClientTemplatePreference, ClientBanner
from app.services.fiscal.api_auth import get_client_from_api_key
from app.services.fiscal.pdf_generator import generate_invoice_pdf
from app.services.fiscal.xml_generator import generate_document_xml
from app.services.fiscal.export_service import (
    export_documents_csv, export_documents_excel, export_documents_seniat_txt,
)
from app.services.fiscal.document_emitter import emitir_documento, DocumentEmissionError
from app.services.notifications.email_service import get_email_service
from app.services.storage import get_storage
from app.core.deps import log_audit
from pydantic import BaseModel

router = APIRouter()


# --- Helpers ---

async def _find_document(db: AsyncSession, doc_id: uuid.UUID, client_id: uuid.UUID):
    """Busca un documento por ID en todas las tablas, retorna (doc, type, items)."""
    for Model, dtype in [(Invoice, "factura"), (CreditNote, "nota_credito"), (DebitNote, "nota_debito"), (DispatchGuide, "guia_despacho")]:
        result = await db.execute(
            select(Model).options(selectinload(Model.items))
            .where(Model.id == doc_id, Model.client_id == client_id)
        )
        doc = result.scalar_one_or_none()
        if doc:
            return doc, dtype, doc.items
    return None, None, None


async def _resolve_template_config(db: AsyncSession, client_id: uuid.UUID, doc_type: str) -> str | None:
    """Resolve the layout_config JSON for a client's preferred template."""
    from sqlalchemy import and_
    result = await db.execute(
        select(ClientTemplatePreference).where(
            and_(
                ClientTemplatePreference.client_id == client_id,
                ClientTemplatePreference.document_type == doc_type,
            )
        )
    )
    pref = result.scalar_one_or_none()

    template_id = pref.template_id if pref else None
    if not template_id:
        # Fall back to default template
        result = await db.execute(
            select(DocumentTemplate).where(
                DocumentTemplate.is_default == True,
                DocumentTemplate.is_active == True,
            )
        )
        tpl = result.scalar_one_or_none()
    else:
        result = await db.execute(select(DocumentTemplate).where(DocumentTemplate.id == template_id))
        tpl = result.scalar_one_or_none()

    return tpl.layout_config if tpl else None


async def _resolve_banner_path(db: AsyncSession, client_id: uuid.UUID, doc_type: str) -> tuple[str | None, str]:
    """Resolve banner image path and position for a client/doc_type."""
    from sqlalchemy import and_
    result = await db.execute(
        select(ClientBanner).where(
            and_(
                ClientBanner.client_id == client_id,
                ClientBanner.is_active == True,
                ClientBanner.document_type.in_([doc_type, "todos"]),
            )
        )
    )
    banner = result.scalars().first()
    if banner:
        return banner.banner_image_url, banner.position
    return None, "footer"


async def _collect_documents_for_export(
    db: AsyncSession, client_id: uuid.UUID,
    fecha_desde: str | None = None, fecha_hasta: str | None = None,
    tipo: str | None = None, status: str | None = None,
) -> list[dict]:
    """Recolecta documentos para exportación."""
    documents = []

    models = []
    if not tipo or tipo == "factura":
        models.append((Invoice, "factura"))
    if not tipo or tipo == "nota_credito":
        models.append((CreditNote, "nota_credito"))
    if not tipo or tipo == "nota_debito":
        models.append((DebitNote, "nota_debito"))
    if not tipo or tipo == "guia_despacho":
        models.append((DispatchGuide, "guia_despacho"))

    for Model, dtype in models:
        query = select(Model).where(Model.client_id == client_id)
        if fecha_desde:
            query = query.where(Model.fecha_emision >= fecha_desde)
        if fecha_hasta:
            query = query.where(Model.fecha_emision <= fecha_hasta)
        if status:
            query = query.where(Model.status == status)
        query = query.order_by(Model.fecha_emision.desc())

        result = await db.execute(query)
        for doc in result.scalars().all():
            iva = float(getattr(doc, "monto_iva_16", 0) or getattr(doc, "monto_iva", 0) or 0) + float(getattr(doc, "monto_iva_8", 0) or 0)
            documents.append({
                "tipo": dtype,
                "numero_control": doc.control_number or "",
                "numero_documento": doc.document_number,
                "fecha_emision": str(doc.fecha_emision)[:10] if doc.fecha_emision else "",
                "emisor_rif": doc.emisor_rif,
                "emisor_razon_social": doc.emisor_razon_social,
                "receptor_rif": doc.receptor_rif,
                "receptor_razon_social": doc.receptor_razon_social,
                "subtotal": float(getattr(doc, "subtotal", 0) or 0),
                "base_imponible": float(getattr(doc, "base_imponible", 0) or getattr(doc, "subtotal", 0) or 0),
                "iva": iva,
                "total": float(doc.total or 0),
                "moneda": getattr(doc, "moneda", "VES"),
                "status": doc.status,
                "forma_pago": getattr(doc, "forma_pago", ""),
            })

    return documents


# --- PDF Download ---

@router.get(
    "/documents/{doc_id}/pdf",
    summary="Descargar PDF de documento fiscal",
    description="Genera y descarga el PDF de un documento fiscal.",
)
async def download_pdf(
    doc_id: uuid.UUID,
    client: Client = Depends(get_client_from_api_key),
    db: AsyncSession = Depends(get_db),
):
    doc, doc_type, items = await _find_document(db, doc_id, client.id)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    # Resolve template, logo, and banner for client
    layout_config = await _resolve_template_config(db, client.id, doc_type)
    banner_path, banner_position = await _resolve_banner_path(db, client.id, doc_type)

    # Resolve relative URL paths to absolute filesystem paths
    import os as _os
    from app.config import get_settings as _get_settings
    _stg = _get_settings()
    logo_fs = _os.path.join(_stg.STORAGE_PATH, client.logo_url.lstrip("/")) if client.logo_url else None
    banner_fs = _os.path.join(_stg.STORAGE_PATH, banner_path.lstrip("/")) if banner_path else None

    pdf_bytes = generate_invoice_pdf(
        doc, items, doc_type,
        layout_config=layout_config,
        logo_path=logo_fs,
        banner_path=banner_fs,
        banner_position=banner_position,
    )

    # Store in cache
    storage = get_storage()
    filename = f"{doc_type}_{doc.control_number or doc.document_number}.pdf"
    await storage.save(pdf_bytes, str(client.id), "pdf", filename)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# --- XML Download ---

@router.get(
    "/documents/{doc_id}/xml",
    summary="Descargar XML de documento fiscal",
    description="Genera y descarga el XML UBL 2.1 de un documento fiscal.",
)
async def download_xml(
    doc_id: uuid.UUID,
    client: Client = Depends(get_client_from_api_key),
    db: AsyncSession = Depends(get_db),
):
    doc, doc_type, items = await _find_document(db, doc_id, client.id)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    xml_bytes = generate_document_xml(doc, items, doc_type)

    filename = f"{doc_type}_{doc.control_number or doc.document_number}.xml"
    storage = get_storage()
    await storage.save(xml_bytes, str(client.id), "xml", filename)

    return Response(
        content=xml_bytes,
        media_type="application/xml",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# --- Export ---

class ExportRequest(BaseModel):
    formato: str = "csv"  # csv, excel, txt_seniat
    fecha_desde: str | None = None
    fecha_hasta: str | None = None
    tipo_documento: str | None = None
    status: str | None = None
    periodo: str | None = None  # YYYY-MM, requerido para txt_seniat


@router.post(
    "/export",
    summary="Exportar documentos fiscales",
    description="Exporta documentos en CSV, Excel o formato TXT SENIAT para declaraciones.",
)
async def export_documents(
    data: ExportRequest,
    request: Request,
    client: Client = Depends(get_client_from_api_key),
    db: AsyncSession = Depends(get_db),
):
    documents = await _collect_documents_for_export(
        db, client.id, data.fecha_desde, data.fecha_hasta,
        data.tipo_documento, data.status,
    )

    if not documents:
        raise HTTPException(status_code=404, detail="No se encontraron documentos para exportar")

    await log_audit(
        db, None, "export", "documents", details=f"format={data.formato}, count={len(documents)}",
        request=request, client_id=client.id,
    )

    if data.formato == "excel":
        content = export_documents_excel(documents, f"Documentos Fiscales {data.periodo or ''}")
        return Response(
            content=content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="aida_documentos_{data.periodo or "export"}.xlsx"'},
        )
    elif data.formato == "txt_seniat":
        if not data.periodo:
            raise HTTPException(status_code=400, detail="periodo es requerido para formato TXT SENIAT (YYYY-MM)")
        content = export_documents_seniat_txt(documents, data.periodo, client.rif)
        return Response(
            content=content,
            media_type="text/plain",
            headers={"Content-Disposition": f'attachment; filename="seniat_{client.rif}_{data.periodo}.txt"'},
        )
    else:
        content = export_documents_csv(documents)
        return Response(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="aida_documentos_{data.periodo or "export"}.csv"'},
        )


# --- Send by email ---

@router.post(
    "/send-email/{doc_id}",
    summary="Enviar documento por email",
    description="Genera PDF/XML y envía el documento al email del receptor.",
)
async def send_document_email(
    doc_id: uuid.UUID,
    email_to: str | None = None,
    request: Request = None,
    client: Client = Depends(get_client_from_api_key),
    db: AsyncSession = Depends(get_db),
):
    doc, doc_type, items = await _find_document(db, doc_id, client.id)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    recipient = email_to or getattr(doc, "receptor_email", None)
    if not recipient:
        raise HTTPException(status_code=400, detail="No se especifico email destinatario y el documento no tiene email del receptor")

    layout_config = await _resolve_template_config(db, client.id, doc_type)
    banner_path, banner_position = await _resolve_banner_path(db, client.id, doc_type)

    # Resolve relative URL paths to absolute filesystem paths
    logo_fs2 = _os.path.join(_stg.STORAGE_PATH, client.logo_url.lstrip("/")) if client.logo_url else None
    banner_fs2 = _os.path.join(_stg.STORAGE_PATH, banner_path.lstrip("/")) if banner_path else None

    pdf_bytes = generate_invoice_pdf(
        doc, items, doc_type,
        layout_config=layout_config,
        logo_path=logo_fs2,
        banner_path=banner_fs2,
        banner_position=banner_position,
    )
    xml_bytes = generate_document_xml(doc, items, doc_type)

    email_svc = get_email_service()
    success = await email_svc.send_document_email(
        to=recipient,
        doc_type=doc_type,
        numero_control=doc.control_number or doc.document_number,
        emisor_razon=doc.emisor_razon_social,
        receptor_razon=doc.receptor_razon_social,
        total=float(doc.total),
        moneda=getattr(doc, "moneda", "VES"),
        pdf_bytes=pdf_bytes,
        xml_bytes=xml_bytes,
    )

    await log_audit(
        db, None, "send_email", "document", str(doc_id),
        details=f"to={recipient}, success={success}",
        request=request, client_id=client.id,
    )

    if not success:
        return {"message": "Email en cola. SMTP no configurado o error de envio. Verifique configuracion.", "sent": False}

    return {"message": f"Documento enviado exitosamente a {recipient}", "sent": True}


# --- Batch emit ---

class BatchEmitItem(BaseModel):
    tipo_documento: str
    receptor_rif: str
    receptor_razon_social: str
    receptor_direccion: str = ""
    receptor_email: str | None = None
    items: list[dict]
    moneda: str = "VES"
    forma_pago: str = "efectivo"
    condicion_pago: str = "contado"
    observaciones: str | None = None


class BatchEmitRequest(BaseModel):
    documentos: list[BatchEmitItem]
    enviar_email: bool = False


@router.post(
    "/emit-batch",
    summary="Emision masiva de documentos",
    description="Emite multiples documentos fiscales en una sola operacion. Maximo 50 documentos por lote.",
)
async def emit_batch(
    data: BatchEmitRequest,
    request: Request,
    client: Client = Depends(get_client_from_api_key),
    db: AsyncSession = Depends(get_db),
):
    if len(data.documentos) > 50:
        raise HTTPException(status_code=400, detail="Maximo 50 documentos por lote")

    if len(data.documentos) == 0:
        raise HTTPException(status_code=400, detail="Debe incluir al menos un documento")

    from app.schemas.fiscal import EmitirDocumentoRequest, ReceptorData, FiscalItemRequest

    results = []
    errors = []

    for i, doc_data in enumerate(data.documentos):
        try:
            # Build request
            fiscal_items = []
            for item in doc_data.items:
                fiscal_items.append(FiscalItemRequest(
                    descripcion=item.get("descripcion", ""),
                    cantidad=item.get("cantidad", 1),
                    precio_unitario=item.get("precio_unitario", 0),
                    tipo_impuesto=item.get("tipo_impuesto", "gravado"),
                    codigo=item.get("codigo"),
                    unidad=item.get("unidad", "UND"),
                ))

            emit_request = EmitirDocumentoRequest(
                tipo_documento=doc_data.tipo_documento,
                receptor=ReceptorData(
                    rif=doc_data.receptor_rif,
                    razon_social=doc_data.receptor_razon_social,
                    direccion=doc_data.receptor_direccion,
                    email=doc_data.receptor_email,
                ),
                items=fiscal_items,
                moneda=doc_data.moneda,
                condicion_pago=doc_data.condicion_pago,
                observaciones=doc_data.observaciones,
            )

            result = await emitir_documento(
                db=db,
                client_id=client.id,
                request=emit_request,
                ip_address=request.client.host if request.client else None,
            )

            results.append({
                "index": i,
                "success": True,
                "document_id": str(result.document_id),
                "numero_control": result.numero_control,
                "total": result.totales.total,
            })

            # Send email if requested
            if data.enviar_email and doc_data.receptor_email:
                doc, doc_type, items = await _find_document(db, result.document_id, client.id)
                if doc:
                    pdf_bytes = generate_invoice_pdf(doc, items, doc_type)
                    xml_bytes = generate_document_xml(doc, items, doc_type)
                    email_svc = get_email_service()
                    await email_svc.send_document_email(
                        to=doc_data.receptor_email,
                        doc_type=doc_type,
                        numero_control=result.numero_control,
                        emisor_razon=doc.emisor_razon_social,
                        receptor_razon=doc.receptor_razon_social,
                        total=float(doc.total),
                        moneda=getattr(doc, "moneda", "VES"),
                        pdf_bytes=pdf_bytes,
                        xml_bytes=xml_bytes,
                    )

        except DocumentEmissionError as e:
            errors.append({"index": i, "success": False, "error": e.message, "details": e.details})
        except Exception as e:
            errors.append({"index": i, "success": False, "error": str(e)})

    await log_audit(
        db, None, "batch_emit", "documents",
        details=f"total={len(data.documentos)}, success={len(results)}, errors={len(errors)}",
        request=request, client_id=client.id,
    )

    return {
        "total": len(data.documentos),
        "success_count": len(results),
        "error_count": len(errors),
        "results": results,
        "errors": errors,
    }

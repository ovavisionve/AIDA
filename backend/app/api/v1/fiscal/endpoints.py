"""
API Fiscal Estándar AIDA — Endpoints principales.

Esta es la API que todos los clientes usan para emitir documentos fiscales.
Es el equivalente de la API genérica SENIAT que usan las imprentas digitales:
un contrato fijo, estandarizado, donde el cliente envía datos y recibe
documentos completos con número de control, firma y QR.

Autenticación: X-API-Key header.

Endpoints:
  POST /fiscal/emit          → Emitir cualquier documento fiscal
  POST /fiscal/void          → Anular un documento
  GET  /fiscal/documents     → Consultar documentos
  GET  /fiscal/validate/{nc} → Validar un documento por número de control
  GET  /fiscal/status        → Estado de la cuenta y números de control
"""
import uuid
import math
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.clients import Client
from app.models.documents import Invoice, CreditNote, DebitNote, DispatchGuide
from app.models.control_numbers import ControlNumber
from app.schemas.fiscal import (
    EmitirDocumentoRequest, EmitirDocumentoResponse,
    AnularDocumentoRequest, AnularDocumentoResponse,
    ConsultarDocumentosResponse, DocumentoResumen,
    ValidarDocumentoResponse, FiscalErrorResponse,
)
from app.services.fiscal.api_auth import get_client_from_api_key
from app.services.fiscal.document_emitter import (
    emitir_documento, anular_documento, DocumentEmissionError,
)
from app.services.fiscal.control_numbers import get_available_count
from app.services.fiscal.seniat_validator import SeniatValidator, ValidationResult
from app.core.deps import log_audit

router = APIRouter()


@router.post(
    "/emit",
    response_model=EmitirDocumentoResponse,
    responses={400: {"model": FiscalErrorResponse}, 401: {"model": FiscalErrorResponse}},
    summary="Emitir documento fiscal",
    description="""
    Endpoint principal para emitir cualquier documento fiscal.

    Tipos soportados: `factura`, `nota_credito`, `nota_debito`, `guia_despacho`.

    El sistema automáticamente:
    - Calcula subtotales, IVA (16%, 8%, exento) y totales
    - Asigna número de control consecutivo SENIAT
    - Genera firma digital SHA-256
    - Genera código QR de validación
    - Almacena el documento con trazabilidad completa
    - Genera PDF y XML descargables

    Para notas de crédito/débito, incluya `documento_referencia` (número de control de la factura original).
    """,
)
async def emit_document(
    request_data: EmitirDocumentoRequest,
    request: Request,
    client: Client = Depends(get_client_from_api_key),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await emitir_documento(
            db=db,
            client_id=client.id,
            request=request_data,
            ip_address=request.client.host if request.client else None,
        )

        await log_audit(
            db, None, "fiscal_emit", request_data.tipo_documento,
            str(result.document_id),
            details=f"NC:{result.numero_control} Total:{result.totales.total}",
            request=request, client_id=client.id,
        )

        return result

    except DocumentEmissionError as e:
        raise HTTPException(
            status_code=400,
            detail={"success": False, "error_code": e.error_code, "message": e.message, "details": e.details},
        )


@router.post(
    "/void",
    response_model=AnularDocumentoResponse,
    summary="Anular documento fiscal",
    description="Anula un documento fiscal por su número de control. Requiere motivo de anulación.",
)
async def void_document(
    request_data: AnularDocumentoRequest,
    request: Request,
    client: Client = Depends(get_client_from_api_key),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await anular_documento(
            db=db,
            client_id=client.id,
            request=request_data,
            ip_address=request.client.host if request.client else None,
        )

        await log_audit(
            db, None, "fiscal_void", "document",
            request_data.numero_control,
            details=f"Motivo: {request_data.motivo}",
            request=request, client_id=client.id,
        )

        return result

    except DocumentEmissionError as e:
        raise HTTPException(
            status_code=400,
            detail={"success": False, "error_code": e.error_code, "message": e.message},
        )


@router.get(
    "/documents",
    response_model=ConsultarDocumentosResponse,
    summary="Consultar documentos emitidos",
    description="Lista los documentos emitidos con filtros opcionales.",
)
async def list_documents(
    numero_control: str | None = None,
    numero_documento: str | None = None,
    rif_receptor: str | None = None,
    tipo_documento: str | None = None,
    status: str | None = None,
    fecha_desde: str | None = None,
    fecha_hasta: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    client: Client = Depends(get_client_from_api_key),
    db: AsyncSession = Depends(get_db),
):
    # Consultamos facturas (principal) — en el futuro unir con NC/ND/GD
    query = select(Invoice).where(Invoice.client_id == client.id)

    if numero_control:
        query = query.where(Invoice.control_number.ilike(f"%{numero_control}%"))
    if numero_documento:
        query = query.where(Invoice.document_number.ilike(f"%{numero_documento}%"))
    if rif_receptor:
        query = query.where(Invoice.receptor_rif.ilike(f"%{rif_receptor}%"))
    if status:
        query = query.where(Invoice.status == status)
    if fecha_desde:
        query = query.where(Invoice.fecha_emision >= fecha_desde)
    if fecha_hasta:
        query = query.where(Invoice.fecha_emision <= fecha_hasta)

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    query = query.order_by(Invoice.fecha_emision.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    docs = result.scalars().all()

    items = [
        DocumentoResumen(
            document_id=d.id,
            tipo_documento="factura",
            numero_documento=d.document_number,
            numero_control=d.control_number or "",
            receptor_rif=d.receptor_rif,
            receptor_razon_social=d.receptor_razon_social,
            fecha_emision=d.fecha_emision,
            total=float(d.total),
            moneda=d.moneda,
            status=d.status,
        )
        for d in docs
    ]

    return ConsultarDocumentosResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size) if total > 0 else 0,
    )


@router.get(
    "/validate/{numero_control}",
    response_model=ValidarDocumentoResponse,
    summary="Validar documento por número de control",
    description="Verifica la autenticidad de un documento fiscal por su número de control.",
)
async def validate_document(
    numero_control: str,
    db: AsyncSession = Depends(get_db),
):
    # Buscar en facturas
    result = await db.execute(
        select(Invoice).where(Invoice.control_number == numero_control)
    )
    doc = result.scalar_one_or_none()

    if doc:
        return ValidarDocumentoResponse(
            es_valido=True,
            numero_control=numero_control,
            tipo_documento="factura",
            numero_documento=doc.document_number,
            emisor_rif=doc.emisor_rif,
            receptor_rif=doc.receptor_rif,
            fecha_emision=doc.fecha_emision,
            total=float(doc.total),
            status=doc.status,
            firma_digital=doc.firma_digital,
        )

    # Buscar en NC, ND
    for model, tipo in [(CreditNote, "nota_credito"), (DebitNote, "nota_debito")]:
        result = await db.execute(select(model).where(model.control_number == numero_control))
        doc = result.scalar_one_or_none()
        if doc:
            return ValidarDocumentoResponse(
                es_valido=True,
                numero_control=numero_control,
                tipo_documento=tipo,
                numero_documento=doc.document_number,
                emisor_rif=doc.emisor_rif,
                receptor_rif=doc.receptor_rif,
                fecha_emision=doc.fecha_emision,
                total=float(doc.total),
                status=doc.status,
            )

    return ValidarDocumentoResponse(
        es_valido=False,
        numero_control=numero_control,
    )


@router.get(
    "/status",
    summary="Estado de la cuenta",
    description="Muestra el estado de la cuenta: números de control disponibles, plan, límites.",
)
async def account_status(
    client: Client = Depends(get_client_from_api_key),
    db: AsyncSession = Depends(get_db),
):
    control_stats = await get_available_count(db, client.id)

    # Documentos emitidos este mes
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    docs_count = (await db.execute(
        select(func.count(Invoice.id)).where(
            Invoice.client_id == client.id,
            Invoice.fecha_emision >= month_start,
        )
    )).scalar() or 0

    return {
        "client": {
            "rif": client.rif,
            "razon_social": client.razon_social,
            "plan": client.plan,
            "is_active": client.is_active,
        },
        "limites": {
            "documentos_mes": client.max_documentos_mes,
            "documentos_emitidos_mes": docs_count,
            "documentos_disponibles": max(0, client.max_documentos_mes - docs_count),
            "usuarios_max": client.max_usuarios,
            "almacenamiento_gb": client.max_almacenamiento_gb,
        },
        "numeros_control": control_stats,
    }


# ─────────────────────────────────────────────────────────────────────────────
# POST /fiscal/validate-seniat  →  Validar documento según reglas SENIAT V1.4
# ─────────────────────────────────────────────────────────────────────────────
@router.post(
    "/validate-seniat",
    summary="Validar documento contra reglas SENIAT V1.4",
    description="""
    Valida un documento fiscal JSON contra todas las reglas oficiales del SENIAT
    (GGTIC.GIT.00.02 / Versión 1.4) **sin emitirlo**. Útil para:
    - Pre-validar documentos antes de emitir
    - Diagnosticar errores en la integración del cliente
    - Testing de la estructura JSON del ERP del cliente

    Retorna la lista detallada de errores con códigos SENIAT oficiales.
    """,
    tags=["Fiscal - Validación SENIAT"],
)
async def validate_seniat_document(
    request: Request,
    client: Client = Depends(get_client_from_api_key),
):
    """Valida un documento fiscal contra las reglas SENIAT V1.4 sin emitirlo."""
    body = await request.json()

    validator = SeniatValidator()
    validation = validator.validate(body)

    status_code = 200 if validation.is_valid else 203

    return {
        "status": status_code,
        "is_valid": validation.is_valid,
        "total_errors": len(validation.errors),
        "total_warnings": len(validation.warnings),
        "client": {
            "rif": client.rif,
            "razon_social": client.razon_social,
        },
        "errors": [e.to_dict() for e in validation.errors],
        "warnings": [w.to_dict() for w in validation.warnings],
    }

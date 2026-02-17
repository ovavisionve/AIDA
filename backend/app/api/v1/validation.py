"""Portal 3 - Validación Pública de Documentos Fiscales."""
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from pydantic import BaseModel

router = APIRouter()


# --- Schemas ---

class DocumentValidationResult(BaseModel):
    found: bool
    document_type: str | None = None
    numero_control: str | None = None
    numero_documento: str | None = None
    fecha_emision: str | None = None
    rif_emisor: str | None = None
    razon_social_emisor: str | None = None
    rif_receptor: str | None = None
    razon_social_receptor: str | None = None
    subtotal: float | None = None
    iva: float | None = None
    total: float | None = None
    moneda: str | None = None
    status: str | None = None
    uuid: str | None = None
    hash_seguridad: str | None = None


class DocumentDetailResult(DocumentValidationResult):
    items: list[dict] = []
    notas: str | None = None
    condiciones_pago: str | None = None
    fecha_vencimiento: str | None = None


class RifDocumentSummary(BaseModel):
    rif: str
    total_documents: int
    documents: list[DocumentValidationResult]


class RifStats(BaseModel):
    rif: str
    total_facturas: int
    total_notas_credito: int
    total_notas_debito: int
    monto_total_facturado: float
    monto_total_iva: float


# --- Helpers ---

def _get_document_models():
    from app.models.documents import Invoice, CreditNote, DebitNote
    return Invoice, CreditNote, DebitNote


def _doc_to_result(doc, doc_type: str) -> DocumentValidationResult:
    """Convert an Invoice/CreditNote/DebitNote to a validation result.

    Model field mapping:
      control_number, emisor_rif, emisor_razon_social,
      receptor_rif, receptor_razon_social, total, uuid_seniat
    Invoice IVA: monto_iva_16 + monto_iva_8
    CreditNote/DebitNote IVA: monto_iva
    """
    # IVA: invoices split into monto_iva_16 + monto_iva_8; notes have monto_iva
    iva = getattr(doc, "monto_iva", None)
    if iva is None:
        iva_16 = getattr(doc, "monto_iva_16", 0) or 0
        iva_8 = getattr(doc, "monto_iva_8", 0) or 0
        iva = float(iva_16) + float(iva_8)

    return DocumentValidationResult(
        found=True,
        document_type=doc_type,
        numero_control=doc.control_number,
        numero_documento=doc.document_number,
        fecha_emision=str(doc.fecha_emision) if doc.fecha_emision else None,
        rif_emisor=doc.emisor_rif,
        razon_social_emisor=doc.emisor_razon_social,
        rif_receptor=doc.receptor_rif,
        razon_social_receptor=doc.receptor_razon_social,
        subtotal=float(doc.base_imponible) if getattr(doc, "base_imponible", None) else float(doc.subtotal) if doc.subtotal else None,
        iva=float(iva) if iva else None,
        total=float(doc.total) if doc.total else None,
        moneda=getattr(doc, "moneda", "VES"),
        status=doc.status,
        uuid=str(doc.uuid_seniat) if doc.uuid_seniat else None,
        hash_seguridad=getattr(doc, "firma_digital", None),
    )


def _doc_to_detail(doc, doc_type: str) -> DocumentDetailResult:
    base = _doc_to_result(doc, doc_type)
    items = []
    if hasattr(doc, "items") and doc.items:
        for item in doc.items:
            items.append({
                "descripcion": item.description,
                "cantidad": float(item.quantity),
                "precio_unitario": float(item.unit_price),
                "subtotal": float(item.subtotal),
            })
    return DocumentDetailResult(
        **base.model_dump(),
        items=items,
        notas=getattr(doc, "observaciones", None),
        condiciones_pago=getattr(doc, "condicion_pago", None),
        fecha_vencimiento=str(doc.fecha_vencimiento) if getattr(doc, "fecha_vencimiento", None) else None,
    )


# --- Endpoints (públicos, sin autenticación) ---

@router.get("/verify/{nc}", response_model=DocumentValidationResult)
async def verify_document(
    nc: str,
    db: AsyncSession = Depends(get_db),
):
    """Verificar un documento fiscal por número de control."""
    Invoice, CreditNote, DebitNote = _get_document_models()

    result = await db.execute(select(Invoice).where(Invoice.control_number == nc))
    doc = result.scalar_one_or_none()
    if doc:
        return _doc_to_result(doc, "factura")

    result = await db.execute(select(CreditNote).where(CreditNote.control_number == nc))
    doc = result.scalar_one_or_none()
    if doc:
        return _doc_to_result(doc, "nota_credito")

    result = await db.execute(select(DebitNote).where(DebitNote.control_number == nc))
    doc = result.scalar_one_or_none()
    if doc:
        return _doc_to_result(doc, "nota_debito")

    return DocumentValidationResult(found=False)


@router.get("/verify/{nc}/detail", response_model=DocumentDetailResult)
async def verify_document_detail(
    nc: str,
    db: AsyncSession = Depends(get_db),
):
    """Obtener detalle completo de un documento fiscal."""
    Invoice, CreditNote, DebitNote = _get_document_models()

    result = await db.execute(select(Invoice).where(Invoice.control_number == nc))
    doc = result.scalar_one_or_none()
    if doc:
        return _doc_to_detail(doc, "factura")

    result = await db.execute(select(CreditNote).where(CreditNote.control_number == nc))
    doc = result.scalar_one_or_none()
    if doc:
        return _doc_to_detail(doc, "nota_credito")

    result = await db.execute(select(DebitNote).where(DebitNote.control_number == nc))
    doc = result.scalar_one_or_none()
    if doc:
        return _doc_to_detail(doc, "nota_debito")

    raise HTTPException(status_code=404, detail="Documento no encontrado")


@router.get("/by-uuid/{doc_uuid}", response_model=DocumentValidationResult)
async def verify_by_uuid(
    doc_uuid: str,
    db: AsyncSession = Depends(get_db),
):
    """Verificar un documento por UUID."""
    Invoice, CreditNote, DebitNote = _get_document_models()

    result = await db.execute(select(Invoice).where(Invoice.uuid_seniat == doc_uuid))
    doc = result.scalar_one_or_none()
    if doc:
        return _doc_to_result(doc, "factura")

    result = await db.execute(select(CreditNote).where(CreditNote.uuid_seniat == doc_uuid))
    doc = result.scalar_one_or_none()
    if doc:
        return _doc_to_result(doc, "nota_credito")

    result = await db.execute(select(DebitNote).where(DebitNote.uuid_seniat == doc_uuid))
    doc = result.scalar_one_or_none()
    if doc:
        return _doc_to_result(doc, "nota_debito")

    return DocumentValidationResult(found=False)


@router.get("/by-rif/{rif}", response_model=RifDocumentSummary)
async def documents_by_rif(
    rif: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Buscar documentos emitidos por un RIF."""
    Invoice, CreditNote, DebitNote = _get_document_models()
    documents = []

    result = await db.execute(
        select(Invoice).where(Invoice.emisor_rif == rif)
        .order_by(Invoice.fecha_emision.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )
    for doc in result.scalars().all():
        documents.append(_doc_to_result(doc, "factura"))

    result = await db.execute(
        select(CreditNote).where(CreditNote.emisor_rif == rif)
        .order_by(CreditNote.fecha_emision.desc())
        .limit(page_size)
    )
    for doc in result.scalars().all():
        documents.append(_doc_to_result(doc, "nota_credito"))

    result = await db.execute(
        select(DebitNote).where(DebitNote.emisor_rif == rif)
        .order_by(DebitNote.fecha_emision.desc())
        .limit(page_size)
    )
    for doc in result.scalars().all():
        documents.append(_doc_to_result(doc, "nota_debito"))

    total = 0
    for Model in [Invoice, CreditNote, DebitNote]:
        count = await db.execute(select(func.count(Model.id)).where(Model.emisor_rif == rif))
        total += count.scalar() or 0

    return RifDocumentSummary(rif=rif, total_documents=total, documents=documents)


@router.get("/stats/{rif}", response_model=RifStats)
async def rif_stats(
    rif: str,
    db: AsyncSession = Depends(get_db),
):
    """Estadísticas fiscales de un RIF."""
    Invoice, CreditNote, DebitNote = _get_document_models()

    inv_count = (await db.execute(select(func.count(Invoice.id)).where(Invoice.emisor_rif == rif))).scalar() or 0
    cn_count = (await db.execute(select(func.count(CreditNote.id)).where(CreditNote.emisor_rif == rif))).scalar() or 0
    dn_count = (await db.execute(select(func.count(DebitNote.id)).where(DebitNote.emisor_rif == rif))).scalar() or 0

    total_amount = (await db.execute(
        select(func.coalesce(func.sum(Invoice.total), 0)).where(Invoice.emisor_rif == rif)
    )).scalar() or 0

    total_iva = (await db.execute(
        select(func.coalesce(func.sum(Invoice.monto_iva_16 + Invoice.monto_iva_8), 0)).where(Invoice.emisor_rif == rif)
    )).scalar() or 0

    return RifStats(
        rif=rif,
        total_facturas=inv_count,
        total_notas_credito=cn_count,
        total_notas_debito=dn_count,
        monto_total_facturado=float(total_amount),
        monto_total_iva=float(total_iva),
    )

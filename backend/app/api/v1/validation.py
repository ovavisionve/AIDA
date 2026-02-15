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


def _invoice_to_result(doc, doc_type: str) -> DocumentValidationResult:
    return DocumentValidationResult(
        found=True,
        document_type=doc_type,
        numero_control=doc.numero_control,
        numero_documento=getattr(doc, "numero_documento", None) or doc.numero_control,
        fecha_emision=str(doc.fecha_emision) if doc.fecha_emision else None,
        rif_emisor=doc.rif_emisor,
        razon_social_emisor=getattr(doc, "razon_social_emisor", None),
        rif_receptor=doc.rif_receptor,
        razon_social_receptor=getattr(doc, "razon_social_receptor", None),
        subtotal=float(doc.base_imponible) if doc.base_imponible else None,
        iva=float(doc.monto_iva) if doc.monto_iva else None,
        total=float(doc.monto_total) if doc.monto_total else None,
        moneda=getattr(doc, "moneda", "VES"),
        status=doc.status,
        uuid=str(doc.uuid_documento) if getattr(doc, "uuid_documento", None) else None,
        hash_seguridad=getattr(doc, "hash_seguridad", None),
    )


def _invoice_to_detail(doc, doc_type: str) -> DocumentDetailResult:
    base = _invoice_to_result(doc, doc_type)
    items = []
    if hasattr(doc, "items") and doc.items:
        for item in doc.items:
            items.append({
                "descripcion": getattr(item, "descripcion", ""),
                "cantidad": float(getattr(item, "cantidad", 0)),
                "precio_unitario": float(getattr(item, "precio_unitario", 0)),
                "subtotal": float(getattr(item, "subtotal", 0)),
            })
    return DocumentDetailResult(
        **base.model_dump(),
        items=items,
        notas=getattr(doc, "notas", None),
        condiciones_pago=getattr(doc, "condiciones_pago", None),
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

    # Search in invoices
    result = await db.execute(select(Invoice).where(Invoice.numero_control == nc))
    doc = result.scalar_one_or_none()
    if doc:
        return _invoice_to_result(doc, "factura")

    # Search in credit notes
    result = await db.execute(select(CreditNote).where(CreditNote.numero_control == nc))
    doc = result.scalar_one_or_none()
    if doc:
        return _invoice_to_result(doc, "nota_credito")

    # Search in debit notes
    result = await db.execute(select(DebitNote).where(DebitNote.numero_control == nc))
    doc = result.scalar_one_or_none()
    if doc:
        return _invoice_to_result(doc, "nota_debito")

    return DocumentValidationResult(found=False)


@router.get("/verify/{nc}/detail", response_model=DocumentDetailResult)
async def verify_document_detail(
    nc: str,
    db: AsyncSession = Depends(get_db),
):
    """Obtener detalle completo de un documento fiscal."""
    Invoice, CreditNote, DebitNote = _get_document_models()

    result = await db.execute(select(Invoice).where(Invoice.numero_control == nc))
    doc = result.scalar_one_or_none()
    if doc:
        return _invoice_to_detail(doc, "factura")

    result = await db.execute(select(CreditNote).where(CreditNote.numero_control == nc))
    doc = result.scalar_one_or_none()
    if doc:
        return _invoice_to_detail(doc, "nota_credito")

    result = await db.execute(select(DebitNote).where(DebitNote.numero_control == nc))
    doc = result.scalar_one_or_none()
    if doc:
        return _invoice_to_detail(doc, "nota_debito")

    raise HTTPException(status_code=404, detail="Documento no encontrado")


@router.get("/by-uuid/{doc_uuid}", response_model=DocumentValidationResult)
async def verify_by_uuid(
    doc_uuid: str,
    db: AsyncSession = Depends(get_db),
):
    """Verificar un documento por UUID."""
    Invoice, CreditNote, DebitNote = _get_document_models()

    try:
        uid = uuid.UUID(doc_uuid)
    except ValueError:
        raise HTTPException(status_code=400, detail="UUID inválido")

    result = await db.execute(select(Invoice).where(Invoice.uuid_documento == uid))
    doc = result.scalar_one_or_none()
    if doc:
        return _invoice_to_result(doc, "factura")

    result = await db.execute(select(CreditNote).where(CreditNote.uuid_documento == uid))
    doc = result.scalar_one_or_none()
    if doc:
        return _invoice_to_result(doc, "nota_credito")

    result = await db.execute(select(DebitNote).where(DebitNote.uuid_documento == uid))
    doc = result.scalar_one_or_none()
    if doc:
        return _invoice_to_result(doc, "nota_debito")

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

    # Invoices
    result = await db.execute(
        select(Invoice).where(Invoice.rif_emisor == rif)
        .order_by(Invoice.fecha_emision.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )
    for doc in result.scalars().all():
        documents.append(_invoice_to_result(doc, "factura"))

    # Credit notes
    result = await db.execute(
        select(CreditNote).where(CreditNote.rif_emisor == rif)
        .order_by(CreditNote.fecha_emision.desc())
        .limit(page_size)
    )
    for doc in result.scalars().all():
        documents.append(_invoice_to_result(doc, "nota_credito"))

    # Debit notes
    result = await db.execute(
        select(DebitNote).where(DebitNote.rif_emisor == rif)
        .order_by(DebitNote.fecha_emision.desc())
        .limit(page_size)
    )
    for doc in result.scalars().all():
        documents.append(_invoice_to_result(doc, "nota_debito"))

    # Count total
    total = 0
    for Model in [Invoice, CreditNote, DebitNote]:
        count = await db.execute(select(func.count(Model.id)).where(Model.rif_emisor == rif))
        total += count.scalar() or 0

    return RifDocumentSummary(rif=rif, total_documents=total, documents=documents)


@router.get("/stats/{rif}", response_model=RifStats)
async def rif_stats(
    rif: str,
    db: AsyncSession = Depends(get_db),
):
    """Estadísticas fiscales de un RIF."""
    Invoice, CreditNote, DebitNote = _get_document_models()

    inv_count = (await db.execute(select(func.count(Invoice.id)).where(Invoice.rif_emisor == rif))).scalar() or 0
    cn_count = (await db.execute(select(func.count(CreditNote.id)).where(CreditNote.rif_emisor == rif))).scalar() or 0
    dn_count = (await db.execute(select(func.count(DebitNote.id)).where(DebitNote.rif_emisor == rif))).scalar() or 0

    total_amount = (await db.execute(
        select(func.coalesce(func.sum(Invoice.monto_total), 0)).where(Invoice.rif_emisor == rif)
    )).scalar() or 0

    total_iva = (await db.execute(
        select(func.coalesce(func.sum(Invoice.monto_iva), 0)).where(Invoice.rif_emisor == rif)
    )).scalar() or 0

    return RifStats(
        rif=rif,
        total_facturas=inv_count,
        total_notas_credito=cn_count,
        total_notas_debito=dn_count,
        monto_total_facturado=float(total_amount),
        monto_total_iva=float(total_iva),
    )

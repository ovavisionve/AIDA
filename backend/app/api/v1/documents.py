"""Portal 1 - Visualización de Documentos y Dashboard Cliente."""
import uuid
import math
from datetime import datetime, date, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import select, func, or_, and_, extract
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.core.deps import get_current_user, get_client_id_from_token, log_audit
from app.models.security import User
from app.models.documents import Invoice, CreditNote, DebitNote, DispatchGuide, Withholding
from app.models.clients import ClientUser
from app.schemas.documents import (
    InvoiceResponse, DocumentListResponse, DocumentFilter, DashboardStats,
)

router = APIRouter()


async def _get_user_client_ids(user: User, db: AsyncSession) -> list[uuid.UUID]:
    """Get all client IDs the user belongs to."""
    result = await db.execute(
        select(ClientUser.client_id).where(ClientUser.user_id == user.id, ClientUser.is_active == True)
    )
    return [row[0] for row in result.all()]


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    client_ids = await _get_user_client_ids(user, db)
    if not client_ids and not user.is_superadmin:
        raise HTTPException(status_code=403, detail="No tiene clientes asociados")

    now = datetime.now(timezone.utc)
    first_day_current = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    first_day_previous = (first_day_current - timedelta(days=1)).replace(day=1)

    base_filter = Invoice.client_id.in_(client_ids) if not user.is_superadmin else True

    # Total documents this month
    total_month = (await db.execute(
        select(func.count(Invoice.id)).where(
            base_filter,
            Invoice.fecha_emision >= first_day_current,
        )
    )).scalar() or 0

    # Total billed current month
    total_billed_current = (await db.execute(
        select(func.coalesce(func.sum(Invoice.total), 0)).where(
            base_filter,
            Invoice.fecha_emision >= first_day_current,
            Invoice.status != "anulado",
        )
    )).scalar() or 0

    # Total billed previous month
    total_billed_previous = (await db.execute(
        select(func.coalesce(func.sum(Invoice.total), 0)).where(
            base_filter,
            Invoice.fecha_emision >= first_day_previous,
            Invoice.fecha_emision < first_day_current,
            Invoice.status != "anulado",
        )
    )).scalar() or 0

    # Documents by status
    status_result = await db.execute(
        select(Invoice.status, func.count(Invoice.id)).where(base_filter).group_by(Invoice.status)
    )
    docs_by_status = {row[0]: row[1] for row in status_result.all()}

    # Recent documents
    recent_result = await db.execute(
        select(Invoice)
        .where(base_filter)
        .options(selectinload(Invoice.items))
        .order_by(Invoice.fecha_emision.desc())
        .limit(10)
    )
    recent = recent_result.scalars().all()

    return DashboardStats(
        total_documents_month=total_month,
        total_pending_download=0,
        total_billed_current=float(total_billed_current),
        total_billed_previous=float(total_billed_previous),
        documents_by_status=docs_by_status,
        recent_documents=[InvoiceResponse.model_validate(d) for d in recent],
    )


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    document_type: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    document_number: str | None = None,
    rif: str | None = None,
    status: str | None = None,
    control_number: str | None = None,
    forma_pago: str | None = None,
    amount_min: float | None = None,
    amount_max: float | None = None,
    search: str | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    client_ids = await _get_user_client_ids(user, db)
    if not client_ids and not user.is_superadmin:
        raise HTTPException(status_code=403, detail="No tiene clientes asociados")

    query = select(Invoice).options(selectinload(Invoice.items))

    if not user.is_superadmin:
        query = query.where(Invoice.client_id.in_(client_ids))

    if date_from:
        query = query.where(Invoice.fecha_emision >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        query = query.where(Invoice.fecha_emision <= datetime.combine(date_to, datetime.max.time()))
    if document_number:
        query = query.where(Invoice.document_number.ilike(f"%{document_number}%"))
    if rif:
        query = query.where(
            or_(Invoice.emisor_rif.ilike(f"%{rif}%"), Invoice.receptor_rif.ilike(f"%{rif}%"))
        )
    if status:
        query = query.where(Invoice.status == status)
    if control_number:
        query = query.where(Invoice.control_number.ilike(f"%{control_number}%"))
    if forma_pago:
        query = query.where(Invoice.forma_pago == forma_pago)
    if amount_min is not None:
        query = query.where(Invoice.total >= amount_min)
    if amount_max is not None:
        query = query.where(Invoice.total <= amount_max)
    if search:
        query = query.where(
            or_(
                Invoice.document_number.ilike(f"%{search}%"),
                Invoice.receptor_razon_social.ilike(f"%{search}%"),
                Invoice.receptor_rif.ilike(f"%{search}%"),
                Invoice.control_number.ilike(f"%{search}%"),
            )
        )

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    query = query.order_by(Invoice.fecha_emision.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    invoices = result.scalars().all()

    return DocumentListResponse(
        items=[InvoiceResponse.model_validate(i) for i in invoices],
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size) if total > 0 else 0,
    )


@router.get("/{document_id}", response_model=InvoiceResponse)
async def get_document(
    document_id: uuid.UUID,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Invoice)
        .where(Invoice.id == document_id)
        .options(selectinload(Invoice.items))
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    # Verify access
    if not user.is_superadmin:
        client_ids = await _get_user_client_ids(user, db)
        if doc.client_id not in client_ids:
            raise HTTPException(status_code=403, detail="No tiene acceso a este documento")

    await log_audit(db, user.id, "view", "invoice", str(doc.id), request=request, client_id=doc.client_id)

    return InvoiceResponse.model_validate(doc)

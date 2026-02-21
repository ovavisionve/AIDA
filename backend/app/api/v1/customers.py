"""Portal 2 - Gestión de Clientes Finales (los clientes de los facturadores)."""
import uuid
import math
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.deps import get_current_user, log_audit
from app.models.security import User
from app.models.customers import Customer
from app.models.clients import ClientUser
from app.schemas.customers import (
    CustomerCreate, CustomerUpdate, CustomerResponse, CustomerListResponse,
)

router = APIRouter()


async def _get_client_id(user: User, db: AsyncSession) -> uuid.UUID:
    result = await db.execute(
        select(ClientUser.client_id).where(
            ClientUser.user_id == user.id, ClientUser.is_active == True
        ).limit(1)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=403, detail="No tiene un cliente asociado")
    return row[0]


@router.get("", response_model=CustomerListResponse)
async def list_customers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    is_active: bool | None = True,
    categoria: str | None = None,
    is_moroso: bool | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    client_id = await _get_client_id(user, db)
    query = select(Customer).where(Customer.client_id == client_id)

    if search:
        query = query.where(
            or_(
                Customer.rif.ilike(f"%{search}%"),
                Customer.razon_social.ilike(f"%{search}%"),
                Customer.nombre_comercial.ilike(f"%{search}%"),
                Customer.email.ilike(f"%{search}%"),
                Customer.telefono_principal.ilike(f"%{search}%"),
            )
        )
    if is_active is not None:
        query = query.where(Customer.is_active == is_active)
    if categoria:
        query = query.where(Customer.categoria == categoria)
    if is_moroso is not None:
        query = query.where(Customer.is_moroso == is_moroso)

    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    query = query.order_by(Customer.razon_social).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)

    return CustomerListResponse(
        items=[CustomerResponse.model_validate(c) for c in result.scalars().all()],
        total=total, page=page, page_size=page_size,
        pages=math.ceil(total / page_size) if total > 0 else 0,
    )


@router.get("/autocomplete")
async def autocomplete_customers(
    q: str = Query("", description="Texto de búsqueda"),
    limit: int = Query(50, ge=1, le=200),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Búsqueda rápida para autocompletado — sin count, solo campos esenciales."""
    client_id = await _get_client_id(user, db)
    query = (
        select(
            Customer.id, Customer.rif, Customer.razon_social,
            Customer.nombre_comercial, Customer.direccion_fiscal,
            Customer.email, Customer.telefono_principal, Customer.condicion_pago,
        )
        .where(Customer.client_id == client_id, Customer.is_active == True)
    )
    if q and len(q) >= 2:
        query = query.where(
            or_(
                Customer.rif.ilike(f"{q}%"),
                Customer.razon_social.ilike(f"%{q}%"),
                Customer.nombre_comercial.ilike(f"%{q}%"),
            )
        )
    result = await db.execute(query.order_by(Customer.razon_social).limit(limit))
    return [
        {
            "id": str(r.id), "rif": r.rif, "razon_social": r.razon_social,
            "nombre_comercial": r.nombre_comercial, "direccion_fiscal": r.direccion_fiscal,
            "email": r.email, "telefono_principal": r.telefono_principal,
            "condicion_pago": r.condicion_pago,
        }
        for r in result.all()
    ]


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    client_id = await _get_client_id(user, db)
    result = await db.execute(
        select(Customer).where(Customer.id == customer_id, Customer.client_id == client_id)
    )
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return CustomerResponse.model_validate(customer)


@router.get("/rif/{rif}", response_model=CustomerResponse)
async def get_customer_by_rif(
    rif: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Búsqueda rápida por RIF — usado en el autocompletado de facturas."""
    client_id = await _get_client_id(user, db)
    result = await db.execute(
        select(Customer).where(Customer.rif == rif, Customer.client_id == client_id)
    )
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado con ese RIF")
    return CustomerResponse.model_validate(customer)


@router.post("", response_model=CustomerResponse, status_code=201)
async def create_customer(
    data: CustomerCreate,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    client_id = await _get_client_id(user, db)

    existing = await db.execute(
        select(Customer).where(Customer.client_id == client_id, Customer.rif == data.rif)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Ya existe un cliente con RIF {data.rif}")

    customer = Customer(client_id=client_id, **data.model_dump())
    db.add(customer)
    await db.flush()
    await db.refresh(customer)

    await log_audit(db, user.id, "create", "customer", str(customer.id), request=request, client_id=client_id)
    return CustomerResponse.model_validate(customer)


@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: uuid.UUID,
    data: CustomerUpdate,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    client_id = await _get_client_id(user, db)
    result = await db.execute(
        select(Customer).where(Customer.id == customer_id, Customer.client_id == client_id)
    )
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(customer, field, value)

    await db.flush()
    await db.refresh(customer)
    await log_audit(db, user.id, "update", "customer", str(customer.id), request=request, client_id=client_id)
    return CustomerResponse.model_validate(customer)


@router.delete("/{customer_id}")
async def delete_customer(
    customer_id: uuid.UUID,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    client_id = await _get_client_id(user, db)
    result = await db.execute(
        select(Customer).where(Customer.id == customer_id, Customer.client_id == client_id)
    )
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    customer.is_active = False
    await log_audit(db, user.id, "deactivate", "customer", str(customer.id), request=request, client_id=client_id)
    return {"message": "Cliente desactivado"}


@router.get("/{customer_id}/account-statement")
async def customer_account_statement(
    customer_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Estado de cuenta del cliente: facturas, NC, pagos, saldo."""
    client_id = await _get_client_id(user, db)

    result = await db.execute(
        select(Customer).where(Customer.id == customer_id, Customer.client_id == client_id)
    )
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    from app.models.documents import Invoice, CreditNote

    # Facturas del cliente
    invoices_result = await db.execute(
        select(Invoice).where(
            Invoice.client_id == client_id,
            Invoice.receptor_rif == customer.rif,
            Invoice.status != "anulado",
        ).order_by(Invoice.fecha_emision.desc())
    )
    invoices = invoices_result.scalars().all()

    total_facturado = sum(float(inv.total) for inv in invoices)

    # Notas de crédito
    cn_result = await db.execute(
        select(CreditNote).where(
            CreditNote.client_id == client_id,
            CreditNote.receptor_rif == customer.rif,
            CreditNote.status != "anulado",
        )
    )
    credit_notes = cn_result.scalars().all()
    total_nc = sum(float(cn.total) for cn in credit_notes)

    return {
        "customer": {
            "rif": customer.rif,
            "razon_social": customer.razon_social,
            "limite_credito": float(customer.limite_credito),
        },
        "resumen": {
            "total_facturado": total_facturado,
            "total_notas_credito": total_nc,
            "saldo_pendiente": total_facturado - total_nc,
            "facturas_count": len(invoices),
        },
        "facturas": [
            {
                "id": str(inv.id),
                "numero": inv.document_number,
                "control": inv.control_number,
                "fecha": inv.fecha_emision.isoformat(),
                "total": float(inv.total),
                "status": inv.status,
            }
            for inv in invoices[:20]
        ],
    }

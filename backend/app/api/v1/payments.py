"""API de pagos para AIDA - gestión de cobros y suscripciones."""
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.database import get_db
from app.core.deps import get_current_user, log_audit
from app.models.security import User
from app.services.payments.gateway import get_payment_gateway

router = APIRouter()


# --- Schemas ---

class CreatePaymentRequest(BaseModel):
    client_id: uuid.UUID
    amount: float
    currency: str = "USD"
    payment_method: str = "transferencia"
    description: str = "Suscripción AIDA"
    subscription_id: uuid.UUID | None = None
    reference_number: str | None = None
    bank_name: str | None = None
    payer_name: str | None = None
    payer_email: str | None = None


class ConfirmPaymentRequest(BaseModel):
    notes: str | None = None


class ManualPaymentRequest(BaseModel):
    reference_number: str
    bank_name: str | None = None


class PaymentResponse(BaseModel):
    id: str
    client_id: str
    amount: float
    currency: str
    payment_method: str
    status: str
    reference_number: str | None
    invoice_number: str | None
    description: str
    created_at: str
    paid_at: str | None


def _payment_to_response(p) -> PaymentResponse:
    return PaymentResponse(
        id=str(p.id),
        client_id=str(p.client_id),
        amount=float(p.amount),
        currency=p.currency,
        payment_method=p.payment_method,
        status=p.status,
        reference_number=p.reference_number,
        invoice_number=p.invoice_number,
        description=p.description,
        created_at=p.created_at.isoformat(),
        paid_at=p.paid_at.isoformat() if p.paid_at else None,
    )


# --- Endpoints ---

@router.post("/payments", response_model=PaymentResponse)
async def create_payment(
    data: CreatePaymentRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Crear un nuevo registro de pago."""
    gw = get_payment_gateway(db)
    payment = await gw.create_payment(
        client_id=data.client_id,
        amount=data.amount,
        currency=data.currency,
        payment_method=data.payment_method,
        description=data.description,
        subscription_id=data.subscription_id,
        reference_number=data.reference_number,
        bank_name=data.bank_name,
        payer_name=data.payer_name,
        payer_email=data.payer_email,
    )
    await log_audit(db, user.id, "create", "payment", str(payment.id), request=request)
    return _payment_to_response(payment)


@router.get("/payments")
async def list_payments(
    client_id: uuid.UUID | None = None,
    status: str | None = None,
    page: int = 1,
    per_page: int = 20,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Listar pagos con filtros y paginación."""
    if not client_id:
        raise HTTPException(400, "client_id es requerido")

    gw = get_payment_gateway(db)
    payments, total = await gw.get_client_payments(client_id, status, page, per_page)
    return {
        "items": [_payment_to_response(p) for p in payments],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.get("/payments/{payment_id}/summary")
async def payment_summary(
    payment_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Resumen de pagos de un cliente (usa client_id del path como payment context)."""
    gw = get_payment_gateway(db)
    return await gw.get_payment_summary(payment_id)


@router.post("/payments/{payment_id}/process-manual")
async def process_manual(
    payment_id: uuid.UUID,
    data: ManualPaymentRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Registrar datos de pago manual (transferencia, pago movil, etc)."""
    gw = get_payment_gateway(db)
    payment = await gw.process_manual_payment(payment_id, data.reference_number, data.bank_name)
    await log_audit(db, user.id, "update", "payment", str(payment_id), request=request)
    return _payment_to_response(payment)


@router.post("/payments/{payment_id}/confirm")
async def confirm_payment(
    payment_id: uuid.UUID,
    data: ConfirmPaymentRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Confirmar un pago (acción de admin)."""
    gw = get_payment_gateway(db)
    payment = await gw.confirm_payment(payment_id, verified_by=user.id, notes=data.notes)
    await log_audit(db, user.id, "confirm", "payment", str(payment_id), request=request)
    return _payment_to_response(payment)


@router.post("/payments/{payment_id}/fail")
async def fail_payment(
    payment_id: uuid.UUID,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Marcar un pago como fallido."""
    gw = get_payment_gateway(db)
    payment = await gw.fail_payment(payment_id)
    await log_audit(db, user.id, "fail", "payment", str(payment_id), request=request)
    return _payment_to_response(payment)


@router.post("/payments/{payment_id}/refund")
async def refund_payment(
    payment_id: uuid.UUID,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Reembolsar un pago completado."""
    gw = get_payment_gateway(db)
    payment = await gw.refund_payment(payment_id)
    await log_audit(db, user.id, "refund", "payment", str(payment_id), request=request)
    return _payment_to_response(payment)


@router.get("/payments/client/{client_id}/summary")
async def client_payment_summary(
    client_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Resumen de pagos de un cliente."""
    gw = get_payment_gateway(db)
    return await gw.get_payment_summary(client_id)

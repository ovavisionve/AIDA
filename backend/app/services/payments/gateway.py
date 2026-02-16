"""
Payment gateway abstraction for AIDA.

Supports multiple payment methods common in Venezuela:
- Manual transfers (bank transfer, pago movil, zelle)
- Stripe (for international credit card payments)
- PayPal
- MercadoPago (LATAM)

Each gateway implements the same interface so the API layer
doesn't need to know which provider is being used.
"""
import uuid
import structlog
from datetime import datetime, timezone
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payments import Payment, PaymentTransaction
from app.models.clients import Client, ClientSubscription
from app.config import get_settings

logger = structlog.get_logger()


class PaymentGateway:
    """Unified payment processing service."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.settings = get_settings()

    async def create_payment(
        self,
        client_id: uuid.UUID,
        amount: float,
        currency: str = "USD",
        payment_method: str = "transferencia",
        description: str = "Suscripción AIDA",
        subscription_id: uuid.UUID | None = None,
        reference_number: str | None = None,
        bank_name: str | None = None,
        payer_name: str | None = None,
        payer_email: str | None = None,
        period_start: datetime | None = None,
        period_end: datetime | None = None,
    ) -> Payment:
        """Create a new payment record."""
        payment = Payment(
            client_id=client_id,
            subscription_id=subscription_id,
            amount=amount,
            currency=currency,
            payment_method=payment_method,
            description=description,
            status="pending",
            reference_number=reference_number,
            bank_name=bank_name,
            payer_name=payer_name,
            payer_email=payer_email,
            period_start=period_start,
            period_end=period_end,
            invoice_number=await self._generate_invoice_number(),
        )
        self.db.add(payment)
        await self.db.flush()

        # Log creation event
        await self._log_transaction(payment.id, "created", "pending")

        logger.info("payment_created", payment_id=str(payment.id), amount=amount, currency=currency)
        return payment

    async def process_manual_payment(
        self,
        payment_id: uuid.UUID,
        reference_number: str,
        bank_name: str | None = None,
    ) -> Payment:
        """Process a manual payment (transfer, pago movil, zelle)."""
        payment = await self._get_payment(payment_id)
        payment.reference_number = reference_number
        payment.bank_name = bank_name
        payment.status = "processing"
        payment.gateway = "manual"

        await self._log_transaction(payment.id, "processing", "processing")
        return payment

    async def confirm_payment(
        self,
        payment_id: uuid.UUID,
        verified_by: uuid.UUID | None = None,
        notes: str | None = None,
    ) -> Payment:
        """Confirm/complete a payment (admin action for manual payments)."""
        payment = await self._get_payment(payment_id)

        if payment.status == "completed":
            return payment

        payment.status = "completed"
        payment.paid_at = datetime.now(timezone.utc)
        payment.verified_by = verified_by
        payment.verified_at = datetime.now(timezone.utc)
        payment.notes = notes

        # Activate/extend subscription if linked
        if payment.subscription_id:
            await self._activate_subscription(payment.subscription_id)

        await self._log_transaction(payment.id, "completed", "completed")
        logger.info("payment_confirmed", payment_id=str(payment_id))
        return payment

    async def fail_payment(
        self,
        payment_id: uuid.UUID,
        reason: str = "Payment failed",
    ) -> Payment:
        """Mark a payment as failed."""
        payment = await self._get_payment(payment_id)
        payment.status = "failed"
        payment.failed_at = datetime.now(timezone.utc)
        payment.failure_reason = reason

        await self._log_transaction(payment.id, "failed", "failed")
        logger.warning("payment_failed", payment_id=str(payment_id), reason=reason)
        return payment

    async def refund_payment(
        self,
        payment_id: uuid.UUID,
        reason: str | None = None,
    ) -> Payment:
        """Initiate a refund for a completed payment."""
        payment = await self._get_payment(payment_id)

        if payment.status != "completed":
            raise ValueError("Solo se pueden reembolsar pagos completados")

        payment.status = "refunded"
        payment.notes = (payment.notes or "") + f"\nReembolso: {reason or 'Solicitado'}"

        await self._log_transaction(payment.id, "refund_completed", "refunded", amount=payment.amount)
        logger.info("payment_refunded", payment_id=str(payment_id))
        return payment

    async def get_client_payments(
        self,
        client_id: uuid.UUID,
        status: str | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[list[Payment], int]:
        """Get paginated list of payments for a client."""
        query = select(Payment).where(Payment.client_id == client_id)
        count_query = select(func.count(Payment.id)).where(Payment.client_id == client_id)

        if status:
            query = query.where(Payment.status == status)
            count_query = count_query.where(Payment.status == status)

        total = (await self.db.execute(count_query)).scalar() or 0

        result = await self.db.execute(
            query.order_by(Payment.created_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
        )
        payments = list(result.scalars().all())
        return payments, total

    async def get_payment_summary(self, client_id: uuid.UUID) -> dict:
        """Get payment summary for a client."""
        result = await self.db.execute(
            select(
                func.count(Payment.id),
                func.sum(Payment.amount),
            )
            .where(Payment.client_id == client_id, Payment.status == "completed")
        )
        row = result.one()
        total_payments = row[0] or 0
        total_amount = float(row[1] or 0)

        pending = (await self.db.execute(
            select(func.count(Payment.id))
            .where(Payment.client_id == client_id, Payment.status == "pending")
        )).scalar() or 0

        return {
            "total_payments": total_payments,
            "total_amount": round(total_amount, 2),
            "pending_payments": pending,
            "currency": "USD",
        }

    # --- Private helpers ---

    async def _get_payment(self, payment_id: uuid.UUID) -> Payment:
        result = await self.db.execute(
            select(Payment).where(Payment.id == payment_id)
        )
        payment = result.scalar_one_or_none()
        if not payment:
            raise ValueError(f"Pago {payment_id} no encontrado")
        return payment

    async def _generate_invoice_number(self) -> str:
        count = (await self.db.execute(
            select(func.count(Payment.id))
        )).scalar() or 0
        return f"AIDA-{datetime.now(timezone.utc).strftime('%Y%m')}-{count + 1:05d}"

    async def _log_transaction(
        self,
        payment_id: uuid.UUID,
        event_type: str,
        status: str,
        gateway_event_id: str | None = None,
        raw_response: str | None = None,
        amount: float | None = None,
    ):
        tx = PaymentTransaction(
            payment_id=payment_id,
            event_type=event_type,
            status=status,
            gateway_event_id=gateway_event_id,
            raw_response=raw_response,
            amount=amount,
        )
        self.db.add(tx)

    async def _activate_subscription(self, subscription_id: uuid.UUID):
        result = await self.db.execute(
            select(ClientSubscription).where(ClientSubscription.id == subscription_id)
        )
        sub = result.scalar_one_or_none()
        if sub:
            sub.status = "active"
            logger.info("subscription_activated", subscription_id=str(subscription_id))


def get_payment_gateway(db: AsyncSession) -> PaymentGateway:
    return PaymentGateway(db)

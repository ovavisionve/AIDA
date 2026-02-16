"""
Tests for the payment gateway service.

Verifies payment creation, confirmation, failure, and refund flows.
"""
import uuid
import pytest
import pytest_asyncio
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payments import Payment, PaymentTransaction
from app.models.clients import Client
from app.services.payments.gateway import PaymentGateway


@pytest.mark.asyncio
class TestPaymentGateway:
    """Tests for the PaymentGateway service."""

    async def test_create_payment(self, db: AsyncSession, test_client: Client):
        """Create a new payment."""
        gw = PaymentGateway(db)
        payment = await gw.create_payment(
            client_id=test_client.id,
            amount=99.99,
            currency="USD",
            payment_method="transferencia",
            description="Plan Profesional - Mensual",
        )

        assert payment.amount == 99.99
        assert payment.currency == "USD"
        assert payment.status == "pending"
        assert payment.invoice_number is not None
        assert payment.invoice_number.startswith("AIDA-")

    async def test_process_manual_payment(self, db: AsyncSession, test_client: Client):
        """Process a manual bank transfer."""
        gw = PaymentGateway(db)
        payment = await gw.create_payment(
            client_id=test_client.id,
            amount=50.00,
            payment_method="pago_movil",
        )

        updated = await gw.process_manual_payment(
            payment.id,
            reference_number="REF-2024-001",
            bank_name="Banco de Venezuela",
        )

        assert updated.status == "processing"
        assert updated.reference_number == "REF-2024-001"
        assert updated.bank_name == "Banco de Venezuela"

    async def test_confirm_payment(self, db: AsyncSession, test_client: Client, test_user):
        """Confirm a pending payment."""
        gw = PaymentGateway(db)
        payment = await gw.create_payment(
            client_id=test_client.id,
            amount=75.00,
        )

        confirmed = await gw.confirm_payment(
            payment.id,
            verified_by=test_user.id,
            notes="Verificado por admin",
        )

        assert confirmed.status == "completed"
        assert confirmed.paid_at is not None
        assert confirmed.verified_by == test_user.id

    async def test_fail_payment(self, db: AsyncSession, test_client: Client):
        """Mark a payment as failed."""
        gw = PaymentGateway(db)
        payment = await gw.create_payment(
            client_id=test_client.id,
            amount=100.00,
        )

        failed = await gw.fail_payment(payment.id, reason="Referencia inválida")

        assert failed.status == "failed"
        assert failed.failure_reason == "Referencia inválida"
        assert failed.failed_at is not None

    async def test_refund_completed_payment(self, db: AsyncSession, test_client: Client, test_user):
        """Refund a completed payment."""
        gw = PaymentGateway(db)
        payment = await gw.create_payment(
            client_id=test_client.id,
            amount=200.00,
        )
        await gw.confirm_payment(payment.id, verified_by=test_user.id)

        refunded = await gw.refund_payment(payment.id, reason="Cliente solicitó reembolso")

        assert refunded.status == "refunded"

    async def test_refund_pending_payment_fails(self, db: AsyncSession, test_client: Client):
        """Cannot refund a non-completed payment."""
        gw = PaymentGateway(db)
        payment = await gw.create_payment(
            client_id=test_client.id,
            amount=100.00,
        )

        with pytest.raises(ValueError, match="Solo se pueden reembolsar"):
            await gw.refund_payment(payment.id)

    async def test_payment_summary(self, db: AsyncSession, test_client: Client, test_user):
        """Get payment summary for a client."""
        gw = PaymentGateway(db)

        # Create and confirm 2 payments
        for amount in [100.00, 150.00]:
            p = await gw.create_payment(client_id=test_client.id, amount=amount)
            await gw.confirm_payment(p.id, verified_by=test_user.id)

        # Create 1 pending
        await gw.create_payment(client_id=test_client.id, amount=50.00)

        summary = await gw.get_payment_summary(test_client.id)

        assert summary["total_payments"] == 2
        assert summary["total_amount"] == 250.00
        assert summary["pending_payments"] == 1

    async def test_transaction_logging(self, db: AsyncSession, test_client: Client, test_user):
        """Verify transaction events are logged."""
        gw = PaymentGateway(db)
        payment = await gw.create_payment(
            client_id=test_client.id,
            amount=100.00,
        )
        await gw.confirm_payment(payment.id, verified_by=test_user.id)

        result = await db.execute(
            select(PaymentTransaction)
            .where(PaymentTransaction.payment_id == payment.id)
            .order_by(PaymentTransaction.timestamp)
        )
        transactions = result.scalars().all()

        assert len(transactions) == 2
        assert transactions[0].event_type == "created"
        assert transactions[1].event_type == "completed"

    async def test_get_client_payments_paginated(self, db: AsyncSession, test_client: Client):
        """Get paginated payments for a client."""
        gw = PaymentGateway(db)

        for i in range(5):
            await gw.create_payment(
                client_id=test_client.id,
                amount=float(i + 1) * 10,
            )

        payments, total = await gw.get_client_payments(
            test_client.id, page=1, per_page=3,
        )

        assert total == 5
        assert len(payments) == 3

    async def test_get_nonexistent_payment(self, db: AsyncSession):
        """Getting a nonexistent payment raises error."""
        gw = PaymentGateway(db)

        with pytest.raises(ValueError, match="no encontrado"):
            await gw._get_payment(uuid.uuid4())

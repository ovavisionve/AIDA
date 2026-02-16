import uuid
from datetime import datetime
from sqlalchemy import (
    Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class Payment(Base, UUIDMixin, TimestampMixin):
    """Pagos de suscripciones y servicios AIDA."""
    __tablename__ = "payments"

    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    subscription_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("client_subscriptions.id", ondelete="SET NULL")
    )

    # Amount
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    amount_ves: Mapped[float | None] = mapped_column(Numeric(18, 2))
    exchange_rate: Mapped[float | None] = mapped_column(Numeric(12, 4))

    # Payment method
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False)
    # transferencia, pago_movil, zelle, paypal, stripe, efectivo, crypto

    # Gateway
    gateway: Mapped[str | None] = mapped_column(String(50))
    # stripe, paypal, mercadopago, manual
    gateway_payment_id: Mapped[str | None] = mapped_column(String(255))
    gateway_status: Mapped[str | None] = mapped_column(String(50))

    # Status
    status: Mapped[str] = mapped_column(
        String(20), default="pending", nullable=False, index=True
    )
    # pending, processing, completed, failed, refunded, cancelled

    # Reference
    reference_number: Mapped[str | None] = mapped_column(String(100))
    bank_name: Mapped[str | None] = mapped_column(String(100))
    payer_name: Mapped[str | None] = mapped_column(String(255))
    payer_email: Mapped[str | None] = mapped_column(String(255))

    # Invoice
    invoice_number: Mapped[str | None] = mapped_column(String(50))
    description: Mapped[str] = mapped_column(Text, default="Suscripción AIDA")
    period_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    period_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Processing
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    failed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    failure_reason: Mapped[str | None] = mapped_column(Text)

    # Admin
    verified_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    notes: Mapped[str | None] = mapped_column(Text)

    # Relationships
    transactions: Mapped[list["PaymentTransaction"]] = relationship(
        back_populates="payment", cascade="all, delete-orphan"
    )


class PaymentTransaction(Base, UUIDMixin):
    """Log de transacciones y eventos de pago."""
    __tablename__ = "payment_transactions"

    payment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("payments.id", ondelete="CASCADE"), nullable=False, index=True
    )
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # created, processing, completed, failed, refund_initiated, refund_completed, webhook_received
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    gateway_event_id: Mapped[str | None] = mapped_column(String(255))
    raw_response: Mapped[str | None] = mapped_column(Text)
    amount: Mapped[float | None] = mapped_column(Numeric(12, 2))
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    payment: Mapped["Payment"] = relationship(back_populates="transactions")

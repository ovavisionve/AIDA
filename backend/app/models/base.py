import uuid
from datetime import datetime
from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class UUIDMixin:
    id: Mapped[uuid.UUID] = mapped_column(
        default=uuid.uuid4, primary_key=True, index=True
    )


class AuditFieldsMixin:
    """Fields required by PA 00121 for SENIAT compliance."""
    created_by_ip: Mapped[str | None] = mapped_column(String(45))
    created_by_mac: Mapped[str | None] = mapped_column(String(17))
    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column()
    operation_timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

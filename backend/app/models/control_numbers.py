import uuid
from datetime import datetime
from sqlalchemy import (
    Boolean, DateTime, ForeignKey, Integer, String, Text, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class ControlNumberRange(Base, UUIDMixin, TimestampMixin):
    """Rangos de números de control asignados por SENIAT."""
    __tablename__ = "control_number_ranges"

    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id"), nullable=False, index=True)
    serie: Mapped[str] = mapped_column(String(10), nullable=False)
    numero_inicio: Mapped[int] = mapped_column(Integer, nullable=False)
    numero_fin: Mapped[int] = mapped_column(Integer, nullable=False)
    numero_actual: Mapped[int] = mapped_column(Integer, nullable=False)
    prefijo: Mapped[str | None] = mapped_column(String(10))
    sufijo: Mapped[str | None] = mapped_column(String(10))
    punto_emision: Mapped[str | None] = mapped_column(String(10))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    fecha_asignacion: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    fecha_vencimiento: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    autorizacion_seniat: Mapped[str | None] = mapped_column(String(100))
    notas: Mapped[str | None] = mapped_column(Text)

    # Relationships
    numbers: Mapped[list["ControlNumber"]] = relationship(back_populates="range", cascade="all, delete-orphan")

    @property
    def numeros_disponibles(self) -> int:
        return self.numero_fin - self.numero_actual

    @property
    def porcentaje_uso(self) -> float:
        total = self.numero_fin - self.numero_inicio + 1
        usado = self.numero_actual - self.numero_inicio
        return (usado / total) * 100 if total > 0 else 0


class ControlNumber(Base, UUIDMixin):
    """Números de control individuales emitidos."""
    __tablename__ = "control_numbers"

    range_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("control_number_ranges.id"), nullable=False, index=True)
    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id"), nullable=False, index=True)
    numero_control: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    numero_secuencial: Mapped[int] = mapped_column(Integer, nullable=False)

    # Documento asociado
    document_type: Mapped[str] = mapped_column(String(30), nullable=False)  # invoice, credit_note, debit_note, dispatch_guide
    document_id: Mapped[uuid.UUID] = mapped_column(nullable=False)

    # Estado
    status: Mapped[str] = mapped_column(String(20), default="usado", nullable=False)  # usado, anulado
    fecha_asignacion: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    fecha_anulacion: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    motivo_anulacion: Mapped[str | None] = mapped_column(Text)

    # Auditoría
    asignado_por_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    ip_asignacion: Mapped[str | None] = mapped_column(String(45))

    # Relationships
    range: Mapped["ControlNumberRange"] = relationship(back_populates="numbers")


class ControlNumberAudit(Base, UUIDMixin):
    """Auditoría detallada de números de control para SENIAT."""
    __tablename__ = "control_number_audit"

    control_number_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("control_numbers.id"), nullable=False)
    action: Mapped[str] = mapped_column(String(50), nullable=False)  # assigned, voided, queried
    performed_by_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    ip_address: Mapped[str | None] = mapped_column(String(45))
    mac_address: Mapped[str | None] = mapped_column(String(17))
    details: Mapped[str | None] = mapped_column(Text)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

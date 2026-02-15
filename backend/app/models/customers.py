import uuid
from sqlalchemy import (
    Boolean, ForeignKey, Numeric, String, Text,
)
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class Customer(Base, UUIDMixin, TimestampMixin):
    """Clientes finales de los facturadores (no confundir con Client que es el cliente de AIda)."""
    __tablename__ = "customers"

    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id"), nullable=False, index=True)
    rif: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    cedula: Mapped[str | None] = mapped_column(String(20))
    razon_social: Mapped[str] = mapped_column(String(255), nullable=False)
    nombre_comercial: Mapped[str | None] = mapped_column(String(255))
    direccion_fiscal: Mapped[str] = mapped_column(Text, nullable=False)
    direccion_entrega: Mapped[str | None] = mapped_column(Text)
    telefono_principal: Mapped[str | None] = mapped_column(String(20))
    telefono_secundario: Mapped[str | None] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(255))
    contacto_nombre: Mapped[str | None] = mapped_column(String(255))
    contacto_telefono: Mapped[str | None] = mapped_column(String(20))
    contacto_email: Mapped[str | None] = mapped_column(String(255))

    # Comercial
    limite_credito: Mapped[float] = mapped_column(Numeric(18, 2), default=0, nullable=False)
    condicion_pago: Mapped[str] = mapped_column(String(50), default="contado", nullable=False)
    vendedor_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    categoria: Mapped[str | None] = mapped_column(String(50))
    segmento: Mapped[str | None] = mapped_column(String(50))

    # Estado
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_moroso: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notas: Mapped[str | None] = mapped_column(Text)

    # Documentos adjuntos
    rif_document_url: Mapped[str | None] = mapped_column(String(500))
    registro_mercantil_url: Mapped[str | None] = mapped_column(String(500))

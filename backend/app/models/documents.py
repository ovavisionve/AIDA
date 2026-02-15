import uuid
from datetime import datetime, date
from sqlalchemy import (
    Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.base import TimestampMixin, UUIDMixin, AuditFieldsMixin


class Invoice(Base, UUIDMixin, TimestampMixin, AuditFieldsMixin):
    """Facturas - Documento fiscal principal."""
    __tablename__ = "invoices"

    # Identificación del documento
    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id"), nullable=False, index=True)
    document_number: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    control_number: Mapped[str | None] = mapped_column(String(50), unique=True, index=True)
    uuid_seniat: Mapped[str | None] = mapped_column(String(100), unique=True)

    # Emisor
    emisor_rif: Mapped[str] = mapped_column(String(20), nullable=False)
    emisor_razon_social: Mapped[str] = mapped_column(String(255), nullable=False)
    emisor_direccion: Mapped[str] = mapped_column(Text, nullable=False)

    # Receptor
    receptor_rif: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    receptor_razon_social: Mapped[str] = mapped_column(String(255), nullable=False)
    receptor_direccion: Mapped[str] = mapped_column(Text, nullable=False)
    receptor_telefono: Mapped[str | None] = mapped_column(String(20))
    receptor_email: Mapped[str | None] = mapped_column(String(255))

    # Fechas
    fecha_emision: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    fecha_vencimiento: Mapped[date | None] = mapped_column(Date)

    # Montos
    subtotal: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    descuento: Mapped[float] = mapped_column(Numeric(18, 2), default=0)
    base_imponible: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    base_exenta: Mapped[float] = mapped_column(Numeric(18, 2), default=0)
    monto_iva_16: Mapped[float] = mapped_column(Numeric(18, 2), default=0)
    monto_iva_8: Mapped[float] = mapped_column(Numeric(18, 2), default=0)
    alicuota_iva_16: Mapped[float] = mapped_column(Numeric(5, 2), default=16.00)
    alicuota_iva_8: Mapped[float] = mapped_column(Numeric(5, 2), default=8.00)
    total: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)

    # Moneda
    moneda: Mapped[str] = mapped_column(String(3), default="VES", nullable=False)
    tasa_cambio: Mapped[float | None] = mapped_column(Numeric(18, 6))

    # Pago
    forma_pago: Mapped[str] = mapped_column(String(50), nullable=False)  # efectivo, transferencia, etc.
    condicion_pago: Mapped[str] = mapped_column(String(50), default="contado")  # contado, credito_30, etc.

    # Estado
    status: Mapped[str] = mapped_column(String(20), default="emitido", nullable=False, index=True)
    # emitido, anulado, vigente, pagado
    motivo_anulacion: Mapped[str | None] = mapped_column(Text)
    fecha_anulacion: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Vendedor
    vendedor_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    observaciones: Mapped[str | None] = mapped_column(Text)

    # Archivos
    pdf_url: Mapped[str | None] = mapped_column(String(500))
    xml_url: Mapped[str | None] = mapped_column(String(500))
    qr_code: Mapped[str | None] = mapped_column(Text)
    firma_digital: Mapped[str | None] = mapped_column(Text)

    # Relationships
    items: Mapped[list["DocumentItem"]] = relationship(
        back_populates="invoice", cascade="all, delete-orphan",
        foreign_keys="DocumentItem.invoice_id",
    )


class CreditNote(Base, UUIDMixin, TimestampMixin, AuditFieldsMixin):
    """Notas de Crédito - vinculadas a facturas."""
    __tablename__ = "credit_notes"

    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id"), nullable=False, index=True)
    document_number: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    control_number: Mapped[str | None] = mapped_column(String(50), unique=True, index=True)
    uuid_seniat: Mapped[str | None] = mapped_column(String(100), unique=True)

    # Factura original
    invoice_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("invoices.id"), nullable=False)

    # Emisor/Receptor (heredados de factura original)
    emisor_rif: Mapped[str] = mapped_column(String(20), nullable=False)
    emisor_razon_social: Mapped[str] = mapped_column(String(255), nullable=False)
    receptor_rif: Mapped[str] = mapped_column(String(20), nullable=False)
    receptor_razon_social: Mapped[str] = mapped_column(String(255), nullable=False)

    # Fechas
    fecha_emision: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Motivo
    motivo: Mapped[str] = mapped_column(Text, nullable=False)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)  # total, parcial

    # Montos
    subtotal: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    monto_iva: Mapped[float] = mapped_column(Numeric(18, 2), default=0)
    total: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    moneda: Mapped[str] = mapped_column(String(3), default="VES")

    # Estado
    status: Mapped[str] = mapped_column(String(20), default="emitido", nullable=False)

    # Archivos
    pdf_url: Mapped[str | None] = mapped_column(String(500))
    xml_url: Mapped[str | None] = mapped_column(String(500))

    # Relationships
    invoice: Mapped["Invoice"] = relationship()
    items: Mapped[list["DocumentItem"]] = relationship(
        back_populates="credit_note", cascade="all, delete-orphan",
        foreign_keys="DocumentItem.credit_note_id",
    )


class DebitNote(Base, UUIDMixin, TimestampMixin, AuditFieldsMixin):
    """Notas de Débito."""
    __tablename__ = "debit_notes"

    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id"), nullable=False, index=True)
    document_number: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    control_number: Mapped[str | None] = mapped_column(String(50), unique=True, index=True)
    uuid_seniat: Mapped[str | None] = mapped_column(String(100), unique=True)

    invoice_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("invoices.id"), nullable=False)

    emisor_rif: Mapped[str] = mapped_column(String(20), nullable=False)
    emisor_razon_social: Mapped[str] = mapped_column(String(255), nullable=False)
    receptor_rif: Mapped[str] = mapped_column(String(20), nullable=False)
    receptor_razon_social: Mapped[str] = mapped_column(String(255), nullable=False)

    fecha_emision: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    concepto: Mapped[str] = mapped_column(Text, nullable=False)

    subtotal: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    monto_iva: Mapped[float] = mapped_column(Numeric(18, 2), default=0)
    total: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    moneda: Mapped[str] = mapped_column(String(3), default="VES")

    status: Mapped[str] = mapped_column(String(20), default="emitido", nullable=False)

    pdf_url: Mapped[str | None] = mapped_column(String(500))
    xml_url: Mapped[str | None] = mapped_column(String(500))

    invoice: Mapped["Invoice"] = relationship()
    items: Mapped[list["DocumentItem"]] = relationship(
        back_populates="debit_note", cascade="all, delete-orphan",
        foreign_keys="DocumentItem.debit_note_id",
    )


class DispatchGuide(Base, UUIDMixin, TimestampMixin, AuditFieldsMixin):
    """Guías de Despacho."""
    __tablename__ = "dispatch_guides"

    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id"), nullable=False, index=True)
    document_number: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    control_number: Mapped[str | None] = mapped_column(String(50), unique=True, index=True)

    invoice_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("invoices.id"))

    emisor_rif: Mapped[str] = mapped_column(String(20), nullable=False)
    emisor_razon_social: Mapped[str] = mapped_column(String(255), nullable=False)
    receptor_rif: Mapped[str] = mapped_column(String(20), nullable=False)
    receptor_razon_social: Mapped[str] = mapped_column(String(255), nullable=False)

    fecha_emision: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Transporte
    transportista_nombre: Mapped[str | None] = mapped_column(String(255))
    transportista_rif: Mapped[str | None] = mapped_column(String(20))
    vehiculo_placa: Mapped[str | None] = mapped_column(String(20))
    ruta_destino: Mapped[str | None] = mapped_column(Text)
    motivo_traslado: Mapped[str | None] = mapped_column(Text)

    status: Mapped[str] = mapped_column(String(20), default="emitido", nullable=False)

    pdf_url: Mapped[str | None] = mapped_column(String(500))

    invoice: Mapped["Invoice"] = relationship()
    items: Mapped[list["DocumentItem"]] = relationship(
        back_populates="dispatch_guide", cascade="all, delete-orphan",
        foreign_keys="DocumentItem.dispatch_guide_id",
    )


class Withholding(Base, UUIDMixin, TimestampMixin, AuditFieldsMixin):
    """Comprobantes de Retención (ISLR e IVA)."""
    __tablename__ = "withholdings"

    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id"), nullable=False, index=True)
    document_number: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    tipo: Mapped[str] = mapped_column(String(10), nullable=False)  # 'iva' or 'islr'

    invoice_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("invoices.id"), nullable=False)

    agente_retencion_rif: Mapped[str] = mapped_column(String(20), nullable=False)
    agente_retencion_nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    sujeto_retenido_rif: Mapped[str] = mapped_column(String(20), nullable=False)
    sujeto_retenido_nombre: Mapped[str] = mapped_column(String(255), nullable=False)

    fecha_emision: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    periodo_fiscal: Mapped[str] = mapped_column(String(7), nullable=False)  # YYYY-MM

    base_imponible: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    porcentaje_retencion: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    monto_retenido: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)

    concepto: Mapped[str | None] = mapped_column(String(100))  # For ISLR: concept code
    status: Mapped[str] = mapped_column(String(20), default="emitido", nullable=False)

    pdf_url: Mapped[str | None] = mapped_column(String(500))
    xml_url: Mapped[str | None] = mapped_column(String(500))

    invoice: Mapped["Invoice"] = relationship()


class DocumentItem(Base, UUIDMixin):
    """Líneas/items de cualquier documento fiscal."""
    __tablename__ = "document_items"

    # Foreign keys a los diferentes documentos (solo uno será not null)
    invoice_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("invoices.id", ondelete="CASCADE"))
    credit_note_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("credit_notes.id", ondelete="CASCADE"))
    debit_note_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("debit_notes.id", ondelete="CASCADE"))
    dispatch_guide_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("dispatch_guides.id", ondelete="CASCADE"))

    # Producto/servicio
    product_code: Mapped[str | None] = mapped_column(String(50))
    barcode: Mapped[str | None] = mapped_column(String(50))
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    unit_of_measure: Mapped[str] = mapped_column(String(20), default="UND")

    # Cantidades y precios
    quantity: Mapped[float] = mapped_column(Numeric(18, 4), nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(18, 4), nullable=False)
    discount_percent: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    discount_amount: Mapped[float] = mapped_column(Numeric(18, 2), default=0)
    subtotal: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)

    # Impuestos
    tax_type: Mapped[str] = mapped_column(String(20), default="gravado")  # gravado, exento, no_sujeto
    tax_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=16.00)
    tax_amount: Mapped[float] = mapped_column(Numeric(18, 2), default=0)

    total: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    line_number: Mapped[int] = mapped_column(Integer, nullable=False)

    # Relationships
    invoice: Mapped["Invoice"] = relationship(back_populates="items", foreign_keys=[invoice_id])
    credit_note: Mapped["CreditNote"] = relationship(back_populates="items", foreign_keys=[credit_note_id])
    debit_note: Mapped["DebitNote"] = relationship(back_populates="items", foreign_keys=[debit_note_id])
    dispatch_guide: Mapped["DispatchGuide"] = relationship(back_populates="items", foreign_keys=[dispatch_guide_id])

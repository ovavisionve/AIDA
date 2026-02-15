"""
Modelos de documentos fiscales — Conforme a Providencia SNAT/2024/000102.

Documentos cubiertos (Art. 2): Facturas, Notas de Crédito, Notas de Débito,
Guías de Despacho, Comprobantes de Retención.
"""
import uuid
from datetime import datetime, date
from sqlalchemy import (
    Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.base import TimestampMixin, UUIDMixin, AuditFieldsMixin


class Invoice(Base, UUIDMixin, TimestampMixin, AuditFieldsMixin):
    """Facturas — Art. 7, Providencia SNAT/2024/000102."""
    __tablename__ = "invoices"

    # Identificación del documento
    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id"), nullable=False, index=True)
    document_number: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    control_number: Mapped[str | None] = mapped_column(String(50), unique=True, index=True)
    uuid_seniat: Mapped[str | None] = mapped_column(String(100), unique=True)

    # Emisor (Art. 7, numeral 3)
    emisor_rif: Mapped[str] = mapped_column(String(20), nullable=False)
    emisor_razon_social: Mapped[str] = mapped_column(String(255), nullable=False)
    emisor_direccion: Mapped[str] = mapped_column(Text, nullable=False)
    emisor_telefono: Mapped[str | None] = mapped_column(String(20))
    emisor_zona_postal: Mapped[str | None] = mapped_column(String(10))
    emisor_ciudad: Mapped[str | None] = mapped_column(String(100))

    # Receptor / Adquiriente (Art. 7, numeral 7)
    receptor_rif: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    receptor_razon_social: Mapped[str] = mapped_column(String(255), nullable=False)
    receptor_direccion: Mapped[str] = mapped_column(Text, nullable=False)
    receptor_telefono: Mapped[str | None] = mapped_column(String(20))
    receptor_email: Mapped[str | None] = mapped_column(String(255))

    # Datos del Supervisor (sección presente en formatos oficiales)
    supervisor_nombre: Mapped[str | None] = mapped_column(String(255))
    supervisor_cedula: Mapped[str | None] = mapped_column(String(20))

    # Datos de Entrega (sección presente en formatos oficiales)
    entrega_direccion: Mapped[str | None] = mapped_column(Text)
    entrega_fecha: Mapped[date | None] = mapped_column(Date)
    entrega_responsable: Mapped[str | None] = mapped_column(String(255))

    # Fechas (Art. 7, numeral 6 — DDMMAAAA HH:MM:SS)
    fecha_emision: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    fecha_vencimiento: Mapped[date | None] = mapped_column(Date)

    # Montos principales
    subtotal: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    descuento: Mapped[float] = mapped_column(Numeric(18, 2), default=0)
    cargo_administrativo: Mapped[float] = mapped_column(Numeric(18, 2), default=0)

    # Bases imponibles (Art. 7, numeral 11 — discriminadas por alícuota)
    base_imponible: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    base_exenta: Mapped[float] = mapped_column(Numeric(18, 2), default=0)
    base_no_sujeta: Mapped[float] = mapped_column(Numeric(18, 2), default=0)

    # IVA (Art. 7, numeral 12)
    monto_iva_16: Mapped[float] = mapped_column(Numeric(18, 2), default=0)
    monto_iva_8: Mapped[float] = mapped_column(Numeric(18, 2), default=0)
    alicuota_iva_16: Mapped[float] = mapped_column(Numeric(5, 2), default=16.00)
    alicuota_iva_8: Mapped[float] = mapped_column(Numeric(5, 2), default=8.00)

    # IGTF (Impuesto Grandes Transacciones Financieras — Prov. SNAT/2022/0013)
    # Aplica 3% sobre pagos en divisas/cripto. Base = total factura en divisas.
    base_imponible_igtf: Mapped[float] = mapped_column(Numeric(18, 2), default=0)
    porcentaje_igtf: Mapped[float] = mapped_column(Numeric(5, 2), default=3.00)
    monto_igtf: Mapped[float] = mapped_column(Numeric(18, 2), default=0)

    # Total (Art. 7, numeral 13)
    total: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    total_con_igtf: Mapped[float] = mapped_column(Numeric(18, 2), default=0)

    # Moneda y tasa de cambio
    moneda: Mapped[str] = mapped_column(String(3), default="VES", nullable=False)
    tasa_cambio: Mapped[float | None] = mapped_column(Numeric(18, 6))

    # Pago
    forma_pago: Mapped[str] = mapped_column(String(50), nullable=False)  # efectivo, transferencia, divisas, mixto
    condicion_pago: Mapped[str] = mapped_column(String(50), default="contado")  # contado, credito_30, etc.

    # Estado
    status: Mapped[str] = mapped_column(String(20), default="emitido", nullable=False, index=True)
    # emitido, anulado, vigente, pagado
    motivo_anulacion: Mapped[str | None] = mapped_column(Text)
    fecha_anulacion: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Vendedor
    vendedor_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    observaciones: Mapped[str | None] = mapped_column(Text)

    # Imprenta Digital (Art. 7, numeral 14 — datos de la imprenta autorizada)
    imprenta_rif: Mapped[str | None] = mapped_column(String(20))
    imprenta_razon_social: Mapped[str | None] = mapped_column(String(255))
    imprenta_autorizacion: Mapped[str | None] = mapped_column(String(100))  # N° de providencia
    imprenta_fecha_autorizacion: Mapped[date | None] = mapped_column(Date)

    # Rango de control (Art. 7, numeral 5 — "Desde N° hasta N°")
    control_rango_desde: Mapped[str | None] = mapped_column(String(20))
    control_rango_hasta: Mapped[str | None] = mapped_column(String(20))
    control_fecha_asignacion: Mapped[date | None] = mapped_column(Date)

    # Providencia de referencia
    providencia_referencia: Mapped[str | None] = mapped_column(String(200))

    # Plantilla y personalización
    template_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("document_templates.id"))

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
    """Notas de Crédito — Art. 8 + SNAT/2011/0071 + numerales 4,5,6 Art. 7."""
    __tablename__ = "credit_notes"

    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id"), nullable=False, index=True)
    document_number: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    control_number: Mapped[str | None] = mapped_column(String(50), unique=True, index=True)
    uuid_seniat: Mapped[str | None] = mapped_column(String(100), unique=True)

    # Factura original de referencia
    invoice_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("invoices.id"), nullable=False)
    factura_numero: Mapped[str | None] = mapped_column(String(50))
    factura_control: Mapped[str | None] = mapped_column(String(50))
    factura_fecha: Mapped[date | None] = mapped_column(Date)
    factura_monto: Mapped[float | None] = mapped_column(Numeric(18, 2))

    # Emisor/Receptor
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

    # IGTF
    base_imponible_igtf: Mapped[float] = mapped_column(Numeric(18, 2), default=0)
    monto_igtf: Mapped[float] = mapped_column(Numeric(18, 2), default=0)

    # Control (Art. 8 → numerales 4,5,6 de Art. 7)
    control_rango_desde: Mapped[str | None] = mapped_column(String(20))
    control_rango_hasta: Mapped[str | None] = mapped_column(String(20))
    control_fecha_asignacion: Mapped[date | None] = mapped_column(Date)

    # Imprenta
    imprenta_rif: Mapped[str | None] = mapped_column(String(20))
    imprenta_razon_social: Mapped[str | None] = mapped_column(String(255))

    template_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("document_templates.id"))

    status: Mapped[str] = mapped_column(String(20), default="emitido", nullable=False)

    pdf_url: Mapped[str | None] = mapped_column(String(500))
    xml_url: Mapped[str | None] = mapped_column(String(500))

    # Relationships
    invoice: Mapped["Invoice"] = relationship()
    items: Mapped[list["DocumentItem"]] = relationship(
        back_populates="credit_note", cascade="all, delete-orphan",
        foreign_keys="DocumentItem.credit_note_id",
    )


class DebitNote(Base, UUIDMixin, TimestampMixin, AuditFieldsMixin):
    """Notas de Débito — Art. 8 + SNAT/2011/0071 + numerales 4,5,6 Art. 7."""
    __tablename__ = "debit_notes"

    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id"), nullable=False, index=True)
    document_number: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    control_number: Mapped[str | None] = mapped_column(String(50), unique=True, index=True)
    uuid_seniat: Mapped[str | None] = mapped_column(String(100), unique=True)

    invoice_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("invoices.id"), nullable=False)
    factura_numero: Mapped[str | None] = mapped_column(String(50))
    factura_control: Mapped[str | None] = mapped_column(String(50))
    factura_fecha: Mapped[date | None] = mapped_column(Date)
    factura_monto: Mapped[float | None] = mapped_column(Numeric(18, 2))

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

    # IGTF
    base_imponible_igtf: Mapped[float] = mapped_column(Numeric(18, 2), default=0)
    monto_igtf: Mapped[float] = mapped_column(Numeric(18, 2), default=0)

    # Control
    control_rango_desde: Mapped[str | None] = mapped_column(String(20))
    control_rango_hasta: Mapped[str | None] = mapped_column(String(20))
    control_fecha_asignacion: Mapped[date | None] = mapped_column(Date)

    imprenta_rif: Mapped[str | None] = mapped_column(String(20))
    imprenta_razon_social: Mapped[str | None] = mapped_column(String(255))

    template_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("document_templates.id"))

    status: Mapped[str] = mapped_column(String(20), default="emitido", nullable=False)

    pdf_url: Mapped[str | None] = mapped_column(String(500))
    xml_url: Mapped[str | None] = mapped_column(String(500))

    invoice: Mapped["Invoice"] = relationship()
    items: Mapped[list["DocumentItem"]] = relationship(
        back_populates="debit_note", cascade="all, delete-orphan",
        foreign_keys="DocumentItem.debit_note_id",
    )


class DispatchGuide(Base, UUIDMixin, TimestampMixin, AuditFieldsMixin):
    """Guías de Despacho — Art. 10, Providencia SNAT/2024/000102."""
    __tablename__ = "dispatch_guides"

    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id"), nullable=False, index=True)
    document_number: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    control_number: Mapped[str | None] = mapped_column(String(50), unique=True, index=True)

    invoice_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("invoices.id"))

    emisor_rif: Mapped[str] = mapped_column(String(20), nullable=False)
    emisor_razon_social: Mapped[str] = mapped_column(String(255), nullable=False)
    receptor_rif: Mapped[str] = mapped_column(String(20), nullable=False)
    receptor_razon_social: Mapped[str] = mapped_column(String(255), nullable=False)
    receptor_direccion: Mapped[str | None] = mapped_column(Text)

    fecha_emision: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Transporte
    transportista_nombre: Mapped[str | None] = mapped_column(String(255))
    transportista_rif: Mapped[str | None] = mapped_column(String(20))
    vehiculo_placa: Mapped[str | None] = mapped_column(String(20))
    ruta_destino: Mapped[str | None] = mapped_column(Text)
    motivo_traslado: Mapped[str | None] = mapped_column(Text)

    # Art. 10: Leyenda obligatoria
    leyenda_sin_credito_fiscal: Mapped[bool] = mapped_column(Boolean, default=True)

    # Control
    control_rango_desde: Mapped[str | None] = mapped_column(String(20))
    control_rango_hasta: Mapped[str | None] = mapped_column(String(20))
    control_fecha_asignacion: Mapped[date | None] = mapped_column(Date)

    imprenta_rif: Mapped[str | None] = mapped_column(String(20))
    imprenta_razon_social: Mapped[str | None] = mapped_column(String(255))

    template_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("document_templates.id"))

    status: Mapped[str] = mapped_column(String(20), default="emitido", nullable=False)

    pdf_url: Mapped[str | None] = mapped_column(String(500))

    invoice: Mapped["Invoice"] = relationship()
    items: Mapped[list["DocumentItem"]] = relationship(
        back_populates="dispatch_guide", cascade="all, delete-orphan",
        foreign_keys="DocumentItem.dispatch_guide_id",
    )


class Withholding(Base, UUIDMixin, TimestampMixin, AuditFieldsMixin):
    """Comprobantes de Retención — Art. 11, Providencia SNAT/2024/000102."""
    __tablename__ = "withholdings"

    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id"), nullable=False, index=True)
    # Art. 11: formato AAAAMMSSSSSSSS (14 caracteres)
    document_number: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    tipo: Mapped[str] = mapped_column(String(10), nullable=False)  # 'iva' or 'islr'

    invoice_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("invoices.id"), nullable=False)

    # Agente de retención
    agente_retencion_rif: Mapped[str] = mapped_column(String(20), nullable=False)
    agente_retencion_nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    agente_retencion_direccion: Mapped[str | None] = mapped_column(Text)

    # Sujeto retenido (proveedor)
    sujeto_retenido_rif: Mapped[str] = mapped_column(String(20), nullable=False)
    sujeto_retenido_nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    sujeto_retenido_direccion: Mapped[str | None] = mapped_column(Text)
    sujeto_retenido_email: Mapped[str | None] = mapped_column(String(255))

    fecha_emision: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    periodo_fiscal: Mapped[str] = mapped_column(String(7), nullable=False)  # YYYY-MM

    # Montos (Art. 11)
    monto_factura: Mapped[float | None] = mapped_column(Numeric(18, 2))
    base_imponible: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    impuesto_causado: Mapped[float | None] = mapped_column(Numeric(18, 2))
    porcentaje_retencion: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    monto_retenido: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)

    # Referencia factura/nota débito
    factura_numero: Mapped[str | None] = mapped_column(String(50))
    factura_fecha: Mapped[date | None] = mapped_column(Date)

    concepto: Mapped[str | None] = mapped_column(String(100))  # For ISLR: concept code
    status: Mapped[str] = mapped_column(String(20), default="emitido", nullable=False)

    # Imprenta Digital
    imprenta_rif: Mapped[str | None] = mapped_column(String(20))
    imprenta_razon_social: Mapped[str | None] = mapped_column(String(255))

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

    # Producto/servicio (Art. 7, numeral 8)
    product_code: Mapped[str | None] = mapped_column(String(50))
    barcode: Mapped[str | None] = mapped_column(String(50))
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    unit_of_measure: Mapped[str] = mapped_column(String(20), default="UND")
    tipo_item: Mapped[str] = mapped_column(String(20), default="producto")  # producto, servicio

    # Cantidades (formatos oficiales muestran pedidas vs enviadas)
    quantity: Mapped[float] = mapped_column(Numeric(18, 4), nullable=False)
    cantidad_pedida: Mapped[float | None] = mapped_column(Numeric(18, 4))
    cantidad_enviada: Mapped[float | None] = mapped_column(Numeric(18, 4))

    # Precios
    unit_price: Mapped[float] = mapped_column(Numeric(18, 4), nullable=False)
    discount_percent: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    discount_amount: Mapped[float] = mapped_column(Numeric(18, 2), default=0)
    cargo_administrativo: Mapped[float] = mapped_column(Numeric(18, 2), default=0)
    subtotal: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)

    # Impuestos (Art. 7, numerales 11-12)
    tax_type: Mapped[str] = mapped_column(String(20), default="gravado")  # gravado, exento, no_sujeto
    tax_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=16.00)
    tax_amount: Mapped[float] = mapped_column(Numeric(18, 2), default=0)

    total: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    line_number: Mapped[int] = mapped_column(Integer, nullable=False)

    # Para guías de despacho (Art. 10): capacidad, peso, volumen
    peso: Mapped[str | None] = mapped_column(String(50))
    volumen: Mapped[str | None] = mapped_column(String(50))

    # Relationships
    invoice: Mapped["Invoice"] = relationship(back_populates="items", foreign_keys=[invoice_id])
    credit_note: Mapped["CreditNote"] = relationship(back_populates="items", foreign_keys=[credit_note_id])
    debit_note: Mapped["DebitNote"] = relationship(back_populates="items", foreign_keys=[debit_note_id])
    dispatch_guide: Mapped["DispatchGuide"] = relationship(back_populates="items", foreign_keys=[dispatch_guide_id])

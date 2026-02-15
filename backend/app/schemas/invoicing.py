"""Schemas para el módulo de facturación del Portal 2."""
import uuid
from datetime import datetime, date
from pydantic import BaseModel, Field


class InvoiceItemCreate(BaseModel):
    product_id: uuid.UUID | None = None
    product_code: str | None = None
    description: str
    unit_of_measure: str = "UND"
    quantity: float = Field(..., gt=0)
    unit_price: float = Field(..., ge=0)
    discount_percent: float = Field(0, ge=0, le=100)
    tax_type: str = Field("G", description="G=Gravado 16%, R=Reducido 8%, E=Exento")


class InvoiceCreate(BaseModel):
    """Crear factura desde el Portal 2 (interfaz web del facturador)."""
    # Cliente receptor
    customer_id: uuid.UUID | None = None
    receptor_rif: str | None = None
    receptor_razon_social: str | None = None
    receptor_direccion: str | None = None
    receptor_email: str | None = None

    # Items
    items: list[InvoiceItemCreate] = Field(..., min_length=1)

    # Pago
    forma_pago: str = "efectivo"
    condicion_pago: str = "contado"
    fecha_vencimiento: date | None = None

    # Moneda
    moneda: str = "VES"
    tasa_cambio: float | None = None

    # Extras
    observaciones: str | None = None
    vendedor_id: uuid.UUID | None = None

    # Auto-enviar al cliente por email
    enviar_email: bool = False


class CreditNoteCreate(BaseModel):
    """Crear nota de crédito desde el Portal 2."""
    invoice_id: uuid.UUID
    motivo: str
    tipo: str = "total"  # total, parcial
    items: list[InvoiceItemCreate] | None = None  # Si parcial, especificar items


class DebitNoteCreate(BaseModel):
    """Crear nota de débito desde el Portal 2."""
    invoice_id: uuid.UUID
    concepto: str
    items: list[InvoiceItemCreate]


class InvoiceFullResponse(BaseModel):
    """Respuesta completa de factura con número de control."""
    id: uuid.UUID
    document_number: str
    control_number: str | None
    uuid_seniat: str | None
    emisor_rif: str
    emisor_razon_social: str
    receptor_rif: str
    receptor_razon_social: str
    receptor_email: str | None
    fecha_emision: datetime
    fecha_vencimiento: date | None
    subtotal: float
    descuento: float
    base_imponible: float
    base_exenta: float
    monto_iva_16: float
    monto_iva_8: float
    total: float
    moneda: str
    tasa_cambio: float | None
    forma_pago: str
    condicion_pago: str
    status: str
    observaciones: str | None
    pdf_url: str | None
    xml_url: str | None
    qr_code: str | None
    items: list[dict] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class FacturadorDashboard(BaseModel):
    """Dashboard del facturador (Portal 2)."""
    ventas_hoy: float
    ventas_semana: float
    ventas_mes: float
    facturas_pendientes_envio: int
    productos_stock_bajo: int
    clientes_morosos: int
    top_productos: list[dict]
    top_clientes: list[dict]
    documentos_recientes: list[dict]

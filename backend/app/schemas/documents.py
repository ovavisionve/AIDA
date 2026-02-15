import uuid
from datetime import datetime, date
from pydantic import BaseModel


class DocumentItemSchema(BaseModel):
    product_code: str | None = None
    barcode: str | None = None
    description: str
    unit_of_measure: str = "UND"
    quantity: float
    unit_price: float
    discount_percent: float = 0
    discount_amount: float = 0
    tax_type: str = "gravado"
    tax_rate: float = 16.00
    line_number: int


class DocumentItemResponse(DocumentItemSchema):
    id: uuid.UUID
    subtotal: float
    tax_amount: float
    total: float

    model_config = {"from_attributes": True}


class InvoiceResponse(BaseModel):
    id: uuid.UUID
    document_number: str
    control_number: str | None
    emisor_rif: str
    emisor_razon_social: str
    receptor_rif: str
    receptor_razon_social: str
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
    forma_pago: str
    condicion_pago: str
    status: str
    pdf_url: str | None
    xml_url: str | None
    items: list[DocumentItemResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    items: list[InvoiceResponse]
    total: int
    page: int
    page_size: int
    pages: int


class DocumentFilter(BaseModel):
    document_type: str | None = None
    date_from: date | None = None
    date_to: date | None = None
    document_number: str | None = None
    rif: str | None = None
    status: str | None = None
    control_number: str | None = None
    forma_pago: str | None = None
    amount_min: float | None = None
    amount_max: float | None = None


class DashboardStats(BaseModel):
    total_documents_month: int
    total_pending_download: int
    total_billed_current: float
    total_billed_previous: float
    documents_by_status: dict[str, int]
    recent_documents: list[InvoiceResponse]

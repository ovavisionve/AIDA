"""
Schemas de la API Fiscal Estándar AIDA.

Esta API sigue el formato genérico que el SENIAT define para imprentas digitales
en Venezuela (Providencia SNAT/2024/000121). Los clientes se integran usando
estos schemas sin importar su sistema origen (SAP, Odoo, custom, etc.).

El contrato es fijo: el cliente envía datos en este formato y recibe respuesta
estandarizada con número de control, QR, firma digital y documentos generados.
"""
import uuid
from datetime import datetime, date
from pydantic import BaseModel, Field


# === REQUEST: Lo que el cliente envía ===

class FiscalEmisor(BaseModel):
    """Datos del emisor (se autocompletan desde el perfil del cliente si no se envían)."""
    rif: str | None = None
    razon_social: str | None = None
    direccion: str | None = None
    telefono: str | None = None


class FiscalReceptor(BaseModel):
    """Datos del receptor/comprador."""
    rif: str = Field(..., description="RIF del receptor (V/J/E/G + números)")
    razon_social: str = Field(..., description="Razón social o nombre")
    direccion: str = Field(..., description="Dirección fiscal")
    telefono: str | None = None
    email: str | None = None


class FiscalItem(BaseModel):
    """Línea de producto/servicio del documento."""
    numero_linea: int = Field(..., ge=1)
    codigo: str | None = Field(None, description="Código interno del producto")
    descripcion: str = Field(..., max_length=500)
    unidad: str = Field("UND", description="Unidad de medida")
    cantidad: float = Field(..., gt=0)
    precio_unitario: float = Field(..., ge=0)
    descuento_porcentaje: float = Field(0, ge=0, le=100)
    descuento_monto: float = Field(0, ge=0)
    tipo_impuesto: str = Field("G", description="G=Gravado 16%, R=Reducido 8%, E=Exento, NS=No sujeto")


class FiscalPago(BaseModel):
    """Forma de pago del documento."""
    forma: str = Field(..., description="efectivo, transferencia, pago_movil, tarjeta_debito, tarjeta_credito, cheque, mixto")
    monto: float | None = None
    referencia: str | None = None
    banco: str | None = None


class EmitirDocumentoRequest(BaseModel):
    """
    Request principal de la API Fiscal Estándar.

    El cliente envía esto para emitir cualquier documento fiscal.
    El sistema asigna automáticamente: número de control, QR, firma digital,
    genera PDF/XML y lo almacena.
    """
    # Tipo de documento
    tipo_documento: str = Field(
        ...,
        description="factura, nota_credito, nota_debito, guia_despacho"
    )

    # Número interno del cliente (opcional, AIDA puede autogenerar)
    numero_documento: str | None = Field(
        None, description="Número de documento del sistema del cliente. Si no se envía, AIDA lo genera."
    )

    # Partes
    emisor: FiscalEmisor | None = Field(
        None, description="Si no se envía, se usan los datos del perfil del cliente"
    )
    receptor: FiscalReceptor

    # Fechas
    fecha_emision: datetime | None = Field(
        None, description="Si no se envía, se usa la fecha/hora actual"
    )
    fecha_vencimiento: date | None = None

    # Items
    items: list[FiscalItem] = Field(..., min_length=1)

    # Pago
    pagos: list[FiscalPago] = Field(default_factory=lambda: [FiscalPago(forma="efectivo")])
    condicion_pago: str = Field("contado", description="contado, credito_15, credito_30, credito_60, credito_90")

    # Moneda
    moneda: str = Field("VES", description="VES, USD, EUR")
    tasa_cambio: float | None = Field(None, description="Tasa de cambio vs VES. Requerido si moneda != VES")

    # Para notas de crédito/débito: referencia al documento original
    documento_referencia: str | None = Field(
        None, description="Número de control del documento original (requerido para NC/ND)"
    )
    motivo: str | None = Field(None, description="Motivo de la NC/ND")

    # Para guías de despacho
    transportista: str | None = None
    transportista_rif: str | None = None
    vehiculo_placa: str | None = None
    ruta_destino: str | None = None
    motivo_traslado: str | None = None

    # Extras
    observaciones: str | None = None
    vendedor_codigo: str | None = None

    # Campos extra del sistema del cliente (se guardan como metadata)
    metadata: dict | None = Field(
        None, description="Campos adicionales del sistema del cliente. Se almacenan tal cual."
    )


class AnularDocumentoRequest(BaseModel):
    """Request para anular un documento fiscal."""
    numero_control: str = Field(..., description="Número de control del documento a anular")
    motivo: str = Field(..., description="Motivo de la anulación")


class ConsultarDocumentoRequest(BaseModel):
    """Filtros para consultar documentos."""
    numero_control: str | None = None
    numero_documento: str | None = None
    rif_receptor: str | None = None
    fecha_desde: date | None = None
    fecha_hasta: date | None = None
    tipo_documento: str | None = None
    status: str | None = None
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)


# === RESPONSE: Lo que AIDA devuelve ===

class FiscalItemResponse(BaseModel):
    numero_linea: int
    codigo: str | None
    descripcion: str
    unidad: str
    cantidad: float
    precio_unitario: float
    descuento: float
    subtotal: float
    tipo_impuesto: str
    alicuota: float
    monto_impuesto: float
    total: float


class FiscalTotales(BaseModel):
    subtotal: float
    descuento_total: float
    base_imponible: float
    base_exenta: float
    base_no_sujeta: float
    monto_iva_16: float
    monto_iva_8: float
    total_impuestos: float
    total: float


class EmitirDocumentoResponse(BaseModel):
    """
    Respuesta estándar al emitir un documento.

    Contiene todo lo que el cliente necesita: número de control, URLs
    de descarga, QR de validación, firma digital.
    """
    # Estado
    success: bool = True
    message: str = "Documento emitido exitosamente"

    # Identificación
    document_id: uuid.UUID
    tipo_documento: str
    numero_documento: str
    numero_control: str
    uuid_documento: str

    # Fechas
    fecha_emision: datetime
    fecha_procesamiento: datetime

    # Totales calculados
    totales: FiscalTotales
    items: list[FiscalItemResponse]

    # Archivos generados
    pdf_url: str
    xml_url: str

    # Validación SENIAT
    qr_code: str = Field(description="Código QR en base64 para validación SENIAT")
    firma_digital: str = Field(description="Firma digital del documento")

    # Metadata del cliente (devuelta tal cual)
    metadata: dict | None = None


class AnularDocumentoResponse(BaseModel):
    success: bool = True
    message: str
    numero_control: str
    fecha_anulacion: datetime


class DocumentoResumen(BaseModel):
    document_id: uuid.UUID
    tipo_documento: str
    numero_documento: str
    numero_control: str
    receptor_rif: str
    receptor_razon_social: str
    fecha_emision: datetime
    total: float
    moneda: str
    status: str


class ConsultarDocumentosResponse(BaseModel):
    items: list[DocumentoResumen]
    total: int
    page: int
    page_size: int
    pages: int


class ValidarDocumentoResponse(BaseModel):
    """Respuesta al validar un documento por número de control."""
    es_valido: bool
    numero_control: str
    tipo_documento: str | None
    numero_documento: str | None
    emisor_rif: str | None
    receptor_rif: str | None
    fecha_emision: datetime | None
    total: float | None
    status: str | None
    firma_digital: str | None


class FiscalErrorResponse(BaseModel):
    """Error estándar de la API fiscal."""
    success: bool = False
    error_code: str
    message: str
    details: list[str] | None = None


# === TEMPLATES / ONBOARDING ===

class ClientTemplateConfig(BaseModel):
    """Configuración de template para onboarding rápido de clientes."""
    # Datos del cliente
    rif: str
    razon_social: str
    direccion_fiscal: str
    telefono: str | None = None
    email: str

    # Tipo de integración
    tipo_sistema: str = Field(
        "api_directa",
        description="api_directa, odoo, sap, woocommerce, prestashop, custom"
    )

    # Configuración de documentos
    series_facturas: str = Field("A", description="Serie para facturas")
    series_nc: str = Field("NC", description="Serie para notas de crédito")
    series_nd: str = Field("ND", description="Serie para notas de débito")

    # Plan
    plan: str = "profesional"

    # Usuarios iniciales
    admin_email: str
    admin_nombre: str
    admin_password: str | None = None


class OnboardingResponse(BaseModel):
    """Respuesta del onboarding de un nuevo cliente."""
    success: bool = True
    client_id: uuid.UUID
    message: str

    # Credenciales de API
    api_key: str
    api_secret: str

    # Endpoints
    api_base_url: str

    # Documentación
    docs_url: str

    # Configuración aplicada
    plan: str
    rango_numeros_control: str
    series_configuradas: dict[str, str]

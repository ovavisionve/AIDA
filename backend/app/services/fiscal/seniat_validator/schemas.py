"""
Modelos Pydantic para la estructura JSON SENIAT V1.4

Refleja exactamente la estructura del JSON Genérico SENIAT V1.4
con todos los 194 campos mapeados según la hoja Excel oficial.
Todos los campos son opcionales a nivel de schema para permitir
validación progresiva (el motor de validación decide obligatoriedad
según el tipo de documento).
"""

from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional


# =============================================================================
# Encabezado > IdentificacionDocumento
# =============================================================================
class IdentificacionDocumento(BaseModel):
    tipoDocumento: Optional[str] = None
    numeroDocumento: Optional[int] = None
    tipoProveedor: Optional[str] = None
    tipoTransaccion: Optional[str] = None
    numPlanillaImportacion: Optional[str] = None
    numExpedienteImportacion: Optional[str] = None
    serieFacturaAfectada: Optional[str] = None
    numeroFacturaAfectada: Optional[int] = None
    fechaFacturaAfectada: Optional[str] = None
    comentarioFacturaAfectada: Optional[str] = None
    montoFacturaAfectada: Optional[str] = None
    regimenEspTributacion: Optional[str] = None
    fechaEmision: Optional[str] = None
    fechaVencimiento: Optional[str] = None
    horaEmision: Optional[str] = None
    tipoDePago: Optional[str] = None
    serie: Optional[str] = None
    sucursal: Optional[int] = None
    tipoDeVenta: Optional[str] = None
    moneda: Optional[str] = None
    transaccionId: Optional[str] = None
    banner: Optional[str] = None


# =============================================================================
# Encabezado > Vendedor
# =============================================================================
class Vendedor(BaseModel):
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    numCajero: Optional[str] = None


# =============================================================================
# Encabezado > Comprador
# =============================================================================
class Comprador(BaseModel):
    tipoIdentificacion: Optional[str] = None
    numeroIdentificacion: Optional[str] = None
    razonSocial: Optional[str] = None
    direccion: Optional[str] = None
    pais: Optional[str] = None
    notificar: Optional[str] = None
    telefono: Optional[list[str]] = None
    correo: Optional[list[str]] = None


# =============================================================================
# Encabezado > SujetoRetenido
# =============================================================================
class SujetoRetenido(BaseModel):
    tipoIdentificacion: Optional[str] = None
    numeroIdentificacion: Optional[str] = None
    razonSocial: Optional[str] = None
    direccion: Optional[str] = None
    pais: Optional[str] = None
    tipoPerceptor: Optional[str] = None
    notificar: Optional[str] = None
    telefono: Optional[list[str]] = None
    correo: Optional[list[str]] = None
    fechaPeriodoImpo: Optional[str] = None
    anoPeriodoImpo: Optional[int] = None
    mesPeriodoImpo: Optional[str] = None
    firmaSello: Optional[str] = None


# =============================================================================
# Encabezado > Terceros
# =============================================================================
class Terceros(BaseModel):
    tipoIdentificacion: Optional[str] = None
    numeroIdentificacion: Optional[str] = None
    razonSocial: Optional[str] = None
    direccion: Optional[str] = None
    tipo: Optional[str] = None
    correo: Optional[list[str]] = None


# =============================================================================
# Sub-objetos de Totales
# =============================================================================
class DescRecargo(BaseModel):
    descRecargo: Optional[str] = None
    montoRecargo: Optional[float] = None


class DescBonificacion(BaseModel):
    descDescuento: Optional[str] = None
    montoDescuento: Optional[float] = None


class ImpuestoSubtotal(BaseModel):
    codigoTotalImp: Optional[str] = None
    alicuotaImp: Optional[float] = None
    baseImponibleImp: Optional[float] = None
    valorTotalImp: Optional[float] = None
    descripcion: Optional[str] = None


class FormaPago(BaseModel):
    descripcion: Optional[str] = None
    fecha: Optional[str] = None
    forma: Optional[str] = None
    monto: Optional[float] = None
    moneda: Optional[str] = None
    tipoCambio: Optional[float] = None
    totalIGTF: Optional[float] = None
    totalIGTF_VES: Optional[float] = Field(None, alias="totalIGTFVES")


# =============================================================================
# Encabezado > Totales
# =============================================================================
class Totales(BaseModel):
    nroItems: Optional[int] = None
    montoGravadoTotal: Optional[float] = None
    montoExentoTotal: Optional[float] = None
    montoPercibidoTotal: Optional[float] = None
    SubtotalAntesDescuentos: Optional[float] = None
    totalDescuento: Optional[float] = None
    totalRecargos: Optional[float] = None
    subtotal: Optional[float] = None
    totalIVA: Optional[float] = None
    montoTotalConIVA: Optional[float] = None
    totalAPagar: Optional[float] = None
    montoEnLetras: Optional[str] = None
    listaRecargo: Optional[list[DescRecargo]] = None
    listaDescBonificacion: Optional[list[DescBonificacion]] = None
    impuestosSubtotal: Optional[list[ImpuestoSubtotal]] = None
    formasPago: Optional[list[FormaPago]] = None
    totalIGTF: Optional[float] = None
    totalIGTFVES: Optional[float] = None


# =============================================================================
# Encabezado > TotalRetencion
# =============================================================================
class TotalRetencion(BaseModel):
    totalBaseImponible: Optional[float] = None
    numeroCompRetencion: Optional[float] = None
    fechaEmisionCR: Optional[str] = None
    totalIVA: Optional[float] = None
    totalRetenido: Optional[float] = None
    totalISRL: Optional[float] = None
    totalIGTF: Optional[float] = None
    tipoComprobante: Optional[int] = None
    totalDocumento: Optional[float] = None
    totalCreditoIVA: Optional[float] = None
    totalSustraendo: Optional[float] = None


# =============================================================================
# Encabezado > TotalesOtraMoneda
# =============================================================================
class ImpuestoSubtotalOtra(BaseModel):
    codigoTotalImp: Optional[str] = None
    alicuotaImp: Optional[float] = None
    baseImponibleImp: Optional[float] = None
    valorTotalImp: Optional[float] = None


class TotalesOtraMoneda(BaseModel):
    moneda: Optional[str] = None
    tipoCambio: Optional[float] = None
    montoGravadoTotal: Optional[float] = None
    montoPercibidoTotal: Optional[float] = None
    montoExentoTotal: Optional[float] = None
    subtotal: Optional[float] = None
    totalAPagar: Optional[float] = None
    totalIVA: Optional[float] = None
    montoTotalConIVA: Optional[float] = None
    montoEnLetras: Optional[str] = None
    subtotalAntesDescuentos: Optional[float] = None
    totalDescuento: Optional[float] = None
    totalRecargos: Optional[float] = None
    listaDescRecargo: Optional[list[DescRecargo]] = None
    listaDescBonificacion: Optional[list[DescBonificacion]] = None
    impuestosSubtotal: Optional[list[ImpuestoSubtotalOtra]] = None


# =============================================================================
# Encabezado
# =============================================================================
class Encabezado(BaseModel):
    identificacionDocumento: Optional[IdentificacionDocumento] = None
    vendedor: Optional[Vendedor] = None
    comprador: Optional[Comprador] = None
    sujetoRetenido: Optional[SujetoRetenido] = None
    terceros: Optional[Terceros] = None
    totales: Optional[Totales] = None
    totalRetencion: Optional[TotalRetencion] = None
    totalesOtraMoneda: Optional[TotalesOtraMoneda] = None


# =============================================================================
# DetalleItems
# =============================================================================
class DetalleItem(BaseModel):
    numeroLinea: Optional[int] = None
    codigoCIIU: Optional[int] = None
    codigoPLU: Optional[str] = None
    indicadorBienoServicio: Optional[str] = None
    codigoInterno: Optional[str] = None
    descripcion: Optional[str] = None
    cantidad: Optional[float] = None
    unidadMedida: Optional[str] = None
    precioUnitario: Optional[float] = None
    precioUnitarioDescuento: Optional[float] = None
    montoBonificacion: Optional[float] = None
    descripcionBonificacion: Optional[str] = None
    descuentoMonto: Optional[float] = None
    RecargoMonto: Optional[float] = None
    precioItem: Optional[float] = None
    precioAntesDescuento: Optional[float] = None
    codigoImpuesto: Optional[str] = None
    tasaIVA: Optional[float] = None
    valorIVA: Optional[float] = None
    valorTotalItem: Optional[float] = None
    peso: Optional[float] = None


# =============================================================================
# DetallesRetencion
# =============================================================================
class DetalleRetencion(BaseModel):
    numeroLinea: Optional[int] = None
    fechaDocumento: Optional[str] = None
    tipoDocumento: Optional[int] = None
    serieDocumento: Optional[str] = None
    numeroDocumento: Optional[int] = None
    numeroControl: Optional[str] = None
    tipoTransaccion: Optional[int] = None
    montoTotal: Optional[float] = None
    montoExento: Optional[float] = None
    baseImponible: Optional[float] = None
    porcentaje: Optional[float] = None
    porcentajeRetencion: Optional[float] = None
    sustraendo: Optional[float] = None
    montoIVA: Optional[float] = None
    retenido: Optional[float] = None
    percibido: Optional[float] = None
    codigoConcepto: Optional[int] = None
    moneda: Optional[str] = None
    campo: Optional[str] = None
    valor: Optional[str] = None


# =============================================================================
# Viajes
# =============================================================================
class Viajes(BaseModel):
    nombreApellidoPasajero: Optional[str] = None
    tipoIdentificacion: Optional[str] = None
    numeroIdentificacion: Optional[str] = None
    domicilioFiscalPasajero: Optional[str] = None
    numeroTelePasajero: Optional[str] = None
    razonSocialServTransporte: Optional[str] = None
    numeroBoleto: Optional[str] = None
    fechaSalida: Optional[str] = None
    horaSalida: Optional[str] = None
    fechaLlegada: Optional[str] = None
    horaLlegada: Optional[str] = None
    nombrePuertoEmbarque: Optional[str] = None
    condicionesEntrega: Optional[str] = None
    puntoSalida: Optional[str] = None
    PuntoDestino: Optional[str] = None


# =============================================================================
# InfoAdicional
# =============================================================================
class InfoAdicional(BaseModel):
    campo: Optional[str] = None
    valor: Optional[str] = None


# =============================================================================
# GuiaDespacho
# =============================================================================
class GuiaDespacho(BaseModel):
    esGuiaDespacho: Optional[str] = None
    motivoTraslado: Optional[str] = None
    descripcionServicio: Optional[str] = None
    tipoProducto: Optional[str] = None
    origenProducto: Optional[str] = None
    pesoOVolumenTotal: Optional[str] = None
    destinoProducto: Optional[str] = None
    # Conductor
    nombreCompleto: Optional[str] = None
    tipoIdentificacion: Optional[str] = None
    numeroIdentificacion: Optional[int | str] = None
    tipoLicencia: Optional[str] = None
    infoContacto: Optional[str] = None
    # Vehículo
    tipoVehiculo: Optional[str] = None
    numeroTransporte: Optional[str] = None
    numeroPlaca: Optional[int | str] = None
    # Transportista (empresa)
    razonSocial: Optional[str] = None
    domicilioFiscal: Optional[str] = None


# =============================================================================
# Transporte
# =============================================================================
class Transporte(BaseModel):
    tipo: Optional[str] = None
    descripcion: Optional[str] = None
    codigo: Optional[str] = None
    origen: Optional[str] = None
    destino: Optional[str] = None
    fechaEntrada: Optional[str] = None
    fechaSalida: Optional[str] = None
    lugarEntrega: Optional[str] = None
    lugarRecepcion: Optional[str] = None
    placa: Optional[str] = None


# =============================================================================
# Imprenta (datos asignados por la imprenta digital - AIDA)
# =============================================================================
class Imprenta(BaseModel):
    snat: Optional[str] = None
    nombre: Optional[str] = None
    rif: Optional[str] = None
    autorizacion: Optional[str] = None
    direccion: Optional[str] = None
    telefonos: Optional[str] = None
    rangoInicial: Optional[str] = None
    rangoFinal: Optional[str] = None
    numeroControl: Optional[str] = None
    fechaAsignacion: Optional[str] = None
    fechaAsignacionNumeroControl: Optional[str] = None
    horaAsignacionNumeroControl: Optional[str] = None


# =============================================================================
# Documento Electrónico Completo (Raíz)
# =============================================================================
class DocumentoElectronico(BaseModel):
    """
    Estructura raíz del documento fiscal electrónico SENIAT V1.4.
    Soporta los 6 tipos de documento fiscal:
    01-Factura, 02-NC, 03-ND, 04-Guía, 05-Retención IVA, 06-Retención ISLR
    """

    encabezado: Optional[Encabezado] = None
    detalleItems: Optional[list[DetalleItem]] = None
    detallesRetencion: Optional[list[DetalleRetencion]] = None
    viajes: Optional[Viajes] = None
    InfoAdicional: Optional[list[InfoAdicional]] = None
    guiaDespacho: Optional[GuiaDespacho] = None
    transporte: Optional[Transporte] = None
    imprenta: Optional[Imprenta] = None

    model_config = {"populate_by_name": True}

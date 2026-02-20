"use client";
import { useState } from "react";

/* ──────────────────────────── DATA ──────────────────────────── */

const TABS = [
  { key: "estructura", label: "Estructura JSON" },
  { key: "documentos", label: "Tipos Documento" },
  { key: "catalogos", label: "Catálogos" },
  { key: "validaciones", label: "Validaciones" },
  { key: "errores", label: "Códigos Respuesta" },
  { key: "imprenta", label: "Imprenta" },
] as const;

type Tab = (typeof TABS)[number]["key"];

/* ── Estructura JSON V1.4 ─────────────────────────────── */
const JSON_SECTIONS = [
  {
    key: "encabezado",
    label: "encabezado",
    desc: "Datos generales del documento fiscal",
    children: [
      {
        key: "identificacionDocumento",
        label: "identificacionDocumento",
        desc: "Tipo, número, fecha, moneda, serie, sucursal, transacción",
        fields: [
          { name: "tipoDocumento", type: "int", req: true, desc: "Catálogo 1 (01-08)" },
          { name: "numeroDocumento", type: "int(19)", req: true, desc: "Número único del documento" },
          { name: "tipoProveedor", type: "string(2)", req: false, desc: "Catálogo 2 (01-10, NA)" },
          { name: "tipoTransaccion", type: "int(2)", req: true, desc: "Catálogo 3 (01-12)" },
          { name: "numPlanillaImportacion", type: "string(20)", req: false, desc: "Solo importaciones" },
          { name: "numExpedienteImportacion", type: "string(20)", req: false, desc: "Solo importaciones" },
          { name: "serieFacturaAfectada", type: "string(20)", req: false, desc: "NC/ND: serie de factura original" },
          { name: "numeroFacturaAfectada", type: "int(19)", req: false, desc: "NC/ND: número de factura original" },
          { name: "fechaFacturaAfectada", type: "string(10)", req: false, desc: "NC/ND: DD/MM/AAAA" },
          { name: "comentarioFacturaAfectada", type: "string(255)", req: false, desc: "NC/ND: motivo" },
          { name: "montoFacturaAfectada", type: "decimal", req: false, desc: "NC/ND: monto original" },
          { name: "regimenEspTributacion", type: "string(55)", req: false, desc: "Catálogo 4 si aplica" },
          { name: "fechaEmision", type: "DD/MM/AAAA", req: true, desc: "Fecha del documento" },
          { name: "fechaVencimiento", type: "DD/MM/AAAA", req: false, desc: "Fecha de vencimiento" },
          { name: "horaEmision", type: "HH:MM:SSam", req: true, desc: "Hora de emisión" },
          { name: "tipoDePago", type: "string(20)", req: true, desc: "Contado / Crédito" },
          { name: "serie", type: "string(10)", req: false, desc: "Serie del documento" },
          { name: "sucursal", type: "int(10)", req: false, desc: "Código de sucursal" },
          { name: "tipoDeVenta", type: "string(20)", req: true, desc: "Catálogo 5 (Interna/Exportación)" },
          { name: "moneda", type: "ISO 4217", req: true, desc: "VES, USD, EUR..." },
          { name: "transaccionId", type: "hex(50)", req: false, desc: "ID único hexadecimal" },
          { name: "banner", type: "string(35)", req: false, desc: "Texto banner publicitario" },
        ],
      },
      {
        key: "vendedor",
        label: "vendedor",
        desc: "Datos del vendedor/cajero",
        fields: [
          { name: "codigo", type: "string(20)", req: false, desc: "Código vendedor" },
          { name: "nombre", type: "string(20)", req: false, desc: "Nombre vendedor" },
          { name: "numCajero", type: "string(20)", req: false, desc: "Número de cajero" },
        ],
      },
      {
        key: "comprador",
        label: "comprador",
        desc: "Datos del comprador/receptor",
        fields: [
          { name: "tipoIdentificacion", type: "string(1)", req: true, desc: "Catálogo 7: V, J, E, P, G, C" },
          { name: "numeroIdentificacion", type: "string(20)", req: true, desc: "RIF / Cédula" },
          { name: "razonSocial", type: "string(255)", req: true, desc: "Nombre o razón social" },
          { name: "direccion", type: "string(255)", req: true, desc: "Dirección fiscal" },
          { name: "pais", type: "ISO 3166", req: true, desc: "Código país (VE)" },
          { name: "notificar", type: "string(1)", req: false, desc: "1 = notificar" },
          { name: "telefono", type: "array", req: false, desc: "Lista de teléfonos" },
          { name: "correo", type: "array", req: false, desc: "Lista de correos" },
        ],
      },
      {
        key: "sujetoRetenido",
        label: "sujetoRetenido",
        desc: "Datos del sujeto retenido (retenciones IVA/ISLR)",
        fields: [
          { name: "tipoIdentificacion", type: "string(1)", req: true, desc: "V, J, E, P, G, C" },
          { name: "numeroIdentificacion", type: "string(20)", req: true, desc: "RIF del sujeto retenido" },
          { name: "razonSocial", type: "string(100)", req: true, desc: "Razón social" },
          { name: "direccion", type: "string(255)", req: false, desc: "Dirección fiscal" },
          { name: "pais", type: "ISO 3166", req: true, desc: "Código país" },
          { name: "tipoPerceptor", type: "string(12)", req: false, desc: "Tipo de perceptor" },
          { name: "notificar", type: "string(1)", req: false, desc: "1 = notificar" },
          { name: "telefono", type: "array", req: false, desc: "Teléfonos" },
          { name: "correo", type: "array", req: false, desc: "Correos" },
          { name: "fechaPeriodoImpo", type: "DD/MM/AAAA", req: false, desc: "Fecha período imposición" },
          { name: "anoPeriodoImpo", type: "int(4)", req: false, desc: "Año período" },
          { name: "mesPeriodoImpo", type: "string(2)", req: false, desc: "Mes período (01-12)" },
          { name: "firmaSello", type: "string(30)", req: false, desc: "Firma / sello" },
        ],
      },
      {
        key: "terceros",
        label: "terceros",
        desc: "Datos de terceros involucrados",
        fields: [
          { name: "tipoIdentificacion", type: "string(1)", req: false, desc: "V, J, E, P, G, C" },
          { name: "numeroIdentificacion", type: "string(20)", req: false, desc: "RIF / Cédula" },
          { name: "razonSocial", type: "string(100)", req: false, desc: "Razón social" },
          { name: "direccion", type: "string(255)", req: false, desc: "Dirección" },
          { name: "tipo", type: "string(255)", req: false, desc: "Tipo de tercero" },
          { name: "correo", type: "array", req: false, desc: "Correos" },
        ],
      },
      {
        key: "totales",
        label: "totales",
        desc: "Totales, impuestos, descuentos y formas de pago",
        fields: [
          { name: "nroItems", type: "int", req: true, desc: "Cantidad de ítems" },
          { name: "montoGravadoTotal", type: "decimal", req: true, desc: "Total gravado" },
          { name: "montoExentoTotal", type: "decimal", req: false, desc: "Total exento" },
          { name: "montoPercibidoTotal", type: "decimal", req: false, desc: "Total percibido" },
          { name: "SubtotalAntesDescuentos", type: "decimal", req: false, desc: "Subtotal antes de descuentos" },
          { name: "totalDescuento", type: "decimal", req: false, desc: "Total descuentos" },
          { name: "totalRecargos", type: "decimal", req: false, desc: "Total recargos" },
          { name: "subtotal", type: "decimal", req: true, desc: "Subtotal neto" },
          { name: "totalIVA", type: "decimal", req: true, desc: "Total IVA" },
          { name: "montoTotalConIVA", type: "decimal", req: true, desc: "Total con IVA" },
          { name: "totalAPagar", type: "decimal", req: true, desc: "Total a pagar" },
          { name: "montoEnLetras", type: "decimal", req: false, desc: "Monto en letras" },
          { name: "formasPago", type: "array", req: true, desc: "Catálogo 10 (formas de pago)" },
          { name: "impuestosSubtotal", type: "array", req: true, desc: "Desglose impuestos" },
          { name: "totalIGTF", type: "decimal", req: false, desc: "Total IGTF" },
          { name: "totalIGTFVES", type: "decimal", req: false, desc: "Total IGTF en VES" },
        ],
      },
      {
        key: "totalRetencion",
        label: "totalRetencion",
        desc: "Totales de retención (IVA / ISLR)",
        fields: [
          { name: "totalBaseImponible", type: "decimal", req: true, desc: "Base imponible total" },
          { name: "numeroCompRetencion", type: "decimal", req: true, desc: "Número comprobante retención" },
          { name: "fechaEmisionCR", type: "DD/MM/AAAA", req: true, desc: "Fecha emisión comprobante" },
          { name: "totalIVA", type: "decimal", req: false, desc: "Total IVA retenido" },
          { name: "totalRetenido", type: "decimal", req: true, desc: "Total retenido" },
          { name: "totalISRL", type: "decimal", req: false, desc: "Total ISLR retenido" },
          { name: "totalIGTF", type: "decimal", req: false, desc: "Total IGTF retenido" },
          { name: "tipoComprobante", type: "int", req: false, desc: "Catálogo 17" },
          { name: "totalDocumento", type: "decimal", req: false, desc: "Total del documento" },
          { name: "totalCreditoIVA", type: "decimal", req: false, desc: "Total crédito IVA" },
          { name: "totalSustraendo", type: "decimal", req: false, desc: "Total sustraendo" },
        ],
      },
      {
        key: "totalesOtraMoneda",
        label: "totalesOtraMoneda",
        desc: "Totales en moneda alterna (USD, EUR, etc.)",
        fields: [
          { name: "moneda", type: "ISO 4217", req: true, desc: "Código moneda alterna" },
          { name: "tipoCambio", type: "decimal", req: true, desc: "Tasa de cambio" },
          { name: "montoGravadoTotal", type: "decimal", req: true, desc: "Total gravado" },
          { name: "subtotal", type: "decimal", req: true, desc: "Subtotal" },
          { name: "totalAPagar", type: "decimal", req: true, desc: "Total a pagar" },
          { name: "totalIVA", type: "decimal", req: true, desc: "Total IVA" },
          { name: "montoTotalConIVA", type: "decimal", req: true, desc: "Total con IVA" },
        ],
      },
    ],
  },
  {
    key: "detalleItems",
    label: "detalleItems[]",
    desc: "Líneas de detalle del documento",
    children: [],
    fields: [
      { name: "numeroLinea", type: "int", req: true, desc: "Número de línea secuencial" },
      { name: "codigoCIIU", type: "int", req: false, desc: "Código CIIU actividad económica" },
      { name: "codigoPLU", type: "string(20)", req: false, desc: "Código PLU del producto" },
      { name: "indicadorBienoServicio", type: "string(1)", req: true, desc: "B = Bien, S = Servicio" },
      { name: "codigoInterno", type: "string(20)", req: false, desc: "Código interno del producto" },
      { name: "descripcion", type: "string(255)", req: true, desc: "Descripción del ítem" },
      { name: "cantidad", type: "decimal(8.2)", req: true, desc: "Cantidad" },
      { name: "unidadMedida", type: "string", req: true, desc: "Catálogo 11 UN/ECE Rec 20" },
      { name: "precioUnitario", type: "decimal", req: true, desc: "Precio unitario sin impuesto" },
      { name: "precioUnitarioDescuento", type: "decimal", req: false, desc: "Precio con descuento aplicado" },
      { name: "montoBonificacion", type: "decimal", req: false, desc: "Monto de bonificación" },
      { name: "descuentoMonto", type: "decimal", req: false, desc: "Monto de descuento" },
      { name: "RecargoMonto", type: "decimal", req: false, desc: "Monto de recargo" },
      { name: "precioItem", type: "decimal", req: true, desc: "Precio neto del ítem" },
      { name: "codigoImpuesto", type: "decimal", req: true, desc: "Catálogo 9: alícuota IVA" },
      { name: "tasaIVA", type: "decimal(2.2)", req: true, desc: "Tasa IVA aplicada (%)" },
      { name: "valorIVA", type: "decimal", req: true, desc: "Valor IVA calculado" },
      { name: "valorTotalItem", type: "decimal", req: true, desc: "Valor total del ítem con IVA" },
      { name: "peso", type: "decimal", req: false, desc: "Peso del producto" },
    ],
  },
  {
    key: "detallesRetencion",
    label: "detallesRetencion[]",
    desc: "Líneas de detalle de retención",
    children: [],
    fields: [
      { name: "numeroLinea", type: "int", req: true, desc: "Número de línea" },
      { name: "fechaDocumento", type: "DDMMAAAA", req: true, desc: "Fecha del documento retenido" },
      { name: "tipoDocumento", type: "int", req: true, desc: "Tipo doc retenido" },
      { name: "serieDocumento", type: "string(20)", req: false, desc: "Serie del documento" },
      { name: "numeroDocumento", type: "int(10)", req: true, desc: "Número del documento" },
      { name: "numeroControl", type: "int(10)", req: true, desc: "Número de control" },
      { name: "tipoTransaccion", type: "int", req: true, desc: "Tipo transacción" },
      { name: "montoTotal", type: "decimal", req: true, desc: "Monto total" },
      { name: "montoExento", type: "decimal", req: false, desc: "Monto exento" },
      { name: "baseImponible", type: "decimal", req: true, desc: "Base imponible" },
      { name: "porcentaje", type: "decimal", req: true, desc: "% alícuota" },
      { name: "porcentajeRetencion", type: "decimal", req: true, desc: "% retención" },
      { name: "sustraendo", type: "decimal", req: false, desc: "Sustraendo" },
      { name: "montoIVA", type: "decimal", req: true, desc: "Monto IVA" },
      { name: "retenido", type: "decimal", req: true, desc: "Monto retenido" },
      { name: "codigoConcepto", type: "int", req: false, desc: "Catálogo 18 (solo ISLR)" },
      { name: "moneda", type: "ISO 4217", req: true, desc: "Moneda" },
    ],
  },
  {
    key: "viajes",
    label: "viajes",
    desc: "Datos de viaje (transporte de pasajeros)",
    children: [],
    fields: [
      { name: "nombreApellidoPasajero", type: "string(100)", req: false, desc: "Nombre del pasajero" },
      { name: "tipoIdentificacion", type: "string(1)", req: false, desc: "V, J, E, P, G, C" },
      { name: "numeroIdentificacion", type: "string", req: false, desc: "Identificación del pasajero" },
      { name: "numeroBoleto", type: "string(14)", req: false, desc: "Número de boleto" },
      { name: "fechaSalida", type: "string(10)", req: false, desc: "Fecha de salida" },
      { name: "fechaLlegada", type: "string(10)", req: false, desc: "Fecha de llegada" },
      { name: "puntoSalida", type: "string(255)", req: false, desc: "Punto de salida" },
      { name: "PuntoDestino", type: "string(255)", req: false, desc: "Punto de destino" },
    ],
  },
  {
    key: "guiaDespacho",
    label: "guiaDespacho",
    desc: "Datos de guía de despacho (tipo 04)",
    children: [],
    fields: [
      { name: "esGuiaDespacho", type: "string(1)", req: true, desc: "1 = Sí" },
      { name: "motivoTraslado", type: "string(255)", req: true, desc: "Catálogo 13" },
      { name: "descripcionServicio", type: "string(255)", req: false, desc: "Descripción del servicio" },
      { name: "tipoProducto", type: "string(55)", req: false, desc: "Catálogo 14" },
      { name: "origenProducto", type: "string(55)", req: false, desc: "Catálogo 15" },
      { name: "pesoOVolumenTotal", type: "string(55)", req: false, desc: "Peso o volumen total" },
      { name: "destinoProducto", type: "string(55)", req: false, desc: "Catálogo 16" },
      { name: "tipoVehiculo", type: "string(255)", req: false, desc: "Tipo de vehículo" },
      { name: "numeroPlaca", type: "int(12)", req: false, desc: "Número de placa" },
    ],
  },
  {
    key: "transporte",
    label: "transporte",
    desc: "Datos de transporte",
    children: [],
    fields: [
      { name: "tipo", type: "string", req: false, desc: "Tipo de transporte" },
      { name: "descripcion", type: "string(255)", req: false, desc: "Descripción" },
      { name: "origen", type: "string(255)", req: false, desc: "Origen" },
      { name: "destino", type: "string(255)", req: false, desc: "Destino" },
      { name: "fechaEntrada", type: "DD/MM/AAAA", req: false, desc: "Fecha entrada" },
      { name: "fechaSalida", type: "DD/MM/AAAA", req: false, desc: "Fecha salida" },
      { name: "placa", type: "string(7)", req: false, desc: "Formato AA123AA" },
    ],
  },
  {
    key: "imprenta",
    label: "imprenta",
    desc: "Datos de la imprenta autorizada (generado por el sistema)",
    children: [],
    fields: [
      { name: "snat", type: "string(255)", req: true, desc: "Identificador SNAT" },
      { name: "nombre", type: "string(255)", req: true, desc: "Nombre de la imprenta" },
      { name: "rif", type: "string(255)", req: true, desc: "RIF de la imprenta" },
      { name: "autorizacion", type: "string(255)", req: true, desc: "Número de autorización" },
      { name: "direccion", type: "string(255)", req: true, desc: "Dirección" },
      { name: "telefonos", type: "string(255)", req: true, desc: "Teléfonos" },
      { name: "rangoInicial", type: "string(20)", req: true, desc: "Rango control inicial" },
      { name: "rangoFinal", type: "string(20)", req: true, desc: "Rango control final" },
      { name: "numeroControl", type: "string(20)", req: true, desc: "Número de control asignado" },
      { name: "fechaAsignacion", type: "string(20)", req: true, desc: "Fecha de asignación" },
      { name: "fechaAsignacionNumeroControl", type: "string(20)", req: true, desc: "Fecha asignación NC" },
      { name: "horaAsignacionNumeroControl", type: "string(20)", req: true, desc: "Hora asignación NC" },
    ],
  },
  {
    key: "InfoAdicional",
    label: "InfoAdicional[]",
    desc: "Campos adicionales clave-valor",
    children: [],
    fields: [],
  },
];

/* ── Tipos de Documento ───────────────────────────── */
const DOCUMENT_TYPES = [
  { code: "01", name: "Factura", desc: "Documento fiscal de venta con detalle de bienes/servicios, impuestos y totales", sections: "encabezado, detalleItems, totales, formasPago, imprenta" },
  { code: "02", name: "Nota de Crédito", desc: "Documento que reduce o anula parcial/totalmente una factura emitida", sections: "encabezado (facturaAfectada requerida), detalleItems, totales, imprenta" },
  { code: "03", name: "Nota de Débito", desc: "Documento que incrementa el monto de una factura emitida", sections: "encabezado (facturaAfectada requerida), detalleItems, totales, imprenta" },
  { code: "04", name: "Guía de Despacho", desc: "Documento para traslado de mercancías con datos de transporte", sections: "encabezado, detalleItems, guiaDespacho, transporte, imprenta" },
  { code: "07", name: "Retención IVA", desc: "Comprobante de retención del Impuesto al Valor Agregado", sections: "encabezado, sujetoRetenido, detallesRetencion, totalRetencion" },
  { code: "08", name: "Retención ISLR", desc: "Comprobante de retención del Impuesto Sobre la Renta", sections: "encabezado, sujetoRetenido, detallesRetencion, totalRetencion" },
];

/* ── Catálogos SENIAT ─────────────────────────────── */
const CATALOGS = [
  {
    id: 1, name: "Tipo de Documento",
    items: [
      { code: "01", label: "Factura" },
      { code: "02", label: "Nota de Crédito" },
      { code: "03", label: "Nota de Débito" },
      { code: "04", label: "Guía de Despacho" },
      { code: "07", label: "Retención IVA" },
      { code: "08", label: "Retención ISLR" },
    ],
  },
  {
    id: 2, name: "Tipo de Proveedor",
    items: [
      { code: "01", label: "Proveedor Normal Nacional" },
      { code: "02", label: "Proveedor Zona Libre" },
      { code: "03", label: "Proveedor Zona Franca" },
      { code: "04", label: "Proveedor ZEDE" },
      { code: "05", label: "Proveedor Puerto Libre" },
      { code: "06", label: "Proveedor No Domiciliado" },
      { code: "07", label: "Proveedor No Residenciado" },
      { code: "08", label: "Proveedor Sin RIF" },
      { code: "09", label: "Ente Público" },
      { code: "10", label: "Contribuyente Formal" },
      { code: "NA", label: "No Aplica" },
    ],
  },
  {
    id: 3, name: "Tipo de Transacción",
    items: [
      { code: "01", label: "Venta interna gravada" },
      { code: "02", label: "Venta interna no gravada" },
      { code: "03", label: "Exportación definitiva" },
      { code: "04", label: "Venta de activos" },
      { code: "05", label: "Importación" },
      { code: "06", label: "No sujeta" },
      { code: "07", label: "Venta interna gravada por cuenta de terceros" },
      { code: "08", label: "Venta interna no gravada por cuenta de terceros" },
      { code: "09", label: "Exportación de servicios" },
      { code: "10", label: "Venta interna con percepción" },
      { code: "11", label: "Ajuste por débito fiscal" },
      { code: "12", label: "Ajuste por crédito fiscal" },
    ],
  },
  {
    id: 4, name: "Régimen Especial de Tributación",
    items: [
      { code: "ZEE", label: "Zonas Económicas Especiales" },
      { code: "ZFP", label: "Zona Franca Paraguaná" },
      { code: "ZFI", label: "Zona Franca Industrial" },
      { code: "PL", label: "Puerto Libre (Margarita)" },
      { code: "ZEDE", label: "Zona Especial de Desarrollo Económico" },
    ],
  },
  {
    id: 5, name: "Tipo de Venta",
    items: [
      { code: "INT", label: "Venta Interna" },
      { code: "EXP-FOB", label: "Exportación FOB" },
      { code: "EXP-CIF", label: "Exportación CIF" },
      { code: "EXP-EXW", label: "Exportación EXW" },
    ],
  },
  {
    id: 7, name: "Tipo de Identificación",
    items: [
      { code: "V", label: "Venezolano (Cédula)" },
      { code: "J", label: "Jurídico (RIF persona jurídica)" },
      { code: "E", label: "Extranjero" },
      { code: "P", label: "Pasaporte" },
      { code: "G", label: "Gobierno" },
      { code: "C", label: "Consular" },
    ],
  },
  {
    id: 9, name: "Alícuotas IVA",
    items: [
      { code: "G", label: "General — 16%" },
      { code: "R", label: "Reducida — 8%" },
      { code: "A", label: "Adicional — 31%" },
      { code: "E", label: "Exento — 0%" },
      { code: "P", label: "Percibido — 0%" },
      { code: "X", label: "No sujeto — 0%" },
      { code: "IGTF", label: "IGTF — 3%" },
    ],
  },
  {
    id: 10, name: "Formas de Pago",
    items: [
      { code: "01", label: "Efectivo" },
      { code: "02", label: "Tarjeta de Débito" },
      { code: "03", label: "Tarjeta de Crédito" },
      { code: "04", label: "Transferencia bancaria" },
      { code: "05", label: "Pago Móvil" },
      { code: "06", label: "Vale / Cesta ticket" },
      { code: "07", label: "Cheque" },
      { code: "08", label: "Criptomoneda / Petro" },
      { code: "09", label: "Dólares en efectivo" },
      { code: "10", label: "Euros en efectivo" },
      { code: "11", label: "Canje / Permuta" },
      { code: "12", label: "Nota de crédito" },
      { code: "13", label: "Bonificación" },
      { code: "14", label: "Financiamiento" },
      { code: "15", label: "Anticipo" },
      { code: "16", label: "Pago por cuotas" },
      { code: "17", label: "Consignación" },
      { code: "18", label: "Zelle / Plataforma digital" },
      { code: "99", label: "Otra forma de pago" },
    ],
  },
  {
    id: 12, name: "Otros Impuestos",
    items: [
      { code: "IGTF", label: "Impuesto a las Grandes Transacciones Financieras — 3%" },
    ],
  },
  {
    id: 13, name: "Motivos de Traslado",
    items: [
      { code: "01", label: "Venta" },
      { code: "02", label: "Compra" },
      { code: "03", label: "Traslado entre almacenes" },
      { code: "04", label: "Consignación" },
      { code: "05", label: "Devolución" },
      { code: "06", label: "Importación" },
      { code: "07", label: "Exportación" },
      { code: "08", label: "Otro" },
    ],
  },
  {
    id: 14, name: "Tipo de Producto",
    items: [
      { code: "ALC", label: "Especies alcohólicas" },
      { code: "CIG", label: "Cigarrillos y manufactura de tabaco" },
      { code: "GEN", label: "Producto general" },
    ],
  },
  {
    id: 15, name: "Origen del Producto",
    items: [
      { code: "NAC", label: "Nacional" },
      { code: "IMP", label: "Importado" },
      { code: "MIX", label: "Nacional e importado" },
    ],
  },
  {
    id: 16, name: "Destino del Producto",
    items: [
      { code: "TF", label: "Tierra firme" },
      { code: "RE", label: "Régimen especial" },
    ],
  },
  {
    id: 17, name: "Tipo Comprobante Retención ISLR",
    items: [
      { code: "1", label: "Sueldos y salarios" },
      { code: "2", label: "Servicios profesionales" },
      { code: "3", label: "Comisiones" },
      { code: "4", label: "Arrendamiento" },
      { code: "5", label: "Intereses" },
      { code: "6", label: "Fletes" },
      { code: "7", label: "Publicidad y propaganda" },
      { code: "8", label: "Honorarios profesionales" },
      { code: "9", label: "Enajenación de acciones" },
      { code: "10", label: "Otros conceptos" },
    ],
  },
  {
    id: 21, name: "Tipo Sujeto Retenido ISLR",
    items: [
      { code: "1", label: "Persona natural residente" },
      { code: "2", label: "Persona natural no residente" },
      { code: "3", label: "Persona jurídica domiciliada" },
      { code: "4", label: "Persona jurídica no domiciliada" },
    ],
  },
];

/* ── Reglas de Validación ─────────────────────────── */
const VALIDATIONS = [
  { field: "tipoDocumento", rule: "Valores: 01, 02, 03, 04, 07, 08", regex: "^(0[1-4]|0[78])$", applies: "Todos" },
  { field: "numeroDocumento", rule: "Entero positivo, máximo 19 dígitos", regex: "^[0-9]{1,19}$", applies: "Todos" },
  { field: "tipoProveedor", rule: "Catálogo 2: 01-10 ó NA. Requerido solo para tipoDoc 01,02,03", regex: "^(0[1-9]|10|NA)$", applies: "01,02,03" },
  { field: "tipoTransaccion", rule: "Catálogo 3: 01-12", regex: "^(0[1-9]|1[0-2])$", applies: "01,02,03,04" },
  { field: "fechaEmision", rule: "Formato DD/MM/AAAA, no puede ser fecha futura", regex: "^\\d{2}/\\d{2}/\\d{4}$", applies: "Todos" },
  { field: "horaEmision", rule: "Formato HH:MM:SSam/pm", regex: "^\\d{2}:\\d{2}:\\d{2}(am|pm)$", applies: "Todos" },
  { field: "moneda", rule: "ISO 4217 (VES, USD, EUR, etc.)", regex: "^[A-Z]{3}$", applies: "Todos" },
  { field: "tipoIdentificacion", rule: "V, J, E, P, G ó C", regex: "^[VJEPGC]$", applies: "Comprador/SujetoRetenido" },
  { field: "numeroIdentificacion", rule: "Formato: J-12345678-9 ó V-12345678", regex: "^[VJEPGC]-\\d{5,9}(-\\d)?$", applies: "Comprador/SujetoRetenido" },
  { field: "indicadorBienoServicio", rule: "B = Bien, S = Servicio", regex: "^[BS]$", applies: "detalleItems" },
  { field: "tasaIVA", rule: "0, 8, 16 ó 31 según alícuota", regex: "^(0(\\.00)?|8(\\.00)?|16(\\.00)?|31(\\.00)?)$", applies: "detalleItems" },
  { field: "serieFacturaAfectada", rule: "Requerido para NC (02) y ND (03)", regex: "^.{1,20}$", applies: "02,03" },
  { field: "numeroFacturaAfectada", rule: "Requerido para NC (02) y ND (03)", regex: "^[0-9]{1,19}$", applies: "02,03" },
  { field: "esGuiaDespacho", rule: "Requerido para Guía Despacho (04), valor = 1", regex: "^1$", applies: "04" },
  { field: "porcentajeRetencion", rule: "75% para contribuyentes especiales IVA, 100% para no domiciliados", regex: "^\\d{1,3}(\\.\\d{1,2})?$", applies: "07,08" },
];

/* ── Códigos de Respuesta ─────────────────────────── */
const ERROR_CODES = [
  { code: "200", status: "Aceptado", color: "green", desc: "Documento procesado y aceptado exitosamente por SENIAT" },
  { code: "201", status: "Duplicado", color: "yellow", desc: "Documento ya fue enviado previamente. No se reprocesa, se retorna el resultado anterior" },
  { code: "203", status: "Rechazado", color: "red", desc: "Documento rechazado por errores de validación. Revisar detalle de errores en la respuesta" },
  { code: "400", status: "Error JSON", color: "red", desc: "JSON mal formado o estructura inválida. Verificar formato del body" },
  { code: "401", status: "No Autorizado", color: "orange", desc: "Token de autenticación inválido, expirado o no proporcionado" },
  { code: "500", status: "Error Interno", color: "red", desc: "Error interno del servidor SENIAT. Reintentar con backoff exponencial" },
];

/* ── Imprenta ALDA S.A. ──────────────────────────── */
const IMPRENTA_INFO = {
  nombre: "ALDA S.A.",
  rif: "Pendiente registro SENIAT",
  objeto: [
    "Servicios de impresión digital de documentos fiscales",
    "Facturación electrónica y emisión de documentos tributarios",
    "Desarrollo de software y aplicaciones tecnológicas",
    "Servicios de tecnología, telecomunicaciones y asesoría",
    "Intermediación digital y comercio electrónico",
  ],
  capital: "200.000,00 USD (doscientos mil dólares americanos)",
  socios: [
    { nombre: "Hector Jose Hernandez Azuaje", cargo: "Director Principal / Presidente", participacion: "50%" },
    { nombre: "Hector Eduardo Hernandez Azuaje", cargo: "Director", participacion: "50%" },
  ],
  nodoImprenta: [
    "El nodo 'imprenta' es generado automáticamente por AIDA",
    "NO debe ser enviado por el contribuyente",
    "Contiene: snat, nombre, rif, autorización, dirección, teléfonos",
    "Incluye rangos de numeración de control asignados",
    "Se genera al momento de asignar número de control al documento",
  ],
};

/* ──────────────────────────── COMPONENT ──────────────────────────── */

export default function SeniatReference({ token: _token }: { token: string }) {
  const [tab, setTab] = useState<Tab>("estructura");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["encabezado"]));
  const [expandedSub, setExpandedSub] = useState<Set<string>>(new Set(["identificacionDocumento"]));
  const [catalogFilter, setCatalogFilter] = useState("");

  const toggle = (key: string, set: Set<string>, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    setter(next);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Referencia SENIAT V1.4</h1>
          <p className="text-sm text-gray-500 mt-1">
            Estructura JSON, catálogos, reglas de validación y códigos de respuesta
          </p>
        </div>
        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold">
          Versión 1.4
        </span>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 p-1 bg-white/5 rounded-xl">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? "bg-aida-accent text-white shadow-lg shadow-aida-accent/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── TAB: Estructura JSON ─── */}
      {tab === "estructura" && (
        <div className="space-y-3">
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg text-sm text-blue-400">
            Estructura completa del JSON genérico SENIAT V1.4. Haga clic en cada sección para expandir
            y ver los campos con tipo, requerimiento y descripción.
          </div>

          {JSON_SECTIONS.map(section => (
            <div key={section.key} className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
              <button onClick={() => toggle(section.key, expandedSections, setExpandedSections)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                    expandedSections.has(section.key) ? "bg-aida-accent/20 text-aida-cyan" : "bg-white/10 text-gray-400"
                  }`}>{section.label}</span>
                  <span className="text-sm text-gray-400">{section.desc}</span>
                </div>
                <svg className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections.has(section.key) ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedSections.has(section.key) && (
                <div className="border-t border-white/5 p-4 space-y-3">
                  {/* If section has children (sub-objects like encabezado) */}
                  {section.children && section.children.length > 0 && section.children.map(sub => (
                    <div key={sub.key} className="rounded-lg border border-white/5 bg-white/[0.02]">
                      <button onClick={() => toggle(sub.key, expandedSub, setExpandedSub)}
                        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-purple-400">.{sub.label}</span>
                          <span className="text-xs text-gray-500">{sub.desc}</span>
                          <span className="text-[10px] text-gray-600">{sub.fields.length} campos</span>
                        </div>
                        <svg className={`w-3 h-3 text-gray-500 transition-transform ${expandedSub.has(sub.key) ? "rotate-180" : ""}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {expandedSub.has(sub.key) && (
                        <div className="border-t border-white/5">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-white/[0.03] text-gray-500">
                                <th className="text-left py-2 px-3 font-medium">Campo</th>
                                <th className="text-left py-2 px-3 font-medium">Tipo</th>
                                <th className="text-center py-2 px-3 font-medium">Req.</th>
                                <th className="text-left py-2 px-3 font-medium">Descripción</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sub.fields.map(f => (
                                <tr key={f.name} className="border-t border-white/5 hover:bg-white/5">
                                  <td className="py-1.5 px-3 font-mono text-aida-cyan">{f.name}</td>
                                  <td className="py-1.5 px-3 text-gray-400">{f.type}</td>
                                  <td className="py-1.5 px-3 text-center">
                                    {f.req
                                      ? <span className="text-red-400 font-bold">*</span>
                                      : <span className="text-gray-600">-</span>}
                                  </td>
                                  <td className="py-1.5 px-3 text-gray-400">{f.desc}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* If section has direct fields (like detalleItems) */}
                  {section.fields && section.fields.length > 0 && (!section.children || section.children.length === 0) && (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-white/[0.03] text-gray-500">
                          <th className="text-left py-2 px-3 font-medium">Campo</th>
                          <th className="text-left py-2 px-3 font-medium">Tipo</th>
                          <th className="text-center py-2 px-3 font-medium">Req.</th>
                          <th className="text-left py-2 px-3 font-medium">Descripción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.fields.map(f => (
                          <tr key={f.name} className="border-t border-white/5 hover:bg-white/5">
                            <td className="py-1.5 px-3 font-mono text-aida-cyan">{f.name}</td>
                            <td className="py-1.5 px-3 text-gray-400">{f.type}</td>
                            <td className="py-1.5 px-3 text-center">
                              {f.req
                                ? <span className="text-red-400 font-bold">*</span>
                                : <span className="text-gray-600">-</span>}
                            </td>
                            <td className="py-1.5 px-3 text-gray-400">{f.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Special case for InfoAdicional with no fields */}
                  {section.fields && section.fields.length === 0 && (!section.children || section.children.length === 0) && (
                    <p className="text-xs text-gray-500 px-3">
                      Array de objetos clave-valor para información adicional personalizada.
                      Formato: {"{"} &quot;campo&quot;: &quot;nombre&quot;, &quot;valor&quot;: &quot;contenido&quot; {"}"}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── TAB: Tipos de Documento ─── */}
      {tab === "documentos" && (
        <div className="space-y-4">
          <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-lg text-sm text-purple-400">
            SENIAT V1.4 define 6 tipos de documentos fiscales. Cada tipo requiere secciones específicas del JSON.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DOCUMENT_TYPES.map(dt => (
              <div key={dt.code} className="rounded-xl border border-white/10 bg-white/[0.03] p-5 hover:border-white/20 transition">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl font-bold text-aida-cyan font-mono">{dt.code}</span>
                  <div>
                    <h3 className="font-semibold text-white">{dt.name}</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-3">{dt.desc}</p>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Secciones requeridas</p>
                  <div className="flex flex-wrap gap-1">
                    {dt.sections.split(", ").map(s => (
                      <span key={s} className="text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded font-mono">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB: Catálogos ─── */}
      {tab === "catalogos" && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg text-sm text-green-400 flex-1">
              {CATALOGS.length} catálogos oficiales SENIAT V1.4. Cada catálogo define los valores permitidos para un campo específico.
            </div>
            <input
              value={catalogFilter}
              onChange={e => setCatalogFilter(e.target.value)}
              placeholder="Buscar catálogo..."
              className="bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-aida-accent w-48"
            />
          </div>

          <div className="space-y-3">
            {CATALOGS.filter(c =>
              !catalogFilter || c.name.toLowerCase().includes(catalogFilter.toLowerCase()) ||
              c.items.some(i => i.label.toLowerCase().includes(catalogFilter.toLowerCase()))
            ).map(cat => (
              <div key={cat.id} className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
                <div className="flex items-center gap-3 p-4 border-b border-white/5">
                  <span className="text-xs font-mono bg-aida-accent/20 text-aida-cyan px-2 py-0.5 rounded">
                    Cat. {String(cat.id).padStart(2, "0")}
                  </span>
                  <h3 className="font-semibold text-white text-sm">{cat.name}</h3>
                  <span className="text-xs text-gray-500">{cat.items.length} valores</span>
                </div>
                <div className="p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                    {cat.items.map(item => (
                      <div key={item.code} className="flex items-center gap-2 px-3 py-1.5 rounded bg-white/[0.03] hover:bg-white/5">
                        <span className="font-mono text-xs text-aida-cyan min-w-[3rem]">{item.code}</span>
                        <span className="text-xs text-gray-300">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB: Validaciones ─── */}
      {tab === "validaciones" && (
        <div className="space-y-4">
          <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-lg text-sm text-orange-400">
            Reglas de validación principales del SENIAT V1.4. Los documentos que no cumplan serán rechazados con código 203.
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-white/[0.03] text-gray-500 border-b border-white/5">
                  <th className="text-left py-3 px-4 font-medium">Campo</th>
                  <th className="text-left py-3 px-4 font-medium">Regla</th>
                  <th className="text-left py-3 px-4 font-medium">Regex</th>
                  <th className="text-left py-3 px-4 font-medium">Aplica a</th>
                </tr>
              </thead>
              <tbody>
                {VALIDATIONS.map((v, i) => (
                  <tr key={i} className="border-t border-white/5 hover:bg-white/5">
                    <td className="py-2 px-4 font-mono text-aida-cyan whitespace-nowrap">{v.field}</td>
                    <td className="py-2 px-4 text-gray-300">{v.rule}</td>
                    <td className="py-2 px-4">
                      <code className="bg-white/10 px-1.5 py-0.5 rounded text-purple-400 text-[10px]">{v.regex}</code>
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex flex-wrap gap-1">
                        {v.applies.split(",").map(a => (
                          <span key={a} className="bg-white/10 text-gray-400 px-1.5 py-0.5 rounded text-[10px]">{a.trim()}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <h4 className="text-sm font-semibold text-amber-400 mb-2">Notas importantes</h4>
            <ul className="text-xs text-amber-400/80 space-y-1 list-disc list-inside">
              <li>Los campos marcados con * son requeridos según el tipo de documento</li>
              <li>NC (02) y ND (03) requieren obligatoriamente los campos de factura afectada</li>
              <li>Guía de Despacho (04) requiere la sección guiaDespacho completa</li>
              <li>Retenciones (07, 08) requieren sujetoRetenido y detallesRetencion</li>
              <li>El nodo imprenta NO debe ser enviado — es generado por AIDA automáticamente</li>
              <li>Montos decimales con máximo 2 decimales separados por punto</li>
              <li>Comunicación exclusivamente HTTPS/TLS</li>
            </ul>
          </div>
        </div>
      )}

      {/* ─── TAB: Códigos de Respuesta ─── */}
      {tab === "errores" && (
        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg text-sm text-red-400">
            Códigos de respuesta de la API SENIAT V1.4. Todos los endpoints retornan estos códigos HTTP.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ERROR_CODES.map(ec => {
              const colors: Record<string, string> = {
                green: "border-green-500/30 bg-green-500/5",
                yellow: "border-yellow-500/30 bg-yellow-500/5",
                red: "border-red-500/30 bg-red-500/5",
                orange: "border-orange-500/30 bg-orange-500/5",
              };
              const textColors: Record<string, string> = {
                green: "text-green-400",
                yellow: "text-yellow-400",
                red: "text-red-400",
                orange: "text-orange-400",
              };
              return (
                <div key={ec.code} className={`rounded-xl border p-5 ${colors[ec.color]}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-3xl font-bold font-mono ${textColors[ec.color]}`}>{ec.code}</span>
                    <span className={`text-sm font-semibold ${textColors[ec.color]}`}>{ec.status}</span>
                  </div>
                  <p className="text-sm text-gray-400">{ec.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Estructura de respuesta de error (203)</h4>
            <pre className="text-xs text-gray-400 bg-white/5 p-4 rounded-lg overflow-auto">{`{
  "codigo": 203,
  "mensaje": "Documento rechazado",
  "errores": [
    {
      "campo": "encabezado.identificacionDocumento.tipoDocumento",
      "mensaje": "Valor no permitido: 05",
      "regla": "Catálogo 1: valores permitidos 01,02,03,04,07,08"
    },
    {
      "campo": "encabezado.comprador.numeroIdentificacion",
      "mensaje": "Formato inválido",
      "regla": "Formato esperado: X-NNNNNNNN(-N)"
    }
  ]
}`}</pre>
          </div>
        </div>
      )}

      {/* ─── TAB: Imprenta ─── */}
      {tab === "imprenta" && (
        <div className="space-y-4">
          <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-lg text-sm text-indigo-400">
            Información de ALDA S.A. como imprenta autorizada y cómo se genera el nodo &quot;imprenta&quot; en los documentos fiscales.
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-aida-accent to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                A
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{IMPRENTA_INFO.nombre}</h3>
                <p className="text-xs text-gray-500">{IMPRENTA_INFO.rif}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Objeto Social</h4>
                <ul className="space-y-1.5">
                  {IMPRENTA_INFO.objeto.map((o, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-aida-accent mt-1 flex-shrink-0" />
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Directiva</h4>
                <div className="space-y-3">
                  {IMPRENTA_INFO.socios.map((s, i) => (
                    <div key={i} className="bg-white/5 rounded-lg p-3">
                      <p className="text-sm text-white font-medium">{s.nombre}</p>
                      <p className="text-xs text-gray-500">{s.cargo} — {s.participacion}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 bg-white/5 rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Capital Social</p>
                  <p className="text-sm text-white">{IMPRENTA_INFO.capital}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
            <h4 className="text-sm font-semibold text-amber-400 mb-3">Nodo Imprenta — Generación Automática</h4>
            <ul className="space-y-2">
              {IMPRENTA_INFO.nodoImprenta.map((n, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-400/80">
                  <span className="mt-0.5">{'>'}</span>
                  {n}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Ejemplo de nodo imprenta generado</h4>
            <pre className="text-xs text-gray-400 bg-white/5 p-4 rounded-lg overflow-auto">{`{
  "imprenta": {
    "snat": "SNAT-AIDA-2025-XXXXX",
    "nombre": "ALDA S.A.",
    "rif": "J-XXXXXXXXX-X",
    "autorizacion": "AUT-SENIAT-XXXXX",
    "direccion": "Caracas, Venezuela",
    "telefonos": "+58-XXX-XXXXXXX",
    "rangoInicial": "00-00000001",
    "rangoFinal": "00-01000000",
    "numeroControl": "00-00001234",
    "fechaAsignacion": "20/02/2026",
    "fechaAsignacionNumeroControl": "20/02/2026",
    "horaAsignacionNumeroControl": "10:30:00am"
  }
}`}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

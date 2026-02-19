"""
Catálogos Oficiales SENIAT V1.4
21 catálogos de referencia para validación de documentos fiscales.

Fuente: GGTIC.GIT.00.02 / Versión 1.4 - Agosto 2025
"""

# =============================================================================
# CATÁLOGO 1 - Tipo de Documento Fiscal
# =============================================================================
TIPO_DOCUMENTO = {
    "01": "Factura",
    "02": "Nota de Crédito",
    "03": "Nota de Débito",
    "04": "Orden de Entrega o Guía de Despacho",
    "05": "Comprobante de Retención IVA",
    "06": "Comprobante de Retención ISLR",
}

TIPOS_FACTURA = {"01"}
TIPOS_NOTAS = {"02", "03"}
TIPOS_RETENCION = {"05", "06"}
TIPOS_GUIA = {"04"}

# =============================================================================
# CATÁLOGO 2 - Tipo de Proveedor
# =============================================================================
TIPO_PROVEEDOR = {
    "": "Normal",
    "NA": "Normal",
    "SR": "Sin RIF",
    "NR": "No Residenciado",
    "ND": "No Domiciliado",
}

# =============================================================================
# CATÁLOGO 3 - Tipo de Transacción
# =============================================================================
TIPO_TRANSACCION = {
    "01": "Registro",
    "02": "Complemento",
    "03": "Anulación",
    "04": "Ajuste",
}

# =============================================================================
# CATÁLOGO 4 - Régimen Especial de Tributación
# =============================================================================
REGIMEN_ESPECIAL = {
    "Zonas Economicas Especiales",
    "Zona Franca de Paraguana",
    "Zona Libre de Paraguana",
    "Puerto Libre Santa Elena de Uairen",
    "Zona Libre de Merida",
    "Puerto Libre Edo. Nueva Esparta",
    "Dutty Free",
}

# =============================================================================
# CATÁLOGO 5 - Tipo de Venta
# =============================================================================
TIPO_VENTA = {
    "Interna",
    "Exportacion (INCOTERM): FOB",
    "Exportacion (INCOTERM): CIF",
    "Exportacion (INCOTERM): EXW",
}

# =============================================================================
# CATÁLOGO 6 - Códigos Internacionales de Moneda (ISO 4217)
# Subconjunto más usado en Venezuela + referencia a ISO completa
# =============================================================================
MONEDAS_COMUNES = {
    "VES": "Bolívar Digital",
    "USD": "Dólar Estadounidense",
    "EUR": "Euro",
    "COP": "Peso Colombiano",
    "BRL": "Real Brasileño",
    "GBP": "Libra Esterlina",
    "CNY": "Yuan Chino",
    "ARS": "Peso Argentino",
    "CLP": "Peso Chileno",
    "MXN": "Peso Mexicano",
    "PEN": "Sol Peruano",
    "CAD": "Dólar Canadiense",
    "CHF": "Franco Suizo",
    "JPY": "Yen Japonés",
    "TRY": "Lira Turca",
}

# Para validación completa, cualquier código ISO 4217 de 3 letras es válido
MONEDA_CURSO_LEGAL = "VES"

# =============================================================================
# CATÁLOGO 7 - Tipo de Número de Identificación
# =============================================================================
TIPO_IDENTIFICACION = {
    "V": "Natural de la República Bolivariana de Venezuela",
    "J": "Persona Jurídica",
    "E": "Extranjero con residencia en Venezuela",
    "P": "Agente registrado con Pasaporte",
    "G": "Ente Gubernamental",
    "C": "Comunal",
}

# =============================================================================
# CATÁLOGO 8 - Código de País (ISO 3166-1 alfa-2)
# Subconjunto más usado + referencia a ISO completa
# =============================================================================
PAISES_COMUNES = {
    "VE": "Venezuela",
    "US": "Estados Unidos",
    "CO": "Colombia",
    "BR": "Brasil",
    "MX": "México",
    "AR": "Argentina",
    "CL": "Chile",
    "PE": "Perú",
    "EC": "Ecuador",
    "PA": "Panamá",
    "ES": "España",
    "PT": "Portugal",
    "GB": "Reino Unido",
    "DE": "Alemania",
    "FR": "Francia",
    "IT": "Italia",
    "CN": "China",
    "JP": "Japón",
}

# =============================================================================
# CATÁLOGO 9 - Tipos de Alícuotas IVA
# =============================================================================
ALICUOTAS_IVA = {
    "R": {"tasa": 8.00, "descripcion": "Alícuota Reducida - bienes básicos (art. 63)"},
    "G": {"tasa": 16.00, "descripcion": "Alícuota General - bienes y servicios comunes (art. 27-63)"},
    "A": {"tasa": 31.00, "descripcion": "Alícuota Adicional (suntuario) - General 16% + adicional 15% (art. 61)"},
    "E": {"tasa": 0.00, "descripcion": "Exento, Exonerado o No Gravado (art. 17, 18 y 19)"},
    "P": {"tasa": 0.00, "descripcion": "Percibido - IVA retenido o percibido a cuenta del contribuyente"},
    "X": {"tasa": 0.00, "descripcion": "Exportaciones Ordinarias - hecho imponible con alícuota 0% (art. 27)"},
}

CODIGOS_IVA_GRAVADOS = {"R", "G", "A"}
CODIGOS_IVA_CERO = {"E", "P", "X"}
CODIGOS_IVA_TODOS = {"R", "G", "A", "E", "P", "X"}

IGTF_TASA = 3.00
IGTF_CODIGO = "IGTF"

# =============================================================================
# CATÁLOGO 10 - Formas de Pago
# =============================================================================
FORMAS_PAGO = {
    "01": "Depósito en cuenta",
    "02": "Giro",
    "03": "Transferencia de fondos",
    "04": "Orden de pago",
    "05": "Tarjeta de débito",
    "06": "Tarjeta de crédito (Nacional o Internacional)",
    "07": "Cheques con cláusula NO NEGOCIABLE",
    "08": "Efectivo Moneda Curso Legal",
    "09": "Efectivo Divisa",
    "10": "Medios de pago usados en comercio exterior",
    "11": "Transferencias - Comercio exterior",
    "12": "Cheques bancarios - Comercio exterior",
    "13": "Orden de pago simple - Comercio exterior",
    "14": "Orden de pago documentario - Comercio exterior",
    "15": "Remesa simple - Comercio exterior",
    "16": "Remesa documentaria - Comercio exterior",
    "17": "Carta de crédito simple - Comercio exterior",
    "18": "Carta de crédito documentario - Comercio exterior",
    "99": "Otros medios de pago",
}

FORMAS_PAGO_DIVISAS = {"09", "10", "11", "12", "13", "14", "15", "16", "17", "18"}

# =============================================================================
# CATÁLOGO 11 - Códigos Unidad de Medida (UN/ECE Recommendation 20)
# Subconjunto más usado en Venezuela
# =============================================================================
UNIDADES_MEDIDA = {
    "EA": "Unidad (Each)",
    "KGM": "Kilogramo",
    "GRM": "Gramo",
    "LTR": "Litro",
    "MTR": "Metro",
    "MTK": "Metro cuadrado",
    "MTQ": "Metro cúbico",
    "TNE": "Tonelada métrica",
    "KMT": "Kilómetro",
    "HUR": "Hora",
    "DAY": "Día",
    "MON": "Mes",
    "ANN": "Año",
    "SET": "Conjunto",
    "BX": "Caja",
    "PK": "Paquete",
    "BG": "Bolsa",
    "RL": "Rollo",
    "DZ": "Docena",
    "PR": "Par",
    "CT": "Cartón",
    "BT": "Botella",
    "GL": "Galón",
    "MLT": "Mililitro",
    "CMT": "Centímetro",
    "MMT": "Milímetro",
    "INH": "Pulgada",
    "FOT": "Pie",
    "LBR": "Libra",
    "OZA": "Onza",
}

# =============================================================================
# CATÁLOGO 12 - Otros Impuestos Globales
# =============================================================================
OTROS_IMPUESTOS = {
    "IGTF": {
        "tasa": 3.00,
        "descripcion": "Impuesto a las Grandes Transacciones Financieras",
        "nota": "Solo aplica al total pagado en divisas/cripto. Base imponible: equivalente en Bs.",
    },
}

# =============================================================================
# CATÁLOGO 13 - Motivos del Traslado
# =============================================================================
MOTIVOS_TRASLADO = {
    "Reparacion o perfeccionamiento",
    "Traslado de deposito, almacenes o bodegas propio",
    "Almacenes, depositos o bodegas de otros",
    "Transito aduanero",
    "Otras causas",
}

# =============================================================================
# CATÁLOGO 14 - Tipo de Producto (Guía de Despacho)
# =============================================================================
TIPO_PRODUCTO = {
    "Alcohol",
    "Cigarrillos",
}

# =============================================================================
# CATÁLOGO 15 - Origen del Producto
# =============================================================================
ORIGEN_PRODUCTO = {
    "Nacional",
    "Importado",
    "Nacional e importado",
}

# =============================================================================
# CATÁLOGO 16 - Destino del Producto
# =============================================================================
DESTINO_PRODUCTO = {
    "Tierra firme",
    "Regimen especial",
}

# =============================================================================
# CATÁLOGO 17 - Tipo de Comprobante de Retención ISLR
# =============================================================================
TIPO_COMPROBANTE_ISLR = {
    "1": "Sueldos, salarios y demás remuneraciones similares",
    "2": "Actividades profesionales realizadas sin relación de dependencia",
    "3": "Comisiones por enajenación de inmuebles y comisiones mercantiles. Intereses",
    "4": "Fletes",
    "5": "Primas de seguros",
    "6": "Arrendamiento de bienes muebles e inmuebles",
    "7": "Pagos por empresas emisoras de tarjetas de crédito",
    "8": "Servicios de publicidad",
    "9": "Enajenación de acciones",
    "10": "Adquisición de fondos de comercio",
}

# =============================================================================
# CATÁLOGO 18 - Código Concepto ISLR
# Referencia: Artículo 9, Decreto 1808 de 1997 (G.O. 36.203)
# =============================================================================
# Los códigos son del tipo 0XX según la tabla oficial del decreto

# =============================================================================
# CATÁLOGO 19 - Tasas Porcentaje Retención ISLR
# Referencia: Artículo 9, Decreto 1808 (G.O. 36.203 del 12-05-1997)
# Las tasas varían según el código concepto
# =============================================================================

# =============================================================================
# CATÁLOGO 20 - Bases Imponibles Aplicables ISLR
# Referencia: Artículo 9, Decreto 1808 de 1997
# Solo para retenciones ISLR
# =============================================================================

# =============================================================================
# CATÁLOGO 21 - Tipos de Sujeto Retenido ISLR
# =============================================================================
TIPO_SUJETO_RETENIDO = {
    "1": "PN-RESIDENTE (Persona Natural - Residente)",
    "2": "PJ-DOMICILIADA (Persona Jurídica - Domiciliada)",
    "3": "PN-NO-RESIDENTE (Persona Natural - No Residente)",
    "4": "PJ-NO-DOMICILIADA (Persona Jurídica - No Domiciliada)",
}

# =============================================================================
# Porcentajes de retención IVA válidos
# =============================================================================
PORCENTAJES_RETENCION_IVA = {75.00, 100.00}

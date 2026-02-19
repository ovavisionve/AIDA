"""
Códigos de Retorno y Error SENIAT V1.4

Códigos HTTP de respuesta general y códigos de validación campo-por-campo
según el documento GGTIC.GIT.00.02 / Versión 1.4.
"""

from dataclasses import dataclass, field


# =============================================================================
# Códigos de Retorno HTTP Generales
# =============================================================================
class HttpCodes:
    SUCCESS = 200               # Documento procesado exitosamente
    DUPLICATE = 201             # Documento duplicado
    VALIDATION_REJECTED = 203   # Rechazo por validación
    BAD_REQUEST = 400           # Request mal formado (estructura JSON)
    UNAUTHORIZED = 401          # Token falta o no es válido
    INTERNAL_ERROR = 500        # Error interno de procesamiento


# =============================================================================
# Códigos de Validación por Campo (~70 códigos)
# =============================================================================
class ValidationCodes:
    """Códigos de error de validación SENIAT V1.4."""

    # --- Errores generales de campo (100-199) ---
    CAMPO_REQUERIDO = 101
    FORMATO_INCORRECTO = 102
    FECHA_INVALIDA = 103
    HORA_INVALIDA = 104
    TIPO_DOCUMENTO_INVALIDO = 105
    INFO_REQUERIDA_GUIA = 106
    LONGITUD_EXCEDIDA = 107
    CAMPO_REQUERIDO_NOTAS = 108
    FECHA_VENCIMIENTO_INVALIDA = 114
    FECHA_FUTURA = 115

    # --- Moneda (1000) ---
    MONEDA_INVALIDA = 1000

    # --- Impuestos Subtotal (1004-1007, 1015) ---
    CODIGO_IMPUESTO_SUBTOTAL_INVALIDO = 1004
    ALICUOTA_IMPUESTO_FALTANTE = 1005
    BASE_IMPONIBLE_IMPUESTO_ERROR = 1006
    VALOR_TOTAL_IMPUESTO_ERROR = 1007
    DESCRIPCION_IMPUESTO_FALTANTE = 1015

    # --- Totales del documento (1008-1013) ---
    MONTO_GRAVADO_TOTAL_ERROR = 1008
    MONTO_EXENTO_TOTAL_ERROR = 1009
    SUBTOTAL_ERROR = 1010
    TOTAL_IVA_ERROR = 1011
    MONTO_TOTAL_CON_IVA_ERROR = 1012
    TOTAL_A_PAGAR_ERROR = 1013

    # --- Formas de Pago (1016-1018) ---
    MONTO_PAGO_FALTANTE = 1016
    MONEDA_PAGO_FALTANTE = 1017
    TIPO_CAMBIO_PAGO_FALTANTE = 1018

    # --- Totales Otra Moneda (1019-1032, 1067-1069, 1073) ---
    MONEDA_OTRA_FALTANTE = 1019
    TIPO_CAMBIO_OTRA_FALTANTE = 1020
    MONTO_GRAVADO_OTRA_ERROR = 1021
    MONTO_EXENTO_OTRA_ERROR = 1022
    SUBTOTAL_OTRA_ERROR = 1023
    TOTAL_A_PAGAR_OTRA_ERROR = 1024
    TOTAL_IVA_OTRA_ERROR = 1025
    MONTO_TOTAL_CON_IVA_OTRA_ERROR = 1026
    TOTAL_DESCUENTO_OTRA_ERROR = 1027
    MONTO_DESC_BONIF_OTRA_ERROR = 1028
    CODIGO_IMPUESTO_OTRA_ERROR = 1029
    ALICUOTA_OTRA_ERROR = 1030
    BASE_IMPONIBLE_OTRA_ERROR = 1031
    VALOR_TOTAL_IMP_OTRA_ERROR = 1032
    SUBTOTAL_ANTES_DESC_OTRA_FALTANTE = 1067
    SUBTOTAL_ANTES_DESC_OTRA_ERROR = 1068
    TOTAL_RECARGOS_OTRA_ERROR = 1069

    # --- Totales Retención (1033-1040, 1066) ---
    TOTAL_BASE_IMPONIBLE_RET_ERROR = 1033
    TOTAL_IVA_RET_ERROR = 1034
    TOTAL_RETENIDO_ERROR = 1035
    TOTAL_RETENIDO_FALTANTE = 1036
    TOTAL_ISLR_ERROR = 1037
    TOTAL_ISLR_FALTANTE = 1038
    TOTAL_IGTF_RET_ERROR = 1039
    TIPO_COMPROBANTE_INVALIDO = 1040
    TIPO_COMPROBANTE_CONFLICTO = 1066

    # --- Detalle Items (1041-1047, 1062-1065, 1070, 1072) ---
    NUMERO_LINEA_DUPLICADO = 1041
    DESCRIPCION_ITEM_INVALIDA = 1042
    PRECIO_UNITARIO_ERROR = 1043
    PRECIO_ITEM_ERROR = 1044
    TASA_IVA_ERROR = 1045
    VALOR_IVA_ERROR = 1046
    VALOR_TOTAL_ITEM_ERROR = 1047
    PALABRA_RESERVADA = 1050
    PRECIO_ANTES_DESC_REQUERIDO = 1062
    PRECIO_ANTES_DESC_ERROR = 1063
    SUBTOTAL_ANTES_DESC_FALTANTE = 1064
    SUBTOTAL_ANTES_DESC_ERROR = 1065
    TOTAL_RECARGOS_ERROR = 1070
    MONTO_PERCIBIDO_TOTAL_ERROR = 1072
    MONTO_PERCIBIDO_OTRA_ERROR = 1073

    # --- Detalle Retención (1051-1061) ---
    NUMERO_LINEA_RET_DUPLICADO = 1051
    TIPO_DOC_RET_INVALIDO = 1052
    NUMERO_DOC_RET_FALTANTE = 1053
    NUMERO_CONTROL_RET_INVALIDO = 1054
    MONTO_TOTAL_RET_ERROR = 1055
    MONTO_EXENTO_RET_ERROR = 1056
    BASE_IMPONIBLE_RET_ERROR = 1057
    PORCENTAJE_RETENCION_INVALIDO = 1058
    MONTO_IVA_RET_ERROR = 1059
    MONTO_RETENIDO_ERROR = 1060
    CODIGO_CONCEPTO_INVALIDO = 1061


# =============================================================================
# Mensajes descriptivos por código
# =============================================================================
MENSAJES_ERROR: dict[int, str] = {
    101: "El campo es requerido",
    102: "El campo no cumple con el formato correcto",
    103: "El campo no cumple con el formato de fecha válido (DD/MM/AAAA)",
    104: "El campo no cumple con el formato de hora válido de 12 horas (hh:mm:ss tt)",
    105: "El tipo de documento es inválido",
    106: "La información es requerida para el tipo de documento 04 (Guía de Despacho)",
    107: "El campo excede la longitud permitida",
    108: "El campo es requerido para Notas de Crédito/Débito",
    114: "El formato de fecha de vencimiento no es válido (DD/MM/AAAA)",
    115: "No se puede emitir un documento con fecha futura",
    1000: "Código de moneda inválido o ausente",
    1004: "Código de impuesto en subtotal inválido, duplicado o faltante (Catálogo 9)",
    1005: "Alícuota del impuesto faltante o no corresponde con Catálogo 9",
    1006: "Base imponible del impuesto no coincide con la suma de ítems por alícuota",
    1007: "Valor total del impuesto no coincide con la suma de IVA por alícuota",
    1008: "Monto gravado total no coincide con la suma de bases imponibles gravadas",
    1009: "Monto exento total no coincide con la suma de ítems exentos",
    1010: "Subtotal no coincide (montoGravadoTotal + montoExentoTotal + montoPercibidoTotal)",
    1011: "Total IVA no coincide con la suma de impuestos subtotal",
    1012: "Monto total con IVA no coincide (subtotal + totalIVA)",
    1013: "Total a pagar no coincide (montoTotalConIVA + IGTF + otros impuestos)",
    1015: "Falta nombre descriptivo en impuestos subtotal",
    1016: "Monto de forma de pago faltante o no coincide con totalAPagar",
    1017: "Código de moneda faltante en forma de pago",
    1018: "Tipo de cambio requerido para moneda distinta de Bs",
    1019: "Moneda requerida en totales otra moneda",
    1020: "Tipo de cambio requerido en totales otra moneda",
    1021: "Monto gravado total en otra moneda no coincide",
    1022: "Monto exento total en otra moneda no coincide",
    1023: "Subtotal en otra moneda no coincide",
    1024: "Total a pagar en otra moneda no coincide",
    1025: "Total IVA en otra moneda no coincide",
    1026: "Monto total con IVA en otra moneda no coincide",
    1027: "Total descuento en otra moneda no coincide",
    1028: "Monto descuento bonificación en otra moneda no coincide",
    1029: "Código impuesto en otra moneda inválido",
    1030: "Alícuota en otra moneda no corresponde con Catálogo 9",
    1031: "Base imponible en otra moneda no coincide",
    1032: "Valor total impuesto en otra moneda no coincide",
    1033: "Total base imponible de retención no coincide con suma de detalles",
    1034: "Total IVA de retención no coincide con suma de detalles",
    1035: "Total retenido no coincide con suma de detalles",
    1036: "Total retenido requerido para comprobante de retención IVA/ISLR",
    1037: "Total ISLR no coincide con suma de retenciones",
    1038: "Total ISLR requerido para comprobante de retención ISLR",
    1039: "Total IGTF de retención no coincide",
    1040: "Tipo de comprobante de retención inválido (Catálogo 17)",
    1041: "Número de línea duplicado en detalle de ítems",
    1042: "Descripción del ítem inválida (mínimo 2 caracteres o contiene palabra reservada)",
    1043: "Precio unitario con formato inválido",
    1044: "Precio del ítem no coincide: (precioUnitario * cantidad) - descuentoMonto + RecargoMonto",
    1045: "Tasa IVA no corresponde con el código de impuesto (Catálogo 9)",
    1046: "Valor IVA no coincide: precioItem * tasaIVA",
    1047: "Valor total del ítem no coincide: precioItem * (1 + tasaIVA/100) + valorOTI",
    1050: "Uso de palabra reservada 'Total' en información adicional",
    1051: "Número de línea duplicado en detalle de retenciones",
    1052: "Tipo de documento inválido en detalle de retención (solo 01, 02, 03)",
    1053: "Número de documento faltante o no numérico en detalle de retención",
    1054: "Número de control con formato inválido (debe ser XX-XXXXXXXX)",
    1055: "Monto total en retención no coincide: baseImponible + montoExento + montoIVA",
    1056: "Monto exento en retención con formato inválido",
    1057: "Base imponible en retención inválida",
    1058: "Porcentaje de retención inválido (IVA: 75% o 100%; ISLR: según tabla SENIAT)",
    1059: "Monto IVA en retención no coincide: baseImponible * porcentaje",
    1060: "Monto retenido no coincide con el cálculo esperado",
    1061: "Código concepto faltante o inválido para retención ISLR",
    1062: "precioAntesDescuento requerido cuando descuentoMonto está informado",
    1063: "precioAntesDescuento no coincide: cantidad * precioUnitario",
    1064: "SubtotalAntesDescuentos requerido cuando totalDescuento está declarado",
    1065: "SubtotalAntesDescuentos no coincide con la suma de precioItem de todos los ítems",
    1066: "Tipo de comprobante conflicto: no puede ser retención IVA y ISLR simultáneamente",
    1067: "SubtotalAntesDescuentos en otra moneda faltante cuando totalDescuento declarado",
    1068: "SubtotalAntesDescuentos en otra moneda no coincide",
    1069: "Total recargos en otra moneda no coincide",
    1070: "Total recargos no coincide",
    1072: "Monto percibido total no coincide con la suma de ítems percibidos",
    1073: "Monto percibido total en otra moneda no coincide",
}


# =============================================================================
# Estructura de error de validación
# =============================================================================
@dataclass
class ValidationError:
    """Un error de validación individual."""

    code: int
    field: str
    message: str
    detail: str = ""

    def to_dict(self) -> dict:
        d = {"code": self.code, "field": self.field, "message": self.message}
        if self.detail:
            d["detail"] = self.detail
        return d


@dataclass
class ValidationResult:
    """Resultado completo de la validación de un documento."""

    is_valid: bool
    http_code: int
    errors: list[ValidationError] = field(default_factory=list)
    warnings: list[ValidationError] = field(default_factory=list)

    def add_error(self, code: int, field_path: str, detail: str = "") -> None:
        msg = MENSAJES_ERROR.get(code, f"Error de validación (código {code})")
        self.errors.append(ValidationError(code=code, field=field_path, message=msg, detail=detail))
        self.is_valid = False
        self.http_code = HttpCodes.VALIDATION_REJECTED

    def add_warning(self, code: int, field_path: str, detail: str = "") -> None:
        msg = MENSAJES_ERROR.get(code, f"Advertencia (código {code})")
        self.warnings.append(ValidationError(code=code, field=field_path, message=msg, detail=detail))

    def to_dict(self) -> dict:
        d: dict = {
            "is_valid": self.is_valid,
            "http_code": self.http_code,
            "total_errors": len(self.errors),
        }
        if self.errors:
            d["errors"] = [e.to_dict() for e in self.errors]
        if self.warnings:
            d["warnings"] = [w.to_dict() for w in self.warnings]
        return d

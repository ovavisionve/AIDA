"""
Validación de Cálculos SENIAT V1.4

Valida que todos los cálculos aritméticos del documento fiscal
cumplan con las fórmulas oficiales del SENIAT, considerando
tolerancia por truncamiento de decimales.
"""

from __future__ import annotations

from .catalogs import ALICUOTAS_IVA, CODIGOS_IVA_GRAVADOS, CODIGOS_IVA_TODOS
from .errors import ValidationCodes as VC, ValidationResult
from .schemas import DocumentoElectronico, DetalleItem

# Tolerancia para comparaciones de cálculos (truncamiento de decimales)
TOLERANCIA = 0.02


def _approx(a: float, b: float, tol: float = TOLERANCIA) -> bool:
    """Compara dos valores numéricos con tolerancia."""
    return abs(a - b) <= tol


def _safe(val: float | None) -> float:
    """Convierte None a 0.0."""
    return val if val is not None else 0.0


# =============================================================================
# Validación de cálculos por ítem
# =============================================================================
def validar_items(doc: DocumentoElectronico, result: ValidationResult) -> None:
    """Valida los cálculos de cada línea de detalleItems."""
    items = doc.detalleItems
    if not items:
        return

    lineas_vistas: set[int] = set()

    for i, item in enumerate(items):
        path = f"detalleItems[{i}]"

        # Número de línea duplicado (1041)
        if item.numeroLinea is not None:
            if item.numeroLinea in lineas_vistas:
                result.add_error(VC.NUMERO_LINEA_DUPLICADO, f"{path}.numeroLinea",
                                 f"Línea {item.numeroLinea} duplicada")
            lineas_vistas.add(item.numeroLinea)

        # Descripción inválida (1042)
        if item.descripcion is not None:
            if len(item.descripcion.strip()) < 2:
                result.add_error(VC.DESCRIPCION_ITEM_INVALIDA, f"{path}.descripcion",
                                 "Mínimo 2 caracteres")
            if "total" in item.descripcion.lower().split():
                result.add_error(VC.PALABRA_RESERVADA, f"{path}.descripcion",
                                 "Contiene palabra reservada 'Total'")

        # Precio unitario formato (1043)
        if item.precioUnitario is not None and item.precioUnitario < 0:
            result.add_error(VC.PRECIO_UNITARIO_ERROR, f"{path}.precioUnitario",
                             "No puede ser negativo")

        # precioItem = (precioUnitario * cantidad) - descuentoMonto + RecargoMonto (1044)
        if all(v is not None for v in [item.precioUnitario, item.cantidad, item.precioItem]):
            expected = (item.precioUnitario * item.cantidad) \
                       - _safe(item.descuentoMonto) \
                       + _safe(item.RecargoMonto)
            if not _approx(item.precioItem, expected):
                result.add_error(VC.PRECIO_ITEM_ERROR, f"{path}.precioItem",
                                 f"Esperado: {expected:.2f}, Recibido: {item.precioItem:.2f}")

        # precioAntesDescuento requerido si descuentoMonto informado (1062)
        if _safe(item.descuentoMonto) > 0 and item.precioAntesDescuento is None:
            result.add_error(VC.PRECIO_ANTES_DESC_REQUERIDO, f"{path}.precioAntesDescuento",
                             "Requerido cuando descuentoMonto está informado")

        # precioAntesDescuento = cantidad * precioUnitario (1063)
        if item.precioAntesDescuento is not None and item.cantidad is not None and item.precioUnitario is not None:
            expected_pad = item.cantidad * item.precioUnitario
            if not _approx(item.precioAntesDescuento, expected_pad):
                result.add_error(VC.PRECIO_ANTES_DESC_ERROR, f"{path}.precioAntesDescuento",
                                 f"Esperado: {expected_pad:.2f}, Recibido: {item.precioAntesDescuento:.2f}")

        # tasaIVA debe corresponder con codigoImpuesto según catálogo 9 (1045)
        if item.codigoImpuesto is not None and item.tasaIVA is not None:
            if item.codigoImpuesto in ALICUOTAS_IVA:
                expected_tasa = ALICUOTAS_IVA[item.codigoImpuesto]["tasa"]
                if not _approx(item.tasaIVA, expected_tasa, 0.01):
                    result.add_error(VC.TASA_IVA_ERROR, f"{path}.tasaIVA",
                                     f"Código '{item.codigoImpuesto}' requiere tasa {expected_tasa}%, recibido {item.tasaIVA}%")

        # valorIVA = precioItem * (tasaIVA / 100) (1046)
        if item.precioItem is not None and item.tasaIVA is not None and item.valorIVA is not None:
            expected_iva = item.precioItem * (item.tasaIVA / 100.0)
            if not _approx(item.valorIVA, expected_iva):
                result.add_error(VC.VALOR_IVA_ERROR, f"{path}.valorIVA",
                                 f"Esperado: {expected_iva:.2f}, Recibido: {item.valorIVA:.2f}")

        # valorTotalItem = precioItem * (1 + tasaIVA/100) + valorOTI (1047)
        if item.precioItem is not None and item.valorTotalItem is not None:
            tasa = _safe(item.tasaIVA)
            expected_total = item.precioItem * (1 + tasa / 100.0)
            if not _approx(item.valorTotalItem, expected_total):
                result.add_error(VC.VALOR_TOTAL_ITEM_ERROR, f"{path}.valorTotalItem",
                                 f"Esperado: {expected_total:.2f}, Recibido: {item.valorTotalItem:.2f}")


# =============================================================================
# Validación de cálculos de totales
# =============================================================================
def validar_totales(doc: DocumentoElectronico, result: ValidationResult) -> None:
    """Valida los cálculos de totales del documento."""
    if not doc.encabezado or not doc.encabezado.totales:
        return

    totales = doc.encabezado.totales
    items = doc.detalleItems or []

    # Factor de ajuste para descuentos/recargos globales
    sub_antes = _safe(totales.SubtotalAntesDescuentos)
    desc_global = _safe(totales.totalDescuento)
    rec_global = _safe(totales.totalRecargos)

    # SubtotalAntesDescuentos = suma de precioItem de todos los ítems (1064, 1065)
    if desc_global > 0 and totales.SubtotalAntesDescuentos is None:
        result.add_error(VC.SUBTOTAL_ANTES_DESC_FALTANTE,
                         "encabezado.totales.SubtotalAntesDescuentos",
                         "Requerido cuando totalDescuento está declarado")
    elif totales.SubtotalAntesDescuentos is not None and items:
        sum_precio_item = sum(_safe(it.precioItem) for it in items)
        if not _approx(totales.SubtotalAntesDescuentos, sum_precio_item):
            result.add_error(VC.SUBTOTAL_ANTES_DESC_ERROR,
                             "encabezado.totales.SubtotalAntesDescuentos",
                             f"Esperado: {sum_precio_item:.2f}, Recibido: {totales.SubtotalAntesDescuentos:.2f}")

    # Calcular factor de ajuste por descuentos/recargos globales
    if sub_antes > 0:
        factor_desc = 1.0 - (desc_global / sub_antes) if desc_global else 1.0
        factor_rec = 1.0 + (rec_global / (sub_antes - desc_global)) if rec_global and (sub_antes - desc_global) > 0 else 1.0
    else:
        factor_desc = 1.0
        factor_rec = 1.0
    factor = factor_desc * factor_rec

    # montoGravadoTotal = suma de precioItem de ítems con tasaIVA G, R, A (1008)
    if totales.montoGravadoTotal is not None and items:
        sum_gravado = sum(
            _safe(it.precioItem) for it in items
            if it.codigoImpuesto in CODIGOS_IVA_GRAVADOS
        )
        expected_gravado = sum_gravado * factor
        if not _approx(totales.montoGravadoTotal, expected_gravado):
            result.add_error(VC.MONTO_GRAVADO_TOTAL_ERROR,
                             "encabezado.totales.montoGravadoTotal",
                             f"Esperado: {expected_gravado:.2f}, Recibido: {totales.montoGravadoTotal:.2f}")

    # montoExentoTotal = suma de precioItem de ítems con tasaIVA E (1009)
    if totales.montoExentoTotal is not None and items:
        sum_exento = sum(
            _safe(it.precioItem) for it in items
            if it.codigoImpuesto == "E"
        )
        expected_exento = sum_exento * factor
        if not _approx(totales.montoExentoTotal, expected_exento):
            result.add_error(VC.MONTO_EXENTO_TOTAL_ERROR,
                             "encabezado.totales.montoExentoTotal",
                             f"Esperado: {expected_exento:.2f}, Recibido: {totales.montoExentoTotal:.2f}")

    # montoPercibidoTotal = suma de precioItem de ítems con tasaIVA P (1072)
    if totales.montoPercibidoTotal is not None and items:
        sum_percibido = sum(
            _safe(it.precioItem) for it in items
            if it.codigoImpuesto == "P"
        )
        expected_percibido = sum_percibido * factor
        if not _approx(totales.montoPercibidoTotal, expected_percibido):
            result.add_error(VC.MONTO_PERCIBIDO_TOTAL_ERROR,
                             "encabezado.totales.montoPercibidoTotal",
                             f"Esperado: {expected_percibido:.2f}, Recibido: {totales.montoPercibidoTotal:.2f}")

    # subtotal = montoGravadoTotal + montoExentoTotal + montoPercibidoTotal (1010)
    if totales.subtotal is not None:
        expected_sub = _safe(totales.montoGravadoTotal) + _safe(totales.montoExentoTotal) + _safe(totales.montoPercibidoTotal)
        if not _approx(totales.subtotal, expected_sub):
            result.add_error(VC.SUBTOTAL_ERROR, "encabezado.totales.subtotal",
                             f"Esperado: {expected_sub:.2f}, Recibido: {totales.subtotal:.2f}")

    # Validar impuestosSubtotal (1004-1007, 1015)
    _validar_impuestos_subtotal(totales, items, factor, result)

    # totalIVA = suma de valorTotalImp de impuestosSubtotal (1011)
    if totales.totalIVA is not None and totales.impuestosSubtotal:
        sum_iva = sum(
            _safe(imp.valorTotalImp) for imp in totales.impuestosSubtotal
            if imp.codigoTotalImp in CODIGOS_IVA_GRAVADOS or imp.codigoTotalImp == "P"
        )
        if not _approx(totales.totalIVA, sum_iva):
            result.add_error(VC.TOTAL_IVA_ERROR, "encabezado.totales.totalIVA",
                             f"Esperado: {sum_iva:.2f}, Recibido: {totales.totalIVA:.2f}")

    # montoTotalConIVA = subtotal + totalIVA (1012)
    if totales.montoTotalConIVA is not None:
        expected_con_iva = _safe(totales.subtotal) + _safe(totales.totalIVA)
        if not _approx(totales.montoTotalConIVA, expected_con_iva):
            result.add_error(VC.MONTO_TOTAL_CON_IVA_ERROR,
                             "encabezado.totales.montoTotalConIVA",
                             f"Esperado: {expected_con_iva:.2f}, Recibido: {totales.montoTotalConIVA:.2f}")

    # totalAPagar = montoTotalConIVA + IGTF + otros (1013)
    if totales.totalAPagar is not None:
        expected_pagar = _safe(totales.montoTotalConIVA) + _safe(totales.totalIGTF) + _safe(totales.totalIGTFVES)
        if not _approx(totales.totalAPagar, expected_pagar):
            # Intentar sin IGTFVES (puede estar incluido en IGTF)
            expected_pagar2 = _safe(totales.montoTotalConIVA) + _safe(totales.totalIGTF)
            if not _approx(totales.totalAPagar, expected_pagar2):
                result.add_error(VC.TOTAL_A_PAGAR_ERROR, "encabezado.totales.totalAPagar",
                                 f"Esperado: {expected_pagar2:.2f}, Recibido: {totales.totalAPagar:.2f}")


def _validar_impuestos_subtotal(totales, items, factor, result: ValidationResult) -> None:
    """Valida la lista impuestosSubtotal contra los ítems."""
    if not totales.impuestosSubtotal:
        return

    codigos_vistos: set[str] = set()

    for j, imp in enumerate(totales.impuestosSubtotal):
        path = f"encabezado.totales.impuestosSubtotal[{j}]"

        # Código válido y no duplicado (1004)
        if imp.codigoTotalImp is not None:
            if imp.codigoTotalImp not in CODIGOS_IVA_TODOS and imp.codigoTotalImp != "IGTF":
                result.add_error(VC.CODIGO_IMPUESTO_SUBTOTAL_INVALIDO, f"{path}.codigoTotalImp",
                                 f"Código '{imp.codigoTotalImp}' no está en Catálogo 9")
            if imp.codigoTotalImp in codigos_vistos:
                result.add_error(VC.CODIGO_IMPUESTO_SUBTOTAL_INVALIDO, f"{path}.codigoTotalImp",
                                 f"Código '{imp.codigoTotalImp}' duplicado")
            codigos_vistos.add(imp.codigoTotalImp)

        # Alícuota debe coincidir con catálogo 9 (1005)
        if imp.codigoTotalImp and imp.codigoTotalImp in ALICUOTAS_IVA:
            expected_alic = ALICUOTAS_IVA[imp.codigoTotalImp]["tasa"]
            if imp.alicuotaImp is not None and not _approx(imp.alicuotaImp, expected_alic, 0.01):
                result.add_error(VC.ALICUOTA_IMPUESTO_FALTANTE, f"{path}.alicuotaImp",
                                 f"Esperado {expected_alic}% para código '{imp.codigoTotalImp}', recibido {imp.alicuotaImp}%")

        # baseImponibleImp = suma de precioItem por código de IVA * factor (1006)
        if imp.baseImponibleImp is not None and imp.codigoTotalImp and items:
            sum_base = sum(
                _safe(it.precioItem) for it in items
                if it.codigoImpuesto == imp.codigoTotalImp
            )
            expected_base = sum_base * factor
            if not _approx(imp.baseImponibleImp, expected_base):
                result.add_error(VC.BASE_IMPONIBLE_IMPUESTO_ERROR, f"{path}.baseImponibleImp",
                                 f"Esperado: {expected_base:.2f}, Recibido: {imp.baseImponibleImp:.2f}")

        # valorTotalImp = suma de valorIVA por código de IVA * factor (1007)
        if imp.valorTotalImp is not None and imp.codigoTotalImp and items:
            sum_iva = sum(
                _safe(it.valorIVA) for it in items
                if it.codigoImpuesto == imp.codigoTotalImp
            )
            expected_iva_total = sum_iva * factor
            if not _approx(imp.valorTotalImp, expected_iva_total):
                result.add_error(VC.VALOR_TOTAL_IMPUESTO_ERROR, f"{path}.valorTotalImp",
                                 f"Esperado: {expected_iva_total:.2f}, Recibido: {imp.valorTotalImp:.2f}")


# =============================================================================
# Validación de cálculos de totales en otra moneda
# =============================================================================
def validar_totales_otra_moneda(doc: DocumentoElectronico, result: ValidationResult) -> None:
    """Valida los totales en otra moneda contra los totales en moneda base."""
    if not doc.encabezado or not doc.encabezado.totalesOtraMoneda:
        return

    otra = doc.encabezado.totalesOtraMoneda
    totales = doc.encabezado.totales

    if not totales:
        return

    # Moneda requerida si hay datos en este nodo (1019)
    has_data = any([
        otra.tipoCambio, otra.montoGravadoTotal, otra.subtotal,
        otra.totalAPagar, otra.totalIVA,
    ])
    if has_data and not otra.moneda:
        result.add_error(VC.MONEDA_OTRA_FALTANTE, "encabezado.totalesOtraMoneda.moneda")

    # Tipo de cambio requerido (1020)
    if has_data and not otra.tipoCambio:
        result.add_error(VC.TIPO_CAMBIO_OTRA_FALTANTE, "encabezado.totalesOtraMoneda.tipoCambio")

    if not otra.tipoCambio or otra.tipoCambio == 0:
        return

    tc = otra.tipoCambio

    # Cross-checks: valor en otra moneda ≈ valor en Bs / tipoCambio
    checks = [
        (otra.montoGravadoTotal, totales.montoGravadoTotal, VC.MONTO_GRAVADO_OTRA_ERROR, "montoGravadoTotal"),
        (otra.montoExentoTotal, totales.montoExentoTotal, VC.MONTO_EXENTO_OTRA_ERROR, "montoExentoTotal"),
        (otra.subtotal, totales.subtotal, VC.SUBTOTAL_OTRA_ERROR, "subtotal"),
        (otra.totalAPagar, totales.totalAPagar, VC.TOTAL_A_PAGAR_OTRA_ERROR, "totalAPagar"),
        (otra.totalIVA, totales.totalIVA, VC.TOTAL_IVA_OTRA_ERROR, "totalIVA"),
        (otra.montoTotalConIVA, totales.montoTotalConIVA, VC.MONTO_TOTAL_CON_IVA_OTRA_ERROR, "montoTotalConIVA"),
        (otra.totalDescuento, totales.totalDescuento, VC.TOTAL_DESCUENTO_OTRA_ERROR, "totalDescuento"),
        (otra.montoPercibidoTotal, totales.montoPercibidoTotal, VC.MONTO_PERCIBIDO_OTRA_ERROR, "montoPercibidoTotal"),
    ]

    for otra_val, bs_val, code, field_name in checks:
        if otra_val is not None and bs_val is not None:
            expected = bs_val / tc
            if not _approx(otra_val, expected, TOLERANCIA * 2):
                result.add_error(code, f"encabezado.totalesOtraMoneda.{field_name}",
                                 f"Esperado: {expected:.2f}, Recibido: {otra_val:.2f} (Bs {bs_val:.2f} / TC {tc})")

    # SubtotalAntesDescuentos en otra moneda (1067, 1068)
    if _safe(otra.totalDescuento) > 0 and otra.subtotalAntesDescuentos is None:
        result.add_error(VC.SUBTOTAL_ANTES_DESC_OTRA_FALTANTE,
                         "encabezado.totalesOtraMoneda.subtotalAntesDescuentos")
    elif otra.subtotalAntesDescuentos is not None and totales.SubtotalAntesDescuentos is not None:
        expected_sad = totales.SubtotalAntesDescuentos / tc
        if not _approx(otra.subtotalAntesDescuentos, expected_sad, TOLERANCIA * 2):
            result.add_error(VC.SUBTOTAL_ANTES_DESC_OTRA_ERROR,
                             "encabezado.totalesOtraMoneda.subtotalAntesDescuentos",
                             f"Esperado: {expected_sad:.2f}, Recibido: {otra.subtotalAntesDescuentos:.2f}")


# =============================================================================
# Validación de retenciones
# =============================================================================
def validar_retenciones(doc: DocumentoElectronico, result: ValidationResult) -> None:
    """Valida los cálculos de retenciones (IVA e ISLR)."""
    if not doc.detallesRetencion:
        return

    tipo_doc = None
    if doc.encabezado and doc.encabezado.identificacionDocumento:
        tipo_doc = doc.encabezado.identificacionDocumento.tipoDocumento

    es_retencion_iva = tipo_doc == "05"
    es_retencion_islr = tipo_doc == "06"

    lineas_vistas: set[int] = set()

    for i, det in enumerate(doc.detallesRetencion):
        path = f"detallesRetencion[{i}]"

        # Número de línea duplicado (1051)
        if det.numeroLinea is not None:
            if det.numeroLinea in lineas_vistas:
                result.add_error(VC.NUMERO_LINEA_RET_DUPLICADO, f"{path}.numeroLinea",
                                 f"Línea {det.numeroLinea} duplicada")
            lineas_vistas.add(det.numeroLinea)

        # Tipo de documento válido para retención (1052): solo 01, 02, 03
        if det.tipoDocumento is not None and det.tipoDocumento not in (1, 2, 3):
            result.add_error(VC.TIPO_DOC_RET_INVALIDO, f"{path}.tipoDocumento",
                             f"Solo se permiten tipos 01 (Factura), 02 (NC), 03 (ND). Recibido: {det.tipoDocumento}")

        # Número de documento requerido y numérico (1053)
        if det.numeroDocumento is None:
            result.add_error(VC.NUMERO_DOC_RET_FALTANTE, f"{path}.numeroDocumento")

        # Formato número de control XX-XXXXXXXX (1054)
        if det.numeroControl is not None:
            nc = str(det.numeroControl)
            parts = nc.split("-")
            if len(parts) != 2 or not parts[0].isdigit() or not parts[1].isdigit() or len(parts[0]) != 2:
                result.add_error(VC.NUMERO_CONTROL_RET_INVALIDO, f"{path}.numeroControl",
                                 f"Formato requerido: XX-XXXXXXXX. Recibido: {nc}")

        # montoTotal = baseImponible + montoExento + montoIVA (1055) - solo retención IVA
        if es_retencion_iva and det.montoTotal is not None:
            expected_mt = _safe(det.baseImponible) + _safe(det.montoExento) + _safe(det.montoIVA)
            if not _approx(det.montoTotal, expected_mt):
                result.add_error(VC.MONTO_TOTAL_RET_ERROR, f"{path}.montoTotal",
                                 f"Esperado: {expected_mt:.2f}, Recibido: {det.montoTotal:.2f}")

        # montoIVA = baseImponible * porcentaje (1059) - solo retención IVA
        if es_retencion_iva and det.montoIVA is not None and det.baseImponible is not None and det.porcentaje is not None:
            expected_iva = det.baseImponible * (det.porcentaje / 100.0)
            if not _approx(det.montoIVA, expected_iva):
                result.add_error(VC.MONTO_IVA_RET_ERROR, f"{path}.montoIVA",
                                 f"Esperado: {expected_iva:.2f}, Recibido: {det.montoIVA:.2f}")

        # porcentajeRetencion válido (1058)
        if es_retencion_iva and det.porcentajeRetencion is not None:
            from .catalogs import PORCENTAJES_RETENCION_IVA
            if det.porcentajeRetencion not in PORCENTAJES_RETENCION_IVA:
                result.add_error(VC.PORCENTAJE_RETENCION_INVALIDO, f"{path}.porcentajeRetencion",
                                 f"IVA solo admite 75% o 100%. Recibido: {det.porcentajeRetencion}%")

        # retenido = montoIVA * (porcentajeRetencion / 100) (1060) - retención IVA
        if es_retencion_iva and det.retenido is not None and det.montoIVA is not None and det.porcentajeRetencion is not None:
            expected_ret = det.montoIVA * (det.porcentajeRetencion / 100.0)
            if not _approx(det.retenido, expected_ret):
                result.add_error(VC.MONTO_RETENIDO_ERROR, f"{path}.retenido",
                                 f"Esperado: {expected_ret:.2f}, Recibido: {det.retenido:.2f}")

        # retenido ISLR = baseImponible * porcentaje - sustraendo (1060)
        if es_retencion_islr and det.retenido is not None and det.baseImponible is not None and det.porcentaje is not None:
            expected_ret = det.baseImponible * (det.porcentaje / 100.0) - _safe(det.sustraendo)
            if not _approx(det.retenido, expected_ret):
                result.add_error(VC.MONTO_RETENIDO_ERROR, f"{path}.retenido",
                                 f"ISLR esperado: {expected_ret:.2f}, Recibido: {det.retenido:.2f}")

        # Código concepto requerido para ISLR (1061)
        if es_retencion_islr and det.codigoConcepto is None:
            result.add_error(VC.CODIGO_CONCEPTO_INVALIDO, f"{path}.codigoConcepto",
                             "Requerido para retención ISLR")

    # Validar totales de retención
    _validar_totales_retencion(doc, result, es_retencion_iva, es_retencion_islr)


def _validar_totales_retencion(doc: DocumentoElectronico, result: ValidationResult,
                                es_iva: bool, es_islr: bool) -> None:
    """Valida que los totales de retención coincidan con la suma de detalles."""
    if not doc.encabezado or not doc.encabezado.totalRetencion or not doc.detallesRetencion:
        return

    tr = doc.encabezado.totalRetencion
    detalles = doc.detallesRetencion

    # totalBaseImponible = suma de baseImponible de detalles (1033)
    if tr.totalBaseImponible is not None:
        sum_base = sum(_safe(d.baseImponible) for d in detalles)
        if not _approx(tr.totalBaseImponible, sum_base):
            result.add_error(VC.TOTAL_BASE_IMPONIBLE_RET_ERROR,
                             "encabezado.totalRetencion.totalBaseImponible",
                             f"Esperado: {sum_base:.2f}, Recibido: {tr.totalBaseImponible:.2f}")

    # totalIVA = suma de montoIVA (1034) - solo retención IVA
    if es_iva and tr.totalIVA is not None:
        sum_iva = sum(_safe(d.montoIVA) for d in detalles)
        if not _approx(tr.totalIVA, sum_iva):
            result.add_error(VC.TOTAL_IVA_RET_ERROR,
                             "encabezado.totalRetencion.totalIVA",
                             f"Esperado: {sum_iva:.2f}, Recibido: {tr.totalIVA:.2f}")

    # totalRetenido = suma de retenido (1035, 1036)
    if es_iva:
        if tr.totalRetenido is None:
            result.add_error(VC.TOTAL_RETENIDO_FALTANTE, "encabezado.totalRetencion.totalRetenido")
        else:
            sum_ret = sum(_safe(d.retenido) for d in detalles)
            if not _approx(tr.totalRetenido, sum_ret):
                result.add_error(VC.TOTAL_RETENIDO_ERROR,
                                 "encabezado.totalRetencion.totalRetenido",
                                 f"Esperado: {sum_ret:.2f}, Recibido: {tr.totalRetenido:.2f}")

    # totalISRL = suma de retenido ISLR (1037, 1038)
    if es_islr:
        if tr.totalISRL is None:
            result.add_error(VC.TOTAL_ISLR_FALTANTE, "encabezado.totalRetencion.totalISRL")
        else:
            sum_islr = sum(_safe(d.retenido) for d in detalles)
            if not _approx(tr.totalISRL, sum_islr):
                result.add_error(VC.TOTAL_ISLR_ERROR,
                                 "encabezado.totalRetencion.totalISRL",
                                 f"Esperado: {sum_islr:.2f}, Recibido: {tr.totalISRL:.2f}")

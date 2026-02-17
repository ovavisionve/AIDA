"""
Motor de cálculo fiscal venezolano.

Calcula subtotales, IVA (16%, 8%, exento), IGTF (3%), descuentos y totales
según las reglas del SENIAT (Providencia 0071) y Decreto IGTF.
"""
from app.schemas.fiscal import FiscalItem, FiscalItemResponse, FiscalTotales

# Alícuotas vigentes
ALICUOTA_GENERAL = 16.00
ALICUOTA_REDUCIDA = 8.00
ALICUOTA_EXENTO = 0.00
ALICUOTA_IGTF = 3.00  # Impuesto Grandes Transacciones Financieras

TAX_TYPE_MAP = {
    "G": ALICUOTA_GENERAL,
    "R": ALICUOTA_REDUCIDA,
    "E": ALICUOTA_EXENTO,
    "NS": ALICUOTA_EXENTO,
}


def calcular_item(item: FiscalItem) -> FiscalItemResponse:
    """Calcula los montos de una línea del documento."""
    subtotal_bruto = item.cantidad * item.precio_unitario

    # Descuento
    if item.descuento_monto > 0:
        descuento = item.descuento_monto
    elif item.descuento_porcentaje > 0:
        descuento = subtotal_bruto * (item.descuento_porcentaje / 100)
    else:
        descuento = 0.0

    subtotal = subtotal_bruto - descuento

    # Impuesto
    alicuota = TAX_TYPE_MAP.get(item.tipo_impuesto, ALICUOTA_GENERAL)
    monto_impuesto = subtotal * (alicuota / 100) if item.tipo_impuesto in ("G", "R") else 0.0

    total = subtotal + monto_impuesto

    return FiscalItemResponse(
        numero_linea=item.numero_linea,
        codigo=item.codigo,
        descripcion=item.descripcion,
        unidad=item.unidad,
        cantidad=item.cantidad,
        precio_unitario=item.precio_unitario,
        descuento=round(descuento, 2),
        subtotal=round(subtotal, 2),
        tipo_impuesto=item.tipo_impuesto,
        alicuota=alicuota,
        monto_impuesto=round(monto_impuesto, 2),
        total=round(total, 2),
    )


def calcular_totales(
    items_calculados: list[FiscalItemResponse],
    pago_en_divisas: bool = False,
    porcentaje_igtf: float = ALICUOTA_IGTF,
) -> FiscalTotales:
    """Calcula los totales del documento a partir de los items ya calculados.

    Args:
        items_calculados: items con impuestos ya calculados
        pago_en_divisas: si True, aplica IGTF (3%) sobre el total
        porcentaje_igtf: alícuota IGTF (por defecto 3%)
    """
    subtotal = sum(i.subtotal + i.descuento for i in items_calculados)
    descuento_total = sum(i.descuento for i in items_calculados)
    base_imponible = sum(i.subtotal for i in items_calculados if i.tipo_impuesto == "G")
    base_reducida = sum(i.subtotal for i in items_calculados if i.tipo_impuesto == "R")
    base_exenta = sum(i.subtotal for i in items_calculados if i.tipo_impuesto == "E")
    base_no_sujeta = sum(i.subtotal for i in items_calculados if i.tipo_impuesto == "NS")
    monto_iva_16 = sum(i.monto_impuesto for i in items_calculados if i.tipo_impuesto == "G")
    monto_iva_8 = sum(i.monto_impuesto for i in items_calculados if i.tipo_impuesto == "R")
    total_impuestos = monto_iva_16 + monto_iva_8
    total = sum(i.total for i in items_calculados)

    # IGTF: aplica sobre el total cuando el pago es en divisas o criptoactivos
    base_imponible_igtf = 0.0
    monto_igtf = 0.0
    total_con_igtf = total
    if pago_en_divisas:
        base_imponible_igtf = total
        monto_igtf = total * (porcentaje_igtf / 100)
        total_con_igtf = total + monto_igtf

    return FiscalTotales(
        subtotal=round(subtotal, 2),
        descuento_total=round(descuento_total, 2),
        base_imponible=round(base_imponible + base_reducida, 2),
        base_exenta=round(base_exenta, 2),
        base_no_sujeta=round(base_no_sujeta, 2),
        monto_iva_16=round(monto_iva_16, 2),
        monto_iva_8=round(monto_iva_8, 2),
        total_impuestos=round(total_impuestos, 2),
        total=round(total, 2),
        base_imponible_igtf=round(base_imponible_igtf, 2),
        porcentaje_igtf=porcentaje_igtf,
        monto_igtf=round(monto_igtf, 2),
        total_con_igtf=round(total_con_igtf, 2),
    )

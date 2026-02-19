"""
Puente entre el formato interno de AIDA y el JSON Genérico SENIAT V1.4.

Convierte los datos calculados del document_emitter al formato que
espera el SeniatValidator para pre-validación antes de emitir.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from .catalogs import ALICUOTAS_IVA, MONEDA_CURSO_LEGAL


# Mapeo de formas de pago internas → código SENIAT (Catálogo 10)
FORMA_PAGO_MAP = {
    "efectivo": "08",
    "transferencia": "03",
    "pago_movil": "03",
    "tarjeta_debito": "05",
    "tarjeta_credito": "06",
    "divisas": "09",
    "zelle": "09",
    "cheque": "07",
    "mixto": "99",
    "deposito": "01",
}

# Mapeo tipo doc interno → código SENIAT
TIPO_DOC_MAP = {
    "factura": "01",
    "nota_credito": "02",
    "nota_debito": "03",
    "guia_despacho": "04",
    "retencion_iva": "05",
    "retencion_islr": "06",
}

# Mapeo tipo impuesto interno → código alícuota SENIAT (Catálogo 9)
TIPO_IMP_MAP = {
    "G": "G",    # General 16%
    "R": "R",    # Reducida 8%
    "E": "E",    # Exento
    "A": "A",    # Adicional 31%
    "P": "P",    # Percibido
    "X": "X",    # Exportación
    "NS": "E",   # No sujeto → Exento
}


def build_seniat_json(
    tipo_documento: str,
    emisor_rif: str,
    emisor_razon_social: str,
    emisor_direccion: str,
    receptor_rif: str,
    receptor_razon_social: str,
    receptor_direccion: str,
    items_calculados: list[Any],
    totales: Any,
    moneda: str = "VES",
    tasa_cambio: float | None = None,
    forma_pago: str = "efectivo",
    fecha_emision: datetime | None = None,
    observaciones: str | None = None,
) -> dict:
    """
    Construye el dict JSON Genérico SENIAT V1.4 a partir de datos internos.

    Args:
        tipo_documento: tipo interno (factura, nota_credito, etc.)
        emisor_*: datos del emisor
        receptor_*: datos del receptor
        items_calculados: lista de items calculados por calculator.py
        totales: FiscalTotales calculado
        moneda: código ISO de moneda
        tasa_cambio: tasa de cambio BCV (si moneda != VES)
        forma_pago: forma de pago interna
        fecha_emision: fecha de emisión (default=now)
        observaciones: texto de observaciones

    Returns:
        dict con estructura JSON Genérico SENIAT V1.4
    """
    fecha = fecha_emision or datetime.now()
    tipo_seniat = TIPO_DOC_MAP.get(tipo_documento, "01")

    # Extraer tipo de identificación del RIF (primera letra)
    emisor_tipo_id = emisor_rif[0] if emisor_rif else "J"
    receptor_tipo_id = receptor_rif[0] if receptor_rif else "J"

    # ── Detalle de Items ──
    detalle_items = []
    for item in items_calculados:
        codigo_imp = TIPO_IMP_MAP.get(getattr(item, "tipo_impuesto", "G"), "G")
        tasa_iva = ALICUOTAS_IVA.get(codigo_imp, {}).get("tasa", 0.0)

        precio_unitario = getattr(item, "precio_unitario", 0)
        cantidad = getattr(item, "cantidad", 0)
        descuento = getattr(item, "descuento", 0)
        subtotal_item = getattr(item, "subtotal", 0)
        monto_impuesto = getattr(item, "monto_impuesto", 0)
        total_item = getattr(item, "total", 0)

        detalle_items.append({
            "numeroLinea": getattr(item, "numero_linea", 0),
            "codigoPLU": getattr(item, "codigo", "") or "",
            "indicadorBienoServicio": "S",
            "descripcion": getattr(item, "descripcion", ""),
            "cantidad": cantidad,
            "unidadMedida": getattr(item, "unidad", "EA"),
            "precioUnitario": precio_unitario,
            "precioAntesDescuento": round(precio_unitario * cantidad, 2),
            "descuentoMonto": descuento,
            "precioItem": subtotal_item,
            "codigoImpuesto": codigo_imp,
            "tasaIVA": tasa_iva,
            "valorIVA": monto_impuesto,
            "valorTotalItem": total_item,
        })

    # ── Agrupar impuestos por alícuota para impuestosSubtotal ──
    imp_subtotales: dict[str, dict] = {}
    for item in items_calculados:
        codigo_imp = TIPO_IMP_MAP.get(getattr(item, "tipo_impuesto", "G"), "G")
        tasa = ALICUOTAS_IVA.get(codigo_imp, {}).get("tasa", 0.0)

        if codigo_imp not in imp_subtotales:
            imp_subtotales[codigo_imp] = {
                "codigoTotalImp": codigo_imp,
                "alicuotaImp": tasa,
                "baseImponibleImp": 0.0,
                "valorTotalImp": 0.0,
                "descripcion": ALICUOTAS_IVA.get(codigo_imp, {}).get("descripcion", ""),
            }
        imp_subtotales[codigo_imp]["baseImponibleImp"] += getattr(item, "subtotal", 0)
        imp_subtotales[codigo_imp]["valorTotalImp"] += getattr(item, "monto_impuesto", 0)

    # Round subtotals
    for v in imp_subtotales.values():
        v["baseImponibleImp"] = round(v["baseImponibleImp"], 2)
        v["valorTotalImp"] = round(v["valorTotalImp"], 2)

    # ── Totales ──
    monto_gravado = getattr(totales, "gravado_16", 0) + getattr(totales, "gravado_8", 0)
    monto_exento = getattr(totales, "exento", 0)
    subtotal_val = getattr(totales, "subtotal", 0)
    total_iva = getattr(totales, "iva_16", 0) + getattr(totales, "iva_8", 0)
    total_con_iva = subtotal_val + total_iva
    total_igtf = getattr(totales, "igtf", 0)
    total_pagar = getattr(totales, "total", 0)

    forma_seniat = FORMA_PAGO_MAP.get(forma_pago, "99")

    totales_dict = {
        "nroItems": len(detalle_items),
        "montoGravadoTotal": round(monto_gravado, 2),
        "montoExentoTotal": round(monto_exento, 2),
        "subtotal": round(subtotal_val, 2),
        "totalIVA": round(total_iva, 2),
        "montoTotalConIVA": round(total_con_iva, 2),
        "totalAPagar": round(total_pagar, 2),
        "impuestosSubtotal": list(imp_subtotales.values()),
        "formasPago": [{
            "descripcion": forma_pago,
            "forma": forma_seniat,
            "monto": round(total_pagar, 2),
            "moneda": moneda,
        }],
    }

    if total_igtf > 0:
        totales_dict["totalIGTF"] = round(total_igtf, 2)

    # ── Build full document ──
    doc: dict = {
        "encabezado": {
            "identificacionDocumento": {
                "tipoDocumento": tipo_seniat,
                "numeroDocumento": 0,  # Placeholder: assigned during emission
                "tipoTransaccion": "01",
                "fechaEmision": fecha.strftime("%d/%m/%Y"),
                "horaEmision": fecha.strftime("%I:%M:%S %p").lower(),
                "moneda": moneda,
            },
            "vendedor": {
                "codigo": emisor_rif,
                "nombre": emisor_razon_social,
            },
            "comprador": {
                "tipoIdentificacion": receptor_tipo_id,
                "numeroIdentificacion": receptor_rif,
                "razonSocial": receptor_razon_social,
                "direccion": receptor_direccion or "N/A",
                "pais": "VE",
            },
            "totales": totales_dict,
        },
        "detalleItems": detalle_items,
    }

    # ── Totales otra moneda (si aplica) ──
    if moneda != MONEDA_CURSO_LEGAL and tasa_cambio:
        otra = {
            "moneda": MONEDA_CURSO_LEGAL,
            "tipoCambio": tasa_cambio,
            "montoGravadoTotal": round(monto_gravado * tasa_cambio, 2),
            "montoExentoTotal": round(monto_exento * tasa_cambio, 2),
            "subtotal": round(subtotal_val * tasa_cambio, 2),
            "totalAPagar": round(total_pagar * tasa_cambio, 2),
            "totalIVA": round(total_iva * tasa_cambio, 2),
            "montoTotalConIVA": round(total_con_iva * tasa_cambio, 2),
            "impuestosSubtotal": [
                {
                    "codigoTotalImp": s["codigoTotalImp"],
                    "alicuotaImp": s["alicuotaImp"],
                    "baseImponibleImp": round(s["baseImponibleImp"] * tasa_cambio, 2),
                    "valorTotalImp": round(s["valorTotalImp"] * tasa_cambio, 2),
                }
                for s in imp_subtotales.values()
            ],
        }
        doc["encabezado"]["totalesOtraMoneda"] = otra

    # ── Info adicional ──
    if observaciones:
        doc["InfoAdicional"] = [
            {"campo": "Observaciones", "valor": observaciones},
        ]

    return doc

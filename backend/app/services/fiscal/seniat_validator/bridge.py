"""
Puente entre el formato interno de AIDA y el JSON Genérico SENIAT V1.4.

Convierte los datos calculados del document_emitter al formato que
espera el SeniatValidator para pre-validación antes de emitir.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from .catalogs import ALICUOTAS_IVA, MONEDA_CURSO_LEGAL, CODIGOS_IVA_GRAVADOS


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
    # Campos de factura afectada (requeridos para NC/ND)
    numero_factura_afectada: int | None = None,
    fecha_factura_afectada: str | None = None,
    monto_factura_afectada: float | None = None,
    serie_factura_afectada: str | None = None,
    comentario_factura_afectada: str | None = None,
    # Campos de guía de despacho
    transportista_nombre: str | None = None,
    transportista_rif: str | None = None,
    vehiculo_placa: str | None = None,
    ruta_destino: str | None = None,
    motivo_traslado: str | None = None,
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

    # ── Totales (derivados de impuestosSubtotal para consistencia con validador) ──
    monto_gravado = round(sum(
        v["baseImponibleImp"] for k, v in imp_subtotales.items()
        if k in CODIGOS_IVA_GRAVADOS
    ), 2)
    monto_exento = round(sum(
        v["baseImponibleImp"] for k, v in imp_subtotales.items()
        if k == "E"
    ), 2)
    monto_percibido = round(sum(
        v["baseImponibleImp"] for k, v in imp_subtotales.items()
        if k == "P"
    ), 2)
    subtotal_val = round(monto_gravado + monto_exento + monto_percibido, 2)

    total_iva = round(sum(
        v["valorTotalImp"] for k, v in imp_subtotales.items()
        if k in CODIGOS_IVA_GRAVADOS or k == "P"
    ), 2)

    total_con_iva = round(subtotal_val + total_iva, 2)
    total_igtf = round(getattr(totales, "monto_igtf", 0), 2)
    total_pagar = round(total_con_iva + total_igtf, 2)

    forma_seniat = FORMA_PAGO_MAP.get(forma_pago, "99")

    formas_pago_entry: dict = {
        "descripcion": forma_pago,
        "forma": forma_seniat,
        "monto": round(total_pagar, 2),
        "moneda": moneda,
    }
    if moneda != MONEDA_CURSO_LEGAL and tasa_cambio:
        formas_pago_entry["tipoCambio"] = tasa_cambio

    totales_dict = {
        "nroItems": len(detalle_items),
        "montoGravadoTotal": monto_gravado,
        "montoExentoTotal": monto_exento,
        "subtotal": subtotal_val,
        "totalIVA": total_iva,
        "montoTotalConIVA": total_con_iva,
        "totalAPagar": total_pagar,
        "impuestosSubtotal": list(imp_subtotales.values()),
        "formasPago": [formas_pago_entry],
    }

    if monto_percibido > 0:
        totales_dict["montoPercibidoTotal"] = monto_percibido

    if total_igtf > 0:
        totales_dict["totalIGTF"] = total_igtf

    # ── Build full document ──
    ident_doc: dict = {
        "tipoDocumento": tipo_seniat,
        "numeroDocumento": 0,  # Placeholder: assigned during emission
        "tipoTransaccion": "01",
        "fechaEmision": fecha.strftime("%d/%m/%Y"),
        "horaEmision": fecha.strftime("%I:%M:%S %p").lower(),
        "moneda": moneda,
    }

    # Campos de factura afectada (requeridos para NC tipo 02 y ND tipo 03)
    if tipo_seniat in ("02", "03"):
        if numero_factura_afectada is not None:
            ident_doc["numeroFacturaAfectada"] = numero_factura_afectada
        if fecha_factura_afectada:
            ident_doc["fechaFacturaAfectada"] = fecha_factura_afectada
        if monto_factura_afectada is not None:
            ident_doc["montoFacturaAfectada"] = str(round(monto_factura_afectada, 2))
        if serie_factura_afectada:
            ident_doc["serieFacturaAfectada"] = serie_factura_afectada
        if comentario_factura_afectada:
            ident_doc["comentarioFacturaAfectada"] = comentario_factura_afectada

    doc: dict = {
        "encabezado": {
            "identificacionDocumento": ident_doc,
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
    # Cuando el documento es en moneda extranjera (e.g. USD), los totales
    # principales están en esa moneda. totalesOtraMoneda muestra el
    # equivalente en VES. El validador espera: otra_val = totales_val / tipoCambio,
    # por lo que tipoCambio debe ser el recíproco de la tasa BCV.
    if moneda != MONEDA_CURSO_LEGAL and tasa_cambio:
        tc_reciprocal = round(1.0 / tasa_cambio, 8)
        otra: dict = {
            "moneda": MONEDA_CURSO_LEGAL,
            "tipoCambio": tc_reciprocal,
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
        if total_igtf > 0:
            otra["totalIGTF"] = round(total_igtf * tasa_cambio, 2)
        doc["encabezado"]["totalesOtraMoneda"] = otra

    # ── Guía de Despacho (tipo 04) ──
    if tipo_seniat == "04":
        # Extraer nombre y CI del conductor del formato "Nombre (CI: xxxxx)"
        conductor_nombre = transportista_nombre or ""
        conductor_ci = ""
        if conductor_nombre and "(CI:" in conductor_nombre:
            parts = conductor_nombre.split("(CI:")
            conductor_nombre = parts[0].strip()
            conductor_ci = parts[1].replace(")", "").strip()

        guia_node: dict = {
            "esGuiaDespacho": "SI",
            "motivoTraslado": motivo_traslado or "venta",
            "origenProducto": emisor_direccion or "N/A",
            "destinoProducto": ruta_destino or receptor_direccion or "N/A",
            "nombreCompleto": conductor_nombre or "N/A",
            "tipoIdentificacion": "V",
        }
        if conductor_ci:
            guia_node["numeroIdentificacion"] = conductor_ci
        if vehiculo_placa:
            guia_node["numeroPlaca"] = vehiculo_placa
        if transportista_rif:
            guia_node["razonSocial"] = transportista_rif

        doc["guiaDespacho"] = guia_node

    # ── Info adicional ──
    if observaciones:
        doc["InfoAdicional"] = [
            {"campo": "Observaciones", "valor": observaciones},
        ]

    return doc

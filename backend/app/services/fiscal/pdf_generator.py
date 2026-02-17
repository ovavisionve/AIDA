"""
Generador de PDF para documentos fiscales AIDA.

Conforme a Providencia SNAT/2024/000102:
  - Art. 7: Facturas (15 requisitos)
  - Art. 8: Notas de Crédito / Débito
  - Art. 10: Guías de Despacho ("Sin derecho a Crédito Fiscal")
  - Art. 11: Comprobantes de Retención (AAAAMMSSSSSSSS)
  - Art. 30: Formato de número de control
  - Art. 31: Tamaños mínimos de fuente (6pt imprenta, 8pt emisor/control)

Soporta múltiples plantillas via layout_config (JSON) del modelo DocumentTemplate.
"""
import io
import json
import os
import base64
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer, HRFlowable, Image,
)
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT

# QR code generation
import qrcode
from qrcode.image.pil import PilImage

# Barcode generation
import barcode
from barcode.writer import ImageWriter


# ── QR code y barcode helpers ──────────────────────────────────────────────

def _generate_qr_image(data: str, size_mm: float = 25) -> Image | None:
    """Genera una imagen QR como objeto Image de ReportLab."""
    try:
        qr = qrcode.QRCode(version=1, box_size=8, border=1, error_correction=qrcode.constants.ERROR_CORRECT_M)
        qr.add_data(data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        return Image(buf, width=size_mm * mm, height=size_mm * mm)
    except Exception:
        return None


def _generate_barcode_image(data: str, width_mm: float = 80, height_mm: float = 12) -> Image | None:
    """Genera un código de barras Code128 como objeto Image de ReportLab."""
    try:
        code128 = barcode.get_barcode_class("code128")
        writer = ImageWriter()
        bar = code128(data, writer=writer)
        buf = io.BytesIO()
        bar.write(buf, options={"module_width": 0.3, "module_height": 8, "font_size": 6, "text_distance": 2, "quiet_zone": 2})
        buf.seek(0)
        return Image(buf, width=width_mm * mm, height=height_mm * mm)
    except Exception:
        return None


def _build_qr_url(doc) -> str:
    """Construye la URL de validación pública para el QR code."""
    control = _safe(doc, "control_number", "")
    uuid_doc = _safe(doc, "uuid_seniat", "")
    # URL de validación pública
    base_url = "https://validacion.aida.com.ve"
    if control:
        return f"{base_url}/verificar?nc={control}&uuid={uuid_doc}"
    return f"{base_url}/verificar?uuid={uuid_doc}"


# ── Defaults para plantilla (si no se provee layout_config) ───────────────

DEFAULT_LAYOUT = {
    "header_color": "#4a6741",
    "accent_color": "#5c8a4f",
    "text_color": "#1a1a1a",
    "header_bg": "#e8f0e5",
    "table_header_bg": "#4a6741",
    "table_header_text": "#ffffff",
    "table_alt_row": "#f5f8f4",
    "border_color": "#4a6741",
    "font_family": "Helvetica",
    "font_size_factor": 1.0,
    "margins_factor": 1.0,
    "logo_position": "top-left",
    "qr_position": "top-right",
    "banner_position": "footer",
    "style": "formal",
}


# ── Utilidades de formato ─────────────────────────────────────────────────

def _fmt_money_ve(val, moneda="VES"):
    """Formato venezolano: puntos para miles, coma para decimales.
    Ej: 1.234.567,89 Bs."""
    if val is None:
        val = 0
    num = float(val)
    # Formatear con 2 decimales
    parts = f"{abs(num):,.2f}".split(".")
    integer_part = parts[0].replace(",", ".")
    decimal_part = parts[1]
    formatted = f"{integer_part},{decimal_part}"
    if num < 0:
        formatted = f"-{formatted}"
    suffix = {"VES": "Bs.", "USD": "$", "EUR": "€"}.get(moneda, moneda)
    return f"{formatted} {suffix}"


def _fmt_date(dt):
    """Formato fecha DD/MM/AAAA."""
    if isinstance(dt, str):
        return dt[:10]
    if isinstance(dt, datetime):
        return dt.strftime("%d/%m/%Y")
    if dt is not None:
        try:
            return dt.strftime("%d/%m/%Y")
        except AttributeError:
            pass
    return str(dt) if dt else ""


def _fmt_datetime(dt):
    """Formato Art. 7 numeral 6: DDMMAAAA HH:MM:SS → se muestra DD/MM/AAAA HH:MM:SS."""
    if isinstance(dt, datetime):
        return dt.strftime("%d/%m/%Y %H:%M:%S")
    return _fmt_date(dt)


def _safe(obj, attr, default=""):
    """Obtener atributo seguro de un objeto."""
    val = getattr(obj, attr, default)
    return val if val is not None else default


def _parse_layout(layout_config_str):
    """Parsear layout_config JSON a dict, con fallback a defaults."""
    layout = dict(DEFAULT_LAYOUT)
    if layout_config_str:
        try:
            custom = json.loads(layout_config_str) if isinstance(layout_config_str, str) else layout_config_str
            layout.update(custom)
        except (json.JSONDecodeError, TypeError):
            pass
    return layout


# ── Estilos ───────────────────────────────────────────────────────────────

def _build_styles(layout):
    """Crear estilos de ReportLab basados en la configuración de plantilla."""
    styles = getSampleStyleSheet()
    factor = float(layout.get("font_size_factor", 1.0))
    font = layout.get("font_family", "Helvetica")
    text_color = colors.HexColor(layout.get("text_color", "#1a1a1a"))
    header_color = colors.HexColor(layout.get("header_color", "#4a6741"))

    styles.add(ParagraphStyle(
        name="DocTitle", fontSize=int(14 * factor), fontName=f"{font}-Bold",
        alignment=TA_CENTER, spaceAfter=2, textColor=header_color,
    ))
    styles.add(ParagraphStyle(
        name="DocType", fontSize=int(12 * factor), fontName=f"{font}-Bold",
        alignment=TA_CENTER, spaceAfter=2, textColor=colors.white,
    ))
    styles.add(ParagraphStyle(
        name="SectionHead", fontSize=int(10 * factor), fontName=f"{font}-Bold",
        spaceAfter=3, spaceBefore=6, textColor=header_color,
    ))
    styles.add(ParagraphStyle(
        name="CellLabel", fontSize=int(8 * factor), fontName=f"{font}-Bold",
        leading=int(10 * factor), textColor=text_color,
    ))
    styles.add(ParagraphStyle(
        name="CellValue", fontSize=int(8 * factor), fontName=font,
        leading=int(10 * factor), textColor=text_color,
    ))
    styles.add(ParagraphStyle(
        name="SmallBold", fontSize=int(8 * factor), fontName=f"{font}-Bold",
        leading=int(10 * factor), textColor=text_color,
    ))
    styles.add(ParagraphStyle(
        name="SmallText", fontSize=int(8 * factor), fontName=font,
        leading=int(10 * factor), textColor=text_color,
    ))
    # Art. 31: mínimo 6pt para imprenta, 8pt para emisor/control
    styles.add(ParagraphStyle(
        name="ImprentaText", fontSize=max(6, int(7 * factor)), fontName=font,
        leading=max(8, int(9 * factor)), textColor=colors.HexColor("#555555"),
        alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        name="FooterText", fontSize=max(6, int(7 * factor)), fontName=font,
        textColor=colors.HexColor("#888888"), alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        name="LegalText", fontSize=int(7 * factor), fontName=font,
        leading=int(9 * factor), textColor=colors.HexColor("#333333"),
    ))
    styles.add(ParagraphStyle(
        name="TotalLabel", fontSize=int(9 * factor), fontName=font,
        alignment=TA_RIGHT, textColor=text_color,
    ))
    styles.add(ParagraphStyle(
        name="TotalValue", fontSize=int(9 * factor), fontName=f"{font}-Bold",
        alignment=TA_RIGHT, textColor=text_color,
    ))
    styles.add(ParagraphStyle(
        name="GrandTotal", fontSize=int(11 * factor), fontName=f"{font}-Bold",
        alignment=TA_RIGHT, textColor=header_color,
    ))
    return styles


# ── Generador principal ───────────────────────────────────────────────────

def generate_invoice_pdf(
    doc,
    items,
    doc_type: str = "factura",
    layout_config=None,
    logo_path: str | None = None,
    banner_path: str | None = None,
    banner_position: str = "footer",
) -> bytes:
    """
    Genera un PDF completo para un documento fiscal conforme SENIAT.

    Args:
        doc: objeto documento (Invoice, CreditNote, DebitNote, DispatchGuide, Withholding)
        items: lista de DocumentItem
        doc_type: 'factura', 'nota_credito', 'nota_debito', 'guia_despacho', 'retencion'
        layout_config: dict o JSON string con configuración de plantilla
        logo_path: ruta al logo del cliente (o None)
        banner_path: ruta al banner publicitario (o None)
        banner_position: 'header', 'footer', o 'none'

    Returns:
        bytes del PDF generado
    """
    layout = _parse_layout(layout_config)
    styles = _build_styles(layout)

    margin_factor = float(layout.get("margins_factor", 1.0))
    base_margin = 15 * mm * margin_factor

    buffer = io.BytesIO()
    pdf = SimpleDocTemplate(
        buffer, pagesize=letter,
        leftMargin=base_margin, rightMargin=base_margin,
        topMargin=base_margin, bottomMargin=20 * mm * margin_factor,
    )

    elements = []
    moneda = _safe(doc, "moneda", "VES")
    hc = colors.HexColor(layout["header_color"])
    ac = colors.HexColor(layout["accent_color"])
    bc = colors.HexColor(layout["border_color"])

    # ── Banner en header ──────────────────────────────────────────────
    if banner_path and banner_position == "header" and os.path.isfile(banner_path):
        try:
            banner_img = Image(banner_path, width=180 * mm, height=25 * mm)
            banner_img.hAlign = "CENTER"
            elements.append(banner_img)
            elements.append(Spacer(1, 2 * mm))
        except Exception:
            pass

    # ── Encabezado: Logo + Datos Emisor + Tipo Documento ──────────────
    _build_header(elements, doc, doc_type, layout, styles, logo_path)
    elements.append(Spacer(1, 3 * mm))

    # ── Receptor ──────────────────────────────────────────────────────
    _build_receptor(elements, doc, layout, styles)
    elements.append(Spacer(1, 2 * mm))

    # ── Supervisor / Entrega (solo facturas) ──────────────────────────
    if doc_type == "factura":
        _build_supervisor_entrega(elements, doc, layout, styles)

    # ── Referencia a factura original (NC/ND) ─────────────────────────
    if doc_type in ("nota_credito", "nota_debito"):
        _build_referencia_factura(elements, doc, doc_type, layout, styles)

    # ── Leyenda "Sin derecho a Crédito Fiscal" (Guía de Despacho) ─────
    if doc_type == "guia_despacho":
        _build_leyenda_guia(elements, doc, layout, styles)

    # ── Datos de transporte (Guía de Despacho) ────────────────────────
    if doc_type == "guia_despacho":
        _build_transporte(elements, doc, layout, styles)

    # ── Retención (solo para retenciones) ─────────────────────────────
    if doc_type == "retencion":
        _build_retencion_detail(elements, doc, layout, styles, moneda)

    # ── Tabla de ítems ────────────────────────────────────────────────
    if doc_type != "retencion":
        _build_items_table(elements, doc, items, doc_type, layout, styles, moneda)
        elements.append(Spacer(1, 3 * mm))

        # ── Totales ──────────────────────────────────────────────────
        _build_totals(elements, doc, doc_type, layout, styles, moneda)
        elements.append(Spacer(1, 3 * mm))

    # ── Información de pago ───────────────────────────────────────────
    if doc_type in ("factura",):
        _build_payment_info(elements, doc, styles, moneda)

    # ── IGTF Legal ────────────────────────────────────────────────────
    _build_igtf_legend(elements, doc, doc_type, styles)

    # ── Observaciones ─────────────────────────────────────────────────
    obs = _safe(doc, "observaciones")
    if obs:
        elements.append(Paragraph(f"<b>Observaciones:</b> {obs}", styles["SmallText"]))
        elements.append(Spacer(1, 2 * mm))

    # ── QR code + Firma digital + Barcode ──────────────────────────────
    _build_qr_firma_barcode(elements, doc, layout, styles)

    # ── Imprenta Digital (Art. 7, numeral 14) ─────────────────────────
    _build_imprenta_footer(elements, doc, layout, styles)

    # ── Control range / Providencia ───────────────────────────────────
    _build_control_providencia(elements, doc, styles)

    # ── Banner en footer ──────────────────────────────────────────────
    if banner_path and banner_position == "footer" and os.path.isfile(banner_path):
        try:
            elements.append(Spacer(1, 3 * mm))
            banner_img = Image(banner_path, width=180 * mm, height=25 * mm)
            banner_img.hAlign = "CENTER"
            elements.append(banner_img)
        except Exception:
            pass

    # ── Footer final ──────────────────────────────────────────────────
    elements.append(Spacer(1, 3 * mm))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cccccc")))
    elements.append(Spacer(1, 2 * mm))
    elements.append(Paragraph(
        "Documento generado por AIDA Imprenta Digital — Sistema autorizado por SENIAT | "
        "Verifique en: https://validacion.aida.com.ve",
        styles["FooterText"],
    ))
    elements.append(Paragraph(
        f"Generado: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}",
        styles["FooterText"],
    ))

    pdf.build(elements)
    return buffer.getvalue()


# ═══════════════════════════════════════════════════════════════════════════
# Secciones del PDF
# ═══════════════════════════════════════════════════════════════════════════

def _build_header(elements, doc, doc_type, layout, styles, logo_path):
    """Encabezado: Logo (izq) + Emisor (centro) + Tipo/Control (der)."""
    hc = colors.HexColor(layout["header_color"])
    header_bg = colors.HexColor(layout["header_bg"])

    type_labels = {
        "factura": "FACTURA",
        "nota_credito": "NOTA DE CRÉDITO",
        "nota_debito": "NOTA DE DÉBITO",
        "guia_despacho": "GUÍA DE DESPACHO",
        "retencion": "COMPROBANTE DE RETENCIÓN",
    }
    type_label = type_labels.get(doc_type, doc_type.upper())

    # Columna izquierda: Logo
    logo_cell = ""
    if logo_path and os.path.isfile(logo_path):
        try:
            logo_cell = Image(logo_path, width=35 * mm, height=20 * mm)
        except Exception:
            logo_cell = Paragraph("LOGO", styles["CellLabel"])
    else:
        logo_cell = Paragraph(
            f"<b>{_safe(doc, 'emisor_razon_social', 'AIDA')}</b>",
            styles["CellLabel"],
        )

    # Columna centro: Datos emisor (Art. 7, numeral 3 — mínimo 8pt)
    emisor_lines = []
    emisor_lines.append(f"<b>{_safe(doc, 'emisor_razon_social')}</b>")
    emisor_lines.append(f"RIF: {_safe(doc, 'emisor_rif')}")
    dir_emisor = _safe(doc, "emisor_direccion")
    if dir_emisor:
        emisor_lines.append(dir_emisor[:100])
    tel_emisor = _safe(doc, "emisor_telefono")
    ciudad = _safe(doc, "emisor_ciudad")
    zp = _safe(doc, "emisor_zona_postal")
    extras = []
    if tel_emisor:
        extras.append(f"Tel: {tel_emisor}")
    if ciudad:
        extras.append(ciudad)
    if zp:
        extras.append(f"Zona Postal: {zp}")
    if extras:
        emisor_lines.append(" | ".join(extras))
    emisor_text = "<br/>".join(emisor_lines)
    emisor_cell = Paragraph(emisor_text, styles["CellValue"])

    # Columna derecha: Tipo de documento + control + fecha
    doc_number = _safe(doc, "document_number")
    control = _safe(doc, "control_number")
    fecha = _fmt_datetime(_safe(doc, "fecha_emision"))

    right_data = [
        [Paragraph(f"<b>{type_label}</b>", styles["DocType"])],
        [Paragraph(f"N° {doc_number}", styles["SmallBold"])],
        [Paragraph(f"N° de Control: {control}", styles["SmallBold"])],
        [Paragraph(f"Fecha: {fecha}", styles["SmallBold"])],
    ]
    right_table = Table(right_data, colWidths=["100%"])
    right_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), hc),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("PADDING", (0, 0), (-1, -1), 3),
        ("BOX", (0, 0), (-1, -1), 0.5, hc),
    ]))

    # Ensamblar encabezado en tabla 3 columnas
    header_table = Table(
        [[logo_cell, emisor_cell, right_table]],
        colWidths=["20%", "40%", "40%"],
    )
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (1, 0), header_bg),
        ("PADDING", (0, 0), (-1, -1), 4),
        ("BOX", (0, 0), (-1, -1), 1, hc),
    ]))
    elements.append(header_table)


def _build_receptor(elements, doc, layout, styles):
    """Sección Receptor / Adquiriente (Art. 7, numeral 7)."""
    hc = colors.HexColor(layout["header_color"])

    # Datos del receptor
    data = [
        [Paragraph("<b>DATOS DEL RECEPTOR / ADQUIRIENTE</b>", styles["SmallBold"]), "", ""],
        [
            Paragraph(f"<b>RIF:</b> {_safe(doc, 'receptor_rif')}", styles["CellValue"]),
            Paragraph(f"<b>Razón Social:</b> {_safe(doc, 'receptor_razon_social')}", styles["CellValue"]),
            Paragraph(f"<b>Tel:</b> {_safe(doc, 'receptor_telefono')}", styles["CellValue"]),
        ],
        [
            Paragraph(f"<b>Dirección:</b> {_safe(doc, 'receptor_direccion', '')[:120]}", styles["CellValue"]),
            Paragraph(f"<b>Email:</b> {_safe(doc, 'receptor_email')}", styles["CellValue"]),
            "",
        ],
    ]

    t = Table(data, colWidths=["35%", "40%", "25%"])
    t.setStyle(TableStyle([
        ("SPAN", (0, 0), (-1, 0)),
        ("BACKGROUND", (0, 0), (-1, 0), hc),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor(layout["border_color"])),
        ("PADDING", (0, 0), (-1, -1), 3),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    elements.append(t)


def _build_supervisor_entrega(elements, doc, layout, styles):
    """Sección Supervisor y Datos de Entrega (campos presentes en formatos oficiales)."""
    sup_nombre = _safe(doc, "supervisor_nombre")
    sup_cedula = _safe(doc, "supervisor_cedula")
    ent_dir = _safe(doc, "entrega_direccion")
    ent_fecha = _safe(doc, "entrega_fecha")
    ent_resp = _safe(doc, "entrega_responsable")

    if not any([sup_nombre, ent_dir]):
        return

    hc = colors.HexColor(layout["header_color"])

    rows = []
    if sup_nombre or sup_cedula:
        rows.append([
            Paragraph(f"<b>Supervisor:</b> {sup_nombre}", styles["CellValue"]),
            Paragraph(f"<b>C.I.:</b> {sup_cedula}", styles["CellValue"]),
            "",
        ])
    if ent_dir or ent_fecha or ent_resp:
        rows.append([
            Paragraph(f"<b>Dir. Entrega:</b> {ent_dir[:80] if ent_dir else ''}", styles["CellValue"]),
            Paragraph(f"<b>Fecha Entrega:</b> {_fmt_date(ent_fecha)}", styles["CellValue"]),
            Paragraph(f"<b>Responsable:</b> {ent_resp}", styles["CellValue"]),
        ])

    if rows:
        elements.append(Spacer(1, 2 * mm))
        t = Table(rows, colWidths=["40%", "30%", "30%"])
        t.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor(layout["border_color"])),
            ("PADDING", (0, 0), (-1, -1), 3),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        elements.append(t)


def _build_referencia_factura(elements, doc, doc_type, layout, styles):
    """Referencia a factura original — para NC y ND (Art. 8)."""
    hc = colors.HexColor(layout["header_color"])
    label = "NOTA DE CRÉDITO" if doc_type == "nota_credito" else "NOTA DE DÉBITO"
    motivo = _safe(doc, "motivo") if doc_type == "nota_credito" else _safe(doc, "concepto")

    elements.append(Spacer(1, 2 * mm))
    ref_data = [
        [Paragraph(f"<b>APLICA A LA FACTURA</b>", styles["SmallBold"]), "", ""],
        [
            Paragraph(f"<b>Factura N°:</b> {_safe(doc, 'factura_numero')}", styles["CellValue"]),
            Paragraph(f"<b>Control:</b> {_safe(doc, 'factura_control')}", styles["CellValue"]),
            Paragraph(f"<b>Fecha:</b> {_fmt_date(_safe(doc, 'factura_fecha'))}", styles["CellValue"]),
        ],
        [
            Paragraph(f"<b>Monto Original:</b> {_fmt_money_ve(_safe(doc, 'factura_monto', 0), _safe(doc, 'moneda', 'VES'))}", styles["CellValue"]),
            Paragraph(f"<b>Motivo:</b> {motivo[:100] if motivo else ''}", styles["CellValue"]),
            "",
        ],
    ]
    t = Table(ref_data, colWidths=["35%", "35%", "30%"])
    t.setStyle(TableStyle([
        ("SPAN", (0, 0), (-1, 0)),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fff3cd")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor(layout["border_color"])),
        ("PADDING", (0, 0), (-1, -1), 3),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    elements.append(t)


def _build_leyenda_guia(elements, doc, layout, styles):
    """Art. 10: Leyenda obligatoria en Guías de Despacho."""
    leyenda = _safe(doc, "leyenda_sin_credito_fiscal", True)
    if leyenda:
        elements.append(Spacer(1, 2 * mm))
        elements.append(Paragraph(
            '<b>"SIN DERECHO A CRÉDITO FISCAL"</b>',
            ParagraphStyle(
                "LeyendaGuia", parent=styles["SmallBold"],
                fontSize=10, alignment=TA_CENTER,
                textColor=colors.HexColor("#dc2626"),
                spaceBefore=4, spaceAfter=4,
            ),
        ))


def _build_transporte(elements, doc, layout, styles):
    """Datos de transporte para Guías de Despacho."""
    transportista = _safe(doc, "transportista_nombre")
    if not transportista:
        return

    hc = colors.HexColor(layout["header_color"])
    elements.append(Spacer(1, 2 * mm))
    data = [
        [Paragraph("<b>DATOS DE TRANSPORTE</b>", styles["SmallBold"]), "", ""],
        [
            Paragraph(f"<b>Transportista:</b> {transportista}", styles["CellValue"]),
            Paragraph(f"<b>RIF:</b> {_safe(doc, 'transportista_rif')}", styles["CellValue"]),
            Paragraph(f"<b>Placa:</b> {_safe(doc, 'vehiculo_placa')}", styles["CellValue"]),
        ],
        [
            Paragraph(f"<b>Destino:</b> {_safe(doc, 'ruta_destino', '')[:100]}", styles["CellValue"]),
            Paragraph(f"<b>Motivo Traslado:</b> {_safe(doc, 'motivo_traslado', '')[:80]}", styles["CellValue"]),
            "",
        ],
    ]
    t = Table(data, colWidths=["40%", "30%", "30%"])
    t.setStyle(TableStyle([
        ("SPAN", (0, 0), (-1, 0)),
        ("BACKGROUND", (0, 0), (-1, 0), hc),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor(layout["border_color"])),
        ("PADDING", (0, 0), (-1, -1), 3),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    elements.append(t)


def _build_retencion_detail(elements, doc, layout, styles, moneda):
    """Detalle específico para Comprobantes de Retención (Art. 11)."""
    hc = colors.HexColor(layout["header_color"])
    elements.append(Spacer(1, 3 * mm))

    tipo_ret = "IVA" if _safe(doc, "tipo") == "iva" else "ISLR"
    data = [
        [Paragraph(f"<b>DETALLE DE RETENCIÓN — {tipo_ret}</b>", styles["SmallBold"]), "", ""],
        [
            Paragraph(f"<b>Agente Retención:</b> {_safe(doc, 'agente_retencion_nombre')}", styles["CellValue"]),
            Paragraph(f"<b>RIF:</b> {_safe(doc, 'agente_retencion_rif')}", styles["CellValue"]),
            "",
        ],
        [
            Paragraph(f"<b>Sujeto Retenido:</b> {_safe(doc, 'sujeto_retenido_nombre')}", styles["CellValue"]),
            Paragraph(f"<b>RIF:</b> {_safe(doc, 'sujeto_retenido_rif')}", styles["CellValue"]),
            Paragraph(f"<b>Período:</b> {_safe(doc, 'periodo_fiscal')}", styles["CellValue"]),
        ],
        [
            Paragraph(f"<b>Factura N°:</b> {_safe(doc, 'factura_numero')}", styles["CellValue"]),
            Paragraph(f"<b>Fecha Factura:</b> {_fmt_date(_safe(doc, 'factura_fecha'))}", styles["CellValue"]),
            Paragraph(f"<b>Monto Factura:</b> {_fmt_money_ve(_safe(doc, 'monto_factura', 0), moneda)}", styles["CellValue"]),
        ],
        [
            Paragraph(f"<b>Base Imponible:</b> {_fmt_money_ve(_safe(doc, 'base_imponible', 0), moneda)}", styles["CellValue"]),
            Paragraph(f"<b>% Retención:</b> {float(_safe(doc, 'porcentaje_retencion', 0)):.2f}%", styles["CellValue"]),
            Paragraph(f"<b>Monto Retenido:</b> {_fmt_money_ve(_safe(doc, 'monto_retenido', 0), moneda)}", styles["CellValue"]),
        ],
    ]
    if _safe(doc, "concepto"):
        data.append([
            Paragraph(f"<b>Concepto:</b> {_safe(doc, 'concepto')}", styles["CellValue"]),
            "", "",
        ])

    t = Table(data, colWidths=["40%", "30%", "30%"])
    t.setStyle(TableStyle([
        ("SPAN", (0, 0), (-1, 0)),
        ("BACKGROUND", (0, 0), (-1, 0), hc),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor(layout["border_color"])),
        ("PADDING", (0, 0), (-1, -1), 3),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 4 * mm))


def _build_items_table(elements, doc, items, doc_type, layout, styles, moneda):
    """Tabla de ítems/detalle del documento (Art. 7, numerales 8-10)."""
    hc = colors.HexColor(layout["header_color"])
    thbg = colors.HexColor(layout["table_header_bg"])
    thtxt = colors.HexColor(layout["table_header_text"])
    alt_row = colors.HexColor(layout["table_alt_row"])
    factor = float(layout.get("font_size_factor", 1.0))

    elements.append(Paragraph("DETALLE DE ÍTEMS", styles["SectionHead"]))

    # Columnas base
    if doc_type == "guia_despacho":
        header = ["#", "Código", "Descripción", "U.M.", "Cant.", "Peso", "Vol."]
        col_widths = [20, 50, 150, 30, 40, 45, 45]
    else:
        header = ["#", "Código", "Descripción", "Cant.", "P. Unit.", "Desc.", "Alíc.", "Total"]
        col_widths = [18, 50, 130, 35, 60, 42, 35, 65]

    table_data = [header]

    for item in items:
        if doc_type == "guia_despacho":
            row = [
                str(_safe(item, "line_number", "")),
                str(_safe(item, "product_code", ""))[:12],
                str(_safe(item, "description", ""))[:50],
                str(_safe(item, "unit_of_measure", "UND")),
                f"{float(_safe(item, 'quantity', 0)):.2f}",
                str(_safe(item, "peso", "")),
                str(_safe(item, "volumen", "")),
            ]
        else:
            row = [
                str(_safe(item, "line_number", "")),
                str(_safe(item, "product_code", ""))[:12],
                str(_safe(item, "description", ""))[:50],
                f"{float(_safe(item, 'quantity', 0)):.2f}",
                _fmt_money_ve(_safe(item, "unit_price", 0), ""),
                _fmt_money_ve(_safe(item, "discount_amount", 0), ""),
                f"{float(_safe(item, 'tax_rate', 0)):.0f}%",
                _fmt_money_ve(_safe(item, "total", 0), ""),
            ]
        table_data.append(row)

    items_table = Table(table_data, colWidths=col_widths)
    items_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), thbg),
        ("TEXTCOLOR", (0, 0), (-1, 0), thtxt),
        ("FONTNAME", (0, 0), (-1, 0), f"{layout.get('font_family', 'Helvetica')}-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), max(6, int(7 * factor))),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ("ALIGN", (3, 1), (-1, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor(layout["border_color"])),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, alt_row]),
        ("PADDING", (0, 0), (-1, -1), 3),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(items_table)


def _build_totals(elements, doc, doc_type, layout, styles, moneda):
    """Sección de totales con IGTF (Art. 7, numerales 11-13)."""
    hc = colors.HexColor(layout["header_color"])

    subtotal = float(_safe(doc, "subtotal", 0))
    descuento = float(_safe(doc, "descuento", 0))
    cargo_admin = float(_safe(doc, "cargo_administrativo", 0))
    base_imponible = float(_safe(doc, "base_imponible", 0) or subtotal)
    base_exenta = float(_safe(doc, "base_exenta", 0))
    base_no_sujeta = float(_safe(doc, "base_no_sujeta", 0))
    iva_16 = float(_safe(doc, "monto_iva_16", 0) or _safe(doc, "monto_iva", 0) or 0)
    iva_8 = float(_safe(doc, "monto_iva_8", 0))
    total = float(_safe(doc, "total", 0))

    # IGTF
    base_igtf = float(_safe(doc, "base_imponible_igtf", 0))
    monto_igtf = float(_safe(doc, "monto_igtf", 0))
    total_con_igtf = float(_safe(doc, "total_con_igtf", 0))

    rows = []
    rows.append(["Subtotal:", _fmt_money_ve(subtotal, moneda)])
    if descuento > 0:
        rows.append(["Descuento:", f"-{_fmt_money_ve(descuento, moneda)}"])
    if cargo_admin > 0:
        rows.append(["Cargo Administrativo:", _fmt_money_ve(cargo_admin, moneda)])
    rows.append(["Base Imponible:", _fmt_money_ve(base_imponible, moneda)])
    if base_exenta > 0:
        rows.append(["Base Exenta:", _fmt_money_ve(base_exenta, moneda)])
    if base_no_sujeta > 0:
        rows.append(["Base No Sujeta:", _fmt_money_ve(base_no_sujeta, moneda)])
    if iva_16 > 0:
        alicuota_16 = float(_safe(doc, "alicuota_iva_16", 16))
        rows.append([f"IVA {alicuota_16:.0f}%:", _fmt_money_ve(iva_16, moneda)])
    if iva_8 > 0:
        alicuota_8 = float(_safe(doc, "alicuota_iva_8", 8))
        rows.append([f"IVA {alicuota_8:.0f}%:", _fmt_money_ve(iva_8, moneda)])
    rows.append(["TOTAL:", _fmt_money_ve(total, moneda)])

    # IGTF (si aplica)
    if monto_igtf > 0:
        pct_igtf = float(_safe(doc, "porcentaje_igtf", 3))
        rows.append(["", ""])  # Línea separadora visual
        rows.append([f"Base Imponible IGTF:", _fmt_money_ve(base_igtf, moneda)])
        rows.append([f"IGTF {pct_igtf:.0f}%:", _fmt_money_ve(monto_igtf, moneda)])
        rows.append(["TOTAL A PAGAR (con IGTF):", _fmt_money_ve(total_con_igtf or (total + monto_igtf), moneda)])

    totals_table = Table(rows, colWidths=[140, 110])
    style_cmds = [
        ("ALIGN", (0, 0), (0, -1), "RIGHT"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("FONTNAME", (0, 0), (-1, -1), layout.get("font_family", "Helvetica")),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("PADDING", (0, 0), (-1, -1), 2),
    ]

    # Encontrar fila TOTAL y TOTAL CON IGTF para destacar
    for i, row in enumerate(rows):
        if row[0].startswith("TOTAL"):
            style_cmds.append(("FONTNAME", (0, i), (-1, i), f"{layout.get('font_family', 'Helvetica')}-Bold"))
            style_cmds.append(("FONTSIZE", (0, i), (-1, i), 10))
            style_cmds.append(("LINEABOVE", (0, i), (-1, i), 1, hc))
            if "IGTF" in row[0]:
                style_cmds.append(("TEXTCOLOR", (0, i), (-1, i), colors.HexColor("#dc2626")))
                style_cmds.append(("FONTSIZE", (0, i), (-1, i), 11))

    totals_table.setStyle(TableStyle(style_cmds))

    # Alinear a la derecha
    container = Table([[Spacer(1, 1), totals_table]], colWidths=["50%", "50%"])
    elements.append(container)


def _build_payment_info(elements, doc, styles, moneda):
    """Información de pago, tasa de cambio."""
    forma_pago = _safe(doc, "forma_pago")
    condicion_pago = _safe(doc, "condicion_pago")
    tasa = _safe(doc, "tasa_cambio")

    parts = []
    if forma_pago:
        parts.append(f"<b>Forma de pago:</b> {forma_pago}")
    if condicion_pago:
        parts.append(f"<b>Condición:</b> {condicion_pago}")
    if tasa and moneda != "VES":
        parts.append(f"<b>Tasa de cambio:</b> 1 {moneda} = {float(tasa):,.4f} VES")

    if parts:
        elements.append(Paragraph(" | ".join(parts), styles["SmallText"]))
        elements.append(Spacer(1, 2 * mm))


def _build_igtf_legend(elements, doc, doc_type, styles):
    """Leyenda legal de IGTF si aplica."""
    monto_igtf = float(_safe(doc, "monto_igtf", 0))
    if monto_igtf <= 0:
        return
    if doc_type == "retencion":
        return

    pct = float(_safe(doc, "porcentaje_igtf", 3))
    elements.append(Spacer(1, 2 * mm))
    elements.append(Paragraph(
        f"<b>IGTF:</b> Impuesto a las Grandes Transacciones Financieras. "
        f"Alícuota del {pct:.0f}% aplicable a pagos en moneda extranjera o "
        f"criptoactivos, conforme al Decreto con Rango, Valor y Fuerza de "
        f"Ley de Impuesto a las Grandes Transacciones Financieras.",
        styles["LegalText"],
    ))
    elements.append(Spacer(1, 2 * mm))


def _build_qr_firma_barcode(elements, doc, layout, styles):
    """QR code de validación, firma digital y código de barras."""
    hc = colors.HexColor(layout["header_color"])
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cccccc")))
    elements.append(Spacer(1, 2 * mm))

    # QR code image (apunta a URL de validación pública)
    qr_url = _build_qr_url(doc)
    qr_img = _generate_qr_image(qr_url, size_mm=22)

    # Firma digital text
    firma = _safe(doc, "firma_digital")
    uuid_doc = _safe(doc, "uuid_seniat")

    firma_lines = []
    if uuid_doc:
        firma_lines.append(f"<b>UUID:</b> {uuid_doc}")
    if firma:
        firma_lines.append(f"<b>Firma SHA-256:</b> {firma}")
    firma_lines.append(f"<b>Verificar en:</b> {qr_url}")
    firma_text = Paragraph("<br/>".join(firma_lines), styles["SmallText"])

    if qr_img:
        # QR a la izquierda, firma a la derecha
        qr_firma_table = Table(
            [[qr_img, firma_text]],
            colWidths=[28 * mm, None],
        )
        qr_firma_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("PADDING", (0, 0), (-1, -1), 2),
        ]))
        elements.append(qr_firma_table)
    elif firma:
        elements.append(firma_text)

    elements.append(Spacer(1, 2 * mm))

    # Barcode (Code128 con número de control)
    control = _safe(doc, "control_number", "")
    if control:
        barcode_img = _generate_barcode_image(control, width_mm=75, height_mm=10)
        if barcode_img:
            barcode_img.hAlign = "CENTER"
            elements.append(barcode_img)
            elements.append(Spacer(1, 2 * mm))


def _build_imprenta_footer(elements, doc, layout, styles):
    """Datos de la Imprenta Digital (Art. 7, numeral 14 — mínimo 6pt)."""
    imprenta_rif = _safe(doc, "imprenta_rif")
    imprenta_razon = _safe(doc, "imprenta_razon_social")

    if not imprenta_rif and not imprenta_razon:
        # Usar datos de AIDA como imprenta por defecto
        imprenta_rif = "J-50000000-0"
        imprenta_razon = "AIDA Imprenta Digital, C.A."

    imprenta_auth = _safe(doc, "imprenta_autorizacion")
    imprenta_fecha = _safe(doc, "imprenta_fecha_autorizacion")

    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cccccc")))
    elements.append(Spacer(1, 2 * mm))

    parts = [f"Imprenta: {imprenta_razon} — RIF: {imprenta_rif}"]
    if imprenta_auth:
        parts.append(f"Providencia N° {imprenta_auth}")
    if imprenta_fecha:
        parts.append(f"Fecha: {_fmt_date(imprenta_fecha)}")

    elements.append(Paragraph(" | ".join(parts), styles["ImprentaText"]))


def _build_control_providencia(elements, doc, styles):
    """Rango de control asignado (Art. 7, numeral 5) y Providencia de referencia."""
    rango_desde = _safe(doc, "control_rango_desde")
    rango_hasta = _safe(doc, "control_rango_hasta")
    fecha_asig = _safe(doc, "control_fecha_asignacion")
    providencia = _safe(doc, "providencia_referencia")

    parts = []
    if rango_desde and rango_hasta:
        parts.append(f"Rango de Control: Desde N° {rango_desde} Hasta N° {rango_hasta}")
        if fecha_asig:
            parts.append(f"Asignado: {_fmt_date(fecha_asig)}")

    if providencia:
        parts.append(f"Providencia: {providencia}")

    if parts:
        elements.append(Spacer(1, 1 * mm))
        elements.append(Paragraph(" | ".join(parts), styles["ImprentaText"]))


# ═══════════════════════════════════════════════════════════════════════════
# Funciones de conveniencia (wrappers)
# ═══════════════════════════════════════════════════════════════════════════

def generate_credit_note_pdf(doc, items, **kwargs) -> bytes:
    """Genera PDF para Nota de Crédito."""
    return generate_invoice_pdf(doc, items, doc_type="nota_credito", **kwargs)


def generate_debit_note_pdf(doc, items, **kwargs) -> bytes:
    """Genera PDF para Nota de Débito."""
    return generate_invoice_pdf(doc, items, doc_type="nota_debito", **kwargs)


def generate_dispatch_guide_pdf(doc, items, **kwargs) -> bytes:
    """Genera PDF para Guía de Despacho."""
    return generate_invoice_pdf(doc, items, doc_type="guia_despacho", **kwargs)


def generate_withholding_pdf(doc, **kwargs) -> bytes:
    """Genera PDF para Comprobante de Retención."""
    return generate_invoice_pdf(doc, items=[], doc_type="retencion", **kwargs)

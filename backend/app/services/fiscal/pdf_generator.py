"""
Generador de PDF para documentos fiscales AIDA.

Conforme a Providencia SNAT/2024/000102:
  - Art. 7: Facturas (15 requisitos)
  - Art. 8: Notas de Crédito / Débito
  - Art. 10: Guías de Despacho ("Sin derecho a Crédito Fiscal")
  - Art. 11: Comprobantes de Retención (AAAAMMSSSSSSSS)
  - Art. 30: Formato de número de control
  - Art. 31: Tamaños mínimos de fuente (6pt imprenta, 8pt emisor/control)

Diseñado para que al menos 20 items quepan en una sola página Letter.
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


# ── Constants ──────────────────────────────────────────────────────────────
PAGE_W, PAGE_H = letter  # 612pt × 792pt
MARGIN_LR = 10 * mm      # 10mm left/right
MARGIN_T = 8 * mm         # 8mm top
MARGIN_B = 8 * mm         # 8mm bottom
USABLE_W = PAGE_W - 2 * MARGIN_LR  # ~195mm


# ── QR code y barcode helpers ──────────────────────────────────────────────

def _generate_qr_image(data: str, size_mm: float = 18) -> Image | None:
    try:
        qr = qrcode.QRCode(version=1, box_size=6, border=1, error_correction=qrcode.constants.ERROR_CORRECT_M)
        qr.add_data(data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        return Image(buf, width=size_mm * mm, height=size_mm * mm)
    except Exception:
        return None


def _generate_barcode_image(data: str, width_mm: float = 65, height_mm: float = 8) -> Image | None:
    try:
        code128 = barcode.get_barcode_class("code128")
        writer = ImageWriter()
        bar = code128(data, writer=writer)
        buf = io.BytesIO()
        bar.write(buf, options={"module_width": 0.25, "module_height": 6, "font_size": 5, "text_distance": 1, "quiet_zone": 1})
        buf.seek(0)
        return Image(buf, width=width_mm * mm, height=height_mm * mm)
    except Exception:
        return None


def _build_qr_url(doc) -> str:
    control = _safe(doc, "control_number", "")
    uuid_doc = _safe(doc, "uuid_seniat", "")
    base_url = "https://validacion.aida.com.ve"
    if control:
        return f"{base_url}/verificar?nc={control}&uuid={uuid_doc}"
    return f"{base_url}/verificar?uuid={uuid_doc}"


# ── Defaults ───────────────────────────────────────────────────────────────

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


# ── Utilities ──────────────────────────────────────────────────────────────

def _fmt_money(val, moneda="VES"):
    """Venezuelan format: dots for thousands, comma for decimals."""
    if val is None:
        val = 0
    num = float(val)
    parts = f"{abs(num):,.2f}".split(".")
    integer_part = parts[0].replace(",", ".")
    formatted = f"{integer_part},{parts[1]}"
    if num < 0:
        formatted = f"-{formatted}"
    suffix = {"VES": "Bs.", "USD": "$", "EUR": "€"}.get(moneda, moneda)
    return f"{formatted} {suffix}"


def _fmt_money_short(val):
    """Money without currency suffix, for table cells."""
    if val is None:
        val = 0
    num = float(val)
    parts = f"{abs(num):,.2f}".split(".")
    integer_part = parts[0].replace(",", ".")
    formatted = f"{integer_part},{parts[1]}"
    if num < 0:
        formatted = f"-{formatted}"
    return formatted


def _fmt_date(dt):
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
    if isinstance(dt, datetime):
        return dt.strftime("%d/%m/%Y %H:%M:%S")
    return _fmt_date(dt)


def _safe(obj, attr, default=""):
    val = getattr(obj, attr, default)
    return val if val is not None else default


def _trunc(text, max_len):
    """Truncate text to max_len characters."""
    s = str(text) if text else ""
    if len(s) <= max_len:
        return s
    return s[:max_len - 1] + "…"


def _parse_layout(layout_config_str):
    layout = dict(DEFAULT_LAYOUT)
    if layout_config_str:
        try:
            custom = json.loads(layout_config_str) if isinstance(layout_config_str, str) else layout_config_str
            layout.update(custom)
        except (json.JSONDecodeError, TypeError):
            pass
    return layout


# ── Styles ─────────────────────────────────────────────────────────────────

def _build_styles(layout):
    """Compact styles optimized for single-page invoices with 20+ items."""
    styles = getSampleStyleSheet()
    factor = float(layout.get("font_size_factor", 1.0))
    font = layout.get("font_family", "Helvetica")
    text_color = colors.HexColor(layout.get("text_color", "#1a1a1a"))
    header_color = colors.HexColor(layout.get("header_color", "#4a6741"))

    # All styles use tight leading (1.2x font size)
    def _fs(base):
        return max(6, int(base * factor))

    def _ld(base):
        return max(7, int(base * factor * 1.2))

    styles.add(ParagraphStyle(
        name="DocType", fontSize=_fs(11), fontName=f"{font}-Bold",
        alignment=TA_CENTER, spaceAfter=0, spaceBefore=0, textColor=colors.white,
        leading=_ld(11),
    ))
    styles.add(ParagraphStyle(
        name="HeaderInfo", fontSize=_fs(7), fontName=f"{font}-Bold",
        alignment=TA_CENTER, spaceAfter=0, spaceBefore=0, textColor=colors.white,
        leading=_ld(7),
    ))
    styles.add(ParagraphStyle(
        name="EmisLabel", fontSize=_fs(7), fontName=f"{font}-Bold",
        leading=_ld(7), textColor=text_color, spaceBefore=0, spaceAfter=0,
    ))
    styles.add(ParagraphStyle(
        name="EmisValue", fontSize=_fs(7), fontName=font,
        leading=_ld(7), textColor=text_color, spaceBefore=0, spaceAfter=0,
    ))
    styles.add(ParagraphStyle(
        name="CellLabel", fontSize=_fs(6.5), fontName=f"{font}-Bold",
        leading=_ld(6.5), textColor=text_color, spaceBefore=0, spaceAfter=0,
    ))
    styles.add(ParagraphStyle(
        name="CellValue", fontSize=_fs(6.5), fontName=font,
        leading=_ld(6.5), textColor=text_color, spaceBefore=0, spaceAfter=0,
    ))
    styles.add(ParagraphStyle(
        name="SectionHead", fontSize=_fs(7), fontName=f"{font}-Bold",
        spaceAfter=1, spaceBefore=2, textColor=header_color,
        leading=_ld(7),
    ))
    styles.add(ParagraphStyle(
        name="SmallBold", fontSize=_fs(6.5), fontName=f"{font}-Bold",
        leading=_ld(6.5), textColor=text_color, spaceBefore=0, spaceAfter=0,
    ))
    styles.add(ParagraphStyle(
        name="SmallText", fontSize=_fs(6.5), fontName=font,
        leading=_ld(6.5), textColor=text_color, spaceBefore=0, spaceAfter=0,
    ))
    styles.add(ParagraphStyle(
        name="TinyText", fontSize=max(6, _fs(6)), fontName=font,
        leading=max(7, _ld(6)), textColor=colors.HexColor("#555555"),
        spaceBefore=0, spaceAfter=0, alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        name="LegalText", fontSize=_fs(6), fontName=font,
        leading=_ld(6), textColor=colors.HexColor("#333333"),
        spaceBefore=0, spaceAfter=0,
    ))
    return styles


# ── Main generator ─────────────────────────────────────────────────────────

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
    Genera un PDF compacto para un documento fiscal conforme SENIAT.
    Diseñado para que al menos 20 items quepan en una sola página.
    """
    layout = _parse_layout(layout_config)
    styles = _build_styles(layout)

    buffer = io.BytesIO()
    pdf = SimpleDocTemplate(
        buffer, pagesize=letter,
        leftMargin=MARGIN_LR, rightMargin=MARGIN_LR,
        topMargin=MARGIN_T, bottomMargin=MARGIN_B,
    )

    elements = []
    moneda = _safe(doc, "moneda", "VES")
    hc = colors.HexColor(layout["header_color"])
    ac = colors.HexColor(layout["accent_color"])
    bc = colors.HexColor(layout["border_color"])
    header_bg = colors.HexColor(layout["header_bg"])
    thbg = colors.HexColor(layout["table_header_bg"])
    thtxt = colors.HexColor(layout["table_header_text"])
    alt_row = colors.HexColor(layout["table_alt_row"])
    font = layout.get("font_family", "Helvetica")
    factor = float(layout.get("font_size_factor", 1.0))
    item_font_size = max(6, int(6.5 * factor))

    # ── Banner header ──
    if banner_path and banner_position == "header" and os.path.isfile(banner_path):
        try:
            elements.append(Image(banner_path, width=USABLE_W, height=18 * mm))
            elements.append(Spacer(1, 1 * mm))
        except Exception:
            pass

    # ═══════════════════════════════════════════════════════════════
    # HEADER: Logo | Emisor | Document Type + Control
    # ═══════════════════════════════════════════════════════════════
    type_labels = {
        "factura": "FACTURA",
        "nota_credito": "NOTA DE CRÉDITO",
        "nota_debito": "NOTA DE DÉBITO",
        "guia_despacho": "GUÍA DE DESPACHO",
        "retencion": "COMPROBANTE DE RETENCIÓN",
    }
    type_label = type_labels.get(doc_type, doc_type.upper())

    # Left: Logo or company name
    logo_cell = ""
    if logo_path and os.path.isfile(logo_path):
        try:
            logo_cell = Image(logo_path, width=28 * mm, height=16 * mm)
        except Exception:
            logo_cell = Paragraph(f"<b>{_trunc(_safe(doc, 'emisor_razon_social', 'AIDA'), 30)}</b>", styles["EmisLabel"])
    else:
        logo_cell = Paragraph(f"<b>{_trunc(_safe(doc, 'emisor_razon_social', 'AIDA'), 30)}</b>", styles["EmisLabel"])

    # Center: Emisor data (compact)
    emisor_parts = [f"<b>{_trunc(_safe(doc, 'emisor_razon_social'), 50)}</b>"]
    emisor_parts.append(f"RIF: {_safe(doc, 'emisor_rif')}")
    dir_e = _safe(doc, "emisor_direccion")
    if dir_e:
        emisor_parts.append(_trunc(dir_e, 80))
    tel_e = _safe(doc, "emisor_telefono")
    if tel_e:
        emisor_parts.append(f"Tel: {tel_e}")
    emisor_cell = Paragraph("<br/>".join(emisor_parts), styles["EmisValue"])

    # Right: Document type box
    control = _safe(doc, "control_number")
    doc_number = _safe(doc, "document_number")
    fecha = _fmt_datetime(_safe(doc, "fecha_emision"))

    right_data = [
        [Paragraph(f"<b>{type_label}</b>", styles["DocType"])],
        [Paragraph(f"N° {doc_number}", styles["HeaderInfo"])],
        [Paragraph(f"Control: {control}", styles["HeaderInfo"])],
        [Paragraph(f"Fecha: {fecha}", styles["HeaderInfo"])],
    ]
    right_table = Table(right_data, colWidths=["100%"])
    right_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), hc),
        ("BACKGROUND", (0, 1), (-1, -1), ac),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("PADDING", (0, 0), (-1, -1), 2),
        ("BOX", (0, 0), (-1, -1), 0.5, hc),
    ]))

    header_table = Table(
        [[logo_cell, emisor_cell, right_table]],
        colWidths=[0.18 * USABLE_W, 0.40 * USABLE_W, 0.42 * USABLE_W],
    )
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (1, 0), header_bg),
        ("PADDING", (0, 0), (-1, -1), 3),
        ("BOX", (0, 0), (-1, -1), 0.5, hc),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 2 * mm))

    # ═══════════════════════════════════════════════════════════════
    # RECEPTOR (compact 2-row)
    # ═══════════════════════════════════════════════════════════════
    rec_data = [
        [
            Paragraph("<b>RECEPTOR</b>", ParagraphStyle("rh", parent=styles["SmallBold"], textColor=colors.white)),
            "", "", "",
        ],
        [
            Paragraph(f"<b>RIF:</b> {_safe(doc, 'receptor_rif')}", styles["CellValue"]),
            Paragraph(f"<b>Razón Social:</b> {_trunc(_safe(doc, 'receptor_razon_social'), 50)}", styles["CellValue"]),
            Paragraph(f"<b>Dir:</b> {_trunc(_safe(doc, 'receptor_direccion', ''), 60)}", styles["CellValue"]),
            Paragraph(f"<b>Email:</b> {_safe(doc, 'receptor_email')}", styles["CellValue"]),
        ],
    ]
    rec_table = Table(rec_data, colWidths=[0.18 * USABLE_W, 0.32 * USABLE_W, 0.32 * USABLE_W, 0.18 * USABLE_W])
    rec_table.setStyle(TableStyle([
        ("SPAN", (0, 0), (-1, 0)),
        ("BACKGROUND", (0, 0), (-1, 0), hc),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.4, bc),
        ("PADDING", (0, 0), (-1, -1), 2),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(rec_table)

    # ═══════════════════════════════════════════════════════════════
    # OPTIONAL SECTIONS (NC/ND reference, Dispatch guide, etc.)
    # ═══════════════════════════════════════════════════════════════
    if doc_type in ("nota_credito", "nota_debito"):
        _build_referencia_compact(elements, doc, doc_type, layout, styles)

    if doc_type == "guia_despacho":
        elements.append(Spacer(1, 1 * mm))
        elements.append(Paragraph(
            '<b>"SIN DERECHO A CRÉDITO FISCAL"</b>',
            ParagraphStyle("leg", parent=styles["SmallBold"], fontSize=9,
                           alignment=TA_CENTER, textColor=colors.HexColor("#dc2626")),
        ))
        _build_transporte_compact(elements, doc, layout, styles)

    if doc_type == "retencion":
        _build_retencion_compact(elements, doc, layout, styles, moneda)

    elements.append(Spacer(1, 1.5 * mm))

    # ═══════════════════════════════════════════════════════════════
    # ITEMS TABLE (compact — 20+ items on one page)
    # ═══════════════════════════════════════════════════════════════
    if doc_type != "retencion":
        if doc_type == "guia_despacho":
            headers = ["#", "Código", "Descripción", "U.M.", "Cant.", "Peso", "Vol."]
            col_w = [16, 45, 160, 28, 38, 40, 40]
            num_start = 3  # Right-align from column 3
        else:
            headers = ["#", "Código", "Descripción", "Cant.", "P.Unit.", "Desc.", "Alíc.", "Total"]
            col_w = [14, 42, 140, 30, 55, 40, 28, 60]
            num_start = 3

        table_data = [headers]

        for item in items:
            if doc_type == "guia_despacho":
                row = [
                    str(_safe(item, "line_number", "")),
                    _trunc(_safe(item, "product_code", ""), 10),
                    _trunc(_safe(item, "description", ""), 45),
                    str(_safe(item, "unit_of_measure", "UND")),
                    f"{float(_safe(item, 'quantity', 0)):.2f}",
                    str(_safe(item, "peso", "")),
                    str(_safe(item, "volumen", "")),
                ]
            else:
                row = [
                    str(_safe(item, "line_number", "")),
                    _trunc(_safe(item, "product_code", ""), 10),
                    _trunc(_safe(item, "description", ""), 45),
                    f"{float(_safe(item, 'quantity', 0)):.2f}",
                    _fmt_money_short(_safe(item, "unit_price", 0)),
                    _fmt_money_short(_safe(item, "discount_amount", 0)),
                    f"{float(_safe(item, 'tax_rate', 0)):.0f}%",
                    _fmt_money_short(_safe(item, "total", 0)),
                ]
            table_data.append(row)

        items_table = Table(table_data, colWidths=col_w)
        items_table.setStyle(TableStyle([
            # Header row
            ("BACKGROUND", (0, 0), (-1, 0), thbg),
            ("TEXTCOLOR", (0, 0), (-1, 0), thtxt),
            ("FONTNAME", (0, 0), (-1, 0), f"{font}-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), item_font_size),
            ("ALIGN", (0, 0), (-1, 0), "CENTER"),
            # Data rows
            ("FONTNAME", (0, 1), (-1, -1), font),
            ("FONTSIZE", (0, 1), (-1, -1), item_font_size),
            ("ALIGN", (num_start, 1), (-1, -1), "RIGHT"),
            ("ALIGN", (0, 1), (0, -1), "CENTER"),  # Line number centered
            # Grid and colors
            ("GRID", (0, 0), (-1, -1), 0.3, bc),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, alt_row]),
            # Tight padding for compact rows
            ("TOPPADDING", (0, 0), (-1, -1), 1.5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 1.5),
            ("LEFTPADDING", (0, 0), (-1, -1), 2),
            ("RIGHTPADDING", (0, 0), (-1, -1), 2),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        elements.append(items_table)
        elements.append(Spacer(1, 2 * mm))

        # ═══════════════════════════════════════════════════════════
        # TOTALS (compact, right-aligned)
        # ═══════════════════════════════════════════════════════════
        _build_totals_compact(elements, doc, doc_type, layout, styles, moneda)

    # ═══════════════════════════════════════════════════════════════
    # PAYMENT INFO (one line)
    # ═══════════════════════════════════════════════════════════════
    if doc_type == "factura":
        parts = []
        fp = _safe(doc, "forma_pago")
        if fp:
            parts.append(f"<b>Pago:</b> {fp}")
        cp = _safe(doc, "condicion_pago")
        if cp:
            parts.append(f"<b>Condición:</b> {cp}")
        tc = _safe(doc, "tasa_cambio")
        if tc and moneda != "VES":
            parts.append(f"<b>Tasa:</b> 1 {moneda} = {float(tc):,.4f} VES")
        if parts:
            elements.append(Paragraph(" &nbsp;|&nbsp; ".join(parts), styles["SmallText"]))

    # ── IGTF legal ──
    monto_igtf = float(_safe(doc, "monto_igtf", 0))
    if monto_igtf > 0 and doc_type != "retencion":
        elements.append(Paragraph(
            f"<b>IGTF:</b> Impuesto a las Grandes Transacciones Financieras — "
            f"Alícuota {float(_safe(doc, 'porcentaje_igtf', 3)):.0f}% sobre pagos en divisas/criptoactivos.",
            styles["LegalText"],
        ))

    # ── Observaciones ──
    obs = _safe(doc, "observaciones")
    if obs:
        elements.append(Paragraph(f"<b>Obs:</b> {_trunc(obs, 200)}", styles["SmallText"]))

    elements.append(Spacer(1, 1.5 * mm))

    # ═══════════════════════════════════════════════════════════════
    # QR + FIRMA + BARCODE (compact single row)
    # ═══════════════════════════════════════════════════════════════
    qr_url = _build_qr_url(doc)
    qr_img = _generate_qr_image(qr_url, size_mm=16)
    firma = _safe(doc, "firma_digital")
    uuid_doc = _safe(doc, "uuid_seniat")

    firma_parts = []
    if uuid_doc:
        firma_parts.append(f"<b>UUID:</b> {uuid_doc}")
    if firma:
        firma_parts.append(f"<b>SHA-256:</b> {firma}")

    control_str = _safe(doc, "control_number", "")
    barcode_img = _generate_barcode_image(control_str, width_mm=55, height_mm=7) if control_str else None

    # Build QR | Firma | Barcode row
    elements.append(HRFlowable(width="100%", thickness=0.3, color=colors.HexColor("#cccccc")))
    qr_cell = qr_img or ""
    firma_cell = Paragraph("<br/>".join(firma_parts), styles["SmallText"]) if firma_parts else ""
    bar_cell = barcode_img or ""

    if qr_img or firma_parts or barcode_img:
        bottom_table = Table(
            [[qr_cell, firma_cell, bar_cell]],
            colWidths=[20 * mm, USABLE_W - 20 * mm - 60 * mm, 60 * mm],
        )
        bottom_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("PADDING", (0, 0), (-1, -1), 1),
        ]))
        elements.append(bottom_table)

    # ═══════════════════════════════════════════════════════════════
    # IMPRENTA FOOTER (Art. 7, numeral 14 — min 6pt)
    # ═══════════════════════════════════════════════════════════════
    imprenta_rif = _safe(doc, "imprenta_rif") or "J-50000000-0"
    imprenta_razon = _safe(doc, "imprenta_razon_social") or "AIDA Imprenta Digital, C.A."

    elements.append(HRFlowable(width="100%", thickness=0.3, color=colors.HexColor("#cccccc")))
    elements.append(Paragraph(
        f"Imprenta: {imprenta_razon} — RIF: {imprenta_rif} | "
        f"AIDA Sistema Autorizado SENIAT | {datetime.now().strftime('%d/%m/%Y %H:%M')}",
        styles["TinyText"],
    ))

    # Control range
    rango_desde = _safe(doc, "control_rango_desde")
    rango_hasta = _safe(doc, "control_rango_hasta")
    if rango_desde and rango_hasta:
        elements.append(Paragraph(
            f"Rango: {rango_desde} — {rango_hasta}",
            styles["TinyText"],
        ))

    # ── Banner footer ──
    if banner_path and banner_position == "footer" and os.path.isfile(banner_path):
        try:
            elements.append(Spacer(1, 1 * mm))
            elements.append(Image(banner_path, width=USABLE_W, height=15 * mm))
        except Exception:
            pass

    pdf.build(elements)
    return buffer.getvalue()


# ═══════════════════════════════════════════════════════════════════════════
# Compact section builders
# ═══════════════════════════════════════════════════════════════════════════

def _build_totals_compact(elements, doc, doc_type, layout, styles, moneda):
    """Compact totals section — all in a small right-aligned block."""
    hc = colors.HexColor(layout["header_color"])
    font = layout.get("font_family", "Helvetica")
    factor = float(layout.get("font_size_factor", 1.0))
    fs_label = max(6, int(7 * factor))
    fs_total = max(7, int(8 * factor))

    subtotal = float(_safe(doc, "subtotal", 0))
    descuento = float(_safe(doc, "descuento", 0))
    base_imponible = float(_safe(doc, "base_imponible", 0) or subtotal)
    base_exenta = float(_safe(doc, "base_exenta", 0))
    iva_16 = float(_safe(doc, "monto_iva_16", 0) or _safe(doc, "monto_iva", 0) or 0)
    iva_8 = float(_safe(doc, "monto_iva_8", 0))
    total = float(_safe(doc, "total", 0))
    base_igtf = float(_safe(doc, "base_imponible_igtf", 0))
    monto_igtf = float(_safe(doc, "monto_igtf", 0))
    total_con_igtf = float(_safe(doc, "total_con_igtf", 0))

    rows = []
    if descuento > 0:
        rows.append(["Subtotal:", _fmt_money(subtotal, moneda)])
        rows.append(["Descuento:", f"-{_fmt_money(descuento, moneda)}"])
    rows.append(["Base Imponible:", _fmt_money(base_imponible, moneda)])
    if base_exenta > 0:
        rows.append(["Exento:", _fmt_money(base_exenta, moneda)])
    if iva_16 > 0:
        rows.append([f"IVA {float(_safe(doc, 'alicuota_iva_16', 16)):.0f}%:", _fmt_money(iva_16, moneda)])
    if iva_8 > 0:
        rows.append([f"IVA {float(_safe(doc, 'alicuota_iva_8', 8)):.0f}%:", _fmt_money(iva_8, moneda)])
    rows.append(["TOTAL:", _fmt_money(total, moneda)])

    if monto_igtf > 0:
        rows.append([f"IGTF {float(_safe(doc, 'porcentaje_igtf', 3)):.0f}%:", _fmt_money(monto_igtf, moneda)])
        rows.append(["TOTAL + IGTF:", _fmt_money(total_con_igtf or (total + monto_igtf), moneda)])

    totals_table = Table(rows, colWidths=[85, 90])
    style_cmds = [
        ("ALIGN", (0, 0), (0, -1), "RIGHT"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("FONTNAME", (0, 0), (-1, -1), font),
        ("FONTSIZE", (0, 0), (-1, -1), fs_label),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
        ("LEFTPADDING", (0, 0), (-1, -1), 2),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2),
    ]

    for i, row in enumerate(rows):
        if row[0].startswith("TOTAL"):
            style_cmds.append(("FONTNAME", (0, i), (-1, i), f"{font}-Bold"))
            style_cmds.append(("FONTSIZE", (0, i), (-1, i), fs_total))
            style_cmds.append(("LINEABOVE", (0, i), (-1, i), 0.5, hc))
            if "IGTF" in row[0]:
                style_cmds.append(("TEXTCOLOR", (0, i), (-1, i), colors.HexColor("#dc2626")))

    totals_table.setStyle(TableStyle(style_cmds))

    # Right-align the totals block
    container = Table(
        [[Spacer(1, 1), totals_table]],
        colWidths=[USABLE_W - 175, 175],
    )
    elements.append(container)
    elements.append(Spacer(1, 1.5 * mm))


def _build_referencia_compact(elements, doc, doc_type, layout, styles):
    """Compact reference to original invoice for NC/ND."""
    hc = colors.HexColor(layout["header_color"])
    bc = colors.HexColor(layout["border_color"])
    motivo = _safe(doc, "motivo") if doc_type == "nota_credito" else _safe(doc, "concepto")

    elements.append(Spacer(1, 1 * mm))
    ref_data = [
        [
            Paragraph(f"<b>Factura N°:</b> {_safe(doc, 'factura_numero')}", styles["CellValue"]),
            Paragraph(f"<b>Control:</b> {_safe(doc, 'factura_control')}", styles["CellValue"]),
            Paragraph(f"<b>Motivo:</b> {_trunc(motivo, 60) if motivo else ''}", styles["CellValue"]),
        ],
    ]
    t = Table(ref_data, colWidths=[0.25 * USABLE_W, 0.25 * USABLE_W, 0.50 * USABLE_W])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fff8e1")),
        ("GRID", (0, 0), (-1, -1), 0.3, bc),
        ("PADDING", (0, 0), (-1, -1), 2),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(t)


def _build_transporte_compact(elements, doc, layout, styles):
    """Compact transport data for dispatch guides."""
    transportista = _safe(doc, "transportista_nombre")
    if not transportista:
        return

    bc = colors.HexColor(layout["border_color"])
    elements.append(Spacer(1, 1 * mm))
    data = [[
        Paragraph(f"<b>Transp:</b> {_trunc(transportista, 30)}", styles["CellValue"]),
        Paragraph(f"<b>RIF:</b> {_safe(doc, 'transportista_rif')}", styles["CellValue"]),
        Paragraph(f"<b>Placa:</b> {_safe(doc, 'vehiculo_placa')}", styles["CellValue"]),
        Paragraph(f"<b>Destino:</b> {_trunc(_safe(doc, 'ruta_destino', ''), 40)}", styles["CellValue"]),
    ]]
    t = Table(data, colWidths=[0.30 * USABLE_W, 0.20 * USABLE_W, 0.15 * USABLE_W, 0.35 * USABLE_W])
    t.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.3, bc),
        ("PADDING", (0, 0), (-1, -1), 2),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(t)


def _build_retencion_compact(elements, doc, layout, styles, moneda):
    """Compact withholding detail."""
    hc = colors.HexColor(layout["header_color"])
    bc = colors.HexColor(layout["border_color"])
    elements.append(Spacer(1, 1.5 * mm))

    tipo_ret = "IVA" if _safe(doc, "tipo") == "iva" else "ISLR"
    data = [
        [Paragraph(f"<b>RETENCIÓN {tipo_ret}</b>",
                   ParagraphStyle("rh2", parent=styles["SmallBold"], textColor=colors.white)),
         "", ""],
        [
            Paragraph(f"<b>Agente:</b> {_trunc(_safe(doc, 'agente_retencion_nombre'), 40)}", styles["CellValue"]),
            Paragraph(f"<b>Sujeto:</b> {_trunc(_safe(doc, 'sujeto_retenido_nombre'), 40)}", styles["CellValue"]),
            Paragraph(f"<b>Período:</b> {_safe(doc, 'periodo_fiscal')}", styles["CellValue"]),
        ],
        [
            Paragraph(f"<b>Base:</b> {_fmt_money(_safe(doc, 'base_imponible', 0), moneda)}", styles["CellValue"]),
            Paragraph(f"<b>%Ret:</b> {float(_safe(doc, 'porcentaje_retencion', 0)):.2f}%", styles["CellValue"]),
            Paragraph(f"<b>Retenido:</b> {_fmt_money(_safe(doc, 'monto_retenido', 0), moneda)}", styles["CellValue"]),
        ],
    ]
    t = Table(data, colWidths=[0.40 * USABLE_W, 0.35 * USABLE_W, 0.25 * USABLE_W])
    t.setStyle(TableStyle([
        ("SPAN", (0, 0), (-1, 0)),
        ("BACKGROUND", (0, 0), (-1, 0), hc),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.3, bc),
        ("PADDING", (0, 0), (-1, -1), 2),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 2 * mm))


# ═══════════════════════════════════════════════════════════════════════════
# Convenience wrappers
# ═══════════════════════════════════════════════════════════════════════════

def generate_credit_note_pdf(doc, items, **kwargs) -> bytes:
    return generate_invoice_pdf(doc, items, doc_type="nota_credito", **kwargs)


def generate_debit_note_pdf(doc, items, **kwargs) -> bytes:
    return generate_invoice_pdf(doc, items, doc_type="nota_debito", **kwargs)


def generate_dispatch_guide_pdf(doc, items, **kwargs) -> bytes:
    return generate_invoice_pdf(doc, items, doc_type="guia_despacho", **kwargs)


def generate_withholding_pdf(
    doc,
    layout_config=None,
    logo_path: str | None = None,
    banner_path: str | None = None,
    banner_position: str = "footer",
) -> bytes:
    """
    Genera un PDF completo para Comprobante de Retención IVA/ISLR.

    Conforme a Art. 11, Providencia SNAT/2024/000102:
    - Agente de retención (el comprador/SPE que retuvo)
    - Sujeto retenido (el vendedor/usuario a quien le retuvieron)
    - Detalle de retención por factura
    - Totales

    El Withholding model no tiene emisor_rif/receptor_rif como las facturas,
    sino agente_retencion_* y sujeto_retenido_*.
    """
    layout = _parse_layout(layout_config)
    styles = _build_styles(layout)

    buffer = io.BytesIO()
    pdf = SimpleDocTemplate(
        buffer, pagesize=letter,
        leftMargin=MARGIN_LR, rightMargin=MARGIN_LR,
        topMargin=MARGIN_T, bottomMargin=MARGIN_B,
    )

    elements = []
    hc = colors.HexColor(layout["header_color"])
    ac = colors.HexColor(layout["accent_color"])
    bc = colors.HexColor(layout["border_color"])
    header_bg = colors.HexColor(layout["header_bg"])
    thbg = colors.HexColor(layout["table_header_bg"])
    thtxt = colors.HexColor(layout["table_header_text"])
    alt_row = colors.HexColor(layout["table_alt_row"])
    font = layout.get("font_family", "Helvetica")
    factor = float(layout.get("font_size_factor", 1.0))

    tipo_ret = "IVA" if _safe(doc, "tipo") == "iva" else "ISLR"

    # ── Banner header ──
    if banner_path and banner_position == "header" and os.path.isfile(banner_path):
        try:
            elements.append(Image(banner_path, width=USABLE_W, height=18 * mm))
            elements.append(Spacer(1, 1 * mm))
        except Exception:
            pass

    # ═══════════════════════════════════════════════════════════════
    # HEADER: Logo | Agente de Retención | Tipo documento
    # ═══════════════════════════════════════════════════════════════
    logo_cell = ""
    if logo_path and os.path.isfile(logo_path):
        try:
            logo_cell = Image(logo_path, width=28 * mm, height=16 * mm)
        except Exception:
            logo_cell = Paragraph(f"<b>{_trunc(_safe(doc, 'sujeto_retenido_nombre', 'AIDA'), 30)}</b>", styles["EmisLabel"])
    else:
        logo_cell = Paragraph(f"<b>{_trunc(_safe(doc, 'sujeto_retenido_nombre', 'AIDA'), 30)}</b>", styles["EmisLabel"])

    # Center: Sujeto retenido (el usuario — dueño del comprobante)
    emisor_parts = [f"<b>{_trunc(_safe(doc, 'sujeto_retenido_nombre'), 50)}</b>"]
    emisor_parts.append(f"RIF: {_safe(doc, 'sujeto_retenido_rif')}")
    dir_sr = _safe(doc, "sujeto_retenido_direccion")
    if dir_sr:
        emisor_parts.append(_trunc(dir_sr, 80))
    emisor_cell = Paragraph("<br/>".join(emisor_parts), styles["EmisValue"])

    # Right: Document type box
    doc_number = _safe(doc, "document_number")
    fecha = _fmt_datetime(_safe(doc, "fecha_emision"))
    periodo = _safe(doc, "periodo_fiscal")

    right_data = [
        [Paragraph(f"<b>COMPROBANTE DE<br/>RETENCIÓN {tipo_ret}</b>", styles["DocType"])],
        [Paragraph(f"N° {doc_number}", styles["HeaderInfo"])],
        [Paragraph(f"Período: {periodo}", styles["HeaderInfo"])],
        [Paragraph(f"Fecha: {fecha}", styles["HeaderInfo"])],
    ]
    right_table = Table(right_data, colWidths=["100%"])
    right_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), hc),
        ("BACKGROUND", (0, 1), (-1, -1), ac),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("PADDING", (0, 0), (-1, -1), 2),
        ("BOX", (0, 0), (-1, -1), 0.5, hc),
    ]))

    header_table = Table(
        [[logo_cell, emisor_cell, right_table]],
        colWidths=[0.18 * USABLE_W, 0.40 * USABLE_W, 0.42 * USABLE_W],
    )
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (1, 0), header_bg),
        ("PADDING", (0, 0), (-1, -1), 3),
        ("BOX", (0, 0), (-1, -1), 0.5, hc),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 2.5 * mm))

    # ═══════════════════════════════════════════════════════════════
    # AGENTE DE RETENCIÓN (quien retuvo — el comprador/SPE)
    # ═══════════════════════════════════════════════════════════════
    agente_data = [
        [
            Paragraph("<b>AGENTE DE RETENCIÓN</b>",
                       ParagraphStyle("ah", parent=styles["SmallBold"], textColor=colors.white)),
            "", "",
        ],
        [
            Paragraph(f"<b>RIF:</b> {_safe(doc, 'agente_retencion_rif')}", styles["CellValue"]),
            Paragraph(f"<b>Nombre/Razón Social:</b> {_trunc(_safe(doc, 'agente_retencion_nombre'), 50)}", styles["CellValue"]),
            Paragraph(f"<b>Dir:</b> {_trunc(_safe(doc, 'agente_retencion_direccion', ''), 60)}", styles["CellValue"]),
        ],
    ]
    agente_table = Table(agente_data, colWidths=[0.22 * USABLE_W, 0.45 * USABLE_W, 0.33 * USABLE_W])
    agente_table.setStyle(TableStyle([
        ("SPAN", (0, 0), (-1, 0)),
        ("BACKGROUND", (0, 0), (-1, 0), hc),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.4, bc),
        ("PADDING", (0, 0), (-1, -1), 2.5),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(agente_table)
    elements.append(Spacer(1, 2 * mm))

    # ═══════════════════════════════════════════════════════════════
    # SUJETO RETENIDO (a quien le retuvieron — el vendedor/usuario)
    # ═══════════════════════════════════════════════════════════════
    sujeto_data = [
        [
            Paragraph("<b>SUJETO RETENIDO</b>",
                       ParagraphStyle("sh", parent=styles["SmallBold"], textColor=colors.white)),
            "", "",
        ],
        [
            Paragraph(f"<b>RIF:</b> {_safe(doc, 'sujeto_retenido_rif')}", styles["CellValue"]),
            Paragraph(f"<b>Nombre/Razón Social:</b> {_trunc(_safe(doc, 'sujeto_retenido_nombre'), 50)}", styles["CellValue"]),
            Paragraph(f"<b>Email:</b> {_safe(doc, 'sujeto_retenido_email', '')}", styles["CellValue"]),
        ],
    ]
    sujeto_table = Table(sujeto_data, colWidths=[0.22 * USABLE_W, 0.45 * USABLE_W, 0.33 * USABLE_W])
    sujeto_table.setStyle(TableStyle([
        ("SPAN", (0, 0), (-1, 0)),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#5a7052")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.4, bc),
        ("PADDING", (0, 0), (-1, -1), 2.5),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(sujeto_table)
    elements.append(Spacer(1, 3 * mm))

    # ═══════════════════════════════════════════════════════════════
    # DETALLE DE RETENCIÓN (tabla con los datos de la factura)
    # ═══════════════════════════════════════════════════════════════
    item_font_size = max(6, int(6.5 * factor))

    # Cell style for wrappable text inside table
    cell_style = ParagraphStyle("cell", parent=styles["SmallText"], fontSize=item_font_size,
                                leading=item_font_size + 2, spaceBefore=0, spaceAfter=0)

    if tipo_ret == "IVA":
        headers = ["Oper.", "N° Factura", "Fecha Fact.", "Monto Fact.", "Base Imp.", "IVA Causado", "% Ret.", "IVA Retenido"]
        col_w = [28, 60, 52, 62, 62, 58, 32, 62]
    else:
        # ISLR: Concepto necesita más espacio — quitar Base Imp. (redundante con Monto Fact.)
        headers = ["Oper.", "N° Factura", "Fecha Fact.", "Monto Fact.", "Concepto", "% Ret.", "ISLR Retenido"]
        col_w = [28, 58, 50, 58, 120, 32, 70]

    table_data = [headers]

    # Single row — each withholding is one factura
    factura_num = _safe(doc, "factura_numero") or _safe(doc, "document_number", "")
    factura_fecha = _fmt_date(_safe(doc, "factura_fecha")) or _fmt_date(_safe(doc, "fecha_emision"))
    monto_factura = _fmt_money_short(_safe(doc, "monto_factura", 0))
    base_imp = _fmt_money_short(_safe(doc, "base_imponible", 0))
    pct_ret = f"{float(_safe(doc, 'porcentaje_retencion', 0)):.2f}%"
    monto_ret = _fmt_money_short(_safe(doc, "monto_retenido", 0))

    if tipo_ret == "IVA":
        impuesto_causado = _fmt_money_short(_safe(doc, "impuesto_causado", 0))
        row = ["1", factura_num, factura_fecha, monto_factura, base_imp, impuesto_causado, pct_ret, monto_ret]
    else:
        concepto_text = _safe(doc, "concepto", "")
        concepto_p = Paragraph(_trunc(concepto_text, 60), cell_style)
        row = ["1", factura_num, factura_fecha, monto_factura, concepto_p, pct_ret, monto_ret]

    table_data.append(row)

    detail_table = Table(table_data, colWidths=col_w)
    detail_table.setStyle(TableStyle([
        # Header
        ("BACKGROUND", (0, 0), (-1, 0), thbg),
        ("TEXTCOLOR", (0, 0), (-1, 0), thtxt),
        ("FONTNAME", (0, 0), (-1, 0), f"{font}-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), item_font_size),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        # Data
        ("FONTNAME", (0, 1), (-1, -1), font),
        ("FONTSIZE", (0, 1), (-1, -1), item_font_size),
        ("ALIGN", (0, 1), (0, -1), "CENTER"),
        ("ALIGN", (2, 1), (2, -1), "CENTER"),
        ("ALIGN", (3, 1), (-1, -1), "RIGHT"),
        # Grid
        ("GRID", (0, 0), (-1, -1), 0.3, bc),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, alt_row]),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("LEFTPADDING", (0, 0), (-1, -1), 2),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(detail_table)
    elements.append(Spacer(1, 3 * mm))

    # ═══════════════════════════════════════════════════════════════
    # TOTALES
    # ═══════════════════════════════════════════════════════════════
    fs_label = max(6, int(7 * factor))
    fs_total = max(7, int(8.5 * factor))

    total_rows = [
        ["Base Imponible:", _fmt_money(_safe(doc, "base_imponible", 0))],
    ]
    if tipo_ret == "IVA":
        total_rows.append(["IVA Causado:", _fmt_money(_safe(doc, "impuesto_causado", 0))])
    total_rows.append([f"% Retención:", f"{float(_safe(doc, 'porcentaje_retencion', 0)):.2f}%"])
    total_rows.append([f"TOTAL RETENIDO:", _fmt_money(_safe(doc, "monto_retenido", 0))])

    totals_table = Table(total_rows, colWidths=[95, 100])
    style_cmds = [
        ("ALIGN", (0, 0), (0, -1), "RIGHT"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("FONTNAME", (0, 0), (-1, -1), font),
        ("FONTSIZE", (0, 0), (-1, -1), fs_label),
        ("TOPPADDING", (0, 0), (-1, -1), 1.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1.5),
        ("LEFTPADDING", (0, 0), (-1, -1), 2),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2),
    ]
    # Bold total row
    last_idx = len(total_rows) - 1
    style_cmds.append(("FONTNAME", (0, last_idx), (-1, last_idx), f"{font}-Bold"))
    style_cmds.append(("FONTSIZE", (0, last_idx), (-1, last_idx), fs_total))
    style_cmds.append(("LINEABOVE", (0, last_idx), (-1, last_idx), 0.5, hc))

    totals_table.setStyle(TableStyle(style_cmds))

    container = Table(
        [[Spacer(1, 1), totals_table]],
        colWidths=[USABLE_W - 195, 195],
    )
    elements.append(container)
    elements.append(Spacer(1, 3 * mm))

    # ═══════════════════════════════════════════════════════════════
    # LEGAL NOTE
    # ═══════════════════════════════════════════════════════════════
    elements.append(HRFlowable(width="100%", thickness=0.3, color=colors.HexColor("#cccccc")))
    elements.append(Spacer(1, 1 * mm))
    elements.append(Paragraph(
        f"Este comprobante de retención de {tipo_ret} ha sido registrado conforme al Art. 11 de la "
        f"Providencia Administrativa SNAT/2024/000102. Período fiscal: {periodo}.",
        styles["LegalText"],
    ))
    elements.append(Spacer(1, 1 * mm))

    # ═══════════════════════════════════════════════════════════════
    # FOOTER
    # ═══════════════════════════════════════════════════════════════
    elements.append(HRFlowable(width="100%", thickness=0.3, color=colors.HexColor("#cccccc")))
    elements.append(Paragraph(
        f"Generado por AIDA Sistema de Facturación Digital | {datetime.now().strftime('%d/%m/%Y %H:%M')}",
        styles["TinyText"],
    ))

    # ── Banner footer ──
    if banner_path and banner_position == "footer" and os.path.isfile(banner_path):
        try:
            elements.append(Spacer(1, 1 * mm))
            elements.append(Image(banner_path, width=USABLE_W, height=15 * mm))
        except Exception:
            pass

    pdf.build(elements)
    return buffer.getvalue()

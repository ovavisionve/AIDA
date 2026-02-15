"""
Generador de PDF para documentos fiscales AIDA.

Usa reportlab para generar PDFs profesionales conformes con SENIAT:
facturas, notas de crédito, notas de débito, guías de despacho.
"""
import io
import base64
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import mm, cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer, HRFlowable, Image,
)
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT


def _fmt_money(val, moneda="VES"):
    """Formatear montos."""
    if val is None:
        return f"{moneda} 0.00"
    return f"{moneda} {float(val):,.2f}"


def _fmt_date(dt):
    """Formatear fecha."""
    if isinstance(dt, str):
        return dt[:10]
    if isinstance(dt, datetime):
        return dt.strftime("%d/%m/%Y")
    return str(dt) if dt else ""


def generate_invoice_pdf(doc, items, doc_type: str = "factura") -> bytes:
    """
    Genera un PDF completo para un documento fiscal.

    Args:
        doc: objeto documento (Invoice, CreditNote, DebitNote)
        items: lista de DocumentItem
        doc_type: 'factura', 'nota_credito', 'nota_debito', 'guia_despacho'

    Returns:
        bytes del PDF generado
    """
    buffer = io.BytesIO()
    pdf = SimpleDocTemplate(
        buffer, pagesize=letter,
        leftMargin=15 * mm, rightMargin=15 * mm,
        topMargin=15 * mm, bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="DocTitle", fontSize=14, fontName="Helvetica-Bold",
                               alignment=TA_CENTER, spaceAfter=4))
    styles.add(ParagraphStyle(name="DocSubtitle", fontSize=9, fontName="Helvetica",
                               alignment=TA_CENTER, textColor=colors.grey, spaceAfter=8))
    styles.add(ParagraphStyle(name="SectionHead", fontSize=10, fontName="Helvetica-Bold",
                               spaceAfter=4, spaceBefore=8))
    styles.add(ParagraphStyle(name="SmallText", fontSize=8, fontName="Helvetica", leading=10))
    styles.add(ParagraphStyle(name="SmallBold", fontSize=8, fontName="Helvetica-Bold", leading=10))
    styles.add(ParagraphStyle(name="FooterText", fontSize=7, fontName="Helvetica",
                               textColor=colors.grey, alignment=TA_CENTER))

    elements = []

    # --- Type labels ---
    type_labels = {
        "factura": "FACTURA",
        "nota_credito": "NOTA DE CREDITO",
        "nota_debito": "NOTA DE DEBITO",
        "guia_despacho": "GUIA DE DESPACHO",
    }
    type_label = type_labels.get(doc_type, doc_type.upper())

    # --- Header ---
    elements.append(Paragraph(f"AIDA IMPRENTA DIGITAL", styles["DocTitle"]))
    elements.append(Paragraph(f"Sistema de Facturacion Electronica - SENIAT", styles["DocSubtitle"]))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e94560")))
    elements.append(Spacer(1, 4 * mm))

    # --- Document type and control number ---
    doc_info = [
        [Paragraph(f"<b>{type_label}</b>", styles["SectionHead"]),
         Paragraph(f"<b>N. Control:</b> {getattr(doc, 'control_number', '') or ''}", styles["SmallBold"]),
         Paragraph(f"<b>Fecha:</b> {_fmt_date(doc.fecha_emision)}", styles["SmallBold"])],
    ]
    doc_number = getattr(doc, "document_number", "") or ""
    uuid_seniat = getattr(doc, "uuid_seniat", "") or ""
    doc_info.append([
        Paragraph(f"N. Documento: {doc_number}", styles["SmallText"]),
        Paragraph(f"UUID: {uuid_seniat[:20]}..." if len(uuid_seniat) > 20 else f"UUID: {uuid_seniat}", styles["SmallText"]),
        Paragraph(f"Estado: {doc.status}", styles["SmallText"]),
    ])

    t = Table(doc_info, colWidths=["35%", "35%", "30%"])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 4 * mm))

    # --- Emisor / Receptor ---
    emisor_rif = getattr(doc, "emisor_rif", "")
    emisor_razon = getattr(doc, "emisor_razon_social", "")
    emisor_dir = getattr(doc, "emisor_direccion", "")
    receptor_rif = getattr(doc, "receptor_rif", "")
    receptor_razon = getattr(doc, "receptor_razon_social", "")
    receptor_dir = getattr(doc, "receptor_direccion", "")
    receptor_tel = getattr(doc, "receptor_telefono", "") or ""
    receptor_email = getattr(doc, "receptor_email", "") or ""

    parties = [
        [Paragraph("<b>EMISOR</b>", styles["SmallBold"]),
         Paragraph("<b>RECEPTOR</b>", styles["SmallBold"])],
        [Paragraph(f"RIF: {emisor_rif}", styles["SmallText"]),
         Paragraph(f"RIF: {receptor_rif}", styles["SmallText"])],
        [Paragraph(f"{emisor_razon}", styles["SmallText"]),
         Paragraph(f"{receptor_razon}", styles["SmallText"])],
        [Paragraph(f"{emisor_dir[:80]}" if emisor_dir else "", styles["SmallText"]),
         Paragraph(f"{receptor_dir[:80]}" if receptor_dir else "", styles["SmallText"])],
    ]
    if receptor_tel or receptor_email:
        parties.append([
            Paragraph("", styles["SmallText"]),
            Paragraph(f"Tel: {receptor_tel} | Email: {receptor_email}", styles["SmallText"]),
        ])

    pt = Table(parties, colWidths=["50%", "50%"])
    pt.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f0f0f0")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dddddd")),
        ("PADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(pt)
    elements.append(Spacer(1, 4 * mm))

    # --- Reference (for credit/debit notes) ---
    if doc_type in ("nota_credito", "nota_debito"):
        motivo = getattr(doc, "motivo", None) or getattr(doc, "concepto", "")
        elements.append(Paragraph(f"<b>Documento referencia:</b> Factura original vinculada", styles["SmallText"]))
        elements.append(Paragraph(f"<b>Motivo:</b> {motivo}", styles["SmallText"]))
        elements.append(Spacer(1, 3 * mm))

    # --- Items table ---
    elements.append(Paragraph("DETALLE DE ITEMS", styles["SectionHead"]))

    moneda = getattr(doc, "moneda", "VES")
    header = ["#", "Codigo", "Descripcion", "Cant.", "P.Unit.", "Desc.", "IVA", "Total"]
    table_data = [header]

    for item in items:
        row = [
            str(getattr(item, "line_number", "")),
            str(getattr(item, "product_code", "") or "")[:12],
            str(getattr(item, "description", ""))[:40],
            f"{float(getattr(item, 'quantity', 0)):.2f}",
            _fmt_money(getattr(item, "unit_price", 0), ""),
            _fmt_money(getattr(item, "discount_amount", 0), ""),
            f"{float(getattr(item, 'tax_rate', 0)):.0f}%",
            _fmt_money(getattr(item, "total", 0), ""),
        ]
        table_data.append(row)

    col_widths = [20, 55, 140, 35, 55, 40, 30, 60]
    items_table = Table(table_data, colWidths=col_widths)
    items_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a1a2e")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 7),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ("ALIGN", (3, 1), (-1, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dddddd")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8f8f8")]),
        ("PADDING", (0, 0), (-1, -1), 3),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 4 * mm))

    # --- Totals ---
    subtotal = float(getattr(doc, "subtotal", 0) or 0)
    descuento = float(getattr(doc, "descuento", 0) or 0)
    base_imponible = float(getattr(doc, "base_imponible", 0) or getattr(doc, "subtotal", 0) or 0)
    base_exenta = float(getattr(doc, "base_exenta", 0) or 0)
    iva_16 = float(getattr(doc, "monto_iva_16", 0) or getattr(doc, "monto_iva", 0) or 0)
    iva_8 = float(getattr(doc, "monto_iva_8", 0) or 0)
    total = float(getattr(doc, "total", 0) or 0)

    totals_data = []
    totals_data.append(["Subtotal:", _fmt_money(subtotal, moneda)])
    if descuento > 0:
        totals_data.append(["Descuento:", f"-{_fmt_money(descuento, moneda)}"])
    totals_data.append(["Base Imponible:", _fmt_money(base_imponible, moneda)])
    if base_exenta > 0:
        totals_data.append(["Base Exenta:", _fmt_money(base_exenta, moneda)])
    if iva_16 > 0:
        totals_data.append(["IVA 16%:", _fmt_money(iva_16, moneda)])
    if iva_8 > 0:
        totals_data.append(["IVA 8%:", _fmt_money(iva_8, moneda)])
    totals_data.append(["TOTAL:", _fmt_money(total, moneda)])

    totals_table = Table(totals_data, colWidths=[120, 100])
    totals_table.setStyle(TableStyle([
        ("ALIGN", (0, 0), (0, -1), "RIGHT"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("FONTNAME", (0, 0), (-1, -2), "Helvetica"),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("LINEABOVE", (0, -1), (-1, -1), 1, colors.HexColor("#1a1a2e")),
        ("PADDING", (0, 0), (-1, -1), 3),
    ]))

    # Right-align totals
    totals_container = Table([[Spacer(1, 1), totals_table]], colWidths=["55%", "45%"])
    elements.append(totals_container)
    elements.append(Spacer(1, 6 * mm))

    # --- Payment info ---
    forma_pago = getattr(doc, "forma_pago", "")
    condicion_pago = getattr(doc, "condicion_pago", "")
    if forma_pago or condicion_pago:
        elements.append(Paragraph(f"<b>Forma de pago:</b> {forma_pago} | <b>Condicion:</b> {condicion_pago}", styles["SmallText"]))
        elements.append(Spacer(1, 2 * mm))

    # Tasa de cambio
    tasa = getattr(doc, "tasa_cambio", None)
    if tasa and moneda != "VES":
        elements.append(Paragraph(f"<b>Tasa de cambio:</b> 1 {moneda} = {float(tasa):,.4f} VES", styles["SmallText"]))
        elements.append(Spacer(1, 2 * mm))

    # Observaciones
    obs = getattr(doc, "observaciones", "")
    if obs:
        elements.append(Paragraph(f"<b>Observaciones:</b> {obs}", styles["SmallText"]))
        elements.append(Spacer(1, 2 * mm))

    # --- Digital signature & QR ---
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
    elements.append(Spacer(1, 3 * mm))

    firma = getattr(doc, "firma_digital", "")
    if firma:
        elements.append(Paragraph(f"<b>Firma digital:</b> {firma[:40]}...", styles["SmallText"]))

    elements.append(Spacer(1, 2 * mm))

    # --- Footer ---
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
    elements.append(Spacer(1, 2 * mm))
    elements.append(Paragraph(
        "Documento generado por AIDA Imprenta Digital - Sistema autorizado por SENIAT | "
        "Verifique este documento en: https://validacion.aida.com.ve",
        styles["FooterText"],
    ))
    elements.append(Paragraph(
        f"Generado: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}",
        styles["FooterText"],
    ))

    pdf.build(elements)
    return buffer.getvalue()

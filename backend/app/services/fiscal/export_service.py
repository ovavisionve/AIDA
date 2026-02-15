"""
Servicio de exportación de documentos fiscales AIDA.

Soporta exportación a:
- CSV: formato universal
- Excel (XLSX): con formato y estilos
- TXT SENIAT: formato oficial para declaraciones IVA
"""
import io
import csv
from datetime import datetime
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side


def export_documents_csv(documents: list[dict]) -> bytes:
    """Exporta documentos a CSV."""
    output = io.StringIO()
    writer = csv.writer(output)

    headers = [
        "Tipo", "N.Control", "N.Documento", "Fecha", "RIF Emisor",
        "Emisor", "RIF Receptor", "Receptor", "Subtotal", "IVA",
        "Total", "Moneda", "Estado", "Forma Pago",
    ]
    writer.writerow(headers)

    for doc in documents:
        writer.writerow([
            doc.get("tipo", ""),
            doc.get("numero_control", ""),
            doc.get("numero_documento", ""),
            doc.get("fecha_emision", ""),
            doc.get("emisor_rif", ""),
            doc.get("emisor_razon_social", ""),
            doc.get("receptor_rif", ""),
            doc.get("receptor_razon_social", ""),
            f'{doc.get("subtotal", 0):.2f}',
            f'{doc.get("iva", 0):.2f}',
            f'{doc.get("total", 0):.2f}',
            doc.get("moneda", "VES"),
            doc.get("status", ""),
            doc.get("forma_pago", ""),
        ])

    return output.getvalue().encode("utf-8-sig")


def export_documents_excel(documents: list[dict], title: str = "Documentos Fiscales") -> bytes:
    """Exporta documentos a Excel con formato."""
    wb = Workbook()
    ws = wb.active
    ws.title = title[:31]

    # Styles
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="1A1A2E", end_color="1A1A2E", fill_type="solid")
    header_alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    thin_border = Border(
        left=Side(style="thin"), right=Side(style="thin"),
        top=Side(style="thin"), bottom=Side(style="thin"),
    )
    money_format = '#,##0.00'

    # Title row
    ws.merge_cells("A1:N1")
    ws["A1"] = f"AIDA Imprenta Digital - {title}"
    ws["A1"].font = Font(name="Calibri", size=14, bold=True, color="E94560")
    ws["A1"].alignment = Alignment(horizontal="center")

    ws.merge_cells("A2:N2")
    ws["A2"] = f"Generado: {datetime.now().strftime('%d/%m/%Y %H:%M')}"
    ws["A2"].font = Font(name="Calibri", size=9, color="888888")
    ws["A2"].alignment = Alignment(horizontal="center")

    # Headers
    headers = [
        "Tipo", "N.Control", "N.Documento", "Fecha", "RIF Emisor",
        "Emisor", "RIF Receptor", "Receptor", "Subtotal", "IVA",
        "Total", "Moneda", "Estado", "Forma Pago",
    ]
    col_widths = [14, 16, 18, 12, 14, 25, 14, 25, 14, 14, 14, 8, 10, 14]

    for col_idx, (header, width) in enumerate(zip(headers, col_widths), 1):
        cell = ws.cell(row=4, column=col_idx, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_alignment
        cell.border = thin_border
        ws.column_dimensions[chr(64 + col_idx) if col_idx <= 26 else "A"].width = width

    # Set column widths properly
    for i, w in enumerate(col_widths):
        col_letter = chr(65 + i) if i < 26 else f"A{chr(65 + i - 26)}"
        ws.column_dimensions[col_letter].width = w

    # Data rows
    status_colors = {
        "emitido": "E8F5E9",
        "anulado": "FFEBEE",
        "pagado": "E3F2FD",
    }

    for row_idx, doc in enumerate(documents, 5):
        values = [
            doc.get("tipo", ""),
            doc.get("numero_control", ""),
            doc.get("numero_documento", ""),
            doc.get("fecha_emision", ""),
            doc.get("emisor_rif", ""),
            doc.get("emisor_razon_social", ""),
            doc.get("receptor_rif", ""),
            doc.get("receptor_razon_social", ""),
            float(doc.get("subtotal", 0)),
            float(doc.get("iva", 0)),
            float(doc.get("total", 0)),
            doc.get("moneda", "VES"),
            doc.get("status", ""),
            doc.get("forma_pago", ""),
        ]
        for col_idx, val in enumerate(values, 1):
            cell = ws.cell(row=row_idx, column=col_idx, value=val)
            cell.border = thin_border
            cell.font = Font(name="Calibri", size=10)
            if col_idx in (9, 10, 11):
                cell.number_format = money_format
                cell.alignment = Alignment(horizontal="right")

        # Color by status
        status = doc.get("status", "")
        if status in status_colors:
            fill = PatternFill(start_color=status_colors[status], end_color=status_colors[status], fill_type="solid")
            ws.cell(row=row_idx, column=13).fill = fill

    # Summary row
    if documents:
        last_row = len(documents) + 5
        ws.cell(row=last_row, column=8, value="TOTALES:").font = Font(bold=True)
        for col_idx, col_name in [(9, "subtotal"), (10, "iva"), (11, "total")]:
            total_val = sum(float(d.get(col_name, 0)) for d in documents)
            cell = ws.cell(row=last_row, column=col_idx, value=total_val)
            cell.font = Font(bold=True)
            cell.number_format = money_format
            cell.border = Border(top=Side(style="double"))

    output = io.BytesIO()
    wb.save(output)
    return output.getvalue()


def export_documents_seniat_txt(documents: list[dict], periodo: str, rif_agente: str) -> bytes:
    """
    Exporta documentos al formato TXT requerido por SENIAT para declaraciones IVA.

    Formato: RifAgente|Periodo|FechaDoc|TipoDoc|RifReceptor|NumDoc|NumControl|MontoTotal|BaseImponible|IVA

    Args:
        documents: lista de documentos
        periodo: periodo fiscal YYYY-MM
        rif_agente: RIF del agente de retencion/contribuyente

    Returns:
        bytes del archivo TXT
    """
    lines = []

    type_codes = {
        "factura": "01",
        "nota_credito": "02",
        "nota_debito": "03",
    }

    for doc in documents:
        tipo = doc.get("tipo", "factura")
        tipo_code = type_codes.get(tipo, "01")
        fecha = doc.get("fecha_emision", "")
        if isinstance(fecha, datetime):
            fecha = fecha.strftime("%d/%m/%Y")
        elif isinstance(fecha, str) and "-" in fecha:
            # Convert YYYY-MM-DD to DD/MM/YYYY
            parts = fecha[:10].split("-")
            if len(parts) == 3:
                fecha = f"{parts[2]}/{parts[1]}/{parts[0]}"

        line = "|".join([
            rif_agente,
            periodo,
            fecha,
            tipo_code,
            doc.get("receptor_rif", ""),
            doc.get("numero_documento", ""),
            doc.get("numero_control", ""),
            f'{float(doc.get("total", 0)):.2f}',
            f'{float(doc.get("subtotal", 0) or doc.get("base_imponible", 0)):.2f}',
            f'{float(doc.get("iva", 0)):.2f}',
        ])
        lines.append(line)

    return "\n".join(lines).encode("utf-8")

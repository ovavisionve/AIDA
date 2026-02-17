"""
Generador de XML para documentos fiscales AIDA.

Genera XML compatible con estándar UBL 2.1 adaptado a SENIAT Venezuela.
"""
import uuid
from datetime import datetime, timezone
from xml.etree.ElementTree import Element, SubElement, tostring
from xml.dom.minidom import parseString


def _add_text(parent: Element, tag: str, text: str | None):
    """Helper para agregar elemento con texto."""
    el = SubElement(parent, tag)
    el.text = str(text) if text is not None else ""
    return el


def generate_document_xml(doc, items, doc_type: str = "factura") -> bytes:
    """
    Genera XML UBL 2.1 para un documento fiscal.

    Args:
        doc: objeto documento (Invoice, CreditNote, DebitNote)
        items: lista de DocumentItem
        doc_type: tipo de documento

    Returns:
        bytes del XML generado
    """
    type_map = {
        "factura": "Invoice",
        "nota_credito": "CreditNote",
        "nota_debito": "DebitNote",
        "guia_despacho": "DespatchAdvice",
    }

    root_tag = type_map.get(doc_type, "Invoice")
    root = Element(root_tag)
    root.set("xmlns", "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2")
    root.set("xmlns:cac", "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2")
    root.set("xmlns:cbc", "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2")
    root.set("xmlns:aida", "urn:aida:seniat:ve:fiscal:1.0")

    # UBL Version
    _add_text(root, "cbc:UBLVersionID", "2.1")
    _add_text(root, "cbc:CustomizationID", "AIDA-SENIAT-VE-1.0")

    # Document identification
    _add_text(root, "cbc:ID", getattr(doc, "document_number", ""))
    _add_text(root, "cbc:UUID", getattr(doc, "uuid_seniat", ""))
    _add_text(root, "cbc:IssueDate", _fmt_date(doc.fecha_emision))
    _add_text(root, "cbc:IssueTime", _fmt_time(doc.fecha_emision))
    _add_text(root, "cbc:InvoiceTypeCode", _type_code(doc_type))
    _add_text(root, "cbc:DocumentCurrencyCode", getattr(doc, "moneda", "VES"))

    # SENIAT control number
    seniat = SubElement(root, "aida:SENIATExtension")
    _add_text(seniat, "aida:NumeroControl", getattr(doc, "control_number", ""))
    _add_text(seniat, "aida:FirmaDigital", getattr(doc, "firma_digital", ""))
    _add_text(seniat, "aida:QRCode", getattr(doc, "qr_code", "")[:100] if getattr(doc, "qr_code", None) else "")

    # Exchange rate
    tasa = getattr(doc, "tasa_cambio", None)
    if tasa:
        _add_text(seniat, "aida:TasaCambio", str(float(tasa)))

    # Supplier (Emisor)
    supplier = SubElement(root, "cac:AccountingSupplierParty")
    supplier_party = SubElement(supplier, "cac:Party")

    supplier_id = SubElement(supplier_party, "cac:PartyIdentification")
    _add_text(supplier_id, "cbc:ID", getattr(doc, "emisor_rif", ""))

    supplier_name = SubElement(supplier_party, "cac:PartyName")
    _add_text(supplier_name, "cbc:Name", getattr(doc, "emisor_razon_social", ""))

    emisor_dir = getattr(doc, "emisor_direccion", "")
    if emisor_dir:
        supplier_addr = SubElement(supplier_party, "cac:PostalAddress")
        _add_text(supplier_addr, "cbc:StreetName", emisor_dir[:200])
        _add_text(supplier_addr, "cbc:CountrySubentity", "Venezuela")
        country = SubElement(supplier_addr, "cac:Country")
        _add_text(country, "cbc:IdentificationCode", "VE")

    # Customer (Receptor)
    customer = SubElement(root, "cac:AccountingCustomerParty")
    customer_party = SubElement(customer, "cac:Party")

    customer_id = SubElement(customer_party, "cac:PartyIdentification")
    _add_text(customer_id, "cbc:ID", getattr(doc, "receptor_rif", ""))

    customer_name = SubElement(customer_party, "cac:PartyName")
    _add_text(customer_name, "cbc:Name", getattr(doc, "receptor_razon_social", ""))

    receptor_dir = getattr(doc, "receptor_direccion", "")
    if receptor_dir:
        customer_addr = SubElement(customer_party, "cac:PostalAddress")
        _add_text(customer_addr, "cbc:StreetName", receptor_dir[:200])

    receptor_email = getattr(doc, "receptor_email", "")
    if receptor_email:
        contact = SubElement(customer_party, "cac:Contact")
        _add_text(contact, "cbc:ElectronicMail", receptor_email)
        receptor_tel = getattr(doc, "receptor_telefono", "")
        if receptor_tel:
            _add_text(contact, "cbc:Telephone", receptor_tel)

    # Payment means
    forma_pago = getattr(doc, "forma_pago", "")
    if forma_pago:
        payment = SubElement(root, "cac:PaymentMeans")
        _add_text(payment, "cbc:PaymentMeansCode", _pago_code(forma_pago))
        _add_text(payment, "cbc:PaymentDueDate", _fmt_date(getattr(doc, "fecha_vencimiento", None) or doc.fecha_emision))

    # Tax totals
    moneda = getattr(doc, "moneda", "VES")
    tax_total = SubElement(root, "cac:TaxTotal")
    total_iva = float(getattr(doc, "monto_iva_16", 0) or getattr(doc, "monto_iva", 0) or 0) + float(getattr(doc, "monto_iva_8", 0) or 0)
    tax_amount = _add_text(tax_total, "cbc:TaxAmount", f"{total_iva:.2f}")
    tax_amount.set("currencyID", moneda)

    # IVA 16%
    iva_16 = float(getattr(doc, "monto_iva_16", 0) or 0)
    if iva_16 > 0 or doc_type == "factura":
        subtax = SubElement(tax_total, "cac:TaxSubtotal")
        base_el = _add_text(subtax, "cbc:TaxableAmount", f"{float(getattr(doc, 'base_imponible', 0) or 0):.2f}")
        base_el.set("currencyID", moneda)
        amt_el = _add_text(subtax, "cbc:TaxAmount", f"{iva_16:.2f}")
        amt_el.set("currencyID", moneda)
        cat = SubElement(subtax, "cac:TaxCategory")
        _add_text(cat, "cbc:Percent", "16.00")
        scheme = SubElement(cat, "cac:TaxScheme")
        _add_text(scheme, "cbc:ID", "IVA")
        _add_text(scheme, "cbc:Name", "Impuesto al Valor Agregado")

    # IGTF (Impuesto Grandes Transacciones Financieras)
    monto_igtf = float(getattr(doc, "monto_igtf", 0) or 0)
    if monto_igtf > 0:
        igtf_total = SubElement(root, "cac:TaxTotal")
        igtf_amt = _add_text(igtf_total, "cbc:TaxAmount", f"{monto_igtf:.2f}")
        igtf_amt.set("currencyID", moneda)

        igtf_subtax = SubElement(igtf_total, "cac:TaxSubtotal")
        base_igtf = float(getattr(doc, "base_imponible_igtf", 0) or 0)
        igtf_base = _add_text(igtf_subtax, "cbc:TaxableAmount", f"{base_igtf:.2f}")
        igtf_base.set("currencyID", moneda)
        igtf_tax_amt = _add_text(igtf_subtax, "cbc:TaxAmount", f"{monto_igtf:.2f}")
        igtf_tax_amt.set("currencyID", moneda)
        igtf_cat = SubElement(igtf_subtax, "cac:TaxCategory")
        pct_igtf = float(getattr(doc, "porcentaje_igtf", 3) or 3)
        _add_text(igtf_cat, "cbc:Percent", f"{pct_igtf:.2f}")
        igtf_scheme = SubElement(igtf_cat, "cac:TaxScheme")
        _add_text(igtf_scheme, "cbc:ID", "IGTF")
        _add_text(igtf_scheme, "cbc:Name", "Impuesto a las Grandes Transacciones Financieras")

    # Legal monetary total
    total_con_igtf = float(getattr(doc, "total_con_igtf", 0) or 0)
    payable_amount = total_con_igtf if total_con_igtf > 0 else float(getattr(doc, "total", 0) or 0)

    monetary = SubElement(root, "cac:LegalMonetaryTotal")
    line_ext = _add_text(monetary, "cbc:LineExtensionAmount", f"{float(getattr(doc, 'subtotal', 0) or 0):.2f}")
    line_ext.set("currencyID", moneda)
    tax_exc = _add_text(monetary, "cbc:TaxExclusiveAmount", f"{float(getattr(doc, 'base_imponible', 0) or getattr(doc, 'subtotal', 0) or 0):.2f}")
    tax_exc.set("currencyID", moneda)
    tax_inc = _add_text(monetary, "cbc:TaxInclusiveAmount", f"{float(getattr(doc, 'total', 0) or 0):.2f}")
    tax_inc.set("currencyID", moneda)
    payable = _add_text(monetary, "cbc:PayableAmount", f"{payable_amount:.2f}")
    payable.set("currencyID", moneda)

    # Invoice lines
    for i, item in enumerate(items, 1):
        line = SubElement(root, f"cac:{root_tag}Line")
        _add_text(line, "cbc:ID", str(i))

        qty_el = _add_text(line, "cbc:InvoicedQuantity", f"{float(getattr(item, 'quantity', 0)):.4f}")
        qty_el.set("unitCode", getattr(item, "unit_of_measure", "UND"))

        line_amount = _add_text(line, "cbc:LineExtensionAmount", f"{float(getattr(item, 'subtotal', 0)):.2f}")
        line_amount.set("currencyID", moneda)

        # Item tax
        line_tax = SubElement(line, "cac:TaxTotal")
        line_tax_amt = _add_text(line_tax, "cbc:TaxAmount", f"{float(getattr(item, 'tax_amount', 0)):.2f}")
        line_tax_amt.set("currencyID", moneda)

        # Item details
        ubl_item = SubElement(line, "cac:Item")
        _add_text(ubl_item, "cbc:Description", getattr(item, "description", ""))
        code = getattr(item, "product_code", "")
        if code:
            sellers_id = SubElement(ubl_item, "cac:SellersItemIdentification")
            _add_text(sellers_id, "cbc:ID", code)

        # Price
        price = SubElement(line, "cac:Price")
        price_amt = _add_text(price, "cbc:PriceAmount", f"{float(getattr(item, 'unit_price', 0)):.4f}")
        price_amt.set("currencyID", moneda)

    # Convert to pretty XML
    raw_xml = tostring(root, encoding="unicode", xml_declaration=False)
    pretty_xml = parseString(f'<?xml version="1.0" encoding="UTF-8"?>\n{raw_xml}').toprettyxml(indent="  ")
    # Remove extra declaration from minidom
    lines = pretty_xml.split("\n")
    if lines[0].startswith("<?xml"):
        lines[0] = '<?xml version="1.0" encoding="UTF-8"?>'

    return "\n".join(lines).encode("utf-8")


def _fmt_date(dt) -> str:
    if isinstance(dt, datetime):
        return dt.strftime("%Y-%m-%d")
    return str(dt)[:10] if dt else ""


def _fmt_time(dt) -> str:
    if isinstance(dt, datetime):
        return dt.strftime("%H:%M:%S")
    return "00:00:00"


def _type_code(doc_type: str) -> str:
    return {"factura": "01", "nota_credito": "02", "nota_debito": "03", "guia_despacho": "04"}.get(doc_type, "01")


def _pago_code(forma: str) -> str:
    return {"efectivo": "10", "transferencia": "42", "cheque": "20", "tarjeta_credito": "48",
            "tarjeta_debito": "49", "criptomoneda": "ZZZ"}.get(forma, "10")

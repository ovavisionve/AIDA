"""
Tests for the XML generator module.

Verifies UBL 2.1 XML generation with SENIAT extensions for all document types.
"""
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

import pytest

from app.services.fiscal.xml_generator import (
    generate_document_xml,
    _fmt_date,
    _fmt_time,
    _type_code,
    _pago_code,
)


# === Helper: mock document and items ===

def _make_doc(**overrides):
    """Create a mock document object with sensible defaults."""
    class Doc:
        pass
    d = Doc()
    defaults = {
        "document_number": "FAC-00000001",
        "uuid_seniat": "550e8400-e29b-41d4-a716-446655440000",
        "fecha_emision": datetime(2026, 2, 15, 10, 30, 0, tzinfo=timezone.utc),
        "control_number": "A-00000001",
        "firma_digital": "abc123hash",
        "qr_code": "eyJuYyI6IkEtMDAwMDAwMDEifQ==",
        "emisor_rif": "J-31245678-3",
        "emisor_razon_social": "Alimentos Santoni C.A.",
        "emisor_direccion": "Av. Principal, Caracas",
        "receptor_rif": "J-12345678-0",
        "receptor_razon_social": "Supermercados Central C.A.",
        "receptor_direccion": "Av. Lecuna, Caracas",
        "receptor_email": "compras@supercentral.com.ve",
        "receptor_telefono": "+58-212-1234567",
        "moneda": "VES",
        "tasa_cambio": None,
        "forma_pago": "transferencia",
        "fecha_vencimiento": None,
        "subtotal": 900.00,
        "base_imponible": 900.00,
        "base_exenta": 0.00,
        "monto_iva_16": 144.00,
        "monto_iva_8": 0.00,
        "monto_igtf": 0.00,
        "base_imponible_igtf": 0.00,
        "porcentaje_igtf": 3.00,
        "total": 1044.00,
        "total_con_igtf": 1044.00,
    }
    defaults.update(overrides)
    for k, v in defaults.items():
        setattr(d, k, v)
    return d


def _make_item(**overrides):
    """Create a mock line item."""
    class Item:
        pass
    i = Item()
    defaults = {
        "line_number": 1,
        "product_code": "ARZ-001",
        "description": "Arroz Santoni Premium 1kg",
        "unit_of_measure": "UND",
        "quantity": 100,
        "unit_price": 5.50,
        "discount_amount": 0,
        "subtotal": 550.00,
        "tax_type": "G",
        "tax_rate": 16.00,
        "tax_amount": 88.00,
        "total": 638.00,
    }
    defaults.update(overrides)
    for k, v in defaults.items():
        setattr(i, k, v)
    return i


# === Tests for helper functions ===

class TestHelperFunctions:
    """Tests for utility functions in xml_generator."""

    def test_fmt_date_with_datetime(self):
        dt = datetime(2026, 2, 15, 10, 30, 0)
        assert _fmt_date(dt) == "2026-02-15"

    def test_fmt_date_with_none(self):
        assert _fmt_date(None) == ""

    def test_fmt_date_with_string(self):
        assert _fmt_date("2026-02-15T10:30:00") == "2026-02-15"

    def test_fmt_time_with_datetime(self):
        dt = datetime(2026, 2, 15, 14, 45, 30)
        assert _fmt_time(dt) == "14:45:30"

    def test_fmt_time_with_none(self):
        assert _fmt_time(None) == "00:00:00"

    def test_type_code_mapping(self):
        assert _type_code("factura") == "01"
        assert _type_code("nota_credito") == "02"
        assert _type_code("nota_debito") == "03"
        assert _type_code("guia_despacho") == "04"
        assert _type_code("unknown") == "01"  # default

    def test_pago_code_mapping(self):
        assert _pago_code("efectivo") == "10"
        assert _pago_code("transferencia") == "42"
        assert _pago_code("cheque") == "20"
        assert _pago_code("tarjeta_credito") == "48"
        assert _pago_code("tarjeta_debito") == "49"
        assert _pago_code("criptomoneda") == "ZZZ"
        assert _pago_code("desconocido") == "10"  # default


# === Tests for XML generation ===

class TestGenerateDocumentXML:
    """Tests for full XML document generation."""

    def _parse(self, xml_bytes: bytes) -> ET.Element:
        """Parse XML bytes into ElementTree root."""
        return ET.fromstring(xml_bytes.decode("utf-8"))

    def test_generates_valid_xml(self):
        """Generated output is valid XML."""
        doc = _make_doc()
        items = [_make_item()]
        xml_bytes = generate_document_xml(doc, items, "factura")
        # Should not raise
        root = self._parse(xml_bytes)
        assert root.tag == "Invoice"

    def test_xml_starts_with_declaration(self):
        """XML starts with proper declaration."""
        xml_bytes = generate_document_xml(_make_doc(), [_make_item()], "factura")
        text = xml_bytes.decode("utf-8")
        assert text.strip().startswith('<?xml version="1.0" encoding="UTF-8"?>')

    def test_ubl_version(self):
        """XML contains UBL 2.1 version identifier."""
        root = self._parse(generate_document_xml(_make_doc(), [_make_item()], "factura"))
        ns = {"cbc": "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"}
        version = root.find("cbc:UBLVersionID", ns)
        assert version is not None
        assert version.text == "2.1"

    def test_seniat_extension_present(self):
        """XML includes AIDA SENIAT extension block."""
        root = self._parse(generate_document_xml(_make_doc(), [_make_item()], "factura"))
        ns = {"aida": "urn:aida:seniat:ve:fiscal:1.0"}
        seniat = root.find("aida:SENIATExtension", ns)
        assert seniat is not None
        nc = seniat.find("aida:NumeroControl", ns)
        assert nc is not None
        assert nc.text == "A-00000001"

    def test_supplier_data(self):
        """XML includes emisor (supplier) information."""
        root = self._parse(generate_document_xml(_make_doc(), [_make_item()], "factura"))
        ns = {
            "cac": "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
            "cbc": "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
        }
        supplier = root.find("cac:AccountingSupplierParty", ns)
        assert supplier is not None
        rif_el = supplier.find(".//cbc:ID", ns)
        assert rif_el is not None
        assert rif_el.text == "J-31245678-3"

    def test_customer_data(self):
        """XML includes receptor (customer) information."""
        root = self._parse(generate_document_xml(_make_doc(), [_make_item()], "factura"))
        ns = {
            "cac": "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
            "cbc": "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
        }
        customer = root.find("cac:AccountingCustomerParty", ns)
        assert customer is not None
        name = customer.find(".//cbc:Name", ns)
        assert name is not None
        assert name.text == "Supermercados Central C.A."

    def test_invoice_lines_count(self):
        """XML has correct number of invoice lines."""
        items = [
            _make_item(line_number=1, description="Item 1"),
            _make_item(line_number=2, description="Item 2", product_code="ARZ-002"),
            _make_item(line_number=3, description="Item 3", product_code="ARZ-003"),
        ]
        root = self._parse(generate_document_xml(_make_doc(), items, "factura"))
        ns = {"cac": "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"}
        lines = root.findall("cac:InvoiceLine", ns)
        assert len(lines) == 3

    def test_credit_note_root_tag(self):
        """Credit note has CreditNote root tag."""
        xml_bytes = generate_document_xml(_make_doc(), [_make_item()], "nota_credito")
        root = self._parse(xml_bytes)
        assert root.tag == "CreditNote"

    def test_debit_note_root_tag(self):
        """Debit note has DebitNote root tag."""
        xml_bytes = generate_document_xml(_make_doc(), [_make_item()], "nota_debito")
        root = self._parse(xml_bytes)
        assert root.tag == "DebitNote"

    def test_dispatch_guide_root_tag(self):
        """Dispatch guide has DespatchAdvice root tag."""
        xml_bytes = generate_document_xml(_make_doc(), [_make_item()], "guia_despacho")
        root = self._parse(xml_bytes)
        assert root.tag == "DespatchAdvice"

    def test_igtf_block_when_present(self):
        """IGTF tax section appears when monto_igtf > 0."""
        doc = _make_doc(monto_igtf=34.80, base_imponible_igtf=1160.00, porcentaje_igtf=3.00)
        xml_bytes = generate_document_xml(doc, [_make_item()], "factura")
        text = xml_bytes.decode("utf-8")
        assert "IGTF" in text
        assert "34.80" in text

    def test_no_igtf_block_when_zero(self):
        """IGTF section absent when monto_igtf is 0."""
        doc = _make_doc(monto_igtf=0, base_imponible_igtf=0)
        xml_bytes = generate_document_xml(doc, [_make_item()], "factura")
        text = xml_bytes.decode("utf-8")
        assert "IGTF" not in text

    def test_currency_attribute(self):
        """Currency ID attributes use document currency."""
        doc = _make_doc(moneda="USD", tasa_cambio=36.50)
        xml_bytes = generate_document_xml(doc, [_make_item()], "factura")
        text = xml_bytes.decode("utf-8")
        assert 'currencyID="USD"' in text

    def test_exchange_rate_in_seniat_extension(self):
        """Exchange rate appears in SENIAT extension when set."""
        doc = _make_doc(moneda="USD", tasa_cambio=36.50)
        xml_bytes = generate_document_xml(doc, [_make_item()], "factura")
        text = xml_bytes.decode("utf-8")
        assert "36.5" in text

    def test_payment_means(self):
        """Payment means section uses correct code."""
        doc = _make_doc(forma_pago="transferencia")
        xml_bytes = generate_document_xml(doc, [_make_item()], "factura")
        text = xml_bytes.decode("utf-8")
        assert "42" in text  # transferencia code

    def test_monetary_total(self):
        """Legal monetary total section has correct amounts."""
        doc = _make_doc(subtotal=900.00, total=1044.00)
        root = self._parse(generate_document_xml(doc, [_make_item()], "factura"))
        ns = {
            "cac": "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
            "cbc": "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
        }
        monetary = root.find("cac:LegalMonetaryTotal", ns)
        assert monetary is not None
        payable = monetary.find("cbc:PayableAmount", ns)
        assert payable is not None
        assert payable.text == "1044.00"

    def test_empty_items_produces_valid_xml(self):
        """XML is still valid with no items."""
        xml_bytes = generate_document_xml(_make_doc(), [], "factura")
        root = self._parse(xml_bytes)
        assert root.tag == "Invoice"

    def test_item_without_product_code(self):
        """Item without product code omits SellersItemIdentification."""
        item = _make_item(product_code=None)
        xml_bytes = generate_document_xml(_make_doc(), [item], "factura")
        text = xml_bytes.decode("utf-8")
        assert "SellersItemIdentification" not in text

    def test_receptor_without_email(self):
        """Receptor without email omits Contact section."""
        doc = _make_doc(receptor_email=None)
        xml_bytes = generate_document_xml(doc, [_make_item()], "factura")
        text = xml_bytes.decode("utf-8")
        assert "ElectronicMail" not in text

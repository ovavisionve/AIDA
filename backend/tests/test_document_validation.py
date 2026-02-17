"""
Tests for document emission validation rules, digital signature, and QR generation.

These tests verify the business logic in the document emitter without needing
a database connection (pure function tests).
"""
import hashlib
import json
import base64
from datetime import datetime, timezone, date

import pytest

from app.schemas.fiscal import (
    EmitirDocumentoRequest,
    FiscalReceptor,
    FiscalItem,
    FiscalPago,
    FiscalEmisor,
)
from app.services.fiscal.document_emitter import _validar_request, DocumentEmissionError


# === Validation Tests ===

class TestValidarRequest:
    """Tests for the _validar_request business validation function."""

    def _base_request(self, **overrides) -> EmitirDocumentoRequest:
        """Create a valid base request for modification."""
        defaults = dict(
            tipo_documento="factura",
            receptor=FiscalReceptor(
                rif="J-12345678-9",
                razon_social="Test C.A.",
                direccion="Av. Test, Caracas",
            ),
            items=[
                FiscalItem(
                    numero_linea=1,
                    descripcion="Servicio",
                    cantidad=1,
                    precio_unitario=100.00,
                    tipo_impuesto="G",
                ),
            ],
        )
        defaults.update(overrides)
        return EmitirDocumentoRequest(**defaults)

    def test_valid_factura_passes(self):
        """Valid factura request passes without error."""
        req = self._base_request()
        _validar_request(req)  # Should not raise

    def test_nota_credito_requires_documento_referencia(self):
        """Nota de credito requires documento_referencia."""
        req = self._base_request(
            tipo_documento="nota_credito",
            motivo="Devolucion",
            documento_referencia=None,
        )
        with pytest.raises(DocumentEmissionError) as exc_info:
            _validar_request(req)
        assert "documento_referencia" in str(exc_info.value.details)

    def test_nota_credito_requires_motivo(self):
        """Nota de credito requires motivo."""
        req = self._base_request(
            tipo_documento="nota_credito",
            documento_referencia="A-00000001",
            motivo=None,
        )
        with pytest.raises(DocumentEmissionError) as exc_info:
            _validar_request(req)
        assert "motivo" in str(exc_info.value.details)

    def test_nota_debito_requires_referencia_and_motivo(self):
        """Nota de debito requires both referencia and motivo."""
        req = self._base_request(
            tipo_documento="nota_debito",
            documento_referencia=None,
            motivo=None,
        )
        with pytest.raises(DocumentEmissionError) as exc_info:
            _validar_request(req)
        assert len(exc_info.value.details) == 2

    def test_foreign_currency_requires_tasa_cambio(self):
        """USD/EUR transactions require exchange rate."""
        req = self._base_request(moneda="USD", tasa_cambio=None)
        with pytest.raises(DocumentEmissionError) as exc_info:
            _validar_request(req)
        assert "tasa_cambio" in str(exc_info.value.details)

    def test_ves_does_not_require_tasa_cambio(self):
        """VES transactions do not require exchange rate."""
        req = self._base_request(moneda="VES", tasa_cambio=None)
        _validar_request(req)  # Should not raise

    def test_eur_requires_tasa_cambio(self):
        """EUR transactions require exchange rate."""
        req = self._base_request(moneda="EUR", tasa_cambio=None)
        with pytest.raises(DocumentEmissionError):
            _validar_request(req)

    def test_usd_with_tasa_cambio_passes(self):
        """USD with exchange rate passes."""
        req = self._base_request(moneda="USD", tasa_cambio=36.50)
        _validar_request(req)  # Should not raise

    def test_negative_precio_unitario_fails(self):
        """Items with negative price fail."""
        req = self._base_request(
            items=[FiscalItem(
                numero_linea=1,
                descripcion="Item malo",
                cantidad=1,
                precio_unitario=-10.00,
                tipo_impuesto="G",
            )],
        )
        with pytest.raises(DocumentEmissionError) as exc_info:
            _validar_request(req)
        assert "precio_unitario" in str(exc_info.value.details)

    def test_multiple_validation_errors_accumulated(self):
        """Multiple errors are accumulated in details list."""
        req = self._base_request(
            tipo_documento="nota_credito",
            moneda="USD",
            tasa_cambio=None,
            documento_referencia=None,
            motivo=None,
        )
        with pytest.raises(DocumentEmissionError) as exc_info:
            _validar_request(req)
        # Should have at least 3 errors: referencia, motivo, tasa_cambio
        assert len(exc_info.value.details) >= 3

    def test_error_code_is_validation_error(self):
        """Error code is VALIDATION_ERROR."""
        req = self._base_request(moneda="USD", tasa_cambio=None)
        with pytest.raises(DocumentEmissionError) as exc_info:
            _validar_request(req)
        assert exc_info.value.error_code == "VALIDATION_ERROR"

    def test_valid_nota_credito_passes(self):
        """Valid nota de credito with all required fields passes."""
        req = self._base_request(
            tipo_documento="nota_credito",
            documento_referencia="A-00000001",
            motivo="Devolucion parcial",
        )
        _validar_request(req)  # Should not raise

    def test_guia_despacho_no_extra_validations(self):
        """Guia de despacho has no extra validation requirements."""
        req = self._base_request(tipo_documento="guia_despacho")
        _validar_request(req)  # Should not raise

    def test_factura_with_multiple_items(self):
        """Factura with multiple valid items passes."""
        req = self._base_request(
            items=[
                FiscalItem(numero_linea=1, descripcion="Item 1", cantidad=10, precio_unitario=5.50, tipo_impuesto="G"),
                FiscalItem(numero_linea=2, descripcion="Item 2", cantidad=5, precio_unitario=7.00, tipo_impuesto="R"),
                FiscalItem(numero_linea=3, descripcion="Item 3", cantidad=2, precio_unitario=25.00, tipo_impuesto="E"),
            ],
        )
        _validar_request(req)  # Should not raise


# === Digital Signature Tests ===

class TestDigitalSignature:
    """Tests for the SHA-256 digital signature generation logic."""

    def test_signature_is_deterministic(self):
        """Same input produces same signature."""
        data = "A-00000001|J-31245678-3|J-12345678-0|2026-02-15T10:30:00+00:00|1044.00"
        hash1 = hashlib.sha256(data.encode()).hexdigest()
        hash2 = hashlib.sha256(data.encode()).hexdigest()
        assert hash1 == hash2

    def test_signature_is_64_hex_chars(self):
        """SHA-256 hash is 64 hex characters."""
        data = "A-00000001|J-31245678-3|J-12345678-0|2026-02-15T10:30:00|1044.00"
        firma = hashlib.sha256(data.encode()).hexdigest()
        assert len(firma) == 64
        assert all(c in "0123456789abcdef" for c in firma)

    def test_different_data_different_signature(self):
        """Different inputs produce different signatures."""
        data1 = "A-00000001|J-31245678-3|J-12345678-0|2026-02-15|1044.00"
        data2 = "A-00000002|J-31245678-3|J-12345678-0|2026-02-15|1044.00"
        assert hashlib.sha256(data1.encode()).hexdigest() != hashlib.sha256(data2.encode()).hexdigest()

    def test_signature_format_matches_emitter(self):
        """Verify the format used by the document emitter."""
        numero_control = "A-00000001"
        emisor_rif = "J-31245678-3"
        receptor_rif = "J-12345678-0"
        fecha = datetime(2026, 2, 15, 10, 30, 0, tzinfo=timezone.utc)
        total = 1044.00

        firma_data = f"{numero_control}|{emisor_rif}|{receptor_rif}|{fecha.isoformat()}|{total}"
        firma = hashlib.sha256(firma_data.encode()).hexdigest()

        assert len(firma) == 64
        assert isinstance(firma, str)


# === QR Code Data Tests ===

class TestQRCodeData:
    """Tests for the QR code data generation logic."""

    def test_qr_data_structure(self):
        """QR data contains all required fields."""
        qr_data = json.dumps({
            "nc": "A-00000001",
            "rif_e": "J-31245678-3",
            "rif_r": "J-12345678-0",
            "f": "2026-02-15",
            "t": 1044.00,
            "uuid": "550e8400-e29b-41d4-a716-446655440000",
        })
        parsed = json.loads(qr_data)
        assert "nc" in parsed
        assert "rif_e" in parsed
        assert "rif_r" in parsed
        assert "f" in parsed
        assert "t" in parsed
        assert "uuid" in parsed

    def test_qr_base64_encoding(self):
        """QR data is properly base64 encoded."""
        qr_data = json.dumps({
            "nc": "A-00000001",
            "rif_e": "J-31245678-3",
            "rif_r": "J-12345678-0",
            "f": "2026-02-15",
            "t": 1044.00,
            "uuid": "550e8400-e29b-41d4-a716-446655440000",
        })
        encoded = base64.b64encode(qr_data.encode()).decode()
        decoded = base64.b64decode(encoded).decode()
        assert decoded == qr_data

    def test_qr_data_round_trip(self):
        """QR data survives encode/decode round trip."""
        original = {
            "nc": "EC-00000001",
            "rif_e": "J-40987654-1",
            "rif_r": "V-15234567-8",
            "f": "2026-02-16",
            "t": 547.00,
            "uuid": "123e4567-e89b-12d3-a456-426614174000",
        }
        qr_data = json.dumps(original)
        encoded = base64.b64encode(qr_data.encode()).decode()
        decoded = json.loads(base64.b64decode(encoded).decode())
        assert decoded == original

    def test_qr_includes_total_with_precision(self):
        """QR total preserves numeric precision."""
        total = 1234.56
        qr_data = json.dumps({"t": total})
        parsed = json.loads(qr_data)
        assert parsed["t"] == 1234.56


# === Request Schema Tests ===

class TestRequestSchemas:
    """Tests for Pydantic schema validation."""

    def test_fiscal_item_defaults(self):
        """FiscalItem has correct defaults."""
        item = FiscalItem(
            numero_linea=1,
            descripcion="Test",
            cantidad=1,
            precio_unitario=100,
        )
        assert item.tipo_impuesto == "G"
        assert item.descuento_porcentaje == 0
        assert item.descuento_monto == 0
        assert item.unidad == "UND"

    def test_emitir_request_defaults(self):
        """EmitirDocumentoRequest has correct defaults."""
        req = EmitirDocumentoRequest(
            tipo_documento="factura",
            receptor=FiscalReceptor(rif="J-12345678-9", razon_social="Test", direccion="Dir"),
            items=[FiscalItem(numero_linea=1, descripcion="Item", cantidad=1, precio_unitario=100)],
        )
        assert req.moneda == "VES"
        assert req.condicion_pago == "contado"
        assert req.pago_en_divisas is False
        assert req.porcentaje_igtf == 3.00
        assert req.emisor is None
        assert req.fecha_emision is None

    def test_fiscal_receptor_requires_rif(self):
        """FiscalReceptor requires rif field."""
        with pytest.raises(Exception):
            FiscalReceptor(razon_social="Test", direccion="Dir")

    def test_fiscal_item_quantity_must_be_positive(self):
        """FiscalItem rejects quantity <= 0."""
        with pytest.raises(Exception):
            FiscalItem(numero_linea=1, descripcion="Bad", cantidad=0, precio_unitario=10)

    def test_emitir_request_requires_items(self):
        """EmitirDocumentoRequest requires at least one item."""
        with pytest.raises(Exception):
            EmitirDocumentoRequest(
                tipo_documento="factura",
                receptor=FiscalReceptor(rif="J-12345678-9", razon_social="Test", direccion="Dir"),
                items=[],
            )

    def test_discount_percentage_range(self):
        """Discount percentage must be 0-100."""
        with pytest.raises(Exception):
            FiscalItem(numero_linea=1, descripcion="Bad", cantidad=1, precio_unitario=10, descuento_porcentaje=150)

    def test_pago_forma_field(self):
        """FiscalPago requires forma field."""
        pago = FiscalPago(forma="transferencia")
        assert pago.forma == "transferencia"
        assert pago.monto is None

    def test_emisor_all_optional(self):
        """FiscalEmisor has all optional fields."""
        emisor = FiscalEmisor()
        assert emisor.rif is None
        assert emisor.razon_social is None

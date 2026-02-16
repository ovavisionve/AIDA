"""
Tests for the fiscal calculator module.

Verifies IVA calculations, discount handling, and totals aggregation
according to Venezuelan SENIAT tax rules.
"""
import pytest
from app.schemas.fiscal import FiscalItem, FiscalItemResponse, FiscalTotales
from app.services.fiscal.calculator import (
    calcular_item,
    calcular_totales,
    ALICUOTA_GENERAL,
    ALICUOTA_REDUCIDA,
    ALICUOTA_EXENTO,
)


# === calcular_item tests ===

class TestCalcularItem:
    """Tests for individual item calculations."""

    def test_basic_item_general_tax(self):
        """Item with general 16% IVA."""
        item = FiscalItem(
            numero_linea=1,
            descripcion="Servicio de Consultoría",
            cantidad=1,
            precio_unitario=100.00,
            tipo_impuesto="G",
        )
        result = calcular_item(item)

        assert result.subtotal == 100.00
        assert result.alicuota == 16.00
        assert result.monto_impuesto == 16.00
        assert result.total == 116.00
        assert result.descuento == 0.00

    def test_item_reduced_tax(self):
        """Item with reduced 8% IVA."""
        item = FiscalItem(
            numero_linea=1,
            descripcion="Alimento básico",
            cantidad=10,
            precio_unitario=5.00,
            tipo_impuesto="R",
        )
        result = calcular_item(item)

        assert result.subtotal == 50.00
        assert result.alicuota == 8.00
        assert result.monto_impuesto == 4.00
        assert result.total == 54.00

    def test_item_exempt(self):
        """Exempt item (no tax)."""
        item = FiscalItem(
            numero_linea=1,
            descripcion="Servicio exento",
            cantidad=2,
            precio_unitario=200.00,
            tipo_impuesto="E",
        )
        result = calcular_item(item)

        assert result.subtotal == 400.00
        assert result.alicuota == 0.00
        assert result.monto_impuesto == 0.00
        assert result.total == 400.00

    def test_item_not_subject(self):
        """Not subject item (NS)."""
        item = FiscalItem(
            numero_linea=1,
            descripcion="Item no sujeto",
            cantidad=1,
            precio_unitario=300.00,
            tipo_impuesto="NS",
        )
        result = calcular_item(item)

        assert result.monto_impuesto == 0.00
        assert result.total == 300.00

    def test_percentage_discount(self):
        """Item with percentage discount."""
        item = FiscalItem(
            numero_linea=1,
            descripcion="Producto con descuento",
            cantidad=1,
            precio_unitario=100.00,
            descuento_porcentaje=10.0,
            tipo_impuesto="G",
        )
        result = calcular_item(item)

        assert result.descuento == 10.00
        assert result.subtotal == 90.00
        assert result.monto_impuesto == 14.40  # 90 * 0.16
        assert result.total == 104.40

    def test_fixed_discount(self):
        """Item with fixed amount discount."""
        item = FiscalItem(
            numero_linea=1,
            descripcion="Producto con descuento fijo",
            cantidad=5,
            precio_unitario=20.00,
            descuento_monto=25.00,
            tipo_impuesto="G",
        )
        result = calcular_item(item)

        assert result.descuento == 25.00
        assert result.subtotal == 75.00  # 100 - 25
        assert result.monto_impuesto == 12.00  # 75 * 0.16
        assert result.total == 87.00

    def test_fractional_quantity(self):
        """Item with fractional quantity (e.g. kilograms)."""
        item = FiscalItem(
            numero_linea=1,
            descripcion="Material por kg",
            unidad="KG",
            cantidad=2.5,
            precio_unitario=40.00,
            tipo_impuesto="G",
        )
        result = calcular_item(item)

        assert result.subtotal == 100.00
        assert result.monto_impuesto == 16.00
        assert result.total == 116.00

    def test_zero_price_item(self):
        """Item with zero price (promotional/free item)."""
        item = FiscalItem(
            numero_linea=1,
            descripcion="Producto gratis",
            cantidad=1,
            precio_unitario=0.00,
            tipo_impuesto="G",
        )
        result = calcular_item(item)

        assert result.subtotal == 0.00
        assert result.monto_impuesto == 0.00
        assert result.total == 0.00

    def test_high_quantity(self):
        """High quantity calculation accuracy."""
        item = FiscalItem(
            numero_linea=1,
            descripcion="Tornillos",
            cantidad=10000,
            precio_unitario=0.05,
            tipo_impuesto="G",
        )
        result = calcular_item(item)

        assert result.subtotal == 500.00
        assert result.monto_impuesto == 80.00
        assert result.total == 580.00

    def test_rounding_accuracy(self):
        """Verify proper rounding to 2 decimal places."""
        item = FiscalItem(
            numero_linea=1,
            descripcion="Item con redondeo",
            cantidad=3,
            precio_unitario=7.33,
            tipo_impuesto="G",
        )
        result = calcular_item(item)

        assert result.subtotal == 21.99
        assert result.monto_impuesto == 3.52  # 21.99 * 0.16 = 3.5184 -> 3.52
        assert result.total == 25.51


# === calcular_totales tests ===

class TestCalcularTotales:
    """Tests for document totals calculation."""

    def _make_item(self, subtotal: float, descuento: float, tipo: str, impuesto: float) -> FiscalItemResponse:
        return FiscalItemResponse(
            numero_linea=1,
            codigo=None,
            descripcion="Test",
            unidad="UND",
            cantidad=1,
            precio_unitario=subtotal + descuento,
            descuento=descuento,
            subtotal=subtotal,
            tipo_impuesto=tipo,
            alicuota=16.0 if tipo == "G" else (8.0 if tipo == "R" else 0.0),
            monto_impuesto=impuesto,
            total=subtotal + impuesto,
        )

    def test_single_taxed_item(self):
        """Single item with general tax."""
        items = [self._make_item(100.0, 0.0, "G", 16.0)]
        totales = calcular_totales(items)

        assert totales.subtotal == 100.00
        assert totales.base_imponible == 100.00
        assert totales.base_exenta == 0.00
        assert totales.monto_iva_16 == 16.00
        assert totales.total_impuestos == 16.00
        assert totales.total == 116.00

    def test_mixed_tax_types(self):
        """Multiple items with different tax types."""
        items = [
            self._make_item(100.0, 0.0, "G", 16.0),   # Gravado 16%
            self._make_item(50.0, 0.0, "R", 4.0),      # Reducido 8%
            self._make_item(200.0, 0.0, "E", 0.0),     # Exento
        ]
        totales = calcular_totales(items)

        assert totales.base_imponible == 150.00  # G + R
        assert totales.base_exenta == 200.00
        assert totales.monto_iva_16 == 16.00
        assert totales.monto_iva_8 == 4.00
        assert totales.total_impuestos == 20.00
        assert totales.total == 370.00

    def test_with_discounts(self):
        """Totals with discounts applied."""
        items = [
            self._make_item(90.0, 10.0, "G", 14.40),   # 100 - 10 discount
            self._make_item(80.0, 20.0, "G", 12.80),    # 100 - 20 discount
        ]
        totales = calcular_totales(items)

        assert totales.subtotal == 200.00  # Sum of (subtotal + descuento)
        assert totales.descuento_total == 30.00
        assert totales.base_imponible == 170.00  # Sum of subtotals for G items
        assert totales.monto_iva_16 == 27.20
        assert totales.total == 197.20

    def test_empty_items(self):
        """Edge case: no items."""
        totales = calcular_totales([])

        assert totales.subtotal == 0.00
        assert totales.total == 0.00
        assert totales.total_impuestos == 0.00

    def test_not_subject_items(self):
        """Items not subject to tax (NS)."""
        items = [
            self._make_item(100.0, 0.0, "NS", 0.0),
            self._make_item(50.0, 0.0, "NS", 0.0),
        ]
        totales = calcular_totales(items)

        assert totales.base_no_sujeta == 150.00
        assert totales.base_imponible == 0.00
        assert totales.total_impuestos == 0.00
        assert totales.total == 150.00


# === Integration test: calcular_item -> calcular_totales ===

class TestEndToEndCalculation:
    """Integration tests using real calculator flow."""

    def test_full_invoice_calculation(self):
        """Simulate a complete invoice calculation."""
        items = [
            FiscalItem(
                numero_linea=1,
                codigo="SRV-001",
                descripcion="Servicio de Desarrollo",
                cantidad=40,
                precio_unitario=50.00,
                tipo_impuesto="G",
            ),
            FiscalItem(
                numero_linea=2,
                codigo="SRV-002",
                descripcion="Mantenimiento Mensual",
                cantidad=1,
                precio_unitario=200.00,
                descuento_porcentaje=10.0,
                tipo_impuesto="G",
            ),
            FiscalItem(
                numero_linea=3,
                descripcion="Capacitación (exenta)",
                cantidad=8,
                precio_unitario=75.00,
                tipo_impuesto="E",
            ),
        ]

        # Calculate each item
        calculated = [calcular_item(item) for item in items]

        # Item 1: 40 * 50 = 2000, IVA = 320
        assert calculated[0].subtotal == 2000.00
        assert calculated[0].monto_impuesto == 320.00

        # Item 2: 200 - 10% = 180, IVA = 28.80
        assert calculated[1].subtotal == 180.00
        assert calculated[1].descuento == 20.00
        assert calculated[1].monto_impuesto == 28.80

        # Item 3: 8 * 75 = 600, exento
        assert calculated[2].subtotal == 600.00
        assert calculated[2].monto_impuesto == 0.00

        # Totals
        totales = calcular_totales(calculated)

        assert totales.subtotal == 2820.00  # 2000 + 200 + 600
        assert totales.descuento_total == 20.00
        assert totales.base_imponible == 2180.00  # 2000 + 180 (G items)
        assert totales.base_exenta == 600.00
        assert totales.monto_iva_16 == 348.80  # 320 + 28.80
        assert totales.total_impuestos == 348.80
        assert totales.total == 3148.80  # 2320 + 208.80 + 600

    def test_all_exempt_invoice(self):
        """Invoice with only exempt items."""
        items = [
            FiscalItem(
                numero_linea=1,
                descripcion="Servicio médico",
                cantidad=1,
                precio_unitario=500.00,
                tipo_impuesto="E",
            ),
            FiscalItem(
                numero_linea=2,
                descripcion="Consulta",
                cantidad=1,
                precio_unitario=300.00,
                tipo_impuesto="E",
            ),
        ]

        calculated = [calcular_item(item) for item in items]
        totales = calcular_totales(calculated)

        assert totales.total_impuestos == 0.00
        assert totales.monto_iva_16 == 0.00
        assert totales.monto_iva_8 == 0.00
        assert totales.base_exenta == 800.00
        assert totales.total == 800.00

    def test_reduced_rate_items(self):
        """Items with reduced IVA rate (8%)."""
        items = [
            FiscalItem(
                numero_linea=1,
                descripcion="Producto alimenticio",
                cantidad=10,
                precio_unitario=25.00,
                tipo_impuesto="R",
            ),
        ]

        calculated = [calcular_item(item) for item in items]
        totales = calcular_totales(calculated)

        assert totales.monto_iva_8 == 20.00  # 250 * 0.08
        assert totales.monto_iva_16 == 0.00
        assert totales.total == 270.00

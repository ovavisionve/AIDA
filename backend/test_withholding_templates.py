"""
Script de prueba para verificar los templates de comprobantes de retención.
Genera PDFs y XMLs con datos inventados para IVA e ISLR.

Uso: python test_withholding_templates.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, date


class MockWithholdingIVA:
    """Simula un comprobante de retención de IVA recibido."""
    id = "test-iva-001"
    document_number = "20260200000001234"
    tipo = "iva"
    fecha_emision = datetime(2026, 2, 15, 10, 30, 0)
    periodo_fiscal = "2026-02"

    # Agente de retención (el cliente/comprador SPE que retuvo)
    agente_retencion_rif = "J-30000001-5"
    agente_retencion_nombre = "Distribuidora Nacional de Alimentos, C.A."
    agente_retencion_direccion = "Av. Libertador, Torre Empresarial Piso 12, Caracas, Dtto. Capital"

    # Sujeto retenido (el usuario/vendedor a quien le retuvieron)
    sujeto_retenido_rif = "J-40512387-9"
    sujeto_retenido_nombre = "Inversiones y Tecnología Avanzada, C.A."
    sujeto_retenido_direccion = "Calle 5, Edif. Centro Profesional, Ofc. 4-B, Valencia, Edo. Carabobo"
    sujeto_retenido_email = "admin@invtecavanzada.com.ve"

    # Factura de referencia
    factura_numero = "FAC-2026-000847"
    factura_fecha = date(2026, 2, 10)

    # Montos
    monto_factura = 15800.00
    base_imponible = 13620.69
    impuesto_causado = 2179.31  # IVA 16%
    porcentaje_retencion = 75.00
    monto_retenido = 1634.48

    status = "registrado"
    concepto = None


class MockWithholdingISLR:
    """Simula un comprobante de retención de ISLR recibido."""
    id = "test-islr-001"
    document_number = "20260200000005678"
    tipo = "islr"
    fecha_emision = datetime(2026, 2, 18, 14, 45, 0)
    periodo_fiscal = "2026-02"

    # Agente de retención
    agente_retencion_rif = "G-20000045-0"
    agente_retencion_nombre = "Gobernación del Estado Zulia"
    agente_retencion_direccion = "Palacio de Gobierno, Maracaibo, Edo. Zulia"

    # Sujeto retenido
    sujeto_retenido_rif = "J-40512387-9"
    sujeto_retenido_nombre = "Inversiones y Tecnología Avanzada, C.A."
    sujeto_retenido_direccion = "Calle 5, Edif. Centro Profesional, Ofc. 4-B, Valencia, Edo. Carabobo"
    sujeto_retenido_email = "admin@invtecavanzada.com.ve"

    # Factura de referencia
    factura_numero = "FAC-2026-000902"
    factura_fecha = date(2026, 2, 12)

    # Montos
    monto_factura = 42500.00
    base_imponible = 42500.00
    impuesto_causado = None  # ISLR no tiene "impuesto causado" como el IVA
    porcentaje_retencion = 2.00
    monto_retenido = 850.00

    status = "registrado"
    concepto = "Servicios profesionales no mercantiles (Art. 9 LISLR)"


def main():
    from app.services.fiscal.pdf_generator import generate_withholding_pdf
    from app.services.fiscal.xml_generator import generate_withholding_xml

    output_dir = os.path.join(os.path.dirname(__file__), "test_output")
    os.makedirs(output_dir, exist_ok=True)

    # ── Retención IVA ──
    print("Generando comprobante de retención IVA...")
    doc_iva = MockWithholdingIVA()

    pdf_iva = generate_withholding_pdf(doc_iva)
    pdf_iva_path = os.path.join(output_dir, "retencion_iva_test.pdf")
    with open(pdf_iva_path, "wb") as f:
        f.write(pdf_iva)
    print(f"  PDF IVA: {pdf_iva_path} ({len(pdf_iva):,} bytes)")

    xml_iva = generate_withholding_xml(doc_iva)
    xml_iva_path = os.path.join(output_dir, "retencion_iva_test.xml")
    with open(xml_iva_path, "wb") as f:
        f.write(xml_iva)
    print(f"  XML IVA: {xml_iva_path} ({len(xml_iva):,} bytes)")

    # ── Retención ISLR ──
    print("\nGenerando comprobante de retención ISLR...")
    doc_islr = MockWithholdingISLR()

    pdf_islr = generate_withholding_pdf(doc_islr)
    pdf_islr_path = os.path.join(output_dir, "retencion_islr_test.pdf")
    with open(pdf_islr_path, "wb") as f:
        f.write(pdf_islr)
    print(f"  PDF ISLR: {pdf_islr_path} ({len(pdf_islr):,} bytes)")

    xml_islr = generate_withholding_xml(doc_islr)
    xml_islr_path = os.path.join(output_dir, "retencion_islr_test.xml")
    with open(xml_islr_path, "wb") as f:
        f.write(xml_islr)
    print(f"  XML ISLR: {xml_islr_path} ({len(xml_islr):,} bytes)")

    print(f"\nTodos los archivos en: {output_dir}/")
    print("Datos de prueba:")
    print("  IVA: Factura 15.800 Bs → Base 13.620,69 → IVA 2.179,31 → Ret 75% = 1.634,48 Bs")
    print("  ISLR: Factura 42.500 Bs → Base 42.500,00 → Ret 2% = 850,00 Bs")


if __name__ == "__main__":
    main()

import ProductCatalog from "@/components/ProductCatalog";
import CTA from "@/components/CTA";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Productos AIDA - Números de Control, Documentos Fiscales e Integraciones ERP",
  description:
    "Catálogo completo: paquetes de números de control desde 500 hasta 50,000, facturas electrónicas, notas de crédito, guías de despacho, conectores SAP, Odoo, WooCommerce. Precios transparentes con SKU y activación inmediata.",
  keywords: [
    "números de control SENIAT precio",
    "paquetes facturación electrónica",
    "integración SAP facturación Venezuela",
    "conector Odoo imprenta digital",
    "SKU documentos fiscales",
  ],
};

export default function ProductosPage() {
  return (
    <>
      <div className="pt-16">
        <ProductCatalog />
      </div>
      <CTA />
    </>
  );
}

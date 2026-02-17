import ProductCatalog from "@/components/ProductCatalog";
import CTA from "@/components/CTA";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Productos y Catálogo de SKUs",
  description:
    "Catálogo completo de productos AIDA: números de control, documentos fiscales, integraciones ERP. Cada producto con su SKU, precio transparente y activación inmediata.",
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

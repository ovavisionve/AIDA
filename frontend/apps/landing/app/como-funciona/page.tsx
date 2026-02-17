import HowItWorks from "@/components/HowItWorks";
import Integrations from "@/components/Integrations";
import CTA from "@/components/CTA";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cómo Funciona AIDA",
  description:
    "De cero a facturando en 4 pasos. Registro, conexión de ERP, emisión de documentos y respaldo con IA. Integraciones con SAP, Odoo, WooCommerce y más.",
};

export default function ComoFuncionaPage() {
  return (
    <>
      <div className="pt-16">
        <HowItWorks />
        <Integrations />
      </div>
      <CTA />
    </>
  );
}

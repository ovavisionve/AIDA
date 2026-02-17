import ProcessTimeline from "@/components/ProcessTimeline";
import HowItWorks from "@/components/HowItWorks";
import Integrations from "@/components/Integrations";
import CTA from "@/components/CTA";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cómo Funciona AIDA - Proceso de Facturación Digital con IA",
  description:
    "De diagnóstico a operación en 4 fases: análisis fiscal, configuración, integración técnica y emisión automatizada. Wizard sin código para SAP, Odoo, WooCommerce. Tu empresa emite documentos en menos de 48 horas.",
  keywords: [
    "cómo funciona facturación electrónica",
    "proceso imprenta digital Venezuela",
    "integración ERP facturación",
    "wizard integración SAP Odoo",
    "configuración imprenta SENIAT",
  ],
};

export default function ComoFuncionaPage() {
  return (
    <>
      <div className="pt-16">
        <ProcessTimeline />
        <div className="section-divider" />
        <HowItWorks />
        <div className="section-divider" />
        <Integrations />
      </div>
      <CTA />
    </>
  );
}

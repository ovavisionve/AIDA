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
    "facturación electrónica proceso",
    "integrar sistema con SENIAT",
  ],
  openGraph: {
    title: "Cómo Funciona AIDA - De diagnóstico a facturación en 48 horas",
    description:
      "4 fases claras: diagnóstico fiscal, configuración, integración técnica y emisión automatizada con IA. Wizard sin código para SAP, Odoo, WooCommerce.",
    url: "https://aida.com.ve/como-funciona",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  alternates: {
    canonical: "https://aida.com.ve/como-funciona",
  },
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

      {/* JSON-LD: HowTo */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: "Cómo funciona la facturación electrónica con AIDA",
            description:
              "Proceso completo para emitir documentos fiscales electrónicos en Venezuela con AIDA: desde el diagnóstico fiscal hasta la emisión automatizada con IA.",
            totalTime: "PT48H",
            step: [
              {
                "@type": "HowToStep",
                position: 1,
                name: "Diagnóstico Fiscal",
                text: "Analizamos tu situación fiscal actual, volumen de documentos, sistemas existentes y necesidades específicas.",
              },
              {
                "@type": "HowToStep",
                position: 2,
                name: "Configuración y Setup",
                text: "Configuramos tu cuenta AIDA: datos fiscales, números de control SENIAT, personalización de plantillas y usuarios.",
              },
              {
                "@type": "HowToStep",
                position: 3,
                name: "Integración Técnica",
                text: "Conectamos AIDA con tu ERP o sistema actual mediante wizard guiado de 6 pasos sin escribir código.",
              },
              {
                "@type": "HowToStep",
                position: 4,
                name: "Emisión y Operación",
                text: "Tu empresa emite documentos fiscales con supervisión IA 24/7. Cada documento con número de control, firma digital, QR y PDF automáticamente.",
              },
            ],
          }),
        }}
      />
    </>
  );
}

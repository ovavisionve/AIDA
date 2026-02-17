import Pricing from "@/components/Pricing";
import CTA from "@/components/CTA";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planes y Precios - Facturación Electrónica desde $29/mes",
  description:
    "Planes AIDA: Básico ($29/mes, 500 docs), Profesional ($79/mes, 5,000 docs), Empresarial ($149/mes, ilimitado). Incluye IA, cumplimiento SENIAT, soporte 24/7 y actualizaciones. Sin costos ocultos.",
  keywords: [
    "precios facturación electrónica Venezuela",
    "planes imprenta digital",
    "cuánto cuesta AIDA",
    "precio documentos fiscales",
    "suscripción facturación SENIAT",
  ],
};

export default function PlanesPage() {
  return (
    <>
      <div className="pt-16">
        <Pricing />
      </div>
      <CTA />
    </>
  );
}

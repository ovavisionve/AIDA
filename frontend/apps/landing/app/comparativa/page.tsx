import CompetitorComparison from "@/components/CompetitorComparison";
import WhyAida from "@/components/WhyAida";
import CTA from "@/components/CTA";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AIDA vs Imprentas Tradicionales - Comparativa Facturación Digital Venezuela",
  description:
    "Comparación detallada entre AIDA y las imprentas digitales convencionales en Venezuela. IA integrada, API REST, procesamiento en 3 segundos, integraciones ERP nativas. Descubre por qué AIDA es la plataforma fiscal más avanzada del país.",
  keywords: [
    "comparativa imprentas digitales Venezuela",
    "mejor imprenta digital SENIAT",
    "facturación electrónica IA Venezuela",
    "AIDA vs imprentas tradicionales",
    "plataforma fiscal avanzada",
  ],
};

export default function ComparativaPage() {
  return (
    <>
      <div className="pt-16">
        <CompetitorComparison />
        <div className="section-divider" />
        <WhyAida />
      </div>
      <CTA />
    </>
  );
}

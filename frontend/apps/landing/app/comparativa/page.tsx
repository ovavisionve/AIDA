import CompetitorComparison from "@/components/CompetitorComparison";
import WhyAida from "@/components/WhyAida";
import CTA from "@/components/CTA";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AIDA vs Competencia - Comparativa de Imprentas Digitales Venezuela",
  description:
    "Comparación detallada entre AIDA y las imprentas digitales autorizadas en Venezuela: Unidigital, Serdimpre, Smart Factura, The Factory HKA, CG La Imprenta Digital e Imprime 360.",
};

export default function ComparativaPage() {
  return (
    <>
      <div className="pt-16">
        <CompetitorComparison />
        <WhyAida />
      </div>
      <CTA />
    </>
  );
}

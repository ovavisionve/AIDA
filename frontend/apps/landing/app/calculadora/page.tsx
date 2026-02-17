import SavingsCalculator from "@/components/SavingsCalculator";
import CTA from "@/components/CTA";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculadora de Ahorro",
  description:
    "Calcula cuánto dinero y tiempo ahorras al migrar tu facturación a AIDA. Ajusta tu volumen mensual de documentos y obtén un estimado en tiempo real.",
};

export default function CalculadoraPage() {
  return (
    <>
      <div className="pt-16">
        <SavingsCalculator />
      </div>
      <CTA />
    </>
  );
}

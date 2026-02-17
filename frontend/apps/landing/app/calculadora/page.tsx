import SavingsCalculator from "@/components/SavingsCalculator";
import CTA from "@/components/CTA";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculadora de Ahorro en Facturación Electrónica Venezuela",
  description:
    "Calcula cuánto dinero y tiempo ahorra tu empresa al migrar a AIDA. Ajusta volumen mensual, costo actual y empleados involucrados. Empresas con 20,000 documentos ahorran hasta $6,700/mes. Resultado en tiempo real.",
  keywords: [
    "calculadora ahorro facturación",
    "cuánto cuesta facturación electrónica Venezuela",
    "ahorro imprenta digital",
    "costo números de control SENIAT",
    "ROI facturación electrónica",
  ],
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

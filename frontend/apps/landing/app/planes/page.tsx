import Pricing from "@/components/Pricing";
import CTA from "@/components/CTA";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planes y Precios",
  description:
    "Planes de AIDA desde $29/mes. Básico, Profesional y Empresarial. Precios transparentes, sin costos ocultos. Todos incluyen cumplimiento SENIAT y actualizaciones.",
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

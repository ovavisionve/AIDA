import Blog from "@/components/Blog";
import CTA from "@/components/CTA";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog - Facturación Electrónica Venezuela | Artículos y Guías",
  description:
    "Artículos, guías y recursos sobre imprentas digitales, facturación electrónica, cumplimiento SENIAT, números de control y cómo la inteligencia artificial está revolucionando la facturación en Venezuela.",
  keywords: [
    "blog facturación electrónica Venezuela",
    "guía SENIAT imprenta digital",
    "números de control fiscal Venezuela",
    "facturación electrónica IA",
    "artículos impresión fiscal",
  ],
};

export default function BlogPage() {
  return (
    <>
      <div className="pt-16">
        <Blog />
      </div>
      <CTA />
    </>
  );
}

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
  openGraph: {
    title: "Blog AIDA - Artículos sobre Facturación Electrónica Venezuela",
    description: "Guías, tutoriales y artículos sobre imprentas digitales, cumplimiento SENIAT, números de control, IA en facturación y más.",
    url: "https://aida.com.ve/blog",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  alternates: {
    canonical: "https://aida.com.ve/blog",
  },
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

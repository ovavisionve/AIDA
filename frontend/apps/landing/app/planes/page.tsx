import Pricing from "@/components/Pricing";
import CTA from "@/components/CTA";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planes y Precios - Facturación Electrónica desde $15/mes | AIDA",
  description:
    "5 modalidades de servicio AIDA: Solo Facturador ($19-$89), Solo Imprenta Digital ($15-$79), Completo ($29-$149), + Integración ERP ($89-$349). Sin costos ocultos, $0 implementación. Cumplimiento SENIAT incluido.",
  keywords: [
    "precios facturación electrónica Venezuela",
    "planes imprenta digital",
    "cuánto cuesta AIDA",
    "precio documentos fiscales",
    "números de control SENIAT precio",
    "integración ERP facturación Venezuela",
    "suscripción facturación SENIAT",
  ],
  openGraph: {
    title: "Planes AIDA - 5 Modalidades desde $15/mes",
    description: "Solo Facturador, Solo Imprenta Digital, Completo, + Integración ERP. Desde $15/mes con cumplimiento SENIAT automático.",
    url: "https://aida.com.ve/planes",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  alternates: {
    canonical: "https://aida.com.ve/planes",
  },
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

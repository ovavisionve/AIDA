import Hero from "@/components/Hero";
import Features from "@/components/Features";
import ExploraAida from "@/components/ExploraAida";
import ProcessTimeline from "@/components/ProcessTimeline";
import Blog from "@/components/Blog";
import Testimonials from "@/components/Testimonials";
import CTA from "@/components/CTA";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AIDA - Imprenta Digital con IA | Facturación Electrónica Venezuela",
};

export default function Home() {
  return (
    <>
      <Hero />
      <Features />

      {/* Quick links to sub-pages */}
      <ExploraAida />

      <div className="section-divider" />
      <ProcessTimeline />
      <div className="section-divider" />
      <Blog />
      <div className="section-divider" />
      <Testimonials />
      <CTA />

      {/* JSON-LD: Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "AIDA Imprenta Digital C.A.",
            url: "https://aida.com.ve",
            logo: "https://aida.com.ve/logo.png",
            description:
              "La primera imprenta digital en Venezuela gestionada por Inteligencia Artificial. Facturación electrónica, cumplimiento SENIAT automático.",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Caracas",
              addressCountry: "VE",
            },
            contactPoint: {
              "@type": "ContactPoint",
              email: "info@aida.com.ve",
              contactType: "sales",
              availableLanguage: "Spanish",
            },
            sameAs: [],
          }),
        }}
      />
      {/* JSON-LD: SoftwareApplication */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "AIDA Imprenta Digital",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            description:
              "Plataforma de facturación electrónica e imprenta digital con Inteligencia Artificial para Venezuela. Emite documentos fiscales en menos de 3 segundos con cumplimiento SENIAT automático.",
            url: "https://aida.com.ve",
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "USD",
              lowPrice: "29",
              highPrice: "149",
              offerCount: "3",
            },
            featureList:
              "IA integrada, API REST, Compatible con +100 ERPs, Cumplimiento SENIAT, Providencia 102 y 121, Procesamiento batch masivo, Soporte 24/7",
          }),
        }}
      />
      {/* JSON-LD: FAQ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "¿Qué es AIDA?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "AIDA es la primera imprenta digital en Venezuela gestionada por Inteligencia Artificial. Permite emitir facturas electrónicas, notas de crédito, notas de débito, guías de despacho y retenciones con cumplimiento SENIAT automático en menos de 3 segundos.",
                },
              },
              {
                "@type": "Question",
                name: "¿AIDA cumple con la normativa del SENIAT?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Sí. AIDA cumple con la Providencia 102 (Facturación Digital) y la Providencia 121 (Homologación de Sistemas). Todos los documentos incluyen número de control, firma digital, QR de verificación y trazabilidad completa según lo exige el SENIAT.",
                },
              },
              {
                "@type": "Question",
                name: "¿Cuánto cuesta AIDA?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "AIDA ofrece planes desde $29/mes (Básico, 500 documentos), $79/mes (Profesional, 5,000 documentos) y $149/mes (Empresarial, documentos ilimitados). Todos incluyen IA, cumplimiento SENIAT y soporte.",
                },
              },
              {
                "@type": "Question",
                name: "¿Se puede integrar AIDA con mi ERP?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Sí. AIDA es compatible con más de 100 ERPs del mercado. Si tu sistema no está en la lista, nos adaptamos. También cuenta con una API REST documentada para integraciones personalizadas. El wizard de integración permite conectar tu sistema en horas sin escribir código.",
                },
              },
            ],
          }),
        }}
      />
    </>
  );
}

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Integrations from "@/components/Integrations";
import WhyAida from "@/components/WhyAida";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AIDA - Imprenta Digital con IA | Facturación Electrónica Venezuela",
};

export default function Home() {
  return (
    <main className="bg-aida-dark text-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Integrations />
      <WhyAida />
      <Pricing />
      <Testimonials />
      <CTA />
      <Footer />

      {/* JSON-LD Structured Data for SEO */}
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
              "Plataforma de facturación electrónica e imprenta digital con Inteligencia Artificial para Venezuela. Cumplimiento SENIAT automático.",
            url: "https://aida.com.ve",
            author: {
              "@type": "Organization",
              name: "AIDA Imprenta Digital C.A.",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Caracas",
                addressCountry: "VE",
              },
            },
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "USD",
              lowPrice: "29",
              highPrice: "199",
              offerCount: "4",
            },
            featureList: [
              "Facturación electrónica",
              "Números de control SENIAT",
              "Integración SAP, Odoo, WooCommerce",
              "Inteligencia Artificial",
              "API REST",
              "Generación PDF/XML",
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "AIDA Imprenta Digital",
            url: "https://aida.com.ve",
            logo: "https://aida.com.ve/logo.png",
            contactPoint: {
              "@type": "ContactPoint",
              telephone: "+58-XXX-XXXXXXX",
              contactType: "sales",
              areaServed: "VE",
              availableLanguage: "Spanish",
            },
            sameAs: [],
          }),
        }}
      />
    </main>
  );
}

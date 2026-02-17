import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Testimonials from "@/components/Testimonials";
import CTA from "@/components/CTA";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AIDA - Imprenta Digital con IA | Facturación Electrónica Venezuela",
};

export default function Home() {
  return (
    <>
      <Hero />
      <Features />

      {/* Quick links to sub-pages */}
      <section className="py-24 sm:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-aida-accent/5 to-transparent pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-aida-cyan">
              Explora AIDA
            </h2>
            <p className="mt-3 text-3xl sm:text-4xl font-bold">
              Todo lo que necesitas,{" "}
              <span className="gradient-text">en un solo lugar</span>
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                href: "/calculadora",
                title: "Calculadora de Ahorro",
                desc: "Descubre cuánto dinero y tiempo ahorras migrando a AIDA. Ajusta tu volumen y ve el resultado en tiempo real.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                ),
              },
              {
                href: "/productos",
                title: "Productos y SKUs",
                desc: "Números de control, documentos fiscales, integraciones ERP. Cada producto con su código y precio transparente.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                ),
              },
              {
                href: "/comparativa",
                title: "AIDA vs Competencia",
                desc: "Comparamos AIDA con cada imprenta digital autorizada en Venezuela. Datos reales, sin marketing vacío.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                ),
              },
              {
                href: "/planes",
                title: "Planes y Precios",
                desc: "Desde emprendedores hasta corporaciones. Precios transparentes, sin costos ocultos. Cumplimiento SENIAT incluido.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
            ].map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group glass-card p-6 hover:bg-white/[0.08] hover:border-aida-accent/20 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-aida-accent/20 to-aida-cyan/20 flex items-center justify-center text-aida-cyan group-hover:scale-110 transition-transform">
                  {card.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white group-hover:text-aida-cyan transition-colors">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{card.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm text-aida-cyan font-medium group-hover:gap-2 transition-all">
                  Explorar
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Testimonials />
      <CTA />

      {/* JSON-LD */}
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
              "Plataforma de facturación electrónica e imprenta digital con Inteligencia Artificial para Venezuela.",
            url: "https://aida.com.ve",
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "USD",
              lowPrice: "29",
              highPrice: "299",
              offerCount: "4",
            },
          }),
        }}
      />
    </>
  );
}

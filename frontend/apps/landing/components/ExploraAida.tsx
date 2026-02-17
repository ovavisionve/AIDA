"use client";

import Link from "next/link";
import AnimateOnScroll from "@/components/AnimateOnScroll";

const cards = [
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
    title: "AIDA vs Imprentas Tradicionales",
    desc: "Descubre por qué AIDA es la plataforma de impresión fiscal más avanzada de Venezuela. Datos reales, sin marketing vacío.",
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
];

export default function ExploraAida() {
  return (
    <section className="py-24 sm:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-aida-accent/5 to-transparent pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll animation="fade-in">
          <div className="text-center mb-16">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-aida-cyan">
              Explora AIDA
            </h2>
            <p className="mt-3 text-3xl sm:text-4xl font-bold">
              Todo lo que necesitas,{" "}
              <span className="gradient-text">en un solo lugar</span>
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => (
            <AnimateOnScroll key={card.href} animation="slide-up" delay={i * 100} duration={700}>
              <Link
                href={card.href}
                className="group glass-card p-6 hover:bg-white/[0.08] hover:border-aida-accent/20 transition-all duration-300 block h-full"
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
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import AnimateOnScroll from "@/components/AnimateOnScroll";

const articles = [
  {
    category: "Educación",
    categoryColor: "from-aida-accent to-blue-400",
    title: "¿Qué es una imprenta digital autorizada por el SENIAT?",
    description:
      "Una imprenta digital autorizada es una empresa habilitada por el SENIAT mediante Providencia Administrativa para generar documentos fiscales electrónicos con validez legal. Conoce los requisitos de autorización, las obligaciones que implica y por qué tu empresa debe trabajar exclusivamente con imprentas autorizadas para garantizar el cumplimiento tributario.",
    readTime: "8 min de lectura",
    date: "12 Ene 2025",
    slug: "/blog/imprenta-digital-autorizada-seniat",
    featured: true,
  },
  {
    category: "Guía",
    categoryColor: "from-aida-cyan to-teal-400",
    title: "Facturación electrónica en Venezuela: Guía completa 2025",
    description:
      "Todo lo que necesitas saber sobre facturación electrónica en Venezuela: desde los requisitos legales establecidos en la Providencia SNAT/2024/000121, el proceso de emisión de documentos fiscales, hasta los beneficios de migrar de facturación manual a digital. Incluye pasos detallados para iniciar.",
    readTime: "12 min de lectura",
    date: "28 Dic 2024",
    slug: "/blog/facturacion-electronica-venezuela-guia-2025",
    featured: false,
  },
  {
    category: "Legal",
    categoryColor: "from-violet-500 to-purple-400",
    title: "Números de control fiscal: Todo lo que debes saber",
    description:
      "Los números de control son secuencias únicas asignadas por el SENIAT a cada imprenta autorizada para garantizar la trazabilidad de los documentos fiscales. Aprende cómo se asignan, cómo se validan, qué pasa si se agotan y cómo AIDA gestiona automáticamente tus rangos.",
    readTime: "6 min de lectura",
    date: "15 Dic 2024",
    slug: "/blog/numeros-de-control-fiscal",
    featured: false,
  },
  {
    category: "Tecnología",
    categoryColor: "from-amber-500 to-orange-400",
    title: "Cómo la IA está transformando la facturación empresarial",
    description:
      "La inteligencia artificial aplicada a la facturación permite detectar anomalías en documentos fiscales antes de emitirlos, automatizar la clasificación de gastos, predecir patrones de facturación y asistir en tiempo real a contadores y administradores. Descubre cómo AIDA usa IA para proteger tu empresa.",
    readTime: "7 min de lectura",
    date: "3 Dic 2024",
    slug: "/blog/ia-transformando-facturacion",
    featured: false,
  },
  {
    category: "Tips",
    categoryColor: "from-rose-500 to-pink-400",
    title: "5 errores comunes al emitir documentos fiscales y cómo evitarlos",
    description:
      "Desde emitir notas de crédito con montos superiores al documento original, hasta usar números de control vencidos o no incluir la alícuota de IVA correcta. Estos errores pueden resultar en multas del SENIAT. Te mostramos los 5 más frecuentes y cómo la tecnología te protege.",
    readTime: "5 min de lectura",
    date: "20 Nov 2024",
    slug: "/blog/errores-comunes-documentos-fiscales",
    featured: false,
  },
  {
    category: "Integraciones",
    categoryColor: "from-emerald-500 to-green-400",
    title: "Integración ERP + Imprenta Digital: La combinación perfecta",
    description:
      "Conectar tu ERP (SAP Business One, Odoo, WooCommerce, PrestaShop) con una imprenta digital elimina la doble carga de datos y los errores humanos. Conoce cómo funciona la integración, qué datos se sincronizan y por qué el wizard de AIDA lo hace posible sin escribir código.",
    readTime: "9 min de lectura",
    date: "8 Nov 2024",
    slug: "/blog/integracion-erp-imprenta-digital",
    featured: false,
  },
];

export default function Blog() {
  return (
    <section id="blog" className="relative py-24 sm:py-32">
      {/* Ambient glows */}
      <div className="absolute top-20 right-1/4 w-80 h-80 bg-aida-accent/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 left-1/4 w-72 h-72 bg-aida-cyan/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <AnimateOnScroll animation="fade-in">
          <div className="text-center mb-16">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-aida-cyan">
              Blog e Insights
            </h2>
            <p className="mt-3 text-3xl sm:text-4xl font-bold">
              Contenido educativo sobre{" "}
              <span className="gradient-text">facturación digital</span>
            </p>
            <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
              Artículos, guías y recursos para que entiendas todo sobre imprentas
              digitales, cumplimiento SENIAT, números de control y cómo la
              tecnología está revolucionando la facturación en Venezuela.
            </p>
          </div>
        </AnimateOnScroll>

        {/* Articles grid */}
        <div className="perspective-container grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, i) => (
            <AnimateOnScroll key={article.title} animation="slide-up" delay={i * 100} duration={700}>
              <article
                className={`tilt-card glass-card group flex flex-col overflow-hidden hover:bg-white/[0.08] hover:border-aida-accent/20 transition-all duration-500 h-full ${
                  i === 0 ? "sm:col-span-2 lg:col-span-2" : ""
                }`}
              >
                {/* Gradient accent top bar */}
                <div
                  className={`h-1 w-full bg-gradient-to-r ${article.categoryColor}`}
                />

                <div className="flex flex-col flex-1 p-6">
                  {/* Category + Date row */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${article.categoryColor} bg-clip-text text-transparent border border-white/10`}
                    >
                      {article.category}
                    </span>
                    <span className="text-xs text-slate-500">
                      {article.date}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-white group-hover:text-aida-cyan transition-colors leading-snug">
                    {article.title}
                  </h3>

                  {/* Description */}
                  <p
                    className={`mt-3 text-sm text-slate-400 leading-relaxed flex-1 ${
                      i === 0 ? "" : "line-clamp-3"
                    }`}
                  >
                    {article.description}
                  </p>

                  {/* Footer: Read time + Link */}
                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {article.readTime}
                    </div>

                    <a
                      href={article.slug}
                      className="inline-flex items-center gap-1 text-sm font-medium text-aida-cyan hover:gap-2 transition-all"
                    >
                      Leer más
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              </article>
            </AnimateOnScroll>
          ))}
        </div>

        {/* CTA bottom */}
        <AnimateOnScroll animation="fade-in" delay={300}>
          <div className="mt-12 text-center">
            <a
              href="#"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-all"
            >
              Ver todos los artículos
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </a>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}

"use client";

import AnimateOnScroll from "@/components/AnimateOnScroll";

const articles = [
  {
    category: "Normativa",
    categoryColor: "from-aida-accent to-blue-400",
    title: "Providencia 102: Todo sobre la Facturación Digital en Venezuela",
    description:
      "La Providencia 102 del SENIAT establece las normas para la facturación digital en Venezuela. Conoce qué exige, cómo afecta a tu empresa, cuáles son los plazos de cumplimiento y por qué es fundamental que tu sistema de facturación esté alineado con esta normativa para evitar sanciones y garantizar la validez legal de tus documentos fiscales.",
    readTime: "10 min de lectura",
    date: "15 Ene 2025",
    slug: "/blog/providencia-102-facturacion-digital",
    featured: true,
  },
  {
    category: "Homologación",
    categoryColor: "from-aida-cyan to-teal-400",
    title: "Providencia 121: Homologación de Sistemas Fiscales ante el SENIAT",
    description:
      "La Providencia 121 regula la homologación de los sistemas de facturación y emisión de documentos fiscales en Venezuela. Entiende qué significa homologar tu sistema, qué requisitos técnicos debe cumplir tu plataforma, y cómo AIDA ya está homologada para que tú no tengas que preocuparte por este proceso.",
    readTime: "12 min de lectura",
    date: "28 Dic 2024",
    slug: "/blog/providencia-121-homologacion-sistemas",
    featured: false,
  },
  {
    category: "Cumplimiento",
    categoryColor: "from-violet-500 to-purple-400",
    title: "¿Por qué es urgente que tu empresa migre a la facturación digital?",
    description:
      "Las providencias 102 y 121 del SENIAT no son opcionales. Las empresas que no cumplan con la normativa de facturación digital y homologación de sistemas enfrentan sanciones, multas y la invalidez de sus documentos fiscales. Te explicamos los riesgos de no cumplir y cómo puedes migrar de forma rápida y segura.",
    readTime: "8 min de lectura",
    date: "15 Dic 2024",
    slug: "/blog/urgencia-migracion-facturacion-digital",
    featured: false,
  },
  {
    category: "Fiscal",
    categoryColor: "from-amber-500 to-orange-400",
    title: "Homologación fiscal: Qué es, por qué importa y cómo cumplir",
    description:
      "La homologación es el proceso mediante el cual el SENIAT certifica que tu sistema de facturación cumple con los estándares técnicos y legales vigentes. Si tu empresa emite documentos fiscales, este proceso es obligatorio. Conoce los pasos, requisitos y cómo AIDA simplifica todo el camino hacia la homologación.",
    readTime: "7 min de lectura",
    date: "3 Dic 2024",
    slug: "/blog/homologacion-fiscal-como-cumplir",
    featured: false,
  },
  {
    category: "Legal",
    categoryColor: "from-rose-500 to-pink-400",
    title: "Sanciones del SENIAT por incumplimiento de normativas fiscales",
    description:
      "No cumplir con las providencias 102 y 121 puede resultar en multas significativas, cierre temporal del establecimiento y la invalidez de tus documentos fiscales. Conoce las sanciones específicas, los plazos que tienes para regularizarte y cómo proteger tu empresa con una plataforma ya homologada.",
    readTime: "6 min de lectura",
    date: "20 Nov 2024",
    slug: "/blog/sanciones-seniat-incumplimiento",
    featured: false,
  },
  {
    category: "Guía",
    categoryColor: "from-emerald-500 to-green-400",
    title: "Guía paso a paso: Cómo cumplir con las normativas fiscales digitales",
    description:
      "Una guía práctica para empresas que necesitan cumplir con la Providencia 102 y la Providencia 121 del SENIAT. Desde entender los requisitos hasta implementar una solución homologada, te mostramos el camino más rápido para estar al día con las normativas fiscales en Venezuela.",
    readTime: "9 min de lectura",
    date: "8 Nov 2024",
    slug: "/blog/guia-cumplimiento-normativas-fiscales",
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
              Normativas fiscales y{" "}
              <span className="gradient-text">cumplimiento SENIAT</span>
            </p>
            <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
              Artículos, guías y recursos sobre la Providencia 102, la Providencia 121,
              homologación de sistemas, cumplimiento fiscal y todo lo que tu empresa
              necesita saber para operar dentro de la normativa SENIAT.
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

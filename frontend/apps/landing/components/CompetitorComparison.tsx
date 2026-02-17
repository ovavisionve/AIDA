"use client";

import AnimateOnScroll from "@/components/AnimateOnScroll";

const comparisonCategories = [
  {
    category: "Implementación",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    others: {
      title: "Lo convencional",
      desc: "Proceso de implementación que puede tomar semanas o meses, con múltiples reuniones y configuraciones",
    },
    aida: {
      title: "AIDA",
      desc: "Implementación en menos de 48 horas. Autogestión completa sin costo de implementación. Tu empresa opera desde el primer día",
    },
  },
  {
    category: "Resolución de problemas",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.42 15.17l-5.1-5.1m0 0L12 4.37m-5.68 5.7h11.8M4.26 19.72a9.94 9.94 0 005.74 2.27c5.52 0 10-4.48 10-10" />
      </svg>
    ),
    others: {
      title: "Lo convencional",
      desc: "Tickets de soporte con tiempos de espera variables, resolución que depende de disponibilidad del equipo",
    },
    aida: {
      title: "AIDA",
      desc: "Resolución inmediata con IA 24/7. Detección proactiva de problemas antes de que ocurran. Respuestas instantáneas a cualquier consulta fiscal",
    },
  },
  {
    category: "Integraciones",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    ),
    others: {
      title: "Lo convencional",
      desc: "Integraciones limitadas a ciertos ERPs, procesos de conexión que requieren desarrollo a medida",
    },
    aida: {
      title: "AIDA",
      desc: "Más de 100 ERPs compatibles, API REST documentada, webhooks en tiempo real, y nos adaptamos a cualquier sistema que uses",
    },
  },
  {
    category: "Inteligencia Artificial",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    others: {
      title: "Lo convencional",
      desc: "Validaciones basicas y emisión de documentos estándar sin asistencia inteligente",
    },
    aida: {
      title: "AIDA",
      desc: "IA entrenada en normativa fiscal venezolana: detecta anomalías, valida campos, sugiere correcciones y responde consultas fiscales 24/7",
    },
  },
  {
    category: "Autogestión",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
    others: {
      title: "Lo convencional",
      desc: "Dependencia del proveedor para configuraciones, cambios y ajustes en la plataforma",
    },
    aida: {
      title: "AIDA",
      desc: "Autogestión total: configura plantillas, usuarios, integraciones y emite documentos sin depender de nadie. Tú controlas todo",
    },
  },
  {
    category: "Escalabilidad",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
    others: {
      title: "Lo convencional",
      desc: "Escalado que requiere negociaciones, contratos adicionales y tiempos de espera",
    },
    aida: {
      title: "AIDA",
      desc: "Cloud nativo, escala automática según tu demanda. Sin límites de volumen, disponibilidad 99.9%. Cuando tu negocio crece, AIDA crece contigo",
    },
  },
];

const featureMatrix = [
  { feature: "IA integrada", aida: true, others: false },
  { feature: "API REST publica", aida: true, others: false },
  { feature: "Procesamiento batch masivo", aida: true, others: false },
  { feature: "Self-service (registro inmediato)", aida: true, others: false },
  { feature: "Integraciones ERP nativas", aida: true, others: false },
  { feature: "Webhooks y callbacks", aida: true, others: false },
  { feature: "Multiples plantillas de diseno", aida: true, others: false },
  { feature: "Cloud nativo", aida: true, others: false },
  { feature: "Cumplimiento SENIAT", aida: true, others: true },
  { feature: "Portal web de gestion", aida: true, others: true },
];

const pillars = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    label: "IA Real",
    title: "No es un chatbot generico",
    description:
      "AIDA no es una interfaz de conversacion generica conectada a un modelo de lenguaje. Es una inteligencia artificial entrenada especificamente en la normativa fiscal venezolana: providencias SENIAT, calculo de IVA, retenciones de ISLR, formatos de documentos fiscales y validaciones de numeros de control. Detecta anomalias antes de emitir, sugiere correcciones en tiempo real y aprende de los patrones de cada empresa. Ninguna otra plataforma de impresion fiscal en Venezuela ofrece esta capacidad.",
    highlight: "Entrenada en SENIAT, IVA e ISLR",
    gradient: "from-violet-500/20 to-aida-accent/20",
    border: "border-violet-500/20",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    label: "API-First",
    title: "Infraestructura fiscal como servicio",
    description:
      "AIDA es infraestructura fiscal como servicio. API REST completamente documentada con ejemplos en cURL, Python y JavaScript. API Keys, rate limiting, webhooks, callbacks y procesamiento batch de hasta 50,000 documentos por request. Compatible con más de 100 ERPs del mercado, y si el tuyo no está en la lista, nos adaptamos. Tu sistema se conecta con AIDA en horas, no en semanas.",
    highlight: "Más de 100 ERPs compatibles",
    gradient: "from-aida-cyan/20 to-blue-500/20",
    border: "border-aida-cyan/20",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    label: "Velocidad",
    title: "Implementación en 48 horas",
    description:
      "Nuestra mayor ventaja: velocidad de implementación. Mientras otros procesos de alta pueden tomar semanas, con AIDA tu empresa emite documentos fiscales en menos de 48 horas. Autogestión completa, sin costo de implementación. Cloud nativo que escala automáticamente según la demanda: sin servidores locales, sin licencias, sin mantenimiento. Cuando tu negocio crece, AIDA crece contigo.",
    highlight: "48 horas de implementación",
    gradient: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/20",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: "Resolución",
    title: "Resolución inmediata de problemas",
    description:
      "Cuando tienes un problema fiscal, no puedes esperar. AIDA ofrece resolución inmediata a través de una IA entrenada en normativa venezolana que está disponible 24/7. Detección proactiva de anomalías, alertas inteligentes y un equipo de soporte que responde de forma inmediata. Sin tickets, sin esperas, sin incertidumbre. Tu operación fiscal nunca se detiene.",
    highlight: "Soporte inmediato 24/7",
    gradient: "from-green-500/20 to-emerald-500/20",
    border: "border-green-500/20",
  },
];

export default function CompetitorComparison() {
  return (
    <section id="comparativa" className="py-24 sm:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <AnimateOnScroll animation="fade-in">
          <div className="text-center mb-20">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-aida-cyan">
              ¿Por qué AIDA?
            </h2>
            <p className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold">
              La unica imprenta digital en Venezuela{" "}
              <span className="gradient-text">gestionada por IA</span>
            </p>
            <p className="mt-5 text-slate-400 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
              Velocidad de implementación, resolución inmediata de problemas y
              autogestión total. Estas son nuestras verdaderas ventajas.
            </p>
          </div>
        </AnimateOnScroll>

        {/* ── Comparison Cards Side-by-Side ── */}
        <div className="mb-24">
          <AnimateOnScroll animation="fade-in">
            <h3 className="text-center text-xl sm:text-2xl font-bold text-white mb-4">
              Lo convencional vs lo que ofrece{" "}
              <span className="gradient-text">AIDA</span>
            </h3>
            <p className="text-center text-sm text-slate-500 mb-12 max-w-xl mx-auto">
              Seis áreas clave donde AIDA marca la diferencia
            </p>
          </AnimateOnScroll>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {comparisonCategories.map((cat, i) => (
              <AnimateOnScroll key={cat.category} animation="slide-up" delay={i * 100} duration={700}>
                <div className="perspective-container h-full">
                  <div className="tilt-card glass-card p-6 h-full flex flex-col">
                    {/* Category Header */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-aida-accent/20 to-aida-cyan/20 flex items-center justify-center text-aida-cyan shrink-0">
                        {cat.icon}
                      </div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-white">
                        {cat.category}
                      </h4>
                    </div>

                    {/* Others */}
                    <div className="mb-4 rounded-xl bg-red-500/[0.04] border border-red-500/10 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-red-400/70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-red-400/70">
                          {cat.others.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {cat.others.desc}
                      </p>
                    </div>

                    {/* AIDA */}
                    <div className="rounded-xl bg-aida-cyan/[0.04] border border-aida-cyan/15 p-4 mt-auto">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-aida-cyan shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-aida-cyan">
                          {cat.aida.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {cat.aida.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>

        {/* ── Feature Comparison Matrix ── */}
        <AnimateOnScroll animation="scale-in" duration={800}>
          <div className="mb-24">
            <h3 className="text-center text-xl sm:text-2xl font-bold text-white mb-4">
              Matriz de funcionalidades
            </h3>
            <p className="text-center text-sm text-slate-500 mb-10 max-w-lg mx-auto">
              Funcionalidades disponibles en AIDA comparadas con lo que ofrecen
              las plataformas convencionales en Venezuela
            </p>

            <div className="glow-blue overflow-hidden rounded-2xl border border-white/10 max-w-3xl mx-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-500 font-semibold">
                      Funcionalidad
                    </th>
                    <th className="px-6 py-4 text-center text-xs uppercase tracking-wider font-semibold w-32">
                      <span className="gradient-text">AIDA</span>
                    </th>
                    <th className="px-6 py-4 text-center text-xs uppercase tracking-wider text-slate-600 font-semibold w-32">
                      Otras
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {featureMatrix.map((row) => (
                    <tr
                      key={row.feature}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-3.5 text-slate-300 text-sm">
                        {row.feature}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500/10">
                          <svg
                            className="w-4 h-4 text-green-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        {row.others ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500/5">
                            <svg
                              className="w-4 h-4 text-green-400/40"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500/10">
                            <svg
                              className="w-4 h-4 text-red-400/60"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary row */}
              <div className="border-t border-white/10 bg-white/[0.02] px-6 py-4 flex items-center justify-between">
                <span className="text-xs text-slate-500">Total de funcionalidades</span>
                <div className="flex items-center gap-8">
                  <span className="text-sm font-bold text-aida-cyan">
                    10 / 10
                  </span>
                  <span className="text-sm font-bold text-red-400/60">
                    2 / 10
                  </span>
                </div>
              </div>
            </div>
          </div>
        </AnimateOnScroll>

        {/* ── Los 4 Pilares de AIDA ── */}
        <div className="mb-20">
          <AnimateOnScroll animation="fade-in">
            <h3 className="text-center text-xl sm:text-2xl font-bold text-white mb-3">
              Los 4 pilares de <span className="gradient-text">AIDA</span>
            </h3>
            <p className="text-center text-sm text-slate-500 mb-12 max-w-lg mx-auto">
              Cuatro razones de fondo por las que AIDA es la plataforma de
              impresion fiscal mas avanzada de Venezuela
            </p>
          </AnimateOnScroll>

          <div className="grid gap-6 lg:grid-cols-2">
            {pillars.map((pillar, i) => (
              <AnimateOnScroll key={pillar.label} animation={i % 2 === 0 ? "slide-left" : "slide-right"} delay={i * 120} duration={750}>
                <div className="perspective-container h-full">
                  <div
                    className={`tilt-card glass-card p-7 h-full border ${pillar.border} hover:bg-white/[0.06] transition-all duration-500`}
                  >
                    <div className="flex items-start gap-5">
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${pillar.gradient} flex items-center justify-center text-aida-cyan shrink-0`}
                      >
                        {pillar.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-aida-cyan">
                            {pillar.label}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-aida-cyan/10 border border-aida-cyan/20 text-[10px] text-aida-cyan font-medium">
                            {pillar.highlight}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-white mb-3">
                          {pillar.title}
                        </h4>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          {pillar.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>

        {/* ── Bottom CTA ── */}
        <AnimateOnScroll animation="scale-in" delay={100}>
          <div className="text-center">
            <div className="glass-card glow-blue inline-block p-8 sm:p-10">
              <p className="text-lg sm:text-xl font-bold text-white mb-2">
                Velocidad, resolución y autogestión
              </p>
              <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
                Implementación en 48 horas, resolución inmediata de problemas y
                una plataforma que tú controlas. Así funciona AIDA.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="#calculadora"
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-aida-accent to-aida-cyan text-base font-bold text-white shadow-lg shadow-aida-accent/25 hover:shadow-xl hover:shadow-aida-accent/30 hover:scale-[1.02] transition-all"
                >
                  Calcula tu ahorro
                </a>
                <a
                  href="#contacto"
                  className="px-8 py-3.5 rounded-xl border border-white/10 text-base font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-all"
                >
                  Solicitar demo
                </a>
              </div>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}

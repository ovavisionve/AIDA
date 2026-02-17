"use client";

import AnimateOnScroll from "@/components/AnimateOnScroll";

const comparisonCategories = [
  {
    category: "Tecnologia",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 01-1.59.659H9.06a2.25 2.25 0 01-1.591-.659L5 14.5m14 0V5.846a2.25 2.25 0 00-1.35-2.064 18.67 18.67 0 00-3.4-1.104m-7.5 0A18.672 18.672 0 003.35 3.782 2.25 2.25 0 002 5.846V14.5" />
      </svg>
    ),
    others: {
      title: "Imprentas tradicionales",
      desc: "Portales web basicos, formularios manuales, tecnologia obsoleta",
    },
    aida: {
      title: "AIDA",
      desc: "IA integrada, arquitectura API-first, infraestructura cloud nativa",
    },
  },
  {
    category: "Velocidad",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    others: {
      title: "Imprentas tradicionales",
      desc: "Minutos u horas por lote, procesamiento secuencial, cuellos de botella constantes",
    },
    aida: {
      title: "AIDA",
      desc: "Menos de 3 segundos por documento, procesamiento paralelo masivo",
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
      title: "Imprentas tradicionales",
      desc: "Sin API, sin conectores, integracion manual via correo o portal",
    },
    aida: {
      title: "AIDA",
      desc: "SAP, Odoo, WooCommerce, API REST documentada, webhooks en tiempo real",
    },
  },
  {
    category: "Automatizacion",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m0 0l4.5 7.795" />
      </svg>
    ),
    others: {
      title: "Imprentas tradicionales",
      desc: "Proceso manual, intervencion humana constante, revision documento por documento",
    },
    aida: {
      title: "AIDA",
      desc: "Deteccion de anomalias, validacion automatica, cero intervencion humana",
    },
  },
  {
    category: "Soporte",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
    others: {
      title: "Imprentas tradicionales",
      desc: "Horario de oficina limitado, tickets con esperas de dias, sin respuestas inmediatas",
    },
    aida: {
      title: "AIDA",
      desc: "IA disponible 24/7, respuestas instantaneas, resolucion autonoma de consultas",
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
      title: "Imprentas tradicionales",
      desc: "Servidores locales, limites de capacidad, caidas en picos de demanda",
    },
    aida: {
      title: "AIDA",
      desc: "Cloud nativo, escala automatica, sin limites de volumen, disponibilidad 99.9%",
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
      "AIDA no es un formulario web con un PDF al final. Es infraestructura fiscal como servicio. API REST completamente documentada con ejemplos en cURL, Python y JavaScript. API Keys, rate limiting, webhooks, callbacks y procesamiento batch de hasta 50,000 documentos por request. Tu sistema ERP, tu e-commerce o tu aplicacion personalizada se conectan con AIDA en horas, no en semanas. Las soluciones convencionales no ofrecen API publica documentada.",
    highlight: "Integracion en horas, no en semanas",
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
    title: "Menos de 3 segundos por documento",
    description:
      "Mientras las imprentas tradicionales toman minutos u horas para procesar lotes de documentos, AIDA emite cualquier documento fiscal en menos de 3 segundos. Procesamiento batch paralelo para volumenes masivos. Cloud nativo que escala automaticamente segun la demanda: sin servidores locales, sin licencias, sin mantenimiento. Disponibilidad garantizada del 99.9%. Cuando tu negocio crece, AIDA crece contigo sin intervenciones manuales.",
    highlight: "99.9% de disponibilidad garantizada",
    gradient: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/20",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: "Ahorro",
    title: "Hasta 95% mas economico",
    description:
      "Con paquetes desde $0.006 por numero de control en volumen corporativo, AIDA es significativamente mas economica que cualquier otra plataforma en el mercado. Precios publicados y transparentes desde el primer dia. Sin costos ocultos de implementacion, sin cobros por soporte, sin licencias adicionales. Una empresa que emite 20,000 documentos al mes puede ahorrar mas de $6,700 mensuales comparado con las soluciones convencionales.",
    highlight: "Ahorro de hasta $6,700/mes",
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
              AIDA vs Imprentas Tradicionales
            </h2>
            <p className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold">
              La unica imprenta digital en Venezuela{" "}
              <span className="gradient-text">gestionada por IA</span>
            </p>
            <p className="mt-5 text-slate-400 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
              Comparamos lo que ofrecen las plataformas convencionales con lo que
              AIDA hace posible. Sin marketing vacio, solo hechos verificables.
            </p>
          </div>
        </AnimateOnScroll>

        {/* ── Comparison Cards Side-by-Side ── */}
        <div className="mb-24">
          <AnimateOnScroll animation="fade-in">
            <h3 className="text-center text-xl sm:text-2xl font-bold text-white mb-4">
              Lo que ofrecen las demas vs lo que ofrece{" "}
              <span className="gradient-text">AIDA</span>
            </h3>
            <p className="text-center text-sm text-slate-500 mb-12 max-w-xl mx-auto">
              Seis categorias clave donde la diferencia es absoluta
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
                La diferencia no es de grado, es de categoria
              </p>
              <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
                AIDA no es una mejora incremental. Es un cambio completo en como
                funciona la impresion fiscal digital en Venezuela.
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

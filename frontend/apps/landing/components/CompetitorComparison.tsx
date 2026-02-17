const competitors = [
  {
    name: "Unidigital",
    type: "Imprenta Digital",
    description: "Uno de los pioneros en facturación digital en Venezuela. Ofrece portal web para gestión de documentos fiscales.",
    strengths: ["Trayectoria en el mercado", "Portal web funcional"],
    weaknesses: ["Sin inteligencia artificial", "Interfaz desactualizada", "Sin API para desarrolladores", "Soporte limitado a horario de oficina"],
  },
  {
    name: "Serdimpre, C.A.",
    type: "Imprenta Digital + Software",
    description: "Portal de gestión y software de facturación. Ofrecen soluciones integrales para emisión de documentos fiscales.",
    strengths: ["Portal de gestión propio", "Software de facturación incluido"],
    weaknesses: ["Sin IA ni automatización inteligente", "Sin integraciones ERP nativas", "Proceso de registro lento", "Sin API pública"],
  },
  {
    name: "Smart Factura",
    type: "Imprenta Digital",
    description: "Especialistas en emisión y almacenamiento de documentos digitales. Enfocados en el cumplimiento SENIAT.",
    strengths: ["Especialización en documentos fiscales", "Almacenamiento digital"],
    weaknesses: ["Sin inteligencia artificial", "Integraciones limitadas", "Sin detección de anomalías", "Sin procesamiento batch masivo"],
  },
  {
    name: "The Factory HKA",
    type: "Soluciones de Facturación",
    description: "Proveedor de soluciones integrales de facturación fiscal. Presencia en múltiples países de Latinoamérica.",
    strengths: ["Experiencia regional", "Soluciones enterprise"],
    weaknesses: ["Sin IA integrada", "Implementación compleja y costosa", "Tiempos de setup largos", "Costos elevados para PyMEs"],
  },
  {
    name: "CG La Imprenta Digital",
    type: "Imprenta Digital Autorizada",
    description: "Autorizados bajo providencia específica del SENIAT para emisión de documentos fiscales digitales.",
    strengths: ["Autorización SENIAT vigente", "Cumplimiento normativo"],
    weaknesses: ["Sin tecnología de IA", "Sin autoservicio digital", "Proceso manual de registro", "Sin API ni integraciones"],
  },
  {
    name: "Imprime 360, S.A.",
    type: "Imprenta Fiscal",
    description: "Enfocados en documentos fiscales y personalización de formatos. Combinan elementos de impresión tradicional y digital.",
    strengths: ["Personalización de formatos", "Documentos fiscales"],
    weaknesses: ["Orientación física/tradicional", "Sin plataforma cloud", "Sin automatización", "Sin IA ni self-service"],
  },
];

const aidaAdvantages = [
  {
    category: "Inteligencia Artificial",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    title: "La única con IA real integrada",
    desc: "Ninguna otra imprenta digital en Venezuela utiliza inteligencia artificial. AIDA detecta anomalías en tiempo real, sugiere correcciones antes de emitir, responde preguntas fiscales y aprende de los patrones de cada empresa. No es un chatbot genérico: es una IA entrenada específicamente en la normativa fiscal venezolana, providencias SENIAT, IVA, ISLR y retenciones.",
    competitors: "0 de 6 competidores ofrecen esta tecnología.",
  },
  {
    category: "API-First & Self-Service",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    title: "Plataforma API-first para desarrolladores",
    desc: "AIDA no es un formulario web con un PDF al final. Es infraestructura fiscal como servicio. API REST documentada con ejemplos en cURL, Python y JavaScript. API Keys, rate limiting, webhooks, callbacks. Tu sistema se integra con AIDA en horas, no en semanas. Procesamiento batch de hasta 50,000 documentos por request.",
    competitors: "0 de 6 competidores ofrecen API pública documentada.",
  },
  {
    category: "Velocidad & Escalabilidad",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: "Emisión en menos de 3 segundos",
    desc: "Mientras otras imprentas toman minutos u horas para procesar documentos (especialmente en lotes grandes), AIDA emite cualquier documento fiscal en menos de 3 segundos. Cloud nativo, escala automáticamente. Sin servidores locales, sin licencias, sin mantenimiento. Disponibilidad del 99.9%.",
    competitors: "Las imprentas tradicionales procesan manualmente, lo que limita su velocidad y escalabilidad.",
  },
  {
    category: "Costo & Transparencia",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Hasta 95% más económico",
    desc: "Con paquetes desde $0.006 por número de control (volumen corporativo), AIDA es significativamente más económica que cualquier competidor. Precios publicados y transparentes. Sin costos ocultos de setup, sin cobros por soporte, sin licencias adicionales. Una empresa que emite 20,000 documentos al mes puede ahorrar más de $6,700 mensuales.",
    competitors: "La mayoría de competidores no publican precios y requieren cotización personalizada.",
  },
];

const comparisonMatrix = [
  { feature: "Inteligencia Artificial", aida: true, others: false },
  { feature: "API REST pública", aida: true, others: false },
  { feature: "Procesamiento batch", aida: true, others: false },
  { feature: "Self-service (registro inmediato)", aida: true, others: false },
  { feature: "Integraciones ERP nativas", aida: true, others: false },
  { feature: "Detección de anomalías", aida: true, others: false },
  { feature: "Webhooks y callbacks", aida: true, others: false },
  { feature: "4 plantillas de diseño", aida: true, others: false },
  { feature: "Cloud nativo (sin servidores)", aida: true, others: false },
  { feature: "Cumplimiento SENIAT", aida: true, others: true },
  { feature: "Portal web de gestión", aida: true, others: true },
  { feature: "Emisión de documentos fiscales", aida: true, others: true },
];

export default function CompetitorComparison() {
  return (
    <section id="comparativa" className="py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-aida-cyan">
            AIDA vs la Competencia
          </h2>
          <p className="mt-3 text-3xl sm:text-4xl font-bold">
            La única imprenta digital en Venezuela{" "}
            <span className="gradient-text">gestionada por IA</span>
          </p>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
            Investigamos todas las imprentas digitales autorizadas en Venezuela.
            Estas son las diferencias reales. Sin marketing vacío, solo hechos.
          </p>
        </div>

        {/* Competitor Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-16">
          {competitors.map((comp) => (
            <div key={comp.name} className="glass-card p-5 hover:bg-white/[0.04] transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">{comp.name}</h3>
                  <span className="text-[10px] text-slate-500">{comp.type}</span>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] text-red-400">
                  Sin IA
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">{comp.description}</p>
              <div className="space-y-2">
                <div>
                  <div className="text-[10px] text-green-400/60 uppercase tracking-wider mb-1">Fortalezas</div>
                  <div className="flex flex-wrap gap-1">
                    {comp.strengths.map((s) => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/5 border border-green-500/10 text-green-400/70">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-red-400/60 uppercase tracking-wider mb-1">Limitaciones</div>
                  <div className="flex flex-wrap gap-1">
                    {comp.weaknesses.slice(0, 3).map((w) => (
                      <span key={w} className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/5 border border-red-500/10 text-red-400/70">{w}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Comparison Matrix */}
        <div className="mb-16">
          <h3 className="text-center text-xl font-bold text-white mb-8">
            Matriz de funcionalidades
          </h3>
          <div className="overflow-hidden rounded-2xl border border-white/10 max-w-3xl mx-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-500">Funcionalidad</th>
                  <th className="px-6 py-4 text-center text-xs uppercase tracking-wider text-aida-cyan w-28">AIDA</th>
                  <th className="px-6 py-4 text-center text-xs uppercase tracking-wider text-red-400/60 w-28">Otros</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {comparisonMatrix.map((row) => (
                  <tr key={row.feature} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-3 text-slate-300 text-xs">{row.feature}</td>
                    <td className="px-6 py-3 text-center">
                      {row.aida ? (
                        <svg className="w-5 h-5 text-green-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-red-400/50 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {row.others ? (
                        <svg className="w-5 h-5 text-green-400/50 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-red-400/50 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AIDA Advantages - Deep Dive */}
        <div>
          <h3 className="text-center text-xl font-bold text-white mb-10">
            ¿Por qué AIDA es diferente? Los argumentos.
          </h3>
          <div className="grid gap-6 lg:grid-cols-2">
            {aidaAdvantages.map((adv) => (
              <div key={adv.category} className="glass-card p-6 hover:bg-white/[0.06] transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-aida-accent/20 to-aida-cyan/20 flex items-center justify-center text-aida-cyan shrink-0">
                    {adv.icon}
                  </div>
                  <div>
                    <span className="text-[10px] text-aida-cyan uppercase tracking-wider font-semibold">{adv.category}</span>
                    <h4 className="mt-1 text-base font-bold text-white">{adv.title}</h4>
                    <p className="mt-2 text-sm text-slate-400 leading-relaxed">{adv.desc}</p>
                    <p className="mt-3 text-xs text-aida-cyan/70 font-medium italic">{adv.competitors}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4">
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
    </section>
  );
}

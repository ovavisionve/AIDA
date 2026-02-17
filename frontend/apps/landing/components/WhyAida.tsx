const comparisons = [
  {
    feature: "Emisión de documentos",
    others: "Minutos. Proceso manual, copiar datos, imprimir, firmar.",
    aida: "Segundos. Un click o un request API. Todo automático.",
  },
  {
    feature: "Cumplimiento SENIAT",
    others: "Manual. El contador revisa, hay riesgo de errores humanos.",
    aida: "Automático. Números de control, firma digital, QR. Sin errores.",
  },
  {
    feature: "Integración con ERP",
    others: "Semanas de desarrollo. Proyectos costosos de integración.",
    aida: "Wizard guiado de 6 pasos. Sin programar. Listo en minutos.",
  },
  {
    feature: "Soporte y asistencia",
    others: "Tickets, esperas, horario de oficina.",
    aida: "IA disponible 24/7 que entiende tu facturación y responde al instante.",
  },
  {
    feature: "Escalabilidad",
    others: "Servidores locales, licencias, mantenimiento.",
    aida: "Cloud nativo. Escala automáticamente. Sin límites técnicos.",
  },
  {
    feature: "Seguridad y auditoría",
    others: "Registros en papel, difícil rastrear cambios.",
    aida: "Trazabilidad total. Cada acción registrada con IP, hora y usuario.",
  },
];

export default function WhyAida() {
  return (
    <section id="por-que-aida" className="py-24 sm:py-32 relative">
      {/* Orbs */}
      <div className="orb orb-blue w-72 h-72 top-20 -left-20 float-element-slow" />
      <div className="orb orb-cyan w-56 h-56 bottom-20 right-10 float-element-delayed" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-aida-cyan">
            Por qué AIDA
          </h2>
          <p className="mt-3 text-3xl sm:text-4xl font-bold">
            No somos una imprenta más.
            <br />
            Somos <span className="gradient-text">la evolución</span>.
          </p>
          <p className="mt-4 text-slate-400 max-w-xl mx-auto">
            Mientras las imprentas tradicionales siguen con procesos manuales,
            nosotros construimos el futuro de la facturación con inteligencia artificial.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-500 w-1/4">
                  Característica
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-red-400/60 w-[37.5%]">
                  Imprentas Tradicionales
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-aida-cyan w-[37.5%]">
                  AIDA
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {comparisons.map((row) => (
                <tr key={row.feature} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{row.feature}</td>
                  <td className="px-6 py-4 text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-red-400/50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {row.others}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {row.aida}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Differentiators */}
        <div className="mt-16 grid gap-6 sm:grid-cols-3 perspective-container">
          {[
            {
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              ),
              title: "Primera con IA real",
              desc: "No es un chatbot genérico. Nuestra IA entiende la Providencia SENIAT, los tipos de documento, tu historial fiscal y el contexto de tu empresa.",
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              ),
              title: "Hecha en Venezuela",
              desc: "Entendemos las complejidades del IVA, retenciones, ISLR, tasas de cambio BCV. Diseñada para la realidad fiscal venezolana.",
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              ),
              title: "API-first",
              desc: "No es un formulario web con PDF. Es una plataforma de infraestructura fiscal. Tu sistema habla con AIDA por API, como los grandes.",
            },
          ].map((d) => (
            <div key={d.title} className="glass-card p-6 tilt-card">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-aida-accent/20 to-aida-cyan/20 flex items-center justify-center text-aida-cyan mb-4">
                {d.icon}
              </div>
              <h3 className="text-lg font-bold text-white">{d.title}</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">{d.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

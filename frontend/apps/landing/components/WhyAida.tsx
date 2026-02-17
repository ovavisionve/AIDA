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
    <section id="por-que-aida" className="py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            Mientras otras imprentas digitales en Venezuela siguen con procesos de los 90,
            nosotros construimos el futuro de la facturación.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
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
                  <td className="px-6 py-4 text-slate-500">{row.others}</td>
                  <td className="px-6 py-4 text-slate-300">{row.aida}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Differentiators */}
        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Primera con IA real",
              desc: "No es un chatbot genérico. Nuestra IA entiende la Providencia SENIAT, los tipos de documento, tu historial fiscal y el contexto de tu empresa.",
            },
            {
              title: "Hecha en Venezuela",
              desc: "Entendemos las complejidades del IVA, retenciones, ISLR, tasas de cambio BCV. Diseñada para la realidad fiscal venezolana.",
            },
            {
              title: "API-first",
              desc: "No es un formulario web con PDF. Es una plataforma de infraestructura fiscal. Tu sistema habla con AIDA por API, como los grandes.",
            },
          ].map((d) => (
            <div key={d.title} className="glass-card p-6">
              <h3 className="text-lg font-bold text-white">{d.title}</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">{d.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    num: "01",
    title: "Diagnóstico Fiscal",
    description:
      "Analizamos tu situación fiscal actual, volumen de documentos, sistemas existentes y necesidades específicas. La IA evalúa tu operación y diseña un plan de migración personalizado.",
    points: [
      "Análisis de volumen documental",
      "Evaluación de sistemas existentes",
      "Plan de migración personalizado",
      "Estimación de ahorro proyectado",
    ],
    color: "from-aida-accent to-blue-400",
  },
  {
    num: "02",
    title: "Configuración y Setup",
    description:
      "Configuramos tu cuenta AIDA: datos fiscales (RIF, razón social), asignación de rangos de números de control SENIAT, personalización de plantillas de documentos y configuración de usuarios.",
    points: [
      "Registro fiscal automático",
      "Asignación de números de control",
      "Personalización de plantillas",
      "Configuración de permisos",
    ],
    color: "from-aida-cyan to-teal-400",
  },
  {
    num: "03",
    title: "Integración Técnica",
    description:
      "Conectamos AIDA con tu ERP o sistema actual. Wizard guiado de 6 pasos sin escribir código. Si no tienes sistema, activas nuestro facturador propio directamente desde el navegador.",
    points: [
      "Wizard de integración sin código",
      "Conectores SAP/Odoo/WooCommerce",
      "API REST documentada",
      "Facturador propio incluido",
    ],
    color: "from-violet-500 to-purple-400",
  },
  {
    num: "04",
    title: "Emisión y Operación",
    description:
      "Tu empresa emite documentos fiscales con supervisión IA 24/7. Cada factura, nota de crédito, guía de despacho se genera con número de control, firma digital, QR y PDF automáticamente.",
    points: [
      "Emisión en menos de 3 segundos",
      "Supervisión IA en tiempo real",
      "PDF + XML + QR automáticos",
      "Trazabilidad total de cada documento",
    ],
    color: "from-amber-500 to-orange-400",
  },
];

export default function ProcessTimeline() {
  return (
    <section id="proceso" className="relative py-24 sm:py-32">
      {/* Ambient orbs */}
      <div className="orb orb-blue w-72 h-72 top-10 left-10" />
      <div className="orb orb-cyan w-64 h-64 bottom-20 right-10" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-20">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-aida-cyan">
            Proceso Detallado
          </h2>
          <p className="mt-3 text-3xl sm:text-4xl font-bold">
            De diagnóstico a operación en{" "}
            <span className="gradient-text">4 fases</span>
          </p>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
            Un proceso claro, guiado y sin fricciones. Desde el análisis de tu
            situación fiscal hasta la emisión automatizada de documentos con
            inteligencia artificial.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical gradient line - centered on lg, hidden on mobile */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-aida-accent via-aida-cyan via-violet-500 to-amber-500" />

          <div className="space-y-16 lg:space-y-0">
            {steps.map((step, i) => {
              const isLeft = i % 2 === 0;

              return (
                <div
                  key={step.num}
                  className="relative lg:grid lg:grid-cols-2 lg:gap-16 lg:py-12"
                >
                  {/* Connector node on the center line */}
                  <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <div
                      className={`w-14 h-14 rounded-full bg-aida-dark border-2 border-white/10 flex items-center justify-center glow-blue`}
                    >
                      <span
                        className={`text-lg font-black bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}
                      >
                        {step.num}
                      </span>
                    </div>
                  </div>

                  {/* Number + Title side */}
                  <div
                    className={`${
                      isLeft
                        ? "lg:text-right lg:pr-16"
                        : "lg:order-2 lg:pl-16"
                    }`}
                  >
                    {/* Mobile-only large number */}
                    <span
                      className={`lg:hidden inline-block text-6xl font-black bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}
                    >
                      {step.num}
                    </span>

                    {/* Desktop large number */}
                    <span
                      className={`hidden lg:inline-block text-7xl font-black bg-gradient-to-r ${step.color} bg-clip-text text-transparent float-element`}
                    >
                      {step.num}
                    </span>

                    <h3 className="mt-3 text-2xl font-bold text-white">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-slate-400 leading-relaxed max-w-md lg:max-w-none">
                      {step.description}
                    </p>
                  </div>

                  {/* Detail card side */}
                  <div
                    className={`mt-8 lg:mt-0 ${
                      isLeft
                        ? "lg:pl-16"
                        : "lg:order-1 lg:pr-16"
                    }`}
                  >
                    <div className="glass-card p-6 glow-blue hover:bg-white/[0.08] hover:border-aida-accent/20 transition-all duration-500">
                      {/* Card header accent */}
                      <div className="flex items-center gap-3 mb-5">
                        <div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-r ${step.color} flex items-center justify-center`}
                        >
                          <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 uppercase tracking-wider">
                            Puntos clave
                          </div>
                          <div className="text-sm font-semibold text-white">
                            {step.title}
                          </div>
                        </div>
                      </div>

                      {/* Checklist */}
                      <ul className="space-y-3">
                        {step.points.map((point) => (
                          <li key={point} className="flex items-start gap-3">
                            <div
                              className={`mt-0.5 w-5 h-5 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center flex-shrink-0`}
                            >
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                            <span className="text-sm text-slate-300 leading-relaxed">
                              {point}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {/* Progress bar */}
                      <div className="mt-5 pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                          <span>Progreso del proceso</span>
                          <span>{25 * (i + 1)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${step.color}`}
                            style={{ width: `${25 * (i + 1)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Final node */}
          <div className="hidden lg:flex justify-center mt-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-aida-accent to-aida-cyan flex items-center justify-center glow-blue float-element">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-slate-400 mb-6">
            Todo el proceso toma menos de{" "}
            <span className="text-white font-semibold">48 horas</span>. Sin
            interrupciones a tu operación.
          </p>
          <a
            href="#contacto"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-aida-accent to-aida-cyan text-base font-bold text-white shadow-lg shadow-aida-accent/25 hover:shadow-xl hover:shadow-aida-accent/30 hover:scale-[1.02] transition-all"
          >
            Iniciar Diagnóstico Gratis
            <svg
              className="w-5 h-5"
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
    </section>
  );
}

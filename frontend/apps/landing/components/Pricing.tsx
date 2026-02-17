const plans = [
  {
    name: "Básico",
    price: "29",
    period: "/mes",
    desc: "Para emprendedores y pequeños negocios que están comenzando.",
    features: [
      "100 documentos/mes",
      "1 usuario",
      "5 GB almacenamiento",
      "Plantilla Clásica SENIAT",
      "Portal de autogestión",
      "Sin costo de implementación",
      "Soporte por email",
    ],
    cta: "Comenzar",
    featured: false,
  },
  {
    name: "Profesional",
    price: "79",
    period: "/mes",
    desc: "Para PyMEs que necesitan facturación confiable y eficiente.",
    features: [
      "500 documentos/mes",
      "5 usuarios",
      "20 GB almacenamiento",
      "4 plantillas de diseño",
      "Integración con tu ERP",
      "Asistente IA",
      "Sin costo de implementación",
      "Autogestión completa",
      "Soporte prioritario",
    ],
    cta: "Elegir Profesional",
    featured: true,
  },
  {
    name: "Empresarial",
    price: "149",
    period: "/mes",
    desc: "Para empresas con alto volumen y múltiples integraciones.",
    features: [
      "Documentos ilimitados",
      "Hasta 99 usuarios",
      "100 GB almacenamiento",
      "Todas las plantillas + custom",
      "Integraciones ilimitadas",
      "IA avanzada con analytics",
      "API completa + batch",
      "Sin costo de implementación",
      "Autogestión completa",
      "Soporte dedicado + SLA 99.9%",
    ],
    cta: "Contactar Ventas",
    featured: false,
  },
];

export default function Pricing() {
  return (
    <section id="planes" className="py-24 sm:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-aida-primary/10 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-aida-cyan">
            Planes
          </h2>
          <p className="mt-3 text-3xl sm:text-4xl font-bold">
            Precios <span className="gradient-text">transparentes</span>
          </p>
          <p className="mt-4 text-slate-400 max-w-xl mx-auto">
            Sin costos ocultos, sin sorpresas, <span className="text-white font-semibold">sin costo de implementación</span>.
            Tu empresa se autogestiona desde el primer día.
            Todos los planes incluyen actualizaciones y cumplimiento SENIAT.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 transition-all duration-300 ${
                plan.featured
                  ? "bg-gradient-to-b from-aida-accent/10 to-aida-cyan/5 border-2 border-aida-accent/30 scale-[1.02] shadow-lg shadow-aida-accent/10"
                  : "glass-card hover:border-white/20"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-aida-accent to-aida-cyan text-xs font-bold text-white">
                  Más Popular
                </div>
              )}

              <h3 className="text-lg font-bold text-white">{plan.name}</h3>
              <p className="mt-1 text-sm text-slate-400">{plan.desc}</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">${plan.price}</span>
                <span className="text-slate-500">{plan.period}</span>
              </div>

              <ul className="mt-8 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <svg
                      className="w-5 h-5 text-aida-cyan shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-300">{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#contacto"
                className={`mt-8 block w-full text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                  plan.featured
                    ? "bg-gradient-to-r from-aida-accent to-aida-cyan text-white hover:shadow-lg hover:shadow-aida-accent/25"
                    : "border border-white/10 text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          ¿Necesitas un plan Enterprise personalizado?{" "}
          <a href="#contacto" className="text-aida-cyan hover:underline">
            Hablemos
          </a>
        </p>
      </div>
    </section>
  );
}

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: "Facturación en Segundos",
    desc: "Emite facturas, notas de crédito, notas de débito, guías de despacho y retenciones con un solo request a nuestra API. PDF, XML y QR generados automáticamente.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Cumplimiento SENIAT Total",
    desc: "Números de control auditables, firma digital, trazabilidad completa. Todo según la Providencia SNAT/2024/000121. Sin sorpresas en fiscalizaciones.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    title: "Inteligencia Artificial",
    desc: "Nuestra IA detecta anomalías, sugiere correcciones, responde preguntas fiscales y te asiste en tiempo real. Como tener un contador digital 24/7.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    title: "Integración Universal",
    desc: "Conecta SAP, Odoo, WooCommerce, PrestaShop, CONTPAQi o tu sistema custom. Wizard guiado de 6 pasos, sin programar.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    title: "4 Plantillas de Diseño",
    desc: "Clásica SENIAT, Moderna, Corporativa y Compacta. Cada cliente elige la suya por tipo de documento. Sube tu logo y banners publicitarios.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    title: "API para Desarrolladores",
    desc: "API REST documentada con ejemplos en cURL, Python y JavaScript. API Keys, rate limiting, webhooks. Tu equipo técnico se integra en horas, no semanas.",
  },
];

export default function Features() {
  return (
    <section id="caracteristicas" className="relative py-24 sm:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-aida-primary/10 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-aida-cyan">
            Características
          </h2>
          <p className="mt-3 text-3xl sm:text-4xl font-bold">
            Todo lo que necesitas para{" "}
            <span className="gradient-text">facturar digitalmente</span>
          </p>
          <p className="mt-4 text-slate-400 max-w-xl mx-auto">
            Una plataforma completa que reemplaza procesos manuales, papel, y software obsoleto.
          </p>
        </div>

        <div className="perspective-container grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="tilt-card group glass-card p-6 hover:bg-white/[0.08] hover:border-aida-accent/20 transition-all duration-500"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-aida-accent/20 to-aida-cyan/20 flex items-center justify-center text-aida-cyan group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white group-hover:text-aida-cyan transition-colors">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

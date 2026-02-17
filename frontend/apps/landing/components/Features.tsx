"use client";

import AnimateOnScroll from "@/components/AnimateOnScroll";

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: "Facturación en Segundos",
    desc: "Emite facturas, notas de crédito, notas de débito, guías de despacho y retenciones con un solo click o request API. PDF profesional, XML UBL 2.1, código QR y firma digital SHA-256, todo generado automáticamente.",
    highlight: "< 3 segundos",
    gradient: "from-aida-accent to-blue-400",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Cumplimiento SENIAT Total",
    desc: "Números de control con asignación atómica, firma digital, QR de verificación pública, retención de datos 10 años. Todo según la Providencia SNAT/2024/000121. Cero sorpresas en fiscalizaciones.",
    highlight: "100% conforme",
    gradient: "from-green-500 to-emerald-400",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    title: "Inteligencia Artificial Real",
    desc: "No es un chatbot genérico. Nuestra IA está entrenada en normativa fiscal venezolana: detecta anomalías, valida campos SENIAT, sugiere correcciones y responde preguntas sobre IVA, ISLR y retenciones.",
    highlight: "Disponible 24/7",
    gradient: "from-violet-500 to-purple-400",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    title: "Integración Universal",
    desc: "Conecta SAP Business One, Odoo, WooCommerce, PrestaShop, CONTPAQi o tu sistema custom. Wizard guiado de 6 pasos sin escribir código, o API REST completa para tu equipo técnico.",
    highlight: "6+ conectores",
    gradient: "from-aida-cyan to-teal-400",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    title: "4 Plantillas Profesionales",
    desc: "Clásica SENIAT, Moderna, Corporativa y Compacta. Cada cliente elige su diseño por tipo de documento. Incluye logo corporativo, banners publicitarios y código de barras Code128.",
    highlight: "Personalizables",
    gradient: "from-amber-500 to-orange-400",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    title: "API para Desarrolladores",
    desc: "API REST documentada con ejemplos en cURL, Python y JavaScript. API Keys con rate limiting, webhooks, callbacks, sandbox de pruebas y procesamiento batch de hasta 50,000 documentos.",
    highlight: "Docs interactivos",
    gradient: "from-rose-500 to-pink-400",
  },
];

export default function Features() {
  return (
    <section id="caracteristicas" className="relative py-24 sm:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-aida-primary/10 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll animation="fade-in">
          <div className="text-center mb-16">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-aida-cyan">
              Características
            </h2>
            <p className="mt-3 text-3xl sm:text-4xl font-bold">
              Todo lo que necesitas para{" "}
              <span className="gradient-text">facturar digitalmente</span>
            </p>
            <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
              Una plataforma completa que reemplaza procesos manuales, papel y software obsoleto.
              Desde la emisión de documentos hasta la integración con tu ERP, todo en una sola herramienta.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="perspective-container grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <AnimateOnScroll key={f.title} animation="slide-up" delay={i * 100} duration={700}>
              <div
                className="tilt-card group glass-card p-6 hover:bg-white/[0.08] hover:border-aida-accent/20 transition-all duration-500 h-full flex flex-col"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-aida-accent/20 to-aida-cyan/20 flex items-center justify-center text-aida-cyan group-hover:scale-110 transition-transform">
                    {f.icon}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gradient-to-r ${f.gradient} bg-clip-text text-transparent border border-white/10`}>
                    {f.highlight}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white group-hover:text-aida-cyan transition-colors">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed flex-1">{f.desc}</p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>

        {/* Bottom stats bar */}
        <AnimateOnScroll animation="slide-up" delay={400}>
          <div className="mt-16 glass-card p-6 flex flex-wrap justify-center gap-8 sm:gap-16">
            {[
              { value: "5", label: "Tipos de documento" },
              { value: "4", label: "Plantillas PDF" },
              { value: "6+", label: "Conectores ERP" },
              { value: "3", label: "Formatos export" },
              { value: "50K", label: "Docs por batch" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-black gradient-text">{stat.value}</div>
                <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}

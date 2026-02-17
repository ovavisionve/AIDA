const steps = [
  {
    num: "01",
    title: "Te registramos en minutos",
    desc: "Nos das tu RIF, razón social y datos fiscales. Nosotros configuramos tu cuenta, generamos tus API Keys, asignamos tu rango de números de control y te entregamos acceso a todos los portales.",
    color: "from-aida-accent to-blue-400",
  },
  {
    num: "02",
    title: "Conectas tu sistema",
    desc: "¿Usas SAP, Odoo, WooCommerce? Nuestro wizard de integración te guía paso a paso. ¿No tienes sistema? Usa nuestro facturador propio directamente desde el navegador.",
    color: "from-aida-cyan to-teal-400",
  },
  {
    num: "03",
    title: "Emites documentos fiscales",
    desc: "Factura, nota de crédito, nota de débito, guía de despacho, retención. Un click o un request a la API. AIDA genera el PDF, XML, QR, firma digital y número de control automáticamente.",
    color: "from-violet-500 to-purple-400",
  },
  {
    num: "04",
    title: "La IA te respalda",
    desc: "Nuestro asistente de IA revisa tus documentos, detecta errores antes de emitir, responde tus dudas fiscales y genera reportes inteligentes. Todo mientras tú te enfocas en vender.",
    color: "from-amber-500 to-orange-400",
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-aida-cyan">
            Cómo Funciona
          </h2>
          <p className="mt-3 text-3xl sm:text-4xl font-bold">
            De cero a facturando en{" "}
            <span className="gradient-text">4 pasos</span>
          </p>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-aida-accent/50 via-aida-cyan/50 to-transparent" />

          <div className="space-y-12 lg:space-y-0">
            {steps.map((step, i) => (
              <div key={step.num} className="relative lg:grid lg:grid-cols-2 lg:gap-12 lg:py-10">
                {/* Connector dot */}
                <div className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-aida-dark border-2 border-aida-accent z-10" />

                <div className={`${i % 2 === 0 ? "lg:text-right lg:pr-12" : "lg:order-2 lg:pl-12"}`}>
                  <span className={`inline-block text-5xl font-black bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}>
                    {step.num}
                  </span>
                  <h3 className="mt-2 text-xl font-bold text-white">{step.title}</h3>
                  <p className="mt-3 text-slate-400 leading-relaxed">{step.desc}</p>
                </div>

                <div className={`mt-6 lg:mt-0 ${i % 2 === 0 ? "lg:pl-12" : "lg:order-1 lg:pr-12"}`}>
                  <div className="glass-card p-6 glow-blue">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${step.color} opacity-20`} />
                      <div className="h-2 rounded-full bg-white/10 flex-1">
                        <div className={`h-full rounded-full bg-gradient-to-r ${step.color}`} style={{ width: `${25 * (i + 1)}%` }} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[0, 1, 2].map((j) => (
                        <div key={j} className="h-2.5 rounded bg-white/5" style={{ width: `${90 - j * 20}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    num: "01",
    title: "Te registramos en minutos",
    desc: "Nos das tu RIF, razón social y datos fiscales. Nosotros configuramos tu cuenta, generamos tus API Keys, asignamos tu rango de números de control SENIAT y te entregamos acceso a todos los portales.",
    color: "from-aida-accent to-blue-400",
    details: [
      "Registro con RIF, razón social, dirección fiscal y datos de contacto",
      "Asignación automática de rango de números de control (ej: 00-000001 a 00-005000)",
      "Creación de usuarios con permisos personalizados (admin, facturador, contador)",
      "Generación de API Keys con rate limiting configurable",
      "Configuración de plantilla de documentos (4 diseños disponibles)",
      "Upload de logo corporativo y banners publicitarios",
    ],
    metric: { value: "5 min", label: "Tiempo promedio de configuración" },
  },
  {
    num: "02",
    title: "Conectas tu sistema (o usas el nuestro)",
    desc: "¿Usas SAP, Odoo, WooCommerce? Nuestro wizard de integración te guía paso a paso sin escribir código. ¿No tienes sistema? Usa nuestro facturador completo directamente desde el navegador.",
    color: "from-aida-cyan to-teal-400",
    details: [
      "Wizard guiado de 6 pasos: selección → configuración → mapeo → prueba → activación → monitoreo",
      "Conectores nativos: SAP Business One, Odoo, WooCommerce, PrestaShop",
      "API REST documentada con ejemplos en cURL, Python y JavaScript",
      "Webhooks para notificaciones en tiempo real de cada documento emitido",
      "Portal facturador propio con gestión de productos, clientes y documentos",
      "Modo sandbox para pruebas sin afectar datos reales",
    ],
    metric: { value: "0 código", label: "Integración sin programar" },
  },
  {
    num: "03",
    title: "Emites documentos fiscales",
    desc: "Factura, nota de crédito, nota de débito, guía de despacho, retención. Un click en el portal o un request a la API. AIDA genera el PDF profesional, XML UBL 2.1, código QR, firma digital SHA-256 y número de control automáticamente.",
    color: "from-violet-500 to-purple-400",
    details: [
      "5 tipos de documento: factura, nota de crédito, nota de débito, guía de despacho, retención",
      "Cálculo automático de IVA (16%, 8%, exento) e IGTF (3% en divisas)",
      "Firma digital SHA-256 con hash verificable en portal público",
      "Código QR funcional que enlaza al portal de validación pública",
      "Código de barras Code128 con número de control en pie de página",
      "Emisión batch de hasta 50,000 documentos por request vía API",
    ],
    metric: { value: "< 3s", label: "Tiempo de emisión por documento" },
  },
  {
    num: "04",
    title: "La IA te respalda 24/7",
    desc: "Nuestro asistente de IA, entrenado específicamente en normativa fiscal venezolana, revisa tus documentos antes de emitirlos, detecta anomalías, responde tus dudas fiscales y genera reportes inteligentes. Todo mientras tú te enfocas en vender.",
    color: "from-amber-500 to-orange-400",
    details: [
      "Detección de anomalías: notas de crédito que exceden el monto original",
      "Validación automática de campos SENIAT antes de emitir",
      "Asistente fiscal que responde sobre IVA, ISLR, retenciones y providencias",
      "Reportes inteligentes: libro de ventas, declaración IVA, análisis por período",
      "Alertas proactivas: números de control por agotarse, patrones inusuales",
      "Dashboard de monitoreo en tiempo real con KPIs y tendencias",
    ],
    metric: { value: "24/7", label: "Disponibilidad del asistente IA" },
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
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
            Un proceso diseñado para que tu empresa comience a emitir documentos
            fiscales electrónicos con cumplimiento SENIAT completo en menos de 48 horas,
            sin interrupciones a tu operación actual.
          </p>
        </div>

        <div className="relative">
          {/* Vertical gradient line */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-aida-accent/50 via-aida-cyan/50 via-violet-500/50 to-amber-500/50" />

          <div className="space-y-12 lg:space-y-0">
            {steps.map((step, i) => (
              <div key={step.num} className="relative lg:grid lg:grid-cols-2 lg:gap-12 lg:py-12">
                {/* Connector node */}
                <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="w-12 h-12 rounded-full bg-aida-dark border-2 border-white/10 flex items-center justify-center glow-blue">
                    <span className={`text-base font-black bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}>
                      {step.num}
                    </span>
                  </div>
                </div>

                {/* Title + Description side */}
                <div className={`${i % 2 === 0 ? "lg:text-right lg:pr-14" : "lg:order-2 lg:pl-14"}`}>
                  <span className={`inline-block text-6xl font-black bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}>
                    {step.num}
                  </span>
                  <h3 className="mt-2 text-2xl font-bold text-white">{step.title}</h3>
                  <p className="mt-3 text-slate-400 leading-relaxed">{step.desc}</p>

                  {/* Metric badge */}
                  <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                    <span className={`text-lg font-black bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}>
                      {step.metric.value}
                    </span>
                    <span className="text-xs text-slate-500">{step.metric.label}</span>
                  </div>
                </div>

                {/* Detail card side */}
                <div className={`mt-8 lg:mt-0 ${i % 2 === 0 ? "lg:pl-14" : "lg:order-1 lg:pr-14"}`}>
                  <div className="glass-card p-6 glow-blue hover:bg-white/[0.08] hover:border-aida-accent/20 transition-all duration-500">
                    {/* Card header */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${step.color} flex items-center justify-center`}>
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider">Detalle del paso</div>
                        <div className="text-sm font-semibold text-white">{step.title}</div>
                      </div>
                    </div>

                    {/* Checklist */}
                    <ul className="space-y-3">
                      {step.details.map((detail) => (
                        <li key={detail} className="flex items-start gap-3">
                          <div className={`mt-0.5 w-5 h-5 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center flex-shrink-0`}>
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-sm text-slate-300 leading-relaxed">{detail}</span>
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
            ))}
          </div>
        </div>

        {/* Bottom summary */}
        <div className="mt-20 glass-card p-8 sm:p-10 text-center glow-blue">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
            En resumen: <span className="gradient-text">48 horas</span> de tu primer contacto a tu primera factura
          </h3>
          <p className="text-slate-400 max-w-2xl mx-auto mb-6">
            Mientras que con imprentas tradicionales el proceso de alta, configuración e integración
            toma semanas o meses, con AIDA tu empresa emite documentos fiscales electrónicos
            con cumplimiento SENIAT completo en menos de 2 días hábiles.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[
              { value: "5 min", label: "Registro" },
              { value: "1 hora", label: "Integración" },
              { value: "< 3s", label: "Emisión" },
              { value: "24/7", label: "Soporte IA" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-lg font-black gradient-text">{s.value}</div>
                <div className="text-xs text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

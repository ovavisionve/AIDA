"use client";

import AnimateOnScroll from "@/components/AnimateOnScroll";

const topERPs = [
  { name: "SAP Business One", category: "ERP Empresarial", origin: "Internacional" },
  { name: "Odoo", category: "ERP Open Source", origin: "Internacional" },
  { name: "Profit Plus", category: "Administrativo", origin: "Venezuela" },
  { name: "Galac", category: "Contable / Fiscal", origin: "Venezuela" },
  { name: "Saint", category: "Administrativo", origin: "Venezuela" },
  { name: "Valery", category: "ERP / Facturación", origin: "Venezuela" },
  { name: "CONTPAQi", category: "Contable / Fiscal", origin: "México" },
  { name: "World Office", category: "Contable", origin: "Colombia" },
  { name: "QuickBooks", category: "Contabilidad", origin: "Internacional" },
  { name: "Softland", category: "ERP Corporativo", origin: "Latam" },
  { name: "Omninexo", category: "Retail / Farmacias", origin: "Venezuela" },
  { name: "Mónica", category: "Administrativo", origin: "Latam" },
  { name: "MicroTech", category: "Contable / Fiscal", origin: "Venezuela" },
  { name: "WooCommerce", category: "E-Commerce", origin: "Internacional" },
  { name: "PrestaShop", category: "E-Commerce", origin: "Internacional" },
  { name: "NovaCaja", category: "Punto de Venta", origin: "Venezuela" },
  { name: "Innova Soft Pro", category: "Administrativo", origin: "Venezuela" },
  { name: "Shopify", category: "E-Commerce", origin: "Internacional" },
  { name: "Fina", category: "Administrativo", origin: "Venezuela" },
  { name: "Hybrid LiteOS", category: "Cloud ERP", origin: "Venezuela" },
];

const integrationBenefits = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    title: "Cualquier ERP, cualquier sistema",
    desc: "Nos integramos con Profit Plus, Galac, Saint, Valery, SAP, Odoo, y más de 100 sistemas del mercado. Si tu ERP puede hacer un request HTTP, se conecta con AIDA.",
    highlight: "+100 sistemas",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.42 15.17l-5.1-5.1m0 0L12 4.37m-5.68 5.7h11.8M4.26 19.72a9.94 9.94 0 005.74 2.27c5.52 0 10-4.48 10-10S15.52 2 10 2 0 6.48 0 12c0 2.38.83 4.56 2.22 6.28" />
      </svg>
    ),
    title: "¿Tu sistema no está en la lista?",
    desc: "No importa. Nuestro equipo técnico se adapta a CUALQUIER sistema que utilices. Te acompañamos en todo el proceso de integración para que no tengas que cambiar nada de tu operación actual.",
    highlight: "Adaptación total",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    title: "API REST documentada",
    desc: "Para equipos técnicos: API REST completa con ejemplos en cURL, Python y JavaScript. Sandbox de pruebas, webhooks, SDKs oficiales y soporte técnico dedicado.",
    highlight: "Docs interactivos",
  },
];

const wizardSteps = [
  { num: "1", label: "Selecciona", desc: "Elige tu ERP o cuéntanos cuál usas" },
  { num: "2", label: "Configura", desc: "Ingresa credenciales y endpoint" },
  { num: "3", label: "Mapea", desc: "Asocia campos entre sistemas" },
  { num: "4", label: "Prueba", desc: "Emite un documento de prueba" },
  { num: "5", label: "Activa", desc: "Activa la conexión en producción" },
  { num: "6", label: "Monitorea", desc: "Dashboard en tiempo real" },
];

export default function Integrations() {
  return (
    <section id="integraciones" className="py-24 sm:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-aida-primary/10 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <AnimateOnScroll animation="fade-in">
          <div className="text-center mb-16">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-aida-cyan">
              Integraciones
            </h2>
            <p className="mt-3 text-3xl sm:text-4xl font-bold">
              Compatible con <span className="gradient-text">tu sistema actual</span>
            </p>
            <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
              Profit Plus, Galac, Saint, Valery, SAP, Odoo y más de 100 ERPs,
              plataformas contables y e-commerce. Wizard guiado de 6 pasos
              sin escribir una línea de código, o API REST para tu equipo técnico.
            </p>
          </div>
        </AnimateOnScroll>

        {/* Big number + ERP grid */}
        <AnimateOnScroll animation="scale-in" duration={700}>
          <div className="mb-16">
            {/* Big number highlight */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-6 glass-card px-10 py-8 glow-blue">
                <div className="text-6xl sm:text-7xl font-black gradient-text">+100</div>
                <div className="text-left">
                  <div className="text-lg font-bold text-white">ERPs y sistemas compatibles</div>
                  <div className="text-sm text-slate-400 mt-1">
                    Incluyendo los más usados en Venezuela y Latinoamérica
                  </div>
                </div>
              </div>
            </div>

            {/* ERP Grid - Named systems */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {topERPs.map((erp, i) => (
                <AnimateOnScroll key={erp.name} animation="scale-in" delay={i * 40} duration={500}>
                  <div className="group glass-card px-4 py-3 hover:bg-white/[0.08] hover:border-aida-accent/20 transition-all duration-300 text-center">
                    <div className="text-sm font-semibold text-white group-hover:text-aida-cyan transition-colors truncate">
                      {erp.name}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">{erp.category}</div>
                    {erp.origin === "Venezuela" && (
                      <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[8px] text-amber-400 font-bold uppercase tracking-wider">
                        VE
                      </span>
                    )}
                  </div>
                </AnimateOnScroll>
              ))}
              {/* +80 más card */}
              <AnimateOnScroll animation="scale-in" delay={topERPs.length * 40} duration={500}>
                <div className="glass-card px-4 py-3 hover:bg-white/[0.08] hover:border-aida-cyan/20 transition-all duration-300 text-center flex flex-col items-center justify-center">
                  <div className="text-xl font-black gradient-text">+80</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">más sistemas</div>
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </AnimateOnScroll>

        {/* Wizard visual */}
        <AnimateOnScroll animation="slide-up" delay={200}>
          <div className="mb-16">
            <h3 className="text-center text-lg font-semibold text-white mb-8">
              Wizard de integración en <span className="text-aida-cyan">6 pasos</span>
            </h3>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-0">
              {wizardSteps.map((ws, i) => (
                <div key={ws.num} className="flex items-center">
                  <div className="flex flex-col items-center text-center w-28 sm:w-32">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-aida-accent to-aida-cyan flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-aida-accent/20">
                      {ws.num}
                    </div>
                    <div className="mt-2 text-xs font-semibold text-white">{ws.label}</div>
                    <div className="mt-1 text-[10px] text-slate-500 leading-tight">{ws.desc}</div>
                  </div>
                  {i < wizardSteps.length - 1 && (
                    <div className="hidden sm:block w-8 h-px bg-gradient-to-r from-aida-accent/40 to-aida-cyan/40 -mt-6" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </AnimateOnScroll>

        {/* Integration benefits cards */}
        <div className="grid gap-6 lg:grid-cols-3">
          {integrationBenefits.map((benefit, i) => (
            <AnimateOnScroll key={benefit.title} animation="slide-up" delay={i * 100} duration={700}>
              <div
                className="group glass-card p-7 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 h-full"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-aida-accent/20 to-aida-cyan/20 flex items-center justify-center text-aida-cyan mb-5 group-hover:scale-110 transition-transform">
                  {benefit.icon}
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-aida-cyan/10 border border-aida-cyan/20 text-[10px] text-aida-cyan font-bold uppercase tracking-wider mb-3">
                  {benefit.highlight}
                </span>
                <h3 className="text-lg font-bold text-white mb-2">{benefit.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{benefit.desc}</p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>

        {/* API highlight */}
        <AnimateOnScroll animation="slide-up" delay={300}>
          <div className="mt-16 glass-card p-8 sm:p-10 glow-blue">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-xl font-bold text-white mb-3">
                  ¿Tienes un equipo técnico?
                </h3>
                <p className="text-slate-400 leading-relaxed mb-4">
                  Nuestra API REST se integra con cualquier sistema que pueda hacer requests HTTP.
                  Documentación interactiva con ejemplos en 3 lenguajes, sandbox de pruebas incluido,
                  y soporte técnico dedicado para tu equipo de desarrollo.
                </p>
                <a
                  href="#contacto"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-aida-accent to-aida-cyan text-sm font-bold text-white shadow-lg shadow-aida-accent/25 hover:shadow-xl hover:shadow-aida-accent/30 hover:scale-[1.02] transition-all"
                >
                  Solicitar acceso a la API
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>

              {/* Code snippet preview */}
              <div className="rounded-xl bg-aida-dark/80 border border-white/10 p-5 font-mono text-xs overflow-hidden">
                <div className="flex items-center gap-2 mb-3 text-slate-500">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                  </div>
                  <span>emit_invoice.py</span>
                </div>
                <pre className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                  <span className="text-violet-400">import</span>{" "}
                  <span className="text-aida-cyan">requests</span>
                  {"\n\n"}
                  <span className="text-slate-500"># Emitir factura con AIDA</span>
                  {"\n"}
                  response = requests.post(
                  {"\n"}
                  {"  "}<span className="text-green-400">&quot;https://api.aida.com.ve/v1/fiscal/emit&quot;</span>,
                  {"\n"}
                  {"  "}headers={`{`}<span className="text-green-400">&quot;X-API-Key&quot;</span>: api_key{`}`},
                  {"\n"}
                  {"  "}json={`{`}
                  {"\n"}
                  {"    "}<span className="text-green-400">&quot;tipo&quot;</span>: <span className="text-green-400">&quot;factura&quot;</span>,
                  {"\n"}
                  {"    "}<span className="text-green-400">&quot;cliente_rif&quot;</span>: <span className="text-green-400">&quot;J-12345678-9&quot;</span>,
                  {"\n"}
                  {"    "}<span className="text-green-400">&quot;items&quot;</span>: [{`{`}...{`}`}],
                  {"\n"}
                  {"  "}{`}`}
                  {"\n"}
                  )
                  {"\n\n"}
                  <span className="text-slate-500"># PDF + XML + QR en 3 segundos</span>
                  {"\n"}
                  factura = response.json()
                </pre>
              </div>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}

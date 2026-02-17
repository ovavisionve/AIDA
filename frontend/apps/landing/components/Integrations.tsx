const integrations = [
  {
    name: "SAP Business One",
    category: "ERP",
    desc: "Sincronización vía Service Layer OData",
    color: "#0070C0",
  },
  {
    name: "Odoo",
    category: "ERP",
    desc: "XML-RPC / JSON-RPC v14+",
    color: "#714B67",
  },
  {
    name: "WooCommerce",
    category: "E-Commerce",
    desc: "REST API con webhooks",
    color: "#96588A",
  },
  {
    name: "PrestaShop",
    category: "E-Commerce",
    desc: "Web Service API 1.7+",
    color: "#DF0067",
  },
  {
    name: "CONTPAQi",
    category: "Contabilidad",
    desc: "SDK Comercial Premium",
    color: "#E63946",
  },
  {
    name: "API Directa",
    category: "Custom",
    desc: "REST API para cualquier sistema",
    color: "#3b82f6",
  },
];

export default function Integrations() {
  return (
    <section id="integraciones" className="py-24 sm:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-aida-primary/10 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-aida-cyan">
            Integraciones
          </h2>
          <p className="mt-3 text-3xl sm:text-4xl font-bold">
            Conecta <span className="gradient-text">cualquier sistema</span>
          </p>
          <p className="mt-4 text-slate-400 max-w-xl mx-auto">
            No importa qué ERP, e-commerce o sistema contable uses. AIDA se conecta con un wizard
            guiado de 6 pasos, sin escribir una línea de código.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integ) => (
            <div
              key={integ.name}
              className="group glass-card p-6 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 flex items-start gap-4"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                style={{ backgroundColor: `${integ.color}20`, color: integ.color }}
              >
                {integ.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">{integ.name}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-slate-500">
                    {integ.category}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-400">{integ.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-500 text-sm">
            ¿Tu sistema no está en la lista?{" "}
            <a href="#contacto" className="text-aida-cyan hover:underline">
              Nuestra API REST se integra con cualquier cosa
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

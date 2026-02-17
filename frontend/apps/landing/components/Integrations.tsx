const integrations = [
  {
    name: "SAP Business One",
    category: "ERP",
    desc: "Sincronización bidireccional vía Service Layer OData. Facturas, clientes, productos y números de control sincronizados automáticamente entre SAP y AIDA.",
    color: "#0070C0",
    features: ["Service Layer OData", "Sync bidireccional", "Mapeo automático"],
  },
  {
    name: "Odoo",
    category: "ERP",
    desc: "Conector nativo XML-RPC / JSON-RPC para Odoo 14+. Emite facturas desde Odoo y AIDA genera el documento fiscal completo con NC, firma y QR.",
    color: "#714B67",
    features: ["XML-RPC / JSON-RPC", "Odoo 14+", "Facturación directa"],
  },
  {
    name: "WooCommerce",
    category: "E-Commerce",
    desc: "Plugin de integración con webhooks. Cada venta en tu tienda online genera automáticamente la factura fiscal con cumplimiento SENIAT.",
    color: "#96588A",
    features: ["REST API + Webhooks", "Auto-facturación", "Catálogo sync"],
  },
  {
    name: "PrestaShop",
    category: "E-Commerce",
    desc: "Módulo para PrestaShop 1.7+ via Web Service API. Automatiza la emisión de documentos fiscales para cada orden procesada en tu tienda.",
    color: "#DF0067",
    features: ["Web Service API 1.7+", "Módulo nativo", "Orden → Factura"],
  },
  {
    name: "CONTPAQi",
    category: "Contabilidad",
    desc: "Integración con CONTPAQi Comercial Premium vía SDK. Sincroniza pólizas, facturas y reportes contables entre ambas plataformas.",
    color: "#E63946",
    features: ["SDK Premium", "Pólizas contables", "Sync reportes"],
  },
  {
    name: "API REST Directa",
    category: "Custom",
    desc: "API REST completamente documentada con ejemplos en cURL, Python y JavaScript. Para cualquier sistema que no esté en esta lista. Integra en horas.",
    color: "#3b82f6",
    features: ["Docs interactivos", "SDKs oficiales", "Sandbox incluido"],
  },
];

const wizardSteps = [
  { num: "1", label: "Selecciona", desc: "Elige tu sistema de la galería de conectores" },
  { num: "2", label: "Configura", desc: "Ingresa credenciales y endpoint del sistema" },
  { num: "3", label: "Mapea", desc: "Asocia campos entre tu sistema y AIDA" },
  { num: "4", label: "Prueba", desc: "Emite un documento de prueba para verificar" },
  { num: "5", label: "Activa", desc: "Activa la conexión en modo producción" },
  { num: "6", label: "Monitorea", desc: "Dashboard de monitoreo en tiempo real" },
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
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
            No importa qué ERP, e-commerce o sistema contable uses. AIDA se conecta con un wizard
            guiado de 6 pasos, sin escribir una línea de código. Y si prefieres hacerlo
            por código, nuestra API REST está completamente documentada.
          </p>
        </div>

        {/* Wizard visual */}
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

        {/* Integration cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integ) => (
            <div
              key={integ.name}
              className="group glass-card p-6 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300"
            >
              <div className="flex items-start gap-4 mb-4">
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
                  <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">{integ.desc}</p>
                </div>
              </div>

              {/* Feature tags */}
              <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-white/5">
                {integ.features.map((f) => (
                  <span
                    key={f}
                    className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 text-slate-400 border border-white/5"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* API highlight */}
        <div className="mt-16 glass-card p-8 sm:p-10 glow-blue">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-xl font-bold text-white mb-3">
                ¿Tu sistema no está en la lista?
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
                <span className="text-slate-500"># PDF + XML + QR en &lt; 3 segundos</span>
                {"\n"}
                factura = response.json()
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

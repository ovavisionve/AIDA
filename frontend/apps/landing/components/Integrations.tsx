const integrationBenefits = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    title: "Más de 100 ERPs compatibles",
    desc: "Nos integramos con los principales sistemas del mercado: ERPs, plataformas contables, e-commerce y soluciones empresariales. Si tu sistema puede hacer requests HTTP, se conecta con AIDA.",
    highlight: "+100 sistemas",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.42 15.17l-5.1-5.1m0 0L12 4.37m-5.68 5.7h11.8M4.26 19.72a9.94 9.94 0 005.74 2.27c5.52 0 10-4.48 10-10S15.52 2 10 2 0 6.48 0 12c0 2.38.83 4.56 2.22 6.28" />
      </svg>
    ),
    title: "Nos adaptamos a tu sistema",
    desc: "¿Tu ERP no está en la lista de los 100+? No importa. Nuestro equipo técnico se adapta a cualquier sistema que utilices. Te acompañamos en todo el proceso de integración para que no tengas que cambiar nada de tu operación actual.",
    highlight: "Adaptación total",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    title: "API REST documentada",
    desc: "Para equipos técnicos que prefieren integrarse directamente: API REST completamente documentada con ejemplos en cURL, Python y JavaScript. Sandbox de pruebas incluido, SDKs oficiales y soporte técnico dedicado.",
    highlight: "Docs interactivos",
  },
];

const wizardSteps = [
  { num: "1", label: "Selecciona", desc: "Elige tu sistema o cuéntanos cuál usas" },
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
            Compatible con <span className="gradient-text">más de 100 ERPs</span>
          </p>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
            No importa qué ERP, e-commerce o sistema contable uses. AIDA se integra con más de 100 sistemas
            del mercado. Y si el tuyo no está en la lista, nos adaptamos. Wizard guiado de 6 pasos
            sin escribir una línea de código, o API REST completamente documentada.
          </p>
        </div>

        {/* Big number highlight */}
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-6 glass-card px-10 py-8 glow-blue">
            <div className="text-6xl sm:text-7xl font-black gradient-text">+100</div>
            <div className="text-left">
              <div className="text-lg font-bold text-white">ERPs y sistemas compatibles</div>
              <div className="text-sm text-slate-400 mt-1">Y si el tuyo no está, nos adaptamos sin problema</div>
            </div>
          </div>
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

        {/* Integration benefits cards */}
        <div className="grid gap-6 lg:grid-cols-3">
          {integrationBenefits.map((benefit) => (
            <div
              key={benefit.title}
              className="group glass-card p-7 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300"
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
          ))}
        </div>

        {/* API highlight */}
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
      </div>
    </section>
  );
}

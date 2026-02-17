export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden grid-bg">
      {/* === ORBS FLOTANTES ANIMADOS === */}
      <div className="orb orb-blue w-[500px] h-[500px] -top-32 -left-40 float-element" />
      <div className="orb orb-cyan w-[400px] h-[400px] top-1/3 -right-32 float-element-slow" />
      <div className="orb orb-purple w-[350px] h-[350px] bottom-20 left-1/4 float-element-delayed" />
      <div className="orb orb-blue w-[250px] h-[250px] bottom-40 right-1/3 float-element-slow" />
      <div className="orb orb-cyan w-[300px] h-[300px] top-20 left-1/2 float-element-delayed" />

      {/* === GRADIENTE AMBIENTAL SUPERIOR === */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-aida-accent/8 via-aida-cyan/5 to-transparent rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
        {/* === BADGE ANIMADO === */}
        <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-aida-accent/30 bg-aida-accent/5 backdrop-blur-sm mb-10 shadow-lg shadow-aida-accent/5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-aida-cyan opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-aida-cyan" />
          </span>
          <span className="text-xs sm:text-sm font-semibold tracking-wide text-aida-cyan">
            Potenciado por Inteligencia Artificial
          </span>
        </div>

        {/* === HEADLINE === */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.08] tracking-tight max-w-5xl mx-auto">
          <span className="text-white">La Primera Imprenta Digital</span>
          <br />
          <span className="text-white">de Venezuela Gestionada por</span>
          <br />
          <span className="gradient-text">Inteligencia Artificial</span>
        </h1>

        {/* === SUBTITULO === */}
        <p className="mt-8 text-lg sm:text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
          Emite facturas, notas de crédito, guías de despacho y retenciones en{" "}
          <span className="text-white font-semibold">segundos</span>. Cumplimiento SENIAT
          automático, integración con tu ERP, y una IA que te asiste{" "}
          <span className="text-aida-cyan font-semibold">24/7</span>.
        </p>

        {/* === CTAs === */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#contacto"
            className="group relative px-10 py-4 rounded-xl bg-gradient-to-r from-aida-accent to-aida-cyan text-base sm:text-lg font-bold text-white shadow-lg shadow-aida-accent/25 hover:shadow-2xl hover:shadow-aida-accent/40 hover:scale-[1.03] transition-all duration-300"
          >
            <span className="relative z-10 flex items-center gap-2">
              Comenzar Ahora
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </a>
          <a
            href="/como-funciona"
            className="group px-10 py-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm text-base sm:text-lg font-medium text-slate-300 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all duration-300"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-aida-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Ver cómo funciona
            </span>
          </a>
        </div>

        {/* === STATS CON EFECTO 3D === */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-5 max-w-4xl mx-auto perspective-container">
          {[
            {
              value: "< 3s",
              label: "Emisión de documento",
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
            },
            {
              value: "99.9%",
              label: "Disponibilidad",
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ),
            },
            {
              value: "6+",
              label: "Integraciones ERP",
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              ),
            },
            {
              value: "100%",
              label: "Cumplimiento SENIAT",
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ),
            },
          ].map((s) => (
            <div key={s.label} className="perspective-container">
              <div className="tilt-card glass-card p-5 sm:p-6 text-center group hover:bg-white/[0.08] hover:border-aida-accent/20 transition-all duration-500">
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br from-aida-accent/20 to-aida-cyan/20 flex items-center justify-center text-aida-cyan group-hover:scale-110 transition-transform">
                  {s.icon}
                </div>
                <div className="text-2xl sm:text-3xl font-black gradient-text counter-glow">
                  {s.value}
                </div>
                <div className="mt-1.5 text-xs sm:text-sm text-slate-500 font-medium">
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* === DASHBOARD MOCKUP 3D === */}
        <div className="mt-20 relative mx-auto max-w-5xl perspective-container">
          <div className="tilt-card float-element-slow glow-blue rounded-2xl overflow-hidden border border-white/10">
            {/* Barra de título del navegador */}
            <div className="bg-aida-primary/90 backdrop-blur-md p-4 flex items-center gap-3 border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors" />
                <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-aida-dark/60 px-5 py-1.5 rounded-lg border border-white/5">
                  <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  app.aida.com.ve/dashboard
                </div>
              </div>
              <div className="w-16" />
            </div>

            {/* Contenido del dashboard */}
            <div className="bg-gradient-to-br from-aida-dark via-aida-primary/40 to-aida-dark p-6 sm:p-10 min-h-[380px]">
              {/* Header del dashboard */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">Dashboard Principal</div>
                  <div className="text-sm text-white font-semibold mt-0.5">Resumen del dia</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-green-500/10 border border-green-500/20">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                    </span>
                    <span className="text-[10px] text-green-400 font-medium">En linea</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Card principal: Documentos emitidos */}
                <div className="col-span-2 glass-card glow-blue p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                      Documentos emitidos hoy
                    </div>
                    <div className="text-[10px] text-green-400 font-medium flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      +18%
                    </div>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-white">
                    247
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Facturas", value: "142", color: "from-aida-accent to-aida-cyan" },
                      { label: "N. Credito", value: "38", color: "from-cyan-500 to-teal-400" },
                      { label: "Guias", value: "45", color: "from-violet-500 to-purple-400" },
                      { label: "Retenciones", value: "22", color: "from-amber-500 to-orange-400" },
                    ].map((item) => (
                      <div key={item.label} className="text-center">
                        <div className="text-sm font-bold text-white">{item.value}</div>
                        <div className="text-[9px] text-slate-500 mt-0.5">{item.label}</div>
                        <div className="mt-1.5 h-1 bg-aida-dark/60 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
                            style={{ width: `${(parseInt(item.value) / 150) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card: Estado operativo */}
                <div className="glass-card p-5 flex flex-col items-center justify-center text-center">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-3">
                    Estado
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-500/15 border border-green-500/20 flex items-center justify-center animate-pulse-slow">
                    <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-green-400">Operativo</div>
                  <div className="mt-1 text-[10px] text-slate-500">Uptime 99.97%</div>
                </div>

                {/* Card: Factura reciente */}
                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-md bg-aida-accent/20 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-aida-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                      Ultima factura
                    </div>
                  </div>
                  <div className="text-sm font-mono text-aida-cyan font-semibold">A-00000247</div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-[10px] text-slate-500">Emitida 14:32</div>
                    <div className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 font-medium">OK</div>
                  </div>
                </div>

                {/* Card: Nota de credito reciente */}
                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-md bg-cyan-500/20 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                      </svg>
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                      N. Credito
                    </div>
                  </div>
                  <div className="text-sm font-mono text-aida-cyan font-semibold">NC-00000089</div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-[10px] text-slate-500">Emitida 14:28</div>
                    <div className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 font-medium">OK</div>
                  </div>
                </div>

                {/* Card: Estado IA */}
                <div className="glass-card glow-blue p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-md bg-violet-500/20 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                      Asistente IA
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 leading-relaxed">
                    <span className="text-green-400 font-medium">0 anomalias</span> detectadas
                  </div>
                  <div className="mt-1.5 flex items-center gap-1">
                    <div className="flex-1 h-1 rounded-full bg-gradient-to-r from-aida-accent to-aida-cyan" />
                    <span className="text-[9px] text-aida-cyan font-medium">Activa</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reflejo sutil debajo del mockup */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-gradient-to-b from-aida-accent/10 to-transparent blur-2xl rounded-full pointer-events-none" />
        </div>
      </div>
    </section>
  );
}

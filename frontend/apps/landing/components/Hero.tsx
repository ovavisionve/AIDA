export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 grid-bg">
      {/* Ambient glows */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-aida-accent/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-aida-cyan/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-aida-accent/30 bg-aida-accent/5 mb-8">
          <span className="w-2 h-2 rounded-full bg-aida-cyan animate-pulse-slow" />
          <span className="text-xs font-medium text-aida-cyan">
            Potenciado por Inteligencia Artificial
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tight">
          La Imprenta Digital
          <br />
          <span className="gradient-text">más Inteligente</span>
          <br />
          de Venezuela
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Emite facturas, notas de crédito, guías de despacho y retenciones
          en <span className="text-white font-semibold">segundos</span>. Cumplimiento SENIAT
          automático, integración con tu ERP, y una IA que te asiste 24/7.
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#contacto"
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-aida-accent to-aida-cyan text-base font-bold text-white shadow-lg shadow-aida-accent/25 hover:shadow-xl hover:shadow-aida-accent/30 hover:scale-[1.02] transition-all"
          >
            Comenzar Ahora
          </a>
          <a
            href="#como-funciona"
            className="px-8 py-3.5 rounded-xl border border-white/10 text-base font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-all"
          >
            Ver cómo funciona
          </a>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {[
            { value: "< 3s", label: "Emisión de documento" },
            { value: "99.9%", label: "Disponibilidad" },
            { value: "6+", label: "Integraciones ERP" },
            { value: "100%", label: "Cumplimiento SENIAT" },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4">
              <div className="text-2xl sm:text-3xl font-black gradient-text">{s.value}</div>
              <div className="mt-1 text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Mockup preview */}
        <div className="mt-16 relative mx-auto max-w-4xl">
          <div className="glow-blue rounded-2xl overflow-hidden border border-white/10">
            <div className="bg-aida-primary/80 backdrop-blur p-4 flex items-center gap-2 border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 text-center">
                <span className="text-xs text-slate-500 bg-aida-dark/50 px-4 py-1 rounded-md">
                  app.aida.com.ve
                </span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-aida-dark via-aida-primary/50 to-aida-dark p-8 sm:p-12 min-h-[300px] flex items-center justify-center">
              <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
                {/* Simulated dashboard cards */}
                <div className="col-span-2 glass-card p-4 space-y-2">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Documentos hoy</div>
                  <div className="text-2xl font-bold text-white">247</div>
                  <div className="h-1.5 bg-aida-dark rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-aida-accent to-aida-cyan rounded-full" />
                  </div>
                </div>
                <div className="glass-card p-4 flex flex-col items-center justify-center">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Estado</div>
                  <div className="mt-1 w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="mt-1 text-[10px] text-green-400">Operativo</div>
                </div>
                <div className="glass-card p-4">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Factura</div>
                  <div className="mt-1 text-sm font-mono text-aida-cyan">A-00000127</div>
                  <div className="mt-0.5 text-[10px] text-slate-500">Emitida 12:34</div>
                </div>
                <div className="glass-card p-4">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">N. Crédito</div>
                  <div className="mt-1 text-sm font-mono text-aida-cyan">NC-00000045</div>
                  <div className="mt-0.5 text-[10px] text-slate-500">Emitida 12:31</div>
                </div>
                <div className="glass-card p-4">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">IA</div>
                  <div className="mt-1 text-[10px] text-slate-400 leading-tight">Sin anomalías detectadas</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

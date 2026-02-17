export default function CTA() {
  return (
    <section id="contacto" className="py-24 sm:py-32 relative">
      <div className="orb orb-blue w-72 h-72 top-10 right-10" />
      <div className="orb orb-cyan w-56 h-56 bottom-10 left-10" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="glass-card p-10 sm:p-16 glow-blue">
          <h2 className="text-3xl sm:text-4xl font-bold">
            ¿Listo para{" "}
            <span className="gradient-text">modernizar</span>
            {" "}tu facturación?
          </h2>
          <p className="mt-4 text-slate-400 max-w-lg mx-auto">
            Agenda una demo personalizada. Te mostramos cómo AIDA se conecta con tu
            sistema en minutos y cómo la IA transforma tu operación fiscal.
          </p>

          <form className="mt-10 max-w-md mx-auto space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Nombre"
                aria-label="Nombre completo"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-aida-accent/50 focus:bg-white/[0.08] transition-all text-sm"
              />
              <input
                type="text"
                placeholder="Empresa"
                aria-label="Nombre de la empresa"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-aida-accent/50 focus:bg-white/[0.08] transition-all text-sm"
              />
            </div>
            <input
              type="email"
              placeholder="Email corporativo"
              aria-label="Email corporativo"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-aida-accent/50 focus:bg-white/[0.08] transition-all text-sm"
            />
            <input
              type="tel"
              placeholder="Teléfono / WhatsApp"
              aria-label="Teléfono o WhatsApp"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-aida-accent/50 focus:bg-white/[0.08] transition-all text-sm"
            />
            <select
              aria-label="Sistema ERP actual"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 focus:outline-none focus:border-aida-accent/50 transition-all text-sm appearance-none"
            >
              <option value="">¿Qué sistema usas actualmente?</option>
              <option value="sap">SAP Business One</option>
              <option value="odoo">Odoo</option>
              <option value="woocommerce">WooCommerce</option>
              <option value="prestashop">PrestaShop</option>
              <option value="contpaqi">CONTPAQi</option>
              <option value="excel">Excel / Manual</option>
              <option value="otro">Otro</option>
              <option value="ninguno">No tengo sistema</option>
            </select>
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-aida-accent to-aida-cyan text-base font-bold text-white shadow-lg shadow-aida-accent/25 hover:shadow-xl hover:shadow-aida-accent/30 hover:scale-[1.01] transition-all"
            >
              Solicitar Demo Gratuita
            </button>
            <p className="text-xs text-slate-500">
              Sin compromiso. Te contactamos en menos de 24 horas.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

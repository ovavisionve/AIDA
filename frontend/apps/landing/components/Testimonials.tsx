const testimonials = [
  {
    quote:
      "Antes tardábamos 20 minutos por factura entre Odoo y la imprenta. Con AIDA es automático. Conectamos el wizard y las facturas salen solas.",
    name: "Carlos Santoni",
    role: "Director General",
    company: "Alimentos Santoni C.A.",
    initials: "CS",
  },
  {
    quote:
      "No teníamos sistema de facturación. AIDA nos dio todo: el facturador, las plantillas, los números de control. Empezamos a facturar el mismo día.",
    name: "Luis Pérez",
    role: "Gerente de Operaciones",
    company: "Electro Caribe",
    initials: "LP",
  },
  {
    quote:
      "La IA es increíble. Me avisó que estaba emitiendo una nota de crédito con un monto mayor al documento original. Me salvó de un problema con el SENIAT.",
    name: "María Rodríguez",
    role: "Contadora",
    company: "Alimentos Santoni C.A.",
    initials: "MR",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-aida-cyan">
            Testimonios
          </h2>
          <p className="mt-3 text-3xl sm:text-4xl font-bold">
            Lo que dicen <span className="gradient-text">nuestros clientes</span>
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="glass-card p-6 flex flex-col">
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <blockquote className="text-sm text-slate-300 leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              <div className="mt-6 flex items-center gap-3 pt-4 border-t border-white/5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aida-accent to-aida-cyan flex items-center justify-center text-white text-xs font-bold">
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="text-xs text-slate-500">
                    {t.role}, {t.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

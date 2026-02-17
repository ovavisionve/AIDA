"use client";

import AnimateOnScroll from "@/components/AnimateOnScroll";

const testimonials = [
  {
    quote:
      "Antes tardábamos 20 minutos por factura entre Odoo y la imprenta. Con AIDA conectamos el wizard de integración en 1 hora y ahora cada factura se genera automáticamente cuando se confirma un pedido. Eliminamos 3 horas diarias de trabajo manual.",
    name: "Carlos Santoni",
    role: "Director General",
    company: "Alimentos Santoni C.A.",
    initials: "CS",
    metric: "3h/día ahorradas",
  },
  {
    quote:
      "No teníamos sistema de facturación. AIDA nos dio todo: el portal facturador, las 4 plantillas, los números de control. Subimos nuestro logo, elegimos la plantilla corporativa y empezamos a facturar el mismo día. Sin contratar programadores.",
    name: "Luis Pérez",
    role: "Gerente de Operaciones",
    company: "Electro Caribe",
    initials: "LP",
    metric: "0 días de setup",
  },
  {
    quote:
      "La IA detectó que estaba emitiendo una nota de crédito con un monto mayor al documento original. También me alertó sobre números de control que estaban por agotarse y me explicó cómo calcular correctamente el IGTF. Me salvó de un problema con el SENIAT.",
    name: "María Rodríguez",
    role: "Contadora",
    company: "Alimentos Santoni C.A.",
    initials: "MR",
    metric: "0 errores fiscales",
  },
];

export default function Testimonials() {
  return (
    <section className="relative py-24 sm:py-32">
      {/* Ambient */}
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-aida-accent/6 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-56 h-56 bg-aida-cyan/6 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll animation="fade-in">
          <div className="text-center mb-16">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-aida-cyan">
              Testimonios
            </h2>
            <p className="mt-3 text-3xl sm:text-4xl font-bold">
              Lo que dicen <span className="gradient-text">nuestros clientes</span>
            </p>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto">
              Empresas reales en Venezuela que ya transformaron su facturación con AIDA.
              Resultados verificables, no marketing vacío.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="perspective-container grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <AnimateOnScroll key={t.name} animation="slide-up" delay={i * 150} duration={700}>
              <div
                className="tilt-card glass-card p-6 flex flex-col hover:bg-white/[0.08] hover:border-aida-accent/20 transition-all duration-500 h-full"
              >
                {/* Stars */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, j) => (
                      <svg
                        key={j}
                        className="w-4 h-4 text-amber-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-green-500/20 text-green-400 bg-green-500/5">
                    {t.metric}
                  </span>
                </div>

                <blockquote className="text-sm text-slate-300 leading-relaxed flex-1">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                <div className="mt-6 flex items-center gap-3 pt-4 border-t border-white/5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aida-accent to-aida-cyan flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-aida-accent/20">
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
            </AnimateOnScroll>
          ))}
        </div>

        {/* Social proof bar */}
        <AnimateOnScroll animation="fade-in" delay={300}>
          <div className="mt-12 text-center">
            <p className="text-sm text-slate-500">
              Empresas en sectores como <span className="text-slate-400">alimentos</span>,{" "}
              <span className="text-slate-400">electrónica</span>,{" "}
              <span className="text-slate-400">tecnología</span> y{" "}
              <span className="text-slate-400">servicios profesionales</span>{" "}
              ya confían en AIDA para su facturación digital.
            </p>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}

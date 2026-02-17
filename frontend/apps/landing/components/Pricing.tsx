"use client";

import { useState } from "react";

/* ────────────────────────────────────────────────────────────────────────────
   ESTRUCTURA DE PRECIOS AIDA — 5 MODALIDADES DE SERVICIO
   ────────────────────────────────────────────────────────────────────────────
   1. Solo Facturador (software de facturación, sin números de control)
   2. Solo Imprenta Digital (números de control fiscal, trae tu facturador)
   3. Facturador + Imprenta Digital (solución completa)
   4. Completo + Integración Personalizada
   5. Individual + Integración Personalizada
   ──────────────────────────────────────────────────────────────────────────── */

type ServiceMode =
  | "facturador"
  | "imprenta"
  | "completo"
  | "completo-integracion"
  | "individual-integracion";

interface Plan {
  name: string;
  price: string;
  period: string;
  desc: string;
  features: string[];
  cta: string;
  featured: boolean;
  badge?: string;
}

const serviceModes: { id: ServiceMode; label: string; shortLabel: string; desc: string }[] = [
  {
    id: "facturador",
    label: "Solo Facturador",
    shortLabel: "Facturador",
    desc: "Software de facturación electrónica. Los números de control los manejas con tu imprenta actual.",
  },
  {
    id: "imprenta",
    label: "Solo Imprenta Digital",
    shortLabel: "Imprenta Digital",
    desc: "Números de control fiscal autorizados por SENIAT. Trae tu propio facturador y conecta vía API.",
  },
  {
    id: "completo",
    label: "Facturador + Imprenta",
    shortLabel: "Completo",
    desc: "Solución integral: facturador con IA + números de control SENIAT. Todo en uno.",
  },
  {
    id: "completo-integracion",
    label: "Completo + Integración",
    shortLabel: "Completo + ERP",
    desc: "Facturador + Imprenta + integración personalizada con tu ERP (SAP, Profit Plus, Odoo, etc.)",
  },
  {
    id: "individual-integracion",
    label: "Individual + Integración",
    shortLabel: "Individual + ERP",
    desc: "Cualquier servicio individual + integración personalizada con tu sistema.",
  },
];

const plansByMode: Record<ServiceMode, Plan[]> = {
  facturador: [
    {
      name: "Básico",
      price: "19",
      period: "/mes",
      desc: "Para emprendedores que solo necesitan facturar electrónicamente.",
      features: [
        "100 documentos/mes",
        "1 usuario",
        "Facturas, NC, ND electrónicas",
        "PDF con plantilla SENIAT",
        "Cálculo automático IVA/ISLR",
        "Portal de autogestión",
        "Soporte por email",
      ],
      cta: "Comenzar",
      featured: false,
    },
    {
      name: "Profesional",
      price: "49",
      period: "/mes",
      desc: "Para PyMEs con volumen medio que necesitan más control.",
      features: [
        "500 documentos/mes",
        "5 usuarios",
        "7 tipos de documentos fiscales",
        "4 plantillas PDF",
        "Retenciones IVA e ISLR automáticas",
        "Guías de despacho",
        "Reportes y analytics",
        "Asistente IA",
        "Soporte prioritario",
      ],
      cta: "Elegir Profesional",
      featured: true,
    },
    {
      name: "Empresarial",
      price: "89",
      period: "/mes",
      desc: "Para empresas con alto volumen de facturación.",
      features: [
        "Documentos ilimitados",
        "Hasta 25 usuarios",
        "Todas las plantillas + custom",
        "API REST completa",
        "Emisión batch (hasta 50,000 docs)",
        "IA avanzada con analytics",
        "Export CSV, Excel, TXT SENIAT",
        "Soporte dedicado",
      ],
      cta: "Contactar Ventas",
      featured: false,
    },
  ],
  imprenta: [
    {
      name: "Básico",
      price: "15",
      period: "/mes",
      desc: "Números de control para bajo volumen. Conéctalos a tu facturador.",
      features: [
        "200 números de control/mes",
        "1 serie de control",
        "API REST para asignación",
        "Asignación atómica (concurrencia segura)",
        "Firma digital SHA-256",
        "QR de verificación pública",
        "Portal de validación SENIAT",
        "Soporte por email",
      ],
      cta: "Comenzar",
      featured: false,
    },
    {
      name: "Profesional",
      price: "39",
      period: "/mes",
      desc: "Para PyMEs que necesitan volumen moderado de números de control.",
      features: [
        "1,000 números de control/mes",
        "Hasta 3 series de control",
        "API REST + webhooks",
        "Dashboard de consumo en tiempo real",
        "Trazabilidad completa (IP, timestamp)",
        "Retención de datos por 10 años",
        "Cumplimiento Providencia 102 y 121",
        "Soporte prioritario",
      ],
      cta: "Elegir Profesional",
      featured: true,
    },
    {
      name: "Empresarial",
      price: "79",
      period: "/mes",
      desc: "Alto volumen de números de control con SLA garantizado.",
      features: [
        "Números de control ilimitados",
        "Series ilimitadas",
        "API batch (hasta 50,000 NC)",
        "Webhook en cada asignación",
        "SLA 99.9% disponibilidad",
        "Auditoría completa para SENIAT",
        "Visible en Portal Auditoría SENIAT",
        "Soporte dedicado + SLA",
      ],
      cta: "Contactar Ventas",
      featured: false,
      badge: "Auditable SENIAT",
    },
  ],
  completo: [
    {
      name: "Básico",
      price: "29",
      period: "/mes",
      desc: "Solución completa para pequeños negocios. Factura y números de control.",
      features: [
        "100 documentos + NC/mes",
        "1 usuario",
        "Facturador con IA integrada",
        "Números de control SENIAT",
        "Firma digital + QR",
        "Plantilla Clásica SENIAT",
        "Portal de autogestión",
        "Visible en Portal Auditoría SENIAT",
        "Soporte por email",
      ],
      cta: "Comenzar",
      featured: false,
    },
    {
      name: "Profesional",
      price: "79",
      period: "/mes",
      desc: "Para PyMEs que quieren todo resuelto. El más popular.",
      features: [
        "500 documentos + NC/mes",
        "5 usuarios",
        "7 tipos de documentos fiscales",
        "4 plantillas PDF personalizables",
        "Retenciones IVA/ISLR automáticas",
        "Integración ERP estándar",
        "IA asistente + analytics",
        "Auditable por SENIAT en tiempo real",
        "Soporte prioritario",
      ],
      cta: "Elegir Profesional",
      featured: true,
      badge: "Más Popular",
    },
    {
      name: "Empresarial",
      price: "149",
      period: "/mes",
      desc: "Sin límites. Todo incluido para empresas de alto volumen.",
      features: [
        "Documentos + NC ilimitados",
        "Hasta 99 usuarios",
        "Todas las plantillas + custom",
        "API completa + batch 50K",
        "Integraciones ERP estándar",
        "IA avanzada predictiva",
        "Export CSV, Excel, TXT SENIAT",
        "SLA 99.9% + soporte dedicado",
        "Auditable por SENIAT en tiempo real",
      ],
      cta: "Contactar Ventas",
      featured: false,
    },
  ],
  "completo-integracion": [
    {
      name: "Profesional + ERP",
      price: "119",
      period: "/mes",
      desc: "Facturador + Imprenta + integración dedicada con tu ERP.",
      features: [
        "Todo lo del plan Profesional Completo",
        "Integración personalizada con tu ERP",
        "SAP, Profit Plus, Galac, Odoo, etc.",
        "Wizard de conexión en 6 pasos",
        "Mapeo de campos personalizado",
        "Sincronización bidireccional",
        "Soporte técnico de integración",
        "Setup incluido ($0 implementación)",
      ],
      cta: "Solicitar Demo",
      featured: false,
    },
    {
      name: "Empresarial + ERP",
      price: "199",
      period: "/mes",
      desc: "Todo ilimitado + integración ERP dedicada + gerente de cuenta.",
      features: [
        "Todo lo del plan Empresarial Completo",
        "Integraciones ilimitadas simultáneas",
        "Conectores custom (SAP B1, Odoo, etc.)",
        "API privada + webhooks dedicados",
        "Sincronización en tiempo real",
        "Gerente de cuenta dedicado",
        "SLA 99.9% en integración",
        "Onboarding personalizado",
      ],
      cta: "Contactar Ventas",
      featured: true,
      badge: "Todo Incluido",
    },
    {
      name: "Corporativo",
      price: "349",
      period: "/mes",
      desc: "Para corporaciones. Volumen personalizado, multi-sucursal.",
      features: [
        "Volumen personalizado",
        "Usuarios ilimitados",
        "Multi-sucursal / multi-RIF",
        "Integraciones enterprise a medida",
        "IA predictiva + reportes custom",
        "Servidor dedicado opcional",
        "Gerente + equipo técnico asignado",
        "SLA 99.99% + soporte 24/7",
      ],
      cta: "Hablar con Ventas",
      featured: false,
    },
  ],
  "individual-integracion": [
    {
      name: "Facturador + ERP",
      price: "89",
      period: "/mes",
      desc: "Solo facturador con integración a tu ERP. Sin imprenta digital.",
      features: [
        "Documentos ilimitados",
        "Hasta 25 usuarios",
        "Integración personalizada ERP",
        "Todos los tipos de documentos",
        "API REST completa",
        "Wizard de integración",
        "Sin números de control (usa tu imprenta)",
        "Soporte técnico integración",
      ],
      cta: "Solicitar Demo",
      featured: false,
    },
    {
      name: "Imprenta + ERP",
      price: "99",
      period: "/mes",
      desc: "Solo imprenta digital con integración a tu sistema de facturación.",
      features: [
        "Números de control ilimitados",
        "Series ilimitadas",
        "Integración vía API a tu facturador",
        "Webhook por cada NC asignado",
        "Mapeo de campos personalizado",
        "Auditable por SENIAT",
        "SLA 99.9%",
        "Soporte técnico integración",
      ],
      cta: "Solicitar Demo",
      featured: true,
      badge: "Flexible",
    },
  ],
};

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-aida-cyan shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function Pricing() {
  const [activeMode, setActiveMode] = useState<ServiceMode>("completo");

  const plans = plansByMode[activeMode];
  const currentMode = serviceModes.find((m) => m.id === activeMode)!;

  return (
    <section id="planes" className="py-24 sm:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-aida-primary/10 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-aida-cyan">
            Planes y Precios
          </h2>
          <p className="mt-3 text-3xl sm:text-4xl font-bold">
            Precios <span className="gradient-text">transparentes</span> por servicio
          </p>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
            Elige solo lo que necesitas. <span className="text-white font-semibold">$0 costo de implementación</span>.
            Todos los planes incluyen actualizaciones y cumplimiento SENIAT automático.
          </p>
        </div>

        {/* Service Mode Tabs */}
        <div className="mb-10">
          <div className="flex flex-wrap justify-center gap-2">
            {serviceModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  activeMode === mode.id
                    ? "bg-gradient-to-r from-aida-accent to-aida-cyan text-white shadow-lg shadow-aida-accent/25"
                    : "bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="hidden sm:inline">{mode.label}</span>
                <span className="sm:hidden">{mode.shortLabel}</span>
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-slate-500 mt-4 max-w-lg mx-auto">
            {currentMode.desc}
          </p>
        </div>

        {/* Plans Grid */}
        <div className={`grid gap-6 max-w-5xl mx-auto ${
          plans.length === 2 ? "lg:grid-cols-2 max-w-3xl" : "lg:grid-cols-3"
        }`}>
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 transition-all duration-300 ${
                plan.featured
                  ? "bg-gradient-to-b from-aida-accent/10 to-aida-cyan/5 border-2 border-aida-accent/30 scale-[1.02] shadow-lg shadow-aida-accent/10"
                  : "glass-card hover:border-white/20"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-aida-accent to-aida-cyan text-xs font-bold text-white whitespace-nowrap">
                  {plan.badge}
                </div>
              )}
              {plan.featured && !plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-aida-accent to-aida-cyan text-xs font-bold text-white">
                  Más Popular
                </div>
              )}

              <h3 className="text-lg font-bold text-white">{plan.name}</h3>
              <p className="mt-1 text-sm text-slate-400">{plan.desc}</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">${plan.price}</span>
                <span className="text-slate-500">{plan.period}</span>
              </div>

              <ul className="mt-8 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <CheckIcon />
                    <span className="text-slate-300">{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#contacto"
                className={`mt-8 block w-full text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                  plan.featured
                    ? "bg-gradient-to-r from-aida-accent to-aida-cyan text-white hover:shadow-lg hover:shadow-aida-accent/25"
                    : "border border-white/10 text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        {/* Comparison note */}
        <div className="mt-12 max-w-3xl mx-auto">
          <div className="glass-card p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aida-accent/20 to-aida-cyan/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-aida-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">¿No sabes cuál elegir?</h4>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  <strong className="text-white">Solo Facturador:</strong> Si ya tienes imprenta digital autorizada y solo necesitas el software.{" "}
                  <strong className="text-white">Solo Imprenta:</strong> Si ya tienes facturador pero necesitas números de control SENIAT.{" "}
                  <strong className="text-white">Completo:</strong> La opción más popular — todo resuelto en una plataforma.{" "}
                  <strong className="text-white">+ Integración:</strong> Si necesitas conectar con SAP, Profit Plus, Odoo u otro ERP.
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Solo los clientes con <strong className="text-aida-cyan">Imprenta Digital</strong> (planes que incluyen números de control) aparecen en el{" "}
                  <strong className="text-aida-cyan">Portal de Auditoría SENIAT</strong> para verificación fiscal.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          ¿Necesitas un plan Enterprise a medida?{" "}
          <a href="#contacto" className="text-aida-cyan hover:underline">
            Hablemos
          </a>
        </p>
      </div>
    </section>
  );
}

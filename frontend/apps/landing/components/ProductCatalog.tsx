"use client";

import { useState } from "react";

const skuCategories = [
  {
    id: "numeros-control",
    name: "Números de Control",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
      </svg>
    ),
    products: [
      {
        sku: "AIDA-NC-500",
        name: "Paquete Inicio",
        volume: "500 números de control",
        price: 29,
        pricePerUnit: "$0.058",
        features: ["Secuencia SENIAT válida", "Asignación inmediata", "Registro auditable", "1 RIF"],
      },
      {
        sku: "AIDA-NC-2K",
        name: "Paquete PyME",
        volume: "2,000 números de control",
        price: 79,
        pricePerUnit: "$0.040",
        popular: true,
        features: ["Secuencia SENIAT válida", "Asignación inmediata", "Registro auditable", "Hasta 3 RIF", "IA incluida"],
      },
      {
        sku: "AIDA-NC-10K",
        name: "Paquete Empresarial",
        volume: "10,000 números de control",
        price: 149,
        pricePerUnit: "$0.015",
        features: ["Secuencia SENIAT válida", "Asignación batch", "Trazabilidad completa", "RIF ilimitados", "IA avanzada", "API batch"],
      },
      {
        sku: "AIDA-NC-50K",
        name: "Paquete Corporativo",
        volume: "50,000 números de control",
        price: 299,
        pricePerUnit: "$0.006",
        features: ["Secuencia SENIAT válida", "Asignación batch masivo", "Trazabilidad forense", "RIF ilimitados", "IA predictiva", "API batch + webhooks", "Gerente de cuenta dedicado"],
      },
    ],
  },
  {
    id: "documentos",
    name: "Documentos Fiscales",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    products: [
      {
        sku: "AIDA-FAC-001",
        name: "Factura Electrónica",
        volume: "Por unidad",
        price: 0,
        pricePerUnit: "Incluido",
        features: ["PDF + XML + QR", "Firma digital", "4 plantillas de diseño", "Logo personalizado", "Envío automático email"],
      },
      {
        sku: "AIDA-NC-001",
        name: "Nota de Crédito",
        volume: "Por unidad",
        price: 0,
        pricePerUnit: "Incluido",
        features: ["Vinculada a factura original", "Validación automática de montos", "Alerta IA si monto excede", "Anulación controlada"],
      },
      {
        sku: "AIDA-ND-001",
        name: "Nota de Débito",
        volume: "Por unidad",
        price: 0,
        pricePerUnit: "Incluido",
        features: ["Ajuste de precios", "Intereses y mora", "Diferencia cambiaria", "Trazabilidad completa"],
      },
      {
        sku: "AIDA-GD-001",
        name: "Guía de Despacho",
        volume: "Por unidad",
        price: 0,
        pricePerUnit: "Incluido",
        features: ["Dirección de destino", "Transportista asignado", "Items y cantidades", "Formato SENIAT"],
      },
      {
        sku: "AIDA-RET-IVA",
        name: "Comprobante de Retención IVA",
        volume: "Por unidad",
        price: 0,
        pricePerUnit: "Incluido",
        features: ["Cálculo automático 75% / 100%", "Vinculado a factura original", "Formato SENIAT vigente", "Numeración correlativa"],
      },
      {
        sku: "AIDA-RET-ISLR",
        name: "Comprobante de Retención ISLR",
        volume: "Por unidad",
        price: 0,
        pricePerUnit: "Incluido",
        features: ["Tabla de retenciones actualizada", "Cálculo automático según actividad", "Formato SENIAT vigente", "Acumulado por período"],
      },
    ],
  },
  {
    id: "integraciones",
    name: "Integraciones ERP",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    products: [
      {
        sku: "AIDA-INT-ERP",
        name: "Conector ERP Universal",
        volume: "Incluido en tu plan",
        price: 0,
        pricePerUnit: "Incluido",
        features: ["Compatible con más de 100 ERPs", "Wizard de integración guiado", "Sync bidireccional", "Soporte técnico incluido"],
      },
      {
        sku: "AIDA-INT-ECOM",
        name: "Conector E-Commerce",
        volume: "Incluido en tu plan",
        price: 0,
        pricePerUnit: "Incluido",
        features: ["Tiendas online compatibles", "Auto-factura al pagar", "Sync inventario", "Multi-tienda soportado"],
      },
      {
        sku: "AIDA-INT-CUSTOM",
        name: "Adaptación a tu Sistema",
        volume: "Incluido en tu plan",
        price: 0,
        pricePerUnit: "Incluido",
        features: ["Nos adaptamos a tu ERP", "Integración personalizada", "Acompañamiento técnico", "Sin importar el sistema que uses"],
      },
      {
        sku: "AIDA-INT-API",
        name: "API REST Directa",
        volume: "Incluido en tu plan",
        price: 0,
        pricePerUnit: "Incluido",
        features: ["REST API documentada", "API Keys ilimitadas", "Rate limiting configurable", "Webhooks + callbacks"],
      },
    ],
  },
];

export default function ProductCatalog() {
  const [activeCategory, setActiveCategory] = useState("numeros-control");

  const currentCategory = skuCategories.find((c) => c.id === activeCategory)!;

  return (
    <section id="productos" className="py-24 sm:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-aida-primary/10 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-aida-cyan">
            Catálogo de Productos
          </h2>
          <p className="mt-3 text-3xl sm:text-4xl font-bold">
            Todo tu flujo fiscal en{" "}
            <span className="gradient-text">un solo lugar</span>
          </p>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
            Desde la asignación de números de control hasta la integración con tu ERP.
            Cada servicio tiene precio transparente y se activa al instante.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {skuCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? "bg-gradient-to-r from-aida-accent to-aida-cyan text-white shadow-lg shadow-aida-accent/25"
                  : "glass-card text-slate-400 hover:text-white hover:bg-white/[0.08]"
              }`}
            >
              {cat.icon}
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {currentCategory.products.map((product) => (
            <div
              key={product.sku}
              className={`relative glass-card p-6 flex flex-col transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 ${
                "popular" in product && product.popular ? "border-aida-accent/30 ring-1 ring-aida-accent/20" : ""
              }`}
            >
              {"popular" in product && product.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-aida-accent to-aida-cyan text-[10px] font-bold text-white whitespace-nowrap">
                  Más vendido
                </div>
              )}

              {/* Category indicator */}
              <div className="inline-flex self-start items-center px-2.5 py-0.5 rounded-md bg-aida-dark border border-white/10 text-[10px] font-mono text-slate-500 mb-3">
                {product.price > 0 ? `Desde $${product.price}` : "Incluido"}
              </div>

              <h3 className="text-base font-bold text-white">{product.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{product.volume}</p>

              <div className="mt-4 flex items-baseline gap-1">
                {product.price > 0 ? (
                  <>
                    <span className="text-3xl font-black text-white">${product.price}</span>
                    <span className="text-sm text-slate-500">{product.pricePerUnit}</span>
                  </>
                ) : (
                  <span className="text-lg font-bold text-green-400">{product.pricePerUnit}</span>
                )}
              </div>

              <ul className="mt-5 space-y-2 flex-1">
                {product.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-slate-400">
                    <svg className="w-3.5 h-3.5 text-aida-cyan shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href="#contacto"
                className={`mt-5 block w-full text-center py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  "popular" in product && product.popular
                    ? "bg-gradient-to-r from-aida-accent to-aida-cyan text-white hover:shadow-lg hover:shadow-aida-accent/25"
                    : "border border-white/10 text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {product.price > 0 ? "Solicitar" : "Incluido en tu plan"}
              </a>
            </div>
          ))}
        </div>

        {/* Sales Flow */}
        <div className="mt-20">
          <h3 className="text-center text-xl font-bold text-white mb-10">
            Flujo de ventas: de la solicitud a la emisión
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                step: "1",
                title: "Solicitud",
                desc: "El cliente solicita su paquete de números de control o plan",
                color: "from-aida-accent to-blue-400",
              },
              {
                step: "2",
                title: "Registro",
                desc: "Se registra RIF, datos fiscales y se configura la cuenta AIDA",
                color: "from-blue-400 to-aida-cyan",
              },
              {
                step: "3",
                title: "Asignación",
                desc: "AIDA asigna rangos de números de control automáticamente",
                color: "from-aida-cyan to-teal-400",
              },
              {
                step: "4",
                title: "Integración",
                desc: "Se conecta el ERP o se activa el facturador propio de AIDA",
                color: "from-teal-400 to-emerald-400",
              },
              {
                step: "5",
                title: "Emisión",
                desc: "El cliente emite documentos fiscales con IA supervisando 24/7",
                color: "from-emerald-400 to-green-400",
              },
            ].map((s, i) => (
              <div key={s.step} className="relative">
                <div className="glass-card p-5 h-full">
                  <div
                    className={`inline-block text-2xl font-black bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}
                  >
                    {s.step}
                  </div>
                  <h4 className="mt-2 text-sm font-bold text-white">{s.title}</h4>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
                {i < 4 && (
                  <div className="hidden lg:block absolute top-1/2 -right-2 -translate-y-1/2 text-slate-600 z-10">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

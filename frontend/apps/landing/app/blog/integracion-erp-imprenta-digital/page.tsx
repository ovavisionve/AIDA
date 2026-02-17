import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Integración ERP + Imprenta Digital: La combinación perfecta",
  description:
    "Aprende cómo integrar tu ERP (SAP Business One, Odoo, WooCommerce, PrestaShop) con una imprenta digital autorizada. API REST, sincronización de datos y el wizard de AIDA que lo hace posible sin código.",
  keywords: [
    "integración ERP facturación Venezuela",
    "SAP Business One imprenta digital",
    "Odoo facturación electrónica Venezuela",
    "WooCommerce factura fiscal Venezuela",
    "PrestaShop facturación SENIAT",
    "API REST facturación Venezuela",
    "integración ERP AIDA",
    "wizard configuración facturación",
    "sincronización datos facturación",
  ],
  openGraph: {
    title: "Integración ERP + Imprenta Digital: La combinación perfecta",
    description:
      "Conecta tu ERP con AIDA: SAP Business One, Odoo, WooCommerce, PrestaShop. API REST, wizard sin código y sincronización automática.",
    type: "article",
    locale: "es_VE",
    url: "https://aida.com.ve/blog/integracion-erp-imprenta-digital",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  alternates: {
    canonical: "https://aida.com.ve/blog/integracion-erp-imprenta-digital",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Integración ERP + Imprenta Digital: La combinación perfecta",
  description:
    "Cómo integrar tu ERP con una imprenta digital autorizada: SAP, Odoo, WooCommerce, PrestaShop, API REST y wizard de AIDA.",
  author: { "@type": "Organization", name: "AIDA Imprenta Digital" },
  publisher: {
    "@type": "Organization",
    name: "AIDA Imprenta Digital C.A.",
    logo: { "@type": "ImageObject", url: "https://aida.com.ve/favicon.ico" },
  },
  datePublished: "2024-11-08",
  dateModified: "2024-11-08",
  mainEntityOfPage: "https://aida.com.ve/blog/integracion-erp-imprenta-digital",
  image: "https://aida.com.ve/og-image.png",
};

const relatedArticles = [
  {
    title: "Facturación electrónica en Venezuela: Guía completa 2025",
    slug: "/blog/facturacion-electronica-venezuela-guia-2025",
    category: "Guía",
    categoryColor: "from-aida-cyan to-teal-400",
  },
  {
    title: "Cómo la IA está transformando la facturación empresarial",
    slug: "/blog/ia-transformando-facturacion",
    category: "Tecnología",
    categoryColor: "from-amber-500 to-orange-400",
  },
  {
    title: "¿Qué es una imprenta digital autorizada por el SENIAT?",
    slug: "/blog/imprenta-digital-autorizada-seniat",
    category: "Educación",
    categoryColor: "from-aida-accent to-blue-400",
  },
];

const tableOfContents = [
  { id: "por-que-integrar", label: "¿Por qué integrar tu ERP con la imprenta?" },
  { id: "manual-vs-automatizado", label: "Proceso manual vs. automatizado" },
  { id: "wizard-aida", label: "El wizard de AIDA: integración sin código" },
  { id: "conectores", label: "Conectores específicos" },
  { id: "api-rest", label: "API REST para sistemas personalizados" },
  { id: "sincronizacion", label: "Sincronización de datos" },
  { id: "implementacion", label: "Timeline de implementación" },
  { id: "casos-exito", label: "Escenarios de integración comunes" },
];

export default function ArticlePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="relative pt-28 pb-20">
        {/* Ambient orbs */}
        <div className="orb orb-cyan w-96 h-96 -top-20 -right-40" />
        <div className="orb orb-blue w-72 h-72 top-1/3 -left-36" />
        <div className="orb orb-purple w-64 h-64 bottom-1/4 right-0" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
            <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <span>/</span>
            <span className="text-slate-300">Integración ERP + Imprenta Digital</span>
          </nav>

          {/* Article header */}
          <header className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-500 to-green-400 bg-clip-text text-transparent border border-white/10">
                Integraciones
              </span>
              <span className="text-sm text-slate-500">8 Nov 2024</span>
              <span className="text-sm text-slate-500">9 min de lectura</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
              Integración ERP + Imprenta Digital:{" "}
              <span className="gradient-text">La combinación perfecta</span>
            </h1>
            <p className="mt-6 text-lg text-slate-400 leading-relaxed">
              Conectar tu ERP con una imprenta digital autorizada elimina la doble carga de datos,
              los errores humanos y las demoras. Conoce cómo funciona la integración, qué datos se
              sincronizan y por qué el wizard de AIDA lo hace posible sin escribir una sola línea de código.
            </p>
          </header>

          {/* Table of Contents */}
          <div className="glass-card p-6 mb-12">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-aida-cyan mb-4">
              Tabla de contenido
            </h2>
            <nav className="grid sm:grid-cols-2 gap-2">
              {tableOfContents.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="w-3 h-3 text-aida-accent shrink-0" fill="currentColor" viewBox="0 0 8 8">
                    <circle cx="4" cy="4" r="3" />
                  </svg>
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Article body */}
          <div className="prose-custom space-y-10">
            {/* Section 1 */}
            <section id="por-que-integrar">
              <h2 className="text-2xl font-bold text-white mb-4">
                ¿Por qué integrar tu ERP con la imprenta digital?
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                La mayoría de las empresas en Venezuela operan con algún tipo de sistema de gestión empresarial (ERP), ya sea una solución robusta como SAP Business One, una plataforma de código abierto como Odoo, o incluso un sistema de comercio electrónico como WooCommerce o PrestaShop que funciona como su principal herramienta de ventas. En todos estos sistemas, los datos de las transacciones comerciales ya existen: clientes, productos, precios, cantidades, condiciones de pago.
              </p>
              <p className="text-slate-300 leading-relaxed mb-4">
                El problema surge cuando esos datos deben trasladarse a una plataforma de facturación fiscal separada para generar los documentos legales. Sin integración, el proceso es manual: un operador debe copiar los datos de la venta desde el ERP hacia la plataforma de facturación, verificar que todo esté correcto, generar el documento fiscal, y luego registrar el número de documento generado de vuelta en el ERP. Este proceso es lento, propenso a errores y profundamente ineficiente.
              </p>
              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <div className="glass-card p-5 text-center">
                  <div className="text-3xl font-bold gradient-text mb-2">85%</div>
                  <p className="text-sm text-slate-400">Reducción de tiempo de facturación con integración automatizada</p>
                </div>
                <div className="glass-card p-5 text-center">
                  <div className="text-3xl font-bold gradient-text mb-2">0</div>
                  <p className="text-sm text-slate-400">Errores de transcripción al eliminar la doble carga de datos</p>
                </div>
                <div className="glass-card p-5 text-center">
                  <div className="text-3xl font-bold gradient-text mb-2">24/7</div>
                  <p className="text-sm text-slate-400">Operación continua sin depender de la disponibilidad del personal</p>
                </div>
              </div>
              <p className="text-slate-300 leading-relaxed">
                La integración resuelve este problema al crear un puente automático entre el ERP y la imprenta digital. Cuando se registra una venta en el ERP, el documento fiscal correspondiente se genera automáticamente en la imprenta digital, con todos los datos correctos, el número de control asignado, y la respuesta (número de documento fiscal, PDF, estado) se registra de vuelta en el ERP. El proceso que antes tomaba minutos ahora ocurre en milisegundos, sin intervención humana y sin posibilidad de error de transcripción.
              </p>
            </section>

            {/* Section 2 */}
            <section id="manual-vs-automatizado">
              <h2 className="text-2xl font-bold text-white mb-4">
                Proceso manual vs. automatizado
              </h2>
              <p className="text-slate-300 leading-relaxed mb-6">
                Para entender el impacto real de la integración, comparemos el flujo de trabajo con y sin ella:
              </p>
              <div className="grid sm:grid-cols-2 gap-6 mb-6">
                <div className="glass-card p-6 border-t-2 border-red-500">
                  <h3 className="text-lg font-semibold text-red-400 mb-4">Sin integración (manual)</h3>
                  <div className="space-y-3">
                    {[
                      "Registrar la venta en el ERP",
                      "Abrir la plataforma de facturación",
                      "Buscar o crear el cliente en la plataforma",
                      "Ingresar manualmente cada producto/servicio",
                      "Verificar alícuotas de IVA",
                      "Calcular IGTF si aplica",
                      "Revisar todos los campos",
                      "Emitir el documento fiscal",
                      "Descargar el PDF",
                      "Enviar al cliente por correo",
                      "Registrar el número de factura en el ERP",
                      "Archivar el PDF",
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-red-400 font-mono text-xs mt-0.5 shrink-0">{String(i + 1).padStart(2, "0")}.</span>
                        {step}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/10">
                    <p className="text-sm text-red-400 font-semibold">Tiempo estimado: 10-15 minutos por factura</p>
                  </div>
                </div>
                <div className="glass-card p-6 border-t-2 border-green-500">
                  <h3 className="text-lg font-semibold text-green-400 mb-4">Con integración (AIDA)</h3>
                  <div className="space-y-3">
                    {[
                      "Registrar la venta en el ERP",
                      "El documento fiscal se genera automáticamente",
                      "El PDF se envía al cliente automáticamente",
                      "El número de factura se registra en el ERP",
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-green-400 font-mono text-xs mt-0.5 shrink-0">{String(i + 1).padStart(2, "0")}.</span>
                        {step}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/10">
                    <p className="text-sm text-green-400 font-semibold">Tiempo estimado: 2-3 segundos (automático)</p>
                  </div>
                </div>
              </div>
              <p className="text-slate-300 leading-relaxed">
                La diferencia es abismal. Con integración, el operador solo necesita hacer lo que ya hacía: registrar la venta en el ERP. Todo lo demás ocurre automáticamente en segundo plano. No hay doble carga, no hay errores de transcripción, no hay demoras y no hay documentos pendientes de emitir al final del día.
              </p>
            </section>

            {/* Section 3 */}
            <section id="wizard-aida">
              <h2 className="text-2xl font-bold text-white mb-4">
                El wizard de AIDA: integración sin código
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                AIDA ha desarrollado un wizard (asistente guiado) de configuración que permite establecer la integración con tu ERP sin necesidad de escribir código, contratar desarrolladores ni realizar proyectos de implementación complejos. El wizard guía al usuario paso a paso a través del proceso de conexión, mapeo de datos y configuración de reglas.
              </p>
              <div className="space-y-4 mb-6">
                <div className="glass-card p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">1</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white">Selección del conector</h3>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    El wizard presenta los conectores disponibles (SAP Business One, Odoo, WooCommerce, PrestaShop, API REST genérica) y el usuario selecciona el que corresponde a su sistema. Cada conector incluye documentación específica y un video tutorial de configuración.
                  </p>
                </div>
                <div className="glass-card p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white">Credenciales de conexión</h3>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    El usuario ingresa las credenciales de acceso a su ERP (URL del servidor, usuario, contraseña o API key). AIDA verifica la conexión en tiempo real y confirma que puede acceder al sistema. Las credenciales se almacenan cifradas con estándar AES-256 y nunca se transmiten en texto plano.
                  </p>
                </div>
                <div className="glass-card p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">3</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white">Mapeo de campos</h3>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    El wizard detecta automáticamente la estructura de datos del ERP y propone un mapeo inteligente entre los campos del ERP y los campos requeridos para el documento fiscal. Por ejemplo, si el ERP tiene un campo &quot;customer_tax_id&quot;, el wizard lo mapea automáticamente al campo &quot;RIF del receptor&quot;. El usuario puede ajustar el mapeo manualmente si es necesario.
                  </p>
                </div>
                <div className="glass-card p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">4</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white">Reglas de automatización</h3>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    El usuario define cuándo debe generarse automáticamente un documento fiscal: al confirmar una orden de venta, al marcar una factura como pagada, al despachar mercancía, etc. También puede configurar reglas de excepción para operaciones que requieran revisión manual antes de emitir el documento.
                  </p>
                </div>
                <div className="glass-card p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">5</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white">Prueba y activación</h3>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    El wizard ejecuta una prueba end-to-end: toma una transacción real del ERP, genera un documento fiscal de prueba en el sandbox de AIDA, y muestra el resultado al usuario para validación. Si todo es correcto, la integración se activa en producción con un solo clic.
                  </p>
                </div>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Todo el proceso del wizard toma entre 30 minutos y 2 horas, dependiendo de la complejidad del ERP y la cantidad de reglas personalizadas que el usuario necesite configurar. No se requieren conocimientos de programación ni de APIs: la interfaz es completamente visual y guiada.
              </p>
            </section>

            {/* Section 4 */}
            <section id="conectores">
              <h2 className="text-2xl font-bold text-white mb-4">
                Conectores específicos
              </h2>
              <p className="text-slate-300 leading-relaxed mb-6">
                AIDA ofrece conectores nativos preconfigurados para los sistemas más utilizados en Venezuela, cada uno optimizado para las particularidades de su plataforma:
              </p>
              <div className="space-y-4 mb-6">
                <div className="glass-card p-6 border-l-4 border-blue-500">
                  <h3 className="text-xl font-semibold text-white mb-3">SAP Business One</h3>
                  <p className="text-slate-300 text-sm leading-relaxed mb-3">
                    SAP Business One es el ERP más utilizado por medianas empresas en Venezuela. El conector de AIDA se integra a través de la Service Layer de SAP B1, utilizando la API REST que SAP provee de forma nativa. La integración cubre el ciclo completo de documentos: órdenes de venta que generan facturas, notas de crédito vinculadas a entregas, y guías de despacho asociadas a transferencias de stock.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20">Facturas de venta</span>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20">Notas de crédito</span>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20">Notas de débito</span>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20">Guías de despacho</span>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20">Sincronización de clientes</span>
                  </div>
                </div>

                <div className="glass-card p-6 border-l-4 border-purple-500">
                  <h3 className="text-xl font-semibold text-white mb-3">Odoo</h3>
                  <p className="text-slate-300 text-sm leading-relaxed mb-3">
                    Odoo es una de las plataformas ERP de código abierto más populares en Venezuela, especialmente entre empresas que buscan flexibilidad y costos accesibles. El conector de AIDA se comunica con Odoo a través de su XML-RPC API o la REST API (según la versión), sincronizando automáticamente los datos de facturación entre ambos sistemas. El conector es compatible con Odoo Community y Enterprise, desde la versión 14 en adelante.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-medium border border-purple-500/20">Módulo de Contabilidad</span>
                    <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-medium border border-purple-500/20">Módulo de Ventas</span>
                    <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-medium border border-purple-500/20">Módulo de Inventario</span>
                    <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-medium border border-purple-500/20">Multi-compañía</span>
                  </div>
                </div>

                <div className="glass-card p-6 border-l-4 border-indigo-500">
                  <h3 className="text-xl font-semibold text-white mb-3">WooCommerce</h3>
                  <p className="text-slate-300 text-sm leading-relaxed mb-3">
                    Para las empresas con tiendas en línea basadas en WordPress/WooCommerce, AIDA ofrece un conector que genera automáticamente el documento fiscal cada vez que se procesa un pedido. El conector utiliza la REST API de WooCommerce y soporta los webhooks nativos para recibir eventos en tiempo real. Cuando un pedido pasa al estado &quot;completado&quot;, AIDA genera la factura fiscal correspondiente y la adjunta al correo de confirmación que recibe el cliente.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-medium border border-indigo-500/20">Pedidos completados</span>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-medium border border-indigo-500/20">Reembolsos automáticos</span>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-medium border border-indigo-500/20">Cálculo automático IGTF</span>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-medium border border-indigo-500/20">Multi-moneda</span>
                  </div>
                </div>

                <div className="glass-card p-6 border-l-4 border-teal-500">
                  <h3 className="text-xl font-semibold text-white mb-3">PrestaShop</h3>
                  <p className="text-slate-300 text-sm leading-relaxed mb-3">
                    El conector de PrestaShop funciona de manera similar al de WooCommerce, integrándose a través de la Web Service API de PrestaShop. Soporta tanto tiendas en hosting compartido como instancias dedicadas. El conector maneja automáticamente las devoluciones generando notas de crédito fiscales, y sincroniza los datos de clientes incluyendo la información fiscal requerida (RIF, razón social, dirección fiscal).
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-400 text-xs font-medium border border-teal-500/20">Facturación por pedido</span>
                    <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-400 text-xs font-medium border border-teal-500/20">Notas de crédito por devolución</span>
                    <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-400 text-xs font-medium border border-teal-500/20">Datos fiscales de clientes</span>
                    <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-400 text-xs font-medium border border-teal-500/20">Multi-tienda</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section id="api-rest">
              <h2 className="text-2xl font-bold text-white mb-4">
                API REST para sistemas personalizados
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                Para empresas que utilizan sistemas desarrollados a medida, ERPs no cubiertos por los conectores nativos, o aplicaciones que necesitan interactuar con AIDA de forma programática, la plataforma ofrece una API REST completa y bien documentada.
              </p>
              <div className="glass-card p-6 mb-6 overflow-x-auto">
                <h3 className="text-sm font-semibold text-aida-cyan mb-4 uppercase tracking-wider">Endpoints principales</h3>
                <div className="space-y-3 text-sm font-mono">
                  <div className="flex items-center gap-3 text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs font-bold">POST</span>
                    <span>/api/v1/documents/invoice</span>
                    <span className="text-slate-500 font-sans">- Emitir factura</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs font-bold">POST</span>
                    <span>/api/v1/documents/credit-note</span>
                    <span className="text-slate-500 font-sans">- Emitir nota de crédito</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs font-bold">POST</span>
                    <span>/api/v1/documents/debit-note</span>
                    <span className="text-slate-500 font-sans">- Emitir nota de débito</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs font-bold">POST</span>
                    <span>/api/v1/documents/dispatch-guide</span>
                    <span className="text-slate-500 font-sans">- Emitir guía de despacho</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs font-bold">GET</span>
                    <span>/api/v1/documents/{"{id}"}</span>
                    <span className="text-slate-500 font-sans">- Consultar documento</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs font-bold">GET</span>
                    <span>/api/v1/documents/{"{id}"}/pdf</span>
                    <span className="text-slate-500 font-sans">- Descargar PDF</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs font-bold">PUT</span>
                    <span>/api/v1/documents/{"{id}"}/void</span>
                    <span className="text-slate-500 font-sans">- Anular documento</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs font-bold">GET</span>
                    <span>/api/v1/control-numbers/status</span>
                    <span className="text-slate-500 font-sans">- Estado de números de control</span>
                  </div>
                </div>
              </div>
              <p className="text-slate-300 leading-relaxed mb-4">
                La API utiliza autenticación mediante API keys con soporte para múltiples entornos (sandbox y producción). Cada API key puede tener permisos granulares, permitiendo crear claves de solo lectura para consultas o claves con permisos de escritura para emisión. Las respuestas se entregan en formato JSON con códigos HTTP estándar y mensajes de error descriptivos.
              </p>
              <p className="text-slate-300 leading-relaxed">
                La documentación de la API incluye ejemplos completos en cURL, Python, JavaScript/Node.js, PHP y C#, además de colecciones de Postman listas para importar. Un entorno de sandbox permite probar todas las operaciones sin consumir números de control reales ni generar documentos fiscales válidos.
              </p>
            </section>

            {/* Section 6 */}
            <section id="sincronizacion">
              <h2 className="text-2xl font-bold text-white mb-4">
                Sincronización de datos
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                La integración entre un ERP y AIDA no es unidireccional: es un flujo bidireccional de datos que mantiene ambos sistemas sincronizados en todo momento. Los datos fluyen en ambas direcciones:
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="glass-card p-5">
                  <h3 className="text-base font-semibold text-aida-cyan mb-3">ERP hacia AIDA</h3>
                  <ul className="space-y-1.5 text-sm text-slate-300">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-aida-cyan rounded-full shrink-0" />
                      Datos del cliente (RIF, razón social, dirección)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-aida-cyan rounded-full shrink-0" />
                      Detalle de productos/servicios
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-aida-cyan rounded-full shrink-0" />
                      Precios, cantidades, descuentos
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-aida-cyan rounded-full shrink-0" />
                      Forma de pago (para cálculo de IGTF)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-aida-cyan rounded-full shrink-0" />
                      Referencia de orden/pedido
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-aida-cyan rounded-full shrink-0" />
                      Datos de retención (si es agente de retención)
                    </li>
                  </ul>
                </div>
                <div className="glass-card p-5">
                  <h3 className="text-base font-semibold text-aida-accent mb-3">AIDA hacia ERP</h3>
                  <ul className="space-y-1.5 text-sm text-slate-300">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-aida-accent rounded-full shrink-0" />
                      Número de control asignado
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-aida-accent rounded-full shrink-0" />
                      Número de documento fiscal
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-aida-accent rounded-full shrink-0" />
                      PDF del documento generado
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-aida-accent rounded-full shrink-0" />
                      Estado del documento (emitido/anulado)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-aida-accent rounded-full shrink-0" />
                      Fecha y hora de emisión
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-aida-accent rounded-full shrink-0" />
                      Confirmación de envío al receptor
                    </li>
                  </ul>
                </div>
              </div>
              <p className="text-slate-300 leading-relaxed">
                La sincronización puede configurarse como evento en tiempo real (cada transacción se procesa al instante mediante webhooks), por lotes programados (todas las transacciones del día se procesan a una hora específica), o híbrida (tiempo real para facturas, por lotes para reportes). La opción recomendada es tiempo real, ya que garantiza que el documento fiscal se genera inmediatamente después de la transacción comercial, cumpliendo con la normativa que exige la emisión del documento al momento de la operación.
              </p>
            </section>

            {/* Section 7 */}
            <section id="implementacion">
              <h2 className="text-2xl font-bold text-white mb-4">
                Timeline de implementación
              </h2>
              <p className="text-slate-300 leading-relaxed mb-6">
                El tiempo necesario para implementar la integración depende del tipo de conector y la complejidad de las reglas de negocio. A continuación, los timelines típicos:
              </p>
              <div className="space-y-4 mb-6">
                {[
                  {
                    name: "WooCommerce / PrestaShop",
                    time: "1-2 horas",
                    detail: "Los conectores de e-commerce son los más rápidos de configurar porque la estructura de datos es simple y estandarizada. Pedido = factura, devolución = nota de crédito. El wizard completa el mapeo automáticamente en la mayoría de los casos.",
                  },
                  {
                    name: "Odoo",
                    time: "2-4 horas",
                    detail: "Odoo tiene una estructura modular que permite diferentes configuraciones según la empresa. El wizard se adapta a la versión y módulos instalados, pero puede requerir ajustes manuales en el mapeo de campos personalizados (custom fields).",
                  },
                  {
                    name: "SAP Business One",
                    time: "4-8 horas",
                    detail: "SAP B1 tiene la estructura más compleja, con múltiples tipos de documentos, flujos de aprobación y campos personalizados (UDFs). El wizard maneja la complejidad, pero la fase de pruebas suele ser más extensa para cubrir todos los escenarios de emisión.",
                  },
                  {
                    name: "API REST (sistema propio)",
                    time: "1-5 días",
                    detail: "El timeline depende del equipo de desarrollo del cliente. La API de AIDA está documentada y el sandbox permite pruebas inmediatas, pero la implementación del lado del cliente varía según la arquitectura de su sistema y la disponibilidad de sus desarrolladores.",
                  },
                ].map((item) => (
                  <div key={item.name} className="glass-card p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                      <span className="text-sm font-semibold text-aida-cyan">{item.time}</span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{item.detail}</p>
                  </div>
                ))}
              </div>
              <div className="glass-card p-5 border-l-4 border-aida-cyan">
                <p className="text-sm text-aida-cyan font-semibold mb-2">Soporte durante la implementación</p>
                <p className="text-slate-300 text-sm leading-relaxed">
                  AIDA ofrece soporte técnico dedicado durante todo el proceso de implementación. Un especialista de integraciones acompaña al cliente desde la configuración del wizard hasta las pruebas finales en producción, asegurando que la integración funcione correctamente antes de activarla. Este soporte está incluido en todos los planes que incluyen acceso a la API.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section id="casos-exito">
              <h2 className="text-2xl font-bold text-white mb-4">
                Escenarios de integración comunes
              </h2>
              <p className="text-slate-300 leading-relaxed mb-6">
                A continuación presentamos los escenarios de integración más frecuentes que configuran las empresas venezolanas al conectar su ERP con AIDA:
              </p>
              <div className="space-y-4">
                <div className="glass-card p-5">
                  <h3 className="text-lg font-semibold text-white mb-2">Distribuidora con SAP Business One</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Una distribuidora de productos de consumo masivo que emite entre 200 y 500 facturas diarias. La integración conecta las entregas confirmadas en SAP B1 con la generación automática de facturas en AIDA. Las guías de despacho se generan al momento del picking, y las notas de crédito se emiten automáticamente cuando se procesan devoluciones en el módulo de compras. El equipo de contabilidad tiene acceso a un dashboard en AIDA que muestra en tiempo real el estado de la facturación del día.
                  </p>
                </div>
                <div className="glass-card p-5">
                  <h3 className="text-lg font-semibold text-white mb-2">Tienda en línea con WooCommerce</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Un e-commerce que vende electrónica y recibe pagos en bolívares y dólares. Cada pedido completado genera automáticamente una factura con el IGTF calculado según la forma de pago. Los reembolsos generan notas de crédito. El cliente final recibe la factura fiscal adjunta al correo de confirmación de pedido. Los campos fiscales (RIF, razón social) se capturan durante el checkout mediante campos personalizados integrados en la pasarela de pago.
                  </p>
                </div>
                <div className="glass-card p-5">
                  <h3 className="text-lg font-semibold text-white mb-2">Empresa de servicios con Odoo</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Una empresa de consultoría que emite facturas mensuales a sus clientes corporativos. La integración conecta el módulo de facturación de Odoo con AIDA, generando los documentos fiscales al confirmar la factura en Odoo. Los comprobantes de retención recibidos de clientes contribuyentes especiales se registran automáticamente en Odoo para su contabilización. La conciliación bancaria en Odoo se enriquece con los datos fiscales de AIDA.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* CTA */}
          <div className="mt-16 glass-card p-8 text-center glow-blue">
            <h3 className="text-2xl font-bold text-white mb-3">
              Conecta tu ERP con AIDA hoy
            </h3>
            <p className="text-slate-400 mb-6 max-w-xl mx-auto">
              El wizard de AIDA te guía paso a paso para conectar tu sistema en horas, no semanas.
              SAP, Odoo, WooCommerce, PrestaShop o tu sistema propio.
            </p>
            <a
              href="/#contacto"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-aida-accent to-aida-cyan text-white font-semibold hover:shadow-lg hover:shadow-aida-accent/25 transition-all"
            >
              Solicitar Demo de Integración
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>

          {/* Related articles */}
          <div className="mt-16">
            <h3 className="text-xl font-bold text-white mb-6">Artículos relacionados</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {relatedArticles.map((article) => (
                <Link
                  key={article.slug}
                  href={article.slug}
                  className="glass-card p-5 hover:bg-white/[0.08] hover:border-aida-accent/20 transition-all duration-300 group"
                >
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r ${article.categoryColor} bg-clip-text text-transparent border border-white/10 mb-3`}>
                    {article.category}
                  </span>
                  <h4 className="text-sm font-semibold text-white group-hover:text-aida-cyan transition-colors leading-snug">
                    {article.title}
                  </h4>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </article>
    </>
  );
}

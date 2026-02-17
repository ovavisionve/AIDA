import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "¿Por qué es urgente migrar a facturación digital en Venezuela?",
  description:
    "Descubre por qué las empresas venezolanas deben migrar a facturación digital de forma urgente. Las Providencias 102 y 121 del SENIAT son obligatorias y los plazos ya están en marcha.",
  keywords: [
    "migración facturación digital Venezuela",
    "urgencia facturación electrónica",
    "Providencia 102 obligatoria",
    "Providencia 121 obligatoria",
    "SENIAT facturación digital plazos",
    "migrar a factura electrónica",
    "cumplimiento fiscal Venezuela",
    "AIDA facturación digital",
  ],
  openGraph: {
    title: "¿Por qué es urgente migrar a facturación digital en Venezuela?",
    description:
      "Las Providencias 102 y 121 del SENIAT son obligatorias. Conoce por qué tu empresa debe migrar a facturación digital ahora y cómo AIDA simplifica el proceso.",
    type: "article",
    locale: "es_VE",
    url: "https://aida.com.ve/blog/urgencia-migracion-facturacion-digital",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  alternates: {
    canonical: "https://aida.com.ve/blog/urgencia-migracion-facturacion-digital",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "¿Por qué es urgente migrar a facturación digital en Venezuela?",
  description:
    "Las Providencias 102 y 121 del SENIAT son obligatorias. Descubre por qué tu empresa debe migrar a facturación digital de forma urgente.",
  author: { "@type": "Organization", name: "AIDA Imprenta Digital" },
  publisher: {
    "@type": "Organization",
    name: "AIDA Imprenta Digital C.A.",
    logo: { "@type": "ImageObject", url: "https://aida.com.ve/favicon.ico" },
  },
  datePublished: "2025-08-01",
  dateModified: "2025-08-01",
  mainEntityOfPage: "https://aida.com.ve/blog/urgencia-migracion-facturacion-digital",
  image: "https://aida.com.ve/og-image.png",
};

const relatedArticles = [
  {
    title: "Providencia 102: Facturación digital obligatoria",
    slug: "/blog/providencia-102-facturacion-digital",
    category: "Legal",
    categoryColor: "from-violet-500 to-purple-400",
  },
  {
    title: "Providencia 121: Homologación de sistemas fiscales",
    slug: "/blog/providencia-121-homologacion-sistemas",
    category: "Legal",
    categoryColor: "from-aida-cyan to-teal-400",
  },
  {
    title: "Sanciones del SENIAT por incumplimiento fiscal",
    slug: "/blog/sanciones-seniat-incumplimiento",
    category: "Legal",
    categoryColor: "from-rose-500 to-pink-400",
  },
];

const tableOfContents = [
  { id: "cambio-inevitable", label: "Un cambio inevitable" },
  { id: "providencias-obligatorias", label: "Las Providencias 102 y 121 son obligatorias" },
  { id: "riesgos-no-migrar", label: "Los riesgos de no migrar a tiempo" },
  { id: "ventajas-migracion", label: "Ventajas de migrar a facturación digital" },
  { id: "mitos-migracion", label: "Mitos sobre la migración" },
  { id: "tiempo-agota", label: "El tiempo se agota: por qué actuar ahora" },
  { id: "aida-migracion", label: "Cómo AIDA simplifica tu migración" },
  { id: "conclusion", label: "Conclusión" },
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
        <div className="orb orb-blue w-96 h-96 -top-20 -right-40" />
        <div className="orb orb-cyan w-72 h-72 top-1/3 -left-36" />
        <div className="orb orb-purple w-64 h-64 bottom-1/4 right-0" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
            <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <span>/</span>
            <span className="text-slate-300">Urgencia de migrar a facturación digital</span>
          </nav>

          {/* Article header */}
          <header className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-rose-500 to-pink-400 bg-clip-text text-transparent border border-white/10">
                Urgente
              </span>
              <span className="text-sm text-slate-500">01 Ago 2025</span>
              <span className="text-sm text-slate-500">9 min de lectura</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
              ¿Por qué es{" "}
              <span className="gradient-text">urgente migrar a facturación digital</span>?
            </h1>
            <p className="mt-6 text-lg text-slate-400 leading-relaxed">
              Las Providencias 102 y 121 del SENIAT no son opcionales: son normativas de obligatorio
              cumplimiento que transforman la facturación en Venezuela. Las empresas que no migren a
              facturación digital dentro de los plazos establecidos se enfrentan a sanciones severas.
              Aquí te explicamos por qué la urgencia es real y qué debes hacer ahora.
            </p>
          </header>

          {/* Table of Contents */}
          <div className="glass-card p-6 mb-12">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-aida-cyan mb-4">
              Tabla de contenido
            </h2>
            <nav className="space-y-2">
              {tableOfContents.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="w-3 h-3 text-aida-accent" fill="currentColor" viewBox="0 0 8 8">
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
            <section id="cambio-inevitable">
              <h2 className="text-2xl font-bold text-white mb-4">
                Un cambio inevitable
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                La facturación digital no es una tendencia pasajera ni una opción tecnológica: es una transformación obligatoria del sistema tributario venezolano. El SENIAT ha definido un marco regulatorio claro y contundente que exige a todas las empresas migrar sus procesos de facturación al formato digital. Este cambio responde a la necesidad de modernizar el control fiscal, reducir la evasión tributaria y alinear a Venezuela con los estándares internacionales de facturación electrónica.
              </p>
              <p className="text-slate-300 leading-relaxed mb-4">
                Países como México, Chile, Brasil, Colombia y Argentina ya recorrieron este camino hace años. En esos países, la facturación electrónica se convirtió en norma obligatoria y las empresas que no se adaptaron enfrentaron consecuencias graves. Venezuela está siguiendo ese mismo camino, y la velocidad de implementación no deja mucho margen para la procrastinación.
              </p>
              <p className="text-slate-300 leading-relaxed">
                La pregunta ya no es si tu empresa debe migrar a facturación digital, sino cuándo lo hará. Y la respuesta debería ser: lo antes posible.
              </p>
            </section>

            {/* Section 2 */}
            <section id="providencias-obligatorias">
              <h2 className="text-2xl font-bold text-white mb-4">
                Las Providencias 102 y 121 son obligatorias
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                El marco regulatorio que impulsa la migración a facturación digital se sustenta en dos instrumentos legales fundamentales emitidos por el SENIAT:
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="glass-card p-5 border-t-2 border-aida-accent">
                  <h3 className="text-lg font-semibold text-white mb-2">Providencia 102 - Facturación Digital</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    La Providencia Administrativa SNAT/2024/000102 establece las normas para la emisión de documentos fiscales en formato digital. Define los requisitos formales de cada documento, los tipos de documentos que deben emitirse digitalmente, los plazos de adopción y las obligaciones de los contribuyentes. Es la normativa que regula <strong className="text-white">qué</strong> se debe facturar digitalmente.
                  </p>
                </div>
                <div className="glass-card p-5 border-t-2 border-violet-500">
                  <h3 className="text-lg font-semibold text-white mb-2">Providencia 121 - Homologación de Sistemas</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    La Providencia Administrativa SNAT/2024/000121 establece los requisitos técnicos que deben cumplir los sistemas utilizados para generar documentos fiscales digitales. Solo los sistemas homologados por el SENIAT pueden emitir documentos con validez legal. Es la normativa que regula <strong className="text-white">cómo</strong> se debe facturar digitalmente.
                  </p>
                </div>
              </div>
              <div className="glass-card p-5 border-l-4 border-red-500 my-6">
                <p className="text-sm text-red-400 font-semibold mb-2">Esto no es opcional</p>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Ambas providencias son de obligatorio cumplimiento. No se trata de una recomendación ni de una invitación a modernizarse: es un mandato legal con plazos definidos y sanciones claras para quienes no cumplan. Cada día que pasa sin migrar es un día más de exposición a riesgos fiscales y legales.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section id="riesgos-no-migrar">
              <h2 className="text-2xl font-bold text-white mb-4">
                Los riesgos de no migrar a tiempo
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                Las empresas que no migren a facturación digital dentro de los plazos establecidos por el SENIAT se exponen a una serie de consecuencias que pueden afectar gravemente su operación:
              </p>
              <div className="space-y-4 mb-6">
                <div className="glass-card p-5">
                  <h3 className="text-lg font-semibold text-white mb-2">Sanciones económicas acumulativas</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Las multas por emitir documentos fiscales sin cumplir los requisitos legales se calculan por cada documento individual. Para una empresa que emite cientos o miles de facturas mensuales, el monto acumulado de sanciones puede alcanzar cifras devastadoras que comprometen seriamente la viabilidad financiera del negocio.
                  </p>
                </div>
                <div className="glass-card p-5">
                  <h3 className="text-lg font-semibold text-white mb-2">Clausura temporal del establecimiento</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    El SENIAT tiene la facultad de ordenar el cierre temporal de establecimientos que incumplan de forma reiterada las normativas de facturación. Una clausura, incluso por pocos días, puede generar pérdidas operativas significativas, daño reputacional y pérdida de clientes.
                  </p>
                </div>
                <div className="glass-card p-5">
                  <h3 className="text-lg font-semibold text-white mb-2">Documentos sin validez legal</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Los documentos fiscales emitidos fuera del marco de las Providencias 102 y 121 no tienen validez legal. Esto significa que tus clientes no pueden utilizar esas facturas para deducir créditos fiscales de IVA, lo que deteriora tu relación comercial y puede hacer que tus clientes busquen proveedores que sí cumplan.
                  </p>
                </div>
                <div className="glass-card p-5">
                  <h3 className="text-lg font-semibold text-white mb-2">Pérdida de competitividad</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Las empresas que migren primero tendrán una ventaja competitiva: podrán ofrecer documentos fiscales digitales válidos a sus clientes, operar con mayor eficiencia y demostrar cumplimiento ante socios comerciales y entes reguladores. Las empresas rezagadas quedarán en desventaja.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="ventajas-migracion">
              <h2 className="text-2xl font-bold text-white mb-4">
                Ventajas de migrar a facturación digital
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                Más allá de la obligación legal, la migración a facturación digital trae beneficios tangibles para tu empresa:
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <p className="text-slate-300 text-sm leading-relaxed"><strong className="text-white">Eliminación del papel:</strong> adiós a los talonarios físicos, el almacenamiento de documentos en papel, los riesgos de deterioro y pérdida, y los costos asociados de impresión y logística.</p>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <p className="text-slate-300 text-sm leading-relaxed"><strong className="text-white">Mayor eficiencia operativa:</strong> la facturación digital es más rápida, reduce errores manuales, elimina procesos redundantes y permite que tu equipo se enfoque en actividades de mayor valor para el negocio.</p>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <p className="text-slate-300 text-sm leading-relaxed"><strong className="text-white">Acceso inmediato a la información:</strong> consulta cualquier documento fiscal emitido en segundos, sin buscar en archivos físicos. Facilita auditorías internas, conciliaciones y reportes de gestión.</p>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <p className="text-slate-300 text-sm leading-relaxed"><strong className="text-white">Mejor relación con clientes:</strong> tus clientes recibirán documentos fiscales digitales válidos de forma instantánea, mejorando su experiencia y fortaleciendo la relación comercial.</p>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <p className="text-slate-300 text-sm leading-relaxed"><strong className="text-white">Reducción de costos:</strong> la eliminación de procesos manuales, la reducción de errores y la automatización de reportes fiscales generan ahorros significativos en recursos humanos y operativos.</p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section id="mitos-migracion">
              <h2 className="text-2xl font-bold text-white mb-4">
                Mitos sobre la migración
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                Existen varios mitos que retrasan innecesariamente la decisión de migrar. Desmentimos los más comunes:
              </p>
              <div className="space-y-4 mb-6">
                <div className="glass-card p-5 border-l-4 border-amber-500">
                  <h3 className="text-lg font-semibold text-white mb-2">&quot;Es muy complicado de implementar&quot;</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Falso. Con una imprenta digital autorizada como AIDA, la integración con tu ERP se realiza en minutos. No necesitas desarrollar sistemas propios ni contratar equipos técnicos especializados. La imprenta digital se encarga de toda la complejidad técnica y fiscal.
                  </p>
                </div>
                <div className="glass-card p-5 border-l-4 border-amber-500">
                  <h3 className="text-lg font-semibold text-white mb-2">&quot;Mi empresa es muy pequeña para que me afecte&quot;</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Falso. Las Providencias 102 y 121 aplican a todos los contribuyentes que emiten documentos fiscales, sin importar el tamaño de la empresa. La diferencia está en los plazos de adopción, no en la obligación. Eventualmente, todas las empresas deben cumplir.
                  </p>
                </div>
                <div className="glass-card p-5 border-l-4 border-amber-500">
                  <h3 className="text-lg font-semibold text-white mb-2">&quot;Todavía hay tiempo suficiente&quot;</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Peligroso. La migración requiere tiempo para seleccionar una imprenta digital, integrar sistemas, capacitar al personal y realizar pruebas. Las empresas que esperan al último momento se enfrentan a procesos acelerados, mayor probabilidad de errores y el riesgo de no llegar a tiempo al cumplimiento del plazo.
                  </p>
                </div>
                <div className="glass-card p-5 border-l-4 border-amber-500">
                  <h3 className="text-lg font-semibold text-white mb-2">&quot;Tendré que cambiar mi ERP&quot;</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Falso. No necesitas cambiar tu sistema de gestión. Una imprenta digital autorizada como AIDA se integra con tu ERP existente, agregando la capa de facturación digital sin modificar tus procesos. Con compatibilidad con más de 100 ERPs, la integración es transparente.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section id="tiempo-agota">
              <h2 className="text-2xl font-bold text-white mb-4">
                El tiempo se agota: por qué actuar ahora
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                Cada día que pasa sin iniciar el proceso de migración es un día perdido. Estas son las razones concretas por las que debes actuar ahora:
              </p>
              <div className="glass-card p-5 border-l-4 border-red-500 my-6">
                <p className="text-sm text-red-400 font-semibold mb-2">Factores de urgencia</p>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li><strong className="text-white">Los plazos ya están en marcha:</strong> el cronograma de adopción definido por el SENIAT no se detiene. Cada grupo de contribuyentes tiene una fecha límite que se acerca inexorablemente.</li>
                  <li><strong className="text-white">La demanda de integración crecerá:</strong> a medida que más empresas busquen cumplir, la demanda de servicios de imprentas digitales aumentará. Las empresas que se adelanten tendrán acceso prioritario y podrán realizar una migración más organizada.</li>
                  <li><strong className="text-white">Las fiscalizaciones se intensifican:</strong> el SENIAT está fortaleciendo sus sistemas de control electrónico, lo que facilita la detección automática de contribuyentes que no cumplen. La probabilidad de ser fiscalizado aumenta con cada ciclo.</li>
                  <li><strong className="text-white">Tus clientes lo esperan:</strong> las empresas que ya migraron esperan recibir documentos fiscales digitales válidos de sus proveedores. Si tú no los emites, corres el riesgo de que busquen alternativas que sí cumplan.</li>
                  <li><strong className="text-white">La curva de aprendizaje requiere tiempo:</strong> aunque la tecnología lo simplifica, tu equipo necesita familiarizarse con los nuevos procesos. Empezar ahora permite una transición gradual y sin presión.</li>
                </ul>
              </div>
            </section>

            {/* Section 7 */}
            <section id="aida-migracion">
              <h2 className="text-2xl font-bold text-white mb-4">
                Cómo AIDA simplifica tu migración
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                AIDA fue diseñada específicamente para hacer que la migración a facturación digital sea lo más sencilla y rápida posible. Como imprenta digital autorizada por el SENIAT con un sistema homologado, AIDA elimina las barreras que tradicionalmente dificultan este proceso.
              </p>
              <div className="space-y-4 mb-6">
                <div className="glass-card p-5 border-l-4 border-aida-accent">
                  <h3 className="text-lg font-semibold text-white mb-2">Integración rápida con tu ERP</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    AIDA cuenta con conectores prediseñados para más de 100 ERPs. La integración se realiza en minutos, no en semanas o meses. Tu equipo puede seguir trabajando con el sistema que ya conoce, mientras AIDA se encarga de toda la capa de facturación digital y cumplimiento fiscal.
                  </p>
                </div>
                <div className="glass-card p-5 border-l-4 border-aida-accent">
                  <h3 className="text-lg font-semibold text-white mb-2">Cumplimiento automático de ambas Providencias</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Al integrar AIDA, tu empresa cumple automáticamente con la Providencia 102 (facturación digital) y la Providencia 121 (homologación de sistemas). No necesitas preocuparte por los requisitos técnicos de homologación ni por los formatos de los documentos: AIDA se encarga de todo.
                  </p>
                </div>
                <div className="glass-card p-5 border-l-4 border-aida-accent">
                  <h3 className="text-lg font-semibold text-white mb-2">Validación inteligente con IA</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    La inteligencia artificial de AIDA valida cada documento antes de emitirlo, asegurando que cumple con todos los requisitos legales. Esto elimina el riesgo de emitir documentos con errores que podrían generar problemas en una fiscalización.
                  </p>
                </div>
                <div className="glass-card p-5 border-l-4 border-aida-accent">
                  <h3 className="text-lg font-semibold text-white mb-2">Acompañamiento en todo el proceso</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    AIDA no solo te ofrece tecnología: te acompaña durante todo el proceso de migración. Desde la configuración inicial hasta la emisión del primer documento fiscal digital, cuentas con soporte especializado para asegurar una transición exitosa.
                  </p>
                </div>
              </div>
            </section>

            {/* Conclusion */}
            <section id="conclusion">
              <h2 className="text-2xl font-bold text-white mb-4">Conclusión</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                La migración a facturación digital no es una cuestión de &quot;si&quot; sino de &quot;cuándo&quot;. Las Providencias 102 y 121 del SENIAT son de obligatorio cumplimiento, los plazos ya están definidos y las consecuencias de no cumplir son severas: multas acumulativas, clausuras temporales, documentos sin validez legal y pérdida de competitividad.
              </p>
              <p className="text-slate-300 leading-relaxed">
                La buena noticia es que migrar no tiene que ser difícil ni costoso. Con AIDA como tu imprenta digital autorizada, la transición se realiza de forma rápida, segura y sin disrupciones en tu operación. Tu ERP se integra en minutos, la IA valida cada documento automáticamente y el cumplimiento de ambas providencias queda resuelto desde el primer día. No esperes más: el momento de actuar es ahora.
              </p>
            </section>
          </div>

          {/* CTA */}
          <div className="mt-16 glass-card p-8 text-center glow-blue">
            <h3 className="text-2xl font-bold text-white mb-3">
              No esperes más: migra a facturación digital hoy
            </h3>
            <p className="text-slate-400 mb-6 max-w-xl mx-auto">
              AIDA te permite cumplir con las Providencias 102 y 121 de forma inmediata.
              Integra tu ERP en minutos y empieza a facturar digitalmente sin complicaciones.
            </p>
            <a
              href="/#contacto"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-aida-accent to-aida-cyan text-white font-semibold hover:shadow-lg hover:shadow-aida-accent/25 transition-all"
            >
              Solicitar Demo Gratuita
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

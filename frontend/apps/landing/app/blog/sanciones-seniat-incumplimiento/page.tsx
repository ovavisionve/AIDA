import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sanciones del SENIAT por incumplimiento fiscal: lo que debes saber",
  description:
    "Conoce las sanciones que aplica el SENIAT por incumplimiento de las normativas de facturación digital, incluyendo multas, clausuras y desconocimiento de créditos fiscales. Protege tu empresa.",
  keywords: [
    "sanciones SENIAT",
    "incumplimiento fiscal Venezuela",
    "multas SENIAT facturación",
    "clausura establecimiento SENIAT",
    "sanciones Providencia 102",
    "sanciones Providencia 121",
    "Código Orgánico Tributario sanciones",
    "AIDA cumplimiento fiscal",
  ],
  openGraph: {
    title: "Sanciones del SENIAT por incumplimiento fiscal: lo que debes saber",
    description:
      "Todo sobre las sanciones del SENIAT por incumplimiento de facturación digital: multas, clausuras, desconocimiento de créditos fiscales y cómo proteger tu empresa.",
    type: "article",
    locale: "es_VE",
    url: "https://aida.com.ve/blog/sanciones-seniat-incumplimiento",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  alternates: {
    canonical: "https://aida.com.ve/blog/sanciones-seniat-incumplimiento",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Sanciones del SENIAT por incumplimiento fiscal: lo que debes saber",
  description:
    "Conoce las sanciones del SENIAT por incumplimiento de normativas de facturación digital: multas, clausuras y cómo evitarlas.",
  author: { "@type": "Organization", name: "AIDA Imprenta Digital" },
  publisher: {
    "@type": "Organization",
    name: "AIDA Imprenta Digital C.A.",
    logo: { "@type": "ImageObject", url: "https://aida.com.ve/favicon.ico" },
  },
  datePublished: "2025-08-20",
  dateModified: "2025-08-20",
  mainEntityOfPage: "https://aida.com.ve/blog/sanciones-seniat-incumplimiento",
  image: "https://aida.com.ve/og-image.png",
};

const relatedArticles = [
  {
    title: "¿Por qué es urgente migrar a facturación digital?",
    slug: "/blog/urgencia-migracion-facturacion-digital",
    category: "Urgente",
    categoryColor: "from-rose-500 to-pink-400",
  },
  {
    title: "Providencia 102: Facturación digital obligatoria",
    slug: "/blog/providencia-102-facturacion-digital",
    category: "Legal",
    categoryColor: "from-violet-500 to-purple-400",
  },
  {
    title: "Homologación fiscal: qué es y cómo cumplir",
    slug: "/blog/homologacion-fiscal-como-cumplir",
    category: "Guía",
    categoryColor: "from-aida-cyan to-teal-400",
  },
];

const tableOfContents = [
  { id: "marco-sancionatorio", label: "El marco sancionatorio del SENIAT" },
  { id: "tipos-sanciones", label: "Tipos de sanciones por incumplimiento fiscal" },
  { id: "sanciones-facturacion", label: "Sanciones específicas por facturación" },
  { id: "calculo-multas", label: "Cómo se calculan las multas" },
  { id: "fiscalizaciones-electronicas", label: "Fiscalizaciones electrónicas del SENIAT" },
  { id: "casos-reales", label: "Escenarios reales de exposición" },
  { id: "como-protegerte", label: "Cómo proteger a tu empresa" },
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
            <span className="text-slate-300">Sanciones del SENIAT por incumplimiento</span>
          </nav>

          {/* Article header */}
          <header className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-rose-500 to-pink-400 bg-clip-text text-transparent border border-white/10">
                Legal
              </span>
              <span className="text-sm text-slate-500">20 Ago 2025</span>
              <span className="text-sm text-slate-500">11 min de lectura</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
              Sanciones del SENIAT por{" "}
              <span className="gradient-text">incumplimiento fiscal</span>
            </h1>
            <p className="mt-6 text-lg text-slate-400 leading-relaxed">
              El SENIAT cuenta con un régimen sancionatorio claro y severo para las empresas que incumplan
              las normativas de facturación digital, incluyendo las Providencias 102 y 121. Desde multas
              económicas hasta clausura temporal del establecimiento, las consecuencias pueden ser
              devastadoras para tu negocio. Aquí te explicamos cada tipo de sanción y cómo protegerte.
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
            <section id="marco-sancionatorio">
              <h2 className="text-2xl font-bold text-white mb-4">
                El marco sancionatorio del SENIAT
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                El régimen de sanciones tributarias en Venezuela se fundamenta principalmente en el <strong className="text-white">Código Orgánico Tributario (COT)</strong>, que establece las infracciones y sanciones aplicables a los contribuyentes que incumplan sus obligaciones fiscales. Adicionalmente, las providencias administrativas del SENIAT, como las Providencias 102 y 121, especifican obligaciones cuyo incumplimiento activa las sanciones previstas en el COT.
              </p>
              <p className="text-slate-300 leading-relaxed mb-4">
                Es importante entender que las sanciones tributarias en Venezuela son de naturaleza objetiva: se aplican por el simple hecho de que la infracción existe, independientemente de si el contribuyente tuvo o no la intención de incumplir. Esto significa que &quot;no saber&quot; que existía una obligación no es una excusa válida para evitar la sanción.
              </p>
              <p className="text-slate-300 leading-relaxed">
                El SENIAT tiene la facultad de aplicar sanciones de forma administrativa, sin necesidad de acudir a tribunales en primera instancia. Esto acelera significativamente el proceso sancionatorio y hace que las consecuencias del incumplimiento se materialicen de forma rápida y directa.
              </p>
            </section>

            {/* Section 2 */}
            <section id="tipos-sanciones">
              <h2 className="text-2xl font-bold text-white mb-4">
                Tipos de sanciones por incumplimiento fiscal
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                El COT establece varias categorías de sanciones que pueden aplicarse a los contribuyentes que incumplan las normativas de facturación digital:
              </p>
              <div className="space-y-4 mb-6">
                <div className="glass-card p-5 border-l-4 border-red-500">
                  <h3 className="text-lg font-semibold text-white mb-2">Multas pecuniarias</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Son sanciones económicas calculadas en unidades tributarias (UT) o como porcentaje de la operación involucrada. Las multas pueden ir desde montos relativamente bajos por infracciones menores hasta cifras devastadoras cuando se acumulan por múltiples infracciones. Una empresa que emita miles de facturas sin cumplir los requisitos puede enfrentar multas de miles de unidades tributarias.
                  </p>
                </div>
                <div className="glass-card p-5 border-l-4 border-red-500">
                  <h3 className="text-lg font-semibold text-white mb-2">Clausura temporal del establecimiento</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    El SENIAT puede ordenar el cierre temporal del establecimiento comercial por períodos que van de 1 a 10 días continuos. Durante la clausura, la empresa no puede operar, lo que genera pérdidas directas de ingresos, afectación a empleados, incumplimiento de compromisos con clientes y daño reputacional significativo.
                  </p>
                </div>
                <div className="glass-card p-5 border-l-4 border-red-500">
                  <h3 className="text-lg font-semibold text-white mb-2">Desconocimiento de créditos fiscales</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Los documentos fiscales emitidos sin cumplir los requisitos legales no generan crédito fiscal de IVA para el receptor. Esto afecta directamente a tus clientes, que no podrán deducir el IVA de las facturas que les emitiste. Esta consecuencia puede ser aún más dañina que la multa directa, ya que deteriora tu relación comercial y puede hacer que pierdas clientes.
                  </p>
                </div>
                <div className="glass-card p-5 border-l-4 border-red-500">
                  <h3 className="text-lg font-semibold text-white mb-2">Inhabilitación para contratar con el Estado</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Los contribuyentes con incumplimientos fiscales graves pueden ser inhabilitados para participar en licitaciones y contratos con el sector público. Para empresas que tienen al Estado como cliente, esta sanción puede representar la pérdida de una parte significativa de sus ingresos.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section id="sanciones-facturacion">
              <h2 className="text-2xl font-bold text-white mb-4">
                Sanciones específicas por facturación
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                Las infracciones relacionadas con la emisión de documentos fiscales tienen sanciones específicas previstas en el COT. Las más relevantes en el contexto de la facturación digital son:
              </p>
              <div className="glass-card p-5 border-l-4 border-amber-500 my-6">
                <p className="text-sm text-amber-400 font-semibold mb-2">Infracciones y sanciones principales</p>
                <ul className="space-y-3 text-sm text-slate-300">
                  <li>
                    <strong className="text-white">Emitir documentos sin los requisitos legales:</strong> multa de 1 a 150 unidades tributarias por cada documento. Para una empresa que emite 500 facturas mensuales sin cumplir, esto puede representar hasta 75.000 UT de multa en un solo mes.
                  </li>
                  <li>
                    <strong className="text-white">No emitir documentos fiscales:</strong> multa de 1 a 200 unidades tributarias por cada operación no documentada, más clausura temporal del establecimiento de 1 a 10 días.
                  </li>
                  <li>
                    <strong className="text-white">Utilizar sistemas no homologados:</strong> los documentos emitidos a través de sistemas que no cumplan con la Providencia 121 se consideran como documentos sin los requisitos legales, activando las sanciones correspondientes por cada documento emitido.
                  </li>
                  <li>
                    <strong className="text-white">Emitir documentos con números de control inválidos:</strong> los documentos con números de control no asignados por una imprenta autorizada o que no correspondan a rangos vigentes se consideran como documentos sin validez fiscal, con las sanciones consecuentes.
                  </li>
                  <li>
                    <strong className="text-white">No conservar documentos fiscales:</strong> multa aplicable por no mantener los registros y documentos durante el período mínimo de conservación exigido por la normativa (10 años).
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section id="calculo-multas">
              <h2 className="text-2xl font-bold text-white mb-4">
                Cómo se calculan las multas
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                El cálculo de las multas tributarias en Venezuela tiene una particularidad que las hace especialmente impactantes: se expresan en <strong className="text-white">unidades tributarias (UT)</strong>, cuyo valor se actualiza periódicamente. Esto significa que una multa impuesta hoy puede tener un valor significativamente mayor al momento de su pago si el valor de la UT ha aumentado.
              </p>
              <div className="glass-card p-5 border-l-4 border-aida-cyan my-6">
                <p className="text-sm text-aida-cyan font-semibold mb-2">Ejemplo ilustrativo</p>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Supongamos que una empresa emite 1.000 facturas mensuales a través de un sistema no homologado. Si el SENIAT aplica una multa de 10 UT por cada factura que no cumple los requisitos legales, el total sería de 10.000 UT en un solo mes. Si la fiscalización cubre varios meses de operación, la multa se multiplica proporcionalmente. En escenarios de fiscalización que abarquen un año completo, la exposición puede alcanzar las 120.000 UT o más.
                </p>
              </div>
              <p className="text-slate-300 leading-relaxed mb-4">
                Además, las multas son acumulativas: cada infracción se sanciona de forma individual. Esto significa que emitir 1.000 facturas sin cumplir los requisitos equivale a 1.000 infracciones individuales, cada una con su propia sanción. El efecto multiplicador puede ser catastrófico para la economía de cualquier empresa.
              </p>
              <p className="text-slate-300 leading-relaxed">
                A esto se suma que las multas generan intereses moratorios si no se pagan dentro del plazo establecido, lo que incrementa aún más el monto total. Y en caso de reincidencia, las sanciones pueden agravarse significativamente.
              </p>
            </section>

            {/* Section 5 */}
            <section id="fiscalizaciones-electronicas">
              <h2 className="text-2xl font-bold text-white mb-4">
                Fiscalizaciones electrónicas del SENIAT
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                Un factor que aumenta significativamente el riesgo de ser sancionado es la creciente capacidad del SENIAT para realizar <strong className="text-white">fiscalizaciones electrónicas</strong>. A diferencia de las fiscalizaciones presenciales tradicionales, las fiscalizaciones electrónicas permiten al SENIAT:
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                  <p className="text-slate-300 text-sm leading-relaxed"><strong className="text-white">Cruzar información automáticamente:</strong> comparar los datos reportados por contribuyentes, imprentas digitales y terceros para detectar inconsistencias sin intervención humana.</p>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                  <p className="text-slate-300 text-sm leading-relaxed"><strong className="text-white">Verificar números de control en tiempo real:</strong> detectar instantáneamente si los números de control utilizados corresponden a rangos válidos asignados a imprentas autorizadas.</p>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                  <p className="text-slate-300 text-sm leading-relaxed"><strong className="text-white">Fiscalizar a gran escala:</strong> revisar simultáneamente a miles de contribuyentes, a diferencia de las fiscalizaciones presenciales que solo pueden cubrir un número limitado de empresas.</p>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                  <p className="text-slate-300 text-sm leading-relaxed"><strong className="text-white">Identificar patrones de incumplimiento:</strong> utilizar análisis de datos para detectar contribuyentes con comportamientos atípicos que sugieran incumplimiento de las normativas.</p>
                </div>
              </div>
              <p className="text-slate-300 leading-relaxed">
                En resumen, la probabilidad de ser detectado al incumplir las normativas de facturación digital es cada vez mayor. Las empresas que operan fuera del marco legal no pueden confiar en &quot;pasar desapercibidas&quot;: los sistemas de control electrónico del SENIAT están diseñados precisamente para detectar esos incumplimientos de forma automatizada.
              </p>
            </section>

            {/* Section 6 */}
            <section id="casos-reales">
              <h2 className="text-2xl font-bold text-white mb-4">
                Escenarios reales de exposición
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                Para dimensionar el impacto real de las sanciones, consideremos estos escenarios típicos que enfrentan las empresas venezolanas:
              </p>
              <div className="space-y-4 mb-6">
                <div className="glass-card p-5">
                  <h3 className="text-lg font-semibold text-white mb-2">Escenario 1: Empresa mediana con sistema no homologado</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Una empresa que emite 2.000 facturas mensuales a través de un sistema no homologado podría enfrentar, en una fiscalización que cubra 6 meses, sanciones por 12.000 documentos emitidos sin cumplir requisitos legales. Además, todos los créditos fiscales generados por esos documentos serían desconocidos por el SENIAT, afectando a cientos de clientes.
                  </p>
                </div>
                <div className="glass-card p-5">
                  <h3 className="text-lg font-semibold text-white mb-2">Escenario 2: Empresa que usa imprenta no autorizada</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Un contribuyente que contrate una imprenta digital que no está autorizada por el SENIAT es responsable de verificar la autorización de su proveedor. Los documentos emitidos no tienen validez fiscal, y la empresa enfrenta multas por cada documento, clausura temporal y la imposibilidad de demostrar cumplimiento en una auditoría.
                  </p>
                </div>
                <div className="glass-card p-5">
                  <h3 className="text-lg font-semibold text-white mb-2">Escenario 3: Empresa que no migra a facturación digital</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Una empresa que continúe emitiendo documentos fiscales exclusivamente en papel después de que el plazo de migración a facturación digital haya vencido para su categoría de contribuyente, estará incumpliendo la Providencia 102. Cada documento emitido fuera del formato digital obligatorio puede ser sancionado individualmente.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 7 */}
            <section id="como-protegerte">
              <h2 className="text-2xl font-bold text-white mb-4">
                Cómo proteger a tu empresa
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                La mejor protección contra las sanciones del SENIAT es el cumplimiento proactivo. Estas son las acciones concretas que debes tomar para proteger tu empresa:
              </p>
              <div className="space-y-4 mb-6">
                <div className="glass-card p-5 border-l-4 border-green-500">
                  <h3 className="text-lg font-semibold text-white mb-2">Utiliza una imprenta digital autorizada</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Verifica que tu imprenta digital esté formalmente autorizada por el SENIAT. Solicita la documentación que acredite su autorización y confirma que opera con un sistema homologado conforme a la Providencia 121. Esto es lo más importante que puedes hacer para protegerte.
                  </p>
                </div>
                <div className="glass-card p-5 border-l-4 border-green-500">
                  <h3 className="text-lg font-semibold text-white mb-2">Migra dentro de los plazos establecidos</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    No esperes al último momento. Identifica el plazo que aplica a tu categoría de contribuyente y comienza el proceso de migración con suficiente anticipación. Una migración planificada reduce errores y garantiza una transición sin sobresaltos.
                  </p>
                </div>
                <div className="glass-card p-5 border-l-4 border-green-500">
                  <h3 className="text-lg font-semibold text-white mb-2">Valida cada documento antes de emitirlo</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Asegúrate de que cada documento fiscal que emitas cumpla con todos los requisitos de la Providencia 102: datos completos del emisor y receptor, número de control válido, cálculos correctos de IVA y formato adecuado. Los sistemas con validación automática, como AIDA, eliminan este riesgo.
                  </p>
                </div>
                <div className="glass-card p-5 border-l-4 border-green-500">
                  <h3 className="text-lg font-semibold text-white mb-2">Conserva tu documentación fiscal</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Mantén registros completos de todos los documentos fiscales emitidos durante al menos 10 años. Asegúrate de que tu imprenta digital ofrezca almacenamiento seguro a largo plazo y que la información esté siempre disponible para consulta o auditoría.
                  </p>
                </div>
                <div className="glass-card p-5 border-l-4 border-green-500">
                  <h3 className="text-lg font-semibold text-white mb-2">Elige AIDA como tu imprenta digital</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    AIDA es una imprenta digital autorizada por el SENIAT con un sistema homologado que automatiza todo el cumplimiento fiscal. La IA valida cada documento, gestiona los números de control, genera reportes automáticos y conserva tu información por 10 años. Con integración a más de 100 ERPs, la protección es completa y sin esfuerzo.
                  </p>
                </div>
              </div>
            </section>

            {/* Conclusion */}
            <section id="conclusion">
              <h2 className="text-2xl font-bold text-white mb-4">Conclusión</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                Las sanciones del SENIAT por incumplimiento de las normativas de facturación digital son severas, acumulativas y cada vez más fáciles de detectar gracias a los sistemas de fiscalización electrónica. Multas por cada documento emitido sin requisitos legales, clausura temporal del establecimiento, desconocimiento de créditos fiscales e inhabilitación para contratar con el Estado son solo algunas de las consecuencias que enfrentan las empresas que no cumplen.
              </p>
              <p className="text-slate-300 leading-relaxed">
                La prevención es siempre más económica que la sanción. Utilizar una imprenta digital autorizada como AIDA, con un sistema homologado por el SENIAT y automatización mediante inteligencia artificial, es la forma más efectiva de proteger tu empresa contra sanciones fiscales. Con AIDA, el cumplimiento es automático, continuo y sin margen de error. No arriesgues tu negocio: actúa ahora.
              </p>
            </section>
          </div>

          {/* CTA */}
          <div className="mt-16 glass-card p-8 text-center glow-blue">
            <h3 className="text-2xl font-bold text-white mb-3">
              Protege tu empresa de sanciones fiscales
            </h3>
            <p className="text-slate-400 mb-6 max-w-xl mx-auto">
              Con AIDA, cumples automáticamente con las Providencias 102 y 121. Nuestra IA
              valida cada documento para que no tengas que preocuparte por sanciones.
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

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Providencia 121: Homologación de sistemas fiscales ante el SENIAT",
  description:
    "Todo lo que necesitas saber sobre la Providencia Administrativa SNAT/2024/000121, la homologación de sistemas de facturación digital y los requisitos técnicos que exige el SENIAT en Venezuela.",
  keywords: [
    "Providencia 121",
    "homologación sistemas SENIAT",
    "SNAT 2024 000121",
    "homologación fiscal Venezuela",
    "sistemas facturación homologados",
    "requisitos técnicos SENIAT",
    "imprenta digital homologada",
    "AIDA homologación",
  ],
  openGraph: {
    title: "Providencia 121: Homologación de sistemas fiscales ante el SENIAT",
    description:
      "Guía completa sobre la Providencia 121: qué es la homologación de sistemas, requisitos técnicos del SENIAT y cómo AIDA cumple con todos los estándares exigidos.",
    type: "article",
    locale: "es_VE",
    url: "https://aida.com.ve/blog/providencia-121-homologacion-sistemas",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  alternates: {
    canonical: "https://aida.com.ve/blog/providencia-121-homologacion-sistemas",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Providencia 121: Homologación de sistemas fiscales ante el SENIAT",
  description:
    "Todo sobre la Providencia 121, la homologación de sistemas de facturación digital y los requisitos técnicos que exige el SENIAT.",
  author: { "@type": "Organization", name: "AIDA Imprenta Digital" },
  publisher: {
    "@type": "Organization",
    name: "AIDA Imprenta Digital C.A.",
    logo: { "@type": "ImageObject", url: "https://aida.com.ve/favicon.ico" },
  },
  datePublished: "2025-07-20",
  dateModified: "2025-07-20",
  mainEntityOfPage: "https://aida.com.ve/blog/providencia-121-homologacion-sistemas",
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
    title: "Homologación fiscal: qué es y cómo cumplir",
    slug: "/blog/homologacion-fiscal-como-cumplir",
    category: "Guía",
    categoryColor: "from-aida-cyan to-teal-400",
  },
  {
    title: "Guía de cumplimiento de normativas fiscales",
    slug: "/blog/guia-cumplimiento-normativas-fiscales",
    category: "Guía",
    categoryColor: "from-green-500 to-emerald-400",
  },
];

const tableOfContents = [
  { id: "que-es-homologacion", label: "¿Qué es la homologación de sistemas?" },
  { id: "providencia-121-detalle", label: "La Providencia 121 en detalle" },
  { id: "requisitos-tecnicos", label: "Requisitos técnicos para la homologación" },
  { id: "proceso-homologacion", label: "El proceso de homologación paso a paso" },
  { id: "relacion-providencia-102", label: "Relación con la Providencia 102" },
  { id: "consecuencias-no-homologar", label: "Consecuencias de no homologar" },
  { id: "aida-homologada", label: "AIDA: sistema homologado por el SENIAT" },
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
            <span className="text-slate-300">Providencia 121: Homologación de sistemas</span>
          </nav>

          {/* Article header */}
          <header className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-aida-accent to-blue-400 bg-clip-text text-transparent border border-white/10">
                Legal
              </span>
              <span className="text-sm text-slate-500">20 Jul 2025</span>
              <span className="text-sm text-slate-500">10 min de lectura</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
              Providencia 121:{" "}
              <span className="gradient-text">Homologación de sistemas fiscales</span>
            </h1>
            <p className="mt-6 text-lg text-slate-400 leading-relaxed">
              La Providencia Administrativa SNAT/2024/000121 establece los requisitos que deben cumplir
              los sistemas informáticos utilizados para generar documentos fiscales en Venezuela. La
              homologación es el proceso mediante el cual el SENIAT certifica que un sistema cumple con
              todos los estándares técnicos y de seguridad exigidos. Aquí te explicamos todo al respecto.
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
            <section id="que-es-homologacion">
              <h2 className="text-2xl font-bold text-white mb-4">
                ¿Qué es la homologación de sistemas?
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                La <strong className="text-white">homologación de sistemas</strong> es el proceso formal mediante el cual el SENIAT evalúa, certifica y aprueba que un sistema informático cumple con todos los requisitos técnicos, funcionales y de seguridad necesarios para generar documentos fiscales digitales con validez legal en Venezuela.
              </p>
              <p className="text-slate-300 leading-relaxed mb-4">
                En términos simples, la homologación es como una &quot;licencia técnica&quot; que el SENIAT otorga a los sistemas de facturación. Sin esta homologación, un sistema informático no puede ser utilizado para emitir documentos fiscales digitales válidos, independientemente de lo avanzado o robusto que sea tecnológicamente.
              </p>
              <p className="text-slate-300 leading-relaxed">
                La homologación no es un trámite puntual: es un estándar continuo que el sistema debe mantener durante todo su período de operación. El SENIAT puede realizar auditorías técnicas periódicas para verificar que el sistema sigue cumpliendo con los requisitos, y puede revocar la homologación si detecta incumplimientos.
              </p>
            </section>

            {/* Section 2 */}
            <section id="providencia-121-detalle">
              <h2 className="text-2xl font-bold text-white mb-4">
                La Providencia 121 en detalle
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                La <strong className="text-white">Providencia Administrativa SNAT/2024/000121</strong> es el instrumento legal específico que regula todo lo relacionado con la homologación de sistemas de facturación digital en Venezuela. Esta providencia establece:
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-aida-accent mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-slate-300 text-sm leading-relaxed">Los <strong className="text-white">requisitos técnicos mínimos</strong> que deben cumplir los sistemas de facturación para ser considerados aptos para generar documentos fiscales digitales.</p>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-aida-accent mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-slate-300 text-sm leading-relaxed">El <strong className="text-white">procedimiento de evaluación</strong> que el SENIAT sigue para evaluar y certificar los sistemas presentados por las empresas solicitantes.</p>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-aida-accent mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-slate-300 text-sm leading-relaxed">Las <strong className="text-white">obligaciones permanentes</strong> que deben mantener los sistemas homologados durante todo el período de vigencia de la certificación.</p>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-aida-accent mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-slate-300 text-sm leading-relaxed">Las <strong className="text-white">causales de revocación</strong> de la homologación y las consecuencias para los contribuyentes que utilicen sistemas no homologados.</p>
                </div>
              </div>
              <div className="glass-card p-5 border-l-4 border-aida-cyan my-6">
                <p className="text-sm text-aida-cyan font-semibold mb-2">Dato clave</p>
                <p className="text-slate-300 text-sm leading-relaxed">
                  La Providencia 121 no homologa cualquier software genérico. Solo se homologan los sistemas que operan como parte de una imprenta digital autorizada o que se integran formalmente con una. Esto significa que tu ERP por sí solo no requiere homologación directa, pero sí debe estar integrado con una imprenta digital que cuente con un sistema homologado.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section id="requisitos-tecnicos">
              <h2 className="text-2xl font-bold text-white mb-4">
                Requisitos técnicos para la homologación
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                La Providencia 121 establece requisitos técnicos rigurosos que los sistemas deben cumplir para obtener la homologación. Estos requisitos abarcan múltiples dimensiones:
              </p>
              <div className="space-y-4 mb-6">
                <div className="glass-card p-5">
                  <h3 className="text-lg font-semibold text-white mb-2">Seguridad de la información</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    El sistema debe implementar cifrado de datos en tránsito y en reposo, controles de acceso basados en roles, autenticación multifactor para usuarios con privilegios administrativos, registros de auditoría inmutables de todas las operaciones, y mecanismos de detección y respuesta ante incidentes de seguridad. Los protocolos de cifrado deben cumplir con estándares internacionales reconocidos.
                  </p>
                </div>
                <div className="glass-card p-5">
                  <h3 className="text-lg font-semibold text-white mb-2">Disponibilidad y continuidad</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Se exige una disponibilidad mínima del 99.5%, con planes documentados de continuidad operativa y recuperación ante desastres. Los sistemas deben contar con infraestructura redundante, respaldos automáticos con frecuencia definida, y capacidad de restauración dentro de los tiempos máximos establecidos por la normativa. Las interrupciones programadas deben comunicarse con antelación.
                  </p>
                </div>
                <div className="glass-card p-5">
                  <h3 className="text-lg font-semibold text-white mb-2">Integridad de los documentos</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    El sistema debe garantizar que los documentos fiscales, una vez emitidos, no puedan ser modificados, alterados o eliminados. Esto requiere mecanismos de sellado digital o hashing que permitan verificar la integridad de cada documento en cualquier momento posterior a su emisión. Cualquier intento de alteración debe ser detectable y quedar registrado.
                  </p>
                </div>
                <div className="glass-card p-5">
                  <h3 className="text-lg font-semibold text-white mb-2">Trazabilidad completa</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Cada operación realizada en el sistema debe quedar registrada con detalle suficiente para reconstruir la secuencia completa de eventos: quién emitió el documento, cuándo, desde qué sistema o integración, con qué datos de entrada, qué validaciones se aplicaron y cuál fue el resultado final. Estos registros deben conservarse durante todo el período de retención exigido.
                  </p>
                </div>
                <div className="glass-card p-5">
                  <h3 className="text-lg font-semibold text-white mb-2">Interoperabilidad con el SENIAT</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    El sistema debe ser capaz de comunicarse con los sistemas del SENIAT en los formatos y protocolos establecidos. Esto incluye la capacidad de enviar reportes automatizados, responder a consultas de la administración tributaria, y facilitar el acceso a la información fiscal cuando sea requerido en el marco de fiscalizaciones o auditorías.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="proceso-homologacion">
              <h2 className="text-2xl font-bold text-white mb-4">
                El proceso de homologación paso a paso
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                El proceso de homologación ante el SENIAT sigue un procedimiento formal que incluye varias etapas:
              </p>
              <div className="space-y-4 mb-6">
                <div className="glass-card p-5 border-l-4 border-aida-accent">
                  <h3 className="text-lg font-semibold text-white mb-2">Paso 1: Solicitud formal</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    La empresa solicitante presenta ante el SENIAT una solicitud formal de homologación, acompañada de toda la documentación técnica del sistema: arquitectura, especificaciones de seguridad, documentación de APIs, planes de continuidad, y cualquier otra información requerida por la normativa.
                  </p>
                </div>
                <div className="glass-card p-5 border-l-4 border-aida-accent">
                  <h3 className="text-lg font-semibold text-white mb-2">Paso 2: Evaluación técnica</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Los equipos técnicos del SENIAT evalúan la documentación presentada y realizan pruebas sobre el sistema para verificar que cumple con todos los requisitos establecidos en la Providencia 121. Esta evaluación puede incluir pruebas de penetración, pruebas de carga, verificación de controles de seguridad y validación de la funcionalidad fiscal.
                  </p>
                </div>
                <div className="glass-card p-5 border-l-4 border-aida-accent">
                  <h3 className="text-lg font-semibold text-white mb-2">Paso 3: Observaciones y correcciones</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Si el SENIAT identifica deficiencias durante la evaluación, emite observaciones que la empresa debe corregir dentro de un plazo determinado. Este ciclo puede repetirse hasta que el sistema cumpla con todos los requisitos o hasta que se agote el plazo otorgado.
                  </p>
                </div>
                <div className="glass-card p-5 border-l-4 border-aida-accent">
                  <h3 className="text-lg font-semibold text-white mb-2">Paso 4: Certificación</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Una vez que el sistema aprueba todas las evaluaciones, el SENIAT emite la certificación de homologación mediante un acto administrativo formal. Esta certificación tiene una vigencia determinada y debe renovarse periódicamente, demostrando que el sistema mantiene los estándares exigidos.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section id="relacion-providencia-102">
              <h2 className="text-2xl font-bold text-white mb-4">
                Relación con la Providencia 102
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                Las Providencias 102 y 121 son complementarias y forman un marco regulatorio integral para la facturación digital en Venezuela. La forma más clara de entender su relación es:
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="glass-card p-5 border-t-2 border-aida-accent">
                  <h3 className="text-lg font-semibold text-white mb-2">Providencia 102</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Define el <strong className="text-white">&quot;qué&quot;</strong>: qué documentos fiscales se deben emitir en formato digital, qué datos deben contener, qué requisitos formales deben cumplir y quiénes están obligados a adoptarlos. Es la norma de la <strong className="text-white">facturación digital</strong>.
                  </p>
                </div>
                <div className="glass-card p-5 border-t-2 border-violet-500">
                  <h3 className="text-lg font-semibold text-white mb-2">Providencia 121</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Define el <strong className="text-white">&quot;cómo&quot;</strong>: cómo deben funcionar los sistemas que generan esos documentos, qué estándares técnicos deben cumplir, cómo se verifican esos estándares y qué pasa si no se cumplen. Es la norma de la <strong className="text-white">homologación de sistemas</strong>.
                  </p>
                </div>
              </div>
              <p className="text-slate-300 leading-relaxed">
                En la práctica, no se puede cumplir con la Providencia 102 sin cumplir con la Providencia 121. Los documentos fiscales digitales solo tienen validez cuando se emiten a través de sistemas que han sido homologados por el SENIAT. Una empresa que utilice un sistema no homologado para emitir facturas digitales está incumpliendo ambas providencias, independientemente de que el formato del documento sea correcto.
              </p>
            </section>

            {/* Section 6 */}
            <section id="consecuencias-no-homologar">
              <h2 className="text-2xl font-bold text-white mb-4">
                Consecuencias de no homologar
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                Utilizar sistemas no homologados para la emisión de documentos fiscales tiene consecuencias graves tanto para la imprenta digital como para los contribuyentes que utilizan sus servicios:
              </p>
              <div className="glass-card p-5 border-l-4 border-red-500 my-6">
                <p className="text-sm text-red-400 font-semibold mb-2">Consecuencias legales</p>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li><strong className="text-white">Invalidez de documentos:</strong> todos los documentos fiscales emitidos a través de un sistema no homologado carecen de validez legal, lo que afecta tanto al emisor como al receptor de los documentos.</li>
                  <li><strong className="text-white">Sanciones económicas:</strong> multas calculadas por cada documento emitido sin cumplir los requisitos legales, cuyo monto puede ser devastador para empresas con altos volúmenes de facturación.</li>
                  <li><strong className="text-white">Clausura temporal:</strong> el SENIAT puede ordenar el cierre temporal del establecimiento cuando detecta emisión sistemática de documentos a través de sistemas no autorizados.</li>
                  <li><strong className="text-white">Pérdida de créditos fiscales:</strong> los receptores de documentos emitidos por sistemas no homologados no pueden utilizar esos documentos para deducir créditos fiscales de IVA.</li>
                  <li><strong className="text-white">Revocación de autorización:</strong> si una imprenta digital opera con un sistema cuya homologación fue revocada, pierde su autorización como imprenta, afectando a todos sus clientes.</li>
                </ul>
              </div>
            </section>

            {/* Section 7 */}
            <section id="aida-homologada">
              <h2 className="text-2xl font-bold text-white mb-4">
                AIDA: sistema homologado por el SENIAT
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                AIDA opera con un sistema que cumple con todos los requisitos de la Providencia 121. Al elegir AIDA como tu imprenta digital autorizada, no necesitas preocuparte por la homologación: ya está resuelta.
              </p>
              <div className="space-y-4 mb-6">
                <div className="glass-card p-5 border-l-4 border-aida-accent">
                  <h3 className="text-lg font-semibold text-white mb-2">Infraestructura de alta disponibilidad</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    La plataforma de AIDA opera sobre infraestructura redundante con disponibilidad superior al 99.9%, muy por encima del mínimo exigido por la Providencia 121. Respaldos automáticos, cifrado de grado militar y planes de recuperación ante desastres garantizan que tu información fiscal está siempre protegida y disponible.
                  </p>
                </div>
                <div className="glass-card p-5 border-l-4 border-aida-accent">
                  <h3 className="text-lg font-semibold text-white mb-2">Integración con más de 100 ERPs</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    AIDA se integra con tu ERP existente, canalizando la facturación digital a través de un sistema homologado sin que necesites modificar tus procesos internos. No importa qué sistema de gestión utilices: AIDA tiene conectores listos para más de 100 ERPs, asegurando una integración rápida y sin fricciones.
                  </p>
                </div>
                <div className="glass-card p-5 border-l-4 border-aida-accent">
                  <h3 className="text-lg font-semibold text-white mb-2">Trazabilidad total con IA</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Cada operación en AIDA queda registrada con trazabilidad completa. La inteligencia artificial del sistema monitorea continuamente las operaciones, detectando anomalías y asegurando que cada documento emitido cumple con todos los requisitos de la Providencia 121 antes de ser generado.
                  </p>
                </div>
                <div className="glass-card p-5 border-l-4 border-aida-accent">
                  <h3 className="text-lg font-semibold text-white mb-2">Actualizaciones automáticas</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Cuando el SENIAT actualiza los requisitos de homologación o modifica las normativas, AIDA se actualiza automáticamente para mantener el cumplimiento. No necesitas hacer nada: el sistema se adapta a los cambios regulatorios sin interrumpir tu operación.
                  </p>
                </div>
              </div>
            </section>

            {/* Conclusion */}
            <section id="conclusion">
              <h2 className="text-2xl font-bold text-white mb-4">Conclusión</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                La Providencia 121 y la homologación de sistemas son piezas fundamentales del nuevo marco de facturación digital en Venezuela. Sin un sistema homologado, los documentos fiscales digitales no tienen validez legal, y tanto las imprentas digitales como los contribuyentes se exponen a sanciones severas.
              </p>
              <p className="text-slate-300 leading-relaxed">
                La forma más eficiente de cumplir con la Providencia 121 es utilizar una imprenta digital autorizada que ya cuente con un sistema homologado, como AIDA. De esta manera, delegas la complejidad técnica de la homologación a un especialista y te enfocas en lo que realmente importa: la operación de tu negocio. Con integración directa a tu ERP y automatización mediante inteligencia artificial, AIDA convierte el cumplimiento de la Providencia 121 en un proceso transparente e invisible para tu empresa.
              </p>
            </section>
          </div>

          {/* CTA */}
          <div className="mt-16 glass-card p-8 text-center glow-blue">
            <h3 className="text-2xl font-bold text-white mb-3">
              ¿Tu sistema de facturación cumple con la Providencia 121?
            </h3>
            <p className="text-slate-400 mb-6 max-w-xl mx-auto">
              Con AIDA, no necesitas preocuparte por la homologación. Nuestro sistema ya está certificado
              por el SENIAT y se integra con tu ERP en minutos.
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

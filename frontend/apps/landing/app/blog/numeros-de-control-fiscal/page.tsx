import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Números de control fiscal: Todo lo que debes saber",
  description:
    "Aprende todo sobre los números de control fiscal en Venezuela: cómo los asigna el SENIAT, reglas de secuencialidad, validación, auditoría y cómo AIDA gestiona rangos automáticamente con asignación atómica.",
  keywords: [
    "números de control fiscal Venezuela",
    "número de control SENIAT",
    "rangos de control SENIAT",
    "asignación números de control",
    "validación número de control",
    "secuencial número de control",
    "auditoría SENIAT números de control",
    "AIDA números de control",
  ],
  openGraph: {
    title: "Números de control fiscal: Todo lo que debes saber",
    description:
      "Todo sobre los números de control fiscal del SENIAT: asignación, validación, rangos y gestión automática con AIDA.",
    type: "article",
    locale: "es_VE",
    url: "https://aida.com.ve/blog/numeros-de-control-fiscal",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  alternates: {
    canonical: "https://aida.com.ve/blog/numeros-de-control-fiscal",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Números de control fiscal: Todo lo que debes saber",
  description:
    "Todo sobre los números de control fiscal del SENIAT: asignación, secuencialidad, validación, auditoría y gestión automática.",
  author: { "@type": "Organization", name: "AIDA Imprenta Digital" },
  publisher: {
    "@type": "Organization",
    name: "AIDA Imprenta Digital C.A.",
    logo: { "@type": "ImageObject", url: "https://aida.com.ve/favicon.ico" },
  },
  datePublished: "2024-12-15",
  dateModified: "2024-12-15",
  mainEntityOfPage: "https://aida.com.ve/blog/numeros-de-control-fiscal",
  image: "https://aida.com.ve/og-image.png",
};

const relatedArticles = [
  {
    title: "¿Qué es una imprenta digital autorizada por el SENIAT?",
    slug: "/blog/imprenta-digital-autorizada-seniat",
    category: "Educación",
    categoryColor: "from-aida-accent to-blue-400",
  },
  {
    title: "Facturación electrónica en Venezuela: Guía completa 2025",
    slug: "/blog/facturacion-electronica-venezuela-guia-2025",
    category: "Guía",
    categoryColor: "from-aida-cyan to-teal-400",
  },
  {
    title: "5 errores comunes al emitir documentos fiscales y cómo evitarlos",
    slug: "/blog/errores-comunes-documentos-fiscales",
    category: "Tips",
    categoryColor: "from-rose-500 to-pink-400",
  },
];

const tableOfContents = [
  { id: "que-son", label: "¿Qué son los números de control?" },
  { id: "asignacion", label: "Cómo el SENIAT asigna los rangos" },
  { id: "reglas-secuenciales", label: "Reglas de secuencialidad" },
  { id: "validacion", label: "Validación de números de control" },
  { id: "agotamiento", label: "¿Qué pasa cuando se agotan?" },
  { id: "auditoria", label: "Auditoría y fiscalización" },
  { id: "aida-gestion", label: "Cómo AIDA gestiona rangos automáticamente" },
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
        <div className="orb orb-purple w-96 h-96 -top-20 -right-40" />
        <div className="orb orb-blue w-72 h-72 top-1/3 -left-36" />
        <div className="orb orb-cyan w-64 h-64 bottom-1/4 right-0" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
            <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <span>/</span>
            <span className="text-slate-300">Números de control fiscal</span>
          </nav>

          {/* Article header */}
          <header className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-violet-500 to-purple-400 bg-clip-text text-transparent border border-white/10">
                Legal
              </span>
              <span className="text-sm text-slate-500">15 Dic 2024</span>
              <span className="text-sm text-slate-500">6 min de lectura</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
              Números de control fiscal:{" "}
              <span className="gradient-text">Todo lo que debes saber</span>
            </h1>
            <p className="mt-6 text-lg text-slate-400 leading-relaxed">
              Los números de control son la columna vertebral de la trazabilidad fiscal en Venezuela.
              Cada documento fiscal emitido legalmente lleva uno, y su correcta gestión es fundamental
              para evitar sanciones. Aprende cómo funcionan y cómo AIDA los gestiona automáticamente.
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
            <section id="que-son">
              <h2 className="text-2xl font-bold text-white mb-4">
                ¿Qué son los números de control?
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                Un número de control fiscal es un identificador único, secuencial e irrepetible que el SENIAT asigna a cada documento fiscal emitido en Venezuela. Su propósito fundamental es garantizar la trazabilidad de todos los documentos fiscales en el sistema tributario nacional, permitiendo a la administración tributaria rastrear, verificar y auditar cada factura, nota de crédito, nota de débito, guía de despacho o comprobante de retención emitido por cualquier contribuyente.
              </p>
              <p className="text-slate-300 leading-relaxed mb-4">
                El número de control es diferente del número de documento (número de factura). Mientras que el número de factura es un correlativo interno del contribuyente que este administra de forma autónoma, el número de control es asignado por el SENIAT a través de la imprenta autorizada y forma parte del sistema de control fiscal nacional. Un mismo contribuyente puede tener múltiples series de números de factura, pero cada número de control es globalmente único dentro del sistema del SENIAT.
              </p>
              <div className="glass-card p-5 border-l-4 border-violet-500 my-6">
                <p className="text-sm text-violet-400 font-semibold mb-2">Formato del número de control</p>
                <p className="text-slate-300 text-sm leading-relaxed">
                  El número de control sigue el formato <code className="text-aida-cyan bg-white/5 px-1.5 py-0.5 rounded">00-00000000</code>, donde los primeros dos dígitos identifican el rango de la serie y los ocho dígitos siguientes son el número secuencial dentro de ese rango. Por ejemplo: <code className="text-aida-cyan bg-white/5 px-1.5 py-0.5 rounded">00-00001234</code> indica el documento número 1.234 del rango 00. Este formato estandarizado facilita la validación automática y el cruce de información por parte del SENIAT.
                </p>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Cada documento fiscal emitido consume exactamente un número de control, y esos números no pueden reutilizarse ni reciclarse. Si un documento se anula, el número de control utilizado queda marcado como anulado pero nunca se reasigna. Esta regla de inmutabilidad es fundamental para la integridad del sistema fiscal.
              </p>
            </section>

            {/* Section 2 */}
            <section id="asignacion">
              <h2 className="text-2xl font-bold text-white mb-4">
                Cómo el SENIAT asigna los rangos
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                El SENIAT no asigna números de control de forma individual sino en bloques denominados "rangos". Un rango es un conjunto consecutivo de números de control que se asigna a una imprenta autorizada para que esta, a su vez, los distribuya entre sus contribuyentes clientes. El proceso funciona de la siguiente manera:
              </p>
              <div className="space-y-4 mb-6">
                <div className="glass-card p-5">
                  <h3 className="text-lg font-semibold text-white mb-2">1. Solicitud de la imprenta</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    La imprenta digital autorizada presenta una solicitud formal al SENIAT a través de los canales establecidos, indicando la cantidad de números de control que necesita y para qué contribuyentes serán utilizados. La solicitud debe incluir la identificación fiscal de cada contribuyente, el tipo de documentos que emitirá y un estimado del volumen de emisión.
                  </p>
                </div>
                <div className="glass-card p-5">
                  <h3 className="text-lg font-semibold text-white mb-2">2. Evaluación y aprobación</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    El SENIAT evalúa la solicitud, verifica la situación fiscal de los contribuyentes involucrados (que estén al día con sus obligaciones), y aprueba la asignación de un rango específico. El tamaño del rango depende del volumen histórico de emisión del contribuyente y de las proyecciones presentadas por la imprenta.
                  </p>
                </div>
                <div className="glass-card p-5">
                  <h3 className="text-lg font-semibold text-white mb-2">3. Entrega del rango</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Una vez aprobada, el SENIAT comunica a la imprenta el rango asignado, especificando el número inicial y el número final. Por ejemplo, un rango podría ser del <code className="text-aida-cyan bg-white/5 px-1.5 py-0.5 rounded">00-00010001</code> al <code className="text-aida-cyan bg-white/5 px-1.5 py-0.5 rounded">00-00020000</code>, lo que otorga 10.000 números de control al contribuyente. La imprenta carga este rango en su sistema y comienza a asignar números secuencialmente a medida que se emiten documentos.
                  </p>
                </div>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Es importante destacar que la imprenta es responsable solidariamente por la correcta utilización de los rangos asignados. Si un número de control se pierde, se duplica o se utiliza fuera de secuencia, la imprenta debe responder ante el SENIAT y puede enfrentar sanciones que van desde multas hasta la revocación de su autorización.
              </p>
            </section>

            {/* Section 3 */}
            <section id="reglas-secuenciales">
              <h2 className="text-2xl font-bold text-white mb-4">
                Reglas de secuencialidad
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                La normativa del SENIAT establece reglas estrictas sobre la secuencialidad de los números de control. Estas reglas son fundamentales para la integridad del sistema de control fiscal:
              </p>
              <div className="glass-card p-6 mb-6">
                <ul className="space-y-4 text-sm text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                    <div>
                      <strong className="text-white">Asignación estrictamente secuencial:</strong> los números de control deben asignarse en orden ascendente, sin saltos. Si el último número asignado fue el 00-00001000, el siguiente debe ser el 00-00001001. Cualquier salto genera una alerta en los sistemas del SENIAT.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                    <div>
                      <strong className="text-white">Prohibición de duplicados:</strong> ningún número de control puede utilizarse más de una vez. La duplicación de un número de control es una de las irregularidades más graves que puede detectar el SENIAT, ya que sugiere manipulación intencional del sistema fiscal.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                    <div>
                      <strong className="text-white">Anulación con registro:</strong> si un documento debe anularse, el número de control queda marcado como "anulado" pero permanece en la secuencia. No se reutiliza ni se elimina. El sistema debe registrar la fecha, hora y motivo de la anulación.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</span>
                    <div>
                      <strong className="text-white">Coherencia temporal:</strong> la fecha de emisión de un documento debe ser posterior a la del documento anterior en la secuencia. No es permitido emitir un documento con número de control 00-00001005 con fecha anterior al documento 00-00001004.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">5</span>
                    <div>
                      <strong className="text-white">Restricción de rango:</strong> un contribuyente solo puede utilizar los números de control que le fueron asignados dentro de su rango. Intentar usar números fuera del rango asignado invalida el documento.
                    </div>
                  </li>
                </ul>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Estas reglas parecen simples en teoría, pero en la práctica pueden ser difíciles de cumplir, especialmente en entornos de alta concurrencia donde múltiples usuarios emiten documentos simultáneamente. Los sistemas manuales o semi-automatizados son particularmente vulnerables a violaciones de secuencialidad, lo que convierte a la automatización en una necesidad, no en un lujo.
              </p>
            </section>

            {/* Section 4 */}
            <section id="validacion">
              <h2 className="text-2xl font-bold text-white mb-4">
                Validación de números de control
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                La validación de un número de control implica verificar que cumple con todas las reglas establecidas por el SENIAT. Esta validación se realiza en múltiples niveles:
              </p>
              <p className="text-slate-300 leading-relaxed mb-4">
                <strong className="text-white">Validación de formato:</strong> el número debe seguir el formato estándar (XX-XXXXXXXX), con los separadores correctos y la cantidad de dígitos adecuada. Cualquier variación en el formato invalida el número.
              </p>
              <p className="text-slate-300 leading-relaxed mb-4">
                <strong className="text-white">Validación de rango:</strong> el número debe estar dentro del rango asignado al contribuyente por el SENIAT. Si el contribuyente tiene asignado el rango 00-00010001 al 00-00020000, cualquier número fuera de ese intervalo es inválido.
              </p>
              <p className="text-slate-300 leading-relaxed mb-4">
                <strong className="text-white">Validación de unicidad:</strong> el número no debe haber sido utilizado previamente. El sistema debe verificar contra el registro histórico completo que no existe otro documento con el mismo número de control.
              </p>
              <p className="text-slate-300 leading-relaxed">
                <strong className="text-white">Validación cruzada del SENIAT:</strong> el SENIAT puede verificar en tiempo real que los números de control reportados en las declaraciones de IVA correspondan efectivamente a rangos asignados a imprentas autorizadas y a contribuyentes registrados. Las discrepancias generan automáticamente alertas de fiscalización.
              </p>
            </section>

            {/* Section 5 */}
            <section id="agotamiento">
              <h2 className="text-2xl font-bold text-white mb-4">
                ¿Qué pasa cuando se agotan los números de control?
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                El agotamiento de números de control es una situación crítica que puede paralizar la operación de facturación de una empresa. Cuando un contribuyente consume todos los números de su rango asignado, simplemente no puede emitir más documentos fiscales hasta que se le asigne un nuevo rango.
              </p>
              <div className="glass-card p-5 border-l-4 border-red-500 my-6">
                <p className="text-sm text-red-400 font-semibold mb-2">Consecuencias del agotamiento</p>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Si una empresa agota sus números de control y no tiene un nuevo rango listo, no puede emitir facturas. Esto significa que no puede documentar ventas legalmente, lo que puede derivar en: pérdida de ventas por imposibilidad de facturar, incumplimiento de obligaciones contractuales con clientes, sanciones del SENIAT por no documentar operaciones gravadas, y acumulación de operaciones pendientes de facturar que genera irregularidades contables.
                </p>
              </div>
              <p className="text-slate-300 leading-relaxed mb-4">
                El proceso de solicitud de un nuevo rango al SENIAT puede tomar entre 24 horas y varios días hábiles, dependiendo de la carga administrativa del momento. Por esta razón, es fundamental monitorear constantemente el consumo de números de control y solicitar nuevos rangos con antelación suficiente.
              </p>
              <p className="text-slate-300 leading-relaxed">
                Las imprentas digitales modernas como AIDA resuelven este problema mediante alertas tempranas y solicitudes proactivas. El sistema monitorea el porcentaje de utilización del rango y, cuando se alcanza un umbral predefinido (por ejemplo, 80% del rango consumido), inicia automáticamente el proceso de solicitud de un nuevo rango, eliminando el riesgo de agotamiento.
              </p>
            </section>

            {/* Section 6 */}
            <section id="auditoria">
              <h2 className="text-2xl font-bold text-white mb-4">
                Auditoría y fiscalización
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                Los números de control son una herramienta central en las auditorías y fiscalizaciones del SENIAT. La administración tributaria utiliza los números de control para verificar la integridad de la cadena documental de cada contribuyente.
              </p>
              <p className="text-slate-300 leading-relaxed mb-4">
                Durante una fiscalización, el SENIAT puede solicitar al contribuyente o a la imprenta autorizada un reporte completo de todos los números de control utilizados en un período determinado. Este reporte debe incluir cada número de control, el tipo de documento asociado, la fecha de emisión, el monto, los datos del receptor y el estado del documento (emitido o anulado).
              </p>
              <p className="text-slate-300 leading-relaxed mb-4">
                El SENIAT cruza esta información con las declaraciones de IVA del contribuyente, los registros de sus clientes y proveedores, y la información reportada por la imprenta. Las inconsistencias detectadas (saltos en la secuencia, documentos no declarados, montos discrepantes) generan hallazgos de auditoría que pueden derivar en ajustes fiscales, multas y otras sanciones.
              </p>
              <p className="text-slate-300 leading-relaxed">
                Una gestión impecable de los números de control es la mejor defensa ante una fiscalización. Las empresas que utilizan sistemas automatizados con trazabilidad completa pueden responder a los requerimientos del SENIAT de forma inmediata y con total confianza en la integridad de sus datos.
              </p>
            </section>

            {/* Section 7 */}
            <section id="aida-gestion">
              <h2 className="text-2xl font-bold text-white mb-4">
                Cómo AIDA gestiona rangos automáticamente
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                AIDA implementa un sistema de gestión de números de control diseñado para eliminar por completo los riesgos asociados a la administración manual. El enfoque se basa en tres pilares fundamentales:
              </p>
              <div className="space-y-4 mb-6">
                <div className="glass-card p-5 border-l-4 border-aida-accent">
                  <h3 className="text-lg font-semibold text-white mb-2">Asignación atómica</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Cada asignación de número de control en AIDA es una operación atómica a nivel de base de datos. Esto significa que incluso cuando múltiples usuarios emiten documentos simultáneamente, el sistema garantiza que cada número se asigna una sola vez y en el orden correcto. No hay posibilidad de duplicados, saltos ni condiciones de carrera (race conditions). El mecanismo utiliza transacciones con bloqueo optimista que aseguran la integridad sin sacrificar el rendimiento: la asignación toma menos de 10 milisegundos incluso bajo carga extrema.
                  </p>
                </div>
                <div className="glass-card p-5 border-l-4 border-aida-accent">
                  <h3 className="text-lg font-semibold text-white mb-2">Monitoreo proactivo</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    AIDA monitorea en tiempo real el nivel de utilización de cada rango de números de control. Cuando el consumo alcanza el 70%, se genera una alerta interna. Al 85%, se inicia automáticamente el proceso de solicitud de un nuevo rango al SENIAT. Al 95%, se envía una notificación urgente al contribuyente. Este sistema de alertas escalonadas garantiza que nunca te quedes sin números de control disponibles.
                  </p>
                </div>
                <div className="glass-card p-5 border-l-4 border-aida-accent">
                  <h3 className="text-lg font-semibold text-white mb-2">Auditoría integrada</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Cada operación con números de control queda registrada en un log inmutable con marca de tiempo, usuario, tipo de documento y resultado de la operación. Ante una fiscalización, AIDA puede generar automáticamente los reportes que el SENIAT necesita, con desglose completo de cada número de control: a qué documento se asignó, cuándo, por qué usuario, y su estado actual. Los reportes se generan en segundos, sin importar el volumen de documentos.
                  </p>
                </div>
              </div>
              <p className="text-slate-300 leading-relaxed">
                En la práctica, esto significa que al usar AIDA, los números de control dejan de ser una preocupación. No necesitas monitorear rangos, solicitar nuevos bloques manualmente, preocuparte por duplicados ni generar reportes para auditorías. El sistema se encarga de todo, permitiéndote enfocarte en tu actividad comercial con la tranquilidad de que tu facturación cumple con cada regla del SENIAT.
              </p>
            </section>
          </div>

          {/* CTA */}
          <div className="mt-16 glass-card p-8 text-center glow-blue">
            <h3 className="text-2xl font-bold text-white mb-3">
              Olvídate de gestionar números de control
            </h3>
            <p className="text-slate-400 mb-6 max-w-xl mx-auto">
              Con AIDA, los números de control se gestionan automáticamente. Asignación atómica,
              monitoreo proactivo y reportes de auditoría con un clic.
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

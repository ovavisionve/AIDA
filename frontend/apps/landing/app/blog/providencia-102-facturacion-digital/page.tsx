import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Providencia 102: Todo sobre la facturación digital obligatoria en Venezuela",
  description:
    "Descubre qué establece la Providencia Administrativa SNAT/2024/000102 sobre facturación digital en Venezuela, sus requisitos, plazos y cómo cumplir con las obligaciones fiscales ante el SENIAT.",
  keywords: [
    "Providencia 102",
    "facturación digital Venezuela",
    "SNAT 2024 000102",
    "SENIAT facturación electrónica",
    "documentos fiscales digitales",
    "obligaciones fiscales Venezuela",
    "factura electrónica SENIAT",
    "AIDA facturación digital",
  ],
  openGraph: {
    title: "Providencia 102: Todo sobre la facturación digital obligatoria en Venezuela",
    description:
      "Guía completa sobre la Providencia 102 del SENIAT: requisitos de facturación digital, plazos de cumplimiento y cómo AIDA te ayuda a cumplir sin esfuerzo.",
    type: "article",
    locale: "es_VE",
    url: "https://aida.com.ve/blog/providencia-102-facturacion-digital",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  alternates: {
    canonical: "https://aida.com.ve/blog/providencia-102-facturacion-digital",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Providencia 102: Todo sobre la facturación digital obligatoria en Venezuela",
  description:
    "Guía completa sobre la Providencia Administrativa SNAT/2024/000102, sus requisitos de facturación digital y cómo cumplir ante el SENIAT.",
  author: { "@type": "Organization", name: "AIDA Imprenta Digital" },
  publisher: {
    "@type": "Organization",
    name: "AIDA Imprenta Digital C.A.",
    logo: { "@type": "ImageObject", url: "https://aida.com.ve/favicon.ico" },
  },
  datePublished: "2025-07-15",
  dateModified: "2025-07-15",
  mainEntityOfPage: "https://aida.com.ve/blog/providencia-102-facturacion-digital",
  image: "https://aida.com.ve/og-image.png",
};

const relatedArticles = [
  {
    title: "Providencia 121: Homologación de sistemas fiscales",
    slug: "/blog/providencia-121-homologacion-sistemas",
    category: "Legal",
    categoryColor: "from-violet-500 to-purple-400",
  },
  {
    title: "¿Por qué es urgente migrar a facturación digital?",
    slug: "/blog/urgencia-migracion-facturacion-digital",
    category: "Urgente",
    categoryColor: "from-rose-500 to-pink-400",
  },
  {
    title: "Sanciones del SENIAT por incumplimiento fiscal",
    slug: "/blog/sanciones-seniat-incumplimiento",
    category: "Legal",
    categoryColor: "from-amber-500 to-orange-400",
  },
];

const tableOfContents = [
  { id: "que-es", label: "¿Qué es la Providencia 102?" },
  { id: "contexto-historico", label: "Contexto histórico y evolución normativa" },
  { id: "requisitos-principales", label: "Requisitos principales de la Providencia 102" },
  { id: "tipos-documentos", label: "Tipos de documentos fiscales digitales" },
  { id: "plazos-cumplimiento", label: "Plazos y cronograma de cumplimiento" },
  { id: "contribuyentes-obligados", label: "¿Quiénes están obligados?" },
  { id: "aida-solucion", label: "Cómo AIDA facilita el cumplimiento de la Providencia 102" },
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
            <span className="text-slate-300">Providencia 102: Facturación digital</span>
          </nav>

          {/* Article header */}
          <header className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-aida-accent to-blue-400 bg-clip-text text-transparent border border-white/10">
                Legal
              </span>
              <span className="text-sm text-slate-500">15 Jul 2025</span>
              <span className="text-sm text-slate-500">10 min de lectura</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
              Providencia 102:{" "}
              <span className="gradient-text">Facturación digital obligatoria en Venezuela</span>
            </h1>
            <p className="mt-6 text-lg text-slate-400 leading-relaxed">
              La Providencia Administrativa SNAT/2024/000102 marca un antes y un después en la facturación
              en Venezuela. Este instrumento legal establece las normas y requisitos para la emisión de
              documentos fiscales en formato digital, reemplazando progresivamente los métodos tradicionales
              de facturación en papel. Aquí te explicamos todo lo que necesitas saber para cumplir.
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
            <section id="que-es">
              <h2 className="text-2xl font-bold text-white mb-4">
                ¿Qué es la Providencia 102?
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                La <strong className="text-white">Providencia Administrativa SNAT/2024/000102</strong> es el instrumento legal emitido por el Superintendente Nacional Aduanero y Tributario del SENIAT que regula la emisión de documentos fiscales en formato digital en Venezuela. Esta providencia establece las normas, requisitos técnicos y condiciones que deben cumplir los contribuyentes para emitir facturas, notas de crédito, notas de débito y otros documentos fiscales de manera electrónica.
              </p>
              <p className="text-slate-300 leading-relaxed mb-4">
                En esencia, la Providencia 102 es la normativa que regula la <strong className="text-white">facturación digital</strong> en Venezuela. Su objetivo principal es modernizar el sistema tributario venezolano, mejorar los mecanismos de control fiscal y facilitar el cumplimiento de las obligaciones tributarias por parte de los contribuyentes mediante el uso de tecnologías digitales.
              </p>
              <p className="text-slate-300 leading-relaxed">
                Esta providencia no solo define cómo deben generarse los documentos fiscales digitales, sino que también establece los requisitos que deben cumplir los sistemas utilizados para su emisión, los formatos válidos, los elementos obligatorios que debe contener cada documento, y los mecanismos de control y trazabilidad que deben implementarse para garantizar la integridad y autenticidad de cada documento emitido.
              </p>
            </section>

            {/* Section 2 */}
            <section id="contexto-historico">
              <h2 className="text-2xl font-bold text-white mb-4">
                Contexto histórico y evolución normativa
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                Para comprender la importancia de la Providencia 102, es necesario entender el contexto en el que surge. Venezuela ha transitado por varias etapas en materia de facturación fiscal. Durante décadas, el sistema se basó en imprentas físicas que producían talonarios de facturas en papel con números de control asignados por el SENIAT. Este modelo, aunque funcional en su momento, presentaba limitaciones significativas en términos de control, seguridad y eficiencia.
              </p>
              <p className="text-slate-300 leading-relaxed mb-4">
                Con el avance de la tecnología y la necesidad de modernizar los sistemas de control tributario, el SENIAT comenzó a desarrollar un marco regulatorio para la facturación electrónica. Las providencias anteriores sentaron las bases, pero la Providencia 102 representa la consolidación definitiva de este proceso de transformación digital.
              </p>
              <div className="glass-card p-5 border-l-4 border-aida-cyan my-6">
                <p className="text-sm text-aida-cyan font-semibold mb-2">Dato clave</p>
                <p className="text-slate-300 text-sm leading-relaxed">
                  La Providencia 102 trabaja de manera complementaria con la Providencia 121 (homologación de sistemas). Mientras la Providencia 102 define las reglas de la facturación digital, la Providencia 121 establece los requisitos que deben cumplir los sistemas informáticos utilizados para generar esos documentos fiscales. Ambas providencias forman un marco regulatorio integral.
                </p>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Esta evolución normativa responde también a una tendencia global. Países como México, Chile, Brasil y Colombia ya implementaron sistemas de facturación electrónica hace años. Venezuela, con la Providencia 102, se incorpora a este grupo de naciones que utilizan la tecnología como herramienta para mejorar el control fiscal y reducir la evasión tributaria.
              </p>
            </section>

            {/* Section 3 */}
            <section id="requisitos-principales">
              <h2 className="text-2xl font-bold text-white mb-4">
                Requisitos principales de la Providencia 102
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                La Providencia 102 establece una serie de requisitos que deben cumplirse para la emisión válida de documentos fiscales digitales. Estos requisitos abarcan tanto aspectos formales del documento como aspectos técnicos del sistema que los genera.
              </p>
              <div className="space-y-4 mb-6">
                <div className="glass-card p-5">
                  <h3 className="text-lg font-semibold text-white mb-2">1. Elementos obligatorios del documento fiscal</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Cada documento fiscal digital debe contener: la denominación del documento (factura, nota de crédito, nota de débito), la numeración consecutiva y única, el número de control asignado por la imprenta digital autorizada, los datos completos del emisor (razón social, RIF, dirección fiscal), los datos del receptor cuando sea obligatorio, la fecha de emisión, la descripción detallada de los bienes o servicios, los montos con desglose del IVA, y los datos de la imprenta digital autorizada que emitió el documento.
                  </p>
                </div>
                <div className="glass-card p-5">
                  <h3 className="text-lg font-semibold text-white mb-2">2. Formato y presentación</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Los documentos fiscales digitales deben generarse en formatos que garanticen su integridad y no alteración posterior. La providencia establece especificaciones sobre el formato de presentación, que debe incluir elementos de seguridad como códigos QR o mecanismos de verificación que permitan al receptor y al SENIAT validar la autenticidad del documento.
                  </p>
                </div>
                <div className="glass-card p-5">
                  <h3 className="text-lg font-semibold text-white mb-2">3. Numeración y control</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    La Providencia 102 mantiene el sistema de números de control como mecanismo fundamental de trazabilidad fiscal. Cada documento debe llevar un número de control único asignado por una imprenta digital autorizada por el SENIAT. Los números de control deben ser secuenciales, sin saltos ni duplicados, y la imprenta autorizada es responsable de su correcta asignación y reporte.
                  </p>
                </div>
                <div className="glass-card p-5">
                  <h3 className="text-lg font-semibold text-white mb-2">4. Conservación y disponibilidad</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Los documentos fiscales digitales y todos sus metadatos asociados deben conservarse durante un período mínimo de 10 años, garantizando su integridad, legibilidad y disponibilidad para fines de auditoría o fiscalización. Los sistemas deben implementar mecanismos de respaldo que protejan la información ante pérdidas accidentales o desastres.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="tipos-documentos">
              <h2 className="text-2xl font-bold text-white mb-4">
                Tipos de documentos fiscales digitales
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                La Providencia 102 regula la emisión digital de varios tipos de documentos fiscales, cada uno con sus propias características y requisitos específicos:
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="glass-card p-5 border-t-2 border-aida-accent">
                  <h3 className="text-lg font-semibold text-white mb-2">Facturas</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    El documento fiscal principal que respalda las operaciones de venta de bienes y prestación de servicios. Debe contener todos los elementos obligatorios y es el documento que genera el débito fiscal de IVA para el emisor y el crédito fiscal para el receptor.
                  </p>
                </div>
                <div className="glass-card p-5 border-t-2 border-aida-cyan">
                  <h3 className="text-lg font-semibold text-white mb-2">Notas de crédito</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Documentos que modifican facturas previamente emitidas, reduciendo el monto de la operación original. Se utilizan para anulaciones parciales, descuentos posteriores, devoluciones de mercancía o correcciones de errores en montos facturados.
                  </p>
                </div>
                <div className="glass-card p-5 border-t-2 border-violet-500">
                  <h3 className="text-lg font-semibold text-white mb-2">Notas de débito</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Documentos que incrementan el monto de una factura previamente emitida. Se utilizan para cobros adicionales, intereses moratorios, ajustes de precio o cargos complementarios que no fueron incluidos en la factura original.
                  </p>
                </div>
                <div className="glass-card p-5 border-t-2 border-green-500">
                  <h3 className="text-lg font-semibold text-white mb-2">Guías de despacho</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Documentos que amparan el traslado de bienes muebles y que deben emitirse cuando la mercancía se despacha antes de la emisión de la factura. Deben contener los datos de origen, destino, descripción de la mercancía y referencia a la operación comercial correspondiente.
                  </p>
                </div>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Todos estos documentos fiscales, cuando se emiten en formato digital bajo la Providencia 102, tienen la misma validez legal que sus versiones en papel, siempre que cumplan con todos los requisitos establecidos y sean emitidos a través de una imprenta digital autorizada por el SENIAT.
              </p>
            </section>

            {/* Section 5 */}
            <section id="plazos-cumplimiento">
              <h2 className="text-2xl font-bold text-white mb-4">
                Plazos y cronograma de cumplimiento
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                La Providencia 102 establece un cronograma progresivo para la adopción de la facturación digital. El SENIAT ha definido plazos diferenciados según el tipo y tamaño del contribuyente, reconociendo que la transición requiere preparación tanto tecnológica como operativa.
              </p>
              <div className="glass-card p-5 border-l-4 border-amber-500 my-6">
                <p className="text-sm text-amber-400 font-semibold mb-2">Advertencia importante</p>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Los plazos establecidos por el SENIAT son de obligatorio cumplimiento. Las empresas que no se adapten dentro del cronograma establecido se exponen a sanciones que incluyen multas, clausura temporal del establecimiento y desconocimiento de los documentos fiscales emitidos fuera del marco legal. No esperes al último momento para iniciar tu proceso de migración.
                </p>
              </div>
              <p className="text-slate-300 leading-relaxed mb-4">
                Los contribuyentes especiales suelen ser los primeros obligados, seguidos por los contribuyentes ordinarios con mayores volúmenes de facturación. Eventualmente, la obligación se extiende a la totalidad de los contribuyentes del IVA. Es fundamental que cada empresa consulte la normativa vigente o se asesore con su imprenta digital autorizada para conocer su fecha límite específica.
              </p>
              <p className="text-slate-300 leading-relaxed">
                La recomendación general es no esperar a que se acerque el plazo límite. La migración a facturación digital requiere tiempo para seleccionar una imprenta digital autorizada, integrar los sistemas, capacitar al personal y realizar pruebas antes de operar en producción. Las empresas que inician el proceso con anticipación tienen más posibilidades de cumplir sin contratiempos.
              </p>
            </section>

            {/* Section 6 */}
            <section id="contribuyentes-obligados">
              <h2 className="text-2xl font-bold text-white mb-4">
                ¿Quiénes están obligados a cumplir?
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                La Providencia 102 aplica a todos los contribuyentes que están obligados a emitir documentos fiscales en Venezuela. Esto incluye:
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-aida-accent mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-slate-300 text-sm leading-relaxed"><strong className="text-white">Contribuyentes especiales:</strong> empresas designadas formalmente por el SENIAT como contribuyentes especiales, que generalmente incluye a las empresas con mayores volúmenes de operaciones y recaudación tributaria.</p>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-aida-accent mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-slate-300 text-sm leading-relaxed"><strong className="text-white">Contribuyentes ordinarios del IVA:</strong> todas las personas naturales y jurídicas que realizan actividades gravadas con IVA y están obligadas a emitir facturas y otros documentos fiscales.</p>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-aida-accent mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-slate-300 text-sm leading-relaxed"><strong className="text-white">Empresas de todos los sectores:</strong> sin importar si pertenecen al sector comercial, industrial, de servicios, tecnológico, farmacéutico, alimentos, construcción o cualquier otro sector económico.</p>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-aida-accent mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-slate-300 text-sm leading-relaxed"><strong className="text-white">Empresas con sistemas propios:</strong> aquellas que utilizan sistemas de gestión empresarial (ERP) para facturar deben asegurarse de que su ERP esté integrado con una imprenta digital autorizada que cumpla con la Providencia 102.</p>
                </div>
              </div>
              <p className="text-slate-300 leading-relaxed">
                En la práctica, la Providencia 102 afecta a toda empresa que emita documentos fiscales en Venezuela. No existen excepciones basadas en el tamaño de la empresa o el volumen de facturación: la única diferencia está en los plazos de cumplimiento, que se escalonan según la clasificación del contribuyente.
              </p>
            </section>

            {/* Section 7 */}
            <section id="aida-solucion">
              <h2 className="text-2xl font-bold text-white mb-4">
                Cómo AIDA facilita el cumplimiento de la Providencia 102
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                AIDA es una imprenta digital autorizada por el SENIAT que fue diseñada específicamente para simplificar el cumplimiento de la Providencia 102. Con integración directa a más de 100 ERPs y un sistema impulsado por inteligencia artificial, AIDA elimina la complejidad del proceso de facturación digital.
              </p>
              <div className="space-y-4 mb-6">
                <div className="glass-card p-5 border-l-4 border-aida-accent">
                  <h3 className="text-lg font-semibold text-white mb-2">Integración con tu ERP</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    AIDA se conecta directamente con tu ERP existente, sin necesidad de cambiar tus procesos operativos. La facturación digital se integra de forma transparente en tu flujo de trabajo actual. Con compatibilidad con más de 100 ERPs, no importa qué sistema de gestión utilice tu empresa: AIDA se adapta a tu tecnología, no al revés.
                  </p>
                </div>
                <div className="glass-card p-5 border-l-4 border-aida-accent">
                  <h3 className="text-lg font-semibold text-white mb-2">Validación automática con IA</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Antes de emitir cada documento fiscal, la inteligencia artificial de AIDA valida automáticamente que todos los requisitos de la Providencia 102 se cumplan: datos completos del emisor y receptor, cálculos correctos del IVA, formato del número de control, y coherencia con documentos previos. Si detecta algún error, bloquea la emisión y te notifica para que lo corrijas antes de que se convierta en un problema fiscal.
                  </p>
                </div>
                <div className="glass-card p-5 border-l-4 border-aida-accent">
                  <h3 className="text-lg font-semibold text-white mb-2">Números de control gestionados automáticamente</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    AIDA gestiona la solicitud, asignación y reporte de números de control ante el SENIAT de forma completamente automática. Cuando un rango se acerca a agotarse, el sistema solicita proactivamente nuevos rangos, asegurando que tu operación nunca se detenga por falta de números de control disponibles.
                  </p>
                </div>
                <div className="glass-card p-5 border-l-4 border-aida-accent">
                  <h3 className="text-lg font-semibold text-white mb-2">Almacenamiento legal por 10 años</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Todos los documentos fiscales emitidos a través de AIDA se almacenan de forma segura con cifrado avanzado, respaldos automáticos y una política de retención de 10 años que cumple con las exigencias de la Providencia 102. Tus documentos están siempre disponibles para consulta o auditoría.
                  </p>
                </div>
              </div>
            </section>

            {/* Conclusion */}
            <section id="conclusion">
              <h2 className="text-2xl font-bold text-white mb-4">Conclusión</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                La Providencia 102 no es una recomendación: es una obligación legal que transforma la manera en que las empresas venezolanas emiten documentos fiscales. La facturación digital llegó para quedarse, y los plazos de cumplimiento ya están en marcha. Las empresas que no se adapten se enfrentan a sanciones económicas, clausuras temporales y problemas operativos que pueden afectar seriamente su negocio.
              </p>
              <p className="text-slate-300 leading-relaxed">
                La buena noticia es que cumplir no tiene que ser complicado. Con una imprenta digital autorizada como AIDA, que se integra con tu ERP y automatiza todo el proceso mediante inteligencia artificial, tu empresa puede cumplir con la Providencia 102 sin esfuerzo y sin disrupciones en tu operación diaria. No esperes a que se venzan los plazos: comienza tu proceso de migración hoy.
              </p>
            </section>
          </div>

          {/* CTA */}
          <div className="mt-16 glass-card p-8 text-center glow-blue">
            <h3 className="text-2xl font-bold text-white mb-3">
              ¿Necesitas cumplir con la Providencia 102?
            </h3>
            <p className="text-slate-400 mb-6 max-w-xl mx-auto">
              AIDA es tu imprenta digital autorizada por el SENIAT. Integra tu ERP en minutos y
              cumple con la facturación digital sin complicaciones.
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

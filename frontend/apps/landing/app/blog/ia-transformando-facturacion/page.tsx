import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cómo la IA está transformando la facturación empresarial",
  description:
    "Descubre cómo la inteligencia artificial aplicada a la facturación detecta anomalías, clasifica gastos automáticamente, predice patrones y asiste en tiempo real. Conoce cómo la IA de AIDA protege tu empresa.",
  keywords: [
    "inteligencia artificial facturación",
    "IA facturación empresarial",
    "detección anomalías facturas",
    "automatización facturación IA",
    "AIDA inteligencia artificial",
    "IA normativa fiscal Venezuela",
    "facturación inteligente Venezuela",
    "machine learning facturación",
  ],
  openGraph: {
    title: "Cómo la IA está transformando la facturación empresarial",
    description:
      "IA aplicada a facturación: detección de anomalías, clasificación automática, predicción de patrones y asistencia en tiempo real con AIDA.",
    type: "article",
    locale: "es_VE",
    url: "https://aida.com.ve/blog/ia-transformando-facturacion",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  alternates: {
    canonical: "https://aida.com.ve/blog/ia-transformando-facturacion",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Cómo la IA está transformando la facturación empresarial",
  description:
    "Inteligencia artificial aplicada a la facturación: detección de anomalías, clasificación automática y asistencia en tiempo real.",
  author: { "@type": "Organization", name: "AIDA Imprenta Digital" },
  publisher: {
    "@type": "Organization",
    name: "AIDA Imprenta Digital C.A.",
    logo: { "@type": "ImageObject", url: "https://aida.com.ve/favicon.ico" },
  },
  datePublished: "2024-12-03",
  dateModified: "2024-12-03",
  mainEntityOfPage: "https://aida.com.ve/blog/ia-transformando-facturacion",
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
    title: "Integración ERP + Imprenta Digital: La combinación perfecta",
    slug: "/blog/integracion-erp-imprenta-digital",
    category: "Integraciones",
    categoryColor: "from-emerald-500 to-green-400",
  },
  {
    title: "5 errores comunes al emitir documentos fiscales y cómo evitarlos",
    slug: "/blog/errores-comunes-documentos-fiscales",
    category: "Tips",
    categoryColor: "from-rose-500 to-pink-400",
  },
];

const tableOfContents = [
  { id: "ia-facturacion", label: "IA aplicada a la facturación" },
  { id: "deteccion-anomalias", label: "Detección de anomalías" },
  { id: "clasificacion-automatica", label: "Clasificación automática" },
  { id: "prediccion-patrones", label: "Predicción de patrones" },
  { id: "asistencia-tiempo-real", label: "Asistencia en tiempo real" },
  { id: "aida-ia", label: "Cómo funciona la IA de AIDA" },
  { id: "comparacion", label: "IA vs. métodos tradicionales" },
  { id: "futuro", label: "El futuro de la facturación inteligente" },
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
        <div className="orb orb-blue w-96 h-96 -top-20 -left-40" />
        <div className="orb orb-cyan w-72 h-72 top-1/4 right-0" />
        <div className="orb orb-purple w-64 h-64 bottom-1/3 -left-20" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
            <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <span>/</span>
            <span className="text-slate-300">IA transformando facturación</span>
          </nav>

          {/* Article header */}
          <header className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-400 bg-clip-text text-transparent border border-white/10">
                Tecnología
              </span>
              <span className="text-sm text-slate-500">3 Dic 2024</span>
              <span className="text-sm text-slate-500">7 min de lectura</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
              Cómo la IA está transformando la{" "}
              <span className="gradient-text">facturación empresarial</span>
            </h1>
            <p className="mt-6 text-lg text-slate-400 leading-relaxed">
              La inteligencia artificial ha dejado de ser una promesa futurista para convertirse en una
              herramienta concreta que protege a las empresas de errores fiscales, automatiza procesos
              repetitivos y anticipa problemas antes de que ocurran. Así es como funciona en la facturación.
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
            <section id="ia-facturacion">
              <h2 className="text-2xl font-bold text-white mb-4">
                IA aplicada a la facturación
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                La inteligencia artificial aplicada a la facturación no se trata de reemplazar a los contadores o administradores, sino de potenciar su capacidad para tomar decisiones correctas. En el contexto de la facturación fiscal venezolana, donde cada documento debe cumplir con decenas de requisitos legales y cada error puede derivar en multas del SENIAT, la IA actúa como una capa de protección inteligente que valida, corrige y sugiere en tiempo real.
              </p>
              <p className="text-slate-300 leading-relaxed mb-4">
                A diferencia de los sistemas de validación tradicionales basados en reglas fijas (if/else), la IA puede aprender de patrones históricos, entender el contexto de cada operación y detectar anomalías que las reglas estáticas no capturarían. Por ejemplo, un sistema basado en reglas puede verificar que el IVA sea del 16%, pero una IA puede detectar que un contribuyente que siempre factura productos exentos está, inusualmente, aplicando IVA a una operación, lo que podría indicar un error de clasificación.
              </p>
              <p className="text-slate-300 leading-relaxed">
                La aplicación de IA en la facturación se manifiesta en cuatro áreas principales: detección de anomalías, clasificación automática, predicción de patrones y asistencia en tiempo real. Cada una aporta un nivel diferente de valor y protección.
              </p>
            </section>

            {/* Section 2 */}
            <section id="deteccion-anomalias">
              <h2 className="text-2xl font-bold text-white mb-4">
                Detección de anomalías
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                La detección de anomalías es quizás la aplicación más valiosa de la IA en facturación fiscal. El sistema analiza cada documento antes de su emisión y lo compara con los patrones históricos del contribuyente para identificar desviaciones que podrían indicar errores o irregularidades.
              </p>
              <div className="space-y-4 mb-6">
                <div className="glass-card p-5 border-l-4 border-amber-500">
                  <h3 className="text-lg font-semibold text-white mb-2">Anomalías de monto</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Si una empresa habitualmente emite facturas con montos entre 500 y 5.000 USD y de repente aparece una factura por 500.000 USD, la IA la marca como anomalía. No la bloquea necesariamente, porque puede ser legítima, pero la resalta para que un humano la revise antes de emitirla. Esto ha prevenido errores de digitación donde un cero adicional habría generado un documento fiscal con montos incorrectos y la consecuente obligación tributaria errónea.
                  </p>
                </div>
                <div className="glass-card p-5 border-l-4 border-amber-500">
                  <h3 className="text-lg font-semibold text-white mb-2">Anomalías de frecuencia</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    La IA detecta patrones inusuales en la frecuencia de emisión. Si un contribuyente normalmente emite 20 facturas al día y de repente emite 200 en una hora, el sistema genera una alerta. Esto puede indicar un proceso de carga masiva mal configurado, un acceso no autorizado al sistema o un error en la integración con el ERP.
                  </p>
                </div>
                <div className="glass-card p-5 border-l-4 border-amber-500">
                  <h3 className="text-lg font-semibold text-white mb-2">Anomalías de destinatario</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Si se emiten múltiples notas de crédito a un mismo cliente en un período corto, la IA lo identifica como un patrón inusual. Esto puede ser legítimo (devoluciones masivas) o indicar un intento de manipulación fiscal. En cualquier caso, la alerta permite una revisión oportuna antes de que las notas se consoliden en la declaración de IVA.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section id="clasificacion-automatica">
              <h2 className="text-2xl font-bold text-white mb-4">
                Clasificación automática
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                En Venezuela, la correcta clasificación de bienes y servicios es crucial para aplicar la alícuota de IVA adecuada. Los bienes y servicios pueden estar gravados al 16% (alícuota general), al 8% (alícuota reducida) o estar exentos. La clasificación incorrecta genera dos problemas: si se aplica una alícuota mayor, el cliente paga de más y puede reclamar; si se aplica una menor o se exenta algo gravado, la empresa enfrenta una contingencia fiscal ante el SENIAT.
              </p>
              <p className="text-slate-300 leading-relaxed mb-4">
                La IA de AIDA analiza la descripción del bien o servicio ingresado y sugiere automáticamente la alícuota correcta. El modelo ha sido entrenado con miles de productos y servicios clasificados según la normativa fiscal venezolana, incluyendo los listados de bienes exentos establecidos en la Ley de IVA y los decretos de exoneración vigentes.
              </p>
              <div className="glass-card p-5 border-l-4 border-aida-cyan my-6">
                <p className="text-sm text-aida-cyan font-semibold mb-2">Ejemplo práctico</p>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Si un usuario ingresa &quot;arroz blanco tipo 1 kg&quot; como descripción de producto, la IA reconoce que se trata de un alimento de la cesta básica exento de IVA según la Ley de IVA, y automáticamente sugiere la alícuota 0% (exento). Si el usuario intenta cambiarla manualmente al 16%, el sistema genera una advertencia explicando que ese producto está legalmente exento y que aplicar IVA podría generar un cobro indebido al cliente y una irregularidad ante el SENIAT.
                </p>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Esta capacidad de clasificación se extiende también a la determinación de cuándo aplica el IGTF (Impuesto a las Grandes Transacciones Financieras) del 3%, que se aplica a pagos en divisas y criptomonedas. La IA verifica la forma de pago y aplica automáticamente el IGTF cuando corresponde, evitando omisiones que generarían una deuda tributaria para el contribuyente.
              </p>
            </section>

            {/* Section 4 */}
            <section id="prediccion-patrones">
              <h2 className="text-2xl font-bold text-white mb-4">
                Predicción de patrones
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                La predicción de patrones permite anticipar necesidades y problemas antes de que ocurran. La IA analiza los datos históricos de facturación del contribuyente para generar proyecciones útiles:
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="glass-card p-5">
                  <h3 className="text-base font-semibold text-white mb-2">Consumo de números de control</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Basándose en el ritmo de emisión de las últimas semanas, la IA calcula cuándo se agotará el rango actual de números de control y sugiere solicitar un nuevo rango con la antelación adecuada. Esta predicción considera estacionalidades (fin de mes, cierre trimestral) y eventos atípicos.
                  </p>
                </div>
                <div className="glass-card p-5">
                  <h3 className="text-base font-semibold text-white mb-2">Proyección de IVA</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    La IA puede proyectar el monto de IVA a declarar en el período fiscal actual, basándose en los documentos emitidos hasta la fecha y los patrones de emisión esperados. Esto permite al contribuyente planificar su flujo de caja y anticipar el monto a pagar al SENIAT.
                  </p>
                </div>
                <div className="glass-card p-5">
                  <h3 className="text-base font-semibold text-white mb-2">Detección de tendencias</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    El sistema identifica tendencias en los datos de facturación: aumento o disminución de ventas, cambios en la composición de productos (más exentos vs. gravados), variaciones en los clientes más frecuentes. Esta información, aunque no es fiscal en sí, aporta valor gerencial significativo.
                  </p>
                </div>
                <div className="glass-card p-5">
                  <h3 className="text-base font-semibold text-white mb-2">Alertas de cumplimiento</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    La IA anticipa fechas límite de declaraciones, vencimientos de certificados de retención pendientes de entrega, y cualquier otra obligación fiscal cuyo incumplimiento podría generar sanciones. Las alertas se envían con suficiente antelación para actuar.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section id="asistencia-tiempo-real">
              <h2 className="text-2xl font-bold text-white mb-4">
                Asistencia en tiempo real
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                Quizás la funcionalidad más visible de la IA para los usuarios finales es la asistencia en tiempo real. Mientras el usuario está completando un documento fiscal, la IA analiza cada campo ingresado y proporciona retroalimentación inmediata:
              </p>
              <p className="text-slate-300 leading-relaxed mb-4">
                <strong className="text-white">Validación de RIF:</strong> al ingresar el RIF del receptor, la IA verifica su formato, consulta datos conocidos y puede autocompletar campos como la razón social y dirección fiscal si el cliente ya ha sido facturado previamente. Si detecta un RIF con formato inválido, lo señala inmediatamente con una explicación del formato correcto.
              </p>
              <p className="text-slate-300 leading-relaxed mb-4">
                <strong className="text-white">Cálculos automáticos:</strong> la IA calcula en tiempo real los subtotales, la base imponible por alícuota, el monto del IVA, el IGTF si aplica, y el total. Si el usuario modifica un campo, todos los cálculos dependientes se actualizan instantáneamente. Si detecta una inconsistencia aritmética (por ejemplo, un total que no cuadra con los subtotales), lo señala antes de que el documento se emita.
              </p>
              <p className="text-slate-300 leading-relaxed mb-4">
                <strong className="text-white">Sugerencias contextuales:</strong> cuando el usuario emite una nota de crédito, la IA sugiere las facturas que podrían ser referenciadas, basándose en el cliente seleccionado y las facturas pendientes. Verifica automáticamente que el monto de la nota no exceda el monto de la factura original y alerta si existe alguna restricción.
              </p>
              <p className="text-slate-300 leading-relaxed">
                <strong className="text-white">Chat de asistencia fiscal:</strong> AIDA incluye un chat integrado donde los usuarios pueden hacer preguntas sobre normativa fiscal venezolana. La IA, entrenada específicamente en legislación tributaria, responde consultas como &quot;¿Qué alícuota aplica a servicios de consultoría?&quot; o &quot;¿Cuándo debo emitir una nota de débito en lugar de una nueva factura?&quot; con respuestas fundamentadas en la normativa vigente.
              </p>
            </section>

            {/* Section 6 */}
            <section id="aida-ia">
              <h2 className="text-2xl font-bold text-white mb-4">
                Cómo funciona la IA de AIDA
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                La IA de AIDA no es una solución genérica de inteligencia artificial adaptada superficialmente a la facturación. Es un sistema diseñado y entrenado desde cero para comprender la normativa fiscal venezolana en toda su complejidad.
              </p>
              <div className="glass-card p-6 mb-6">
                <h3 className="text-lg font-semibold text-aida-cyan mb-4">Arquitectura del motor de IA</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-aida-accent/20 flex items-center justify-center shrink-0 mt-1">
                      <span className="text-aida-accent font-bold text-xs">1</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Capa de conocimiento fiscal</p>
                      <p className="text-sm text-slate-300">Entrenada con el Código Orgánico Tributario, la Ley de IVA, la Ley de IGTF, la Providencia SNAT/2024/000121, resoluciones del SENIAT, consultas vinculantes y jurisprudencia tributaria. Esta capa comprende los conceptos legales y puede razonar sobre su aplicación a casos concretos.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-aida-accent/20 flex items-center justify-center shrink-0 mt-1">
                      <span className="text-aida-accent font-bold text-xs">2</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Capa de validación</p>
                      <p className="text-sm text-slate-300">Implementa las reglas de validación de documentos fiscales como verificaciones automáticas que se ejecutan antes de cada emisión. Incluye más de 50 validaciones diferentes que cubren todos los requisitos legales de cada tipo de documento.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-aida-accent/20 flex items-center justify-center shrink-0 mt-1">
                      <span className="text-aida-accent font-bold text-xs">3</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Capa de aprendizaje</p>
                      <p className="text-sm text-slate-300">Analiza los patrones de facturación de cada contribuyente para personalizar las validaciones, sugerencias y alertas. Cuanto más se usa AIDA, más precisa se vuelve la IA para cada empresa específica, adaptándose a su industria, tipos de productos y clientes habituales.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-aida-accent/20 flex items-center justify-center shrink-0 mt-1">
                      <span className="text-aida-accent font-bold text-xs">4</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Capa de asistencia</p>
                      <p className="text-sm text-slate-300">Proporciona la interfaz conversacional que permite a los usuarios interactuar con la IA en lenguaje natural, hacer preguntas, recibir explicaciones y obtener recomendaciones contextuales durante el proceso de facturación.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 7 */}
            <section id="comparacion">
              <h2 className="text-2xl font-bold text-white mb-4">
                IA vs. métodos tradicionales
              </h2>
              <p className="text-slate-300 leading-relaxed mb-6">
                La diferencia entre un sistema de facturación con IA y uno tradicional no es solo de eficiencia: es de nivel de protección.
              </p>
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Aspecto</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Método tradicional</th>
                      <th className="text-left py-3 px-4 text-aida-cyan font-medium">Con IA (AIDA)</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    <tr className="border-b border-white/5">
                      <td className="py-3 px-4 font-medium text-white">Validación</td>
                      <td className="py-3 px-4">Campos obligatorios básicos</td>
                      <td className="py-3 px-4">50+ validaciones con contexto legal</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3 px-4 font-medium text-white">Detección de errores</td>
                      <td className="py-3 px-4">Post-emisión (en auditoría)</td>
                      <td className="py-3 px-4">Pre-emisión (tiempo real)</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3 px-4 font-medium text-white">Clasificación IVA</td>
                      <td className="py-3 px-4">Manual por el usuario</td>
                      <td className="py-3 px-4">Sugerida automáticamente por IA</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3 px-4 font-medium text-white">Números de control</td>
                      <td className="py-3 px-4">Seguimiento manual</td>
                      <td className="py-3 px-4">Gestión y predicción automática</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3 px-4 font-medium text-white">Anomalías</td>
                      <td className="py-3 px-4">No se detectan</td>
                      <td className="py-3 px-4">Detectadas antes de emitir</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3 px-4 font-medium text-white">Asistencia fiscal</td>
                      <td className="py-3 px-4">Requiere consultor externo</td>
                      <td className="py-3 px-4">Chat integrado 24/7</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-white">Aprendizaje</td>
                      <td className="py-3 px-4">Estático, no mejora</td>
                      <td className="py-3 px-4">Se adapta a cada empresa</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-slate-300 leading-relaxed">
                La comparación deja claro que la IA no es un lujo sino una necesidad para cualquier empresa que tome en serio su cumplimiento fiscal. Los métodos tradicionales exponen a la empresa a riesgos que podrían haberse prevenido con la tecnología adecuada, y cada error prevenido es una multa evitada y una operación protegida.
              </p>
            </section>

            {/* Section 8 */}
            <section id="futuro">
              <h2 className="text-2xl font-bold text-white mb-4">
                El futuro de la facturación inteligente
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                La IA aplicada a la facturación está apenas en sus primeras etapas, pero las tendencias son claras. En los próximos años veremos sistemas capaces de generar documentos fiscales completos a partir de una simple instrucción verbal, integración directa con los sistemas del SENIAT para validación en tiempo real, análisis predictivo que anticipe fiscalizaciones basándose en patrones de riesgo, y automatización completa del ciclo contable desde la factura hasta la declaración.
              </p>
              <p className="text-slate-300 leading-relaxed mb-4">
                En Venezuela, donde la normativa fiscal es particularmente detallada y las sanciones por incumplimiento son severas, la IA se convierte en un diferenciador estratégico. Las empresas que adopten tempranamente estas tecnologías no solo se protegen de sanciones, sino que ganan eficiencia operativa, reducen costos de personal administrativo y obtienen visibilidad en tiempo real sobre su situación fiscal.
              </p>
              <p className="text-slate-300 leading-relaxed">
                AIDA está liderando esta transformación en Venezuela, combinando la autorización formal del SENIAT como imprenta digital con una plataforma de IA diseñada específicamente para la realidad fiscal del país. El resultado es un sistema que no solo cumple con la ley, sino que hace que cumplirla sea automático, eficiente y, por primera vez, sencillo.
              </p>
            </section>
          </div>

          {/* CTA */}
          <div className="mt-16 glass-card p-8 text-center glow-blue">
            <h3 className="text-2xl font-bold text-white mb-3">
              Experimenta la facturación con IA
            </h3>
            <p className="text-slate-400 mb-6 max-w-xl mx-auto">
              Descubre cómo la inteligencia artificial de AIDA protege tu empresa de errores fiscales
              y automatiza tu cumplimiento tributario.
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

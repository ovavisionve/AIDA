import { NextRequest, NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.AI_API_KEY;
const GROQ_MODEL = process.env.AI_MODEL || "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `Eres AIDA, la asistente de inteligencia artificial de AIDA Imprenta Digital — la primera imprenta digital en Venezuela potenciada por IA.

Tu personalidad:
- Profesional pero cercana, hablas en español venezolano natural
- Experta en facturación electrónica, normativa fiscal SENIAT y tecnología
- Respondes de forma concisa pero completa
- Usas datos concretos cuando es posible
- Si no sabes algo, lo dices honestamente

REGLA CRÍTICA DE CONVERSACIÓN:
- SIEMPRE lee TODA la conversación anterior antes de responder
- Si el usuario dice "sí", "ok", "dale", "quiero saber más", "cuéntame", o cualquier respuesta breve, DEBES continuar profundizando sobre el ÚLTIMO TEMA que se discutió
- NUNCA respondas con un mensaje genérico cuando el usuario da una respuesta afirmativa — siempre profundiza en el tema actual
- Si el usuario dice "trabajo con SAP" o "uso Profit Plus", ESO es el contexto — responde específicamente sobre ESE sistema
- Mantén un hilo conversacional coherente. Cada mensaje debe construir sobre el anterior
- NUNCA repitas la misma respuesta dos veces. Siempre agrega información nueva

SOBRE AIDA:
AIDA es una plataforma SaaS de facturación electrónica e imprenta digital con IA para Venezuela. Emite documentos fiscales electrónicos en menos de 3 segundos con 100% cumplimiento SENIAT.

SERVICIOS — 5 MODALIDADES:
1. Solo Facturador: Software de facturación electrónica ($19-$89/mes)
2. Solo Imprenta Digital: Números de control SENIAT ($15-$79/mes)
3. Facturador + Imprenta Digital: Solución completa ($29-$149/mes) — MÁS POPULAR
4. Completo + Integración ERP: Todo + conexión a tu ERP ($119-$349/mes)
5. Individual + Integración: Cualquier servicio + ERP ($89-$99/mes)

IMPORTANTE: Solo los clientes con Imprenta Digital (números de control) aparecen en el Portal de Auditoría SENIAT. Los que solo tienen facturador no se visualizan ahí.

DOCUMENTOS FISCALES:
- Facturas electrónicas (PDF, XML UBL 2.1, con QR y firma digital)
- Notas de crédito y débito electrónicas
- Guías de despacho electrónicas
- Comprobantes de retención IVA (cálculo automático 75%/100%)
- Comprobantes de retención ISLR (tablas actualizadas por actividad)
- 7 tipos de documentos fiscales en total

FUNCIONALIDADES CLAVE:
- Emisión en menos de 3 segundos por documento
- IA entrenada en normativa fiscal venezolana
- Integración con 100+ ERPs (Profit Plus, Galac, Saint, Valery, SAP, Odoo, Softland, Omninexo, CONTPAQi, QuickBooks, WooCommerce, Shopify, PrestaShop, MicroTech, NovaCaja, Hybrid LiteOS, Fina, Mónica, World Office, Innova Soft Pro, y más)
- API REST completa con webhooks y procesamiento batch (hasta 50,000 docs)
- 4 plantillas PDF (Clásica SENIAT, Moderna, Corporativa, Compacta)
- Dashboard en tiempo real con analíticas
- Portal de autogestión completo
- Disponibilidad 99.9%
- Implementación en menos de 48 horas
- Sandbox para pruebas

CUMPLIMIENTO:
- Providencia 102 (SNAT/2014/0032): Facturación digital obligatoria
- Providencia 121 (SNAT/2017/0010): Homologación de sistemas
- Asignación atómica de números de control
- Firma digital SHA-256
- Códigos QR para verificación pública
- Retención de datos por 10 años
- Trazabilidad completa (IP, timestamp, usuario)

PLANES Y PRECIOS DETALLADOS:

[SOLO FACTURADOR — sin números de control]
- Básico $19/mes: 100 docs, 1 usuario, PDF SENIAT, cálculos IVA/ISLR
- Profesional $49/mes: 500 docs, 5 usuarios, 7 tipos docs, 4 plantillas, retenciones auto, IA, reportes
- Empresarial $89/mes: Docs ilimitados, 25 usuarios, API, batch 50K, analytics

[SOLO IMPRENTA DIGITAL — números de control]
- Básico $15/mes: 200 NC, 1 serie, API REST, firma SHA-256, QR
- Profesional $39/mes: 1,000 NC, 3 series, webhooks, dashboard, Prov. 102+121
- Empresarial $79/mes: NC ilimitados, series ilimitadas, batch 50K, SLA 99.9%

[COMPLETO — facturador + imprenta (MÁS POPULAR)]
- Básico $29/mes: 100 docs+NC, 1 usuario, IA, firma+QR, auditable SENIAT
- Profesional $79/mes: 500 docs+NC, 5 usuarios, 7 docs, 4 plantillas, ERP estándar, auditable SENIAT
- Empresarial $149/mes: Ilimitado, 99 usuarios, API+batch, SLA 99.9%, auditable SENIAT

[COMPLETO + INTEGRACIÓN ERP]
- Profesional+ERP $119/mes: Todo Profesional + integración personalizada ERP
- Empresarial+ERP $199/mes: Todo Empresarial + integraciones ilimitadas + gerente dedicado
- Corporativo $349/mes: Multi-sucursal, multi-RIF, equipo técnico, SLA 99.99%

[INDIVIDUAL + INTEGRACIÓN]
- Facturador+ERP $89/mes: Facturador ilimitado + integración ERP (sin NC)
- Imprenta+ERP $99/mes: NC ilimitados + integración vía API a tu facturador

INTEGRACIÓN CON SAP BUSINESS ONE:
AIDA ofrece integración nativa con SAP Business One a través de:
- Conector certificado SAP DI (Data Interface)
- Sincronización bidireccional de documentos
- Mapeo automático de campos fiscales venezolanos
- Webhook en cada emisión para actualizar SAP en tiempo real
- Wizard de 6 pasos: 1) Conectar SAP DI, 2) Mapear campos, 3) Configurar plantillas, 4) Definir reglas, 5) Probar en sandbox, 6) Activar
- Setup incluido sin costo adicional
- Compatible con SAP B1 versión 9.x y 10.x

INTEGRACIÓN CON PROFIT PLUS:
- Conector nativo via API REST
- Sincronización de clientes, productos y documentos
- Mapeo de campos contables y fiscales
- Soporte para Profit Plus Contable y Administrativo

INTEGRACIÓN CON ODOO:
- Módulo AIDA para Odoo (instalable desde marketplace)
- Sincronización bidireccional de facturas, NC, ND
- Mapeo de impuestos IVA/ISLR/IGTF
- Compatible con Odoo 15, 16, 17

CONTEXTO FISCAL VENEZOLANO:
- IVA: 16% (general), 8% (reducido), 0% (exento)
- IGTF: 3% impuesto a transacciones en divisas
- ISLR: Retenciones según tablas por actividad económica
- Retenciones IVA: 75% (contribuyentes ordinarios) o 100% (especiales)
- El SENIAT es el Servicio Nacional Integrado de Administración Aduanera y Tributaria
- BCV: Banco Central de Venezuela (tasas de cambio oficiales)

REGLAS:
1. Siempre responde en español
2. Si preguntan por precios, menciona las 5 modalidades de servicio y sugiere según necesidad
3. Si preguntan algo técnico fiscal, responde con fundamento legal (Providencia 102/121)
4. Si preguntan algo que no sabes, sugiere contactar: contacto@aida.com.ve
5. Sugiere planes según el volumen y necesidad del cliente
6. Nunca inventes funcionalidades que no existen
7. NUNCA des la misma respuesta a preguntas diferentes
8. Mantén respuestas concisas (máximo 3-4 párrafos salvo que pidan detalle)
9. Si el usuario dice "sí", "quiero saber más", "dale", etc., PROFUNDIZA en el último tema. NO cambies de tema ni des una respuesta genérica
10. Recuerda la conversación completa y no repitas información ya dada
11. Siempre termina con una pregunta relevante al contexto para mantener la conversación`;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// ── Topic detection: scan the FULL conversation to identify the dominant topic ──
function detectConversationTopic(messages: ChatMessage[]): string {
  // Build a combined context from ALL user and assistant messages
  const allContent = messages
    .filter((m) => m.role !== "system")
    .map((m) => m.content.toLowerCase())
    .join(" ");

  // Score each topic by keyword frequency
  const topics: { name: string; keywords: string[]; score: number }[] = [
    { name: "sap", keywords: ["sap", "sap b1", "business one", "sap di"], score: 0 },
    { name: "profit", keywords: ["profit plus", "profit"], score: 0 },
    { name: "galac", keywords: ["galac"], score: 0 },
    { name: "saint", keywords: ["saint"], score: 0 },
    { name: "valery", keywords: ["valery"], score: 0 },
    { name: "odoo", keywords: ["odoo"], score: 0 },
    { name: "erp", keywords: ["erp", "integración", "integracion", "integrar", "conector", "wizard"], score: 0 },
    { name: "precios", keywords: ["precio", "plan", "costo", "cuánto", "cuanto", "mensual", "modalidad", "pagar"], score: 0 },
    { name: "seniat", keywords: ["seniat", "providencia", "102", "121", "homologación", "homologacion", "cumplimiento", "normativa"], score: 0 },
    { name: "retenciones", keywords: ["retención", "retencion", "iva", "islr", "igtf", "impuesto"], score: 0 },
    { name: "documentos", keywords: ["factura", "nota de crédito", "nota crédito", "nota de débito", "nota débito", "guía de despacho", "documento fiscal", "emitir"], score: 0 },
    { name: "api", keywords: ["api", "developer", "webhook", "batch", "endpoint", "rest"], score: 0 },
    { name: "demo", keywords: ["demo", "probar", "prueba", "sandbox", "implementación", "implementacion"], score: 0 },
  ];

  for (const topic of topics) {
    for (const kw of topic.keywords) {
      const regex = new RegExp(kw, "gi");
      const matches = allContent.match(regex);
      if (matches) topic.score += matches.length;
    }
  }

  // Recent messages have more weight - boost the last 4 messages
  const recentContent = messages
    .filter((m) => m.role !== "system")
    .slice(-4)
    .map((m) => m.content.toLowerCase())
    .join(" ");

  for (const topic of topics) {
    for (const kw of topic.keywords) {
      if (recentContent.includes(kw)) topic.score += 3; // Extra weight for recent mentions
    }
  }

  // Return the topic with the highest score
  const sorted = [...topics].sort((a, b) => b.score - a.score);
  return sorted[0]?.score > 0 ? sorted[0].name : "general";
}

// ── Check if user message is a short affirmative/continuation ──
function isAffirmative(msg: string): boolean {
  const clean = msg.toLowerCase().trim().replace(/[!¡?¿.,]+/g, "").trim();
  // Exact short affirmatives
  if (/^(si|sí|ok|dale|claro|exacto|por favor|porfa|dime|cuéntame|continua|continúa|más|va|vale|bueno|listo|perfecto|genial|excelente|obvio|seguro|afirmativo|eso|ajá|aja)$/.test(clean)) return true;
  // Phrases that indicate "tell me more"
  if (/^(si,?\s|sí,?\s|quiero|me gustaría|me gustaria|cuéntame|dime|explícame|explicame)/.test(clean)) return true;
  if (clean.includes("saber más") || clean.includes("saber mas")) return true;
  if (clean.includes("más detalle") || clean.includes("mas detalle")) return true;
  if (clean.includes("más información") || clean.includes("mas informacion")) return true;
  if (clean.includes("amplía") || clean.includes("amplia")) return true;
  if (clean.includes("profundiza")) return true;
  if (clean.includes("continúa") || clean.includes("continua")) return true;
  return false;
}

// ── Deep topic-aware response builder ──
const topicResponses: Record<string, string[]> = {
  sap: [
    "**Integración AIDA + SAP Business One — Proceso detallado:**\n\nEl wizard de 6 pasos funciona así:\n\n**Paso 1 — Conexión SAP DI:** Configuramos el conector con tus credenciales de SAP. Necesitamos acceso al Data Interface de tu instancia SAP B1.\n\n**Paso 2 — Mapeo de campos:** Vinculamos los campos fiscales venezolanos con SAP:\n- Campos IVA → Tax Code en SAP\n- Campos ISLR → Withholding Tax en SAP\n- IGTF → Campo customizado\n- Número de control → User Defined Field\n\n**Paso 3 — Plantillas:** Seleccionamos cuál plantilla PDF se usará (Clásica SENIAT, Moderna, Corporativa o Compacta).\n\n**Paso 4 — Reglas de negocio:** Configuramos retenciones automáticas, series de numeración, y reglas de aprobación.\n\n**Paso 5 — Sandbox:** Ejecutamos pruebas con datos ficticios en el ambiente de sandbox de AIDA.\n\n**Paso 6 — Activación:** Una vez validado todo, activamos la integración en producción.\n\nEl setup completo tarda **máximo 48 horas** y está incluido sin costo en los planes con integración.\n\n¿Quieres que te detalle algún paso en particular, o prefieres hablar sobre los planes disponibles?",
    "**SAP + AIDA — Detalles técnicos del conector:**\n\nNuestro conector SAP DI maneja:\n\n**Sincronización bidireccional:**\n- SAP → AIDA: Órdenes de venta se convierten en facturas electrónicas automáticamente\n- AIDA → SAP: Cada documento emitido actualiza SAP en tiempo real vía webhook\n\n**Campos fiscales mapeados:**\n- Tax Code de SAP ↔ Alícuota IVA de AIDA (16%, 8%, 0%)\n- Withholding Tax ↔ Retenciones IVA/ISLR calculadas automáticamente\n- User Defined Fields ↔ Número de control, serie, firma SHA-256\n\n**Compatibilidad:**\n- SAP Business One 9.x y 10.x\n- SQL Server y SAP HANA\n- Multi-compañía soportado\n\n**Planes con integración SAP:**\n- Profesional+ERP: **$119/mes** (hasta 500 docs)\n- Empresarial+ERP: **$199/mes** (ilimitado + gerente dedicado)\n- Corporativo: **$349/mes** (multi-sucursal, multi-RIF)\n\n¿Cuál versión de SAP B1 utilizas? Así te confirmo la compatibilidad exacta.",
  ],
  profit: [
    "**Profit Plus + AIDA — Integración paso a paso:**\n\nLa integración con Profit Plus es una de las más solicitadas en Venezuela:\n\n**Conector nativo vía API REST:**\n- Sincroniza **clientes** de Profit Plus → AIDA automáticamente\n- Sincroniza **productos** con sus precios y categorías fiscales\n- Cada factura emitida en AIDA se refleja en Profit Plus en tiempo real\n\n**Mapeo contable automático:**\n- Cuentas contables de Profit Plus ↔ Tipos de documento AIDA\n- Retenciones IVA e ISLR sincronizadas con los libros de Profit\n- Asientos contables generados automáticamente\n\n**Compatible con:**\n- Profit Plus Contable\n- Profit Plus Administrativo\n- Versiones 2020 en adelante\n\n**Setup incluido sin costo** en planes con integración. Wizard de 6 pasos sin escribir código.\n\n¿Usas Profit Plus Contable, Administrativo, o ambos?",
  ],
  erp: [
    "**Integraciones ERP — Información detallada:**\n\nAIDA se conecta con tu ERP de dos formas principales:\n\n**1. Conector nativo** (ERPs más populares):\n- **Profit Plus**: API REST bidireccional, mapeo contable automático\n- **SAP Business One**: Conector SAP DI certificado\n- **Odoo**: Módulo marketplace (v15-17)\n- **Galac**: Archivos TXT/CSV con formato nativo\n- **Saint**: Conector bidireccional con inventario\n- **Valery**: API + archivos\n\n**2. API REST genérica** (cualquier otro sistema):\n- Documentación completa en portal developers\n- Webhooks en tiempo real\n- Procesamiento batch hasta 50,000 documentos\n- Sandbox para pruebas\n\n**Proceso de integración:**\nEl wizard de 6 pasos configura todo sin escribir código:\n1. Conectar → 2. Mapear campos → 3. Plantillas → 4. Reglas → 5. Sandbox → 6. Activar\n\n**E-commerce también:**\n- WooCommerce, Shopify, PrestaShop — con plugins nativos\n\n¿Con cuál sistema específico necesitas la integración?",
  ],
  precios: [
    "**Guía completa de planes AIDA — ¿Cuál necesitas?**\n\nLa clave es entender qué servicio necesitas:\n\n**¿Solo emitir facturas?** → Solo Facturador ($19-$89)\nIdeal si ya tienes una imprenta que te da números de control.\n\n**¿Solo números de control SENIAT?** → Solo Imprenta Digital ($15-$79)\nIdeal si ya tienes un facturador y necesitas números de control vía API.\n\n**¿Todo en uno?** → Facturador + Imprenta ($29-$149) — **MÁS POPULAR**\nFacturación + números de control + cumplimiento SENIAT completo.\n\n**¿Necesitas conectar con tu ERP?** → Agrega integración ($89-$349)\nConexión con SAP, Profit Plus, Odoo, o cualquier sistema.\n\n**Para elegir el tier (Básico/Profesional/Empresarial):**\n- **Básico**: Hasta 100-200 docs/mes, 1 usuario\n- **Profesional**: Hasta 500-1,000, múltiples usuarios, retenciones auto\n- **Empresarial**: Ilimitado, API, batch, SLA 99.9%\n\n¿Cuántos documentos emites al mes aproximadamente? ¿Y necesitas integración con algún ERP?",
  ],
  seniat: [
    "**Cumplimiento SENIAT con AIDA — Todo lo que necesitas saber:**\n\n**Providencia 102 (SNAT/2014/0032) — Facturación Digital:**\n- Establece que los contribuyentes especiales DEBEN emitir documentos fiscales electrónicos\n- Define los formatos obligatorios: PDF para el receptor, XML UBL 2.1 para el SENIAT\n- Campos obligatorios: RIF, razón social, dirección, fecha, impuestos, totales, número de control\n- AIDA incluye TODOS los campos automáticamente en cada documento\n\n**Providencia 121 (SNAT/2017/0010) — Homologación:**\n- Requiere que los sistemas de facturación estén **autorizados** por el SENIAT\n- Define requisitos técnicos: trazabilidad, seguridad, integridad de datos\n- AIDA cumple con todos los requisitos técnicos\n\n**¿Qué pasa si NO cumples?**\n- Multas de **50 a 150 UT** (Unidades Tributarias)\n- **Clausura temporal** del establecimiento (3-5 días)\n- Inhabilitación para emitir documentos fiscales\n- Responsabilidad penal en casos graves\n\n**Con AIDA el cumplimiento es automático:** firma SHA-256, QR, trazabilidad IP/timestamp, retención 10 años.\n\n¿Quieres saber más sobre alguna Providencia en particular o sobre el proceso de homologación?",
  ],
  retenciones: [
    "**Sistema de retenciones automáticas en AIDA — Detalle completo:**\n\n**Retención IVA:**\n- Contribuyentes ordinarios: retención del **75%** del IVA\n- Contribuyentes especiales: retención del **100%** del IVA\n- El sistema detecta automáticamente el tipo de contribuyente por su RIF\n- Comprobante generado al instante con todos los campos SENIAT\n- Declaración quincenal: AIDA genera el archivo para el portal SENIAT\n\n**Retención ISLR:**\n- Tablas actualizadas por actividad económica (según Decreto 1.808)\n- Cálculo automático del porcentaje según el servicio facturado\n- Retenciones sobre honorarios, servicios, alquileres, comisiones\n- Comprobante ARI generado automáticamente\n\n**IGTF (Impuesto a Grandes Transacciones Financieras):**\n- **3%** sobre transacciones en divisas o criptomonedas\n- Cálculo automático cuando se factura en USD/EUR\n- Desglose en el documento fiscal\n\n**Tasas IVA soportadas:**\n- 16% general | 8% reducido | 0% exento\n\n¿Tienes algún caso específico de retención que necesites resolver?",
  ],
  documentos: [
    "**Los 7 tipos de documentos fiscales de AIDA — A fondo:**\n\n**1. Factura electrónica:**\n- Formato PDF + XML UBL 2.1\n- Firma digital SHA-256 + código QR\n- Número de control asignado atómicamente\n- 4 plantillas: Clásica SENIAT, Moderna, Corporativa, Compacta\n\n**2. Nota de crédito:**\n- Vinculada obligatoriamente a la factura original\n- Reduce el monto de la operación\n- Ajusta automáticamente los impuestos\n\n**3. Nota de débito:**\n- Para cargos adicionales: intereses, diferencias cambiarias\n- Vinculada al documento original\n\n**4. Guía de despacho:**\n- Para traslado de mercancía sin facturación\n- Incluye datos de origen, destino y transportista\n\n**5. Comprobante retención IVA:**\n- 75% (ordinarios) o 100% (especiales)\n- Generado automáticamente al registrar la factura del proveedor\n\n**6. Comprobante retención ISLR:**\n- Según tablas por actividad económica\n- Formato ARI compatible con portal SENIAT\n\n**7. Comprobante IGTF:**\n- 3% sobre operaciones en divisas\n\nTodos se emiten en **menos de 3 segundos**. ¿Quieres ver cómo funciona algún tipo de documento en particular?",
  ],
  api: [
    "**API REST de AIDA — Guía para desarrolladores:**\n\n**Autenticación:**\n```\nAuthorization: Bearer tu_api_key\nContent-Type: application/json\n```\n\n**Endpoints principales:**\n- `POST /api/v1/fiscal/emit` — Emitir documento fiscal\n- `POST /api/v1/fiscal/void` — Anular documento\n- `GET /api/v1/fiscal/documents` — Listar documentos\n- `GET /api/v1/fiscal/documents/:id` — Obtener documento por ID\n- `GET /api/v1/fiscal/templates` — Listar plantillas PDF\n- `POST /api/v1/fiscal/batch` — Procesamiento masivo (hasta 50K docs)\n\n**Webhooks:**\nConfigura URLs de callback para eventos:\n- `document.emitted` — Documento emitido exitosamente\n- `document.voided` — Documento anulado\n- `retention.processed` — Retención procesada\n\n**Rate limiting:**\n- Básico: 100 requests/min\n- Profesional: 500 requests/min\n- Empresarial: Sin límite\n\n**Sandbox:**\nAmbiente completo de pruebas en `sandbox.api.aida.com.ve`\n\n¿Necesitas un ejemplo de cómo emitir una factura vía API, o prefieres detalles sobre algún endpoint específico?",
  ],
  demo: [
    "**Agenda tu demo de AIDA — El proceso completo:**\n\n**1. Demo personalizada (30 min):**\nUna videollamada donde te mostramos la plataforma funcionando con datos de tu empresa:\n- Emisión de factura en vivo en menos de 3 segundos\n- Dashboard con analíticas en tiempo real\n- Integración con tu ERP (si aplica)\n- Portal de autogestión\n\n**2. Acceso a Sandbox:**\nTe damos acceso inmediato a un ambiente de pruebas donde puedes:\n- Emitir facturas ficticias\n- Probar la API\n- Configurar plantillas\n- Ver cómo funciona todo sin compromiso\n\n**3. Implementación:**\n- **Menos de 48 horas** desde que confirmes\n- **$0 costo de implementación** en todos los planes\n- Migración asistida de datos (clientes, productos)\n- Capacitación incluida para tu equipo\n\n**Contacto:**\n- Email: **contacto@aida.com.ve**\n- También puedes llenar el formulario en esta página\n\n¿Quieres que coordine una demo? Solo dime tu nombre y empresa.",
  ],
  galac: [
    "**Galac + AIDA — Integración completa:**\n\nLa integración con Galac es vía archivos con formato nativo:\n\n**Sincronización:**\n- AIDA genera archivos TXT/CSV en el formato exacto que Galac importa\n- Exportación automática después de cada emisión\n- Sincronización de retenciones IVA e ISLR\n\n**Lo que se sincroniza:**\n- Facturas emitidas → Libro de Ventas en Galac\n- Retenciones IVA → Libro de Compras/Retenciones\n- Retenciones ISLR → Módulo de retenciones\n\n**Proceso:**\nCon el wizard de 6 pasos configuramos la ruta de archivos y los formatos. Sin escribir código.\n\n**Planes:** Profesional+ERP ($119/mes) o Empresarial+ERP ($199/mes). Setup incluido.\n\n¿Usas Galac en modo monousuario o multiempresa?",
  ],
  odoo: [
    "**Odoo + AIDA — Módulo de integración:**\n\nTenemos un módulo oficial instalable desde el marketplace de Odoo:\n\n**Compatibilidad:** Odoo 15, 16 y 17 (Community y Enterprise)\n\n**Funcionalidades:**\n- Sincronización bidireccional de facturas, NC, ND\n- Mapeo automático de impuestos IVA/ISLR/IGTF\n- Sincronización de clientes y productos\n- Webhook en cada emisión\n- Dashboard AIDA dentro de Odoo\n\n**Instalación:**\n1. Descargar módulo desde marketplace\n2. Instalar en tu instancia Odoo\n3. Configurar con wizard de 6 pasos\n4. Probar en sandbox\n5. Activar\n\n**Planes:** Profesional+ERP ($119/mes) o Empresarial+ERP ($199/mes).\n\n¿Usas Odoo Community o Enterprise? ¿Qué versión?",
  ],
};

// ── Improved offline reply with full conversation context ──
function getOfflineReply(messages: ChatMessage[]): string {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const msg = (lastUserMsg?.content || "").toLowerCase().trim();

  // Detect the dominant topic across the FULL conversation
  const topic = detectConversationTopic(messages);

  // Check if this is a short affirmative/continuation response
  if (isAffirmative(msg)) {
    // Get the topic-specific continuation responses
    const responses = topicResponses[topic];
    if (responses) {
      // Count how many responses for this topic have already been given
      const previousAssistantMsgs = messages.filter((m) => m.role === "assistant").map((m) => m.content);
      // Find a response that hasn't been given yet
      for (const resp of responses) {
        const isUsed = previousAssistantMsgs.some((prev) => {
          // Check if this exact response was already given (compare first 50 chars to avoid false positives)
          return prev.slice(0, 80) === resp.slice(0, 80);
        });
        if (!isUsed) return resp;
      }
      // If all responses used, give the last one (deepest detail)
      return responses[responses.length - 1];
    }

    // No specific topic found — ask what they want to know more about
    return "¡Por supuesto! ¿Sobre cuál de estos temas quieres que profundice?\n\n" +
      "- **Planes y precios** — las 5 modalidades de servicio y cómo elegir\n" +
      "- **Integración ERP** — SAP, Profit Plus, Odoo, Galac y 100+ más\n" +
      "- **Cumplimiento SENIAT** — Providencia 102, 121, sanciones\n" +
      "- **Documentos fiscales** — los 7 tipos que emite AIDA\n" +
      "- **Retenciones** — IVA, ISLR, IGTF automáticos\n" +
      "- **API para desarrolladores** — endpoints, webhooks, batch\n" +
      "- **Demo gratuita** — cómo probar AIDA\n\n" +
      "Dime el tema y te doy toda la información.";
  }

  // ── Specific user-initiated topic handlers ──
  // The user is explicitly asking about something

  if (msg.includes("trabajo con") || msg.includes("uso ") || msg.includes("tengo ") || msg.includes("utilizo ")) {
    // User mentions their specific system
    if (msg.includes("sap")) return topicResponses.sap[0];
    if (msg.includes("profit")) return topicResponses.profit[0];
    if (msg.includes("galac")) return topicResponses.galac[0];
    if (msg.includes("odoo")) return topicResponses.odoo[0];
    if (msg.includes("saint") || msg.includes("valery")) {
      const erp = msg.includes("saint") ? "Saint" : "Valery";
      return `**Integración AIDA + ${erp}:**\n\nComo uno de los ERPs más usados en Venezuela, tenemos **integración nativa** con ${erp}:\n\n- Conector vía **API REST** y/o archivos\n- Sincronización de clientes, productos y documentos fiscales\n- Mapeo automático de campos contables y fiscales venezolanos\n- Retenciones IVA e ISLR sincronizadas\n- **Wizard de 6 pasos** sin escribir código\n\n**Planes con integración:**\n- Profesional+ERP: $119/mes\n- Empresarial+ERP: $199/mes\n\nEl setup está **incluido sin costo adicional**. ¿Quieres que te cuente el proceso de implementación paso a paso?`;
    }
  }

  if (msg.includes("sap")) return topicResponses.sap[0];
  if (msg.includes("odoo")) return topicResponses.odoo[0];
  if (msg.includes("profit")) return topicResponses.profit[0];
  if (msg.includes("galac")) return topicResponses.galac[0];

  if (msg.includes("saint") || msg.includes("valery")) {
    const erp = msg.includes("saint") ? "Saint" : "Valery";
    return `**Integración AIDA + ${erp}:**\n\nComo uno de los ERPs más usados en Venezuela, tenemos **integración nativa** con ${erp}:\n\n- Conector vía **API REST** y/o archivos\n- Sincronización de clientes, productos y documentos fiscales\n- Mapeo automático de campos contables y fiscales venezolanos\n- Retenciones IVA e ISLR sincronizadas\n- **Wizard de 6 pasos** sin escribir código\n\n**Planes con integración:**\n- Profesional+ERP: $119/mes\n- Empresarial+ERP: $199/mes\n\nEl setup está **incluido sin costo adicional**. ¿Quieres agendar una demo para ver la integración en acción?`;
  }

  if (msg.includes("precio") || msg.includes("plan") || msg.includes("costo") || msg.includes("cuánto") || msg.includes("cuanto") || msg.includes("mensual"))
    return topicResponses.precios[0];

  if (msg.includes("erp") || msg.includes("integr"))
    return topicResponses.erp[0];

  if (msg.includes("seniat") || msg.includes("providencia") || msg.includes("cumpli") || msg.includes("fiscal") || msg.includes("homolog"))
    return topicResponses.seniat[0];

  if (msg.includes("retención") || msg.includes("retencion") || msg.includes("iva") || msg.includes("islr"))
    return topicResponses.retenciones[0];

  if (msg.includes("factura") || msg.includes("documento") || msg.includes("emitir") || msg.includes("nota"))
    return topicResponses.documentos[0];

  if (msg.includes("api") || msg.includes("developer") || msg.includes("webhook") || msg.includes("batch"))
    return topicResponses.api[0];

  if (msg.includes("hola") || msg.includes("buenos") || msg.includes("saludos") || msg.includes("hey") || msg.includes("buenas"))
    return "¡Hola! Bienvenido a **AIDA**, la primera imprenta digital de Venezuela con IA.\n\n¿En qué puedo ayudarte hoy?\n\n- **Planes y precios** — 5 modalidades desde $15/mes\n- **Integración ERP** — SAP, Profit Plus, Odoo, Galac y 100+ más\n- **Cumplimiento SENIAT** — Providencia 102/121, sin sanciones\n- **Retenciones** — IVA, ISLR, IGTF automáticos\n- **API** — para desarrolladores y sistemas custom\n- **Demo gratuita** — prueba sin compromiso\n\nDime qué necesitas y te ayudo con toda la información.";

  if (msg.includes("demo") || msg.includes("probar") || msg.includes("prueba"))
    return topicResponses.demo[0];

  if (msg.includes("gracias") || msg.includes("thank"))
    return "¡Con mucho gusto! Estoy aquí para ayudarte con cualquier duda sobre facturación electrónica en Venezuela.\n\nSi necesitas algo más adelante:\n- **Email**: contacto@aida.com.ve\n- **Demo**: Puedes solicitarla desde esta misma página\n\n¿Hay algo más en lo que pueda ayudarte?";

  // Default — enriched response
  return "Soy **AIDA**, tu asistente de facturación electrónica. Puedo ayudarte con información detallada sobre:\n\n" +
    "- **Planes y precios** — 5 modalidades desde $15/mes hasta $349/mes\n" +
    "- **Integración con tu ERP** — SAP, Profit Plus, Odoo, Galac, y 100+ más\n" +
    "- **Cumplimiento SENIAT** — Providencia 102/121, evita sanciones\n" +
    "- **Documentos fiscales** — 7 tipos: facturas, NC, ND, retenciones, guías\n" +
    "- **Retenciones automáticas** — IVA (75%/100%), ISLR, IGTF\n" +
    "- **API para desarrolladores** — REST, webhooks, batch 50K docs\n\n" +
    "¿Sobre qué tema te gustaría saber más?";
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as { messages: ChatMessage[] };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Offline / demo mode — respond with context-aware built-in knowledge
    if (!GROQ_API_KEY) {
      const reply = getOfflineReply(messages);
      return NextResponse.json({ reply });
    }

    const groqMessages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.slice(-20), // Keep last 20 messages for context window
    ];

    // Add timeout with AbortController
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: GROQ_MODEL,
            messages: groqMessages,
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 0.9,
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Groq API error:", response.status, errorData);
        const reply = getOfflineReply(messages);
        return NextResponse.json({ reply });
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "Lo siento, no pude generar una respuesta.";

      return NextResponse.json({ reply });
    } catch (fetchError) {
      clearTimeout(timeout);
      console.error("Groq API fetch error:", fetchError);
      const reply = getOfflineReply(messages);
      return NextResponse.json({ reply });
    }
  } catch (error) {
    console.error("Chat API error:", error);
    try {
      const { messages } = await req.clone().json();
      const reply = getOfflineReply(messages || []);
      return NextResponse.json({ reply });
    } catch {
      return NextResponse.json(
        { error: "Error interno del servidor." },
        { status: 500 }
      );
    }
  }
}

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
- NUNCA repitas la misma respuesta dos veces. Si el usuario hace una pregunta de seguimiento, profundiza en el tema.

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
7. NUNCA des la misma respuesta a preguntas diferentes. Si te preguntan sobre un tema específico (ej: SAP), da detalles específicos sobre ese tema.
8. Mantén respuestas concisas (máximo 3-4 párrafos salvo que pidan detalle)
9. Si el usuario dice "sí" o responde brevemente a una pregunta tuya, profundiza en el último tema discutido
10. Recuerda la conversación completa y no repitas información ya dada`;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Smarter offline mode that tracks conversation context
function getOfflineReply(messages: ChatMessage[]): string {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const msg = (lastUserMsg?.content || "").toLowerCase().trim();

  // Get conversation context: what was the last assistant message about?
  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");
  const lastTopic = (lastAssistantMsg?.content || "").toLowerCase();

  // Short affirmative responses: expand on the last topic
  if (msg.match(/^(si|sí|ok|dale|claro|exacto|por favor|porfa|dime|cuéntame|continua|continúa|más)$/i)) {
    if (lastTopic.includes("sap")) {
      return "**Integración AIDA + SAP Business One — Detalle:**\n\nEl proceso de conexión es así:\n\n1. **Conexión SAP DI**: Configuramos el conector con tus credenciales SAP\n2. **Mapeo de campos**: Vinculamos campos fiscales venezolanos (IVA, ISLR, IGTF) con los campos de SAP\n3. **Plantillas**: Elegimos la plantilla de factura que se usará\n4. **Reglas de negocio**: Definimos retenciones automáticas, series de NC, etc.\n5. **Sandbox**: Probamos con datos ficticios\n6. **Activación**: Una vez validado, activamos en producción\n\nEl setup está **incluido sin costo adicional** en los planes con integración ($119-$349/mes). Compatible con SAP B1 versión 9.x y 10.x.\n\n¿Quieres que te explique sobre el mapeo de campos fiscales o sobre los planes con integración?";
    }
    if (lastTopic.includes("profit plus") || lastTopic.includes("galac")) {
      return "**Integración con ERPs venezolanos — Más detalle:**\n\n**Profit Plus:**\n- Conector nativo vía API REST\n- Sincroniza clientes, productos, facturas, NC/ND\n- Mapeo contable y fiscal automático\n- Compatible con Profit Plus Contable y Administrativo\n\n**Galac:**\n- Integración vía archivos TXT/CSV\n- Export en formato que Galac importa directamente\n- Sincronización de retenciones IVA e ISLR\n\n**Saint:**\n- Conector bidireccional\n- Mapeo de productos y categorías\n- Sincronización de inventario\n\nTodas las integraciones incluyen **wizard de 6 pasos** y **setup gratuito**. ¿Te interesa alguna en particular?";
    }
    if (lastTopic.includes("erp") || lastTopic.includes("integr")) {
      return "Te cuento más sobre las integraciones:\n\n**ERPs venezolanos** (los más solicitados):\n- **Profit Plus**: Conector nativo, sincronización bidireccional\n- **Galac**: Integración vía archivos TXT/CSV\n- **Saint**: Conector bidireccional con inventario\n- **Valery**: Integración API + archivos\n\n**ERPs internacionales:**\n- **SAP Business One**: Conector certificado SAP DI, mapeo fiscal VE\n- **Odoo**: Módulo instalable desde marketplace (v15-17)\n- **Softland**: Integración vía API REST\n\n**E-commerce:**\n- **WooCommerce, Shopify, PrestaShop**: Plugins nativos\n\nEl **wizard de 6 pasos** configura la conexión sin escribir código. Setup incluido.\n\n¿Con cuál sistema trabajas actualmente?";
    }
    if (lastTopic.includes("plan") || lastTopic.includes("precio")) {
      return "Te amplío sobre los planes:\n\n**La diferencia clave** es qué servicio necesitas:\n\n- **Solo Facturador** ($19-$89): El software para emitir facturas. Los números de control los manejas con tu imprenta actual.\n- **Solo Imprenta Digital** ($15-$79): Números de control SENIAT. Trae tu propio facturador y conéctalo vía API.\n- **Facturador + Imprenta** ($29-$149): Todo en uno. Es el **más popular** porque resuelve todo.\n- **+ Integración ERP** ($89-$349): Cualquier plan + conexión personalizada con SAP, Profit Plus, Odoo, etc.\n\n**Dato importante**: Solo los clientes con **Imprenta Digital** aparecen en el Portal de Auditoría SENIAT.\n\n¿Cuántos documentos emites al mes? Así te recomiendo el plan ideal.";
    }
    if (lastTopic.includes("seniat") || lastTopic.includes("providencia")) {
      return "**Más detalle sobre cumplimiento SENIAT:**\n\n**Providencia 102 (SNAT/2014/0032):**\n- Regula la emisión de documentos fiscales electrónicos\n- Establece los formatos obligatorios (PDF, XML)\n- Define los campos requeridos en cada documento\n- AIDA cumple al 100% automáticamente\n\n**Providencia 121 (SNAT/2017/0010):**\n- Regula la homologación de sistemas de facturación\n- Requiere que el sistema esté autorizado por SENIAT\n- AIDA está en proceso de homologación\n\n**¿Qué pasa si no cumples?**\n- Multas de hasta 150 UT (Unidades Tributarias)\n- Clausura temporal del establecimiento\n- Inhabilitación para emitir documentos fiscales\n\nCon AIDA, el cumplimiento es **automático**. Cada documento incluye firma SHA-256, QR de verificación y trazabilidad completa.\n\n¿Tienes alguna duda específica sobre la normativa?";
    }
    // Generic follow-up
    return "¡Con gusto te amplío! ¿Sobre cuál tema te gustaría más detalle?\n\n- **Planes y precios** (5 modalidades de servicio)\n- **Integración con tu ERP** (100+ sistemas compatibles)\n- **Cumplimiento SENIAT** (Providencia 102/121)\n- **Funcionalidades técnicas** (API, batch, plantillas)\n- **Proceso de implementación** (48 horas)\n\nDime y te doy información específica.";
  }

  // Specific topic handlers
  if (msg.includes("sap")) {
    return "**Integración AIDA + SAP Business One:**\n\nOfrecemos un conector certificado SAP DI (Data Interface) con:\n\n- **Sincronización bidireccional** de documentos fiscales\n- **Mapeo automático** de campos fiscales venezolanos (IVA, ISLR, IGTF)\n- **Webhook en tiempo real** para actualizar SAP con cada emisión\n- Compatible con SAP B1 **versión 9.x y 10.x**\n\nEl proceso de integración es un **wizard de 6 pasos**:\n1. Conectar SAP DI → 2. Mapear campos → 3. Configurar plantillas → 4. Definir reglas → 5. Probar en sandbox → 6. Activar\n\n**Planes con integración SAP:**\n- Profesional+ERP: $119/mes\n- Empresarial+ERP: $199/mes\n- Corporativo: $349/mes\n\nSetup **incluido sin costo**. ¿Quieres saber más sobre el proceso paso a paso?";
  }

  if (msg.includes("odoo")) {
    return "**Integración AIDA + Odoo:**\n\nTenemos un **módulo AIDA para Odoo** instalable desde el marketplace:\n\n- Compatible con Odoo **15, 16 y 17**\n- Sincronización bidireccional de facturas, NC, ND\n- Mapeo automático de impuestos IVA/ISLR/IGTF\n- Sincronización de clientes y productos\n\nLa integración se configura con nuestro **wizard de 6 pasos** sin escribir código.\n\n**Planes:** Profesional+ERP ($119/mes) o Empresarial+ERP ($199/mes). ¿Usas Odoo Community o Enterprise?";
  }

  if (msg.includes("profit") || msg.includes("galac") || msg.includes("saint") || msg.includes("valery")) {
    const erp = msg.includes("profit") ? "Profit Plus" : msg.includes("galac") ? "Galac" : msg.includes("saint") ? "Saint" : "Valery";
    return `**Integración AIDA + ${erp}:**\n\nComo uno de los ERPs más usados en Venezuela, tenemos **integración nativa** con ${erp}:\n\n- Conector vía **API REST** y/o archivos\n- Sincronización de clientes, productos y documentos fiscales\n- Mapeo automático de campos contables y fiscales venezolanos\n- Retenciones IVA e ISLR sincronizadas\n- **Wizard de 6 pasos** sin escribir código\n\n**Planes con integración:**\n- Profesional+ERP: $119/mes\n- Empresarial+ERP: $199/mes\n\nEl setup está **incluido sin costo adicional**. ¿Quieres agendar una demo para ver la integración en acción?`;
  }

  if (msg.includes("precio") || msg.includes("plan") || msg.includes("costo") || msg.includes("cuánto") || msg.includes("cuanto")) {
    return "**Planes AIDA — 5 modalidades de servicio:**\n\n**1. Solo Facturador** (sin números de control):\n- Básico $19 · Profesional $49 · Empresarial $89\n\n**2. Solo Imprenta Digital** (números de control SENIAT):\n- Básico $15 · Profesional $39 · Empresarial $79\n\n**3. Facturador + Imprenta** (solución completa):\n- Básico $29 · Profesional $79 · Empresarial $149\n\n**4. Completo + Integración ERP:**\n- Profesional+ERP $119 · Empresarial+ERP $199 · Corporativo $349\n\n**5. Individual + Integración:**\n- Facturador+ERP $89 · Imprenta+ERP $99\n\nTodos los precios en USD, mensuales, sin costo de implementación. ¿Cuántos documentos emites al mes? Te recomiendo el plan ideal.";
  }

  if (msg.includes("erp") || msg.includes("integr")) {
    return "AIDA se integra con **más de 100 ERPs**, incluyendo:\n\n**Top venezolanos:**\n- **Profit Plus**, **Galac**, **Saint**, **Valery**\n\n**Internacionales:**\n- **SAP Business One**, **Odoo**, **Softland**\n\n**E-commerce:**\n- **WooCommerce**, **Shopify**, **PrestaShop**\n\n**Contabilidad:**\n- **QuickBooks**, **CONTPAQi**, **World Office**\n\nNuestro **wizard de 6 pasos** configura la conexión sin escribir código. Si tu sistema no está en la lista, nos adaptamos con **API REST documentada**.\n\n¿Con cuál sistema trabajas? Te cuento los detalles específicos de esa integración.";
  }

  if (msg.includes("seniat") || msg.includes("providencia") || msg.includes("cumpli") || msg.includes("fiscal") || msg.includes("homolog")) {
    return "AIDA garantiza **100% cumplimiento SENIAT**:\n\n**Providencia 102** (SNAT/2014/0032):\n- Facturación digital obligatoria\n- Formato PDF + XML UBL 2.1\n- Campos obligatorios incluidos automáticamente\n\n**Providencia 121** (SNAT/2017/0010):\n- Homologación de sistemas de facturación\n- Trazabilidad completa requerida\n\n**Garantías técnicas:**\n- Asignación **atómica** de números de control\n- Firma digital **SHA-256**\n- Código **QR** de verificación pública\n- Retención de datos por **10 años**\n- Trazabilidad completa (IP, timestamp, usuario)\n\n¿Tienes alguna duda específica sobre la normativa fiscal?";
  }

  if (msg.includes("retención") || msg.includes("retencion") || msg.includes("iva") || msg.includes("islr")) {
    return "**Retenciones automáticas en AIDA:**\n\n**Retención IVA:**\n- **75%** para contribuyentes ordinarios\n- **100%** para contribuyentes especiales\n- Comprobante generado automáticamente\n\n**Retención ISLR:**\n- Tablas actualizadas por actividad económica\n- Cálculo automático según tipo de servicio\n- Comprobante con todos los campos SENIAT\n\n**Impuestos soportados:**\n- IVA: 16% (general), 8% (reducido), 0% (exento)\n- IGTF: 3% en transacciones en divisas\n\nTodo se calcula y genera automáticamente. ¿Necesitas más detalle sobre algún impuesto específico?";
  }

  if (msg.includes("factura") || msg.includes("documento") || msg.includes("emitir") || msg.includes("nota")) {
    return "**Documentos fiscales que emite AIDA:**\n\n1. **Facturas electrónicas** — PDF + XML UBL 2.1, con QR y firma digital\n2. **Notas de crédito** — Vinculadas a la factura original\n3. **Notas de débito** — Para ajustes y cargos adicionales\n4. **Guías de despacho** — Para traslado de mercancía\n5. **Retenciones IVA** — Cálculo automático 75%/100%\n6. **Retenciones ISLR** — Tablas por actividad económica\n7. **Comprobantes IGTF** — 3% en divisas\n\nCada documento se emite en **menos de 3 segundos** con número de control, firma SHA-256 y QR de verificación.\n\n¿Quieres saber sobre algún tipo de documento en particular?";
  }

  if (msg.includes("api") || msg.includes("developer") || msg.includes("webhook") || msg.includes("batch")) {
    return "**API REST de AIDA para desarrolladores:**\n\n- **Documentación completa** en portal developers\n- **Endpoints principales**: emit, void, documents, templates\n- **Autenticación**: API Keys con rate limiting\n- **Webhooks**: Notificaciones en tiempo real por cada evento\n- **Batch**: Procesamiento masivo de hasta **50,000 documentos**\n- **Formatos**: JSON request/response, PDF + XML output\n- **Sandbox**: Ambiente de pruebas completo\n\n**Ejemplo rápido:**\n```\nPOST /api/v1/fiscal/emit\nAuthorization: Bearer tu_api_key\n```\n\n¿Necesitas detalles sobre algún endpoint específico?";
  }

  if (msg.includes("hola") || msg.includes("buenos") || msg.includes("saludos") || msg.includes("hey") || msg.includes("buenas")) {
    return "¡Hola! Bienvenido a **AIDA**, la primera imprenta digital de Venezuela con IA.\n\n¿En qué puedo ayudarte?\n\n- **Planes y precios** (5 modalidades de servicio)\n- **Integración** con tu ERP (SAP, Profit Plus, Odoo, etc.)\n- **Cumplimiento SENIAT** (Providencia 102/121)\n- **Retenciones** IVA, ISLR, IGTF\n- **API** para desarrolladores\n- Cualquier duda sobre nuestros servicios";
  }

  if (msg.includes("demo") || msg.includes("probar") || msg.includes("prueba")) {
    return "**Solicita tu demo gratuita de AIDA:**\n\n1. **Demo en vivo**: Te mostramos la plataforma completa en una videollamada de 30 minutos\n2. **Sandbox**: Acceso a un ambiente de pruebas para que factures sin compromiso\n3. **Implementación**: En menos de **48 horas** desde que confirmes\n\n**$0 costo de implementación** en todos los planes.\n\nEscríbenos a **contacto@aida.com.ve** o llena el formulario de abajo para agendar tu demo. ¿Hay algo más que quieras saber antes?";
  }

  // Default — but better than before
  return "¡Gracias por tu interés en **AIDA**! Somos la primera imprenta digital de Venezuela con IA.\n\nPuedo ayudarte con:\n- **Planes y precios**: 5 modalidades desde $15/mes\n- **Integración ERP**: SAP, Profit Plus, Odoo, Galac y 100+ más\n- **Normativa SENIAT**: Providencia 102 y 121\n- **Funcionalidades**: API, batch, retenciones, plantillas\n\n¿Sobre cuál tema te gustaría saber más?";
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
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Groq API error:", response.status, errorData);
      // Fall back to offline mode instead of returning error
      const reply = getOfflineReply(messages);
      return NextResponse.json({ reply });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Lo siento, no pude generar una respuesta.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    // Fall back to offline mode on any error
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

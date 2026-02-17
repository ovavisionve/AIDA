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

SOBRE AIDA:
AIDA es una plataforma SaaS de facturación electrónica e imprenta digital con IA para Venezuela. Emite documentos fiscales electrónicos en menos de 3 segundos con 100% cumplimiento SENIAT.

SERVICIOS:
- Facturas electrónicas (PDF, XML UBL 2.1, con QR y firma digital)
- Notas de crédito y débito electrónicas
- Guías de despacho electrónicas
- Comprobantes de retención IVA (cálculo automático 75%/100%)
- Comprobantes de retención ISLR (tablas actualizadas por actividad)
- 7 tipos de documentos fiscales en total

FUNCIONALIDADES CLAVE:
- Emisión en menos de 3 segundos por documento
- IA entrenada en normativa fiscal venezolana (no es un chatbot genérico)
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

PLANES Y PRECIOS:
1. Básico — $29/mes: 100 docs/mes, 1 usuario, soporte email
2. Profesional — $79/mes: 500 docs/mes, 5 usuarios, integración ERP, IA asistente, soporte prioritario
3. Empresarial — $149/mes: Documentos ilimitados, 99 usuarios, todas las plantillas, API batch, SLA 99.9%
4. Corporativo — $299/mes: Volumen personalizado, usuarios ilimitados, gerente dedicado, IA predictiva

PROCESO DE INTEGRACIÓN:
1. Registro (5 minutos)
2. Verificación fiscal
3. Configuración de plantillas
4. Integración API/ERP (wizard de 6 pasos)
5. Pruebas en sandbox
6. ¡Listo! Primera factura en menos de 48 horas

CONTEXTO FISCAL VENEZOLANO:
- IVA: 16% (general), 8% (reducido), 0% (exento)
- IGTF: 3% impuesto a transacciones en divisas
- ISLR: Retenciones según tablas por actividad económica
- Retenciones IVA: 75% (contribuyentes ordinarios) o 100% (especiales)
- El SENIAT es el Servicio Nacional Integrado de Administración Aduanera y Tributaria
- BCV: Banco Central de Venezuela (tasas de cambio oficiales)

COMPETENCIA:
- AIDA es más rápida que imprentas tradicionales (3 seg vs minutos)
- Implementación en 48 horas vs semanas con competidores
- $0 costos de implementación
- IA real vs soporte genérico
- 100+ ERPs (Profit Plus, Galac, Saint, Valery, SAP, Odoo, etc.) vs integraciones limitadas
- Autogestión total vs dependencia de proveedor

REGLAS:
1. Siempre responde en español
2. Si preguntan por precios, da los planes completos
3. Si preguntan algo técnico fiscal, responde con fundamento legal (Providencia 102/121)
4. Si preguntan algo que no sabes, sugiere contactar al equipo: contacto@aida.com.ve
5. Puedes sugerir planes según el volumen de documentos del cliente
6. Nunca inventes funcionalidades que no existen
7. Si preguntan por soporte o problemas técnicos, sugiere el canal correspondiente al plan
8. Mantén respuestas concisas (máximo 3-4 párrafos salvo que pidan detalle)`;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Fallback responses when no API key is configured (local dev / demo mode)
function getOfflineReply(userMessage: string): string {
  const msg = userMessage.toLowerCase();

  if (msg.includes("precio") || msg.includes("plan") || msg.includes("costo") || msg.includes("cuánto")) {
    return "**Nuestros planes:**\n\n1. **Básico** — $29/mes: 100 docs/mes, 1 usuario, soporte email\n2. **Profesional** — $79/mes: 500 docs/mes, 5 usuarios, integración ERP, IA asistente\n3. **Empresarial** — $149/mes: Documentos ilimitados, 99 usuarios, API batch, SLA 99.9%\n4. **Corporativo** — $299/mes: Volumen personalizado, usuarios ilimitados, gerente dedicado\n\nTodos incluyen cumplimiento SENIAT automático. ¿Te interesa alguno en particular?";
  }

  if (msg.includes("erp") || msg.includes("integr") || msg.includes("sap") || msg.includes("odoo") || msg.includes("profit") || msg.includes("galac") || msg.includes("saint") || msg.includes("valery")) {
    return "AIDA se integra con **más de 100 ERPs**, incluyendo los más usados en Venezuela:\n\n- **Profit Plus**, **Galac**, **Saint**, **Valery** (los top venezolanos)\n- **SAP Business One**, **Odoo**, **Softland** (ERPs internacionales)\n- **WooCommerce**, **Shopify**, **PrestaShop** (e-commerce)\n- **QuickBooks**, **CONTPAQi**, **World Office** (contabilidad)\n\nNuestro wizard de **6 pasos** te permite conectar tu sistema sin escribir código. Si tu ERP no está en la lista, nos adaptamos. También tenemos **API REST documentada** para equipos técnicos.\n\n¿Quieres saber más sobre la integración con algún sistema en específico?";
  }

  if (msg.includes("seniat") || msg.includes("providencia") || msg.includes("cumpli") || msg.includes("fiscal") || msg.includes("homolog")) {
    return "AIDA garantiza **100% cumplimiento SENIAT**:\n\n- **Providencia 102** (SNAT/2024/000102): Facturación digital obligatoria\n- **Providencia 121** (SNAT/2024/000121): Homologación de sistemas\n- Asignación **atómica** de números de control\n- Firma digital **SHA-256**\n- Código **QR** de verificación pública\n- Retención de datos por **10 años**\n- Trazabilidad completa (IP, timestamp, usuario)\n\nCada documento emitido cumple con todas las exigencias del SENIAT. ¿Tienes alguna duda específica sobre normativa?";
  }

  if (msg.includes("retención") || msg.includes("retencion") || msg.includes("iva") || msg.includes("islr")) {
    return "AIDA maneja **retenciones automáticas**:\n\n**Retención IVA:**\n- 75% para contribuyentes ordinarios\n- 100% para contribuyentes especiales\n- Comprobante generado automáticamente\n\n**Retención ISLR:**\n- Tablas actualizadas por actividad económica\n- Cálculo automático según el tipo de servicio\n\n**Impuestos soportados:**\n- IVA 16% (general), 8% (reducido), 0% (exento)\n- IGTF 3% en transacciones en divisas\n\nTodo se calcula y se genera automáticamente. ¿Necesitas más detalle?";
  }

  if (msg.includes("hola") || msg.includes("buenos") || msg.includes("saludos") || msg.includes("hey")) {
    return "¡Hola! Bienvenido a **AIDA**. Soy tu asistente de facturación electrónica. ¿En qué puedo ayudarte?\n\nPuedo orientarte sobre:\n- **Planes y precios**\n- **Integración** con tu ERP\n- **Cumplimiento SENIAT**\n- **Retenciones** IVA e ISLR\n- Cualquier duda sobre nuestros servicios";
  }

  return "¡Gracias por tu pregunta! AIDA es la **primera imprenta digital de Venezuela con IA**. Emitimos facturas, notas de crédito, guías de despacho y retenciones en **menos de 3 segundos** con cumplimiento SENIAT automático.\n\nPara darte una respuesta más completa, te invito a:\n- Escribir a **contacto@aida.com.ve**\n- Solicitar una **demo gratuita** en el formulario de abajo\n\n¿Hay algo específico sobre planes, integraciones o normativa SENIAT en lo que pueda orientarte?";
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

    // Offline / demo mode — respond with built-in knowledge when no API key
    if (!GROQ_API_KEY) {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
      const reply = getOfflineReply(lastUserMsg?.content || "");
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
      return NextResponse.json(
        { error: "Error al procesar tu mensaje. Intenta de nuevo." },
        { status: 500 }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Lo siento, no pude generar una respuesta.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

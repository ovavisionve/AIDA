"use client";
import { useEffect, useRef, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

interface AgentInfo {
  agent_name: string;
  erp_type: string;
}

interface SessionInfo {
  id: string;
  title: string;
  status: string;
  message_count: number;
  started_at: string;
  last_activity: string;
}

const QUICK_ACTIONS = [
  { label: "Empezar integración", prompt: "Quiero empezar a integrar mi sistema con AIDA. ¿Por dónde empiezo?" },
  { label: "Enviar factura", prompt: "¿Cómo envío una factura a través de la API de AIDA?" },
  { label: "Autenticación API", prompt: "¿Cómo me autentico con la API? ¿Qué headers necesito?" },
  { label: "Ejemplo cURL", prompt: "Dame un ejemplo completo de cURL para crear una factura" },
  { label: "Mapeo de campos", prompt: "¿Cómo mapeo los campos de mi sistema a los de AIDA?" },
  { label: "Ver errores comunes", prompt: "¿Cuáles son los errores más comunes en la integración y cómo solucionarlos?" },
];

export default function AgentChat({ token }: { token: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pastSessions, setPastSessions] = useState<SessionInfo[]>([]);
  const [showSessions, setShowSessions] = useState(false);
  const [detecting, setDetecting] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText]);

  // Detect agent on mount
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/ai/agent/detect`, { headers });
        const d = await r.json();
        if (d.has_agent) {
          setAgentInfo({ agent_name: d.agent_name, erp_type: d.erp_type });
        }
      } catch (e) {
        console.error("Agent detection error:", e);
      } finally {
        setDetecting(false);
      }
    })();
  }, []);

  const loadSessions = async () => {
    try {
      const r = await fetch(`${API}/ai/agent/sessions`, { headers });
      const d = await r.json();
      setPastSessions(d.sessions || []);
      setShowSessions(true);
    } catch (e) {
      console.error("Error loading sessions:", e);
    }
  };

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading || streaming) return;

    const userMsg: Message = { role: "user", content: msg, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    const history = messages.slice(-20).map(m => ({ role: m.role, content: m.content }));

    // Use streaming
    setStreaming(true);
    setStreamText("");
    try {
      const res = await fetch(`${API}/ai/agent/chat/stream`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: msg,
          session_id: sessionId,
          conversation_history: history,
        }),
      });

      if (!res.ok) throw new Error("Error del servidor");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              if (data.startsWith("[SESSION_ID:")) {
                const sid = data.slice(12, -1);
                setSessionId(sid);
                continue;
              }
              if (data.startsWith("[ERROR]")) {
                fullText += "\n\nError: " + data.slice(8);
                break;
              }
              fullText += data;
              setStreamText(fullText);
            }
          }
        }
      }

      setMessages(prev => [
        ...prev,
        { role: "assistant", content: fullText, timestamp: new Date().toISOString() },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Error al conectar con el agente. Verifica tu conexión.", timestamp: new Date().toISOString() },
      ]);
    } finally {
      setStreaming(false);
      setStreamText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const newChat = () => {
    setMessages([]);
    setStreamText("");
    setSessionId(null);
  };

  if (detecting) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3rem)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-aida-accent border-t-transparent" />
      </div>
    );
  }

  if (!agentInfo) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-3rem)] text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-300">Agente no configurado</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-md">
          Tu cuenta aún no tiene un agente de integración asignado.
          Contacta al administrador de AIDA para que configure tu agente personalizado.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white">{agentInfo.agent_name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Agente de integración — {agentInfo.erp_type.toUpperCase()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadSessions}
            className="text-xs text-gray-500 hover:text-aida-cyan transition"
          >
            Historial
          </button>
          {messages.length > 0 && (
            <button
              onClick={newChat}
              className="text-xs text-gray-500 hover:text-emerald-400 transition"
            >
              Nueva conversación
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto py-4 space-y-4">
        {messages.length === 0 && !streaming ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-aida-primary flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-300">{agentInfo.agent_name}</h2>
            <p className="text-sm text-gray-500 mt-1 max-w-md">
              Soy tu asistente de integración. Te ayudo a conectar tu {agentInfo.erp_type.toUpperCase()} con
              la API de facturación electrónica de AIDA.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-6 max-w-2xl">
              {QUICK_ACTIONS.map(action => (
                <button
                  key={action.label}
                  onClick={() => sendMessage(action.prompt)}
                  className="text-left p-3 rounded-xl border border-white/10 hover:border-violet-500/50 hover:bg-violet-500/5 transition text-sm"
                >
                  <span className="font-medium text-gray-300">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-violet-600 text-white rounded-br-md"
                      : "bg-white/5 border border-white/10 text-gray-300 rounded-bl-md"
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {msg.content}
                  </div>
                  <div className={`text-xs mt-1 ${msg.role === "user" ? "text-white/60" : "text-gray-500"}`}>
                    {msg.timestamp && new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {streaming && streamText && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-white/5 border border-white/10 px-4 py-3">
                  <div className="text-sm whitespace-pre-wrap break-words leading-relaxed text-gray-300">
                    {streamText}
                    <span className="inline-block w-1.5 h-4 bg-violet-500 ml-0.5 animate-pulse" />
                  </div>
                </div>
              </div>
            )}

            {(loading || (streaming && !streamText)) && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-white/5 border border-white/10 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-xs text-gray-500">Procesando...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/10 pt-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pregunta sobre tu integración..."
              rows={1}
              className="w-full resize-none rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 px-4 py-3 pr-12 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              style={{ maxHeight: "120px" }}
              onInput={e => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 120) + "px";
              }}
            />
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading || streaming}
            className="rounded-xl bg-violet-600 text-white p-3 hover:bg-violet-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Agente IA de integración. Te guía paso a paso para conectar tu ERP con AIDA.
        </p>
      </div>

      {/* Sessions Modal */}
      {showSessions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-[#0d1321] border border-white/10 p-6 shadow-2xl max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Historial de Conversaciones</h3>
              <button
                onClick={() => setShowSessions(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {pastSessions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No hay conversaciones previas</p>
            ) : (
              <div className="space-y-2">
                {pastSessions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSessionId(s.id);
                      setMessages([]);
                      setShowSessions(false);
                    }}
                    className="w-full text-left rounded-lg bg-white/5 border border-white/10 p-3 hover:bg-white/10 transition"
                  >
                    <p className="text-sm text-white font-medium truncate">{s.title}</p>
                    <div className="flex gap-3 mt-1 text-xs text-gray-500">
                      <span>{s.message_count} mensajes</span>
                      <span>{new Date(s.last_activity).toLocaleDateString("es-VE")}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

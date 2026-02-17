"use client";
import { useEffect, useRef, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
  context_used?: string[];
}

const QUICK_ACTIONS = [
  { label: "Resumen del mes", prompt: "Dame un resumen fiscal del mes actual" },
  { label: "NC disponibles", prompt: "¿Cuántos números de control me quedan disponibles?" },
  { label: "Última factura", prompt: "Muéstrame la última factura emitida" },
  { label: "Optimización IVA", prompt: "¿Cómo puedo optimizar mi carga de IVA este período?" },
  { label: "Normativa SENIAT", prompt: "¿Cuáles son los requisitos actuales del SENIAT para facturas electrónicas?" },
  { label: "Plazos declaración", prompt: "¿Cuándo debo declarar IVA este mes y qué necesito?" },
];

export default function AIChat({ token }: { token: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [useStreaming, setUseStreaming] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading || streaming) return;

    const userMsg: Message = { role: "user", content: msg, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));

    if (useStreaming) {
      // SSE streaming
      setStreaming(true);
      setStreamText("");
      try {
        const res = await fetch(`${API}/ai/chat/stream`, {
          method: "POST",
          headers,
          body: JSON.stringify({ message: msg, conversation_history: history, include_context: true }),
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
                if (data === "[DONE]") break;
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
          { role: "assistant", content: "Error al conectar con el asistente IA. Verifica tu conexión.", timestamp: new Date().toISOString() },
        ]);
      } finally {
        setStreaming(false);
        setStreamText("");
      }
    } else {
      // Regular request
      setLoading(true);
      try {
        const res = await fetch(`${API}/ai/chat`, {
          method: "POST",
          headers,
          body: JSON.stringify({ message: msg, conversation_history: history, include_context: true }),
        });
        const data = await res.json();
        if (res.ok) {
          setMessages(prev => [
            ...prev,
            {
              role: "assistant",
              content: data.response,
              timestamp: new Date().toISOString(),
              context_used: data.context_used,
            },
          ]);
        } else {
          setMessages(prev => [
            ...prev,
            { role: "assistant", content: `Error: ${data.detail || "Error desconocido"}`, timestamp: new Date().toISOString() },
          ]);
        }
      } catch {
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: "Error de conexión con el servidor.", timestamp: new Date().toISOString() },
        ]);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setStreamText("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asistente Fiscal IA</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Consultas fiscales, IVA, SENIAT, facturación y normativa venezolana
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-gray-500">
            <input
              type="checkbox"
              checked={useStreaming}
              onChange={e => setUseStreaming(e.target.checked)}
              className="rounded"
            />
            Streaming
          </label>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="text-xs text-gray-400 hover:text-red-500 transition"
            >
              Limpiar chat
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto py-4 space-y-4">
        {messages.length === 0 && !streaming ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-aida-accent to-aida-primary flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-700">Asistente Fiscal AIDA</h2>
            <p className="text-sm text-gray-400 mt-1 max-w-md">
              Pregunta sobre normativa SENIAT, facturación, IVA, números de control,
              o cualquier tema fiscal venezolano.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-6 max-w-2xl">
              {QUICK_ACTIONS.map(action => (
                <button
                  key={action.label}
                  onClick={() => sendMessage(action.prompt)}
                  className="text-left p-3 rounded-xl border border-gray-200 hover:border-aida-accent hover:bg-aida-accent/5 transition text-sm"
                >
                  <span className="font-medium text-gray-700">{action.label}</span>
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
                      ? "bg-aida-accent text-white rounded-br-md"
                      : "bg-gray-100 text-gray-800 rounded-bl-md"
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {msg.content}
                  </div>
                  {msg.context_used && msg.context_used.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200/50">
                      <span className="text-xs text-gray-400">Contexto: {msg.context_used.join(", ")}</span>
                    </div>
                  )}
                  <div className={`text-xs mt-1 ${msg.role === "user" ? "text-white/60" : "text-gray-400"}`}>
                    {msg.timestamp && new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {/* Streaming indicator */}
            {streaming && streamText && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3">
                  <div className="text-sm whitespace-pre-wrap break-words leading-relaxed text-gray-800">
                    {streamText}
                    <span className="inline-block w-1.5 h-4 bg-aida-accent ml-0.5 animate-pulse" />
                  </div>
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {(loading || (streaming && !streamText)) && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-xs text-gray-400">Pensando...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t pt-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu consulta fiscal..."
              rows={1}
              className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 pr-12 text-sm focus:border-aida-accent focus:outline-none focus:ring-2 focus:ring-aida-accent/20"
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
            className="rounded-xl bg-aida-accent text-white p-3 hover:bg-aida-primary transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Asistente IA fiscal venezolano. Las respuestas son orientativas, consulte con su contador para decisiones formales.
        </p>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "¿Cuantos NC me quedan?",
  "Resumen fiscal del mes",
  "¿Como emitir una nota de credito?",
  "Plazos de declaracion IVA",
];

export default function AIChatWidget({ token }: { token: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.slice(-8).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch(`${API}/ai/chat`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, conversation_history: history, include_context: true }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: "assistant",
        content: res.ok ? data.response : (data.detail || "Error al procesar la consulta"),
      }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Error de conexion." }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-aida-accent text-white shadow-lg shadow-aida-accent/25 hover:bg-aida-accent/80 transition-all flex items-center justify-center z-50"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-[#0a0f1a] rounded-2xl shadow-2xl flex flex-col z-50 border border-white/10">
          {/* Header */}
          <div className="bg-gradient-to-r from-aida-accent/20 to-aida-cyan/10 border-b border-white/10 text-white px-4 py-3 rounded-t-2xl">
            <h3 className="font-semibold text-sm text-white">Asistente Fiscal AIDA</h3>
            <p className="text-xs text-gray-500">Consultas fiscales con IA</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-auto p-3 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center pt-8">
                <p className="text-sm text-gray-500 mb-4">¿En que puedo ayudarte?</p>
                <div className="space-y-2">
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => send(s)}
                      className="block w-full text-left text-xs border border-white/10 rounded-lg px-3 py-2 hover:bg-white/5 text-gray-300 transition">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-aida-accent text-white rounded-br-sm"
                      : "bg-white/5 text-gray-300 rounded-bl-sm"
                  }`}>
                    <div className="whitespace-pre-wrap break-words leading-relaxed">{m.content}</div>
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/5 rounded-xl px-3 py-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/10">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send()}
                placeholder="Escribe tu consulta..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-aida-accent"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="bg-aida-accent text-white rounded-lg px-3 py-2 hover:bg-aida-accent/80 transition disabled:opacity-40"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

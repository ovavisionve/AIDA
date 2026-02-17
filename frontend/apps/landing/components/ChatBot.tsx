"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "¡Hola! Soy **AIDA**, tu asistente de facturación electrónica. Puedo ayudarte con:\n\n- Información sobre nuestros **planes y precios**\n- Dudas sobre **facturación electrónica** en Venezuela\n- **Cumplimiento SENIAT** (Providencia 102/121)\n- **Integración** con tu ERP o sistema\n- Cualquier pregunta sobre nuestros servicios\n\n¿En qué puedo ayudarte?",
  timestamp: new Date(),
};

const QUICK_ACTIONS = [
  { label: "Planes y precios", message: "¿Cuáles son los planes y precios?" },
  { label: "¿Cómo integro mi ERP?", message: "¿Cómo integro AIDA con mi ERP?" },
  { label: "Cumplimiento SENIAT", message: "¿Cómo garantizan el cumplimiento con SENIAT?" },
  { label: "Retenciones IVA", message: "¿Cómo funcionan las retenciones de IVA?" },
];

function formatMarkdown(text: string): string {
  let html = text
    // Code blocks
    .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-aida-cyan text-xs font-mono">$1</code>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="flex gap-2 items-start"><span class="text-aida-cyan mt-1.5 text-[6px]">●</span><span>$1</span></li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="flex gap-2 items-start"><span class="text-aida-cyan font-mono text-xs mt-0.5">→</span><span>$1</span></li>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(
    new RegExp("(<li[^>]*>.*?</li>\\n?)+", "gs"),
    (match) => `<ul class="space-y-1.5 my-2">${match}</ul>`
  );

  // Paragraphs (double newline)
  html = html
    .split("\n\n")
    .map((p) => {
      const trimmed = p.trim();
      if (!trimmed || trimmed.startsWith("<ul") || trimmed.startsWith("<li")) return trimmed;
      return `<p class="mb-2 last:mb-0">${trimmed}</p>`;
    })
    .join("");

  // Single newlines within paragraphs → <br>
  html = html.replace(/(?<!<\/li>)\n(?!<)/g, "<br/>");

  return html;
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setShowQuickActions(false);

    // Build conversation history for API (exclude welcome message)
    const apiMessages = [...messages, userMessage]
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al enviar mensaje");
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content:
          "Disculpa, tuve un problema al procesar tu mensaje. Por favor intenta de nuevo o contáctanos en **contacto@aida.com.ve**.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setShowQuickActions(true);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-[60] w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 group ${
          isOpen
            ? "bg-white/10 backdrop-blur-md border border-white/20 rotate-0"
            : "bg-gradient-to-br from-aida-accent to-aida-cyan shadow-lg shadow-aida-accent/30 hover:shadow-aida-accent/50 hover:scale-110"
        }`}
        aria-label={isOpen ? "Cerrar chat" : "Abrir chat con AIDA"}
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <>
            {/* Chat bubble icon */}
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-aida-accent/30 animate-ping" />
          </>
        )}
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-24 right-6 z-[60] w-[380px] max-h-[600px] flex flex-col transition-all duration-300 origin-bottom-right ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-aida-dark via-aida-primary to-aida-dark border border-white/10 rounded-t-2xl p-4 flex items-center gap-3 relative overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-20" />
          <div className="relative flex items-center gap-3 flex-1">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aida-accent to-aida-cyan flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                AIDA
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-[10px] text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  Online
                </span>
              </h3>
              <p className="text-gray-400 text-xs">Asistente de facturación con IA</p>
            </div>
          </div>
          {/* Clear button */}
          <button
            onClick={clearChat}
            className="relative p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Limpiar conversación"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto bg-aida-dark/95 backdrop-blur-xl border-x border-white/10 p-4 space-y-4 min-h-[300px] max-h-[420px] scroll-smooth"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(59,130,246,0.3) transparent",
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} animate-[fadeIn_0.3s_ease-out]`}
            >
              {/* Avatar */}
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-aida-accent/20 to-aida-cyan/20 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-aida-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
                    />
                  </svg>
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-aida-accent to-aida-accent/80 text-white rounded-br-md"
                    : "bg-white/[0.06] border border-white/[0.08] text-gray-200 rounded-bl-md"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div
                    className="chat-content [&_ul]:list-none [&_ul]:pl-0"
                    dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                  />
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
                <span
                  className={`block text-[10px] mt-1.5 ${
                    msg.role === "user" ? "text-white/50 text-right" : "text-gray-500"
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString("es-VE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-2.5 animate-[fadeIn_0.3s_ease-out]">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-aida-accent/20 to-aida-cyan/20 border border-white/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-aida-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
                  />
                </svg>
              </div>
              <div className="bg-white/[0.06] border border-white/[0.08] rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5 items-center h-5">
                  <span className="w-2 h-2 bg-aida-cyan/60 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-aida-cyan/60 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-aida-cyan/60 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {showQuickActions && messages.length <= 1 && (
          <div className="bg-aida-dark/95 backdrop-blur-xl border-x border-white/10 px-4 pb-2">
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => sendMessage(action.message)}
                  className="text-xs px-3 py-1.5 bg-white/[0.06] hover:bg-aida-accent/20 border border-white/10 hover:border-aida-accent/30 rounded-full text-gray-300 hover:text-white transition-all duration-200"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="bg-aida-dark/95 backdrop-blur-xl border border-white/10 rounded-b-2xl p-3">
          <form onSubmit={handleSubmit} className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Auto-resize
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
              }}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu pregunta..."
              rows={1}
              className="flex-1 bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-aida-accent/40 focus:ring-1 focus:ring-aida-accent/20 resize-none transition-all duration-200"
              style={{ maxHeight: "100px" }}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 flex-shrink-0 rounded-xl bg-gradient-to-br from-aida-accent to-aida-cyan flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-aida-accent/30 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </button>
          </form>
          <p className="text-[10px] text-gray-600 mt-2 text-center">
            AIDA IA · Respuestas generadas por inteligencia artificial
          </p>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[55] md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Override Styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          .fixed.bottom-24.right-6 {
            bottom: 0 !important;
            right: 0 !important;
            left: 0 !important;
            width: 100% !important;
            max-height: 85vh !important;
            border-radius: 1rem 1rem 0 0 !important;
          }
        }
      `}</style>
    </>
  );
}

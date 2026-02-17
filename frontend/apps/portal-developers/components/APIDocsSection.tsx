"use client";

import { useState, useEffect } from "react";
import { api } from "../lib/api";

export default function APIDocsSection() {
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    api("/developers/docs/endpoints").then(r => r.json()).then(d => setEndpoints(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const methodColor: Record<string, string> = {
    GET: "bg-green-500/20 text-green-400",
    POST: "bg-blue-500/20 text-blue-400",
    PUT: "bg-amber-500/20 text-amber-400",
    DELETE: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">API Documentation</h2>
        <p className="mt-1 text-gray-400">Referencia completa de endpoints disponibles</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-4 rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-sm text-blue-300">
          Base URL: <code className="font-mono">https://api.aida.com/api/v1</code>
        </div>

        <div className="space-y-2">
          {endpoints.map((ep, i) => (
            <div key={i} className="rounded-lg border border-white/5 bg-white/5">
              <button onClick={() => setExpanded(expanded === i ? null : i)}
                className="flex w-full items-center gap-3 p-4 text-left">
                <span className={`rounded px-2 py-0.5 text-xs font-bold ${methodColor[ep.method] || "bg-gray-500/20 text-gray-400"}`}>
                  {ep.method}
                </span>
                <span className="flex-1 font-mono text-sm">{ep.path}</span>
                <span className="text-xs text-gray-500">{ep.auth}</span>
                <svg className={`h-4 w-4 text-gray-400 transition ${expanded === i ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expanded === i && (
                <div className="border-t border-white/5 p-4 text-sm">
                  <p className="text-gray-300">{ep.description}</p>
                  <div className="mt-3 space-y-2">
                    <div><span className="text-xs text-gray-500">Autenticacion:</span> <code className="ml-2 rounded bg-white/5 px-2 py-0.5 text-xs">{ep.auth}</code></div>
                    {ep.request_body && (
                      <div>
                        <span className="text-xs text-gray-500">Request body:</span>
                        <pre className="mt-1 rounded bg-black/30 p-2 text-xs text-amber-400"><code>{ep.request_body}</code></pre>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-gray-500">Response:</span>
                      <pre className="mt-1 rounded bg-black/30 p-2 text-xs text-green-400"><code>{ep.response}</code></pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

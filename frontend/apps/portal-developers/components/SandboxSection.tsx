"use client";

import { useState } from "react";
import { API } from "../lib/api";

const SANDBOX_ENDPOINTS = [
  {
    id: "emit",
    method: "POST",
    path: "/api/v1/fiscal/emit",
    name: "Emitir Factura",
    auth: "X-API-Key",
    body: JSON.stringify({
      tipo_documento: "factura",
      receptor: {
        rif: "V-12345678-9",
        razon_social: "Cliente Ejemplo",
        direccion: "Calle Principal #123, Caracas",
      },
      items: [
        {
          numero_linea: 1,
          descripcion: "Servicio de consultoria",
          cantidad: 1,
          precio_unitario: 100.00,
          tipo_impuesto: "G",
        },
      ],
      moneda: "USD",
      tasa_cambio: 36.50,
    }, null, 2),
    params: "",
  },
  {
    id: "validate",
    method: "GET",
    path: "/api/v1/validation/verify",
    name: "Validar Documento",
    auth: "Publico",
    body: "",
    params: "numero_control=00-00000001",
  },
  {
    id: "list",
    method: "GET",
    path: "/api/v1/fiscal/documents",
    name: "Listar Documentos",
    auth: "X-API-Key",
    body: "",
    params: "page=1&page_size=10",
  },
  {
    id: "void",
    method: "POST",
    path: "/api/v1/fiscal/void",
    name: "Anular Documento",
    auth: "X-API-Key",
    body: JSON.stringify({
      numero_control: "00-00000001",
      motivo: "Error en datos del receptor",
    }, null, 2),
    params: "",
  },
];

export default function SandboxSection() {
  const [selected, setSelected] = useState(SANDBOX_ENDPOINTS[0]);
  const [apiKey, setApiKey] = useState("");
  const [requestBody, setRequestBody] = useState(SANDBOX_ENDPOINTS[0].body);
  const [queryParams, setQueryParams] = useState(SANDBOX_ENDPOINTS[0].params || "");
  const [response, setResponse] = useState<string | null>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  const selectEndpoint = (ep: typeof SANDBOX_ENDPOINTS[0]) => {
    setSelected(ep);
    setRequestBody(ep.body);
    setQueryParams(ep.params || "");
    setResponse(null);
    setResponseStatus(null);
    setResponseTime(null);
  };

  const execute = async () => {
    setLoading(true);
    setResponse(null);
    setResponseStatus(null);
    const start = performance.now();

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey && selected.auth === "X-API-Key") {
        headers["X-API-Key"] = apiKey;
      }
      const token = localStorage.getItem("access_token");
      if (token && selected.auth !== "Publico") {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const url = queryParams
        ? `${API}${selected.path.replace("/api/v1", "")}?${queryParams}`
        : `${API}${selected.path.replace("/api/v1", "")}`;

      const options: RequestInit = {
        method: selected.method,
        headers,
      };
      if (selected.method === "POST" && requestBody.trim()) {
        options.body = requestBody;
      }

      const res = await fetch(url, options);
      const elapsed = Math.round(performance.now() - start);
      setResponseTime(elapsed);
      setResponseStatus(res.status);
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        setResponse(JSON.stringify(json, null, 2));
      } catch {
        setResponse(text);
      }
    } catch (err: unknown) {
      const elapsed = Math.round(performance.now() - start);
      setResponseTime(elapsed);
      setResponseStatus(0);
      setResponse(`Error: ${err instanceof Error ? err.message : "No se pudo conectar con la API"}`);
    }
    setLoading(false);
  };

  const methodColors: Record<string, string> = {
    GET: "bg-green-500/20 text-green-400 border-green-500/30",
    POST: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    PUT: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  const statusColor = responseStatus
    ? responseStatus < 300
      ? "text-green-400"
      : responseStatus < 500
        ? "text-amber-400"
        : "text-red-400"
    : "text-gray-400";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">API Sandbox</h2>
        <p className="mt-1 text-gray-400">Pruebe los endpoints de la API en tiempo real sin escribir codigo</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <label className="mb-2 block text-xs font-medium text-gray-400">API Key (opcional si usa sesion JWT)</label>
        <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="aida_sk_..." type="password"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-sm text-white placeholder-gray-600 focus:border-aida-accent focus:outline-none" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-3 space-y-2">
          <h3 className="text-xs font-semibold uppercase text-gray-500 mb-3">Endpoints</h3>
          {SANDBOX_ENDPOINTS.map((ep) => (
            <button key={ep.id} onClick={() => selectEndpoint(ep)}
              className={`flex w-full items-center gap-2 rounded-lg p-3 text-left text-sm transition ${
                selected.id === ep.id
                  ? "bg-aida-accent/10 border border-aida-accent/20 text-white"
                  : "border border-white/5 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}>
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${methodColors[ep.method]}`}>{ep.method}</span>
              <span className="truncate">{ep.name}</span>
            </button>
          ))}
        </div>

        <div className="lg:col-span-9 space-y-4">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2">
            <span className={`rounded px-2 py-1 text-xs font-bold ${methodColors[selected.method]}`}>{selected.method}</span>
            <code className="flex-1 text-sm text-gray-300">{selected.path}{queryParams ? `?${queryParams}` : ""}</code>
            <span className="rounded bg-white/5 px-2 py-1 text-[10px] text-gray-500">{selected.auth}</span>
            <button onClick={execute} disabled={loading}
              className="rounded-lg bg-aida-accent px-4 py-2 text-sm font-medium text-white hover:bg-aida-accent/80 transition disabled:opacity-50">
              {loading ? "Enviando..." : "Enviar"}
            </button>
          </div>

          {selected.method === "GET" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Query Parameters</label>
              <input value={queryParams} onChange={(e) => setQueryParams(e.target.value)} placeholder="key=value&key2=value2"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-sm text-white placeholder-gray-600 focus:border-aida-accent focus:outline-none" />
            </div>
          )}

          {(selected.method === "POST" || selected.method === "PUT") && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Request Body (JSON)</label>
              <textarea value={requestBody} onChange={(e) => setRequestBody(e.target.value)} rows={12}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-amber-400 placeholder-gray-600 focus:border-aida-accent focus:outline-none resize-y" />
            </div>
          )}

          {response !== null && (
            <div>
              <div className="mb-1 flex items-center gap-3">
                <span className="text-xs font-medium text-gray-500">Response</span>
                {responseStatus !== null && (
                  <span className={`text-xs font-bold ${statusColor}`}>
                    {responseStatus === 0 ? "Error" : `${responseStatus} ${responseStatus < 300 ? "OK" : responseStatus < 500 ? "Client Error" : "Server Error"}`}
                  </span>
                )}
                {responseTime !== null && (
                  <span className="text-xs text-gray-600">{responseTime}ms</span>
                )}
              </div>
              <pre className="max-h-96 overflow-auto rounded-lg border border-white/10 bg-black/30 p-4 font-mono text-sm text-green-400">
                <code>{response}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

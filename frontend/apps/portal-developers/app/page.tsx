"use client";

import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function api(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("access_token");
  return fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

type Section = "quickstart" | "docs" | "keys" | "usage" | "sandbox";

export default function PortalDevelopers() {
  const [isAuth, setIsAuth] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [section, setSection] = useState<Section>("quickstart");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) setIsAuth(true);
  }, []);

  const login = async () => {
    setLoginError("");
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) { setLoginError("Credenciales invalidas"); return; }
      const data = await res.json();
      localStorage.setItem("access_token", data.access_token);
      if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
      setIsAuth(true);
    } catch { setLoginError("Error de conexion"); }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setIsAuth(false);
  };

  if (!isAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md space-y-6 rounded-xl border border-white/10 bg-white/5 p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-aida-highlight font-bold text-xl">A</div>
            <h1 className="text-2xl font-bold">AIDA Developers</h1>
            <p className="mt-1 text-sm text-gray-400">Inicie sesion para gestionar sus API keys</p>
          </div>
          <div className="space-y-4">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-aida-highlight focus:outline-none" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password"
              onKeyDown={(e) => e.key === "Enter" && login()}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-aida-highlight focus:outline-none" />
            {loginError && <p className="text-sm text-red-400">{loginError}</p>}
            <button onClick={login} className="w-full rounded-lg bg-aida-highlight py-3 font-medium text-white hover:bg-red-500">
              Iniciar Sesion
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "quickstart" as const, label: "Quick Start", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
    { id: "docs" as const, label: "API Docs", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { id: "keys" as const, label: "API Keys", icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" },
    { id: "usage" as const, label: "Usage", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    { id: "sandbox" as const, label: "Sandbox", icon: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-white/10 px-6 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-aida-highlight text-sm font-bold">A</div>
            <span className="font-bold">AIDA Developers</span>
          </div>
          <div className="flex items-center gap-4">
            <nav className="flex gap-1">
              {tabs.map((t) => (
                <button key={t.id} onClick={() => setSection(t.id)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${section === t.id ? "bg-aida-highlight text-white" : "text-gray-400 hover:text-white"}`}>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
                  </svg>
                  {t.label}
                </button>
              ))}
            </nav>
            <button onClick={logout} className="rounded border border-white/20 px-3 py-1.5 text-xs text-gray-400 hover:text-white">
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {section === "quickstart" && <QuickStartSection />}
        {section === "docs" && <APIDocsSection />}
        {section === "keys" && <APIKeysSection />}
        {section === "usage" && <UsageSection />}
        {section === "sandbox" && <SandboxSection />}
      </main>
    </div>
  );
}

/* ===================== QUICKSTART ===================== */
function QuickStartSection() {
  const [data, setData] = useState<any>(null);
  const [lang, setLang] = useState<"curl" | "python" | "javascript">("curl");

  useEffect(() => {
    api("/developers/quickstart").then(r => r.json()).then(setData).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Quick Start</h2>
        <p className="mt-1 text-gray-400">Integre AIDA en su sistema en minutos</p>
      </div>

      {data?.steps && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {data.steps.map((s: any) => (
            <div key={s.step} className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-aida-highlight text-sm font-bold">{s.step}</div>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-gray-400">{s.description}</p>
            </div>
          ))}
        </div>
      )}

      {data?.code_examples && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Ejemplo de integracion</h3>
            <div className="flex gap-1 rounded-lg bg-white/5 p-1">
              {(["curl", "python", "javascript"] as const).map((l) => (
                <button key={l} onClick={() => setLang(l)}
                  className={`rounded px-3 py-1 text-xs font-medium transition ${lang === l ? "bg-aida-highlight text-white" : "text-gray-400 hover:text-white"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-black/50 p-4 text-sm text-green-400">
            <code>{data.code_examples[lang]}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

/* ===================== API DOCS ===================== */
function APIDocsSection() {
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

/* ===================== API KEYS ===================== */
function APIKeysSection() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = () => {
    setLoading(true);
    api("/developers/api-keys").then(r => r.json()).then(d => setKeys(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    const res = await api("/developers/api-keys", {
      method: "POST",
      body: JSON.stringify({ name, description: desc || null }),
    });
    if (res.ok) {
      const data = await res.json();
      setNewKey(data.full_key);
      setShowCreate(false);
      setName("");
      setDesc("");
      load();
    }
  };

  const revoke = async (id: string) => {
    await api(`/developers/api-keys/${id}`, { method: "DELETE" });
    load();
  };

  const copyKey = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Keys</h2>
          <p className="mt-1 text-gray-400">Gestione sus llaves de acceso a la API fiscal</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="rounded-lg bg-aida-highlight px-4 py-2.5 text-sm font-medium text-white hover:bg-red-500">
          + Nueva API Key
        </button>
      </div>

      {newKey && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
          <p className="mb-2 text-sm font-medium text-green-400">API Key creada exitosamente. Copiela ahora, no se mostrara nuevamente.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-black/30 p-2 font-mono text-sm text-green-300">{newKey}</code>
            <button onClick={copyKey} className="rounded bg-green-600 px-3 py-2 text-xs text-white hover:bg-green-700">
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
          <button onClick={() => setNewKey(null)} className="mt-2 text-xs text-gray-400 hover:text-white">Cerrar</button>
        </div>
      )}

      {showCreate && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 font-semibold">Crear API Key</h3>
          <div className="space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre (ej: Produccion, Testing)"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 focus:border-aida-highlight focus:outline-none" />
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descripcion (opcional)"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 focus:border-aida-highlight focus:outline-none" />
            <div className="flex gap-2">
              <button onClick={create} disabled={!name.trim()} className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50">Crear</button>
              <button onClick={() => setShowCreate(false)} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-white/5">
        {loading ? (
          <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-aida-highlight border-t-transparent" /></div>
        ) : keys.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">No tiene API keys. Cree una para comenzar a integrar.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {keys.map((k: any) => (
              <div key={k.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{k.name}</p>
                  <p className="text-xs text-gray-500">{k.description || "Sin descripcion"}</p>
                  <p className="mt-1 font-mono text-xs text-gray-400">{k.key_prefix}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${k.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                    {k.is_active ? "Activa" : "Revocada"}
                  </span>
                  <span className="text-xs text-gray-500">{new Date(k.created_at).toLocaleDateString("es-VE")}</span>
                  {k.is_active && (
                    <button onClick={() => revoke(k.id)} className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-500/10">Revocar</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ===================== USAGE ===================== */
function UsageSection() {
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/developers/usage").then(r => r.json()).then(setUsage).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Metricas de Uso</h2>
        <p className="mt-1 text-gray-400">Monitoree el consumo de su integracion con AIDA</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-aida-highlight border-t-transparent" /></div>
      ) : usage ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { label: "Total requests", value: usage.total_requests, color: "text-blue-400" },
              { label: "Requests hoy", value: usage.requests_today, color: "text-green-400" },
              { label: "Requests este mes", value: usage.requests_this_month, color: "text-purple-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="mt-1 text-sm text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h3 className="mb-4 font-semibold">Por accion</h3>
              {Object.keys(usage.by_action || {}).length === 0 ? (
                <p className="text-sm text-gray-500">Sin datos aun</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(usage.by_action).map(([action, count]: [string, any]) => (
                    <div key={action} className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">{action}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-aida-highlight" style={{ width: `${Math.min(100, (count / usage.total_requests) * 100)}%` }} />
                        </div>
                        <span className="w-10 text-right text-xs text-gray-400">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h3 className="mb-4 font-semibold">Por recurso</h3>
              {Object.keys(usage.by_resource || {}).length === 0 ? (
                <p className="text-sm text-gray-500">Sin datos aun</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(usage.by_resource).map(([resource, count]: [string, any]) => (
                    <div key={resource} className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">{resource}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, (count / usage.total_requests) * 100)}%` }} />
                        </div>
                        <span className="w-10 text-right text-xs text-gray-400">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-500">No se pudieron cargar las metricas</div>
      )}
    </div>
  );
}

/* ===================== SANDBOX ===================== */

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

function SandboxSection() {
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

      {/* API Key input */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <label className="mb-2 block text-xs font-medium text-gray-400">API Key (opcional si usa sesion JWT)</label>
        <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="aida_sk_..." type="password"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-sm text-white placeholder-gray-600 focus:border-aida-highlight focus:outline-none" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Endpoint list */}
        <div className="lg:col-span-3 space-y-2">
          <h3 className="text-xs font-semibold uppercase text-gray-500 mb-3">Endpoints</h3>
          {SANDBOX_ENDPOINTS.map((ep) => (
            <button key={ep.id} onClick={() => selectEndpoint(ep)}
              className={`flex w-full items-center gap-2 rounded-lg p-3 text-left text-sm transition ${
                selected.id === ep.id
                  ? "bg-aida-highlight/10 border border-aida-highlight/30 text-white"
                  : "border border-white/5 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}>
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${methodColors[ep.method]}`}>{ep.method}</span>
              <span className="truncate">{ep.name}</span>
            </button>
          ))}
        </div>

        {/* Request/Response panel */}
        <div className="lg:col-span-9 space-y-4">
          {/* URL bar */}
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2">
            <span className={`rounded px-2 py-1 text-xs font-bold ${methodColors[selected.method]}`}>{selected.method}</span>
            <code className="flex-1 text-sm text-gray-300">{selected.path}{queryParams ? `?${queryParams}` : ""}</code>
            <span className="rounded bg-white/5 px-2 py-1 text-[10px] text-gray-500">{selected.auth}</span>
            <button onClick={execute} disabled={loading}
              className="rounded-lg bg-aida-highlight px-4 py-2 text-sm font-medium text-white hover:bg-cyan-600 transition disabled:opacity-50">
              {loading ? "Enviando..." : "Enviar"}
            </button>
          </div>

          {/* Query params (for GET) */}
          {selected.method === "GET" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Query Parameters</label>
              <input value={queryParams} onChange={(e) => setQueryParams(e.target.value)} placeholder="key=value&key2=value2"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-sm text-white placeholder-gray-600 focus:border-aida-highlight focus:outline-none" />
            </div>
          )}

          {/* Request body (for POST/PUT) */}
          {(selected.method === "POST" || selected.method === "PUT") && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Request Body (JSON)</label>
              <textarea value={requestBody} onChange={(e) => setRequestBody(e.target.value)} rows={12}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-amber-400 placeholder-gray-600 focus:border-aida-highlight focus:outline-none resize-y" />
            </div>
          )}

          {/* Response */}
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

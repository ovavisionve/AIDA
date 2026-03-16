"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

export default function ErrorManager({ token }: { token: string }) {
  const [errors, setErrors] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [openCount, setOpenCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("open");
  const [severityFilter, setSeverityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Selected for bulk ops
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const loadErrors = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (severityFilter) params.set("severity", severityFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    params.set("limit", "50");

    fetch(`${API}/portal5/errors?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setErrors(data.items || []);
        setTotal(data.total || 0);
        setOpenCount(data.open_count || 0);
        setCriticalCount(data.critical_count || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const loadStats = () => {
    fetch(`${API}/portal5/errors/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  };

  useEffect(() => { loadErrors(); loadStats(); }, [statusFilter, severityFilter, categoryFilter]);

  const resolveError = async (id: string) => {
    const notes = prompt("Notas de resolución:");
    if (!notes) return;
    await fetch(`${API}/portal5/errors/${id}/resolve`, {
      method: "PUT", headers,
      body: JSON.stringify({ resolution_notes: notes }),
    });
    loadErrors(); loadStats();
  };

  const retryError = async (id: string) => {
    await fetch(`${API}/portal5/errors/${id}/retry`, { method: "POST", headers });
    loadErrors();
  };

  const bulkResolve = async () => {
    if (selected.size === 0) return;
    await fetch(`${API}/portal5/errors/bulk-resolve`, {
      method: "POST", headers,
      body: JSON.stringify({ error_ids: Array.from(selected) }),
    });
    setSelected(new Set());
    loadErrors(); loadStats();
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const sevColors: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400",
    high: "bg-orange-500/20 text-orange-400",
    medium: "bg-yellow-500/20 text-yellow-400",
    low: "bg-blue-500/20 text-blue-400",
  };

  const [showSeniatCodes, setShowSeniatCodes] = useState(false);

  const catColors: Record<string, string> = {
    connection: "bg-blue-500/10 text-blue-400",
    authentication: "bg-purple-500/10 text-purple-400",
    mapping: "bg-green-500/10 text-green-400",
    validation: "bg-yellow-500/10 text-yellow-400",
    fiscal: "bg-red-500/10 text-red-400",
    sync: "bg-orange-500/10 text-orange-400",
    webhook: "bg-pink-500/10 text-pink-400",
    system: "bg-gray-500/10 text-gray-400",
    seniat_validation: "bg-emerald-500/10 text-emerald-400",
    seniat_rejected: "bg-red-500/10 text-red-300",
    seniat_auth: "bg-amber-500/10 text-amber-400",
    seniat_duplicate: "bg-cyan-500/10 text-cyan-400",
  };

  const SENIAT_ERROR_CODES = [
    { code: "200", label: "Aceptado", color: "text-green-400", bg: "bg-green-500/10", desc: "Documento procesado exitosamente por SENIAT" },
    { code: "201", label: "Duplicado", color: "text-yellow-400", bg: "bg-yellow-500/10", desc: "Documento ya fue enviado previamente, no se reprocesa" },
    { code: "203", label: "Rechazado", color: "text-red-400", bg: "bg-red-500/10", desc: "Rechazado por errores de validación (ver detalle)" },
    { code: "400", label: "JSON Inválido", color: "text-red-400", bg: "bg-red-500/10", desc: "JSON mal formado o estructura inválida" },
    { code: "401", label: "No Autorizado", color: "text-orange-400", bg: "bg-orange-500/10", desc: "Token inválido, expirado o no proporcionado" },
    { code: "500", label: "Error Interno", color: "text-red-400", bg: "bg-red-500/10", desc: "Error del servidor SENIAT, reintentar con backoff" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Gestion de Errores</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">Abiertos: <strong className="text-red-400">{openCount}</strong></span>
          <span className="text-gray-500">Criticos: <strong className="text-red-400">{criticalCount}</strong></span>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-gray-500 mb-2">Por Severidad</h3>
            <div className="flex gap-3">
              {Object.entries(stats.by_severity || {}).map(([sev, count]: any) => (
                <div key={sev} className="text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${sevColors[sev] || "bg-white/10 text-gray-400"}`}>{sev}</span>
                  <p className="font-bold mt-1 text-white">{count}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-gray-500 mb-2">Por Categoria</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.by_category || {}).map(([cat, count]: any) => (
                <span key={cat} className={`px-2 py-1 rounded text-xs ${catColors[cat] || "bg-white/5 text-gray-400"}`}>
                  {cat}: <strong>{count}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-500">Estado:</span>
          {["", "open", "investigating", "resolved", "ignored"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs transition ${statusFilter === s ? "bg-aida-accent text-white" : "border border-white/10 bg-white/5 text-gray-300"}`}>
              {s || "Todos"}
            </button>
          ))}
          <span className="text-sm text-gray-500 ml-2">Severidad:</span>
          {["", "critical", "high", "medium", "low"].map(s => (
            <button key={s} onClick={() => setSeverityFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs transition ${severityFilter === s ? "bg-aida-accent text-white" : "border border-white/10 bg-white/5 text-gray-300"}`}>
              {s || "Todas"}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-500">Categoría:</span>
          {["", "connection", "authentication", "mapping", "validation", "fiscal", "sync", "webhook", "seniat_validation", "seniat_rejected", "system"].map(c => (
            <button key={c} onClick={() => setCategoryFilter(c)}
              className={`px-3 py-1 rounded-lg text-xs transition ${categoryFilter === c ? "bg-aida-accent text-white" : "border border-white/10 bg-white/5 text-gray-300"}`}>
              {c || "Todas"}
            </button>
          ))}
        </div>
      </div>

      {/* SENIAT V1.4 Error Codes Reference */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 overflow-hidden">
        <button onClick={() => setShowSeniatCodes(!showSeniatCodes)}
          className="w-full flex items-center justify-between p-4 hover:bg-emerald-500/5 transition">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs font-semibold">SENIAT V1.4</span>
            <span className="text-sm text-gray-300">Códigos de respuesta SENIAT</span>
          </div>
          <svg className={`w-4 h-4 text-gray-500 transition-transform ${showSeniatCodes ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showSeniatCodes && (
          <div className="border-t border-emerald-500/10 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {SENIAT_ERROR_CODES.map(ec => (
                <div key={ec.code} className={`rounded-lg ${ec.bg} p-3`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-mono font-bold text-lg ${ec.color}`}>{ec.code}</span>
                    <span className={`text-xs font-semibold ${ec.color}`}>{ec.label}</span>
                  </div>
                  <p className="text-xs text-gray-400">{ec.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-500 mt-3">
              Los errores con código 203 (Rechazado) incluyen detalle campo por campo. Los 500 deben reintentarse con backoff exponencial.
            </p>
          </div>
        )}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg flex items-center gap-3">
          <span className="text-sm text-blue-400">{selected.size} seleccionados</span>
          <button onClick={bulkResolve}
            className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700">
            Resolver Seleccionados
          </button>
          <button onClick={() => setSelected(new Set())}
            className="text-blue-400 text-xs hover:underline">Deseleccionar</button>
        </div>
      )}

      {/* Error list */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-aida-accent border-t-transparent rounded-full" /></div>
      ) : errors.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No hay errores con estos filtros</div>
      ) : (
        <div className="space-y-2">
          {errors.map((err: any) => (
            <div key={err.id} className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/[0.08] transition">
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={selected.has(err.id)}
                  onChange={() => toggleSelect(err.id)} className="mt-1 rounded" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${sevColors[err.severity] || "bg-white/10 text-gray-400"}`}>
                      {err.severity}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${catColors[err.category] || "bg-white/5 text-gray-400"}`}>
                      {err.category}
                    </span>
                    <span className="font-mono text-xs text-gray-500">{err.error_code}</span>
                    {err.category?.startsWith("seniat") && (
                      <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-semibold">SENIAT</span>
                    )}
                    {err.occurrence_count > 1 && (
                      <span className="text-xs text-gray-500">x{err.occurrence_count}</span>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm mt-1 text-white">{err.title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{err.message}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>Primera vez: {new Date(err.first_seen_at).toLocaleString()}</span>
                    <span>Ultima vez: {new Date(err.last_seen_at).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  {err.status === "open" && (
                    <>
                      <button onClick={() => resolveError(err.id)}
                        className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded hover:bg-green-500/30">
                        Resolver
                      </button>
                      {err.is_retryable && (
                        <button onClick={() => retryError(err.id)}
                          className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded hover:bg-blue-500/30">
                          Reintentar
                        </button>
                      )}
                    </>
                  )}
                  {err.status === "resolved" && (
                    <span className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded">Resuelto</span>
                  )}
                  {err.status === "ignored" && (
                    <span className="text-xs bg-white/5 text-gray-500 px-2 py-1 rounded">Ignorado</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

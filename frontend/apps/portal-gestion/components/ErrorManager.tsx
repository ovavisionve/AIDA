"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

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
    critical: "bg-red-100 text-red-700",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-blue-100 text-blue-700",
  };

  const catColors: Record<string, string> = {
    connection: "bg-blue-50 text-blue-600",
    authentication: "bg-purple-50 text-purple-600",
    mapping: "bg-green-50 text-green-600",
    validation: "bg-yellow-50 text-yellow-600",
    fiscal: "bg-red-50 text-red-600",
    sync: "bg-orange-50 text-orange-600",
    webhook: "bg-pink-50 text-pink-600",
    system: "bg-gray-50 text-gray-600",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Errores</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">Abiertos: <strong className="text-red-600">{openCount}</strong></span>
          <span className="text-gray-500">Críticos: <strong className="text-red-600">{criticalCount}</strong></span>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-500 mb-2">Por Severidad</h3>
            <div className="flex gap-3">
              {Object.entries(stats.by_severity || {}).map(([sev, count]: any) => (
                <div key={sev} className="text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${sevColors[sev] || "bg-gray-100"}`}>{sev}</span>
                  <p className="font-bold mt-1">{count}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-500 mb-2">Por Categoría</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.by_category || {}).map(([cat, count]: any) => (
                <span key={cat} className={`px-2 py-1 rounded text-xs ${catColors[cat] || "bg-gray-50"}`}>
                  {cat}: <strong>{count}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-gray-500">Estado:</span>
        {["", "open", "investigating", "resolved", "ignored"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-lg text-xs transition ${statusFilter === s ? "bg-aida-accent text-white" : "bg-white border"}`}>
            {s || "Todos"}
          </button>
        ))}
        <span className="text-sm text-gray-500 ml-2">Severidad:</span>
        {["", "critical", "high", "medium", "low"].map(s => (
          <button key={s} onClick={() => setSeverityFilter(s)}
            className={`px-3 py-1 rounded-lg text-xs transition ${severityFilter === s ? "bg-aida-accent text-white" : "bg-white border"}`}>
            {s || "Todas"}
          </button>
        ))}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="bg-blue-50 p-3 rounded-lg flex items-center gap-3">
          <span className="text-sm text-blue-700">{selected.size} seleccionados</span>
          <button onClick={bulkResolve}
            className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700">
            Resolver Seleccionados
          </button>
          <button onClick={() => setSelected(new Set())}
            className="text-blue-600 text-xs hover:underline">Deseleccionar</button>
        </div>
      )}

      {/* Error list */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-aida-accent border-t-transparent rounded-full" /></div>
      ) : errors.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No hay errores con estos filtros</div>
      ) : (
        <div className="space-y-2">
          {errors.map((err: any) => (
            <div key={err.id} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition">
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={selected.has(err.id)}
                  onChange={() => toggleSelect(err.id)} className="mt-1 rounded" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${sevColors[err.severity] || "bg-gray-100"}`}>
                      {err.severity}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${catColors[err.category] || "bg-gray-50"}`}>
                      {err.category}
                    </span>
                    <span className="font-mono text-xs text-gray-400">{err.error_code}</span>
                    {err.occurrence_count > 1 && (
                      <span className="text-xs text-gray-500">x{err.occurrence_count}</span>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm mt-1">{err.title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{err.message}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    <span>Primera vez: {new Date(err.first_seen_at).toLocaleString()}</span>
                    <span>Última vez: {new Date(err.last_seen_at).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  {err.status === "open" && (
                    <>
                      <button onClick={() => resolveError(err.id)}
                        className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200">
                        Resolver
                      </button>
                      {err.is_retryable && (
                        <button onClick={() => retryError(err.id)}
                          className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200">
                          Reintentar
                        </button>
                      )}
                    </>
                  )}
                  {err.status === "resolved" && (
                    <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded">Resuelto</span>
                  )}
                  {err.status === "ignored" && (
                    <span className="text-xs bg-gray-50 text-gray-500 px-2 py-1 rounded">Ignorado</span>
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

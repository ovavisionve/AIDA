"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

export default function ConnectionList({ token }: { token: string }) {
  const [connections, setConnections] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [testing, setTesting] = useState<string | null>(null);

  const headers = { Authorization: `Bearer ${token}` };

  const loadConnections = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    fetch(`${API}/portal5/connections?${params}`, { headers })
      .then(r => r.json())
      .then(data => {
        setConnections(data.items || []);
        setTotal(data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadConnections(); }, [statusFilter]);

  const testConnection = async (id: string) => {
    setTesting(id);
    try {
      const res = await fetch(`${API}/portal5/connections/${id}/test`, {
        method: "POST", headers,
      });
      const data = await res.json();
      alert(data.success ? `Conexión OK (${data.latency_ms}ms)` : `Error: ${data.message}`);
      loadConnections();
    } catch {
      alert("Error al probar conexión");
    } finally {
      setTesting(null);
    }
  };

  const statusColors: Record<string, string> = {
    activa: "bg-green-500/20 text-green-400",
    testing: "bg-blue-500/20 text-blue-400",
    configurando: "bg-yellow-500/20 text-yellow-400",
    pausada: "bg-gray-500/20 text-gray-400",
    error: "bg-red-500/20 text-red-400",
    desactivada: "bg-gray-500/20 text-gray-500",
  };

  const healthColors: Record<string, string> = {
    healthy: "bg-green-500",
    degraded: "bg-yellow-500",
    down: "bg-red-500",
    unknown: "bg-gray-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Conexiones de Integracion</h1>
        <span className="text-sm text-gray-500">{total} conexiones</span>
      </div>

      <div className="flex gap-2">
        {["", "activa", "testing", "configurando", "error", "pausada"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm transition ${
              statusFilter === s ? "bg-aida-accent text-white" : "border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
            }`}>
            {s || "Todos"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-aida-accent border-t-transparent rounded-full" /></div>
      ) : connections.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No hay conexiones. Use el Wizard para crear una.</div>
      ) : (
        <div className="space-y-3">
          {connections.map((c: any) => (
            <div key={c.id} className="rounded-xl border border-white/10 bg-white/5 p-5 hover:bg-white/[0.08] transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${healthColors[c.health_status] || "bg-gray-400"}`} />
                  <div>
                    <h3 className="font-semibold text-white">{c.name}</h3>
                    <p className="text-xs text-gray-500">
                      {c.template_name} &middot; {c.environment}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[c.status] || "bg-white/10 text-gray-400"}`}>
                    {c.status}
                  </span>
                  <button onClick={() => testConnection(c.id)} disabled={testing === c.id}
                    className="text-xs border border-white/10 text-gray-300 px-3 py-1.5 rounded-lg hover:bg-white/5 disabled:opacity-50">
                    {testing === c.id ? "Probando..." : "Test"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-4 text-sm">
                <div>
                  <span className="text-gray-500 text-xs">Docs Sincronizados</span>
                  <p className="font-semibold text-white">{c.total_documents_synced}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Errores</span>
                  <p className={`font-semibold ${c.total_errors > 0 ? "text-red-400" : "text-white"}`}>{c.total_errors}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Sync</span>
                  <p className="font-semibold text-white">{c.sync_enabled ? "Activo" : "Desactivado"}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Fallos Consecutivos</span>
                  <p className={`font-semibold ${c.consecutive_failures > 0 ? "text-red-400" : "text-white"}`}>{c.consecutive_failures}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Wizard</span>
                  <p className="font-semibold text-white">{c.wizard_completed ? "Completo" : `Paso ${c.wizard_step}/6`}</p>
                </div>
              </div>

              {c.system_base_url && (
                <div className="mt-2 text-xs text-gray-500 font-mono truncate">{c.system_base_url}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

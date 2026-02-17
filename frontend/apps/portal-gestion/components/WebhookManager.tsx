"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function WebhookManager({ token }: { token: string }) {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedLogs, setSelectedLogs] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [events, setEvents] = useState<string[]>([]);

  // Form
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [clientId, setClientId] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["document.emitted", "document.voided"]);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const loadWebhooks = () => {
    setLoading(true);
    fetch(`${API}/portal5/webhooks`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setWebhooks(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadWebhooks();
    fetch(`${API}/portal5/webhook-events`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setEvents(data.events || []))
      .catch(() => {});
  }, []);

  const createWebhook = async () => {
    if (!name || !url || !clientId) return;
    try {
      const res = await fetch(`${API}/portal5/webhooks?client_id=${clientId}`, {
        method: "POST", headers,
        body: JSON.stringify({ name, url, events: selectedEvents, retry_count: 3, timeout_seconds: 30 }),
      });
      if (res.ok) {
        setShowCreate(false);
        setName(""); setUrl("");
        loadWebhooks();
      }
    } catch {}
  };

  const testWebhook = async (id: string) => {
    try {
      const res = await fetch(`${API}/portal5/webhooks/${id}/test`, {
        method: "POST", headers, body: JSON.stringify({ event: "test.ping" }),
      });
      const data = await res.json();
      alert(data.success ? `Test OK (${data.response_time_ms}ms)` : `Error: ${data.error}`);
    } catch { alert("Error al probar webhook"); }
  };

  const toggleWebhook = async (id: string, active: boolean) => {
    await fetch(`${API}/portal5/webhooks/${id}`, {
      method: "PUT", headers,
      body: JSON.stringify({ is_active: !active }),
    });
    loadWebhooks();
  };

  const deleteWebhook = async (id: string) => {
    if (!confirm("¿Eliminar este webhook?")) return;
    await fetch(`${API}/portal5/webhooks/${id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    loadWebhooks();
  };

  const loadLogs = async (id: string) => {
    setSelectedLogs(id);
    const res = await fetch(`${API}/portal5/webhooks/${id}/logs?limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setLogs(data.items || []);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Webhooks</h1>
        <button onClick={() => setShowCreate(!showCreate)}
          className="bg-aida-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-aida-accent/80 transition">
          + Nuevo Webhook
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h3 className="font-semibold text-white">Nuevo Webhook</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input value={name} onChange={e => setName(e.target.value)}
              className="bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-aida-accent" placeholder="Nombre" />
            <input value={url} onChange={e => setUrl(e.target.value)}
              className="bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-aida-accent" placeholder="URL (https://...)" />
            <input value={clientId} onChange={e => setClientId(e.target.value)}
              className="bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-aida-accent" placeholder="Client ID (UUID)" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Eventos:</label>
            <div className="flex flex-wrap gap-2">
              {events.map(evt => (
                <label key={evt} className="flex items-center gap-1.5 text-xs text-gray-300">
                  <input type="checkbox" checked={selectedEvents.includes(evt)}
                    onChange={e => {
                      if (e.target.checked) setSelectedEvents([...selectedEvents, evt]);
                      else setSelectedEvents(selectedEvents.filter(x => x !== evt));
                    }} className="rounded" />
                  {evt}
                </label>
              ))}
            </div>
          </div>
          <button onClick={createWebhook}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition">
            Crear
          </button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-aida-accent border-t-transparent rounded-full" /></div>
      ) : webhooks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No hay webhooks configurados</div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((w: any) => (
            <div key={w.id} className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${w.is_active ? "bg-green-500" : "bg-gray-400"}`} />
                    <h3 className="font-semibold text-white">{w.name}</h3>
                  </div>
                  <p className="text-xs text-gray-500 font-mono mt-1 truncate max-w-md">{w.url}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => testWebhook(w.id)}
                    className="text-xs border border-white/10 text-gray-300 px-3 py-1.5 rounded-lg hover:bg-white/5">Test</button>
                  <button onClick={() => loadLogs(w.id)}
                    className="text-xs border border-white/10 text-gray-300 px-3 py-1.5 rounded-lg hover:bg-white/5">Logs</button>
                  <button onClick={() => toggleWebhook(w.id, w.is_active)}
                    className={`text-xs px-3 py-1.5 rounded-lg ${w.is_active ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"}`}>
                    {w.is_active ? "Pausar" : "Activar"}
                  </button>
                  <button onClick={() => deleteWebhook(w.id)}
                    className="text-xs text-red-400 px-2 py-1.5 rounded-lg hover:bg-red-500/10">Eliminar</button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-3">
                {w.events?.map((e: string) => (
                  <span key={e} className="px-2 py-0.5 bg-white/10 text-gray-400 rounded text-xs">{e}</span>
                ))}
              </div>

              <div className="flex gap-6 mt-3 text-xs text-gray-500">
                <span>Enviados: <strong className="text-gray-300">{w.total_sent}</strong></span>
                <span>Fallidos: <strong className={w.total_failed > 0 ? "text-red-400" : "text-gray-300"}>{w.total_failed}</strong></span>
                {w.last_status_code && <span>Ultimo: <strong className="text-gray-300">{w.last_status_code}</strong></span>}
                {w.last_error && <span className="text-red-400 truncate max-w-xs">{w.last_error}</span>}
              </div>

              {/* Logs inline */}
              {selectedLogs === w.id && logs.length > 0 && (
                <div className="mt-3 border-t border-white/10 pt-3">
                  <h4 className="text-xs font-semibold text-gray-500 mb-2">Ultimas entregas:</h4>
                  <div className="space-y-1 max-h-40 overflow-auto">
                    {logs.map((l: any) => (
                      <div key={l.id} className="flex items-center gap-3 text-xs py-1">
                        <span className={`px-1.5 py-0.5 rounded ${
                          l.status === "sent" ? "bg-green-500/20 text-green-400"
                            : l.status === "failed" || l.status === "exhausted" ? "bg-red-500/20 text-red-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}>{l.status}</span>
                        <span className="text-gray-400">{l.event}</span>
                        <span className="text-gray-500">{l.status_code || "-"}</span>
                        <span className="text-gray-500">{l.response_time_ms}ms</span>
                        {l.error_message && <span className="text-red-400 truncate">{l.error_message}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

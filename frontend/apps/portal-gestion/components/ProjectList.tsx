"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function ProjectList({ token }: { token: string }) {
  const [projects, setProjects] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  // Create form
  const [clientId, setClientId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [integrationType, setIntegrationType] = useState("api_directa");
  const [priority, setPriority] = useState("media");

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const loadProjects = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    fetch(`${API}/portal5/projects?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setProjects(data.items || []);
        setTotal(data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProjects(); }, [statusFilter]);

  const createProject = async () => {
    if (!clientId || !name) return;
    try {
      const res = await fetch(`${API}/portal5/projects`, {
        method: "POST", headers,
        body: JSON.stringify({
          client_id: clientId, name, description,
          integration_type: integrationType, priority,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setClientId(""); setName(""); setDescription("");
        loadProjects();
      }
    } catch {}
  };

  const updateStatus = async (id: string, newStatus: string) => {
    await fetch(`${API}/portal5/projects/${id}`, {
      method: "PUT", headers,
      body: JSON.stringify({ status: newStatus }),
    });
    loadProjects();
  };

  const statusColors: Record<string, string> = {
    planificacion: "bg-gray-500/20 text-gray-400",
    desarrollo: "bg-blue-500/20 text-blue-400",
    testing: "bg-yellow-500/20 text-yellow-400",
    produccion: "bg-green-500/20 text-green-400",
    pausado: "bg-red-500/20 text-red-400",
  };

  const priorityColors: Record<string, string> = {
    baja: "text-gray-500",
    media: "text-blue-400",
    alta: "text-orange-400",
    critica: "text-red-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Proyectos de Integracion</h1>
        <button onClick={() => setShowCreate(!showCreate)}
          className="bg-aida-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-aida-accent/80 transition">
          + Nuevo Proyecto
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["", "planificacion", "desarrollo", "testing", "produccion", "pausado"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm transition ${
              statusFilter === s ? "bg-aida-accent text-white" : "border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
            }`}>
            {s || "Todos"}
          </button>
        ))}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h3 className="font-semibold text-white">Nuevo Proyecto</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={clientId} onChange={e => setClientId(e.target.value)}
              className="bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-aida-accent" placeholder="Client ID (UUID)" />
            <input value={name} onChange={e => setName(e.target.value)}
              className="bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-aida-accent" placeholder="Nombre del proyecto" />
            <select value={integrationType} onChange={e => setIntegrationType(e.target.value)}
              className="bg-[#0a0f1a] border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-aida-accent">
              <option value="api_directa">API Directa</option>
              <option value="odoo">Odoo</option>
              <option value="sap_b1">SAP Business One</option>
              <option value="woocommerce">WooCommerce</option>
              <option value="prestashop">PrestaShop</option>
              <option value="contpaqi">CONTPAQi</option>
              <option value="custom">Custom</option>
            </select>
            <select value={priority} onChange={e => setPriority(e.target.value)}
              className="bg-[#0a0f1a] border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-aida-accent">
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="critica">Critica</option>
            </select>
          </div>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-aida-accent" rows={2} placeholder="Descripcion (opcional)" />
          <button onClick={createProject}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition">
            Crear Proyecto
          </button>
        </div>
      )}

      {/* Projects */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-aida-accent border-t-transparent rounded-full" /></div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No hay proyectos</div>
      ) : (
        <div className="space-y-3">
          {projects.map((p: any) => (
            <div key={p.id} className="rounded-xl border border-white/10 bg-white/5 p-5 hover:bg-white/[0.08] transition">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{p.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[p.status] || "bg-white/10 text-gray-400"}`}>
                      {p.status}
                    </span>
                    <span className={`text-xs font-medium ${priorityColors[p.priority] || ""}`}>
                      {p.priority === "critica" ? "🔴" : p.priority === "alta" ? "🟠" : ""} {p.priority}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {p.integration_type} &middot; {p.environment}
                    {p.description && ` &middot; ${p.description}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select value={p.status}
                    onChange={e => updateStatus(p.id, e.target.value)}
                    className="text-xs bg-[#0a0f1a] border border-white/10 text-white rounded-lg px-2 py-1 focus:outline-none focus:border-aida-accent">
                    <option value="planificacion">Planificacion</option>
                    <option value="desarrollo">Desarrollo</option>
                    <option value="testing">Testing</option>
                    <option value="produccion">Produccion</option>
                    <option value="pausado">Pausado</option>
                  </select>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Progreso</span>
                  <span>{p.progress}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${
                    p.progress >= 100 ? "bg-green-500"
                      : p.progress >= 50 ? "bg-blue-500"
                      : "bg-yellow-500"
                  }`} style={{ width: `${p.progress}%` }} />
                </div>
              </div>

              <div className="flex gap-6 mt-3 text-xs text-gray-500">
                {p.fecha_inicio && <span>Inicio: {new Date(p.fecha_inicio).toLocaleDateString()}</span>}
                {p.fecha_estimada_fin && <span>Est. fin: {new Date(p.fecha_estimada_fin).toLocaleDateString()}</span>}
                {p.fecha_produccion && <span>Produccion: {new Date(p.fecha_produccion).toLocaleDateString()}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

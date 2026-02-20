"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

interface Agent {
  id: string;
  client_id: string;
  client_name: string | null;
  client_rif: string | null;
  agent_name: string;
  erp_type: string;
  erp_display: string | null;
  status: string;
  can_read_code: boolean;
  can_write_code: boolean;
  can_test_connection: boolean;
  can_modify_mapping: boolean;
  integration_notes: string | null;
  custom_instructions: string | null;
  total_sessions: number;
  total_messages: number;
  total_tokens_used: number;
  created_at: string;
}

interface Session {
  id: string;
  user_id: string;
  title: string;
  status: string;
  message_count: number;
  tokens_used: number;
  started_at: string;
  last_activity: string;
}

interface ErpType {
  code: string;
  name: string;
}

interface ClientOption {
  id: string;
  razon_social: string;
  rif: string;
}

export default function IntegrationsSection() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [erpTypes, setErpTypes] = useState<ErpType[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [sessionsAgent, setSessionsAgent] = useState<Agent | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Create form
  const [form, setForm] = useState({
    client_id: "",
    agent_name: "",
    erp_type: "api_directa",
    integration_notes: "",
    custom_instructions: "",
    can_read_code: true,
    can_write_code: false,
    can_test_connection: true,
    can_modify_mapping: true,
  });
  const [saving, setSaving] = useState(false);

  const loadAgents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), page_size: "15" });
      if (filterStatus) params.set("status", filterStatus);
      const r = await api(`/admin/integration-agents?${params}`);
      const d = await r.json();
      setAgents(d.items || []);
      setTotal(d.total || 0);
    } catch (e) {
      console.error("Error loading agents:", e);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  const loadMeta = useCallback(async () => {
    try {
      const [erpR, clientsR] = await Promise.all([
        api("/admin/erp-types"),
        api("/clients?page_size=200"),
      ]);
      const erpD = await erpR.json();
      setErpTypes(Array.isArray(erpD) ? erpD : []);
      const clientsD = await clientsR.json();
      setClients(
        (clientsD.items || []).map((c: { id: string; razon_social: string; rif: string }) => ({
          id: c.id,
          razon_social: c.razon_social,
          rif: c.rif,
        }))
      );
    } catch (e) {
      console.error("Error loading metadata:", e);
    }
  }, []);

  useEffect(() => { loadAgents(); }, [loadAgents]);
  useEffect(() => { loadMeta(); }, [loadMeta]);

  const handleCreate = async () => {
    if (!form.client_id || !form.agent_name) return;
    setSaving(true);
    try {
      const r = await api("/admin/integration-agents", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (r.ok) {
        setShowCreate(false);
        setForm({ client_id: "", agent_name: "", erp_type: "api_directa", integration_notes: "", custom_instructions: "", can_read_code: true, can_write_code: false, can_test_connection: true, can_modify_mapping: true });
        loadAgents();
      }
    } catch (e) {
      console.error("Error creating agent:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editAgent) return;
    setSaving(true);
    try {
      const r = await api(`/admin/integration-agents/${editAgent.id}`, {
        method: "PUT",
        body: JSON.stringify({
          agent_name: editAgent.agent_name,
          erp_type: editAgent.erp_type,
          status: editAgent.status,
          integration_notes: editAgent.integration_notes,
          custom_instructions: editAgent.custom_instructions,
          can_read_code: editAgent.can_read_code,
          can_write_code: editAgent.can_write_code,
          can_test_connection: editAgent.can_test_connection,
          can_modify_mapping: editAgent.can_modify_mapping,
        }),
      });
      if (r.ok) {
        setEditAgent(null);
        loadAgents();
      }
    } catch (e) {
      console.error("Error updating agent:", e);
    } finally {
      setSaving(false);
    }
  };

  const loadSessions = async (agent: Agent) => {
    setSessionsAgent(agent);
    setSessionsLoading(true);
    try {
      const r = await api(`/admin/integration-agents/${agent.id}/sessions`);
      const d = await r.json();
      setSessions(d.items || []);
    } catch (e) {
      console.error("Error loading sessions:", e);
    } finally {
      setSessionsLoading(false);
    }
  };

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = {
      active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      paused: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      archived: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs border ${colors[s] || colors.archived}`}>
        {s === "active" ? "Activo" : s === "paused" ? "Pausado" : "Archivado"}
      </span>
    );
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Agentes de Integración IA</h2>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona los agentes IA que asisten a los clientes en su integración con AIDA
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-aida-accent text-white px-4 py-2 rounded-lg hover:bg-aida-accent/80 transition text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Agente
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Agentes", value: total, color: "text-aida-cyan" },
          { label: "Activos", value: agents.filter(a => a.status === "active").length, color: "text-emerald-400" },
          { label: "Total Sesiones", value: agents.reduce((s, a) => s + a.total_sessions, 0), color: "text-violet-400" },
          { label: "Total Mensajes", value: agents.reduce((s, a) => s + a.total_messages, 0), color: "text-amber-400" },
        ].map(c => (
          <div key={c.label} className="rounded-xl bg-white/5 border border-white/10 p-4">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["", "active", "paused", "archived"].map(s => (
          <button
            key={s}
            onClick={() => { setFilterStatus(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs transition ${
              filterStatus === s
                ? "bg-aida-accent/20 text-aida-cyan border border-aida-accent/30"
                : "text-gray-400 hover:bg-white/5"
            }`}
          >
            {s === "" ? "Todos" : s === "active" ? "Activos" : s === "paused" ? "Pausados" : "Archivados"}
          </button>
        ))}
      </div>

      {/* Agents Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-aida-accent border-t-transparent" />
        </div>
      ) : agents.length === 0 ? (
        <div className="rounded-xl bg-white/5 border border-white/10 p-12 text-center">
          <p className="text-gray-400">No hay agentes configurados</p>
          <p className="text-sm text-gray-500 mt-1">Crea un agente para que tus clientes puedan recibir asistencia IA para su integración</p>
        </div>
      ) : (
        <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-gray-500 uppercase">
                <th className="px-4 py-3">Agente</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">ERP</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Sesiones</th>
                <th className="px-4 py-3">Mensajes</th>
                <th className="px-4 py-3">Creado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {agents.map(a => (
                <tr key={a.id} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="px-4 py-3 font-medium text-white">{a.agent_name}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-gray-300">{a.client_name || "—"}</p>
                      <p className="text-xs text-gray-500">{a.client_rif || ""}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{a.erp_display || a.erp_type}</td>
                  <td className="px-4 py-3">{statusBadge(a.status)}</td>
                  <td className="px-4 py-3 text-gray-400">{a.total_sessions}</td>
                  <td className="px-4 py-3 text-gray-400">{a.total_messages}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(a.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditAgent({ ...a })}
                        className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/10 rounded transition"
                        title="Editar"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => loadSessions(a)}
                        className="px-2 py-1 text-xs text-gray-400 hover:text-aida-cyan hover:bg-aida-accent/10 rounded transition"
                        title="Ver sesiones"
                      >
                        Sesiones
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > 15 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-xs text-gray-400 border border-white/10 rounded-lg hover:bg-white/5 disabled:opacity-30"
          >
            Anterior
          </button>
          <span className="px-3 py-1.5 text-xs text-gray-500">
            Página {page} de {Math.ceil(total / 15)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(total / 15)}
            className="px-3 py-1.5 text-xs text-gray-400 border border-white/10 rounded-lg hover:bg-white/5 disabled:opacity-30"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-[#0d1321] border border-white/10 p-6 shadow-2xl max-h-[90vh] overflow-auto">
            <h3 className="text-lg font-bold text-white mb-4">Nuevo Agente de Integración</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Cliente</label>
                <select
                  value={form.client_id}
                  onChange={e => setForm({ ...form, client_id: e.target.value })}
                  className="w-full rounded-lg bg-[#111827] border border-white/10 text-white px-3 py-2 text-sm focus:border-aida-accent focus:outline-none"
                >
                  <option value="" className="bg-[#111827] text-gray-400">Seleccionar cliente...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id} className="bg-[#111827] text-white">{c.razon_social} ({c.rif})</option>
                  ))}
                </select>
                {clients.length === 0 && (
                  <p className="text-[10px] text-amber-400 mt-1">Cargando clientes...</p>
                )}
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Nombre del Agente</label>
                <input
                  type="text"
                  value={form.agent_name}
                  onChange={e => setForm({ ...form, agent_name: e.target.value })}
                  placeholder="Ej: Agente Integración SAP - Imprenta Digital"
                  className="w-full rounded-lg bg-[#111827] border border-white/10 text-white px-3 py-2 text-sm focus:border-aida-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Tipo de ERP</label>
                <select
                  value={form.erp_type}
                  onChange={e => setForm({ ...form, erp_type: e.target.value })}
                  className="w-full rounded-lg bg-[#111827] border border-white/10 text-white px-3 py-2 text-sm focus:border-aida-accent focus:outline-none"
                >
                  {erpTypes.map(e => (
                    <option key={e.code} value={e.code} className="bg-[#111827] text-white">{e.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Notas de integración</label>
                <textarea
                  value={form.integration_notes}
                  onChange={e => setForm({ ...form, integration_notes: e.target.value })}
                  rows={3}
                  placeholder="Contexto sobre la integración del cliente, necesidades específicas..."
                  className="w-full rounded-lg bg-[#111827] border border-white/10 text-white px-3 py-2 text-sm focus:border-aida-accent focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Instrucciones personalizadas (para la IA)</label>
                <textarea
                  value={form.custom_instructions}
                  onChange={e => setForm({ ...form, custom_instructions: e.target.value })}
                  rows={3}
                  placeholder="Instrucciones adicionales para el agente IA al atender a este cliente..."
                  className="w-full rounded-lg bg-[#111827] border border-white/10 text-white px-3 py-2 text-sm focus:border-aida-accent focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-2">Capacidades del agente</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "can_read_code", label: "Leer código" },
                    { key: "can_write_code", label: "Escribir código" },
                    { key: "can_test_connection", label: "Probar conexión" },
                    { key: "can_modify_mapping", label: "Modificar mapeo" },
                  ].map(cap => (
                    <label key={cap.key} className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={form[cap.key as keyof typeof form] as boolean}
                        onChange={e => setForm({ ...form, [cap.key]: e.target.checked })}
                        className="rounded"
                      />
                      {cap.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.client_id || !form.agent_name || saving}
                className="px-4 py-2 text-sm bg-aida-accent text-white rounded-lg hover:bg-aida-accent/80 transition disabled:opacity-40"
              >
                {saving ? "Creando..." : "Crear Agente"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-[#0d1321] border border-white/10 p-6 shadow-2xl max-h-[90vh] overflow-auto">
            <h3 className="text-lg font-bold text-white mb-4">Editar Agente</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nombre del Agente</label>
                <input
                  type="text"
                  value={editAgent.agent_name}
                  onChange={e => setEditAgent({ ...editAgent, agent_name: e.target.value })}
                  className="w-full rounded-lg bg-[#111827] border border-white/10 text-white px-3 py-2 text-sm focus:border-aida-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Tipo de ERP</label>
                <select
                  value={editAgent.erp_type}
                  onChange={e => setEditAgent({ ...editAgent, erp_type: e.target.value })}
                  className="w-full rounded-lg bg-[#111827] border border-white/10 text-white px-3 py-2 text-sm focus:border-aida-accent focus:outline-none"
                >
                  {erpTypes.map(e => (
                    <option key={e.code} value={e.code}>{e.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Estado</label>
                <select
                  value={editAgent.status}
                  onChange={e => setEditAgent({ ...editAgent, status: e.target.value })}
                  className="w-full rounded-lg bg-[#111827] border border-white/10 text-white px-3 py-2 text-sm focus:border-aida-accent focus:outline-none"
                >
                  <option value="active">Activo</option>
                  <option value="paused">Pausado</option>
                  <option value="archived">Archivado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Notas de integración</label>
                <textarea
                  value={editAgent.integration_notes || ""}
                  onChange={e => setEditAgent({ ...editAgent, integration_notes: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg bg-[#111827] border border-white/10 text-white px-3 py-2 text-sm focus:border-aida-accent focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Instrucciones personalizadas</label>
                <textarea
                  value={editAgent.custom_instructions || ""}
                  onChange={e => setEditAgent({ ...editAgent, custom_instructions: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg bg-[#111827] border border-white/10 text-white px-3 py-2 text-sm focus:border-aida-accent focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-2">Capacidades</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "can_read_code", label: "Leer código" },
                    { key: "can_write_code", label: "Escribir código" },
                    { key: "can_test_connection", label: "Probar conexión" },
                    { key: "can_modify_mapping", label: "Modificar mapeo" },
                  ].map(cap => (
                    <label key={cap.key} className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={editAgent[cap.key as keyof Agent] as boolean}
                        onChange={e => setEditAgent({ ...editAgent, [cap.key]: e.target.checked })}
                        className="rounded"
                      />
                      {cap.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditAgent(null)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdate}
                disabled={saving}
                className="px-4 py-2 text-sm bg-aida-accent text-white rounded-lg hover:bg-aida-accent/80 transition disabled:opacity-40"
              >
                {saving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sessions Modal */}
      {sessionsAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-[#0d1321] border border-white/10 p-6 shadow-2xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Sesiones de Chat</h3>
                <p className="text-sm text-gray-500">
                  {sessionsAgent.agent_name} — {sessionsAgent.client_name}
                </p>
              </div>
              <button
                onClick={() => { setSessionsAgent(null); setSessions([]); }}
                className="text-gray-400 hover:text-white transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {sessionsLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-aida-accent border-t-transparent" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No hay sesiones de chat aún</p>
            ) : (
              <div className="space-y-2">
                {sessions.map(s => (
                  <div key={s.id} className="rounded-lg bg-white/5 border border-white/10 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-white font-medium">{s.title || "Sin título"}</p>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        s.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-gray-500/10 text-gray-400"
                      }`}>
                        {s.status === "active" ? "Activa" : "Cerrada"}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-gray-500">
                      <span>{s.message_count} mensajes</span>
                      <span>{s.tokens_used.toLocaleString()} tokens</span>
                      <span>Inicio: {fmtDate(s.started_at)}</span>
                      <span>Última: {fmtDate(s.last_activity)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "../../lib/api";

export default function ClientsSection() {
  const [clients, setClients] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    rif: "",
    razon_social: "",
    nombre_comercial: "",
    direccion_fiscal: "",
    email_principal: "",
    telefono_principal: "",
    plan: "basico",
  });
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState("");

  const load = useCallback((p = 1, q = "") => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(p), page_size: "15" });
    if (q) params.set("search", q);
    api(`/clients?${params}`)
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => null);
          throw new Error(err?.detail || `Error ${r.status}`);
        }
        return r.json();
      })
      .then((d) => {
        setClients(d.items || []);
        setTotal(d.total || 0);
        setPages(d.pages || 0);
        setPage(d.page || 1);
      })
      .catch((e) => {
        setError(e.message || "Error al cargar clientes");
        setClients([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSearch = () => { load(1, search); };

  const handleCreate = async () => {
    setSaving(true);
    setCreateError("");
    try {
      const today = new Date().toISOString().split("T")[0];
      const payload = {
        ...form,
        fecha_inicio: today,
      };
      const res = await api("/clients", { method: "POST", body: JSON.stringify(payload) });
      if (res.ok) {
        setShowCreate(false);
        setForm({
          rif: "",
          razon_social: "",
          nombre_comercial: "",
          direccion_fiscal: "",
          email_principal: "",
          telefono_principal: "",
          plan: "basico",
        });
        setCreateError("");
        load();
      } else {
        const err = await res.json().catch(() => null);
        if (err?.detail) {
          if (typeof err.detail === "string") {
            setCreateError(err.detail);
          } else if (Array.isArray(err.detail)) {
            const messages = err.detail.map((d: any) => {
              const field = d.loc?.slice(-1)[0] || "campo";
              return `${field}: ${d.msg}`;
            });
            setCreateError(messages.join(", "));
          } else {
            setCreateError("Error al crear el cliente");
          }
        } else {
          setCreateError(`Error ${res.status}: No se pudo crear el cliente`);
        }
      }
    } catch {
      setCreateError("Error de conexión con el servidor");
    }
    setSaving(false);
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      if (active) {
        await api(`/clients/${id}`, { method: "PUT", body: JSON.stringify({ is_active: true }) });
      } else {
        await api(`/clients/${id}`, { method: "DELETE" });
      }
      load(page, search);
    } catch {
      setError("Error al cambiar el estado del cliente");
    }
  };

  const planLabels: Record<string, string> = {
    basico: "Básico",
    profesional: "Profesional",
    empresarial: "Empresarial",
  };

  const planColors: Record<string, string> = {
    empresarial: "bg-purple-500/10 text-purple-400",
    profesional: "bg-blue-500/10 text-blue-400",
    basico: "bg-white/10 text-gray-400",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Buscar por RIF, razon social, email..."
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none focus:ring-1 focus:ring-aida-accent/30"
          />
          <button onClick={handleSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </button>
        </div>
        <span className="text-sm text-gray-500">{total} clientes</span>
        <button onClick={() => { setShowCreate(!showCreate); setCreateError(""); }} className="rounded-lg bg-aida-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-aida-accent/80">
          + Nuevo Cliente
        </button>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h4 className="mb-4 font-semibold text-white">Crear Cliente</h4>
          {createError && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {createError}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { key: "rif", label: "RIF *", placeholder: "J-12345678-9" },
              { key: "razon_social", label: "Razón Social *", placeholder: "Empresa C.A." },
              { key: "nombre_comercial", label: "Nombre Comercial", placeholder: "MiEmpresa" },
              { key: "direccion_fiscal", label: "Dirección Fiscal *", placeholder: "Av. Principal, Caracas" },
              { key: "email_principal", label: "Email *", placeholder: "admin@empresa.com" },
              { key: "telefono_principal", label: "Teléfono", placeholder: "+58 412 1234567" },
            ].map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-xs font-medium text-gray-300">{f.label}</label>
                <input
                  value={(form as any)[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none focus:ring-1 focus:ring-aida-accent/30"
                />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-300">Plan</label>
              <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} className="w-full rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:border-aida-accent focus:outline-none focus:ring-1 focus:ring-aida-accent/30">
                <option value="basico">Básico</option>
                <option value="profesional">Profesional</option>
                <option value="empresarial">Empresarial</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleCreate} disabled={saving || !form.rif || !form.razon_social || !form.email_principal || !form.direccion_fiscal}
              className="rounded-lg bg-aida-accent px-4 py-2 text-sm text-white hover:bg-aida-accent/80 disabled:opacity-50">
              {saving ? "Guardando..." : "Crear"}
            </button>
            <button onClick={() => setShowCreate(false)} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5">Cancelar</button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
        {loading ? (
          <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-aida-accent border-t-transparent" /></div>
        ) : clients.length === 0 && !error ? (
          <div className="py-12 text-center text-sm text-gray-500">No se encontraron clientes</div>
        ) : clients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/5 bg-white/[0.03] text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-3">RIF</th><th className="px-4 py-3">Razón Social</th><th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Plan</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Acciones</th>
              </tr></thead>
              <tbody>
                {clients.map((c: any) => (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 font-mono text-xs text-gray-300">{c.rif}</td>
                    <td className="px-4 py-3 text-gray-300">{c.razon_social}</td>
                    <td className="px-4 py-3 text-gray-500">{c.email_principal}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${planColors[c.plan] || "bg-white/10 text-gray-400"}`}>{planLabels[c.plan] || c.plan}</span></td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${c.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${c.is_active ? "bg-emerald-400" : "bg-red-400"}`} />
                        {c.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive(c.id, !c.is_active)}
                        className={`rounded px-2 py-1 text-xs font-medium ${c.is_active ? "text-red-400 hover:bg-red-500/10" : "text-emerald-400 hover:bg-emerald-500/10"}`}>
                        {c.is_active ? "Desactivar" : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-white/5 px-4 py-3">
            <span className="text-xs text-gray-500">Página {page} de {pages}</span>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => load(page - 1, search)} className="rounded border border-white/10 px-3 py-1 text-xs text-gray-400 disabled:opacity-40">Anterior</button>
              <button disabled={page >= pages} onClick={() => load(page + 1, search)} className="rounded border border-white/10 px-3 py-1 text-xs text-gray-400 disabled:opacity-40">Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

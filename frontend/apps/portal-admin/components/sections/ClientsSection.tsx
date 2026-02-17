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
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ rif: "", razon_social: "", nombre_comercial: "", email_principal: "", telefono: "", plan: "basic" });
  const [saving, setSaving] = useState(false);

  const load = useCallback((p = 1, q = "") => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), page_size: "15" });
    if (q) params.set("search", q);
    api(`/clients?${params}`).then(r => r.json()).then(d => {
      setClients(d.items || []);
      setTotal(d.total || 0);
      setPages(d.pages || 0);
      setPage(d.page || 1);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSearch = () => { load(1, search); };

  const handleCreate = async () => {
    setSaving(true);
    const res = await api("/clients", { method: "POST", body: JSON.stringify(form) });
    if (res.ok) {
      setShowCreate(false);
      setForm({ rif: "", razon_social: "", nombre_comercial: "", email_principal: "", telefono: "", plan: "basic" });
      load();
    }
    setSaving(false);
  };

  const toggleActive = async (id: string, active: boolean) => {
    if (active) {
      await api(`/clients/${id}`, { method: "PUT", body: JSON.stringify({ is_active: true }) });
    } else {
      await api(`/clients/${id}`, { method: "DELETE" });
    }
    load(page, search);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Buscar por RIF, razon social, email..."
            className="w-full rounded-lg border bg-white px-4 py-2.5 pr-10 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button onClick={handleSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </button>
        </div>
        <span className="text-sm text-gray-500">{total} clientes</span>
        <button onClick={() => setShowCreate(!showCreate)} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
          + Nuevo Cliente
        </button>
      </div>

      {showCreate && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h4 className="mb-4 font-semibold text-gray-800">Crear Cliente</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { key: "rif", label: "RIF", placeholder: "J-12345678-9" },
              { key: "razon_social", label: "Razon Social", placeholder: "Empresa C.A." },
              { key: "nombre_comercial", label: "Nombre Comercial", placeholder: "MiEmpresa" },
              { key: "email_principal", label: "Email", placeholder: "admin@empresa.com" },
              { key: "telefono", label: "Telefono", placeholder: "+58 412 1234567" },
            ].map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-xs font-medium text-gray-600">{f.label}</label>
                <input
                  value={(form as any)[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Plan</label>
              <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                <option value="basic">Basic</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleCreate} disabled={saving || !form.rif || !form.razon_social || !form.email_principal}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50">
              {saving ? "Guardando..." : "Crear"}
            </button>
            <button onClick={() => setShowCreate(false)} className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>
        ) : clients.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">No se encontraron clientes</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-3">RIF</th><th className="px-4 py-3">Razon Social</th><th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Plan</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Acciones</th>
              </tr></thead>
              <tbody>
                {clients.map((c: any) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{c.rif}</td>
                    <td className="px-4 py-3">{c.razon_social}</td>
                    <td className="px-4 py-3 text-gray-500">{c.email_principal}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.plan === "enterprise" ? "bg-purple-100 text-purple-700" : c.plan === "professional" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>{c.plan}</span></td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${c.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${c.is_active ? "bg-green-500" : "bg-red-500"}`} />
                        {c.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive(c.id, !c.is_active)}
                        className={`rounded px-2 py-1 text-xs font-medium ${c.is_active ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}`}>
                        {c.is_active ? "Desactivar" : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <span className="text-xs text-gray-500">Pagina {page} de {pages}</span>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => load(page - 1, search)} className="rounded border px-3 py-1 text-xs disabled:opacity-40">Anterior</button>
              <button disabled={page >= pages} onClick={() => load(page + 1, search)} className="rounded border px-3 py-1 text-xs disabled:opacity-40">Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

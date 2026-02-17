"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "../../lib/api";

export default function UsersSection() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", first_name: "", last_name: "", phone: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback((p = 1, q = "") => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), page_size: "15" });
    if (q) params.set("search", q);
    api(`/users?${params}`).then(r => r.json()).then(d => {
      setUsers(d.items || []);
      setTotal(d.total || 0);
      setPages(d.pages || 0);
      setPage(d.page || 1);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    setSaving(true);
    const res = await api("/users", { method: "POST", body: JSON.stringify({ ...form, is_active: true }) });
    if (res.ok) {
      setShowCreate(false);
      setForm({ email: "", password: "", first_name: "", last_name: "", phone: "" });
      load();
    }
    setSaving(false);
  };

  const deactivate = async (id: string) => {
    await api(`/users/${id}`, { method: "DELETE" });
    load(page, search);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load(1, search)}
            placeholder="Buscar por email, nombre..."
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none focus:ring-1 focus:ring-aida-accent/30"
          />
        </div>
        <span className="text-sm text-gray-500">{total} usuarios</span>
        <button onClick={() => setShowCreate(!showCreate)} className="rounded-lg bg-aida-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-aida-accent/80">
          + Nuevo Usuario
        </button>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h4 className="mb-4 font-semibold text-white">Crear Usuario</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { key: "first_name", label: "Nombre", placeholder: "Juan" },
              { key: "last_name", label: "Apellido", placeholder: "Perez" },
              { key: "email", label: "Email", placeholder: "juan@empresa.com" },
              { key: "password", label: "Password", placeholder: "********", type: "password" },
              { key: "phone", label: "Telefono", placeholder: "+58 412 1234567" },
            ].map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-xs font-medium text-gray-300">{f.label}</label>
                <input
                  type={f.type || "text"}
                  value={(form as any)[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none focus:ring-1 focus:ring-aida-accent/30"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleCreate} disabled={saving || !form.email || !form.password || !form.first_name}
              className="rounded-lg bg-aida-accent px-4 py-2 text-sm text-white hover:bg-aida-accent/80 disabled:opacity-50">
              {saving ? "Guardando..." : "Crear"}
            </button>
            <button onClick={() => setShowCreate(false)} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5">Cancelar</button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
        {loading ? (
          <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-aida-accent border-t-transparent" /></div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">No se encontraron usuarios</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/5 bg-white/[0.03] text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Telefono</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Acciones</th>
              </tr></thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 font-medium text-gray-300">{u.first_name} {u.last_name}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3 text-gray-500">{u.phone || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${u.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${u.is_active ? "bg-emerald-400" : "bg-red-400"}`} />
                        {u.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.is_active && (
                        <button onClick={() => deactivate(u.id)} className="rounded px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-500/10">
                          Desactivar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-white/5 px-4 py-3">
            <span className="text-xs text-gray-500">Pagina {page} de {pages}</span>
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

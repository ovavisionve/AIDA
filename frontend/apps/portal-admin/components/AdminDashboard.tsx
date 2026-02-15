"use client";

import { useState, useEffect, useCallback } from "react";

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

interface AdminDashboardProps {
  user: { first_name: string; last_name: string; email: string };
  onLogout: () => void;
}

type ActiveSection = "dashboard" | "clients" | "users" | "roles" | "settings" | "audit";

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState<ActiveSection>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    onLogout();
  };

  const navItems = [
    { id: "dashboard" as const, label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { id: "clients" as const, label: "Clientes", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
    { id: "users" as const, label: "Usuarios", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
    { id: "roles" as const, label: "Roles", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
    { id: "settings" as const, label: "Configuracion", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
    { id: "audit" as const, label: "Auditoria", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} flex flex-col bg-aida-dark text-white transition-all duration-300`}>
        <div className="flex h-16 items-center justify-between px-4">
          {sidebarOpen && <h1 className="text-xl font-bold">AIDA Admin</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-lg p-2 hover:bg-white/10">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <nav className="mt-8 flex-1 space-y-1 px-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                activeSection === item.id ? "bg-aida-highlight text-white" : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className={`${sidebarOpen ? "flex items-center gap-3" : "text-center"}`}>
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-aida-highlight text-sm font-bold">
              {user.first_name[0]}{user.last_name[0]}
            </div>
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user.first_name} {user.last_name}</p>
                <p className="truncate text-xs text-gray-400">{user.email}</p>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="mt-3 w-full rounded-lg border border-white/20 px-3 py-1.5 text-xs text-gray-300 transition hover:bg-white/10">
            {sidebarOpen ? "Cerrar sesion" : "Salir"}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">
            {navItems.find((i) => i.id === activeSection)?.label}
          </h2>
          <div className="text-sm text-gray-500">Portal 6 - Backoffice Administrativo</div>
        </header>

        <div className="p-6">
          {activeSection === "dashboard" && <DashboardSection />}
          {activeSection === "clients" && <ClientsSection />}
          {activeSection === "users" && <UsersSection />}
          {activeSection === "roles" && <RolesSection />}
          {activeSection === "settings" && <SettingsSection />}
          {activeSection === "audit" && <AuditSection />}
        </div>
      </main>
    </div>
  );
}

/* ===================== DASHBOARD ===================== */
function DashboardSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/admin/dashboard").then(r => r.json()).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: "Clientes activos", value: data?.active_clients ?? "-", total: data?.total_clients, color: "bg-blue-500", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" },
    { label: "Usuarios totales", value: data?.total_users ?? "-", color: "bg-green-500", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1z" },
    { label: "Documentos hoy", value: data?.total_documents_today ?? "-", color: "bg-purple-500", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586" },
    { label: "Documentos mes", value: data?.total_documents_month ?? "-", color: "bg-amber-500", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  ];

  const portals = [
    { name: "Portal 1 - Cliente", port: 3000, status: "active" },
    { name: "Portal 2 - Facturador", port: 3002, status: "active" },
    { name: "Portal 3 - Validacion", port: 3003, status: "active" },
    { name: "Portal 4 - Developers", port: 3004, status: "active" },
    { name: "Portal 5 - Gestion", port: 3005, status: "active" },
    { name: "Portal 6 - Admin", port: 3001, status: "active" },
  ];

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${s.color}`}>
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-sm text-gray-500">{s.label}</p>
                    {s.total !== undefined && <p className="text-xs text-gray-400">de {s.total} totales</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {data?.alerts?.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="font-semibold text-amber-800">Alertas del sistema</h3>
              <ul className="mt-2 space-y-1">
                {data.alerts.map((a: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-amber-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800">Estado de Portales</h3>
            <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
              {portals.map((p) => (
                <div key={p.name} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${p.status === "active" ? "bg-green-500" : "bg-gray-400"}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-700">{p.name}</p>
                    <p className="text-xs text-gray-400">:{p.port}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ===================== CLIENTS ===================== */
function ClientsSection() {
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

/* ===================== USERS ===================== */
function UsersSection() {
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
            className="w-full rounded-lg border bg-white px-4 py-2.5 pr-10 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <span className="text-sm text-gray-500">{total} usuarios</span>
        <button onClick={() => setShowCreate(!showCreate)} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
          + Nuevo Usuario
        </button>
      </div>

      {showCreate && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h4 className="mb-4 font-semibold text-gray-800">Crear Usuario</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { key: "first_name", label: "Nombre", placeholder: "Juan" },
              { key: "last_name", label: "Apellido", placeholder: "Perez" },
              { key: "email", label: "Email", placeholder: "juan@empresa.com" },
              { key: "password", label: "Password", placeholder: "********", type: "password" },
              { key: "phone", label: "Telefono", placeholder: "+58 412 1234567" },
            ].map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-xs font-medium text-gray-600">{f.label}</label>
                <input
                  type={f.type || "text"}
                  value={(form as any)[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleCreate} disabled={saving || !form.email || !form.password || !form.first_name}
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
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">No se encontraron usuarios</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Telefono</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Acciones</th>
              </tr></thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{u.first_name} {u.last_name}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3 text-gray-500">{u.phone || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${u.is_active ? "bg-green-500" : "bg-red-500"}`} />
                        {u.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.is_active && (
                        <button onClick={() => deactivate(u.id)} className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
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

/* ===================== ROLES ===================== */
function RolesSection() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [rolePerms, setRolePerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api("/admin/roles").then(r => r.json()),
      api("/admin/permissions").then(r => r.json()),
    ]).then(([r, p]) => {
      setRoles(Array.isArray(r) ? r : []);
      setPermissions(Array.isArray(p) ? p : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const loadRolePerms = async (roleId: string) => {
    setSelectedRole(roleId);
    const res = await api(`/admin/roles/${roleId}/permissions`);
    const data = await res.json();
    setRolePerms(Array.isArray(data) ? data : []);
  };

  const seed = async () => {
    setSeeding(true);
    setSeedResult(null);
    const res = await api("/admin/seed", { method: "POST" });
    const data = await res.json();
    setSeedResult(data.message || JSON.stringify(data));
    // Reload
    const [r, p] = await Promise.all([
      api("/admin/roles").then(r => r.json()),
      api("/admin/permissions").then(r => r.json()),
    ]);
    setRoles(Array.isArray(r) ? r : []);
    setPermissions(Array.isArray(p) ? p : []);
    setSeeding(false);
  };

  const grouped = permissions.reduce((acc: any, p: any) => {
    const mod = p.module || "general";
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={seed} disabled={seeding} className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">
          {seeding ? "Ejecutando seed..." : "Seed Roles y Permisos"}
        </button>
        {seedResult && <span className="text-sm text-green-600">{seedResult}</span>}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">Roles ({roles.length})</h3>
            {roles.length === 0 ? (
              <p className="text-sm text-gray-400">No hay roles. Ejecute Seed para crear los roles por defecto.</p>
            ) : (
              <div className="space-y-2">
                {roles.map((r: any) => (
                  <button key={r.id} onClick={() => loadRolePerms(r.id)}
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left text-sm transition ${selectedRole === r.id ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"}`}>
                    <div>
                      <p className="font-medium text-gray-800">{r.display_name}</p>
                      <p className="text-xs text-gray-500">{r.description || r.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${r.level === "platform" ? "bg-purple-100 text-purple-700" : r.level === "client" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                        {r.level}
                      </span>
                      {r.is_system && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">sistema</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            {selectedRole ? (
              <>
                <h3 className="mb-4 text-lg font-semibold text-gray-800">
                  Permisos del rol ({rolePerms.length})
                </h3>
                {rolePerms.length === 0 ? (
                  <p className="text-sm text-gray-400">Este rol no tiene permisos asignados</p>
                ) : (
                  <div className="max-h-96 space-y-1 overflow-y-auto">
                    {rolePerms.map((p: any) => (
                      <div key={p.code} className="flex items-center justify-between rounded border px-3 py-2 text-xs">
                        <span className="font-medium text-gray-700">{p.name}</span>
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-500">{p.code}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <h3 className="mb-4 text-lg font-semibold text-gray-800">
                  Todos los permisos ({permissions.length})
                </h3>
                {Object.keys(grouped).length === 0 ? (
                  <p className="text-sm text-gray-400">No hay permisos. Ejecute Seed primero.</p>
                ) : (
                  <div className="max-h-96 space-y-4 overflow-y-auto">
                    {Object.entries(grouped).map(([mod, perms]: [string, any]) => (
                      <div key={mod}>
                        <h4 className="mb-1 text-xs font-semibold uppercase text-gray-500">{mod}</h4>
                        <div className="space-y-1">
                          {perms.map((p: any) => (
                            <div key={p.code} className="flex items-center justify-between rounded bg-gray-50 px-2 py-1.5 text-xs">
                              <span className="text-gray-700">{p.name}</span>
                              <span className="font-mono text-gray-400">{p.code}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================== SETTINGS ===================== */
function SettingsSection() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api("/admin/settings").then(r => r.json()).then(d => setSettings(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = (key: string, value: string) => {
    setEditing(key);
    setEditValue(value);
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    const res = await api(`/admin/settings/${editing}`, { method: "PUT", body: JSON.stringify({ value: editValue }) });
    if (res.ok) {
      setEditing(null);
      load();
    }
    setSaving(false);
  };

  const grouped = settings.reduce((acc: any, s: any) => {
    const cat = s.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const categoryLabels: Record<string, string> = {
    empresa: "Empresa",
    facturacion: "Facturacion",
    seguridad: "Seguridad",
    email: "Email",
    almacenamiento: "Almacenamiento",
    general: "General",
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>
      ) : settings.length === 0 ? (
        <div className="rounded-xl bg-white p-6 shadow-sm text-center">
          <p className="text-gray-400">No hay configuraciones del sistema. Ejecute el seed de datos iniciales desde la base de datos.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, items]: [string, any]) => (
          <div key={cat} className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              {categoryLabels[cat] || cat}
            </h3>
            <div className="divide-y">
              {items.map((s: any) => (
                <div key={s.key} className="flex items-center justify-between py-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{s.key}</p>
                    {s.description && <p className="text-xs text-gray-400">{s.description}</p>}
                  </div>
                  {editing === s.key ? (
                    <div className="flex items-center gap-2">
                      <input value={editValue} onChange={(e) => setEditValue(e.target.value)}
                        className="rounded border px-2 py-1 text-sm focus:border-blue-500 focus:outline-none" />
                      <button onClick={saveEdit} disabled={saving} className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700">
                        {saving ? "..." : "Guardar"}
                      </button>
                      <button onClick={() => setEditing(null)} className="rounded border px-2 py-1 text-xs text-gray-500 hover:bg-gray-50">Cancelar</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-600">{s.value}</span>
                      <button onClick={() => startEdit(s.key, s.value)} className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50">Editar</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ===================== AUDIT ===================== */
function AuditSection() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("");
  const [filterResource, setFilterResource] = useState("");

  const pageSize = 25;

  const load = useCallback((p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), page_size: String(pageSize) });
    if (filterAction) params.set("action", filterAction);
    if (filterResource) params.set("resource_type", filterResource);
    api(`/admin/audit-logs?${params}`).then(r => r.json()).then(d => {
      setLogs(d.items || []);
      setTotal(d.total || 0);
      setPage(d.page || 1);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [filterAction, filterResource]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / pageSize);

  const actionColors: Record<string, string> = {
    create: "bg-green-100 text-green-700",
    update: "bg-blue-100 text-blue-700",
    delete: "bg-red-100 text-red-700",
    hard_delete: "bg-red-200 text-red-800",
    soft_delete: "bg-orange-100 text-orange-700",
    deactivate: "bg-orange-100 text-orange-700",
    login: "bg-indigo-100 text-indigo-700",
    seed: "bg-amber-100 text-amber-700",
    assign_role: "bg-purple-100 text-purple-700",
    remove_role: "bg-pink-100 text-pink-700",
    emit: "bg-teal-100 text-teal-700",
    void: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select value={filterAction} onChange={(e) => { setFilterAction(e.target.value); }}
          className="rounded-lg border bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none">
          <option value="">Todas las acciones</option>
          {["create", "update", "delete", "deactivate", "login", "seed", "assign_role", "emit", "void"].map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select value={filterResource} onChange={(e) => { setFilterResource(e.target.value); }}
          className="rounded-lg border bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none">
          <option value="">Todos los recursos</option>
          {["client", "user", "user_role", "invoice", "credit_note", "debit_note", "system_setting", "system", "api_key"].map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500">{total} registros</span>
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">No se encontraron registros de auditoria</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Accion</th>
                <th className="px-4 py-3">Recurso</th><th className="px-4 py-3">ID Recurso</th>
                <th className="px-4 py-3">Detalles</th><th className="px-4 py-3">IP</th>
              </tr></thead>
              <tbody>
                {logs.map((l: any) => (
                  <tr key={l.id} className="border-b hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                      {new Date(l.timestamp).toLocaleString("es-VE")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${actionColors[l.action] || "bg-gray-100 text-gray-700"}`}>
                        {l.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{l.resource_type}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{l.resource_id ? l.resource_id.substring(0, 8) + "..." : "-"}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-xs text-gray-500">{l.details || "-"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{l.ip_address || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <span className="text-xs text-gray-500">Pagina {page} de {totalPages}</span>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => load(page - 1)} className="rounded border px-3 py-1 text-xs disabled:opacity-40">Anterior</button>
              <button disabled={page >= totalPages} onClick={() => load(page + 1)} className="rounded border px-3 py-1 text-xs disabled:opacity-40">Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

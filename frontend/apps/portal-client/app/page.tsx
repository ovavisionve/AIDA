"use client";

import { useState, useEffect, useCallback } from "react";
import AIChatWidget from "@/components/AIChatWidget";

type Section = "dashboard" | "documentos" | "plantillas" | "perfil";

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  is_superadmin: boolean;
  roles: string[];
  client: {
    id: string;
    rif: string;
    razon_social: string;
    nombre_comercial: string | null;
    plan: string;
    is_active: boolean;
  } | null;
}

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [section, setSection] = useState<Section>("dashboard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

  const fetchProfile = useCallback(async (token: string): Promise<UserProfile | null> => {
    try {
      const res = await fetch(`${apiUrl}/users/me/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error("Profile fetch error:", err);
      return null;
    }
  }, [apiUrl]);

  // Check existing token on mount
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setChecking(false);
      return;
    }
    fetchProfile(token).then((p) => {
      if (p) {
        setProfile(p);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }
      setChecking(false);
    });
  }, [fetchProfile]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Error al iniciar sesión"); return; }
      if (data.requires_2fa) { setError("Se requiere código 2FA"); return; }
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      const p = await fetchProfile(data.access_token);
      if (p) {
        setProfile(p);
      } else {
        setProfile({
          id: data.user.id,
          email: data.user.email,
          first_name: data.user.first_name,
          last_name: data.user.last_name,
          phone: null,
          is_superadmin: data.user.is_superadmin,
          roles: [],
          client: null,
        });
      }
      setIsAuthenticated(true);
    } catch { setError("Error de conexión con el servidor"); }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setIsAuthenticated(false);
    setProfile(null);
    setSection("dashboard");
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0f1a]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-aida-accent border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0f1a]">
        <div className="w-full max-w-md rounded-2xl bg-white/5 border border-white/10 backdrop-blur-lg p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <img src="/logo-gradient.png" alt="AIDA" className="h-8 mx-auto" />
            <p className="mt-3 text-sm text-gray-500">Portal Cliente — Documentos Fiscales</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-300">Correo electrónico</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none focus:ring-2 focus:ring-aida-accent/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none focus:ring-2 focus:ring-aida-accent/20" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-aida-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-aida-accent/80 transition shadow-lg shadow-aida-accent/25 disabled:opacity-50">
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const token = localStorage.getItem("access_token") || "";
  const companyName = profile?.client?.nombre_comercial || profile?.client?.razon_social || "";
  const primaryRole = profile?.roles?.[0] || (profile?.is_superadmin ? "Super Admin" : "Usuario");

  const navItems: { id: Section; label: string; icon: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { id: "documentos", label: "Documentos", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { id: "plantillas", label: "Plantillas", icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" },
    { id: "perfil", label: "Perfil", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  ];

  return (
    <div className="flex h-screen bg-transparent">
      {/* Sidebar */}
      <aside className="w-64 aida-sidebar text-white flex flex-col">
        <div className="flex h-16 items-center px-6 border-b border-white/10">
          <img src="/logo-white.png" alt="AIDA" className="h-5" />
          <span className="ml-2 rounded-full bg-aida-accent/20 px-2 py-0.5 text-xs font-medium text-blue-300">Cliente</span>
        </div>

        {companyName && (
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-sm font-medium text-white truncate">{companyName}</p>
            {profile?.client?.rif && (
              <p className="text-xs text-gray-500">{profile.client.rif}</p>
            )}
          </div>
        )}

        <nav className="mt-4 space-y-0.5 px-3 flex-1">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setSection(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
                section === item.id
                  ? "bg-aida-accent/10 text-aida-cyan border border-aida-accent/20"
                  : "text-gray-500 hover:bg-white/10 hover:text-white border border-transparent"
              }`}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-aida-accent/20 text-sm font-bold text-aida-cyan">
              {profile?.first_name?.[0]}{profile?.last_name?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{profile?.first_name} {profile?.last_name}</p>
              <p className="truncate text-xs text-gray-500">{primaryRole}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="mt-3 w-full rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 transition hover:bg-white/5 hover:text-white">
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <header className="flex h-16 items-center justify-between border-b border-white/5 bg-[#0a0f1a]/80 backdrop-blur-lg px-6">
          <h2 className="text-lg font-semibold text-white">{navItems.find(n => n.id === section)?.label}</h2>
          <div className="flex items-center gap-3">
            {profile?.client && (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                profile.client.plan === "empresarial" ? "bg-purple-500/10 text-purple-400" :
                profile.client.plan === "profesional" ? "bg-blue-500/10 text-blue-400" :
                "bg-white/10 text-gray-400"
              }`}>
                {profile.client.plan}
              </span>
            )}
            <span className="text-sm text-gray-500">{profile?.first_name} {profile?.last_name}</span>
          </div>
        </header>
        <div className="p-6">
          {section === "dashboard" && <DashboardSection token={token} apiUrl={apiUrl} profile={profile} />}
          {section === "documentos" && <DocumentsSection token={token} apiUrl={apiUrl} />}
          {section === "plantillas" && <TemplateSection token={token} apiUrl={apiUrl} />}
          {section === "perfil" && <ProfileSection profile={profile} onLogout={handleLogout} />}
        </div>
      </main>

      <AIChatWidget token={token} />
    </div>
  );
}

function DashboardSection({ token, apiUrl, profile }: { token: string; apiUrl: string; profile: UserProfile | null }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${apiUrl}/documents/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => null);
          throw new Error(err?.detail || `Error ${r.status}`);
        }
        return r.json();
      })
      .then(setStats)
      .catch((e) => setError(e.message || "Error al cargar el dashboard"))
      .finally(() => setLoading(false));
  }, [token, apiUrl]);

  const formatCurrency = (value: number) => {
    return `Bs. ${value.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const statCards = [
    { label: "Documentos del mes", value: stats?.total_documents_month ?? "-", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", color: "bg-blue-500" },
    { label: "Pendientes de descarga", value: stats?.total_pending_download ?? "-", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4", color: "bg-amber-500" },
    { label: "Facturado este mes", value: stats ? formatCurrency(stats.total_billed_current) : "-", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "bg-emerald-500" },
    { label: "Mes anterior", value: stats ? formatCurrency(stats.total_billed_previous) : "-", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6", color: "bg-purple-500" },
  ];

  return (
    <>
      {profile?.client && (
        <div className="mb-6 rounded-xl bg-white/5 p-5 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">{profile.client.razon_social}</h3>
              <p className="text-sm text-gray-500">RIF: {profile.client.rif} {profile.client.nombre_comercial ? `| ${profile.client.nombre_comercial}` : ""}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${profile.client.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${profile.client.is_active ? "bg-emerald-400" : "bg-red-400"}`} />
                {profile.client.is_active ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-aida-accent border-t-transparent" /></div>
      ) : error ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <div key={stat.label} className="rounded-xl bg-white/5 p-5 border border-white/10 hover:border-white/20 transition">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-500">{stat.label}</p>
                  <div className={`rounded-lg ${stat.color}/10 p-2`}>
                    <svg className={`h-4 w-4 ${stat.color.replace("bg-", "text-")}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={stat.icon} />
                    </svg>
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold text-white">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl bg-white/5 p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white">Documentos Recientes</h3>
            {stats?.recent_documents?.length > 0 ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-white/5 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-3 py-2 text-left">N. Control</th>
                      <th className="px-3 py-2 text-left">Receptor</th>
                      <th className="px-3 py-2 text-left">Fecha</th>
                      <th className="px-3 py-2 text-right">Total</th>
                      <th className="px-3 py-2 text-left">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stats.recent_documents.map((doc: any) => (
                      <tr key={doc.id} className="hover:bg-white/5">
                        <td className="px-3 py-2 font-mono text-xs text-gray-300">{doc.control_number || doc.document_number}</td>
                        <td className="px-3 py-2 text-gray-300">{doc.receptor_razon_social}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">{new Date(doc.fecha_emision).toLocaleDateString("es-VE")}</td>
                        <td className="px-3 py-2 text-right font-medium text-white">{doc.moneda} {doc.total?.toLocaleString("es-VE", { minimumFractionDigits: 2 })}</td>
                        <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${doc.status === "emitido" ? "bg-emerald-500/10 text-emerald-400" : doc.status === "anulado" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"}`}>{doc.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-center text-sm text-gray-500 py-8">
                No hay documentos para mostrar. Los documentos aparecerán aquí cuando se emitan facturas.
              </p>
            )}
          </div>
        </>
      )}
    </>
  );
}

function DocumentsSection({ token, apiUrl }: { token: string; apiUrl: string }) {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const load = useCallback(async (p = 1, q = "") => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(p), page_size: "20" });
      if (q) params.set("search", q);
      const res = await fetch(`${apiUrl}/documents?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || `Error ${res.status}`);
      }
      const data = await res.json();
      setDocs(data.items || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
      setTotalPages(data.pages || 0);
    } catch (e: any) {
      setError(e.message || "Error al cargar documentos");
      setDocs([]);
    }
    setLoading(false);
  }, [token, apiUrl]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = () => { load(1, search); };

  const handleDownload = async (docId: string, format: "pdf" | "xml") => {
    try {
      const res = await fetch(`${apiUrl}/documents/${docId}/${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Buscar por N. Control, RIF, razón social..."
          className="flex-1 rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none focus:ring-2 focus:ring-aida-accent/20" />
        <button onClick={handleSearch} className="rounded-lg bg-aida-accent/10 border border-aida-accent/20 px-4 py-2.5 text-sm text-aida-accent hover:bg-aida-accent/20 transition">
          Buscar
        </button>
        <span className="text-sm text-gray-500">{total} documentos</span>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
      )}

      <div className="rounded-xl bg-white/5 overflow-hidden border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/5 bg-white/[0.03] text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">N. Control</th>
              <th className="px-4 py-3">N. Documento</th>
              <th className="px-4 py-3">Receptor</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-center">Descargar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-aida-accent border-t-transparent" /> Cargando...
              </td></tr>
            ) : docs.length === 0 && !error ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                No hay documentos para mostrar.
              </td></tr>
            ) : docs.map((doc: any) => (
              <tr key={doc.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3 font-mono text-xs text-gray-300">{doc.control_number || "-"}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-400">{doc.document_number}</td>
                <td className="px-4 py-3 text-gray-300">{doc.receptor_razon_social}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{new Date(doc.fecha_emision).toLocaleDateString("es-VE")}</td>
                <td className="px-4 py-3 text-right font-medium text-white">{doc.moneda} {doc.total?.toLocaleString("es-VE", { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    doc.status === "emitido" ? "bg-emerald-500/10 text-emerald-400" :
                    doc.status === "anulado" ? "bg-red-500/10 text-red-400" :
                    "bg-amber-500/10 text-amber-400"
                  }`}>{doc.status}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => handleDownload(doc.id, "pdf")} className="rounded p-1 text-gray-500 hover:text-red-400 transition" title="PDF">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                    </button>
                    <button onClick={() => handleDownload(doc.id, "xml")} className="rounded p-1 text-gray-500 hover:text-blue-400 transition" title="XML">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/5 px-4 py-3">
            <span className="text-xs text-gray-500">Página {page} de {totalPages}</span>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => load(page - 1, search)} className="rounded border border-white/10 px-3 py-1 text-xs text-gray-400 disabled:opacity-40">Anterior</button>
              <button disabled={page >= totalPages} onClick={() => load(page + 1, search)} className="rounded border border-white/10 px-3 py-1 text-xs text-gray-400 disabled:opacity-40">Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateSection({ token, apiUrl }: { token: string; apiUrl: string }) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<any>({});
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [tRes, pRes, bRes] = await Promise.all([
          fetch(`${apiUrl}/templates/`, { headers }),
          fetch(`${apiUrl}/templates/preferences/me`, { headers }),
          fetch(`${apiUrl}/uploads/banners`, { headers }),
        ]);
        if (tRes.ok) setTemplates(await tRes.json());
        if (pRes.ok) setPreferences(await pRes.json());
        if (bRes.ok) setBanners(await bRes.json());
      } catch { /* templates are non-critical */ }
      setLoading(false);
    };
    load();
  }, [token, apiUrl]);

  const setPreference = async (docType: string, templateId: string) => {
    try {
      await fetch(`${apiUrl}/templates/preference?document_type=${docType}&template_id=${templateId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setMsg("Preferencia guardada");
      const pRes = await fetch(`${apiUrl}/templates/preferences/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (pRes.ok) setPreferences(await pRes.json());
    } catch { setMsg("Error al guardar"); }
    setTimeout(() => setMsg(""), 3000);
  };

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${apiUrl}/uploads/logo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) setMsg("Logo actualizado correctamente");
      else setMsg("Error al subir logo");
    } catch { setMsg("Error al subir logo"); }
    setUploading(false);
    setTimeout(() => setMsg(""), 3000);
  };

  const uploadBanner = async (docType: string, position: string, file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${apiUrl}/uploads/banner?document_type=${docType}&position=${position}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        setMsg("Banner subido correctamente");
        const bRes = await fetch(`${apiUrl}/uploads/banners`, { headers: { Authorization: `Bearer ${token}` } });
        if (bRes.ok) setBanners(await bRes.json());
      } else setMsg("Error al subir banner");
    } catch { setMsg("Error al subir banner"); }
    setUploading(false);
    setTimeout(() => setMsg(""), 3000);
  };

  const deleteBanner = async (bannerId: string) => {
    try {
      await fetch(`${apiUrl}/uploads/banners/${bannerId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setBanners(banners.filter(b => b.id !== bannerId));
      setMsg("Banner eliminado");
    } catch { setMsg("Error al eliminar banner"); }
    setTimeout(() => setMsg(""), 3000);
  };

  const DOC_TYPES = [
    { key: "factura", label: "Facturas" },
    { key: "nota_credito", label: "Notas de Crédito" },
    { key: "nota_debito", label: "Notas de Débito" },
    { key: "guia_despacho", label: "Guías de Despacho" },
    { key: "retencion", label: "Retenciones" },
  ];

  if (loading) return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-aida-accent border-t-transparent" /></div>;

  return (
    <div className="space-y-8">
      {msg && <div className="rounded-lg bg-aida-accent/10 border border-aida-accent/20 px-4 py-2 text-sm text-aida-accent">{msg}</div>}

      {/* Logo Upload */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Logo de Empresa</h3>
        <div className="rounded-xl bg-white/5 p-5 border border-white/10">
          <p className="text-sm text-gray-500 mb-3">Tu logo aparecerá en todos los documentos fiscales generados.</p>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/5 transition">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {uploading ? "Subiendo..." : "Subir logo (PNG, JPG, max 2MB)"}
            <input type="file" accept="image/*" onChange={uploadLogo} className="hidden" />
          </label>
        </div>
      </div>

      {/* Templates */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Plantillas Disponibles</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {templates.map((t: any) => (
            <div key={t.id} className="rounded-xl bg-white/5 p-5 border border-white/10 hover:border-aida-accent/30 transition-all">
              <div className="h-24 rounded-lg mb-3 flex items-center justify-center" style={{ backgroundColor: t.layout_config?.header_bg || "#f1f5f9" }}>
                <span className="text-2xl font-bold" style={{ color: t.layout_config?.header_color || "#333" }}>
                  {t.name?.charAt(0)}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-white">{t.name}</h4>
              <p className="mt-1 text-xs text-gray-500 line-clamp-2">{t.description}</p>
              <div className="mt-3 flex items-center gap-2">
                {t.is_default && <span className="rounded-full bg-aida-accent/10 px-2 py-0.5 text-[10px] font-medium text-aida-accent">Por defecto</span>}
                <button onClick={() => window.open(`${apiUrl}/templates/${t.id}/preview-pdf`, "_blank")}
                  className="rounded-lg border border-white/10 px-2.5 py-1 text-[10px] font-medium text-gray-500 hover:bg-white/5 transition">
                  Vista previa PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preferences */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Preferencia por Tipo de Documento</h3>
        <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-white/5 bg-white/[0.03] text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Tipo de Documento</th>
                <th className="px-4 py-3 text-left">Plantilla Actual</th>
                <th className="px-4 py-3 text-left">Cambiar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {DOC_TYPES.map(dt => (
                <tr key={dt.key} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-gray-300">{dt.label}</td>
                  <td className="px-4 py-3 text-gray-500">{preferences[dt.key]?.template_name || "Por defecto"}</td>
                  <td className="px-4 py-3">
                    <select value={preferences[dt.key]?.template_id || ""}
                      onChange={(e: any) => { if (e.target.value) setPreference(dt.key, e.target.value); }}
                      className="rounded-lg bg-[#0a0f1a] border border-white/10 px-3 py-1.5 text-sm text-white focus:border-aida-accent focus:outline-none">
                      <option value="">Seleccionar...</option>
                      {templates.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Banners */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Banners Publicitarios</h3>
        <p className="text-sm text-gray-500 mb-4">Sube banners que aparecerán en tus documentos fiscales.</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DOC_TYPES.map(dt => {
            const banner = banners.find(b => b.document_type === dt.key);
            return (
              <div key={dt.key} className="rounded-xl bg-white/5 p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-300">{dt.label}</h4>
                  {banner && (
                    <button onClick={() => deleteBanner(banner.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition">Eliminar</button>
                  )}
                </div>
                {banner ? (
                  <div className="rounded-lg bg-white/5 p-2 text-center text-xs text-gray-500">
                    Banner activo: {banner.position}
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed border-white/20 p-4 text-center hover:border-aida-accent/50 transition">
                    <svg className="h-6 w-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-xs text-gray-500">Subir banner</span>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const f = e.target.files?.[0];
                        if (f) uploadBanner(dt.key, "footer", f);
                      }} />
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ProfileSection({ profile, onLogout }: { profile: UserProfile | null; onLogout: () => void }) {
  if (!profile) return null;

  const planLabels: Record<string, string> = {
    basico: "Básico",
    profesional: "Profesional",
    empresarial: "Empresarial",
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* User Info */}
      <div className="rounded-xl bg-white/5 p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Información Personal</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Nombre</p>
            <p className="text-sm text-white">{profile.first_name} {profile.last_name}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Email</p>
            <p className="text-sm text-white">{profile.email}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Teléfono</p>
            <p className="text-sm text-white">{profile.phone || "No registrado"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Rol</p>
            <div className="flex flex-wrap gap-1">
              {profile.roles.length > 0 ? profile.roles.map((r) => (
                <span key={r} className="rounded-full bg-aida-accent/10 px-2.5 py-0.5 text-xs font-medium text-aida-accent">{r}</span>
              )) : (
                <span className="text-sm text-gray-400">{profile.is_superadmin ? "Super Admin" : "Usuario"}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Client/Company Info */}
      {profile.client && (
        <div className="rounded-xl bg-white/5 p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Empresa</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Razón Social</p>
              <p className="text-sm text-white">{profile.client.razon_social}</p>
            </div>
            {profile.client.nombre_comercial && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Nombre Comercial</p>
                <p className="text-sm text-white">{profile.client.nombre_comercial}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">RIF</p>
              <p className="text-sm font-mono text-white">{profile.client.rif}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Plan</p>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                profile.client.plan === "empresarial" ? "bg-purple-500/10 text-purple-400" :
                profile.client.plan === "profesional" ? "bg-blue-500/10 text-blue-400" :
                "bg-white/10 text-gray-400"
              }`}>{planLabels[profile.client.plan] || profile.client.plan}</span>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Estado</p>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${profile.client.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${profile.client.is_active ? "bg-emerald-400" : "bg-red-400"}`} />
                {profile.client.is_active ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
        </div>
      )}

      <button onClick={onLogout} className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 transition">
        Cerrar sesión
      </button>
    </div>
  );
}

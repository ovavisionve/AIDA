"use client";

import { useState, useEffect } from "react";
import AIChatWidget from "@/components/AIChatWidget";

type Section = "dashboard" | "documentos" | "plantillas" | "perfil";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [section, setSection] = useState<Section>("dashboard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ first_name: string; last_name: string } | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

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
      if (!res.ok) { setError(data.detail || "Error al iniciar sesion"); return; }
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      setUser(data.user);
      setIsAuthenticated(true);
    } catch { setError("Error de conexion"); }
    finally { setLoading(false); }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center aida-gradient">
        <div className="w-full max-w-md rounded-2xl bg-white/95 backdrop-blur-sm p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-aida-primary tracking-tight">AIDA</h1>
            <p className="mt-2 text-sm text-slate-500">Portal Cliente — Documentos Fiscales</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-700">Correo electronico</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-aida-accent focus:outline-none focus:ring-2 focus:ring-aida-accent/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Contrasena</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-aida-accent focus:outline-none focus:ring-2 focus:ring-aida-accent/20" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-aida-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-aida-primary transition shadow-lg shadow-aida-accent/25 disabled:opacity-50">
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const token = localStorage.getItem("access_token") || "";

  const navItems: { id: Section; label: string; icon: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { id: "documentos", label: "Documentos", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { id: "plantillas", label: "Plantillas", icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" },
    { id: "perfil", label: "Perfil", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 aida-sidebar text-white">
        <div className="flex h-16 items-center px-6 border-b border-white/10">
          <h1 className="text-xl font-bold tracking-tight">AIDA</h1>
          <span className="ml-2 rounded-full bg-aida-accent/20 px-2 py-0.5 text-xs font-medium text-blue-300">Cliente</span>
        </div>
        <nav className="mt-4 space-y-0.5 px-3">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setSection(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
                section === item.id
                  ? "bg-aida-accent text-white shadow-lg shadow-aida-accent/25"
                  : "text-slate-400 hover:bg-white/10 hover:text-white"
              }`}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <h2 className="text-lg font-semibold text-slate-800">{navItems.find(n => n.id === section)?.label}</h2>
          <span className="text-sm text-slate-500">{user?.first_name} {user?.last_name}</span>
        </header>
        <div className="p-6">
          {section === "dashboard" && <DashboardSection />}
          {section === "documentos" && <DocumentsSection token={token} apiUrl={apiUrl} />}
          {section === "plantillas" && <TemplateSection token={token} apiUrl={apiUrl} />}
          {section === "perfil" && <ProfilePlaceholder user={user} />}
        </div>
      </main>

      <AIChatWidget token={token} />
    </div>
  );
}

function DashboardSection() {
  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Documentos del mes", value: "0", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", color: "bg-blue-500" },
          { label: "Pendientes de descarga", value: "0", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4", color: "bg-amber-500" },
          { label: "Facturado este mes", value: "Bs. 0,00", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "bg-emerald-500" },
          { label: "Mes anterior", value: "Bs. 0,00", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6", color: "bg-purple-500" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl bg-white p-5 shadow-sm border border-slate-100 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">{stat.label}</p>
              <div className={`rounded-lg ${stat.color}/10 p-2`}>
                <svg className={`h-4 w-4 ${stat.color.replace("bg-", "text-")}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={stat.icon} />
                </svg>
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl bg-white p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800">Documentos Recientes</h3>
        <p className="mt-4 text-center text-sm text-slate-400 py-8">
          No hay documentos para mostrar. Los documentos apareceran aqui cuando se emitan facturas.
        </p>
      </div>
    </>
  );
}

function DocumentsSection({ token, apiUrl }: { token: string; apiUrl: string }) {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const params = search ? `?search=${search}` : "";
        const res = await fetch(`${apiUrl}/documents/received${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setDocs(data.items || data || []);
        }
      } catch { /* silently */ }
      setLoading(false);
    };
    load();
  }, [search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input value={search} onChange={(e: any) => setSearch(e.target.value)}
          placeholder="Buscar por N. Control, RIF, razon social..."
          className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-aida-accent focus:outline-none focus:ring-2 focus:ring-aida-accent/20" />
      </div>

      <div className="rounded-xl bg-white shadow-sm overflow-hidden border border-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">N. Control</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Emisor</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Descargar</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-aida-accent border-t-transparent" /> Cargando...
              </td></tr>
            ) : docs.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                No hay documentos recibidos aun.
              </td></tr>
            ) : docs.map((doc: any) => (
              <tr key={doc.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-mono text-xs">{doc.control_number}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-aida-primary/10 px-2 py-0.5 text-[10px] font-medium text-aida-primary">{doc.tipo}</span></td>
                <td className="px-4 py-3">{doc.emisor_razon_social}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{doc.fecha}</td>
                <td className="px-4 py-3 text-right font-medium">{doc.moneda} {doc.total?.toLocaleString("es-VE", { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">{doc.status}</span></td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {doc.pdf_url && <a href={doc.pdf_url} className="rounded p-1 text-slate-400 hover:text-red-600 transition" title="PDF">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                    </a>}
                    {doc.xml_url && <a href={doc.xml_url} className="rounded p-1 text-slate-400 hover:text-blue-600 transition" title="XML">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>
                    </a>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
      } catch { /* silently */ }
      setLoading(false);
    };
    load();
  }, []);

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
    { key: "nota_credito", label: "Notas de Credito" },
    { key: "nota_debito", label: "Notas de Debito" },
    { key: "guia_despacho", label: "Guias de Despacho" },
    { key: "retencion", label: "Retenciones" },
  ];

  if (loading) return <div className="text-center py-12 text-slate-400">Cargando plantillas...</div>;

  return (
    <div className="space-y-8">
      {msg && <div className="rounded-lg bg-aida-accent/10 border border-aida-accent/20 px-4 py-2 text-sm text-aida-accent">{msg}</div>}

      {/* Logo Upload */}
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-3">Logo de Empresa</h3>
        <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500 mb-3">Tu logo aparecera en todos los documentos fiscales generados.</p>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
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
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Plantillas Disponibles</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {templates.map((t: any) => (
            <div key={t.id} className="rounded-xl bg-white p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-aida-accent/30 transition-all">
              <div className="h-24 rounded-lg mb-3 flex items-center justify-center" style={{ backgroundColor: t.layout_config?.header_bg || "#f1f5f9" }}>
                <span className="text-2xl font-bold" style={{ color: t.layout_config?.header_color || "#333" }}>
                  {t.name?.charAt(0)}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-slate-800">{t.name}</h4>
              <p className="mt-1 text-xs text-slate-500 line-clamp-2">{t.description}</p>
              <div className="mt-3 flex items-center gap-2">
                {t.is_default && <span className="rounded-full bg-aida-accent/10 px-2 py-0.5 text-[10px] font-medium text-aida-accent">Por defecto</span>}
                <button onClick={() => window.open(`${apiUrl}/templates/${t.id}/preview-pdf`, "_blank")}
                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-[10px] font-medium text-slate-500 hover:bg-slate-50 transition">
                  Vista previa PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preferences */}
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Preferencia por Tipo de Documento</h3>
        <div className="rounded-xl bg-white shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Tipo de Documento</th>
                <th className="px-4 py-3 text-left">Plantilla Actual</th>
                <th className="px-4 py-3 text-left">Cambiar</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {DOC_TYPES.map(dt => (
                <tr key={dt.key} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium">{dt.label}</td>
                  <td className="px-4 py-3 text-slate-600">{preferences[dt.key]?.template_name || "Por defecto"}</td>
                  <td className="px-4 py-3">
                    <select value={preferences[dt.key]?.template_id || ""}
                      onChange={(e: any) => { if (e.target.value) setPreference(dt.key, e.target.value); }}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-aida-accent focus:outline-none">
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
        <h3 className="text-lg font-semibold text-slate-800 mb-3">Banners Publicitarios</h3>
        <p className="text-sm text-slate-500 mb-4">Sube banners que apareceran en tus documentos fiscales.</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DOC_TYPES.map(dt => {
            const banner = banners.find(b => b.document_type === dt.key);
            return (
              <div key={dt.key} className="rounded-xl bg-white p-4 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-slate-700">{dt.label}</h4>
                  {banner && (
                    <button onClick={() => deleteBanner(banner.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition">Eliminar</button>
                  )}
                </div>
                {banner ? (
                  <div className="rounded-lg bg-slate-50 p-2 text-center text-xs text-slate-400">
                    Banner activo: {banner.position}
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed border-slate-200 p-4 text-center hover:border-aida-accent/50 transition">
                    <svg className="h-6 w-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-xs text-slate-400">Subir banner</span>
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

function ProfilePlaceholder({ user }: { user: any }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
      <h3 className="font-semibold text-slate-800">Perfil</h3>
      <p className="mt-2 text-sm text-slate-500">
        {user ? `${user.first_name} ${user.last_name}` : "Usuario"}
      </p>
    </div>
  );
}

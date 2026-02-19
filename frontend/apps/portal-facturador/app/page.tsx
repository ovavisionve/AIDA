"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import InvoiceForm from "@/components/InvoiceForm";
import ProductList from "@/components/ProductList";
import CustomerList from "@/components/CustomerList";
import DocumentsSection from "@/components/DocumentsSection";
import ReportsSection from "@/components/ReportsSection";
import TemplateSelector from "@/components/TemplateSelector";

type Section = "dashboard" | "nueva-factura" | "productos" | "clientes" | "documentos" | "reportes" | "plantillas";

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
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
  const [isAuth, setIsAuth] = useState(false);
  const [checking, setChecking] = useState(true);
  const [section, setSection] = useState<Section>("dashboard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

  const loadProfile = async (t: string) => {
    try {
      const res = await fetch(`${apiUrl}/users/me/profile`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        return true;
      }
    } catch { /* network error */ }
    return false;
  };

  // Check auth on mount
  useEffect(() => {
    const stored = localStorage.getItem("access_token");
    if (stored) {
      loadProfile(stored).then((ok) => {
        if (ok) {
          setToken(stored);
          setIsAuth(true);
        } else {
          localStorage.removeItem("access_token");
        }
        setChecking(false);
      });
    } else {
      setChecking(false);
    }
  }, [apiUrl]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Error al iniciar sesión"); return; }
      const t = data.access_token;
      setToken(t);
      localStorage.setItem("access_token", t);
      await loadProfile(t);
      setIsAuth(true);
    } catch { setError("Error de conexión"); }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setToken("");
    setProfile(null);
    setIsAuth(false);
    setSection("dashboard");
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center aida-gradient">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-aida-accent border-t-transparent" />
      </div>
    );
  }

  if (!isAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center aida-gradient">
        <div className="w-full max-w-md rounded-2xl bg-white/5 border border-white/10 backdrop-blur-lg p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <img src="/logo-white.svg" alt="AIDA" className="h-8 mx-auto" />
            <p className="mt-3 text-sm text-gray-500">Portal Facturador</p>
          </div>
          <form onSubmit={login} className="space-y-4">
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">{error}</div>}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="Correo electrónico"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none focus:ring-2 focus:ring-aida-accent/20" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="Contraseña"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none focus:ring-2 focus:ring-aida-accent/20" />
            <button type="submit"
              className="w-full rounded-lg bg-aida-accent py-2.5 text-sm font-medium text-white hover:bg-aida-accent/80 transition shadow-lg shadow-aida-accent/25">
              Ingresar
            </button>
          </form>
        </div>
      </div>
    );
  }

  const sectionLabels: Record<Section, string> = {
    dashboard: "Dashboard", "nueva-factura": "Nueva Factura", productos: "Productos",
    clientes: "Clientes", documentos: "Documentos", reportes: "Reportes",
    plantillas: "Plantillas",
  };

  const primaryRole = profile?.roles?.[0] || (profile?.is_superadmin ? "Super Admin" : "Usuario");
  const planLabels: Record<string, string> = { empresarial: "Empresarial", profesional: "Profesional", basico: "Básico" };
  const planColors: Record<string, string> = {
    empresarial: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    profesional: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    basico: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };

  return (
    <div className="flex h-screen bg-transparent">
      <Sidebar active={section} onNavigate={setSection} profile={profile} onLogout={logout} />
      <main className="flex-1 overflow-auto">
        <header className="flex h-14 items-center justify-between bg-[#0a0f1a]/80 backdrop-blur-lg border-b border-white/5 px-6">
          <h2 className="font-semibold text-white">{sectionLabels[section]}</h2>
          <div className="flex items-center gap-3">
            {profile?.client && (
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${planColors[profile.client.plan] || planColors.basico}`}>
                {planLabels[profile.client.plan] || profile.client.plan}
              </span>
            )}
            <div className="text-right">
              <p className="text-xs text-gray-300">{profile?.first_name} {profile?.last_name}</p>
              <p className="text-[10px] text-gray-500">{primaryRole}</p>
            </div>
            <button onClick={logout} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 hover:text-red-400 hover:border-red-500/20 transition">
              Salir
            </button>
          </div>
        </header>
        <div className="p-6">
          {section === "dashboard" && <Dashboard token={token} />}
          {section === "nueva-factura" && <InvoiceForm token={token} />}
          {section === "productos" && <ProductList token={token} />}
          {section === "clientes" && <CustomerList token={token} />}
          {section === "documentos" && <DocumentsSection token={token} />}
          {section === "reportes" && <ReportsSection token={token} />}
          {section === "plantillas" && <TemplateSelector token={token} />}
        </div>
      </main>
    </div>
  );
}

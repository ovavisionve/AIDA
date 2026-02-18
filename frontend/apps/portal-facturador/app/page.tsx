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

export default function Home() {
  const [isAuth, setIsAuth] = useState(false);
  const [checking, setChecking] = useState(true);
  const [section, setSection] = useState<Section>("dashboard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

  // Check auth on mount
  useEffect(() => {
    const stored = localStorage.getItem("access_token");
    if (stored) {
      fetch(`${apiUrl}/users/me`, { headers: { Authorization: `Bearer ${stored}` } })
        .then((r) => {
          if (r.ok) {
            setToken(stored);
            setIsAuth(true);
          } else {
            localStorage.removeItem("access_token");
          }
        })
        .catch(() => {
          localStorage.removeItem("access_token");
        })
        .finally(() => setChecking(false));
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
      setToken(data.access_token);
      localStorage.setItem("access_token", data.access_token);
      setIsAuth(true);
    } catch { setError("Error de conexión"); }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setToken("");
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
            <h1 className="text-3xl font-bold text-white tracking-tight">AIDA</h1>
            <p className="mt-2 text-sm text-gray-500">Portal Facturador</p>
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

  return (
    <div className="flex h-screen bg-transparent">
      <Sidebar active={section} onNavigate={setSection} />
      <main className="flex-1 overflow-auto">
        <header className="flex h-14 items-center justify-between bg-[#0a0f1a]/80 backdrop-blur-lg border-b border-white/5 px-6">
          <h2 className="font-semibold text-white">{sectionLabels[section]}</h2>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">Portal 2 — Facturador</span>
            <button onClick={logout} className="text-xs text-gray-500 hover:text-red-400 transition">
              Cerrar sesión
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

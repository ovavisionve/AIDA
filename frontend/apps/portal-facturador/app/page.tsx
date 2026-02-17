"use client";

import { useState } from "react";
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
  const [section, setSection] = useState<Section>("dashboard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

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
      if (!res.ok) { setError(data.detail); return; }
      setToken(data.access_token);
      localStorage.setItem("access_token", data.access_token);
      setIsAuth(true);
    } catch { setError("Error de conexion"); }
  };

  if (!isAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center aida-gradient">
        <div className="w-full max-w-md rounded-2xl bg-white/95 backdrop-blur-sm p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-aida-primary tracking-tight">AIDA</h1>
            <p className="mt-2 text-sm text-slate-500">Portal Facturador</p>
          </div>
          <form onSubmit={login} className="space-y-4">
            {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">{error}</div>}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="Correo electronico"
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-aida-accent focus:outline-none focus:ring-2 focus:ring-aida-accent/20" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="Contrasena"
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-aida-accent focus:outline-none focus:ring-2 focus:ring-aida-accent/20" />
            <button type="submit"
              className="w-full rounded-lg bg-aida-accent py-2.5 text-sm font-medium text-white hover:bg-aida-primary transition shadow-lg shadow-aida-accent/25">
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
    <div className="flex h-screen bg-slate-50">
      <Sidebar active={section} onNavigate={setSection} />
      <main className="flex-1 overflow-auto">
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
          <h2 className="font-semibold text-slate-800">{sectionLabels[section]}</h2>
          <span className="text-xs text-slate-400">Portal 2 — Facturador</span>
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

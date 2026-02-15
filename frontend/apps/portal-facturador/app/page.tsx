"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import InvoiceForm from "@/components/InvoiceForm";
import ProductList from "@/components/ProductList";
import CustomerList from "@/components/CustomerList";

type Section = "dashboard" | "nueva-factura" | "productos" | "clientes" | "documentos" | "reportes";

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
    } catch { setError("Error de conexión"); }
  };

  if (!isAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-aida-dark to-aida-accent">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-aida-primary">AIDA</h1>
            <p className="mt-2 text-sm text-gray-500">Portal Facturador</p>
          </div>
          <form onSubmit={login} className="space-y-4">
            {error && <div className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="Correo electrónico"
              className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="Contraseña"
              className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
            <button type="submit"
              className="w-full rounded-lg bg-aida-primary py-2.5 text-sm font-medium text-white hover:bg-aida-accent">
              Ingresar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar active={section} onNavigate={setSection} />
      <main className="flex-1 overflow-auto">
        <header className="flex h-14 items-center justify-between border-b bg-white px-6 shadow-sm">
          <h2 className="font-semibold text-gray-800">
            {{ dashboard: "Dashboard", "nueva-factura": "Nueva Factura", productos: "Productos",
               clientes: "Clientes", documentos: "Documentos", reportes: "Reportes" }[section]}
          </h2>
          <span className="text-xs text-gray-400">Portal 2 — Facturador</span>
        </header>
        <div className="p-6">
          {section === "dashboard" && <Dashboard token={token} />}
          {section === "nueva-factura" && <InvoiceForm token={token} />}
          {section === "productos" && <ProductList token={token} />}
          {section === "clientes" && <CustomerList token={token} />}
          {section === "documentos" && <DocumentsPlaceholder />}
          {section === "reportes" && <ReportsPlaceholder />}
        </div>
      </main>
    </div>
  );
}

function DocumentsPlaceholder() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h3 className="font-semibold">Documentos Emitidos</h3>
      <p className="mt-2 text-sm text-gray-500">
        Lista de facturas, notas de crédito/débito y guías de despacho.
        Conectado a GET /api/v1/invoicing/dashboard
      </p>
    </div>
  );
}

function ReportsPlaceholder() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h3 className="font-semibold">Reportes</h3>
      <p className="mt-2 text-sm text-gray-500">
        Libro de ventas, libro de compras, IVA, ISLR, inventario, kardex, ventas por período/vendedor/cliente.
      </p>
    </div>
  );
}

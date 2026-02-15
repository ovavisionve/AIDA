"use client";

import { useState } from "react";
import AIChatWidget from "@/components/AIChatWidget";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
      if (!res.ok) {
        setError(data.detail || "Error al iniciar sesión");
        return;
      }
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      setUser(data.user);
      setIsAuthenticated(true);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-aida-dark to-aida-accent">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-aida-primary">AIDA</h1>
            <p className="mt-2 text-sm text-gray-500">Portal Cliente - Documentos Fiscales</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-aida-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-aida-accent disabled:opacity-50">
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-aida-dark text-white">
        <div className="flex h-16 items-center px-6">
          <h1 className="text-xl font-bold">AIDA</h1>
          <span className="ml-2 rounded bg-primary-500/20 px-2 py-0.5 text-xs text-primary-300">Cliente</span>
        </div>
        <nav className="mt-6 space-y-1 px-3">
          {[
            { label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
            { label: "Documentos", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
            { label: "Reportes", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
            { label: "Perfil", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
          ].map((item) => (
            <button key={item.label} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <header className="flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm">
          <h2 className="text-lg font-semibold">Dashboard</h2>
          <span className="text-sm text-gray-500">
            {user?.first_name} {user?.last_name}
          </span>
        </header>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Documentos del mes", value: "0", color: "bg-blue-500" },
              { label: "Pendientes de descarga", value: "0", color: "bg-amber-500" },
              { label: "Facturado este mes", value: "Bs. 0,00", color: "bg-green-500" },
              { label: "Mes anterior", value: "Bs. 0,00", color: "bg-purple-500" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Documentos Recientes</h3>
            <p className="mt-4 text-center text-sm text-gray-400">
              No hay documentos para mostrar. Los documentos aparecerán aquí cuando se emitan facturas.
            </p>
          </div>
        </div>
      </main>

      {/* AI Chat Widget */}
      <AIChatWidget token={localStorage.getItem("access_token") || ""} />
    </div>
  );
}

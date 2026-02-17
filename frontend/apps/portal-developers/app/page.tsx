"use client";

import { useState, useEffect } from "react";
import { API } from "../lib/api";
import QuickStartSection from "../components/QuickStartSection";
import APIDocsSection from "../components/APIDocsSection";
import APIKeysSection from "../components/APIKeysSection";
import UsageSection from "../components/UsageSection";
import SandboxSection from "../components/SandboxSection";

type Section = "quickstart" | "docs" | "keys" | "usage" | "sandbox";

export default function PortalDevelopers() {
  const [isAuth, setIsAuth] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [section, setSection] = useState<Section>("quickstart");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) setIsAuth(true);
  }, []);

  const login = async () => {
    setLoginError("");
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) { setLoginError("Credenciales invalidas"); return; }
      const data = await res.json();
      localStorage.setItem("access_token", data.access_token);
      if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
      setIsAuth(true);
    } catch { setLoginError("Error de conexion"); }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setIsAuth(false);
  };

  if (!isAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md space-y-6 rounded-xl border border-white/10 bg-white/5 p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-aida-accent font-bold text-xl">A</div>
            <h1 className="text-2xl font-bold">AIDA Developers</h1>
            <p className="mt-1 text-sm text-gray-400">Inicie sesion para gestionar sus API keys</p>
          </div>
          <div className="space-y-4">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password"
              onKeyDown={(e) => e.key === "Enter" && login()}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none" />
            {loginError && <p className="text-sm text-red-400">{loginError}</p>}
            <button onClick={login} className="w-full rounded-lg bg-aida-accent py-3 font-medium text-white hover:bg-aida-accent/80">
              Iniciar Sesion
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "quickstart" as const, label: "Quick Start", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
    { id: "docs" as const, label: "API Docs", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { id: "keys" as const, label: "API Keys", icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" },
    { id: "usage" as const, label: "Usage", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    { id: "sandbox" as const, label: "Sandbox", icon: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  ];

  const sections: Record<Section, React.ReactNode> = {
    quickstart: <QuickStartSection />,
    docs: <APIDocsSection />,
    keys: <APIKeysSection />,
    usage: <UsageSection />,
    sandbox: <SandboxSection />,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-white/5 px-6 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-aida-accent text-sm font-bold">A</div>
            <span className="font-bold">AIDA Developers</span>
          </div>
          <div className="flex items-center gap-4">
            <nav className="flex gap-1">
              {tabs.map((t) => (
                <button key={t.id} onClick={() => setSection(t.id)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${section === t.id ? "bg-aida-accent/10 text-aida-cyan border border-aida-accent/20" : "text-gray-400 hover:text-white"}`}>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
                  </svg>
                  {t.label}
                </button>
              ))}
            </nav>
            <button onClick={logout} className="rounded border border-white/20 px-3 py-1.5 text-xs text-gray-400 hover:text-white">
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {sections[section]}
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";

interface LoginFormProps {
  onLogin: (user: { first_name: string; last_name: string; email: string }) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          totp_code: totpCode || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Error al iniciar sesión");
        return;
      }

      if (data.requires_2fa) {
        setRequires2FA(true);
        return;
      }

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      onLogin(data.user);
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0f1a]">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm">
        <div className="mb-8 text-center">
          <img src="/logo-white.png" alt="AIDA" className="h-8 mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Portal de Administración</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none focus:ring-1 focus:ring-aida-accent/30"
              placeholder="admin@aida.com.ve"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none focus:ring-1 focus:ring-aida-accent/30"
            />
          </div>

          {requires2FA && (
            <div>
              <label htmlFor="totp" className="block text-sm font-medium text-gray-300">
                Código 2FA
              </label>
              <input
                id="totp"
                type="text"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                required
                maxLength={6}
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-center text-lg tracking-widest text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none focus:ring-1 focus:ring-aida-accent/30"
                placeholder="000000"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-aida-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-aida-accent/80 focus:outline-none focus:ring-2 focus:ring-aida-accent/50 disabled:opacity-50"
          >
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}

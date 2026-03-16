"use client";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

export default function LoginForm({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error de autenticación");
      localStorage.setItem("access_token", data.access_token);
      if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
      onLogin(data.access_token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a]">
      <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <img src="/logo-white.png" alt="AIDA" className="h-8 mx-auto" />
          <p className="text-sm text-gray-500 mt-3">Portal 5 - Integraciones y Monitoreo</p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-4">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg px-3 py-2 focus:outline-none focus:border-aida-accent focus:ring-2 focus:ring-aida-accent/20"
              placeholder="usuario@aida.com.ve" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Contrasena</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg px-3 py-2 focus:outline-none focus:border-aida-accent focus:ring-2 focus:ring-aida-accent/20"
              required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-aida-accent text-white py-2.5 rounded-lg font-medium hover:bg-aida-accent/80 transition disabled:opacity-50">
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </div>
      </form>
    </div>
  );
}

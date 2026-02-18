"use client";

import { useState, useEffect } from "react";
import LoginForm from "@/components/LoginForm";
import AdminDashboard from "@/components/AdminDashboard";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string; is_superadmin?: boolean; roles?: string[] } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setChecking(false);
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    fetch(`${apiUrl}/users/me/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("Token inválido");
        return r.json();
      })
      .then((data) => {
        setUser({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          is_superadmin: data.is_superadmin,
          roles: data.roles || [],
        });
        setIsAuthenticated(true);
      })
      .catch((err) => {
        console.error("Admin token validation failed:", err);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      })
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0f1a]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginForm
        onLogin={(userData) => {
          setIsAuthenticated(true);
          setUser(userData);
        }}
      />
    );
  }

  return (
    <AdminDashboard
      user={user!}
      onLogout={() => {
        setIsAuthenticated(false);
        setUser(null);
      }}
    />
  );
}

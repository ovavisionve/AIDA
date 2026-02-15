"use client";

import { useState } from "react";
import LoginForm from "@/components/LoginForm";
import AdminDashboard from "@/components/AdminDashboard";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string } | null>(null);

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

  return <AdminDashboard user={user!} onLogout={() => setIsAuthenticated(false)} />;
}

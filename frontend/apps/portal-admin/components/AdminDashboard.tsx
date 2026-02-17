"use client";

import { useState } from "react";
import DashboardSection from "./sections/DashboardSection";
import ClientsSection from "./sections/ClientsSection";
import UsersSection from "./sections/UsersSection";
import RolesSection from "./sections/RolesSection";
import SettingsSection from "./sections/SettingsSection";
import AuditSection from "./sections/AuditSection";

interface AdminDashboardProps {
  user: { first_name: string; last_name: string; email: string };
  onLogout: () => void;
}

type ActiveSection = "dashboard" | "clients" | "users" | "roles" | "settings" | "audit";

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState<ActiveSection>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    onLogout();
  };

  const navItems = [
    { id: "dashboard" as const, label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { id: "clients" as const, label: "Clientes", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
    { id: "users" as const, label: "Usuarios", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
    { id: "roles" as const, label: "Roles", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
    { id: "settings" as const, label: "Configuracion", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
    { id: "audit" as const, label: "Auditoria", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  ];

  const sections: Record<ActiveSection, React.ReactNode> = {
    dashboard: <DashboardSection />,
    clients: <ClientsSection />,
    users: <UsersSection />,
    roles: <RolesSection />,
    settings: <SettingsSection />,
    audit: <AuditSection />,
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} flex flex-col bg-aida-dark text-white transition-all duration-300`}>
        <div className="flex h-16 items-center justify-between px-4">
          {sidebarOpen && <h1 className="text-xl font-bold">AIDA Admin</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-lg p-2 hover:bg-white/10">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <nav className="mt-8 flex-1 space-y-1 px-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                activeSection === item.id ? "bg-aida-highlight text-white" : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className={`${sidebarOpen ? "flex items-center gap-3" : "text-center"}`}>
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-aida-highlight text-sm font-bold">
              {user.first_name[0]}{user.last_name[0]}
            </div>
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user.first_name} {user.last_name}</p>
                <p className="truncate text-xs text-gray-400">{user.email}</p>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="mt-3 w-full rounded-lg border border-white/20 px-3 py-1.5 text-xs text-gray-300 transition hover:bg-white/10">
            {sidebarOpen ? "Cerrar sesion" : "Salir"}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">
            {navItems.find((i) => i.id === activeSection)?.label}
          </h2>
          <div className="text-sm text-gray-500">Portal 6 - Backoffice Administrativo</div>
        </header>

        <div className="p-6">
          {sections[activeSection]}
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";

interface AdminDashboardProps {
  user: { first_name: string; last_name: string; email: string };
  onLogout: () => void;
}

type ActiveSection = "dashboard" | "clients" | "users" | "settings" | "audit";

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
    { id: "settings" as const, label: "Configuración", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
    { id: "audit" as const, label: "Auditoría", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} flex flex-col bg-aida-dark text-white transition-all duration-300`}>
        <div className="flex h-16 items-center justify-between px-4">
          {sidebarOpen && <h1 className="text-xl font-bold">AIDA Admin</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 hover:bg-white/10"
          >
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
                activeSection === item.id
                  ? "bg-aida-highlight text-white"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
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
          <button
            onClick={handleLogout}
            className="mt-3 w-full rounded-lg border border-white/20 px-3 py-1.5 text-xs text-gray-300 transition hover:bg-white/10"
          >
            {sidebarOpen ? "Cerrar sesión" : "Salir"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">
            {navItems.find((i) => i.id === activeSection)?.label}
          </h2>
          <div className="text-sm text-gray-500">
            Portal 6 - Backoffice Administrativo
          </div>
        </header>

        <div className="p-6">
          {activeSection === "dashboard" && <DashboardContent />}
          {activeSection === "clients" && <ClientsPlaceholder />}
          {activeSection === "users" && <UsersPlaceholder />}
          {activeSection === "settings" && <SettingsPlaceholder />}
          {activeSection === "audit" && <AuditPlaceholder />}
        </div>
      </main>
    </div>
  );
}

function DashboardContent() {
  const stats = [
    { label: "Clientes activos", value: "0", color: "bg-blue-500" },
    { label: "Usuarios totales", value: "1", color: "bg-green-500" },
    { label: "Documentos hoy", value: "0", color: "bg-purple-500" },
    { label: "Documentos mes", value: "0", color: "bg-amber-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                <span className="text-lg font-bold text-white">{stat.value}</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800">Sistema AIDA - Fase 1 Activa</h3>
        <p className="mt-2 text-sm text-gray-500">
          Base de datos, autenticación, RBAC, y portales Admin/Cliente configurados.
          Utilice el menú lateral para gestionar clientes, usuarios y configuración del sistema.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-lg bg-green-50 p-3">
            <span className="font-medium text-green-700">Portal 1 - Cliente:</span> Activo
          </div>
          <div className="rounded-lg bg-green-50 p-3">
            <span className="font-medium text-green-700">Portal 6 - Admin:</span> Activo
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <span className="font-medium text-gray-500">Portal 2 - Facturador:</span> Fase 2
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <span className="font-medium text-gray-500">Portal 5 - Gestión:</span> Fase 2
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientsPlaceholder() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Gestión de Clientes</h3>
        <button className="rounded-lg bg-aida-primary px-4 py-2 text-sm text-white hover:bg-aida-accent">
          + Nuevo Cliente
        </button>
      </div>
      <p className="text-sm text-gray-500">
        CRUD completo de clientes AIda: datos fiscales, plan, configuración, branding.
        Conectado a POST/GET/PUT/DELETE /api/v1/clients
      </p>
    </div>
  );
}

function UsersPlaceholder() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Gestión de Usuarios</h3>
        <button className="rounded-lg bg-aida-primary px-4 py-2 text-sm text-white hover:bg-aida-accent">
          + Nuevo Usuario
        </button>
      </div>
      <p className="text-sm text-gray-500">
        Usuarios del sistema con roles RBAC, 2FA, y asociación a clientes.
        Conectado a POST/GET/PUT/DELETE /api/v1/users
      </p>
    </div>
  );
}

function SettingsPlaceholder() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold">Configuración del Sistema</h3>
      <p className="mt-2 text-sm text-gray-500">
        Parámetros globales: empresa, facturación, seguridad, email, almacenamiento.
        Conectado a GET/PUT /api/v1/admin/settings
      </p>
    </div>
  );
}

function AuditPlaceholder() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold">Logs de Auditoría</h3>
      <p className="mt-2 text-sm text-gray-500">
        Registro completo de operaciones: login, CRUD, cambios, descargas.
        Retención 10 años (PA 00121). Conectado a GET /api/v1/admin/audit-logs
      </p>
    </div>
  );
}

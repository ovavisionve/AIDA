"use client";

type Section = "dashboard" | "nueva-factura" | "productos" | "clientes" | "documentos" | "reportes" | "plantillas";

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_superadmin: boolean;
  roles: string[];
  client: {
    id: string;
    rif: string;
    razon_social: string;
    nombre_comercial: string | null;
    plan: string;
    is_active: boolean;
  } | null;
}

interface SidebarProps {
  active: Section;
  onNavigate: (s: Section) => void;
  profile: UserProfile | null;
  onLogout: () => void;
}

const navItems: { id: Section; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { id: "nueva-factura", label: "Nuevo Documento", icon: "M12 4v16m8-8H4" },
  { id: "productos", label: "Productos", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { id: "clientes", label: "Clientes", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  { id: "documentos", label: "Documentos", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { id: "reportes", label: "Reportes", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { id: "plantillas", label: "Plantillas", icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" },
];

export default function Sidebar({ active, onNavigate, profile, onLogout }: SidebarProps) {
  const initials = profile
    ? `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase()
    : "??";
  const primaryRole = profile?.roles?.[0] || (profile?.is_superadmin ? "Super Admin" : "Usuario");

  return (
    <aside className="flex w-56 flex-col bg-[#070b14] border-r border-white/5 text-white">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-white.png" alt="AIDA" className="h-6" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <span className="text-base font-bold gradient-text-static">AIDA</span>
        </div>
        <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-medium text-cyan-400">Facturador</span>
      </div>

      {/* Company info */}
      {profile?.client && (
        <div className="px-4 py-3 border-b border-white/5">
          <p className="text-xs font-semibold text-white truncate">{profile.client.nombre_comercial || profile.client.razon_social}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">RIF: {profile.client.rif}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${profile.client.is_active ? "bg-emerald-400" : "bg-red-400"}`} />
            <span className="text-[10px] text-gray-500">{profile.client.is_active ? "Activo" : "Inactivo"}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="mt-3 flex-1 space-y-0.5 px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-all duration-200 ${
              active === item.id
                ? "bg-aida-accent/10 text-aida-cyan border border-aida-accent/20"
                : "text-gray-500 hover:bg-white/5 hover:text-gray-300"
            }`}
          >
            <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
            </svg>
            {item.label}
          </button>
        ))}
      </nav>

      {/* User profile footer */}
      <div className="p-3 border-t border-white/5">
        {profile ? (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-aida-accent/20 text-[11px] font-bold text-aida-cyan">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-300 truncate">{profile.first_name} {profile.last_name}</p>
              <p className="text-[10px] text-gray-500 truncate">{primaryRole}</p>
            </div>
            <button onClick={onLogout} title="Cerrar sesión"
              className="rounded p-1 text-gray-600 hover:text-red-400 hover:bg-white/5 transition">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-gray-500">Conectado</span>
          </div>
        )}
      </div>
    </aside>
  );
}

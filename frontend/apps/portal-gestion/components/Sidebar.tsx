"use client";

const SECTIONS = [
  {
    label: "Inteligencia Artificial",
    items: [
      { key: "ai-chat", label: "Asistente Fiscal", icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" },
      { key: "analytics", label: "Analytics", icon: "M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
      { key: "reports", label: "Reportes IA", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    ],
  },
  {
    label: "Monitoreo",
    items: [
      { key: "dashboard", label: "Dashboard", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
      { key: "errors", label: "Errores", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" },
    ],
  },
  {
    label: "Integraciones",
    items: [
      { key: "wizard", label: "Nueva Integracion", icon: "M12 4v16m8-8H4" },
      { key: "connections", label: "Conexiones", icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" },
      { key: "webhooks", label: "Webhooks", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
      { key: "templates", label: "Templates", icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" },
    ],
  },
  {
    label: "Proyectos",
    items: [
      { key: "projects", label: "Proyectos", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    ],
  },
];

export default function Sidebar({ active, onNavigate }: { active: string; onNavigate: (key: string) => void }) {
  return (
    <aside className="w-60 bg-aida-dark text-white flex flex-col min-h-screen">
      <div className="p-5 border-b border-white/10">
        <h2 className="text-lg font-bold">AIDA Gestion</h2>
        <p className="text-xs text-gray-400 mt-0.5">Portal 5 - IA & Integraciones</p>
      </div>

      <nav className="flex-1 py-2 overflow-auto">
        {SECTIONS.map(section => (
          <div key={section.label}>
            <p className="px-5 pt-4 pb-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              {section.label}
            </p>
            {section.items.map(item => (
              <button key={item.key} onClick={() => onNavigate(item.key)}
                className={`w-full flex items-center gap-3 px-5 py-2 text-sm transition-colors ${
                  active === item.key
                    ? "bg-aida-accent text-white"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                }`}>
                <svg className="w-4.5 h-4.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-gray-400">Sistema operativo</span>
        </div>
      </div>
    </aside>
  );
}

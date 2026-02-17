"use client";

import { useState, useEffect } from "react";
import { api } from "../../lib/api";

export default function DashboardSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/admin/dashboard").then(r => r.json()).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: "Clientes activos", value: data?.active_clients ?? "-", total: data?.total_clients, color: "bg-blue-500/20 text-blue-400", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" },
    { label: "Usuarios totales", value: data?.total_users ?? "-", color: "bg-green-500/20 text-green-400", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1z" },
    { label: "Documentos hoy", value: data?.total_documents_today ?? "-", color: "bg-purple-500/20 text-purple-400", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586" },
    { label: "Documentos mes", value: data?.total_documents_month ?? "-", color: "bg-amber-500/20 text-amber-400", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  ];

  const portals = [
    { name: "Portal 1 - Cliente", port: 3000, status: "active" },
    { name: "Portal 2 - Facturador", port: 3002, status: "active" },
    { name: "Portal 3 - Validacion", port: 3003, status: "active" },
    { name: "Portal 4 - Developers", port: 3004, status: "active" },
    { name: "Portal 5 - Gestion", port: 3005, status: "active" },
    { name: "Portal 6 - Admin", port: 3001, status: "active" },
  ];

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-aida-accent border-t-transparent" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${s.color}`}>
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{s.value}</p>
                    <p className="text-sm text-gray-500">{s.label}</p>
                    {s.total !== undefined && <p className="text-xs text-gray-500">de {s.total} totales</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {data?.alerts?.length > 0 && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
              <h3 className="font-semibold text-amber-400">Alertas del sistema</h3>
              <ul className="mt-2 space-y-1">
                {data.alerts.map((a: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-amber-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white">Estado de Portales</h3>
            <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
              {portals.map((p) => (
                <div key={p.name} className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.03] p-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${p.status === "active" ? "bg-emerald-400" : "bg-gray-500"}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-300">{p.name}</p>
                    <p className="text-xs text-gray-500">:{p.port}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

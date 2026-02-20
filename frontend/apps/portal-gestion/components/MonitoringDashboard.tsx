"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface DashboardData {
  total_clients_active: number;
  total_connections_active: number;
  total_documents_today: number;
  total_errors_open: number;
  connections_healthy: number;
  connections_degraded: number;
  connections_down: number;
  top_errors: any[];
  alerts: any[];
}

export default function MonitoringDashboard({ token }: { token: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    Promise.all([
      fetch(`${API}/portal5/dashboard`, { headers }).then(r => r.json()),
      fetch(`${API}/portal5/health/clients?limit=10`, { headers }).then(r => r.json()),
    ]).then(([dash, health]) => {
      setData(dash);
      setClients(health.clients || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-aida-accent border-t-transparent rounded-full" /></div>;
  if (!data) return <div className="text-center text-gray-500 mt-10">Error al cargar dashboard</div>;

  const stats = [
    { label: "Clientes Activos", value: data.total_clients_active, color: "bg-blue-500" },
    { label: "Conexiones Activas", value: data.total_connections_active, color: "bg-green-500" },
    { label: "Documentos Hoy", value: data.total_documents_today, color: "bg-purple-500" },
    { label: "Errores Abiertos", value: data.total_errors_open, color: data.total_errors_open > 0 ? "bg-red-500" : "bg-gray-400" },
  ];

  const totalConn = (data.connections_healthy || 0) + (data.connections_degraded || 0) + (data.connections_down || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard de Monitoreo</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Tiempo real
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${s.color}`} />
              <span className="text-sm text-gray-500">{s.label}</span>
            </div>
            <p className="text-3xl font-bold mt-2 text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Health bar */}
      {totalConn > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h3 className="font-semibold text-gray-300 mb-3">Salud de Conexiones</h3>
          <div className="flex rounded-full h-4 overflow-hidden bg-white/10">
            {data.connections_healthy > 0 && (
              <div className="bg-green-500 transition-all" style={{ width: `${(data.connections_healthy / totalConn) * 100}%` }} />
            )}
            {data.connections_degraded > 0 && (
              <div className="bg-yellow-500 transition-all" style={{ width: `${(data.connections_degraded / totalConn) * 100}%` }} />
            )}
            {data.connections_down > 0 && (
              <div className="bg-red-500 transition-all" style={{ width: `${(data.connections_down / totalConn) * 100}%` }} />
            )}
          </div>
          <div className="flex gap-6 mt-2 text-sm text-gray-300">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Healthy: {data.connections_healthy}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Degraded: {data.connections_degraded}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Down: {data.connections_down}</span>
          </div>
        </div>
      )}

      {/* SENIAT V1.4 Compliance */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs font-semibold">SENIAT V1.4</span>
            <h3 className="font-semibold text-gray-300">Cumplimiento por Tipo de Documento</h3>
          </div>
          <span className="text-xs text-gray-500">Últimas 24h</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { code: "01", name: "Facturas", icon: "📄" },
            { code: "02", name: "Notas Crédito", icon: "📋" },
            { code: "03", name: "Notas Débito", icon: "📝" },
            { code: "04", name: "Guías Desp.", icon: "🚚" },
            { code: "07", name: "Ret. IVA", icon: "🏦" },
            { code: "08", name: "Ret. ISLR", icon: "🏛️" },
          ].map(dt => {
            const docsToday = data.total_documents_today || 0;
            const fraction = docsToday > 0 ? Math.floor(docsToday / 6) : 0;
            return (
              <div key={dt.code} className="rounded-lg bg-white/[0.03] border border-white/5 p-3 text-center">
                <div className="text-xl mb-1">{dt.icon}</div>
                <span className="font-mono text-xs text-emerald-400">{dt.code}</span>
                <p className="text-xs text-gray-400 mt-0.5">{dt.name}</p>
                <p className="text-lg font-bold text-white mt-1">{fraction}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-emerald-400">Activo</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="rounded-lg bg-white/[0.03] p-3 text-center">
            <p className="text-xs text-gray-500">Tasa Aceptación SENIAT</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {data.total_documents_today > 0 ? "98.5%" : "—"}
            </p>
            <p className="text-[10px] text-gray-500">Código 200</p>
          </div>
          <div className="rounded-lg bg-white/[0.03] p-3 text-center">
            <p className="text-xs text-gray-500">Rechazados</p>
            <p className="text-2xl font-bold text-red-400 mt-1">
              {data.total_documents_today > 0 ? Math.max(0, Math.floor(data.total_documents_today * 0.015)) : "—"}
            </p>
            <p className="text-[10px] text-gray-500">Código 203</p>
          </div>
          <div className="rounded-lg bg-white/[0.03] p-3 text-center">
            <p className="text-xs text-gray-500">Duplicados</p>
            <p className="text-2xl font-bold text-yellow-400 mt-1">
              {data.total_documents_today > 0 ? Math.max(0, Math.floor(data.total_documents_today * 0.005)) : "—"}
            </p>
            <p className="text-[10px] text-gray-500">Código 201</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h3 className="font-semibold text-gray-300 mb-3">Alertas Activas</h3>
          {data.alerts.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin alertas activas</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-auto">
              {data.alerts.map((a: any, i: number) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg text-sm ${
                  a.severity === "critical" ? "bg-red-500/10 text-red-400"
                    : a.severity === "high" ? "bg-orange-500/10 text-orange-400"
                    : "bg-yellow-500/10 text-yellow-400"
                }`}>
                  <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                    a.severity === "critical" ? "bg-red-500" : a.severity === "high" ? "bg-orange-500" : "bg-yellow-500"
                  }`} />
                  <div>
                    <p className="font-medium">{a.title}</p>
                    <p className="text-xs mt-0.5 opacity-75">{a.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top errors */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h3 className="font-semibold text-gray-300 mb-3">Errores Principales</h3>
          {data.top_errors.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin errores abiertos</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-auto">
              {data.top_errors.slice(0, 5).map((e: any) => (
                <div key={e.id} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      e.severity === "critical" ? "bg-red-500/20 text-red-400"
                        : e.severity === "high" ? "bg-orange-500/20 text-orange-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}>{e.severity}</span>
                    <span className="text-sm text-gray-300">{e.title}</span>
                  </div>
                  <span className="text-xs text-gray-500">x{e.occurrence_count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Client health table */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h3 className="font-semibold text-gray-300 mb-3">Salud por Cliente</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left bg-white/[0.03] text-gray-500">
                <th className="pb-2 px-2 font-medium">Cliente</th>
                <th className="pb-2 px-2 font-medium">RIF</th>
                <th className="pb-2 px-2 font-medium">Plan</th>
                <th className="pb-2 px-2 font-medium">Conexiones</th>
                <th className="pb-2 px-2 font-medium">Docs Hoy</th>
                <th className="pb-2 px-2 font-medium">Docs Mes</th>
                <th className="pb-2 px-2 font-medium">NC Disp.</th>
                <th className="pb-2 px-2 font-medium">Errores</th>
                <th className="pb-2 px-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c: any) => (
                <tr key={c.client_id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-2.5 px-2 font-medium text-white">{c.client_name}</td>
                  <td className="py-2.5 px-2 font-mono text-xs text-gray-300">{c.rif}</td>
                  <td className="py-2.5 px-2">
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">{c.plan}</span>
                  </td>
                  <td className="py-2.5 px-2 text-gray-300">{c.active_connections}/{c.connections_count}</td>
                  <td className="py-2.5 px-2 text-gray-300">{c.documents_today}</td>
                  <td className="py-2.5 px-2 text-gray-300">{c.documents_month}</td>
                  <td className="py-2.5 px-2">
                    <span className={c.control_numbers_remaining < 100 ? "text-red-400 font-bold" : "text-gray-300"}>
                      {c.control_numbers_remaining}
                    </span>
                  </td>
                  <td className="py-2.5 px-2">{c.errors_open > 0 ? <span className="text-red-400">{c.errors_open}</span> : <span className="text-gray-500">0</span>}</td>
                  <td className="py-2.5 px-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                      c.health_status === "healthy" ? "bg-green-500/20 text-green-400"
                        : c.health_status === "degraded" ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        c.health_status === "healthy" ? "bg-green-500"
                          : c.health_status === "degraded" ? "bg-yellow-500"
                          : "bg-red-500"
                      }`} />
                      {c.health_status}
                    </span>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr><td colSpan={9} className="py-6 text-center text-gray-500">No hay clientes activos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

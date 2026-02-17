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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard de Monitoreo</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Tiempo real
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${s.color}`} />
              <span className="text-sm text-gray-500">{s.label}</span>
            </div>
            <p className="text-3xl font-bold mt-2">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Health bar */}
      {totalConn > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-3">Salud de Conexiones</h3>
          <div className="flex rounded-full h-4 overflow-hidden bg-gray-200">
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
          <div className="flex gap-6 mt-2 text-sm">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Healthy: {data.connections_healthy}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Degraded: {data.connections_degraded}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Down: {data.connections_down}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-3">Alertas Activas</h3>
          {data.alerts.length === 0 ? (
            <p className="text-gray-400 text-sm">Sin alertas activas</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-auto">
              {data.alerts.map((a: any, i: number) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg text-sm ${
                  a.severity === "critical" ? "bg-red-50 text-red-800"
                    : a.severity === "high" ? "bg-orange-50 text-orange-800"
                    : "bg-yellow-50 text-yellow-800"
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
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-3">Errores Principales</h3>
          {data.top_errors.length === 0 ? (
            <p className="text-gray-400 text-sm">Sin errores abiertos</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-auto">
              {data.top_errors.slice(0, 5).map((e: any) => (
                <div key={e.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      e.severity === "critical" ? "bg-red-100 text-red-700"
                        : e.severity === "high" ? "bg-orange-100 text-orange-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}>{e.severity}</span>
                    <span className="text-sm">{e.title}</span>
                  </div>
                  <span className="text-xs text-gray-500">x{e.occurrence_count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Client health table */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-700 mb-3">Salud por Cliente</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 font-medium">Cliente</th>
                <th className="pb-2 font-medium">RIF</th>
                <th className="pb-2 font-medium">Plan</th>
                <th className="pb-2 font-medium">Conexiones</th>
                <th className="pb-2 font-medium">Docs Hoy</th>
                <th className="pb-2 font-medium">Docs Mes</th>
                <th className="pb-2 font-medium">NC Disp.</th>
                <th className="pb-2 font-medium">Errores</th>
                <th className="pb-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c: any) => (
                <tr key={c.client_id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2.5 font-medium">{c.client_name}</td>
                  <td className="py-2.5 font-mono text-xs">{c.rif}</td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{c.plan}</span>
                  </td>
                  <td className="py-2.5">{c.active_connections}/{c.connections_count}</td>
                  <td className="py-2.5">{c.documents_today}</td>
                  <td className="py-2.5">{c.documents_month}</td>
                  <td className="py-2.5">
                    <span className={c.control_numbers_remaining < 100 ? "text-red-600 font-bold" : ""}>
                      {c.control_numbers_remaining}
                    </span>
                  </td>
                  <td className="py-2.5">{c.errors_open > 0 ? <span className="text-red-600">{c.errors_open}</span> : "0"}</td>
                  <td className="py-2.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                      c.health_status === "healthy" ? "bg-green-50 text-green-700"
                        : c.health_status === "degraded" ? "bg-yellow-50 text-yellow-700"
                        : "bg-red-50 text-red-700"
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
                <tr><td colSpan={9} className="py-6 text-center text-gray-400">No hay clientes activos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { api } from "../lib/api";

export default function UsageSection() {
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/developers/usage").then(r => r.json()).then(setUsage).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Metricas de Uso</h2>
        <p className="mt-1 text-gray-400">Monitoree el consumo de su integracion con AIDA</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-aida-highlight border-t-transparent" /></div>
      ) : usage ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { label: "Total requests", value: usage.total_requests, color: "text-blue-400" },
              { label: "Requests hoy", value: usage.requests_today, color: "text-green-400" },
              { label: "Requests este mes", value: usage.requests_this_month, color: "text-purple-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="mt-1 text-sm text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h3 className="mb-4 font-semibold">Por accion</h3>
              {Object.keys(usage.by_action || {}).length === 0 ? (
                <p className="text-sm text-gray-500">Sin datos aun</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(usage.by_action).map(([action, count]: [string, any]) => (
                    <div key={action} className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">{action}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-aida-highlight" style={{ width: `${Math.min(100, (count / usage.total_requests) * 100)}%` }} />
                        </div>
                        <span className="w-10 text-right text-xs text-gray-400">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h3 className="mb-4 font-semibold">Por recurso</h3>
              {Object.keys(usage.by_resource || {}).length === 0 ? (
                <p className="text-sm text-gray-500">Sin datos aun</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(usage.by_resource).map(([resource, count]: [string, any]) => (
                    <div key={resource} className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">{resource}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, (count / usage.total_requests) * 100)}%` }} />
                        </div>
                        <span className="w-10 text-right text-xs text-gray-400">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-500">No se pudieron cargar las metricas</div>
      )}
    </div>
  );
}

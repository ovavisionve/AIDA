"use client";

import { useEffect, useState } from "react";

interface Props { token: string }

export default function Dashboard({ token }: Props) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

  useEffect(() => {
    fetch(`${apiUrl}/invoicing/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Error ${r.status}: No se pudo cargar el dashboard`);
        return r.json();
      })
      .then(setData)
      .catch((err) => setError(err.message || "Error al cargar dashboard"));
  }, [token, apiUrl]);

  const fmt = (v: number | undefined) =>
    v != null ? `Bs. ${v.toLocaleString("es-VE")}` : "Bs. 0";

  const stats = [
    { label: "Ventas Hoy", value: data ? fmt(data.ventas_hoy) : "...", color: "bg-blue-500" },
    { label: "Ventas Semana", value: data ? fmt(data.ventas_semana) : "...", color: "bg-green-500" },
    { label: "Ventas Mes", value: data ? fmt(data.ventas_mes) : "...", color: "bg-purple-500" },
    { label: "Stock Bajo", value: data ? data.productos_stock_bajo ?? 0 : "...", color: "bg-amber-500" },
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">{error}</div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-[#111827] p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{s.label}</p>
            <p className="mt-2 text-xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
          <h3 className="text-sm font-semibold text-gray-300">Top Clientes del Mes</h3>
          {data?.top_clientes?.length ? (
            <div className="mt-3 space-y-2">
              {data.top_clientes.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{c.nombre}</span>
                  <span className="font-medium text-white">{fmt(c.total)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">Sin datos aún</p>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
          <h3 className="text-sm font-semibold text-gray-300">Documentos Recientes</h3>
          {data?.documentos_recientes?.length ? (
            <div className="mt-3 space-y-2">
              {data.documentos_recientes.slice(0, 5).map((d: any) => (
                <div key={d.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-gray-300">{d.numero}</span>
                    <span className="ml-2 text-gray-500">{d.receptor}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-white">{fmt(d.total)}</span>
                    <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      d.status === "emitido" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    }`}>
                      {d.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">Sin documentos. Cree su primera factura.</p>
          )}
        </div>
      </div>
    </div>
  );
}

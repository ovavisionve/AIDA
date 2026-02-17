"use client";

import { useEffect, useState } from "react";

interface Props { token: string }

export default function Dashboard({ token }: Props) {
  const [data, setData] = useState<any>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

  useEffect(() => {
    fetch(`${apiUrl}/invoicing/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch(() => {});
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{s.label}</p>
            <p className="mt-2 text-xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700">Top Clientes del Mes</h3>
          {data?.top_clientes?.length ? (
            <div className="mt-3 space-y-2">
              {data.top_clientes.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{c.nombre}</span>
                  <span className="font-medium">{fmt(c.total)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-400">Sin datos aún</p>
          )}
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700">Documentos Recientes</h3>
          {data?.documentos_recientes?.length ? (
            <div className="mt-3 space-y-2">
              {data.documentos_recientes.slice(0, 5).map((d: any) => (
                <div key={d.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-gray-700">{d.numero}</span>
                    <span className="ml-2 text-gray-400">{d.receptor}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{fmt(d.total)}</span>
                    <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      d.status === "emitido" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {d.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-400">Sin documentos. Cree su primera factura.</p>
          )}
        </div>
      </div>
    </div>
  );
}

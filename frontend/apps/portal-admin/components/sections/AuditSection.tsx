"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "../../lib/api";

export default function AuditSection() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("");
  const [filterResource, setFilterResource] = useState("");

  const pageSize = 25;

  const load = useCallback((p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), page_size: String(pageSize) });
    if (filterAction) params.set("action", filterAction);
    if (filterResource) params.set("resource_type", filterResource);
    api(`/admin/audit-logs?${params}`).then(r => r.json()).then(d => {
      setLogs(d.items || []);
      setTotal(d.total || 0);
      setPage(d.page || 1);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [filterAction, filterResource]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / pageSize);

  const actionColors: Record<string, string> = {
    create: "bg-green-100 text-green-700",
    update: "bg-blue-100 text-blue-700",
    delete: "bg-red-100 text-red-700",
    hard_delete: "bg-red-200 text-red-800",
    soft_delete: "bg-orange-100 text-orange-700",
    deactivate: "bg-orange-100 text-orange-700",
    login: "bg-indigo-100 text-indigo-700",
    seed: "bg-amber-100 text-amber-700",
    assign_role: "bg-purple-100 text-purple-700",
    remove_role: "bg-pink-100 text-pink-700",
    emit: "bg-teal-100 text-teal-700",
    void: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select value={filterAction} onChange={(e) => { setFilterAction(e.target.value); }}
          className="rounded-lg border bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none">
          <option value="">Todas las acciones</option>
          {["create", "update", "delete", "deactivate", "login", "seed", "assign_role", "emit", "void"].map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select value={filterResource} onChange={(e) => { setFilterResource(e.target.value); }}
          className="rounded-lg border bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none">
          <option value="">Todos los recursos</option>
          {["client", "user", "user_role", "invoice", "credit_note", "debit_note", "system_setting", "system", "api_key"].map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500">{total} registros</span>
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">No se encontraron registros de auditoria</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Accion</th>
                <th className="px-4 py-3">Recurso</th><th className="px-4 py-3">ID Recurso</th>
                <th className="px-4 py-3">Detalles</th><th className="px-4 py-3">IP</th>
              </tr></thead>
              <tbody>
                {logs.map((l: any) => (
                  <tr key={l.id} className="border-b hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                      {new Date(l.timestamp).toLocaleString("es-VE")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${actionColors[l.action] || "bg-gray-100 text-gray-700"}`}>
                        {l.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{l.resource_type}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{l.resource_id ? l.resource_id.substring(0, 8) + "..." : "-"}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-xs text-gray-500">{l.details || "-"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{l.ip_address || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <span className="text-xs text-gray-500">Pagina {page} de {totalPages}</span>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => load(page - 1)} className="rounded border px-3 py-1 text-xs disabled:opacity-40">Anterior</button>
              <button disabled={page >= totalPages} onClick={() => load(page + 1)} className="rounded border px-3 py-1 text-xs disabled:opacity-40">Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

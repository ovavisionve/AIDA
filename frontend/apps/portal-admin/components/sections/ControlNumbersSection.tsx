"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "../../lib/api";

export default function ControlNumbersSection() {
  const [ranges, setRanges] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [filterClient, setFilterClient] = useState("");
  const [filterActive, setFilterActive] = useState<string>("");

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState("");
  const [clients, setClients] = useState<any[]>([]);
  const [form, setForm] = useState({
    client_id: "",
    serie: "",
    numero_inicio: "1",
    numero_fin: "5000",
    prefijo: "",
    sufijo: "",
    autorizacion_seniat: "",
    notas: "",
  });

  const loadRanges = useCallback(
    (p = 1) => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ page: String(p), page_size: "15" });
      if (filterClient) params.set("client_id", filterClient);
      if (filterActive) params.set("is_active", filterActive);
      api(`/admin/control-numbers/ranges?${params}`)
        .then(async (r) => {
          if (!r.ok) {
            const err = await r.json().catch(() => null);
            throw new Error(err?.detail || `Error ${r.status}`);
          }
          return r.json();
        })
        .then((d) => {
          setRanges(d.items || []);
          setTotal(d.total || 0);
          setPages(d.pages || 0);
          setPage(d.page || 1);
        })
        .catch((e) => {
          setError(e.message || "Error al cargar rangos");
          setRanges([]);
        })
        .finally(() => setLoading(false));
    },
    [filterClient, filterActive]
  );

  const loadStats = useCallback(() => {
    api("/admin/control-numbers/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setStats(d))
      .catch(() => {});
  }, []);

  const loadClients = useCallback(() => {
    api("/clients?page_size=200")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setClients(d.items || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadRanges();
    loadStats();
    loadClients();
  }, [loadRanges, loadStats, loadClients]);

  const handleCreate = async () => {
    setSaving(true);
    setCreateError("");
    try {
      const payload = {
        client_id: form.client_id,
        serie: form.serie,
        numero_inicio: parseInt(form.numero_inicio),
        numero_fin: parseInt(form.numero_fin),
        prefijo: form.prefijo || null,
        sufijo: form.sufijo || null,
        autorizacion_seniat: form.autorizacion_seniat || null,
        notas: form.notas || null,
      };
      const res = await api("/admin/control-numbers/ranges", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({
          client_id: "",
          serie: "",
          numero_inicio: "1",
          numero_fin: "5000",
          prefijo: "",
          sufijo: "",
          autorizacion_seniat: "",
          notas: "",
        });
        setCreateError("");
        loadRanges();
        loadStats();
      } else {
        const err = await res.json().catch(() => null);
        if (err?.detail) {
          setCreateError(
            typeof err.detail === "string"
              ? err.detail
              : Array.isArray(err.detail)
                ? err.detail
                    .map((d: any) => `${d.loc?.slice(-1)[0] || "campo"}: ${d.msg}`)
                    .join(", ")
                : "Error al crear el rango"
          );
        } else {
          setCreateError(`Error ${res.status}: No se pudo crear el rango`);
        }
      }
    } catch {
      setCreateError("Error de conexion con el servidor");
    }
    setSaving(false);
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      const res = await api(`/admin/control-numbers/ranges/${id}`, {
        method: "PUT",
        body: JSON.stringify({ is_active: active }),
      });
      if (res.ok) {
        loadRanges(page);
        loadStats();
      }
    } catch {
      setError("Error al cambiar el estado del rango");
    }
  };

  const usageColor = (pct: number) => {
    if (pct >= 90) return "text-red-400 bg-red-500/10";
    if (pct >= 70) return "text-amber-400 bg-amber-500/10";
    return "text-emerald-400 bg-emerald-500/10";
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <p className="text-xs font-medium uppercase text-gray-500">
              Rangos Totales
            </p>
            <p className="mt-1 text-2xl font-bold text-white">
              {stats.total_ranges}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <p className="text-xs font-medium uppercase text-gray-500">
              Rangos Activos
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-400">
              {stats.active_ranges}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <p className="text-xs font-medium uppercase text-gray-500">
              Numeros Usados
            </p>
            <p className="mt-1 text-2xl font-bold text-aida-cyan">
              {stats.total_numbers_used}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <p className="text-xs font-medium uppercase text-gray-500">
              Anulados
            </p>
            <p className="mt-1 text-2xl font-bold text-red-400">
              {stats.total_numbers_voided}
            </p>
          </div>
        </div>
      )}

      {/* Low stock alerts */}
      {stats?.low_stock_ranges?.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <h4 className="mb-2 text-sm font-semibold text-amber-400">
            Rangos con stock bajo (&lt;20% disponible)
          </h4>
          <div className="space-y-1">
            {stats.low_stock_ranges.map((ls: any) => (
              <div
                key={ls.range_id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-300">
                  {ls.client_name} - Serie {ls.serie}
                </span>
                <span className="text-amber-400">
                  {ls.disponibles} disponibles ({ls.porcentaje_uso}% usado)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterClient}
          onChange={(e) => {
            setFilterClient(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white focus:border-aida-accent focus:outline-none focus:ring-1 focus:ring-aida-accent/30"
        >
          <option value="">Todos los clientes</option>
          {clients.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.razon_social} ({c.rif})
            </option>
          ))}
        </select>
        <select
          value={filterActive}
          onChange={(e) => {
            setFilterActive(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white focus:border-aida-accent focus:outline-none focus:ring-1 focus:ring-aida-accent/30"
        >
          <option value="">Todos los estados</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
        <span className="text-sm text-gray-500">{total} rangos</span>
        <div className="flex-1" />
        <button
          onClick={() => {
            setShowCreate(!showCreate);
            setCreateError("");
          }}
          className="rounded-lg bg-aida-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-aida-accent/80"
        >
          + Nuevo Rango
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h4 className="mb-4 font-semibold text-white">
            Asignar Rango de Numeros de Control
          </h4>
          {createError && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {createError}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-300">
                Cliente *
              </label>
              <select
                value={form.client_id}
                onChange={(e) =>
                  setForm({ ...form, client_id: e.target.value })
                }
                className="w-full rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:border-aida-accent focus:outline-none focus:ring-1 focus:ring-aida-accent/30"
              >
                <option value="">Seleccionar cliente...</option>
                {clients.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.razon_social} ({c.rif})
                  </option>
                ))}
              </select>
            </div>
            {[
              { key: "serie", label: "Serie *", placeholder: "A" },
              {
                key: "numero_inicio",
                label: "Numero Inicio *",
                placeholder: "1",
                type: "number",
              },
              {
                key: "numero_fin",
                label: "Numero Fin *",
                placeholder: "5000",
                type: "number",
              },
              { key: "prefijo", label: "Prefijo", placeholder: "00-" },
              { key: "sufijo", label: "Sufijo", placeholder: "" },
              {
                key: "autorizacion_seniat",
                label: "Autorizacion SENIAT",
                placeholder: "SNAT-2026-IMP-XXXXX",
              },
            ].map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-xs font-medium text-gray-300">
                  {f.label}
                </label>
                <input
                  type={f.type || "text"}
                  value={(form as any)[f.key]}
                  onChange={(e) =>
                    setForm({ ...form, [f.key]: e.target.value })
                  }
                  placeholder={f.placeholder}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none focus:ring-1 focus:ring-aida-accent/30"
                />
              </div>
            ))}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="mb-1 block text-xs font-medium text-gray-300">
                Notas
              </label>
              <input
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
                placeholder="Notas adicionales sobre este rango..."
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none focus:ring-1 focus:ring-aida-accent/30"
              />
            </div>
          </div>

          {/* Preview */}
          {form.serie && form.numero_inicio && form.numero_fin && (
            <div className="mt-4 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
              <p className="text-xs text-gray-500">Vista previa del formato:</p>
              <p className="mt-1 font-mono text-sm text-aida-cyan">
                {form.prefijo}
                {form.serie}-{String(parseInt(form.numero_inicio) || 1).padStart(8, "0")}
                {form.sufijo}
                {" ... "}
                {form.prefijo}
                {form.serie}-{String(parseInt(form.numero_fin) || 1).padStart(8, "0")}
                {form.sufijo}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Total:{" "}
                {(parseInt(form.numero_fin) || 0) -
                  (parseInt(form.numero_inicio) || 0) +
                  1}{" "}
                numeros de control
              </p>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleCreate}
              disabled={
                saving ||
                !form.client_id ||
                !form.serie ||
                !form.numero_inicio ||
                !form.numero_fin
              }
              className="rounded-lg bg-aida-accent px-4 py-2 text-sm text-white hover:bg-aida-accent/80 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Crear Rango"}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:bg-white/5 hover:text-white"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-aida-accent border-t-transparent" />
          </div>
        ) : ranges.length === 0 && !error ? (
          <div className="py-12 text-center text-sm text-gray-500">
            No se encontraron rangos de numeros de control
          </div>
        ) : ranges.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.03] text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Serie</th>
                  <th className="px-4 py-3">Rango</th>
                  <th className="px-4 py-3">Actual</th>
                  <th className="px-4 py-3">Disponibles</th>
                  <th className="px-4 py-3">Uso</th>
                  <th className="px-4 py-3">SENIAT</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ranges.map((r: any) => (
                  <tr
                    key={r.id}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="px-4 py-3">
                      <div className="text-gray-300">{r.client_name}</div>
                      <div className="font-mono text-xs text-gray-500">
                        {r.client_rif}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-aida-cyan">
                      {r.prefijo}
                      {r.serie}
                      {r.sufijo}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">
                      {r.numero_inicio.toLocaleString()} -{" "}
                      {r.numero_fin.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-300">
                      {r.numero_actual.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-300">
                      {r.numeros_disponibles.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                          <div
                            className={`h-full rounded-full ${
                              r.porcentaje_uso >= 90
                                ? "bg-red-400"
                                : r.porcentaje_uso >= 70
                                  ? "bg-amber-400"
                                  : "bg-emerald-400"
                            }`}
                            style={{
                              width: `${Math.min(r.porcentaje_uso, 100)}%`,
                            }}
                          />
                        </div>
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${usageColor(r.porcentaje_uso)}`}
                        >
                          {r.porcentaje_uso}%
                        </span>
                      </div>
                    </td>
                    <td className="max-w-[120px] truncate px-4 py-3 font-mono text-xs text-gray-500">
                      {r.autorizacion_seniat || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.is_active
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${r.is_active ? "bg-emerald-400" : "bg-red-400"}`}
                        />
                        {r.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(r.id, !r.is_active)}
                        className={`rounded px-2 py-1 text-xs font-medium ${
                          r.is_active
                            ? "text-red-400 hover:bg-red-500/10"
                            : "text-emerald-400 hover:bg-emerald-500/10"
                        }`}
                      >
                        {r.is_active ? "Desactivar" : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-white/5 px-4 py-3">
            <span className="text-xs text-gray-500">
              Pagina {page} de {pages}
            </span>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => loadRanges(page - 1)}
                className="rounded border border-white/10 px-3 py-1 text-xs text-gray-400 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                disabled={page >= pages}
                onClick={() => loadRanges(page + 1)}
                className="rounded border border-white/10 px-3 py-1 text-xs text-gray-400 disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

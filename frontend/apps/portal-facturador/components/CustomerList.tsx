"use client";

import { useEffect, useState } from "react";

interface Props { token: string }

export default function CustomerList({ token }: Props) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [createError, setCreateError] = useState("");
  const [form, setForm] = useState({ rif: "", razon_social: "", direccion_fiscal: "", email: "", telefono_principal: "", condicion_pago: "contado", limite_credito: 0 });

  const load = () => {
    const params = search ? `?search=${search}` : "";
    fetch(`${apiUrl}/customers${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (!r.ok) throw new Error(`Error ${r.status}`);
        return r.json();
      })
      .then(d => { setCustomers(d.items || []); setError(""); })
      .catch((err) => setError(err.message || "Error al cargar clientes"));
  };

  useEffect(() => { load(); }, [search, token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    try {
      const res = await fetch(`${apiUrl}/customers`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setCreateError(data.detail || `Error ${res.status} al crear cliente`);
        return;
      }
      setShowForm(false);
      setForm({ rif: "", razon_social: "", direccion_fiscal: "", email: "", telefono_principal: "", condicion_pago: "contado", limite_credito: 0 });
      load();
    } catch {
      setCreateError("Error de conexión");
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">{error}</div>
      )}
      <div className="flex items-center justify-between">
        <input placeholder="Buscar por RIF, nombre, email..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-80 rounded-lg bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none" />
        <button onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-aida-accent px-4 py-2 text-sm text-white hover:bg-aida-accent/80">
          + Nuevo Cliente
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border border-white/10 bg-[#111827] p-5">
          <h3 className="mb-3 text-sm font-semibold text-white">Nuevo Cliente</h3>
          {createError && <div className="mb-3 rounded-lg bg-red-500/10 border border-red-500/20 p-2 text-sm text-red-400">{createError}</div>}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <input placeholder="RIF *" value={form.rif} onChange={e => setForm({...form, rif: e.target.value})} required
              className="rounded bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500" />
            <input placeholder="Razón Social *" value={form.razon_social} onChange={e => setForm({...form, razon_social: e.target.value})} required
              className="col-span-2 rounded bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500" />
            <input placeholder="Dirección fiscal *" value={form.direccion_fiscal} onChange={e => setForm({...form, direccion_fiscal: e.target.value})} required
              className="col-span-2 rounded bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500" />
            <input placeholder="Teléfono" value={form.telefono_principal} onChange={e => setForm({...form, telefono_principal: e.target.value})}
              className="rounded bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500" />
            <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              className="rounded bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500" />
            <select value={form.condicion_pago} onChange={e => setForm({...form, condicion_pago: e.target.value})}
              className="rounded bg-[#0a0f1a] border border-white/10 px-3 py-2 text-sm text-white">
              <option value="contado">Contado</option>
              <option value="credito_15">Crédito 15 días</option>
              <option value="credito_30">Crédito 30 días</option>
              <option value="credito_60">Crédito 60 días</option>
            </select>
            <input type="number" step="0.01" placeholder="Límite crédito" value={form.limite_credito || ""}
              onChange={e => setForm({...form, limite_credito: parseFloat(e.target.value) || 0})}
              className="rounded bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500" />
          </div>
          <div className="mt-3 flex gap-2">
            <button type="submit" className="rounded bg-emerald-500/20 border border-emerald-500/30 px-4 py-1.5 text-sm text-emerald-400 hover:bg-emerald-500/30">Guardar</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded border border-white/10 px-4 py-1.5 text-sm text-gray-300 hover:bg-white/5">Cancelar</button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-white/10 bg-[#111827] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/5 bg-[#0d1321] text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">RIF</th>
              <th className="px-4 py-3">Razón Social</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Cond. Pago</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No hay clientes registrados.</td></tr>
            ) : customers.map((c) => (
              <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3 font-mono text-xs text-gray-300">{c.rif}</td>
                <td className="px-4 py-3 text-gray-300">{c.razon_social}</td>
                <td className="px-4 py-3 text-gray-500">{c.telefono_principal || "—"}</td>
                <td className="px-4 py-3 text-gray-500">{c.email || "—"}</td>
                <td className="px-4 py-3 text-gray-300">{c.condicion_pago}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                    c.is_moroso ? "bg-red-500/10 text-red-400" : c.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-gray-500"
                  }`}>
                    {c.is_moroso ? "Moroso" : c.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

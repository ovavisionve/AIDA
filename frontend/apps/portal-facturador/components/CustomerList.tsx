"use client";

import { useEffect, useState } from "react";

interface Props { token: string }

export default function CustomerList({ token }: Props) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ rif: "", razon_social: "", direccion_fiscal: "", email: "", telefono_principal: "", condicion_pago: "contado", limite_credito: 0 });

  const load = () => {
    const params = search ? `?search=${search}` : "";
    fetch(`${apiUrl}/customers${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setCustomers(d.items || [])).catch(() => {});
  };

  useEffect(() => { load(); }, [search, token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${apiUrl}/customers`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ rif: "", razon_social: "", direccion_fiscal: "", email: "", telefono_principal: "", condicion_pago: "contado", limite_credito: 0 });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <input placeholder="Buscar por RIF, nombre, email..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-80 rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
        <button onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-aida-primary px-4 py-2 text-sm text-white hover:bg-aida-accent">
          + Nuevo Cliente
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold">Nuevo Cliente</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <input placeholder="RIF *" value={form.rif} onChange={e => setForm({...form, rif: e.target.value})} required
              className="rounded border px-3 py-2 text-sm" />
            <input placeholder="Razón Social *" value={form.razon_social} onChange={e => setForm({...form, razon_social: e.target.value})} required
              className="col-span-2 rounded border px-3 py-2 text-sm" />
            <input placeholder="Dirección fiscal *" value={form.direccion_fiscal} onChange={e => setForm({...form, direccion_fiscal: e.target.value})} required
              className="col-span-2 rounded border px-3 py-2 text-sm" />
            <input placeholder="Teléfono" value={form.telefono_principal} onChange={e => setForm({...form, telefono_principal: e.target.value})}
              className="rounded border px-3 py-2 text-sm" />
            <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              className="rounded border px-3 py-2 text-sm" />
            <select value={form.condicion_pago} onChange={e => setForm({...form, condicion_pago: e.target.value})}
              className="rounded border px-3 py-2 text-sm">
              <option value="contado">Contado</option>
              <option value="credito_15">Crédito 15 días</option>
              <option value="credito_30">Crédito 30 días</option>
              <option value="credito_60">Crédito 60 días</option>
            </select>
            <input type="number" step="0.01" placeholder="Límite crédito" value={form.limite_credito || ""}
              onChange={e => setForm({...form, limite_credito: parseFloat(e.target.value) || 0})}
              className="rounded border px-3 py-2 text-sm" />
          </div>
          <div className="mt-3 flex gap-2">
            <button type="submit" className="rounded bg-green-600 px-4 py-1.5 text-sm text-white hover:bg-green-700">Guardar</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded border px-4 py-1.5 text-sm hover:bg-gray-50">Cancelar</button>
          </div>
        </form>
      )}

      <div className="rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">RIF</th>
              <th className="px-4 py-3">Razón Social</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Cond. Pago</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {customers.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No hay clientes registrados.</td></tr>
            ) : customers.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{c.rif}</td>
                <td className="px-4 py-3">{c.razon_social}</td>
                <td className="px-4 py-3 text-gray-500">{c.telefono_principal || "—"}</td>
                <td className="px-4 py-3 text-gray-500">{c.email || "—"}</td>
                <td className="px-4 py-3">{c.condicion_pago}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                    c.is_moroso ? "bg-red-100 text-red-700" : c.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
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

"use client";

import { useEffect, useState } from "react";

interface Props { token: string }

export default function ProductList({ token }: Props) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [createError, setCreateError] = useState("");
  const [form, setForm] = useState({ code: "", name: "", sale_price_1: 0, cost_price: 0, tax_type: "gravado", stock_actual: 0, stock_minimo: 0, unit_of_measure: "UND" });

  const load = () => {
    const params = search ? `?search=${search}` : "";
    fetch(`${apiUrl}/products${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (!r.ok) throw new Error(`Error ${r.status}`);
        return r.json();
      })
      .then(d => { setProducts(d.items || []); setError(""); })
      .catch((err) => setError(err.message || "Error al cargar productos"));
  };

  useEffect(() => { load(); }, [search, token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    try {
      const res = await fetch(`${apiUrl}/products`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setCreateError(data.detail || `Error ${res.status} al crear producto`);
        return;
      }
      setShowForm(false);
      setForm({ code: "", name: "", sale_price_1: 0, cost_price: 0, tax_type: "gravado", stock_actual: 0, stock_minimo: 0, unit_of_measure: "UND" });
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
        <input placeholder="Buscar por código, nombre o código de barras..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-80 rounded-lg bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none" />
        <button onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-aida-accent px-4 py-2 text-sm text-white hover:bg-aida-accent/80">
          + Nuevo Producto
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border border-white/10 bg-[#111827] p-5">
          <h3 className="mb-3 text-sm font-semibold text-white">Nuevo Producto</h3>
          {createError && <div className="mb-3 rounded-lg bg-red-500/10 border border-red-500/20 p-2 text-sm text-red-400">{createError}</div>}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <input placeholder="Código *" value={form.code} onChange={e => setForm({...form, code: e.target.value})} required
              className="rounded bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500" />
            <input placeholder="Nombre *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required
              className="col-span-2 rounded bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500" />
            <select value={form.unit_of_measure} onChange={e => setForm({...form, unit_of_measure: e.target.value})}
              className="rounded bg-[#0a0f1a] border border-white/10 px-3 py-2 text-sm text-white">
              <option value="UND">UND</option><option value="KG">KG</option><option value="LT">LT</option>
              <option value="MT">MT</option><option value="HRS">HRS</option><option value="SRV">SRV</option>
            </select>
            <input type="number" step="0.01" placeholder="Precio venta *" value={form.sale_price_1 || ""}
              onChange={e => setForm({...form, sale_price_1: parseFloat(e.target.value) || 0})} required
              className="rounded bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500" />
            <input type="number" step="0.01" placeholder="Precio costo" value={form.cost_price || ""}
              onChange={e => setForm({...form, cost_price: parseFloat(e.target.value) || 0})}
              className="rounded bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500" />
            <select value={form.tax_type} onChange={e => setForm({...form, tax_type: e.target.value})}
              className="rounded bg-[#0a0f1a] border border-white/10 px-3 py-2 text-sm text-white">
              <option value="gravado">IVA 16%</option><option value="reducido">IVA 8%</option><option value="exento">Exento</option>
            </select>
            <input type="number" placeholder="Stock inicial" value={form.stock_actual || ""}
              onChange={e => setForm({...form, stock_actual: parseFloat(e.target.value) || 0})}
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
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">IVA</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No hay productos. Cree el primero.</td></tr>
            ) : products.map((p) => (
              <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3 font-mono text-xs text-gray-300">{p.code}</td>
                <td className="px-4 py-3 text-gray-300">{p.name}</td>
                <td className="px-4 py-3 font-medium text-white">{p.sale_price_1?.toLocaleString("es-VE", { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-gray-300">{p.tax_rate}%</td>
                <td className={`px-4 py-3 ${p.stock_actual <= p.stock_minimo ? "font-medium text-red-400" : "text-gray-300"}`}>
                  {p.is_service ? "—" : p.stock_actual}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${p.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                    {p.is_active ? "Activo" : "Inactivo"}
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

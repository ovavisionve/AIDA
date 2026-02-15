"use client";

import { useEffect, useState } from "react";

interface Props { token: string }

export default function ProductList({ token }: Props) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", sale_price_1: 0, cost_price: 0, tax_type: "gravado", stock_actual: 0, stock_minimo: 0, unit_of_measure: "UND" });

  const load = () => {
    const params = search ? `?search=${search}` : "";
    fetch(`${apiUrl}/products${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setProducts(d.items || [])).catch(() => {});
  };

  useEffect(() => { load(); }, [search, token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${apiUrl}/products`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ code: "", name: "", sale_price_1: 0, cost_price: 0, tax_type: "gravado", stock_actual: 0, stock_minimo: 0, unit_of_measure: "UND" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <input placeholder="Buscar por código, nombre o código de barras..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-80 rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
        <button onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-aida-primary px-4 py-2 text-sm text-white hover:bg-aida-accent">
          + Nuevo Producto
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold">Nuevo Producto</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <input placeholder="Código *" value={form.code} onChange={e => setForm({...form, code: e.target.value})} required
              className="rounded border px-3 py-2 text-sm" />
            <input placeholder="Nombre *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required
              className="col-span-2 rounded border px-3 py-2 text-sm" />
            <select value={form.unit_of_measure} onChange={e => setForm({...form, unit_of_measure: e.target.value})}
              className="rounded border px-3 py-2 text-sm">
              <option value="UND">UND</option><option value="KG">KG</option><option value="LT">LT</option>
              <option value="MT">MT</option><option value="HRS">HRS</option><option value="SRV">SRV</option>
            </select>
            <input type="number" step="0.01" placeholder="Precio venta *" value={form.sale_price_1 || ""}
              onChange={e => setForm({...form, sale_price_1: parseFloat(e.target.value) || 0})} required
              className="rounded border px-3 py-2 text-sm" />
            <input type="number" step="0.01" placeholder="Precio costo" value={form.cost_price || ""}
              onChange={e => setForm({...form, cost_price: parseFloat(e.target.value) || 0})}
              className="rounded border px-3 py-2 text-sm" />
            <select value={form.tax_type} onChange={e => setForm({...form, tax_type: e.target.value})}
              className="rounded border px-3 py-2 text-sm">
              <option value="gravado">IVA 16%</option><option value="reducido">IVA 8%</option><option value="exento">Exento</option>
            </select>
            <input type="number" placeholder="Stock inicial" value={form.stock_actual || ""}
              onChange={e => setForm({...form, stock_actual: parseFloat(e.target.value) || 0})}
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
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">IVA</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No hay productos. Cree el primero.</td></tr>
            ) : products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{p.code}</td>
                <td className="px-4 py-3">{p.name}</td>
                <td className="px-4 py-3 font-medium">{p.sale_price_1?.toLocaleString("es-VE", { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3">{p.tax_rate}%</td>
                <td className={`px-4 py-3 ${p.stock_actual <= p.stock_minimo ? "font-medium text-red-600" : ""}`}>
                  {p.is_service ? "—" : p.stock_actual}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${p.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
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

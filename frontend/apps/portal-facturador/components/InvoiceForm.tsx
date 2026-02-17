"use client";

import { useState } from "react";

interface Props { token: string }

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  tax_type: string;
  discount_percent: number;
}

export default function InvoiceForm({ token }: Props) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const [receptor, setReceptor] = useState({ rif: "", razon_social: "", direccion: "", email: "" });
  const [items, setItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unit_price: 0, tax_type: "G", discount_percent: 0 },
  ]);
  const [formaPago, setFormaPago] = useState("efectivo");
  const [moneda, setMoneda] = useState("VES");
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unit_price: 0, tax_type: "G", discount_percent: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  const calcTotal = () => {
    return items.reduce((acc, item) => {
      const sub = item.quantity * item.unit_price * (1 - item.discount_percent / 100);
      const taxRate = item.tax_type === "G" ? 0.16 : item.tax_type === "R" ? 0.08 : 0;
      return acc + sub + sub * taxRate;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`${apiUrl}/invoicing/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          receptor_rif: receptor.rif,
          receptor_razon_social: receptor.razon_social,
          receptor_direccion: receptor.direccion || "N/A",
          receptor_email: receptor.email || undefined,
          items: items.map((item, i) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_type: item.tax_type,
            discount_percent: item.discount_percent,
            unit_of_measure: "UND",
          })),
          forma_pago: formaPago,
          moneda,
          observaciones: observaciones || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Error al crear factura");
      } else {
        setResult(data);
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  // Si ya se emitió, mostrar resultado
  if (result) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <svg className="h-8 w-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Factura Emitida</h2>
        </div>
        <div className="space-y-2 rounded-lg bg-white/[0.03] border border-white/5 p-4 text-sm text-gray-300">
          <p><span className="font-medium text-white">N. Control:</span> {result.control_number}</p>
          <p><span className="font-medium text-white">N. Documento:</span> {result.document_number}</p>
          <p><span className="font-medium text-white">Cliente:</span> {result.receptor_razon_social}</p>
          <p><span className="font-medium text-white">RIF:</span> {result.receptor_rif}</p>
          <p><span className="font-medium text-white">Total:</span> {result.moneda} {result.total?.toLocaleString("es-VE")}</p>
          <p><span className="font-medium text-white">IVA 16%:</span> {result.moneda} {result.monto_iva_16?.toLocaleString("es-VE")}</p>
          <p><span className="font-medium text-white">Estado:</span> <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-400">{result.status}</span></p>
        </div>
        <div className="mt-4 flex gap-3">
          {result.pdf_url && (
            <a href={result.pdf_url} className="rounded-lg bg-aida-accent px-4 py-2 text-sm text-white hover:bg-aida-accent/80">
              Descargar PDF
            </a>
          )}
          <button onClick={() => { setResult(null); setItems([{ description: "", quantity: 1, unit_price: 0, tax_type: "G", discount_percent: 0 }]); setReceptor({ rif: "", razon_social: "", direccion: "", email: "" }); }}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5">
            Nueva Factura
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6">
      {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">{error}</div>}

      {/* Receptor */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h3 className="mb-3 text-sm font-semibold text-gray-300">Datos del Cliente</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input placeholder="RIF (ej: J-12345678-9)" value={receptor.rif}
            onChange={(e) => setReceptor({ ...receptor, rif: e.target.value })} required
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none" />
          <input placeholder="Razón Social" value={receptor.razon_social}
            onChange={(e) => setReceptor({ ...receptor, razon_social: e.target.value })} required
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none" />
          <input placeholder="Dirección fiscal" value={receptor.direccion}
            onChange={(e) => setReceptor({ ...receptor, direccion: e.target.value })}
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none" />
          <input placeholder="Email (opcional)" type="email" value={receptor.email}
            onChange={(e) => setReceptor({ ...receptor, email: e.target.value })}
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none" />
        </div>
      </div>

      {/* Items */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-300">Productos / Servicios</h3>
          <button type="button" onClick={addItem}
            className="rounded bg-aida-accent/10 px-3 py-1 text-xs font-medium text-aida-accent hover:bg-aida-accent/20">
            + Agregar línea
          </button>
        </div>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-4">
                {i === 0 && <label className="mb-1 block text-[11px] text-gray-500">Descripción</label>}
                <input value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)}
                  required placeholder="Producto o servicio"
                  className="w-full rounded bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none" />
              </div>
              <div className="col-span-2">
                {i === 0 && <label className="mb-1 block text-[11px] text-gray-500">Cantidad</label>}
                <input type="number" min="0.01" step="0.01" value={item.quantity}
                  onChange={(e) => updateItem(i, "quantity", parseFloat(e.target.value) || 0)}
                  className="w-full rounded bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-white focus:border-aida-accent focus:outline-none" />
              </div>
              <div className="col-span-2">
                {i === 0 && <label className="mb-1 block text-[11px] text-gray-500">Precio</label>}
                <input type="number" min="0" step="0.01" value={item.unit_price}
                  onChange={(e) => updateItem(i, "unit_price", parseFloat(e.target.value) || 0)}
                  className="w-full rounded bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-white focus:border-aida-accent focus:outline-none" />
              </div>
              <div className="col-span-2">
                {i === 0 && <label className="mb-1 block text-[11px] text-gray-500">IVA</label>}
                <select value={item.tax_type} onChange={(e) => updateItem(i, "tax_type", e.target.value)}
                  className="w-full rounded bg-[#0a0f1a] border border-white/10 px-2 py-1.5 text-sm text-white focus:border-aida-accent focus:outline-none">
                  <option value="G">16%</option>
                  <option value="R">8%</option>
                  <option value="E">Exento</option>
                </select>
              </div>
              <div className="col-span-1">
                {i === 0 && <label className="mb-1 block text-[11px] text-gray-500">Desc%</label>}
                <input type="number" min="0" max="100" value={item.discount_percent}
                  onChange={(e) => updateItem(i, "discount_percent", parseFloat(e.target.value) || 0)}
                  className="w-full rounded bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-white" />
              </div>
              <div className="col-span-1 text-center">
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-300">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pago y totales */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-300">Forma de Pago</h3>
          <select value={formaPago} onChange={(e) => setFormaPago(e.target.value)}
            className="w-full rounded-lg bg-[#0a0f1a] border border-white/10 px-3 py-2 text-sm text-white">
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia Bancaria</option>
            <option value="pago_movil">Pago Móvil</option>
            <option value="tarjeta_debito">Tarjeta Débito</option>
            <option value="tarjeta_credito">Tarjeta Crédito</option>
            <option value="cheque">Cheque</option>
            <option value="mixto">Mixto</option>
          </select>
          <select value={moneda} onChange={(e) => setMoneda(e.target.value)}
            className="mt-3 w-full rounded-lg bg-[#0a0f1a] border border-white/10 px-3 py-2 text-sm text-white">
            <option value="VES">Bolívares (VES)</option>
            <option value="USD">Dólares (USD)</option>
            <option value="EUR">Euros (EUR)</option>
          </select>
          <textarea placeholder="Observaciones (opcional)" value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="mt-3 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500" rows={2} />
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-300">Totales</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal:</span>
              <span className="text-gray-300">{moneda} {items.reduce((a, i) => a + i.quantity * i.unit_price, 0).toLocaleString("es-VE", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">IVA estimado:</span>
              <span className="text-gray-300">{moneda} {(calcTotal() - items.reduce((a, i) => a + i.quantity * i.unit_price * (1 - i.discount_percent / 100), 0)).toLocaleString("es-VE", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between border-t border-white/5 pt-2 text-lg font-bold">
              <span className="text-white">Total:</span>
              <span className="text-white">{moneda} {calcTotal().toLocaleString("es-VE", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="mt-4 w-full rounded-lg bg-aida-accent py-2.5 text-sm font-medium text-white hover:bg-aida-accent/80 disabled:opacity-50">
            {loading ? "Emitiendo..." : "Emitir Factura"}
          </button>
        </div>
      </div>
    </form>
  );
}

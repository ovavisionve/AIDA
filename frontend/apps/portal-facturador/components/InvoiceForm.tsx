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
      <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Factura Emitida</h2>
        </div>
        <div className="space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
          <p><span className="font-medium">N. Control:</span> {result.control_number}</p>
          <p><span className="font-medium">N. Documento:</span> {result.document_number}</p>
          <p><span className="font-medium">Cliente:</span> {result.receptor_razon_social}</p>
          <p><span className="font-medium">RIF:</span> {result.receptor_rif}</p>
          <p><span className="font-medium">Total:</span> {result.moneda} {result.total?.toLocaleString("es-VE")}</p>
          <p><span className="font-medium">IVA 16%:</span> {result.moneda} {result.monto_iva_16?.toLocaleString("es-VE")}</p>
          <p><span className="font-medium">Estado:</span> <span className="rounded bg-green-100 px-2 py-0.5 text-green-700">{result.status}</span></p>
        </div>
        <div className="mt-4 flex gap-3">
          {result.pdf_url && (
            <a href={result.pdf_url} className="rounded-lg bg-aida-primary px-4 py-2 text-sm text-white hover:bg-aida-accent">
              Descargar PDF
            </a>
          )}
          <button onClick={() => { setResult(null); setItems([{ description: "", quantity: 1, unit_price: 0, tax_type: "G", discount_percent: 0 }]); setReceptor({ rif: "", razon_social: "", direccion: "", email: "" }); }}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">
            Nueva Factura
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6">
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {/* Receptor */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Datos del Cliente</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input placeholder="RIF (ej: J-12345678-9)" value={receptor.rif}
            onChange={(e) => setReceptor({ ...receptor, rif: e.target.value })} required
            className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          <input placeholder="Razón Social" value={receptor.razon_social}
            onChange={(e) => setReceptor({ ...receptor, razon_social: e.target.value })} required
            className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          <input placeholder="Dirección fiscal" value={receptor.direccion}
            onChange={(e) => setReceptor({ ...receptor, direccion: e.target.value })}
            className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          <input placeholder="Email (opcional)" type="email" value={receptor.email}
            onChange={(e) => setReceptor({ ...receptor, email: e.target.value })}
            className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
      </div>

      {/* Items */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Productos / Servicios</h3>
          <button type="button" onClick={addItem}
            className="rounded bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100">
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
                  className="w-full rounded border px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
              <div className="col-span-2">
                {i === 0 && <label className="mb-1 block text-[11px] text-gray-500">Cantidad</label>}
                <input type="number" min="0.01" step="0.01" value={item.quantity}
                  onChange={(e) => updateItem(i, "quantity", parseFloat(e.target.value) || 0)}
                  className="w-full rounded border px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
              <div className="col-span-2">
                {i === 0 && <label className="mb-1 block text-[11px] text-gray-500">Precio</label>}
                <input type="number" min="0" step="0.01" value={item.unit_price}
                  onChange={(e) => updateItem(i, "unit_price", parseFloat(e.target.value) || 0)}
                  className="w-full rounded border px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
              <div className="col-span-2">
                {i === 0 && <label className="mb-1 block text-[11px] text-gray-500">IVA</label>}
                <select value={item.tax_type} onChange={(e) => updateItem(i, "tax_type", e.target.value)}
                  className="w-full rounded border px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none">
                  <option value="G">16%</option>
                  <option value="R">8%</option>
                  <option value="E">Exento</option>
                </select>
              </div>
              <div className="col-span-1">
                {i === 0 && <label className="mb-1 block text-[11px] text-gray-500">Desc%</label>}
                <input type="number" min="0" max="100" value={item.discount_percent}
                  onChange={(e) => updateItem(i, "discount_percent", parseFloat(e.target.value) || 0)}
                  className="w-full rounded border px-2 py-1.5 text-sm" />
              </div>
              <div className="col-span-1 text-center">
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600">
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
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Forma de Pago</h3>
          <select value={formaPago} onChange={(e) => setFormaPago(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm">
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia Bancaria</option>
            <option value="pago_movil">Pago Móvil</option>
            <option value="tarjeta_debito">Tarjeta Débito</option>
            <option value="tarjeta_credito">Tarjeta Crédito</option>
            <option value="cheque">Cheque</option>
            <option value="mixto">Mixto</option>
          </select>
          <select value={moneda} onChange={(e) => setMoneda(e.target.value)}
            className="mt-3 w-full rounded-lg border px-3 py-2 text-sm">
            <option value="VES">Bolívares (VES)</option>
            <option value="USD">Dólares (USD)</option>
            <option value="EUR">Euros (EUR)</option>
          </select>
          <textarea placeholder="Observaciones (opcional)" value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="mt-3 w-full rounded-lg border px-3 py-2 text-sm" rows={2} />
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Totales</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal:</span>
              <span>{moneda} {items.reduce((a, i) => a + i.quantity * i.unit_price, 0).toLocaleString("es-VE", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">IVA estimado:</span>
              <span>{moneda} {(calcTotal() - items.reduce((a, i) => a + i.quantity * i.unit_price * (1 - i.discount_percent / 100), 0)).toLocaleString("es-VE", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-lg font-bold">
              <span>Total:</span>
              <span>{moneda} {calcTotal().toLocaleString("es-VE", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="mt-4 w-full rounded-lg bg-aida-highlight py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50">
            {loading ? "Emitiendo..." : "Emitir Factura"}
          </button>
        </div>
      </div>
    </form>
  );
}

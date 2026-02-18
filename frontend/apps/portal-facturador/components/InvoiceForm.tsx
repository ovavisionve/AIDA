"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Props { token: string }

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  tax_type: string;
  discount_percent: number;
}

interface CustomerResult {
  id: string;
  rif: string;
  razon_social: string;
  nombre_comercial: string | null;
  direccion_fiscal: string;
  email: string | null;
  telefono_principal: string | null;
  condicion_pago: string;
}

export default function InvoiceForm({ token }: Props) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const [receptor, setReceptor] = useState({ rif: "", razon_social: "", direccion: "", email: "" });
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [items, setItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unit_price: 0, tax_type: "G", discount_percent: 0 },
  ]);
  const [formaPago, setFormaPago] = useState("efectivo");
  const [condicionPago, setCondicionPago] = useState("contado");
  const [moneda, setMoneda] = useState("VES");
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  // --- Customer search/autocomplete state ---
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<CustomerResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCustomerLabel, setSelectedCustomerLabel] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced customer search
  const searchCustomers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setCustomerResults([]);
      setShowDropdown(false);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await fetch(
        `${apiUrl}/customers?search=${encodeURIComponent(query)}&page_size=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setCustomerResults(data.items || []);
        setShowDropdown(true);
      } else {
        setCustomerResults([]);
      }
    } catch {
      setCustomerResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [apiUrl, token]);

  const handleSearchChange = (value: string) => {
    setCustomerSearch(value);
    // Clear selection if user modifies search
    if (selectedCustomerLabel && value !== selectedCustomerLabel) {
      setCustomerId(null);
      setSelectedCustomerLabel("");
      setReceptor({ rif: "", razon_social: "", direccion: "", email: "" });
      setCondicionPago("contado");
    }
    // Debounce search
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => searchCustomers(value), 300);
  };

  const selectCustomer = (customer: CustomerResult) => {
    setCustomerId(customer.id);
    setReceptor({
      rif: customer.rif,
      razon_social: customer.razon_social,
      direccion: customer.direccion_fiscal,
      email: customer.email || "",
    });
    if (customer.condicion_pago) {
      setCondicionPago(customer.condicion_pago);
    }
    const label = `${customer.rif} — ${customer.razon_social}`;
    setSelectedCustomerLabel(label);
    setCustomerSearch(label);
    setShowDropdown(false);
    setCustomerResults([]);
  };

  const clearCustomer = () => {
    setCustomerId(null);
    setSelectedCustomerLabel("");
    setCustomerSearch("");
    setReceptor({ rif: "", razon_social: "", direccion: "", email: "" });
    setCondicionPago("contado");
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load customers on mount (preload)
  useEffect(() => {
    const preload = async () => {
      try {
        const res = await fetch(
          `${apiUrl}/customers?page_size=10`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setCustomerResults(data.items || []);
        }
      } catch { /* silently ignore preload errors */ }
    };
    preload();
  }, [apiUrl, token]);

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

  const calcSubtotal = () => {
    return items.reduce((acc, item) => acc + item.quantity * item.unit_price * (1 - item.discount_percent / 100), 0);
  };

  const calcIva = () => {
    return items.reduce((acc, item) => {
      const sub = item.quantity * item.unit_price * (1 - item.discount_percent / 100);
      const taxRate = item.tax_type === "G" ? 0.16 : item.tax_type === "R" ? 0.08 : 0;
      return acc + sub * taxRate;
    }, 0);
  };

  const calcTotal = () => calcSubtotal() + calcIva();

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
          customer_id: customerId || undefined,
          receptor_rif: receptor.rif,
          receptor_razon_social: receptor.razon_social,
          receptor_direccion: receptor.direccion || "N/A",
          receptor_email: receptor.email || undefined,
          items: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_type: item.tax_type,
            discount_percent: item.discount_percent,
            unit_of_measure: "UND",
          })),
          forma_pago: formaPago,
          condicion_pago: condicionPago,
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
          <button onClick={() => { setResult(null); setItems([{ description: "", quantity: 1, unit_price: 0, tax_type: "G", discount_percent: 0 }]); clearCustomer(); }}
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

      {/* Receptor — Customer search + autocomplete */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h3 className="mb-3 text-sm font-semibold text-gray-300">Datos del Cliente</h3>

        {/* Search bar */}
        <div className="relative mb-3" ref={dropdownRef}>
          <div className="relative">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              placeholder="Buscar cliente por RIF o nombre..."
              value={customerSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => { if (customerResults.length > 0 && !customerId) setShowDropdown(true); }}
              className="w-full rounded-lg bg-white/5 border border-white/10 pl-10 pr-10 py-2 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none"
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-aida-accent" />
              </div>
            )}
            {customerId && !searchLoading && (
              <button type="button" onClick={clearCustomer}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Dropdown results */}
          {showDropdown && customerResults.length > 0 && (
            <div className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-white/10 bg-[#0d1321] shadow-xl">
              {customerResults.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectCustomer(c)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-aida-accent/10 text-xs font-bold text-aida-accent">
                    {c.razon_social.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{c.razon_social}</p>
                    <p className="truncate text-xs text-gray-500">
                      {c.rif}{c.email ? ` · ${c.email}` : ""}{c.telefono_principal ? ` · ${c.telefono_principal}` : ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {showDropdown && customerSearch.length >= 2 && customerResults.length === 0 && !searchLoading && (
            <div className="absolute z-50 mt-1 w-full rounded-lg border border-white/10 bg-[#0d1321] px-4 py-3 text-sm text-gray-500 shadow-xl">
              No se encontraron clientes. Ingrese los datos manualmente.
            </div>
          )}
        </div>

        {/* Selected customer badge */}
        {customerId && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-aida-accent/5 border border-aida-accent/20 px-3 py-2">
            <svg className="h-4 w-4 text-aida-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-aida-accent">Cliente seleccionado: {receptor.rif} — {receptor.razon_social}</span>
          </div>
        )}

        {/* Receptor fields (auto-filled or manual) */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input placeholder="RIF (ej: J-12345678-9)" value={receptor.rif}
            onChange={(e) => setReceptor({ ...receptor, rif: e.target.value })} required
            readOnly={!!customerId}
            className={`rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none ${customerId ? "opacity-70 cursor-not-allowed" : ""}`} />
          <input placeholder="Razón Social" value={receptor.razon_social}
            onChange={(e) => setReceptor({ ...receptor, razon_social: e.target.value })} required
            readOnly={!!customerId}
            className={`rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none ${customerId ? "opacity-70 cursor-not-allowed" : ""}`} />
          <input placeholder="Dirección fiscal" value={receptor.direccion}
            onChange={(e) => setReceptor({ ...receptor, direccion: e.target.value })}
            readOnly={!!customerId}
            className={`rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none ${customerId ? "opacity-70 cursor-not-allowed" : ""}`} />
          <input placeholder="Email (opcional)" type="email" value={receptor.email}
            onChange={(e) => setReceptor({ ...receptor, email: e.target.value })}
            readOnly={!!customerId}
            className={`rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none ${customerId ? "opacity-70 cursor-not-allowed" : ""}`} />
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
          <label className="mt-3 mb-1 block text-[11px] text-gray-500">Condición de Pago</label>
          <select value={condicionPago} onChange={(e) => setCondicionPago(e.target.value)}
            className="w-full rounded-lg bg-[#0a0f1a] border border-white/10 px-3 py-2 text-sm text-white">
            <option value="contado">Contado</option>
            <option value="credito_15">Crédito 15 días</option>
            <option value="credito_30">Crédito 30 días</option>
            <option value="credito_60">Crédito 60 días</option>
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
              <span className="text-gray-500">Descuento:</span>
              <span className="text-gray-300">- {moneda} {(items.reduce((a, i) => a + i.quantity * i.unit_price, 0) - calcSubtotal()).toLocaleString("es-VE", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Base Imponible:</span>
              <span className="text-gray-300">{moneda} {calcSubtotal().toLocaleString("es-VE", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">IVA:</span>
              <span className="text-gray-300">{moneda} {calcIva().toLocaleString("es-VE", { minimumFractionDigits: 2 })}</span>
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

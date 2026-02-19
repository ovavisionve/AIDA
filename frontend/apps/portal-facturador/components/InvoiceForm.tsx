"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Props { token: string }

interface LineItem {
  product_id: string | null;
  product_code: string;
  description: string;
  quantity: number;
  unit_price: number;
  unit_price_text: string; // text representation to allow decimals
  tax_type: string;
  discount_percent: number;
  unit_of_measure: string;
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

interface ProductResult {
  id: string;
  code: string;
  name: string;
  sale_price_1: number;
  cost_price: number;
  tax_type: string;
  tax_rate: number;
  stock_actual: number;
  is_service: boolean;
  unit_of_measure: string;
}

interface ExchangeRates {
  rates: Record<string, number>;
  source: string;
  date: string;
  timestamp: string;
  error?: string;
}

const IGTF_RATE = 0.03; // 3% IGTF

const fmtMoney = (n: number) => n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function emptyItem(): LineItem {
  return {
    product_id: null, product_code: "", description: "", quantity: 1,
    unit_price: 0, unit_price_text: "", tax_type: "G", discount_percent: 0,
    unit_of_measure: "UND",
  };
}

export default function InvoiceForm({ token }: Props) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

  // ── Receptor / Customer ──
  const [receptor, setReceptor] = useState({ rif: "", razon_social: "", direccion: "", email: "" });
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<CustomerResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showCustomerDD, setShowCustomerDD] = useState(false);
  const [selectedCustomerLabel, setSelectedCustomerLabel] = useState("");
  const custDropRef = useRef<HTMLDivElement>(null);
  const custTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Line items ──
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);

  // ── Product search per line ──
  const [productsCatalog, setProductsCatalog] = useState<ProductResult[]>([]);
  const [productSearch, setProductSearch] = useState<Record<number, string>>({});
  const [productDropdown, setProductDropdown] = useState<number | null>(null);
  const [productResults, setProductResults] = useState<ProductResult[]>([]);
  const [productSearchLoading, setProductSearchLoading] = useState(false);
  const prodTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prodDropRef = useRef<HTMLDivElement>(null);

  // ── Payment / Config ──
  const [formaPago, setFormaPago] = useState("efectivo");
  const [condicionPago, setCondicionPago] = useState("contado");
  const [moneda, setMoneda] = useState("USD");
  const [observaciones, setObservaciones] = useState("");

  // ── Exchange rates ──
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [ratesLoading, setRatesLoading] = useState(false);

  // ── Form state ──
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  // ── Preview modal ──
  const [showPreview, setShowPreview] = useState(false);

  // ══════════════════════════════════════════════════════════════
  // FETCH: Exchange rates
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    const fetchRates = async () => {
      setRatesLoading(true);
      try {
        const res = await fetch(`${apiUrl}/invoicing/exchange-rates`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setExchangeRates(data);
        }
      } catch (err) { console.error("InvoiceForm fetch error:", err); }
      finally { setRatesLoading(false); }
    };
    fetchRates();
  }, [apiUrl, token]);

  // ══════════════════════════════════════════════════════════════
  // FETCH: Preload products catalog
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch(`${apiUrl}/products?page_size=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setProductsCatalog(data.items || []);
        }
      } catch (err) { console.error("InvoiceForm fetch error:", err); }
    };
    loadProducts();
  }, [apiUrl, token]);

  // ══════════════════════════════════════════════════════════════
  // CUSTOMER SEARCH
  // ══════════════════════════════════════════════════════════════
  const searchCustomers = useCallback(async (query: string) => {
    if (query.length < 2) { setCustomerResults([]); setShowCustomerDD(false); return; }
    setSearchLoading(true);
    try {
      const res = await fetch(
        `${apiUrl}/customers?search=${encodeURIComponent(query)}&page_size=10`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) {
        const data = await res.json();
        setCustomerResults(data.items || []);
        setShowCustomerDD(true);
      }
    } catch { /* */ }
    finally { setSearchLoading(false); }
  }, [apiUrl, token]);

  const handleCustomerSearchChange = (value: string) => {
    setCustomerSearch(value);
    if (selectedCustomerLabel && value !== selectedCustomerLabel) {
      setCustomerId(null);
      setSelectedCustomerLabel("");
      setReceptor({ rif: "", razon_social: "", direccion: "", email: "" });
      setCondicionPago("contado");
    }
    if (custTimerRef.current) clearTimeout(custTimerRef.current);
    custTimerRef.current = setTimeout(() => searchCustomers(value), 300);
  };

  const selectCustomer = (c: CustomerResult) => {
    setCustomerId(c.id);
    setReceptor({ rif: c.rif, razon_social: c.razon_social, direccion: c.direccion_fiscal, email: c.email || "" });
    if (c.condicion_pago) setCondicionPago(c.condicion_pago);
    const label = `${c.rif} — ${c.razon_social}`;
    setSelectedCustomerLabel(label);
    setCustomerSearch(label);
    setShowCustomerDD(false);
  };

  const clearCustomer = () => {
    setCustomerId(null); setSelectedCustomerLabel(""); setCustomerSearch("");
    setReceptor({ rif: "", razon_social: "", direccion: "", email: "" });
    setCondicionPago("contado");
  };

  // Preload customers
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/customers?page_size=10`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) { const d = await res.json(); setCustomerResults(d.items || []); }
      } catch { /* */ }
    })();
  }, [apiUrl, token]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (custDropRef.current && !custDropRef.current.contains(e.target as Node)) setShowCustomerDD(false);
      if (prodDropRef.current && !prodDropRef.current.contains(e.target as Node)) setProductDropdown(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ══════════════════════════════════════════════════════════════
  // PRODUCT SEARCH PER LINE
  // ══════════════════════════════════════════════════════════════
  const searchProducts = useCallback(async (query: string) => {
    if (query.length < 1) {
      setProductResults(productsCatalog.slice(0, 10));
      return;
    }
    setProductSearchLoading(true);
    try {
      const res = await fetch(
        `${apiUrl}/products?search=${encodeURIComponent(query)}&page_size=10`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) {
        const data = await res.json();
        setProductResults(data.items || []);
      }
    } catch { /* */ }
    finally { setProductSearchLoading(false); }
  }, [apiUrl, token, productsCatalog]);

  const handleProductSearchChange = (lineIdx: number, value: string) => {
    setProductSearch({ ...productSearch, [lineIdx]: value });
    setProductDropdown(lineIdx);
    if (prodTimerRef.current) clearTimeout(prodTimerRef.current);
    prodTimerRef.current = setTimeout(() => searchProducts(value), 250);
  };

  const selectProduct = (lineIdx: number, p: ProductResult) => {
    const taxMap: Record<string, string> = { gravado: "G", reducido: "R", exento: "E" };
    const updated = [...items];
    updated[lineIdx] = {
      ...updated[lineIdx],
      product_id: p.id,
      product_code: p.code,
      description: p.name,
      unit_price: p.sale_price_1,
      unit_price_text: p.sale_price_1.toString(),
      tax_type: taxMap[p.tax_type] || "G",
      unit_of_measure: p.unit_of_measure || "UND",
    };
    setItems(updated);
    setProductSearch({ ...productSearch, [lineIdx]: p.name });
    setProductDropdown(null);
  };

  // ══════════════════════════════════════════════════════════════
  // LINE ITEM HELPERS
  // ══════════════════════════════════════════════════════════════
  const addItem = () => setItems([...items, emptyItem()]);

  const removeItem = (idx: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx));
      const ps = { ...productSearch };
      delete ps[idx];
      setProductSearch(ps);
    }
  };

  const updateItem = (idx: number, field: keyof LineItem, value: any) => {
    const updated = [...items];
    (updated[idx] as any)[field] = value;
    setItems(updated);
  };

  // Handle price text input — allows comma and period for decimals
  const handlePriceChange = (idx: number, raw: string) => {
    // Allow digits, one decimal separator (comma or period)
    const cleaned = raw.replace(/[^0-9.,]/g, "").replace(",", ".");
    // Prevent multiple dots
    const parts = cleaned.split(".");
    const safe = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : cleaned;

    const updated = [...items];
    updated[idx].unit_price_text = raw; // keep raw for display
    updated[idx].unit_price = parseFloat(safe) || 0;
    setItems(updated);
  };

  // Handle USD reference input → auto-calculate Bs price using BCV rate
  const handleUsdRefChange = (idx: number, raw: string) => {
    const cleaned = raw.replace(/[^0-9.,]/g, "").replace(",", ".");
    const parts = cleaned.split(".");
    const safe = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : cleaned;
    const usdAmount = parseFloat(safe) || 0;

    const rate = exchangeRates?.rates?.["USD"];
    if (rate && usdAmount > 0) {
      const bsPrice = Math.round(usdAmount * rate * 100) / 100;
      const updated = [...items];
      updated[idx].unit_price = bsPrice;
      updated[idx].unit_price_text = fmtMoney(bsPrice);
      setItems(updated);
    }
  };

  // ══════════════════════════════════════════════════════════════
  // CALCULATIONS
  // ══════════════════════════════════════════════════════════════
  const calcSubtotal = () =>
    items.reduce((acc, it) => acc + it.quantity * it.unit_price * (1 - it.discount_percent / 100), 0);

  const calcGrossSubtotal = () =>
    items.reduce((acc, it) => acc + it.quantity * it.unit_price, 0);

  const calcDiscount = () => calcGrossSubtotal() - calcSubtotal();

  const calcBaseImponible16 = () =>
    items.reduce((acc, it) => {
      if (it.tax_type !== "G") return acc;
      return acc + it.quantity * it.unit_price * (1 - it.discount_percent / 100);
    }, 0);

  const calcBaseImponible8 = () =>
    items.reduce((acc, it) => {
      if (it.tax_type !== "R") return acc;
      return acc + it.quantity * it.unit_price * (1 - it.discount_percent / 100);
    }, 0);

  const calcBaseExenta = () =>
    items.reduce((acc, it) => {
      if (it.tax_type !== "E") return acc;
      return acc + it.quantity * it.unit_price * (1 - it.discount_percent / 100);
    }, 0);

  const calcIva16 = () => calcBaseImponible16() * 0.16;
  const calcIva8 = () => calcBaseImponible8() * 0.08;
  const calcIvaTotal = () => calcIva16() + calcIva8();

  const calcTotalFactura = () => calcSubtotal() + calcIvaTotal();

  const isForeignCurrency = moneda === "USD" || moneda === "EUR";
  const calcIgtf = () => isForeignCurrency ? calcTotalFactura() * IGTF_RATE : 0;
  const calcTotalPagar = () => calcTotalFactura() + calcIgtf();

  const getRate = (currency: string): number | null => {
    if (!exchangeRates?.rates) return null;
    return exchangeRates.rates[currency] || null;
  };

  const calcVesEquivalent = (amount: number): number | null => {
    const rate = getRate(moneda);
    if (!rate || moneda === "VES") return null;
    return amount * rate;
  };

  /** Convert a VES amount to the foreign currency using BCV rate */
  const calcForeignEquivalent = (amountVes: number): number | null => {
    if (moneda !== "VES") return null;
    const rate = getRate("USD");
    if (!rate) return null;
    return amountVes / rate;
  };

  /** Get the BCV USD rate (or the selected currency rate) */
  const bcvRate = exchangeRates?.rates?.USD || null;
  const bcvDate = exchangeRates?.date || "";

  /** Format money in the "other" currency for dual display */
  const dualAmount = (amount: number): string | null => {
    if (moneda === "VES") {
      const foreign = calcForeignEquivalent(amount);
      return foreign !== null ? `$ ${fmtMoney(foreign)}` : null;
    }
    const ves = calcVesEquivalent(amount);
    return ves !== null ? `Bs. ${fmtMoney(ves)}` : null;
  };

  // ══════════════════════════════════════════════════════════════
  // SUBMIT
  // ══════════════════════════════════════════════════════════════
  const buildPayload = () => ({
    customer_id: customerId || undefined,
    receptor_rif: receptor.rif,
    receptor_razon_social: receptor.razon_social,
    receptor_direccion: receptor.direccion || "N/A",
    receptor_email: receptor.email || undefined,
    items: items.map((it) => ({
      product_id: it.product_id || undefined,
      product_code: it.product_code || undefined,
      description: it.description,
      quantity: it.quantity,
      unit_price: it.unit_price,
      tax_type: it.tax_type,
      discount_percent: it.discount_percent,
      unit_of_measure: it.unit_of_measure,
    })),
    forma_pago: formaPago,
    condicion_pago: condicionPago,
    moneda,
    tasa_cambio: isForeignCurrency ? getRate(moneda) : undefined,
    observaciones: observaciones || undefined,
  });

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    setShowPreview(false);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(`${apiUrl}/invoicing/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(buildPayload()),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        let detail = `Error ${res.status}`;
        try {
          const data = await res.json();
          if (data.detail) {
            detail = typeof data.detail === "string"
              ? data.detail
              : Array.isArray(data.detail)
                ? data.detail.map((d: any) => d.msg || d).join("; ")
                : JSON.stringify(data.detail);
          }
        } catch {
          const text = await res.text().catch(() => "");
          if (text) detail += `: ${text.slice(0, 200)}`;
        }
        setError(detail);
        return;
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      clearTimeout(timeout);
      const msg = err?.message || String(err);
      if (err?.name === "AbortError") {
        setError("La solicitud tardó demasiado (>30s). El servidor puede estar procesando. Intente de nuevo.");
      } else if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        setError(`Error de conexión: el servidor no respondió. Verifique que el backend esté activo (${apiUrl})`);
      } else {
        setError(`Error inesperado: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate required fields
    if (!receptor.rif || !receptor.razon_social) {
      setError("Datos del receptor incompletos: RIF y razon social son requeridos.");
      return;
    }
    if (items.some((it) => !it.description || it.quantity <= 0)) {
      setError("Todos los items deben tener descripcion y cantidad mayor a 0.");
      return;
    }
    if (isForeignCurrency && !getRate(moneda)) {
      setError(`No se pudo obtener la tasa de cambio del BCV para ${moneda}. Intente recargar la pagina o seleccione VES.`);
      return;
    }

    setShowPreview(true);
  };

  const resetForm = () => {
    setResult(null);
    setItems([emptyItem()]);
    clearCustomer();
    setObservaciones("");
    setProductSearch({});
  };

  // ══════════════════════════════════════════════════════════════
  // RENDER: Success result
  // ══════════════════════════════════════════════════════════════
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
          <p><span className="font-medium text-white">Total:</span> {result.moneda} {result.total?.toLocaleString("es-VE", { minimumFractionDigits: 2 })}</p>
          {result.monto_iva_16 > 0 && (
            <p><span className="font-medium text-white">IVA 16%:</span> {result.moneda} {result.monto_iva_16?.toLocaleString("es-VE", { minimumFractionDigits: 2 })}</p>
          )}
          {result.monto_iva_8 > 0 && (
            <p><span className="font-medium text-white">IVA 8%:</span> {result.moneda} {result.monto_iva_8?.toLocaleString("es-VE", { minimumFractionDigits: 2 })}</p>
          )}
          {result.tasa_cambio && (
            <p><span className="font-medium text-white">Tasa BCV:</span> Bs. {result.tasa_cambio?.toLocaleString("es-VE", { minimumFractionDigits: 2 })} / 1 {result.moneda}</p>
          )}
          <p><span className="font-medium text-white">Estado:</span> <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-400">{result.status}</span></p>
        </div>
        <div className="mt-4 flex gap-3">
          {result.pdf_url && (
            <a href={result.pdf_url} className="rounded-lg bg-aida-accent px-4 py-2 text-sm text-white hover:bg-aida-accent/80">
              Descargar PDF
            </a>
          )}
          <button onClick={resetForm}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5">
            Nueva Factura
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER: Preview modal
  // ══════════════════════════════════════════════════════════════
  const PreviewModal = () => {
    if (!showPreview) return null;
    const vesEq = calcVesEquivalent(calcTotalPagar());
    const rate = getRate(moneda);

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowPreview(false)}>
        <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl border border-white/10 bg-[#0d1321] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Vista Previa de Factura</h2>
            <button onClick={() => setShowPreview(false)} className="text-gray-500 hover:text-white">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Receptor */}
          <div className="mb-4 rounded-lg bg-white/5 p-3 text-sm">
            <p className="font-semibold text-white">Receptor</p>
            <p className="text-gray-400">{receptor.razon_social}</p>
            <p className="text-gray-400">RIF: {receptor.rif}</p>
            {receptor.direccion && <p className="text-gray-400">{receptor.direccion}</p>}
          </div>

          {/* Items table */}
          <table className="mb-4 w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-gray-500">
                <th className="py-2 text-left">Descripcion</th>
                <th className="py-2 text-right">Cant.</th>
                <th className="py-2 text-right">P.U.</th>
                <th className="py-2 text-center">IVA</th>
                <th className="py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => {
                const lineSub = it.quantity * it.unit_price * (1 - it.discount_percent / 100);
                return (
                  <tr key={i} className="border-b border-white/5 text-gray-300">
                    <td className="py-2">{it.description || "(sin descripcion)"}</td>
                    <td className="py-2 text-right">{it.quantity}</td>
                    <td className="py-2 text-right">{fmtMoney(it.unit_price)}</td>
                    <td className="py-2 text-center">{it.tax_type === "G" ? "16%" : it.tax_type === "R" ? "8%" : "E"}</td>
                    <td className="py-2 text-right">{fmtMoney(lineSub)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals with dual currency */}
          <div className="space-y-1.5 text-sm">
            {(() => {
              const PrevRow = ({ label, amount, sign, bold }: { label: string; amount: number; sign?: string; bold?: boolean }) => {
                const dual = dualAmount(amount);
                const pre = sign || "";
                return (
                  <div>
                    <div className={`flex justify-between ${bold ? "font-semibold text-white" : "text-gray-400"}`}>
                      <span>{label}</span>
                      <span>{pre}{moneda} {fmtMoney(amount)}</span>
                    </div>
                    {dual && <div className="flex justify-end"><span className="text-[11px] text-gray-500">{pre}{dual}</span></div>}
                  </div>
                );
              };
              return (
                <>
                  <PrevRow label="Subtotal bruto:" amount={calcGrossSubtotal()} />
                  {calcDiscount() > 0 && <PrevRow label="Descuento:" amount={calcDiscount()} sign="- " />}
                  {calcIva16() > 0 && <PrevRow label="IVA 16%:" amount={calcIva16()} />}
                  {calcIva8() > 0 && <PrevRow label="IVA 8%:" amount={calcIva8()} />}
                  <div className="border-t border-white/10 pt-1">
                    <PrevRow label="Total factura:" amount={calcTotalFactura()} bold />
                  </div>
                  {isForeignCurrency && (
                    <>
                      <PrevRow label="IGTF 3%:" amount={calcIgtf()} />
                      <div className="border-t border-white/10 pt-1">
                        <div className="flex justify-between text-lg font-bold text-white">
                          <span>Total a pagar:</span>
                          <span>{moneda} {fmtMoney(calcTotalPagar())}</span>
                        </div>
                        {dualAmount(calcTotalPagar()) && (
                          <div className="flex justify-end">
                            <span className="text-sm font-medium text-gray-400">{dualAmount(calcTotalPagar())}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  {!isForeignCurrency && bcvRate && (
                    <div className="border-t border-white/10 pt-1">
                      <div className="flex justify-between text-lg font-bold text-white">
                        <span>Total a pagar:</span>
                        <span>Bs. {fmtMoney(calcTotalFactura())}</span>
                      </div>
                      <div className="flex justify-end">
                        <span className="text-sm font-medium text-gray-400">$ {fmtMoney(calcTotalFactura() / bcvRate)}</span>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
            {bcvRate && (
              <div className="mt-2 rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2 text-xs text-blue-300">
                Tasa BCV: <span className="font-bold">Bs. {fmtMoney(bcvRate)} / $ 1</span> ({bcvDate})
              </div>
            )}
          </div>

          {/* Payment info */}
          <div className="mt-3 text-xs text-gray-500">
            <span>Forma de pago: {formaPago}</span> | <span>Condicion: {condicionPago}</span> | <span>Moneda: {moneda}</span>
          </div>

          {/* SENIAT V1.4 Validation Badge */}
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
            <svg className="h-4 w-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-xs text-emerald-400 font-medium">Validacion SENIAT V1.4 integrada — el documento sera verificado automaticamente al emitir</span>
          </div>

          {/* Actions */}
          <div className="mt-5 flex gap-3">
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50">
              {loading ? "Emitiendo..." : "Confirmar y Emitir"}
            </button>
            <button onClick={() => setShowPreview(false)} type="button"
              className="rounded-lg border border-white/10 px-6 py-2.5 text-sm text-gray-300 hover:bg-white/5">
              Volver a editar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════
  // RENDER: Main form
  // ══════════════════════════════════════════════════════════════
  return (
    <>
      <PreviewModal />
      <form onSubmit={handleFormSubmit} className="mx-auto max-w-4xl space-y-6">
        {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">{error}</div>}

        {/* ── BCV Exchange Rate Compact Banner ── */}
        {bcvRate && (
          <div className="flex items-center justify-between rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-blue-400">Tasa BCV</span>
              <span className="text-[10px] text-blue-400/50">({bcvDate})</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-blue-500/10 px-2.5 py-1 text-sm font-bold text-blue-200">
                $ 1 = Bs. {fmtMoney(bcvRate)}
              </span>
              {exchangeRates?.rates?.EUR && (
                <span className="rounded bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-300">
                  EUR: Bs. {fmtMoney(exchangeRates.rates.EUR)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Receptor / Customer ── */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-300">Datos del Cliente</h3>
          <div className="relative mb-3" ref={custDropRef}>
            <div className="relative">
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input placeholder="Buscar cliente por RIF o nombre..."
                value={customerSearch}
                onChange={(e) => handleCustomerSearchChange(e.target.value)}
                onFocus={() => { if (customerResults.length > 0 && !customerId) setShowCustomerDD(true); }}
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
            {showCustomerDD && customerResults.length > 0 && (
              <div className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-white/10 bg-[#0d1321] shadow-xl">
                {customerResults.map((c) => (
                  <button key={c.id} type="button" onClick={() => selectCustomer(c)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-aida-accent/10 text-xs font-bold text-aida-accent">
                      {c.razon_social.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{c.razon_social}</p>
                      <p className="truncate text-xs text-gray-500">{c.rif}{c.email ? ` · ${c.email}` : ""}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {showCustomerDD && customerSearch.length >= 2 && customerResults.length === 0 && !searchLoading && (
              <div className="absolute z-50 mt-1 w-full rounded-lg border border-white/10 bg-[#0d1321] px-4 py-3 text-sm text-gray-500 shadow-xl">
                No se encontraron clientes. Ingrese los datos manualmente.
              </div>
            )}
          </div>

          {customerId && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-aida-accent/5 border border-aida-accent/20 px-3 py-2">
              <svg className="h-4 w-4 text-aida-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-aida-accent">Cliente seleccionado: {receptor.rif} — {receptor.razon_social}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input placeholder="RIF (ej: J-12345678-9)" value={receptor.rif}
              onChange={(e) => setReceptor({ ...receptor, rif: e.target.value })} required readOnly={!!customerId}
              className={`rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none ${customerId ? "opacity-70 cursor-not-allowed" : ""}`} />
            <input placeholder="Razon Social" value={receptor.razon_social}
              onChange={(e) => setReceptor({ ...receptor, razon_social: e.target.value })} required readOnly={!!customerId}
              className={`rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none ${customerId ? "opacity-70 cursor-not-allowed" : ""}`} />
            <input placeholder="Direccion fiscal" value={receptor.direccion}
              onChange={(e) => setReceptor({ ...receptor, direccion: e.target.value })} readOnly={!!customerId}
              className={`rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none ${customerId ? "opacity-70 cursor-not-allowed" : ""}`} />
            <input placeholder="Email (opcional)" type="email" value={receptor.email}
              onChange={(e) => setReceptor({ ...receptor, email: e.target.value })} readOnly={!!customerId}
              className={`rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none ${customerId ? "opacity-70 cursor-not-allowed" : ""}`} />
          </div>
        </div>

        {/* ── Products / Services ── */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-300">Productos / Servicios</h3>
            <button type="button" onClick={addItem}
              className="rounded bg-aida-accent/10 px-3 py-1 text-xs font-medium text-aida-accent hover:bg-aida-accent/20">
              + Agregar linea
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                {/* Product search row */}
                <div className="relative mb-2" ref={productDropdown === i ? prodDropRef : undefined}>
                  <div className="relative">
                    <svg className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      placeholder="Buscar producto del catalogo..."
                      value={productSearch[i] ?? ""}
                      onChange={(e) => handleProductSearchChange(i, e.target.value)}
                      onFocus={() => {
                        setProductDropdown(i);
                        setProductResults(productsCatalog.slice(0, 10));
                      }}
                      className="w-full rounded bg-white/5 border border-white/10 pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-600 focus:border-aida-accent focus:outline-none"
                    />
                    {productSearchLoading && productDropdown === i && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <div className="h-3 w-3 animate-spin rounded-full border border-white/20 border-t-aida-accent" />
                      </div>
                    )}
                  </div>
                  {productDropdown === i && productResults.length > 0 && (
                    <div className="absolute z-50 mt-1 max-h-44 w-full overflow-auto rounded-lg border border-white/10 bg-[#0d1321] shadow-xl">
                      {productResults.map((p) => (
                        <button key={p.id} type="button" onClick={() => selectProduct(i, p)}
                          className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-white/5 transition-colors">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-white">{p.name}</p>
                            <p className="truncate text-[10px] text-gray-500">
                              {p.code} · {p.tax_type === "gravado" ? "IVA 16%" : p.tax_type === "reducido" ? "IVA 8%" : "Exento"}
                              {!p.is_service && ` · Stock: ${p.stock_actual}`}
                            </p>
                          </div>
                          <span className="ml-2 shrink-0 text-xs font-medium text-emerald-400">
                            {fmtMoney(p.sale_price_1)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Item fields */}
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    {i === 0 && <label className="mb-1 block text-[11px] text-gray-500">Descripcion</label>}
                    <input value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)}
                      required placeholder="Producto o servicio"
                      className="w-full rounded bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none" />
                  </div>
                  <div className="col-span-1">
                    {i === 0 && <label className="mb-1 block text-[11px] text-gray-500">Cant.</label>}
                    <input type="text" inputMode="decimal" value={item.quantity}
                      onChange={(e) => {
                        const v = e.target.value.replace(",", ".");
                        const n = parseFloat(v);
                        if (!isNaN(n) && n >= 0) updateItem(i, "quantity", n);
                        else if (v === "" || v === "0") updateItem(i, "quantity", 0);
                      }}
                      className="w-full rounded bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-white focus:border-aida-accent focus:outline-none" />
                  </div>
                  <div className="col-span-2">
                    {i === 0 && <label className="mb-1 block text-[11px] text-gray-500">Precio ({moneda === "VES" ? "Bs." : "$"})</label>}
                    {moneda === "VES" && exchangeRates?.rates?.["USD"] && (
                      <div className="relative mb-1">
                        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-emerald-500">$</span>
                        <input type="text" inputMode="decimal"
                          placeholder="Ref. USD"
                          onChange={(e) => handleUsdRefChange(i, e.target.value)}
                          className="w-full rounded bg-emerald-500/5 border border-emerald-500/20 pl-6 pr-2 py-1 text-xs text-emerald-400 placeholder-emerald-800 focus:border-emerald-500/40 focus:outline-none" />
                      </div>
                    )}
                    <input type="text" inputMode="decimal"
                      value={item.unit_price_text}
                      onChange={(e) => handlePriceChange(i, e.target.value)}
                      placeholder="0,00"
                      className="w-full rounded bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none" />
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
                    <input type="text" inputMode="decimal" value={item.discount_percent || ""}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value.replace(",", "."));
                        updateItem(i, "discount_percent", isNaN(v) ? 0 : Math.min(100, Math.max(0, v)));
                      }}
                      placeholder="0"
                      className="w-full rounded bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-white" />
                  </div>
                  <div className="col-span-1 flex items-center justify-between">
                    <div className="min-w-0">
                      <span className="text-xs text-gray-400 font-medium block">{moneda === "VES" ? "Bs." : "$"} {fmtMoney(item.quantity * item.unit_price * (1 - item.discount_percent / 100))}</span>
                      {dualAmount(item.quantity * item.unit_price * (1 - item.discount_percent / 100)) && (
                        <span className="text-[10px] text-gray-600 block">{dualAmount(item.quantity * item.unit_price * (1 - item.discount_percent / 100))}</span>
                      )}
                    </div>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="ml-1 text-red-400 hover:text-red-300">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Payment + Totals ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Payment config */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h3 className="mb-3 text-sm font-semibold text-gray-300">Forma de Pago</h3>
            <select value={formaPago} onChange={(e) => setFormaPago(e.target.value)}
              className="w-full rounded-lg bg-[#0a0f1a] border border-white/10 px-3 py-2 text-sm text-white">
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia Bancaria</option>
              <option value="pago_movil">Pago Movil</option>
              <option value="tarjeta_debito">Tarjeta Debito</option>
              <option value="tarjeta_credito">Tarjeta Credito</option>
              <option value="divisas">Divisas (efectivo)</option>
              <option value="zelle">Zelle</option>
              <option value="cheque">Cheque</option>
              <option value="mixto">Mixto</option>
            </select>
            <label className="mt-3 mb-1 block text-[11px] text-gray-500">Condicion de Pago</label>
            <select value={condicionPago} onChange={(e) => setCondicionPago(e.target.value)}
              className="w-full rounded-lg bg-[#0a0f1a] border border-white/10 px-3 py-2 text-sm text-white">
              <option value="contado">Contado</option>
              <option value="credito_15">Credito 15 dias</option>
              <option value="credito_30">Credito 30 dias</option>
              <option value="credito_60">Credito 60 dias</option>
            </select>
            <label className="mt-3 mb-1 block text-[11px] text-gray-500">Moneda</label>
            <select value={moneda} onChange={(e) => setMoneda(e.target.value)}
              className="w-full rounded-lg bg-[#0a0f1a] border border-white/10 px-3 py-2 text-sm text-white">
              <option value="VES">Bolivares (VES)</option>
              <option value="USD">Dolares (USD)</option>
              <option value="EUR">Euros (EUR)</option>
            </select>

            {/* IGTF notice for foreign currency */}
            {isForeignCurrency && (
              <div className="mt-3 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-300">
                Al pagar en {moneda}, se aplica el <span className="font-bold">IGTF del 3%</span> sobre el total de la factura (Art. 4, Ley IGTF).
              </div>
            )}

            <textarea placeholder="Observaciones (opcional)" value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="mt-3 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500" rows={2} />
          </div>

          {/* Totals */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h3 className="mb-3 text-sm font-semibold text-gray-300">Totales</h3>
            <div className="space-y-2 text-sm">
              {/* Dual-line total helper */}
              {(() => {
                const DualRow = ({ label, amount, sign, bold, color }: { label: string; amount: number; sign?: string; bold?: boolean; color?: string }) => {
                  const dual = dualAmount(amount);
                  const prefix = sign || "";
                  const textColor = color || "text-gray-300";
                  return (
                    <div>
                      <div className={`flex justify-between ${bold ? "font-semibold" : ""}`}>
                        <span className={bold ? "text-white" : "text-gray-500"}>{label}</span>
                        <span className={bold ? "text-white" : textColor}>{prefix}{moneda} {fmtMoney(amount)}</span>
                      </div>
                      {dual && (
                        <div className="flex justify-end">
                          <span className="text-[11px] text-gray-500">{prefix}{dual}</span>
                        </div>
                      )}
                    </div>
                  );
                };
                return (
                  <>
                    <DualRow label="Subtotal bruto:" amount={calcGrossSubtotal()} />
                    {calcDiscount() > 0 && <DualRow label="Descuento:" amount={calcDiscount()} sign="- " color="text-red-400" />}
                    {calcBaseImponible16() > 0 && <DualRow label="Base imponible 16%:" amount={calcBaseImponible16()} />}
                    {calcIva16() > 0 && <DualRow label="IVA 16%:" amount={calcIva16()} />}
                    {calcBaseImponible8() > 0 && <DualRow label="Base imponible 8%:" amount={calcBaseImponible8()} />}
                    {calcIva8() > 0 && <DualRow label="IVA 8%:" amount={calcIva8()} />}
                    {calcBaseExenta() > 0 && <DualRow label="Exento:" amount={calcBaseExenta()} />}

                    <div className="border-t border-white/5 pt-2">
                      <DualRow label="Total factura:" amount={calcTotalFactura()} bold />
                    </div>

                    {isForeignCurrency && (
                      <>
                        <DualRow label="IGTF 3% (pago en divisas):" amount={calcIgtf()} color="text-amber-400" />
                        <div className="border-t border-white/5 pt-2">
                          <div className="flex justify-between text-lg font-bold">
                            <span className="text-white">Total a pagar:</span>
                            <span className="text-white">{moneda} {fmtMoney(calcTotalPagar())}</span>
                          </div>
                          {dualAmount(calcTotalPagar()) && (
                            <div className="flex justify-end">
                              <span className="text-sm font-medium text-gray-400">{dualAmount(calcTotalPagar())}</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {!isForeignCurrency && moneda === "VES" && bcvRate && (
                      <div className="border-t border-white/5 pt-2">
                        <div className="flex justify-between text-lg font-bold">
                          <span className="text-white">Total a pagar:</span>
                          <span className="text-white">Bs. {fmtMoney(calcTotalFactura())}</span>
                        </div>
                        <div className="flex justify-end">
                          <span className="text-sm font-medium text-gray-400">$ {fmtMoney(calcTotalFactura() / bcvRate)}</span>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* BCV Rate indicator - always visible */}
              {bcvRate && (
                <div className="mt-2 rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-semibold text-blue-300">Tasa BCV</span>
                    </div>
                    <span className="text-sm font-bold text-blue-200">Bs. {fmtMoney(bcvRate)} / $ 1</span>
                  </div>
                  {bcvDate && (
                    <p className="mt-0.5 text-right text-[10px] text-blue-400/60">Actualizado: {bcvDate}</p>
                  )}
                  {exchangeRates?.rates?.EUR && (
                    <div className="flex items-center justify-between mt-1 pt-1 border-t border-blue-500/10">
                      <span className="text-[11px] text-blue-400/80">EUR</span>
                      <span className="text-xs text-blue-300">Bs. {fmtMoney(exchangeRates.rates.EUR)} / 1 EUR</span>
                    </div>
                  )}
                </div>
              )}
              {!bcvRate && !ratesLoading && (
                <div className="mt-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-300">
                  No se pudo obtener la tasa BCV. Los montos en la moneda alterna no estan disponibles.
                </div>
              )}
              {ratesLoading && (
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-400/30 border-t-blue-400" />
                  Consultando tasa BCV...
                </div>
              )}
            </div>

            {/* Buttons: Preview + Submit */}
            <div className="mt-4 flex gap-2">
              <button type="submit" disabled={loading}
                className="flex-1 rounded-lg bg-aida-accent py-2.5 text-sm font-medium text-white hover:bg-aida-accent/80 disabled:opacity-50">
                Previsualizar Factura
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-gray-600">
              Se mostrara una vista previa antes de emitir
            </p>
          </div>
        </div>
      </form>
    </>
  );
}

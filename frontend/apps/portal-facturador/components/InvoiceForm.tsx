"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
interface Props { token: string }

type DocumentType = "factura" | "nota_credito" | "nota_debito";

interface LineItem {
  product_id: string | null;
  product_code: string;
  description: string;
  quantity: number;
  unit_price: number;
  unit_price_text: string;
  tax_type: string; // G=16%, R=8%, A=31%, E=Exento
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

interface DocRef {
  id: string;
  tipo: string;
  numero: string;
  control_number: string;
  receptor_rif: string;
  receptor_razon_social: string;
  fecha: string;
  total: number;
  moneda: string;
  status: string;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const IGTF_RATE = 0.03;
const TAX_RATES: Record<string, number> = { G: 0.16, R: 0.08, A: 0.31, E: 0 };
const TAX_LABELS: Record<string, string> = { G: "16%", R: "8%", A: "31%", E: "Exento" };
const UNITS = ["UND","SER","KG","LT","MT","M2","M3","HRS","CJA","BOL","GAL","TON","PAR","JGO"];

const fmtMoney = (n: number) =>
  n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function emptyItem(): LineItem {
  return {
    product_id: null, product_code: "", description: "", quantity: 1,
    unit_price: 0, unit_price_text: "", tax_type: "G", discount_percent: 0,
    unit_of_measure: "UND",
  };
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function InvoiceForm({ token }: Props) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

  // ── Document type ──
  const [docType, setDocType] = useState<DocumentType>("factura");

  // ── Invoice reference (for NC/ND) ──
  const [refId, setRefId] = useState<string | null>(null);
  const [refDoc, setRefDoc] = useState<DocRef | null>(null);
  const [refSearch, setRefSearch] = useState("");
  const [refResults, setRefResults] = useState<DocRef[]>([]);
  const [refLoading, setRefLoading] = useState(false);
  const [showRefDD, setShowRefDD] = useState(false);
  const refDropRef = useRef<HTMLDivElement>(null);
  const refTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── NC/ND specific ──
  const [ncTipo, setNcTipo] = useState<"total" | "parcial">("total");
  const [motivo, setMotivo] = useState("");
  const [concepto, setConcepto] = useState("");

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
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [observaciones, setObservaciones] = useState("");

  // ── Exchange rates ──
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState("");

  // ── Form state ──
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // ── Derived ──
  const needsRef = docType !== "factura";
  const isNC = docType === "nota_credito";
  const isND = docType === "nota_debito";
  const showItems = docType === "factura" || isND || (isNC && ncTipo === "parcial");
  const isForeignCurrency = moneda === "USD" || moneda === "EUR";
  const bcvRate = exchangeRates?.rates?.USD || null;
  const bcvDate = exchangeRates?.date || "";
  const docLabel = docType === "factura" ? "Factura" : isNC ? "Nota de Credito" : "Nota de Debito";

  // ═══════════════════════════════════════════════════════════════
  // FETCH: Exchange rates with retry
  // ═══════════════════════════════════════════════════════════════
  const fetchRates = useCallback(async (attempt = 0) => {
    setRatesLoading(true);
    setRatesError("");
    try {
      const res = await fetch(`${apiUrl}/invoicing/exchange-rates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setExchangeRates(data);
        if (data.error) setRatesError(data.error);
      } else {
        throw new Error(`Error ${res.status}`);
      }
    } catch (err: any) {
      if (attempt < 2) {
        setTimeout(() => fetchRates(attempt + 1), 2000 * (attempt + 1));
        return;
      }
      setRatesError("No se pudo conectar al servicio de tasas BCV. Intente recargar.");
    } finally {
      setRatesLoading(false);
    }
  }, [apiUrl, token]);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  // ═══════════════════════════════════════════════════════════════
  // FETCH: Preload products catalog
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/products?page_size=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setProductsCatalog(data.items || []);
        }
      } catch (err) { console.error("Error loading products:", err); }
    })();
  }, [apiUrl, token]);

  // ═══════════════════════════════════════════════════════════════
  // FETCH: Preload customers
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/customers?page_size=10`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const d = await res.json();
          setCustomerResults(d.items || []);
        }
      } catch (err) { console.error("Error loading customers:", err); }
    })();
  }, [apiUrl, token]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (custDropRef.current && !custDropRef.current.contains(e.target as Node)) setShowCustomerDD(false);
      if (prodDropRef.current && !prodDropRef.current.contains(e.target as Node)) setProductDropdown(null);
      if (refDropRef.current && !refDropRef.current.contains(e.target as Node)) setShowRefDD(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // INVOICE REFERENCE SEARCH (for NC/ND)
  // ═══════════════════════════════════════════════════════════════
  const searchInvoiceRefs = useCallback(async (query: string) => {
    if (query.length < 2) { setRefResults([]); setShowRefDD(false); return; }
    setRefLoading(true);
    try {
      const params = new URLSearchParams({
        search: query, doc_type: "factura", status: "emitido", per_page: "10",
      });
      const res = await fetch(`${apiUrl}/invoicing/documents?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRefResults(data.items || []);
        setShowRefDD(true);
      }
    } catch (err) { console.error("Error searching invoices:", err); }
    finally { setRefLoading(false); }
  }, [apiUrl, token]);

  const handleRefSearchChange = (value: string) => {
    setRefSearch(value);
    if (refDoc && value !== `${refDoc.control_number} — ${refDoc.receptor_razon_social}`) {
      setRefId(null);
      setRefDoc(null);
    }
    if (refTimerRef.current) clearTimeout(refTimerRef.current);
    refTimerRef.current = setTimeout(() => searchInvoiceRefs(value), 300);
  };

  const selectInvoiceRef = (doc: DocRef) => {
    setRefId(doc.id);
    setRefDoc(doc);
    setRefSearch(`${doc.control_number} — ${doc.receptor_razon_social}`);
    setShowRefDD(false);
    // Auto-fill receptor from referenced invoice
    setReceptor({
      rif: doc.receptor_rif,
      razon_social: doc.receptor_razon_social,
      direccion: "", email: "",
    });
    setMoneda(doc.moneda);
  };

  const clearInvoiceRef = () => {
    setRefId(null); setRefDoc(null); setRefSearch("");
  };

  // ═══════════════════════════════════════════════════════════════
  // CUSTOMER SEARCH
  // ═══════════════════════════════════════════════════════════════
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
    } catch { /* network error */ }
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

  // ═══════════════════════════════════════════════════════════════
  // PRODUCT SEARCH PER LINE
  // ═══════════════════════════════════════════════════════════════
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
    } catch { /* network error */ }
    finally { setProductSearchLoading(false); }
  }, [apiUrl, token, productsCatalog]);

  const handleProductSearchChange = (lineIdx: number, value: string) => {
    setProductSearch({ ...productSearch, [lineIdx]: value });
    setProductDropdown(lineIdx);
    if (prodTimerRef.current) clearTimeout(prodTimerRef.current);
    prodTimerRef.current = setTimeout(() => searchProducts(value), 250);
  };

  const selectProduct = (lineIdx: number, p: ProductResult) => {
    const taxMap: Record<string, string> = { gravado: "G", reducido: "R", exento: "E", adicional: "A" };
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

  // ═══════════════════════════════════════════════════════════════
  // LINE ITEM HELPERS
  // ═══════════════════════════════════════════════════════════════
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

  const handlePriceChange = (idx: number, raw: string) => {
    const cleaned = raw.replace(/[^0-9.,]/g, "").replace(",", ".");
    const parts = cleaned.split(".");
    const safe = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : cleaned;
    const updated = [...items];
    updated[idx].unit_price_text = raw;
    updated[idx].unit_price = parseFloat(safe) || 0;
    setItems(updated);
  };

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

  // ── Doc type change handler ──
  const handleDocTypeChange = (dt: DocumentType) => {
    if (dt !== docType) {
      setDocType(dt);
      clearInvoiceRef();
      setMotivo(""); setConcepto(""); setNcTipo("total");
      setError("");
    }
  };

  const resetForm = () => {
    setResult(null);
    setItems([emptyItem()]);
    clearCustomer();
    clearInvoiceRef();
    setObservaciones(""); setMotivo(""); setConcepto("");
    setNcTipo("total"); setProductSearch({}); setFechaVencimiento("");
    setError("");
  };

  // ═══════════════════════════════════════════════════════════════
  // CALCULATIONS (G=16%, R=8%, A=31%, E=0%)
  // ═══════════════════════════════════════════════════════════════
  const lineSubtotal = (it: LineItem) =>
    it.quantity * it.unit_price * (1 - it.discount_percent / 100);

  const calcSubtotal = () =>
    items.reduce((acc, it) => acc + lineSubtotal(it), 0);

  const calcGrossSubtotal = () =>
    items.reduce((acc, it) => acc + it.quantity * it.unit_price, 0);

  const calcDiscount = () => calcGrossSubtotal() - calcSubtotal();

  const calcBase = (taxCode: string) =>
    items.reduce((acc, it) => it.tax_type === taxCode ? acc + lineSubtotal(it) : acc, 0);

  const calcBaseImponible16 = () => calcBase("G");
  const calcBaseImponible8 = () => calcBase("R");
  const calcBaseImponible31 = () => calcBase("A");
  const calcBaseExenta = () => calcBase("E");

  const calcIva = (taxCode: string) => calcBase(taxCode) * (TAX_RATES[taxCode] || 0);
  const calcIva16 = () => calcIva("G");
  const calcIva8 = () => calcIva("R");
  const calcIva31 = () => calcIva("A");
  const calcIvaTotal = () => calcIva16() + calcIva8() + calcIva31();

  const calcTotalDocumento = () => calcSubtotal() + calcIvaTotal();
  const calcIgtf = () => isForeignCurrency ? calcTotalDocumento() * IGTF_RATE : 0;
  const calcTotalPagar = () => calcTotalDocumento() + calcIgtf();

  const getRate = (currency: string): number | null => {
    if (!exchangeRates?.rates) return null;
    return exchangeRates.rates[currency] || null;
  };

  const calcVesEquivalent = (amount: number): number | null => {
    const rate = getRate(moneda);
    if (!rate || moneda === "VES") return null;
    return amount * rate;
  };

  const calcForeignEquivalent = (amountVes: number): number | null => {
    if (moneda !== "VES") return null;
    const rate = getRate("USD");
    if (!rate) return null;
    return amountVes / rate;
  };

  const dualAmount = (amount: number): string | null => {
    if (moneda === "VES") {
      const foreign = calcForeignEquivalent(amount);
      return foreign !== null ? `$ ${fmtMoney(foreign)}` : null;
    }
    const ves = calcVesEquivalent(amount);
    return ves !== null ? `Bs. ${fmtMoney(ves)}` : null;
  };

  // ═══════════════════════════════════════════════════════════════
  // BUILD PAYLOAD & SUBMIT
  // ═══════════════════════════════════════════════════════════════
  const buildItemsPayload = () =>
    items.map((it) => ({
      product_id: it.product_id || undefined,
      product_code: it.product_code || undefined,
      description: it.description,
      quantity: it.quantity,
      unit_price: it.unit_price,
      tax_type: it.tax_type,
      discount_percent: it.discount_percent,
      unit_of_measure: it.unit_of_measure,
    }));

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    setShowPreview(false);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      let endpoint = "";
      let payload: any = {};

      if (docType === "factura") {
        endpoint = `${apiUrl}/invoicing/invoices`;
        payload = {
          customer_id: customerId || undefined,
          receptor_rif: receptor.rif,
          receptor_razon_social: receptor.razon_social,
          receptor_direccion: receptor.direccion || "N/A",
          receptor_email: receptor.email || undefined,
          items: buildItemsPayload(),
          forma_pago: formaPago,
          condicion_pago: condicionPago,
          moneda,
          tasa_cambio: isForeignCurrency ? getRate(moneda) : undefined,
          fecha_vencimiento: fechaVencimiento || undefined,
          observaciones: observaciones || undefined,
        };
      } else if (docType === "nota_credito") {
        endpoint = `${apiUrl}/invoicing/credit-notes`;
        payload = {
          invoice_id: refId,
          tipo: ncTipo,
          motivo,
          ...(ncTipo === "parcial" ? { items: buildItemsPayload() } : {}),
        };
      } else if (docType === "nota_debito") {
        endpoint = `${apiUrl}/invoicing/debit-notes`;
        payload = {
          invoice_id: refId,
          concepto,
          items: buildItemsPayload(),
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
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
                ? data.detail.map((d: any) => d.msg || JSON.stringify(d)).join("; ")
                : JSON.stringify(data.detail);
          }
        } catch {
          const text = await res.text().catch(() => "");
          if (text) detail += `: ${text.slice(0, 300)}`;
        }
        setError(detail);
        return;
      }

      const data = await res.json();
      setResult({ ...data, _docType: docType });
    } catch (err: any) {
      clearTimeout(timeout);
      if (err?.name === "AbortError") {
        setError("La solicitud tardo demasiado (>30s). El servidor puede estar procesando.");
      } else if (err?.message?.includes("Failed to fetch") || err?.message?.includes("NetworkError")) {
        setError(`Error de conexion: el servidor no respondio. Verifique que el backend este activo (${apiUrl})`);
      } else {
        setError(`Error inesperado: ${err?.message || String(err)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // FORM VALIDATION
  // ═══════════════════════════════════════════════════════════════
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // NC/ND require invoice reference
    if (needsRef && !refId) {
      setError(`Debe seleccionar la factura de referencia para emitir una ${docLabel}.`);
      return;
    }
    if (isNC && !motivo.trim()) {
      setError("Debe ingresar el motivo de la Nota de Credito.");
      return;
    }
    if (isND && !concepto.trim()) {
      setError("Debe ingresar el concepto de la Nota de Debito.");
      return;
    }

    // Factura needs receptor
    if (docType === "factura") {
      if (!receptor.rif || !receptor.razon_social) {
        setError("Datos del receptor incompletos: RIF y razon social son requeridos.");
        return;
      }
    }

    // Items validation (factura always, NC parcial, ND always)
    if (showItems) {
      if (items.some((it) => !it.description || it.quantity <= 0)) {
        setError("Todos los items deben tener descripcion y cantidad mayor a 0.");
        return;
      }
      if (items.some((it) => it.unit_price <= 0)) {
        setError("Todos los items deben tener un precio unitario mayor a 0.");
        return;
      }
    }

    // Foreign currency needs BCV rate
    if (docType === "factura" && isForeignCurrency && !getRate(moneda)) {
      setError(`No se pudo obtener la tasa de cambio del BCV para ${moneda}. Intente recargar.`);
      return;
    }

    setShowPreview(true);
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER: Success result
  // ═══════════════════════════════════════════════════════════════
  if (result) {
    const rDocType = result._docType || "factura";
    const successLabel = rDocType === "factura" ? "Factura Emitida" : rDocType === "nota_credito" ? "Nota de Credito Emitida" : "Nota de Debito Emitida";
    const successColor = rDocType === "factura" ? "emerald" : rDocType === "nota_credito" ? "blue" : "amber";

    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-white/10 bg-[#111827] p-6">
        <div className="mb-4 text-center">
          <div className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-${successColor}-500/10`}>
            <svg className={`h-8 w-8 text-${successColor}-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">{successLabel}</h2>
          <p className="text-sm text-gray-500 mt-1">Documento generado exitosamente con validacion SENIAT V1.4</p>
        </div>
        <div className="space-y-2 rounded-lg bg-[#0d1321] border border-white/5 p-4 text-sm text-gray-300">
          {result.control_number && (
            <p><span className="font-medium text-white">N. Control:</span> <span className="font-mono">{result.control_number}</span></p>
          )}
          {result.document_number && (
            <p><span className="font-medium text-white">N. Documento:</span> <span className="font-mono">{result.document_number}</span></p>
          )}
          {result.numero && (
            <p><span className="font-medium text-white">Numero:</span> <span className="font-mono">{result.numero}</span></p>
          )}
          {result.receptor_razon_social && (
            <p><span className="font-medium text-white">Cliente:</span> {result.receptor_razon_social}</p>
          )}
          {result.receptor_rif && (
            <p><span className="font-medium text-white">RIF:</span> {result.receptor_rif}</p>
          )}
          {result.factura_referencia && (
            <p><span className="font-medium text-white">Factura referencia:</span> <span className="font-mono">{result.factura_referencia}</span></p>
          )}
          {result.total != null && (
            <p><span className="font-medium text-white">Total:</span> {result.moneda || moneda} {Number(result.total).toLocaleString("es-VE", { minimumFractionDigits: 2 })}</p>
          )}
          {result.total != null && bcvRate && (
            <p className="text-gray-500">
              Equivalente: {moneda !== "VES" ? `Bs. ${fmtMoney(Number(result.total) * bcvRate)}` : `$ ${fmtMoney(Number(result.total) / bcvRate)}`}
            </p>
          )}
          {result.monto_iva_16 > 0 && (
            <p><span className="font-medium text-white">IVA 16%:</span> {result.moneda || moneda} {Number(result.monto_iva_16).toLocaleString("es-VE", { minimumFractionDigits: 2 })}</p>
          )}
          {result.monto_iva_8 > 0 && (
            <p><span className="font-medium text-white">IVA 8%:</span> {result.moneda || moneda} {Number(result.monto_iva_8).toLocaleString("es-VE", { minimumFractionDigits: 2 })}</p>
          )}
          {result.monto_iva_31 > 0 && (
            <p><span className="font-medium text-white">IVA 31%:</span> {result.moneda || moneda} {Number(result.monto_iva_31).toLocaleString("es-VE", { minimumFractionDigits: 2 })}</p>
          )}
          {result.tasa_cambio && (
            <p><span className="font-medium text-white">Tasa BCV:</span> Bs. {Number(result.tasa_cambio).toLocaleString("es-VE", { minimumFractionDigits: 2 })} / 1 {result.moneda || moneda}</p>
          )}
          <p><span className="font-medium text-white">Estado:</span> <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-400">{result.status || "emitido"}</span></p>
        </div>
        <div className="mt-4 flex gap-3">
          {result.pdf_url && (
            <a href={result.pdf_url} target="_blank" rel="noopener noreferrer"
              className="rounded-lg bg-aida-accent px-4 py-2 text-sm text-white hover:bg-aida-accent/80 transition">
              Descargar PDF
            </a>
          )}
          <button onClick={resetForm}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 transition">
            Nuevo Documento
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER: Preview modal
  // ═══════════════════════════════════════════════════════════════
  const PreviewModal = () => {
    if (!showPreview) return null;

    const DualRow = ({ label, amount, sign, bold, color }: { label: string; amount: number; sign?: string; bold?: boolean; color?: string }) => {
      const dual = dualAmount(amount);
      const pre = sign || "";
      return (
        <div>
          <div className={`flex justify-between ${bold ? "font-semibold text-white" : color || "text-gray-400"}`}>
            <span>{label}</span>
            <span>{pre}{moneda} {fmtMoney(amount)}</span>
          </div>
          {dual && <div className="flex justify-end"><span className="text-[11px] text-gray-500">{pre}{dual}</span></div>}
        </div>
      );
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowPreview(false)}>
        <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl border border-white/10 bg-[#0d1321] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Vista Previa: {docLabel}</h2>
              {needsRef && refDoc && (
                <p className="text-xs text-gray-500 mt-0.5">Ref: {refDoc.control_number} — {refDoc.receptor_razon_social}</p>
              )}
            </div>
            <button onClick={() => setShowPreview(false)} className="text-gray-500 hover:text-white">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* NC/ND specific info */}
          {isNC && (
            <div className="mb-3 rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2 text-sm">
              <p className="text-blue-300"><span className="font-medium">Tipo:</span> {ncTipo === "total" ? "Credito Total" : "Credito Parcial"}</p>
              <p className="text-blue-300"><span className="font-medium">Motivo:</span> {motivo}</p>
              {ncTipo === "total" && refDoc && (
                <p className="text-blue-400 text-xs mt-1">Se reversara el total de la factura: {refDoc.moneda} {fmtMoney(refDoc.total)}</p>
              )}
            </div>
          )}
          {isND && (
            <div className="mb-3 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-sm">
              <p className="text-amber-300"><span className="font-medium">Concepto:</span> {concepto}</p>
            </div>
          )}

          {/* Receptor */}
          <div className="mb-4 rounded-lg bg-[#111827] border border-white/5 p-3 text-sm">
            <p className="font-semibold text-white">Receptor</p>
            <p className="text-gray-400">{receptor.razon_social}</p>
            <p className="text-gray-400">RIF: {receptor.rif}</p>
            {receptor.direccion && <p className="text-gray-400">{receptor.direccion}</p>}
          </div>

          {/* Items table (if applicable) */}
          {showItems && (
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
                  const lineSub = lineSubtotal(it);
                  return (
                    <tr key={i} className="border-b border-white/5 text-gray-300">
                      <td className="py-2">{it.description || "(sin descripcion)"}</td>
                      <td className="py-2 text-right">{it.quantity}</td>
                      <td className="py-2 text-right">{fmtMoney(it.unit_price)}</td>
                      <td className="py-2 text-center">{TAX_LABELS[it.tax_type] || it.tax_type}</td>
                      <td className="py-2 text-right">{fmtMoney(lineSub)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Totals */}
          {showItems && (
            <div className="space-y-1.5 text-sm mb-4">
              <DualRow label="Subtotal bruto:" amount={calcGrossSubtotal()} />
              {calcDiscount() > 0 && <DualRow label="Descuento:" amount={calcDiscount()} sign="- " color="text-red-400" />}
              {calcBaseImponible16() > 0 && <DualRow label="Base imponible 16%:" amount={calcBaseImponible16()} />}
              {calcIva16() > 0 && <DualRow label="IVA 16%:" amount={calcIva16()} />}
              {calcBaseImponible8() > 0 && <DualRow label="Base imponible 8%:" amount={calcBaseImponible8()} />}
              {calcIva8() > 0 && <DualRow label="IVA 8%:" amount={calcIva8()} />}
              {calcBaseImponible31() > 0 && <DualRow label="Base imponible 31%:" amount={calcBaseImponible31()} />}
              {calcIva31() > 0 && <DualRow label="IVA 31%:" amount={calcIva31()} />}
              {calcBaseExenta() > 0 && <DualRow label="Exento:" amount={calcBaseExenta()} />}

              <div className="border-t border-white/10 pt-1.5">
                <DualRow label={`Total ${docLabel.toLowerCase()}:`} amount={calcTotalDocumento()} bold />
              </div>

              {isForeignCurrency && (
                <>
                  <DualRow label="IGTF 3% (pago en divisas):" amount={calcIgtf()} color="text-amber-400" />
                  <div className="border-t border-white/10 pt-1.5">
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

              {!isForeignCurrency && (
                <div className="border-t border-white/10 pt-1.5">
                  <div className="flex justify-between text-lg font-bold text-white">
                    <span>Total a pagar:</span>
                    <span>Bs. {fmtMoney(calcTotalDocumento())}</span>
                  </div>
                  {bcvRate && (
                    <div className="flex justify-end">
                      <span className="text-sm font-medium text-gray-400">$ {fmtMoney(calcTotalDocumento() / bcvRate)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* BCV Rate */}
          {bcvRate && (
            <div className="mb-3 rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2 text-xs text-blue-300">
              Tasa BCV: <span className="font-bold">Bs. {fmtMoney(bcvRate)} / $ 1</span> ({bcvDate})
              {exchangeRates?.rates?.EUR && (
                <span className="ml-3">EUR: Bs. {fmtMoney(exchangeRates.rates.EUR)}</span>
              )}
            </div>
          )}

          {/* Payment info (factura only) */}
          {docType === "factura" && (
            <div className="mb-3 text-xs text-gray-500">
              <span>Forma de pago: {formaPago}</span> | <span>Condicion: {condicionPago}</span> | <span>Moneda: {moneda}</span>
              {fechaVencimiento && <span> | Vence: {fechaVencimiento}</span>}
            </div>
          )}

          {/* SENIAT badge */}
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
            <svg className="h-4 w-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-xs text-emerald-400 font-medium">Validacion SENIAT V1.4 — el documento sera verificado automaticamente al emitir</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 transition">
              {loading ? "Emitiendo..." : `Confirmar y Emitir ${docLabel}`}
            </button>
            <button onClick={() => setShowPreview(false)} type="button"
              className="rounded-lg border border-white/10 px-6 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition">
              Volver a editar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // PLACEHOLDER — Phase 5 (render: main form)
  // ═══════════════════════════════════════════════════════════════

  return <div className="text-white text-center py-12">Cargando formulario...</div>;
}

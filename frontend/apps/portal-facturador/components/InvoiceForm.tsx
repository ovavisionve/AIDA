"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
interface Props { token: string }

type DocumentType = "factura" | "nota_credito" | "nota_debito" | "guia_despacho" | "retencion_iva" | "retencion_islr";

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
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

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

  // ── Guia de Despacho ──
  const [gdDestinatario, setGdDestinatario] = useState({ rif: "", razon_social: "", direccion: "" });
  const [gdTransporte, setGdTransporte] = useState({ placa: "", chofer: "", ci_chofer: "" });
  const [gdDirDestino, setGdDirDestino] = useState("");
  const [gdMotivoTraslado, setGdMotivoTraslado] = useState("venta");

  // ── Retenciones RECIBIDAS (el comprador/SPE retiene al pagarle al usuario) ──
  // IVA
  const [retIvaPeriodo, setRetIvaPeriodo] = useState(""); // YYYYMM
  const [retIvaPorcentaje, setRetIvaPorcentaje] = useState(75);
  // ISLR
  const [retIslrConcepto, setRetIslrConcepto] = useState("");
  const [retIslrPorcentaje, setRetIslrPorcentaje] = useState(0);
  const [retIslrSustraendo, setRetIslrSustraendo] = useState(0);
  // Datos comunes de retención recibida
  const [retNumeroComprobante, setRetNumeroComprobante] = useState("");
  const [retFechaRetencion, setRetFechaRetencion] = useState("");
  const [retAgenteRif, setRetAgenteRif] = useState("");
  const [retAgenteNombre, setRetAgenteNombre] = useState("");

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
  const isNC = docType === "nota_credito";
  const isND = docType === "nota_debito";
  const isGD = docType === "guia_despacho";
  const isRetIva = docType === "retencion_iva";
  const isRetIslr = docType === "retencion_islr";
  const needsRef = isNC || isND || isRetIva || isRetIslr;
  const showItems = docType === "factura" || isND || isGD || (isNC && ncTipo === "parcial");
  const isForeignCurrency = moneda === "USD" || moneda === "EUR";
  const bcvRate = exchangeRates?.rates?.USD || null;
  const bcvDate = exchangeRates?.date || "";
  const docLabels: Record<DocumentType, string> = {
    factura: "Factura", nota_credito: "Nota de Credito", nota_debito: "Nota de Debito",
    guia_despacho: "Guia de Despacho", retencion_iva: "Ret. IVA Recibida", retencion_islr: "Ret. ISLR Recibida",
  };
  const docLabel = docLabels[docType];

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
  // FETCH: Preload products + customers (with retry & abort)
  // ═══════════════════════════════════════════════════════════════
  const [customersAll, setCustomersAll] = useState<CustomerResult[]>([]);
  const abortRef = useRef<Record<string, AbortController>>({});

  useEffect(() => {
    let cancelled = false;
    const fetchWithRetry = async (url: string, retries = 3): Promise<any[]> => {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const ctrl = new AbortController();
          const key = url.split("?")[0];
          abortRef.current[key]?.abort();
          abortRef.current[key] = ctrl;
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
            signal: ctrl.signal,
          });
          if (res.ok) return await res.json();
        } catch (err: any) {
          if (err?.name === "AbortError") return [];
          if (attempt < retries) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
      return [];
    };

    (async () => {
      const [prods, custs] = await Promise.all([
        fetchWithRetry(`${apiUrl}/products/autocomplete?limit=200`),
        fetchWithRetry(`${apiUrl}/customers/autocomplete?limit=100`),
      ]);
      if (cancelled) return;
      if (Array.isArray(prods)) setProductsCatalog(prods);
      if (Array.isArray(custs)) { setCustomersAll(custs); setCustomerResults(custs); }
    })();

    return () => { cancelled = true; };
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
    if (query.length < 2) {
      setCustomerResults(customersAll.length ? customersAll : []);
      setShowCustomerDD(false);
      return;
    }
    // Local-first: filter from preloaded data instantly
    const q = query.toLowerCase();
    const local = customersAll.filter(c =>
      c.rif.toLowerCase().includes(q) ||
      c.razon_social.toLowerCase().includes(q) ||
      (c.nombre_comercial || "").toLowerCase().includes(q)
    );
    if (local.length > 0) {
      setCustomerResults(local);
      setShowCustomerDD(true);
      setSearchLoading(false);
      return;
    }
    // Fallback: search server if no local matches
    setSearchLoading(true);
    try {
      const ctrl = new AbortController();
      abortRef.current["cust-search"]?.abort();
      abortRef.current["cust-search"] = ctrl;
      const res = await fetch(
        `${apiUrl}/customers/autocomplete?q=${encodeURIComponent(query)}&limit=20`,
        { headers: { Authorization: `Bearer ${token}` }, signal: ctrl.signal },
      );
      if (res.ok) {
        const data = await res.json();
        setCustomerResults(data || []);
        setShowCustomerDD(true);
      }
    } catch { /* network error or abort */ }
    finally { setSearchLoading(false); }
  }, [apiUrl, token, customersAll]);

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
      setProductResults(productsCatalog.slice(0, 20));
      return;
    }
    // Local-first: filter from preloaded catalog instantly
    const q = query.toLowerCase();
    const local = productsCatalog.filter(p =>
      p.code.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q)
    );
    if (local.length > 0) {
      setProductResults(local.slice(0, 20));
      setProductSearchLoading(false);
      return;
    }
    // Fallback: search server only if no local matches
    setProductSearchLoading(true);
    try {
      const ctrl = new AbortController();
      abortRef.current["prod-search"]?.abort();
      abortRef.current["prod-search"] = ctrl;
      const res = await fetch(
        `${apiUrl}/products/autocomplete?q=${encodeURIComponent(query)}&limit=20`,
        { headers: { Authorization: `Bearer ${token}` }, signal: ctrl.signal },
      );
      if (res.ok) {
        const data = await res.json();
        setProductResults(data || []);
      }
    } catch { /* network error or abort */ }
    finally { setProductSearchLoading(false); }
  }, [apiUrl, token, productsCatalog]);

  const handleProductSearchChange = (lineIdx: number, value: string) => {
    setProductSearch({ ...productSearch, [lineIdx]: value });
    setProductDropdown(lineIdx);
    if (prodTimerRef.current) clearTimeout(prodTimerRef.current);
    prodTimerRef.current = setTimeout(() => searchProducts(value), 300);
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
      setGdDestinatario({ rif: "", razon_social: "", direccion: "" });
      setGdTransporte({ placa: "", chofer: "", ci_chofer: "" });
      setGdDirDestino(""); setGdMotivoTraslado("venta");
      setRetIvaPeriodo(""); setRetIvaPorcentaje(75);
      setRetIslrConcepto(""); setRetIslrPorcentaje(0); setRetIslrSustraendo(0);
      setRetNumeroComprobante(""); setRetFechaRetencion(""); setRetAgenteRif(""); setRetAgenteNombre("");
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
    setGdDestinatario({ rif: "", razon_social: "", direccion: "" });
    setGdTransporte({ placa: "", chofer: "", ci_chofer: "" });
    setGdDirDestino(""); setGdMotivoTraslado("venta");
    setRetIvaPeriodo(""); setRetIvaPorcentaje(75);
    setRetIslrConcepto(""); setRetIslrPorcentaje(0); setRetIslrSustraendo(0);
    setRetNumeroComprobante(""); setRetFechaRetencion(""); setRetAgenteRif(""); setRetAgenteNombre("");
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
      } else if (docType === "guia_despacho") {
        endpoint = `${apiUrl}/invoicing/dispatch-guides`;
        payload = {
          customer_id: customerId || undefined,
          receptor_rif: receptor.rif,
          receptor_razon_social: receptor.razon_social,
          receptor_direccion: receptor.direccion || "N/A",
          receptor_email: receptor.email || undefined,
          destinatario_rif: gdDestinatario.rif,
          destinatario_razon_social: gdDestinatario.razon_social,
          destinatario_direccion: gdDestinatario.direccion,
          direccion_destino: gdDirDestino,
          motivo_traslado: gdMotivoTraslado,
          transporte_placa: gdTransporte.placa,
          transporte_chofer: gdTransporte.chofer,
          transporte_ci_chofer: gdTransporte.ci_chofer,
          items: buildItemsPayload(),
          moneda,
          tasa_cambio: isForeignCurrency ? getRate(moneda) : undefined,
          observaciones: observaciones || undefined,
        };
      } else if (docType === "retencion_iva") {
        endpoint = `${apiUrl}/invoicing/withholdings/register`;
        const montoRetenidoIva = refDoc ? refDoc.total * retIvaPorcentaje / 100 : 0;
        payload = {
          invoice_id: refId,
          tipo: "iva",
          numero_comprobante: retNumeroComprobante,
          fecha_retencion: retFechaRetencion,
          periodo_fiscal: retIvaPeriodo,
          agente_rif: retAgenteRif,
          agente_nombre: retAgenteNombre,
          base_imponible: refDoc ? refDoc.total : 0,
          porcentaje_retencion: retIvaPorcentaje,
          monto_retenido: montoRetenidoIva,
          observaciones: observaciones || undefined,
        };
      } else if (docType === "retencion_islr") {
        endpoint = `${apiUrl}/invoicing/withholdings/register`;
        const montoRetenidoIslr = refDoc ? Math.max(0, refDoc.total * retIslrPorcentaje / 100 - retIslrSustraendo) : 0;
        payload = {
          invoice_id: refId,
          tipo: "islr",
          numero_comprobante: retNumeroComprobante,
          fecha_retencion: retFechaRetencion,
          periodo_fiscal: retIvaPeriodo,
          agente_rif: retAgenteRif,
          agente_nombre: retAgenteNombre,
          base_imponible: refDoc ? refDoc.total : 0,
          porcentaje_retencion: retIslrPorcentaje,
          monto_retenido: montoRetenidoIslr,
          concepto: retIslrConcepto,
          sustraendo: retIslrSustraendo || undefined,
          observaciones: observaciones || undefined,
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

    // GD validations
    if (isGD) {
      if (!gdDestinatario.rif || !gdDestinatario.razon_social) {
        setError("Datos del destinatario incompletos: RIF y razon social son requeridos.");
        return;
      }
      if (!gdDirDestino.trim()) {
        setError("Debe ingresar la direccion de destino de la Guia de Despacho.");
        return;
      }
      if (!receptor.rif || !receptor.razon_social) {
        setError("Datos del remitente incompletos: RIF y razon social son requeridos.");
        return;
      }
    }

    // Validaciones comunes para retenciones recibidas
    if (isRetIva || isRetIslr) {
      if (!retNumeroComprobante.trim()) {
        setError("Debe ingresar el numero del comprobante de retencion recibido.");
        return;
      }
      if (!retFechaRetencion) {
        setError("Debe ingresar la fecha del comprobante de retencion.");
        return;
      }
      if (!retAgenteRif.trim() || !retAgenteNombre.trim()) {
        setError("Debe ingresar el RIF y nombre del agente de retencion (su cliente que retuvo).");
        return;
      }
    }

    // Retencion IVA validations
    if (isRetIva) {
      if (!retIvaPeriodo.trim()) {
        setError("Debe ingresar el periodo fiscal (AAAAMM) de la retencion de IVA.");
        return;
      }
      if (retIvaPorcentaje <= 0 || retIvaPorcentaje > 100) {
        setError("El porcentaje de retencion de IVA debe estar entre 1 y 100.");
        return;
      }
    }

    // Retencion ISLR validations
    if (isRetIslr) {
      if (!retIslrConcepto.trim()) {
        setError("Debe ingresar el concepto de la retencion de ISLR.");
        return;
      }
      if (retIslrPorcentaje <= 0) {
        setError("El porcentaje de retencion de ISLR debe ser mayor a 0.");
        return;
      }
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
    const successLabelMap: Record<string, string> = {
      factura: "Factura Emitida", nota_credito: "Nota de Credito Emitida", nota_debito: "Nota de Debito Emitida",
      guia_despacho: "Guia de Despacho Emitida", retencion_iva: "Retencion IVA Registrada", retencion_islr: "Retencion ISLR Registrada",
    };
    const successColorMap: Record<string, string> = {
      factura: "emerald", nota_credito: "blue", nota_debito: "amber",
      guia_despacho: "violet", retencion_iva: "cyan", retencion_islr: "orange",
    };
    const successLabel = successLabelMap[rDocType] || "Documento Emitido";
    const successColor = successColorMap[rDocType] || "emerald";

    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-white/10 bg-[#111827] p-6">
        <div className="mb-4 text-center">
          <div className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-${successColor}-500/10`}>
            <svg className={`h-8 w-8 text-${successColor}-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">{successLabel}</h2>
          <p className="text-sm text-gray-500 mt-1">{rDocType === "retencion_iva" || rDocType === "retencion_islr" ? "Comprobante de retencion registrado exitosamente" : "Documento generado exitosamente con validacion SENIAT V1.4"}</p>
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
          {result.id && (
            <button
              onClick={async () => {
                try {
                  const res = await fetch(`${apiUrl}/invoicing/documents/${result.id}/pdf`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (!res.ok) throw new Error("Error descargando PDF");
                  const blob = await res.blob();
                  const url = window.URL.createObjectURL(blob);
                  window.open(url, "_blank");
                } catch {
                  alert("No se pudo descargar el PDF");
                }
              }}
              className="rounded-lg bg-aida-accent px-4 py-2 text-sm text-white hover:bg-aida-accent/80 transition">
              Descargar PDF
            </button>
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
          {isGD && (
            <div className="mb-3 rounded-lg bg-violet-500/10 border border-violet-500/20 px-3 py-2 text-sm space-y-1">
              <p className="text-violet-300 font-medium">Datos del Despacho</p>
              <p className="text-violet-300"><span className="font-medium">Destinatario:</span> {gdDestinatario.rif} — {gdDestinatario.razon_social}</p>
              <p className="text-violet-300"><span className="font-medium">Direccion destino:</span> {gdDirDestino}</p>
              <p className="text-violet-300"><span className="font-medium">Motivo:</span> {gdMotivoTraslado}</p>
              {gdTransporte.placa && <p className="text-violet-300"><span className="font-medium">Transporte:</span> Placa {gdTransporte.placa} — {gdTransporte.chofer}</p>}
            </div>
          )}
          {isRetIva && (
            <div className="mb-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-3 py-2 text-sm space-y-1">
              <p className="text-cyan-300 font-medium">Registrar Retencion de IVA Recibida</p>
              <p className="text-cyan-300"><span className="font-medium">Comprobante N°:</span> {retNumeroComprobante}</p>
              <p className="text-cyan-300"><span className="font-medium">Agente de retencion:</span> {retAgenteRif} — {retAgenteNombre}</p>
              <p className="text-cyan-300"><span className="font-medium">Periodo fiscal:</span> {retIvaPeriodo}</p>
              <p className="text-cyan-300"><span className="font-medium">Porcentaje retencion:</span> {retIvaPorcentaje}%</p>
              {refDoc && <p className="text-cyan-300"><span className="font-medium">Base imponible:</span> {refDoc.moneda} {fmtMoney(refDoc.total)}</p>}
              {refDoc && <p className="text-cyan-400 text-xs mt-1">Monto retenido: {refDoc.moneda} {fmtMoney(refDoc.total * retIvaPorcentaje / 100)}</p>}
            </div>
          )}
          {isRetIslr && (
            <div className="mb-3 rounded-lg bg-orange-500/10 border border-orange-500/20 px-3 py-2 text-sm space-y-1">
              <p className="text-orange-300 font-medium">Registrar Retencion de ISLR Recibida</p>
              <p className="text-orange-300"><span className="font-medium">Comprobante N°:</span> {retNumeroComprobante}</p>
              <p className="text-orange-300"><span className="font-medium">Agente de retencion:</span> {retAgenteRif} — {retAgenteNombre}</p>
              <p className="text-orange-300"><span className="font-medium">Concepto:</span> {retIslrConcepto}</p>
              <p className="text-orange-300"><span className="font-medium">Porcentaje:</span> {retIslrPorcentaje}%</p>
              {retIslrSustraendo > 0 && <p className="text-orange-300"><span className="font-medium">Sustraendo:</span> {fmtMoney(retIslrSustraendo)}</p>}
              {refDoc && (
                <p className="text-orange-400 text-xs mt-1">
                  Monto retenido: {refDoc.moneda} {fmtMoney(Math.max(0, refDoc.total * retIslrPorcentaje / 100 - retIslrSustraendo))}
                </p>
              )}
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
                  <th className="py-2 text-center">Unidad</th>
                  {!isGD && <th className="py-2 text-right">P.U.</th>}
                  {!isGD && <th className="py-2 text-center">IVA</th>}
                  {!isGD && <th className="py-2 text-right">Subtotal</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => {
                  const lineSub = lineSubtotal(it);
                  return (
                    <tr key={i} className="border-b border-white/5 text-gray-300">
                      <td className="py-2">{it.description || "(sin descripcion)"}</td>
                      <td className="py-2 text-right">{it.quantity}</td>
                      <td className="py-2 text-center">{it.unit_of_measure}</td>
                      {!isGD && <td className="py-2 text-right">{fmtMoney(it.unit_price)}</td>}
                      {!isGD && <td className="py-2 text-center">{TAX_LABELS[it.tax_type] || it.tax_type}</td>}
                      {!isGD && <td className="py-2 text-right">{fmtMoney(lineSub)}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Totals */}
          {showItems && !isGD && (
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

          {/* Dispatch guide summary (no fiscal totals) */}
          {isGD && (
            <div className="space-y-1.5 text-sm mb-4">
              <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 px-3 py-2 text-xs text-violet-300">
                Sin derecho a credito fiscal (Art. 10, Prov. SNAT/2024/000102)
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Total items:</span>
                <span className="font-medium text-white">{items.length} linea{items.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Total unidades:</span>
                <span className="font-medium text-white">{items.reduce((s, it) => s + it.quantity, 0)}</span>
              </div>
            </div>
          )}

          {/* Retention totals (when no items) */}
          {(isRetIva || isRetIslr) && refDoc && (
            <div className="space-y-1.5 text-sm mb-4">
              <div className="flex justify-between text-gray-400">
                <span>Base (factura ref.):</span>
                <span>{refDoc.moneda} {fmtMoney(refDoc.total)}</span>
              </div>
              {isRetIva && (
                <>
                  <div className="flex justify-between text-gray-400">
                    <span>Porcentaje retencion:</span>
                    <span>{retIvaPorcentaje}%</span>
                  </div>
                  <div className="border-t border-white/10 pt-1.5">
                    <div className="flex justify-between text-lg font-bold text-white">
                      <span>Monto retenido:</span>
                      <span>{refDoc.moneda} {fmtMoney(refDoc.total * retIvaPorcentaje / 100)}</span>
                    </div>
                  </div>
                </>
              )}
              {isRetIslr && (
                <>
                  <div className="flex justify-between text-gray-400">
                    <span>Porcentaje retencion:</span>
                    <span>{retIslrPorcentaje}%</span>
                  </div>
                  {retIslrSustraendo > 0 && (
                    <div className="flex justify-between text-gray-400">
                      <span>Sustraendo:</span>
                      <span>- {fmtMoney(retIslrSustraendo)}</span>
                    </div>
                  )}
                  <div className="border-t border-white/10 pt-1.5">
                    <div className="flex justify-between text-lg font-bold text-white">
                      <span>Monto retenido:</span>
                      <span>{refDoc.moneda} {fmtMoney(Math.max(0, refDoc.total * retIslrPorcentaje / 100 - retIslrSustraendo))}</span>
                    </div>
                  </div>
                </>
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
              {loading ? (isRetIva || isRetIslr ? "Registrando..." : "Emitiendo...") : (isRetIva || isRetIslr ? `Confirmar y Registrar ${docLabel}` : `Confirmar y Emitir ${docLabel}`)}
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
  // RENDER: Main form
  // ═══════════════════════════════════════════════════════════════

  const DualRow = ({ label, amount, sign, bold, color }: { label: string; amount: number; sign?: string; bold?: boolean; color?: string }) => {
    const dual = dualAmount(amount);
    const pre = sign || "";
    return (
      <div>
        <div className={`flex justify-between ${bold ? "font-semibold" : ""}`}>
          <span className={bold ? "text-white" : "text-gray-500"}>{label}</span>
          <span className={bold ? "text-white" : color || "text-gray-300"}>{pre}{moneda} {fmtMoney(amount)}</span>
        </div>
        {dual && <div className="flex justify-end"><span className="text-[11px] text-gray-500">{pre}{dual}</span></div>}
      </div>
    );
  };

  return (
    <>
      <PreviewModal />
      <form onSubmit={handleFormSubmit} className="mx-auto max-w-4xl space-y-6">

        {/* Error banner */}
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* ── Document Type Tabs ── */}
        <div className="rounded-xl border border-white/10 bg-[#111827] p-2 space-y-2">
          {/* Primary documents */}
          <div className="flex gap-2">
            {([
              { id: "factura" as DocumentType, label: "Factura", color: "emerald", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
              { id: "nota_credito" as DocumentType, label: "Nota de Credito", color: "blue", icon: "M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" },
              { id: "nota_debito" as DocumentType, label: "Nota de Debito", color: "amber", icon: "M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" },
            ]).map((dt) => (
              <button key={dt.id} type="button" onClick={() => handleDocTypeChange(dt.id)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition ${
                  docType === dt.id
                    ? `bg-${dt.color}-500/10 text-${dt.color}-400 border border-${dt.color}-500/20`
                    : "text-gray-500 hover:bg-white/5 hover:text-gray-300 border border-transparent"
                }`}>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={dt.icon} />
                </svg>
                {dt.label}
              </button>
            ))}
          </div>
          {/* Secondary documents */}
          <div className="flex gap-2">
            {([
              { id: "guia_despacho" as DocumentType, label: "Guia de Despacho", color: "violet", icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" },
              { id: "retencion_iva" as DocumentType, label: "Reg. Ret. IVA", color: "cyan", icon: "M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" },
              { id: "retencion_islr" as DocumentType, label: "Reg. Ret. ISLR", color: "orange", icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" },
            ]).map((dt) => (
              <button key={dt.id} type="button" onClick={() => handleDocTypeChange(dt.id)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition ${
                  docType === dt.id
                    ? `bg-${dt.color}-500/10 text-${dt.color}-400 border border-${dt.color}-500/20`
                    : "text-gray-500 hover:bg-white/5 hover:text-gray-300 border border-transparent"
                }`}>
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={dt.icon} />
                </svg>
                {dt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── BCV Exchange Rate Banner ── */}
        <div className={`flex items-center justify-between rounded-xl border px-4 py-2.5 ${
          bcvRate ? "border-blue-500/20 bg-blue-500/5" :
          ratesLoading ? "border-white/10 bg-white/5" :
          "border-amber-500/20 bg-amber-500/5"
        }`}>
          {bcvRate ? (
            <>
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
            </>
          ) : ratesLoading ? (
            <div className="flex items-center gap-2 w-full justify-center">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-400/30 border-t-blue-400" />
              <span className="text-xs text-gray-400">Consultando tasa BCV...</span>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="text-xs text-amber-300">{ratesError || "Tasa BCV no disponible"}</span>
              </div>
              <button type="button" onClick={() => fetchRates(0)}
                className="rounded bg-amber-500/10 px-3 py-1 text-xs text-amber-300 hover:bg-amber-500/20 transition">
                Reintentar
              </button>
            </div>
          )}
        </div>

        {/* ── Invoice Reference (for NC/ND) ── */}
        {needsRef && (
          <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
            <h3 className="mb-3 text-sm font-semibold text-gray-300">
              Factura de Referencia
              <span className="ml-2 text-[10px] font-normal text-gray-500">(requerido para {docLabel})</span>
            </h3>

            {/* Search */}
            <div className="relative mb-3" ref={refDropRef}>
              <div className="relative">
                <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input placeholder="Buscar factura por N. Control, RIF o razon social..."
                  value={refSearch}
                  onChange={(e) => handleRefSearchChange(e.target.value)}
                  onFocus={() => { if (refResults.length > 0 && !refId) setShowRefDD(true); }}
                  className="w-full rounded-lg bg-[#111827] border border-white/10 pl-10 pr-10 py-2 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none" />
                {refLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-aida-accent" />
                  </div>
                )}
                {refId && !refLoading && (
                  <button type="button" onClick={clearInvoiceRef}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Dropdown */}
              {showRefDD && refResults.length > 0 && (
                <div className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-white/10 bg-[#0d1321] shadow-xl">
                  {refResults.map((doc) => (
                    <button key={doc.id} type="button" onClick={() => selectInvoiceRef(doc)}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-white/5 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white">{doc.control_number}</p>
                        <p className="text-xs text-gray-500">{doc.receptor_rif} — {doc.receptor_razon_social}</p>
                      </div>
                      <div className="ml-3 text-right shrink-0">
                        <p className="text-sm font-medium text-emerald-400">{doc.moneda} {fmtMoney(doc.total)}</p>
                        <p className="text-[10px] text-gray-500">{doc.fecha}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected invoice info */}
            {refDoc && (
              <div className="mb-3 rounded-lg bg-aida-accent/5 border border-aida-accent/20 px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-aida-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-aida-accent">Factura seleccionada</span>
                  </div>
                  <span className="text-sm font-bold text-white">{refDoc.moneda} {fmtMoney(refDoc.total)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {refDoc.control_number} | {refDoc.receptor_rif} — {refDoc.receptor_razon_social} | {refDoc.fecha}
                </p>
              </div>
            )}

            {/* NC: Tipo selector + Motivo */}
            {isNC && (
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-gray-500">Tipo de Nota de Credito</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setNcTipo("total")}
                      className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                        ncTipo === "total" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-[#0d1321] text-gray-500 border border-white/10 hover:text-gray-300"
                      }`}>
                      Total
                    </button>
                    <button type="button" onClick={() => setNcTipo("parcial")}
                      className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                        ncTipo === "parcial" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-[#0d1321] text-gray-500 border border-white/10 hover:text-gray-300"
                      }`}>
                      Parcial
                    </button>
                  </div>
                  {ncTipo === "total" && (
                    <p className="mt-1.5 text-[11px] text-blue-400/70">Se reversara el monto total de la factura original.</p>
                  )}
                  {ncTipo === "parcial" && (
                    <p className="mt-1.5 text-[11px] text-blue-400/70">Ingrese los items especificos a acreditar abajo.</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-gray-500">Motivo de la Nota de Credito *</label>
                  <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} required
                    placeholder="Ej: Devolucion de mercancia, error en facturacion, descuento post-venta..."
                    className="w-full rounded-lg bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none" rows={2} />
                </div>
              </div>
            )}

            {/* ND: Concepto */}
            {isND && (
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500">Concepto de la Nota de Debito *</label>
                <textarea value={concepto} onChange={(e) => setConcepto(e.target.value)} required
                  placeholder="Ej: Intereses por mora, ajuste de precio, cargos adicionales..."
                  className="w-full rounded-lg bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none" rows={2} />
              </div>
            )}
          </div>
        )}

        {/* ── Datos comunes de retención recibida (IVA o ISLR) ── */}
        {(isRetIva || isRetIslr) && (
          <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
            <h3 className="mb-1 text-sm font-semibold text-gray-200">Datos del Comprobante Recibido</h3>
            <p className="mb-3 text-[11px] text-gray-500">Las retenciones las emite su cliente (agente de retencion/SPE) al pagarle. Registre aqui el comprobante que recibio.</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500">N° Comprobante *</label>
                <input placeholder="Ej: 20260200000001" value={retNumeroComprobante}
                  onChange={(e) => setRetNumeroComprobante(e.target.value)} required
                  className="w-full rounded-lg bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500">Fecha del Comprobante *</label>
                <input type="date" value={retFechaRetencion}
                  onChange={(e) => setRetFechaRetencion(e.target.value)} required
                  className="w-full rounded-lg bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500">RIF del Agente de Retencion *</label>
                <input placeholder="J-12345678-9" value={retAgenteRif}
                  onChange={(e) => setRetAgenteRif(e.target.value)} required
                  className="w-full rounded-lg bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none" />
                <p className="mt-1 text-[10px] text-gray-600">Su cliente que actua como agente de retencion (SPE)</p>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500">Nombre del Agente *</label>
                <input placeholder="Razon social del agente" value={retAgenteNombre}
                  onChange={(e) => setRetAgenteNombre(e.target.value)} required
                  className="w-full rounded-lg bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none" />
              </div>
            </div>
          </div>
        )}

        {/* ── Retencion IVA specific fields ── */}
        {isRetIva && (
          <div className="rounded-xl border border-cyan-500/20 bg-[#111827] p-5">
            <h3 className="mb-3 text-sm font-semibold text-cyan-300">Datos de la Retencion de IVA</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500">Periodo Fiscal (AAAAMM) *</label>
                <input placeholder="202602" value={retIvaPeriodo}
                  onChange={(e) => setRetIvaPeriodo(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))} required
                  maxLength={6}
                  className="w-full rounded-lg bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-cyan-500 focus:outline-none" />
                <p className="mt-1 text-[10px] text-gray-600">Formato: AAAAMM (ej: 202602 para febrero 2026)</p>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500">Porcentaje de Retencion *</label>
                <select value={retIvaPorcentaje} onChange={(e) => setRetIvaPorcentaje(Number(e.target.value))}
                  className="w-full rounded-lg bg-[#0a0f1a] border border-white/10 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none">
                  <option value={75}>75% (Contribuyente ordinario)</option>
                  <option value={100}>100% (Contribuyente especial)</option>
                </select>
              </div>
            </div>
            {refDoc && (
              <div className="mt-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10 px-3 py-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">IVA de la factura:</span>
                  <span className="text-white font-medium">{refDoc.moneda} {fmtMoney(refDoc.total)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-cyan-400 font-medium">Monto retenido ({retIvaPorcentaje}%):</span>
                  <span className="text-cyan-300 font-bold">{refDoc.moneda} {fmtMoney(refDoc.total * retIvaPorcentaje / 100)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Retencion ISLR specific fields ── */}
        {isRetIslr && (
          <div className="rounded-xl border border-orange-500/20 bg-[#111827] p-5">
            <h3 className="mb-3 text-sm font-semibold text-orange-300">Datos de la Retencion de ISLR</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500">Concepto *</label>
                <select value={retIslrConcepto} onChange={(e) => setRetIslrConcepto(e.target.value)} required
                  className="w-full rounded-lg bg-[#0a0f1a] border border-white/10 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none">
                  <option value="">Seleccionar concepto...</option>
                  <option value="honorarios_profesionales">Honorarios profesionales</option>
                  <option value="servicios">Servicios</option>
                  <option value="comisiones">Comisiones</option>
                  <option value="intereses">Intereses</option>
                  <option value="alquileres">Alquileres</option>
                  <option value="fletes">Fletes</option>
                  <option value="publicidad">Publicidad y propaganda</option>
                  <option value="otros">Otros</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500">Porcentaje Retencion (%) *</label>
                <input type="text" inputMode="decimal" placeholder="0.00" value={retIslrPorcentaje || ""}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value.replace(",", "."));
                    setRetIslrPorcentaje(isNaN(v) ? 0 : Math.min(100, Math.max(0, v)));
                  }}
                  className="w-full rounded-lg bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-orange-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500">Sustraendo</label>
                <input type="text" inputMode="decimal" placeholder="0.00" value={retIslrSustraendo || ""}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value.replace(",", "."));
                    setRetIslrSustraendo(isNaN(v) ? 0 : Math.max(0, v));
                  }}
                  className="w-full rounded-lg bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-orange-500 focus:outline-none" />
              </div>
            </div>
            {refDoc && (
              <div className="mt-3 rounded-lg bg-orange-500/5 border border-orange-500/10 px-3 py-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Base imponible:</span>
                  <span className="text-white font-medium">{refDoc.moneda} {fmtMoney(refDoc.total)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-400">Calculo: {fmtMoney(refDoc.total)} x {retIslrPorcentaje}% - {fmtMoney(retIslrSustraendo)}</span>
                  <span className="text-orange-300 font-bold">{refDoc.moneda} {fmtMoney(Math.max(0, refDoc.total * retIslrPorcentaje / 100 - retIslrSustraendo))}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Guia de Despacho: Destinatario ── */}
        {isGD && (
          <div className="rounded-xl border border-violet-500/20 bg-[#111827] p-5">
            <h3 className="mb-3 text-sm font-semibold text-violet-300">Datos del Destinatario</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500">RIF Destinatario *</label>
                <input placeholder="J-12345678-9" value={gdDestinatario.rif}
                  onChange={(e) => setGdDestinatario({ ...gdDestinatario, rif: e.target.value })} required
                  className="w-full rounded-lg bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500">Razon Social *</label>
                <input placeholder="Nombre del destinatario" value={gdDestinatario.razon_social}
                  onChange={(e) => setGdDestinatario({ ...gdDestinatario, razon_social: e.target.value })} required
                  className="w-full rounded-lg bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[11px] font-medium text-gray-500">Direccion del Destinatario</label>
                <input placeholder="Direccion fiscal del destinatario" value={gdDestinatario.direccion}
                  onChange={(e) => setGdDestinatario({ ...gdDestinatario, direccion: e.target.value })}
                  className="w-full rounded-lg bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none" />
              </div>
            </div>

            <h4 className="mt-4 mb-2 text-xs font-semibold text-violet-400">Datos del Traslado</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[11px] font-medium text-gray-500">Direccion de Destino *</label>
                <input placeholder="Direccion donde se entrega la mercancia" value={gdDirDestino}
                  onChange={(e) => setGdDirDestino(e.target.value)} required
                  className="w-full rounded-lg bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500">Motivo del Traslado</label>
                <select value={gdMotivoTraslado} onChange={(e) => setGdMotivoTraslado(e.target.value)}
                  className="w-full rounded-lg bg-[#0a0f1a] border border-white/10 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none">
                  <option value="venta">Venta</option>
                  <option value="consignacion">Consignacion</option>
                  <option value="traslado_almacen">Traslado entre almacenes</option>
                  <option value="devolucion">Devolucion</option>
                  <option value="garantia">Garantia</option>
                  <option value="reparacion">Reparacion</option>
                  <option value="otros">Otros</option>
                </select>
              </div>
            </div>

            <h4 className="mt-4 mb-2 text-xs font-semibold text-violet-400">Datos del Transporte</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500">Placa del Vehiculo</label>
                <input placeholder="ABC123" value={gdTransporte.placa}
                  onChange={(e) => setGdTransporte({ ...gdTransporte, placa: e.target.value.toUpperCase() })}
                  className="w-full rounded-lg bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500">Nombre del Chofer</label>
                <input placeholder="Nombre completo" value={gdTransporte.chofer}
                  onChange={(e) => setGdTransporte({ ...gdTransporte, chofer: e.target.value })}
                  className="w-full rounded-lg bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500">C.I. del Chofer</label>
                <input placeholder="V-12345678" value={gdTransporte.ci_chofer}
                  onChange={(e) => setGdTransporte({ ...gdTransporte, ci_chofer: e.target.value })}
                  className="w-full rounded-lg bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none" />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-[11px] font-medium text-gray-500">Observaciones</label>
              <textarea placeholder="Observaciones adicionales (opcional)" value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full rounded-lg bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none" rows={2} />
            </div>
          </div>
        )}

        {/* ── Receptor / Customer (factura and GD) ── */}
        {(docType === "factura" || isGD) && (
          <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
            <h3 className="mb-3 text-sm font-semibold text-gray-300">{isGD ? "Datos del Remitente" : "Datos del Cliente"}</h3>

            {/* Search bar */}
            <div className="relative mb-3" ref={custDropRef}>
              <div className="relative">
                <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input placeholder="Buscar cliente por RIF o nombre..."
                  value={customerSearch}
                  onChange={(e) => handleCustomerSearchChange(e.target.value)}
                  onFocus={() => { if (customerResults.length > 0 && !customerId) setShowCustomerDD(true); }}
                  className="w-full rounded-lg bg-[#111827] border border-white/10 pl-10 pr-10 py-2 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none" />
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

              {/* Customer dropdown */}
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

            {/* Selected customer badge */}
            {customerId && (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-aida-accent/5 border border-aida-accent/20 px-3 py-2">
                <svg className="h-4 w-4 text-aida-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-aida-accent">Cliente seleccionado: {receptor.rif} — {receptor.razon_social}</span>
              </div>
            )}

            {/* Manual fields */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500">RIF *</label>
                <input placeholder="J-12345678-9" value={receptor.rif}
                  onChange={(e) => setReceptor({ ...receptor, rif: e.target.value })} required readOnly={!!customerId}
                  className={`w-full rounded-lg bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-aida-accent focus:outline-none ${customerId ? "opacity-70 cursor-not-allowed" : ""}`} />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500">Razon Social *</label>
                <input placeholder="Nombre de la empresa" value={receptor.razon_social}
                  onChange={(e) => setReceptor({ ...receptor, razon_social: e.target.value })} required readOnly={!!customerId}
                  className={`w-full rounded-lg bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-aida-accent focus:outline-none ${customerId ? "opacity-70 cursor-not-allowed" : ""}`} />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500">Direccion Fiscal</label>
                <input placeholder="Direccion fiscal del cliente" value={receptor.direccion}
                  onChange={(e) => setReceptor({ ...receptor, direccion: e.target.value })} readOnly={!!customerId}
                  className={`w-full rounded-lg bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-aida-accent focus:outline-none ${customerId ? "opacity-70 cursor-not-allowed" : ""}`} />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500">Email</label>
                <input placeholder="cliente@email.com" type="email" value={receptor.email}
                  onChange={(e) => setReceptor({ ...receptor, email: e.target.value })} readOnly={!!customerId}
                  className={`w-full rounded-lg bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-aida-accent focus:outline-none ${customerId ? "opacity-70 cursor-not-allowed" : ""}`} />
              </div>
            </div>
          </div>
        )}

        {/* ── NC Total message ── */}
        {isNC && ncTipo === "total" && refDoc && (
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5 text-center">
            <svg className="mx-auto h-8 w-8 text-blue-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-300">
              Se emitira una Nota de Credito <span className="font-bold">Total</span> por el monto completo de la factura:
            </p>
            <p className="text-xl font-bold text-white mt-1">{refDoc.moneda} {fmtMoney(refDoc.total)}</p>
            {bcvRate && refDoc.moneda !== "VES" && (
              <p className="text-sm text-gray-500 mt-0.5">Bs. {fmtMoney(refDoc.total * bcvRate)}</p>
            )}
          </div>
        )}

        {/* ── Products / Services (factura, NC parcial, ND) ── */}
        {showItems && (
          <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-300">
                {isND ? "Cargos Adicionales" : isNC ? "Items a Acreditar" : isGD ? "Mercancia a Despachar" : "Productos / Servicios"}
              </h3>
              <button type="button" onClick={addItem}
                className="rounded bg-aida-accent/10 px-3 py-1 text-xs font-medium text-aida-accent hover:bg-aida-accent/20 transition">
                + Agregar linea
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="rounded-lg border border-white/5 bg-[#0b1120] p-3">
                  {/* Product search + UoM row */}
                  <div className="flex gap-2 mb-2">
                    <div className="flex-1 relative" ref={productDropdown === i ? prodDropRef : undefined}>
                      <div className="relative">
                        <svg className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          placeholder="Buscar producto del catalogo..."
                          value={productSearch[i] ?? ""}
                          onChange={(e) => handleProductSearchChange(i, e.target.value)}
                          onFocus={() => { setProductDropdown(i); setProductResults(productsCatalog.slice(0, 10)); }}
                          className="w-full rounded bg-[#111827] border border-white/10 pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-600 focus:border-aida-accent focus:outline-none" />
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
                                  {p.code} · {p.tax_type === "gravado" ? "IVA 16%" : p.tax_type === "reducido" ? "IVA 8%" : p.tax_type === "adicional" ? "IVA 31%" : "Exento"}
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
                    {/* UoM selector */}
                    <select value={item.unit_of_measure}
                      onChange={(e) => updateItem(i, "unit_of_measure", e.target.value)}
                      className="w-20 rounded bg-[#111827] border border-white/10 px-1.5 py-1.5 text-xs text-white focus:border-aida-accent focus:outline-none">
                      {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>

                  {/* Item detail fields */}
                  <div className="grid grid-cols-12 gap-2 items-end">
                    {/* Description */}
                    <div className={isGD ? "col-span-8" : "col-span-4"}>
                      {i === 0 && <label className="mb-1 block text-[11px] text-gray-500">Descripcion *</label>}
                      <input value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)}
                        required placeholder={isGD ? "Descripcion de la mercancia" : "Producto o servicio"}
                        className="w-full rounded bg-[#111827] border border-white/10 px-2 py-1.5 text-sm text-white placeholder-gray-600 focus:border-aida-accent focus:outline-none" />
                    </div>

                    {/* Quantity */}
                    <div className={isGD ? "col-span-2" : "col-span-1"}>
                      {i === 0 && <label className="mb-1 block text-[11px] text-gray-500">Cant.</label>}
                      <input type="text" inputMode="decimal" value={item.quantity}
                        onChange={(e) => {
                          const v = e.target.value.replace(",", ".");
                          const n = parseFloat(v);
                          if (!isNaN(n) && n >= 0) updateItem(i, "quantity", n);
                          else if (v === "" || v === "0") updateItem(i, "quantity", 0);
                        }}
                        className="w-full rounded bg-[#111827] border border-white/10 px-2 py-1.5 text-sm text-white focus:border-aida-accent focus:outline-none" />
                    </div>

                    {/* Price (hidden for GD) */}
                    {!isGD && (
                    <div className="col-span-2">
                      {i === 0 && <label className="mb-1 block text-[11px] text-gray-500">Precio ({moneda === "VES" ? "Bs." : "$"})</label>}
                      {/* USD reference helper when VES */}
                      {moneda === "VES" && bcvRate && (
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
                        className="w-full rounded bg-[#111827] border border-white/10 px-2 py-1.5 text-sm text-white placeholder-gray-600 focus:border-aida-accent focus:outline-none" />
                    </div>
                    )}

                    {/* IVA type (hidden for GD) */}
                    {!isGD && (
                    <div className="col-span-2">
                      {i === 0 && <label className="mb-1 block text-[11px] text-gray-500">IVA</label>}
                      <select value={item.tax_type} onChange={(e) => updateItem(i, "tax_type", e.target.value)}
                        className="w-full rounded bg-[#0a0f1a] border border-white/10 px-2 py-1.5 text-sm text-white focus:border-aida-accent focus:outline-none">
                        <option value="G">G 16%</option>
                        <option value="R">R 8%</option>
                        <option value="A">A 31%</option>
                        <option value="E">Exento</option>
                      </select>
                    </div>
                    )}

                    {/* Discount (hidden for GD) */}
                    {!isGD && (
                    <div className="col-span-1">
                      {i === 0 && <label className="mb-1 block text-[11px] text-gray-500">Desc%</label>}
                      <input type="text" inputMode="decimal" value={item.discount_percent || ""}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value.replace(",", "."));
                          updateItem(i, "discount_percent", isNaN(v) ? 0 : Math.min(100, Math.max(0, v)));
                        }}
                        placeholder="0"
                        className="w-full rounded bg-[#111827] border border-white/10 px-2 py-1.5 text-sm text-white focus:border-aida-accent focus:outline-none" />
                    </div>
                    )}

                    {/* Line total + delete */}
                    <div className="col-span-2 flex items-center justify-between">
                      {!isGD && (
                      <div className="min-w-0">
                        <span className="text-xs text-gray-400 font-medium block">
                          {moneda === "VES" ? "Bs." : "$"} {fmtMoney(lineSubtotal(item))}
                        </span>
                        {dualAmount(lineSubtotal(item)) && (
                          <span className="text-[10px] text-gray-600 block">{dualAmount(lineSubtotal(item))}</span>
                        )}
                      </div>
                      )}
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
        )}

        {/* ── Payment + Totals (side by side) ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Payment config (factura only) */}
          {docType === "factura" ? (
            <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
              <h3 className="mb-3 text-sm font-semibold text-gray-300">Forma de Pago</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-gray-500">Metodo de Pago</label>
                  <select value={formaPago} onChange={(e) => setFormaPago(e.target.value)}
                    className="w-full rounded-lg bg-[#0a0f1a] border border-white/10 px-3 py-2 text-sm text-white focus:border-aida-accent focus:outline-none">
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
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-gray-500">Condicion de Pago</label>
                  <select value={condicionPago} onChange={(e) => setCondicionPago(e.target.value)}
                    className="w-full rounded-lg bg-[#0a0f1a] border border-white/10 px-3 py-2 text-sm text-white focus:border-aida-accent focus:outline-none">
                    <option value="contado">Contado</option>
                    <option value="credito_15">Credito 15 dias</option>
                    <option value="credito_30">Credito 30 dias</option>
                    <option value="credito_60">Credito 60 dias</option>
                    <option value="credito_90">Credito 90 dias</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-gray-500">Moneda</label>
                  <select value={moneda} onChange={(e) => setMoneda(e.target.value)}
                    className="w-full rounded-lg bg-[#0a0f1a] border border-white/10 px-3 py-2 text-sm text-white focus:border-aida-accent focus:outline-none">
                    <option value="VES">Bolivares (VES)</option>
                    <option value="USD">Dolares (USD)</option>
                    <option value="EUR">Euros (EUR)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-gray-500">Fecha de Vencimiento</label>
                  <input type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)}
                    className="w-full rounded-lg bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white focus:border-aida-accent focus:outline-none" />
                </div>

                {isForeignCurrency && (
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-300">
                    Al pagar en {moneda}, se aplica el <span className="font-bold">IGTF del 3%</span> sobre el total (Art. 4, Ley IGTF).
                  </div>
                )}

                <textarea placeholder="Observaciones (opcional)" value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full rounded-lg bg-[#0d1321] border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-aida-accent focus:outline-none" rows={2} />
              </div>
            </div>
          ) : (
            /* Document info panel for non-factura types */
            <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
              <h3 className="mb-3 text-sm font-semibold text-gray-300">Informacion del Documento</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <p><span className="text-gray-500">Tipo:</span> <span className="text-white">{docLabel}</span></p>
                {refDoc && (
                  <>
                    <p><span className="text-gray-500">Factura ref.:</span> <span className="text-white font-mono">{refDoc.control_number}</span></p>
                    <p><span className="text-gray-500">Cliente:</span> <span className="text-white">{refDoc.receptor_razon_social}</span></p>
                    <p><span className="text-gray-500">RIF:</span> <span className="text-white">{refDoc.receptor_rif}</span></p>
                    <p><span className="text-gray-500">Moneda:</span> <span className="text-white">{refDoc.moneda}</span></p>
                    <p><span className="text-gray-500">Total original:</span> <span className="text-white">{refDoc.moneda} {fmtMoney(refDoc.total)}</span></p>
                  </>
                )}
                {isNC && <p><span className="text-gray-500">Motivo:</span> <span className="text-white">{motivo || "—"}</span></p>}
                {isND && <p><span className="text-gray-500">Concepto:</span> <span className="text-white">{concepto || "—"}</span></p>}
                {isGD && (
                  <>
                    <p><span className="text-gray-500">Destinatario:</span> <span className="text-white">{gdDestinatario.rif} — {gdDestinatario.razon_social}</span></p>
                    <p><span className="text-gray-500">Destino:</span> <span className="text-white">{gdDirDestino || "—"}</span></p>
                    <p><span className="text-gray-500">Motivo traslado:</span> <span className="text-white">{gdMotivoTraslado}</span></p>
                    {gdTransporte.placa && <p><span className="text-gray-500">Transporte:</span> <span className="text-white">{gdTransporte.placa} — {gdTransporte.chofer}</span></p>}
                  </>
                )}
                {isRetIva && (
                  <>
                    <p><span className="text-gray-500">Periodo fiscal:</span> <span className="text-white">{retIvaPeriodo || "—"}</span></p>
                    <p><span className="text-gray-500">% Retencion:</span> <span className="text-white">{retIvaPorcentaje}%</span></p>
                    {refDoc && (
                      <p><span className="text-gray-500">Monto retenido:</span> <span className="text-cyan-400 font-medium">{refDoc.moneda} {fmtMoney(refDoc.total * retIvaPorcentaje / 100)}</span></p>
                    )}
                  </>
                )}
                {isRetIslr && (
                  <>
                    <p><span className="text-gray-500">Concepto:</span> <span className="text-white">{retIslrConcepto || "—"}</span></p>
                    <p><span className="text-gray-500">% Retencion:</span> <span className="text-white">{retIslrPorcentaje}%</span></p>
                    {retIslrSustraendo > 0 && <p><span className="text-gray-500">Sustraendo:</span> <span className="text-white">{fmtMoney(retIslrSustraendo)}</span></p>}
                    {refDoc && (
                      <p><span className="text-gray-500">Monto retenido:</span> <span className="text-orange-400 font-medium">{refDoc.moneda} {fmtMoney(Math.max(0, refDoc.total * retIslrPorcentaje / 100 - retIslrSustraendo))}</span></p>
                    )}
                  </>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
                <svg className="h-4 w-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-xs text-emerald-400">Validacion SENIAT V1.4</span>
              </div>
            </div>
          )}

          {/* Totals panel */}
          <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
            <h3 className="mb-3 text-sm font-semibold text-gray-300">Totales</h3>

            {/* NC total: show original invoice amount */}
            {isNC && ncTipo === "total" && refDoc ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Total factura original:</span>
                  <span>{refDoc.moneda} {fmtMoney(refDoc.total)}</span>
                </div>
                <div className="border-t border-white/10 pt-2">
                  <div className="flex justify-between text-lg font-bold text-white">
                    <span>Total NC:</span>
                    <span>{refDoc.moneda} {fmtMoney(refDoc.total)}</span>
                  </div>
                  {bcvRate && refDoc.moneda !== "VES" && (
                    <div className="flex justify-end">
                      <span className="text-sm text-gray-400">Bs. {fmtMoney(refDoc.total * bcvRate)}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : showItems && !isGD ? (
              /* Items-based totals (factura, NC parcial, ND) */
              <div className="space-y-2 text-sm">
                <DualRow label="Subtotal bruto:" amount={calcGrossSubtotal()} />
                {calcDiscount() > 0 && <DualRow label="Descuento:" amount={calcDiscount()} sign="- " color="text-red-400" />}
                {calcBaseImponible16() > 0 && <DualRow label="Base imponible 16%:" amount={calcBaseImponible16()} />}
                {calcIva16() > 0 && <DualRow label="IVA 16%:" amount={calcIva16()} />}
                {calcBaseImponible8() > 0 && <DualRow label="Base imponible 8%:" amount={calcBaseImponible8()} />}
                {calcIva8() > 0 && <DualRow label="IVA 8%:" amount={calcIva8()} />}
                {calcBaseImponible31() > 0 && <DualRow label="Base imponible 31%:" amount={calcBaseImponible31()} />}
                {calcIva31() > 0 && <DualRow label="IVA 31%:" amount={calcIva31()} />}
                {calcBaseExenta() > 0 && <DualRow label="Exento:" amount={calcBaseExenta()} />}

                <div className="border-t border-white/5 pt-2">
                  <DualRow label={`Total ${docLabel.toLowerCase()}:`} amount={calcTotalDocumento()} bold />
                </div>

                {isForeignCurrency && docType === "factura" && (
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

                {!isForeignCurrency && moneda === "VES" && (
                  <div className="border-t border-white/5 pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-white">Total a pagar:</span>
                      <span className="text-white">Bs. {fmtMoney(calcTotalDocumento())}</span>
                    </div>
                    {bcvRate && (
                      <div className="flex justify-end">
                        <span className="text-sm font-medium text-gray-400">$ {fmtMoney(calcTotalDocumento() / bcvRate)}</span>
                      </div>
                    )}
                  </div>
                )}

                {isForeignCurrency && docType !== "factura" && (
                  <div className="border-t border-white/5 pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-white">Total:</span>
                      <span className="text-white">{moneda} {fmtMoney(calcTotalDocumento())}</span>
                    </div>
                    {dualAmount(calcTotalDocumento()) && (
                      <div className="flex justify-end">
                        <span className="text-sm font-medium text-gray-400">{dualAmount(calcTotalDocumento())}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : isGD ? (
              /* Dispatch guide summary (no fiscal totals) */
              <div className="space-y-2 text-sm">
                <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 px-3 py-2 text-xs text-violet-300">
                  Sin derecho a credito fiscal (Art. 10, Prov. SNAT/2024/000102)
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Total lineas:</span>
                  <span className="font-medium text-white">{items.length}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Total unidades:</span>
                  <span className="font-medium text-white">{items.reduce((s, it) => s + it.quantity, 0)}</span>
                </div>
              </div>
            ) : (isRetIva || isRetIslr) && refDoc ? (
              /* Retention totals */
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Base (factura ref.):</span>
                  <span>{refDoc.moneda} {fmtMoney(refDoc.total)}</span>
                </div>
                {isRetIva && (
                  <>
                    <div className="flex justify-between text-gray-400">
                      <span>Porcentaje retencion:</span>
                      <span>{retIvaPorcentaje}%</span>
                    </div>
                    <div className="border-t border-white/10 pt-2">
                      <div className="flex justify-between text-lg font-bold text-white">
                        <span>Monto a retener:</span>
                        <span>{refDoc.moneda} {fmtMoney(refDoc.total * retIvaPorcentaje / 100)}</span>
                      </div>
                      {bcvRate && refDoc.moneda !== "VES" && (
                        <div className="flex justify-end">
                          <span className="text-sm text-gray-400">Bs. {fmtMoney(refDoc.total * retIvaPorcentaje / 100 * bcvRate)}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
                {isRetIslr && (
                  <>
                    <div className="flex justify-between text-gray-400">
                      <span>Porcentaje retencion:</span>
                      <span>{retIslrPorcentaje}%</span>
                    </div>
                    {retIslrSustraendo > 0 && (
                      <div className="flex justify-between text-gray-400">
                        <span>Sustraendo:</span>
                        <span>- {fmtMoney(retIslrSustraendo)}</span>
                      </div>
                    )}
                    <div className="border-t border-white/10 pt-2">
                      <div className="flex justify-between text-lg font-bold text-white">
                        <span>Monto a retener:</span>
                        <span>{refDoc.moneda} {fmtMoney(Math.max(0, refDoc.total * retIslrPorcentaje / 100 - retIslrSustraendo))}</span>
                      </div>
                      {bcvRate && refDoc.moneda !== "VES" && (
                        <div className="flex justify-end">
                          <span className="text-sm text-gray-400">Bs. {fmtMoney(Math.max(0, refDoc.total * retIslrPorcentaje / 100 - retIslrSustraendo) * bcvRate)}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Seleccione una factura de referencia.</p>
            )}

            {/* BCV rate in totals */}
            {bcvRate && (
              <div className="mt-3 rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-semibold text-blue-300">Tasa BCV</span>
                  </div>
                  <span className="text-sm font-bold text-blue-200">Bs. {fmtMoney(bcvRate)} / $ 1</span>
                </div>
                {bcvDate && <p className="mt-0.5 text-right text-[10px] text-blue-400/60">Actualizado: {bcvDate}</p>}
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
                Tasa BCV no disponible.
                <button type="button" onClick={() => fetchRates(0)} className="ml-2 underline hover:text-amber-200">Reintentar</button>
              </div>
            )}

            {/* Submit button */}
            <div className="mt-4">
              <button type="submit" disabled={loading}
                className="w-full rounded-lg bg-aida-accent py-2.5 text-sm font-medium text-white hover:bg-aida-accent/80 disabled:opacity-50 transition">
                Previsualizar {docLabel}
              </button>
              <p className="mt-2 text-center text-[10px] text-gray-600">
                Se mostrara una vista previa antes de emitir
              </p>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}

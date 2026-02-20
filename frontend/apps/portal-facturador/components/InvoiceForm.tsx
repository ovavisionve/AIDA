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
  // PLACEHOLDER — Phases 3-5 (calculations, submit, render)
  // ═══════════════════════════════════════════════════════════════

  return <div className="text-white text-center py-12">Cargando formulario...</div>;
}

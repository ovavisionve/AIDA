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
  // PLACEHOLDER — Phases 2-5 will be added below
  // ═══════════════════════════════════════════════════════════════

  return <div className="text-white text-center py-12">Cargando formulario...</div>;
}

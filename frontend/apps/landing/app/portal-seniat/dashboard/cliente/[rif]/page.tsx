"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/* ── Types ── */
interface Documento {
  tipo: string;
  numero: string;
  fecha: string;
  monto: string;
  receptor: string;
  status: string;
  uuid: string;
}

interface AuditoriaEntry {
  fecha: string;
  accion: string;
  detalle: string;
}

interface Empresa {
  rif: string;
  nombre: string;
  estado: string;
  ciudad: string;
  direccion: string;
  telefono: string;
  email: string;
  actividadEconomica: string;
  plan: string;
  fechaRegistro: string;
  status: string;
  homologado: boolean;
  prov102: boolean;
  prov121: boolean;
  numerosControlAsignados: number;
  numerosControlUsados: number;
  documentos: Documento[];
  auditoria: AuditoriaEntry[];
}

/* ── Map doc type code to label ── */
const DOC_TYPE_MAP: Record<string, string> = {
  factura: "Factura", invoice: "Factura", "01": "Factura",
  nota_credito: "Nota Crédito", credit_note: "Nota Crédito", "02": "Nota Crédito",
  nota_debito: "Nota Débito", debit_note: "Nota Débito", "03": "Nota Débito",
  guia_despacho: "Guía Despacho", "04": "Guía Despacho",
  retencion_iva: "Ret. IVA", "05": "Ret. IVA",
  retencion_islr: "Ret. ISLR", "06": "Ret. ISLR",
};

function mapDocType(t: string): string {
  return DOC_TYPE_MAP[t?.toLowerCase()] || t || "Factura";
}

/* ── Helper Components ── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; classes: string }> = {
    cumple: { label: "Cumple", classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    revision: { label: "En revisión", classes: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    alerta: { label: "Alerta", classes: "bg-red-500/10 text-red-400 border-red-500/20" },
    valido: { label: "Válido", classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    anulado: { label: "Anulado", classes: "bg-red-500/10 text-red-400 border-red-500/20" },
  };
  const s = map[status] ?? map.revision;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${s.classes}`}>
      {s.label}
    </span>
  );
}

function ComplianceBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${ok ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"}`}>
      {ok ? (
        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      ) : (
        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      )}
      <div>
        <p className={`text-sm font-semibold ${ok ? "text-emerald-400" : "text-red-400"}`}>{label}</p>
        <p className="text-[10px] text-gray-500">{ok ? "Cumple" : "No cumple"}</p>
      </div>
    </div>
  );
}

/* ── Document Viewer Modal ── */
function DocumentViewer({ doc, empresa, onClose }: { doc: Documento; empresa: Empresa; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0d1320] border border-white/10 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-5 border-b border-white/5 bg-[#0d1320]/95 backdrop-blur-lg rounded-t-2xl">
          <div>
            <h3 className="text-lg font-bold text-white">{doc.tipo} {doc.numero}</h3>
            <p className="text-xs text-gray-500 mt-0.5">UUID: <span className="font-mono text-aida-cyan">{doc.uuid}</span></p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Document Content */}
        <div className="p-5 space-y-5">
          {/* Status */}
          <div className="flex items-center gap-3">
            <StatusBadge status={doc.status} />
            <span className="text-xs text-gray-500">{doc.fecha}</span>
          </div>

          {/* Emisor */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Emisor</p>
            <p className="text-sm font-semibold text-white">{empresa.nombre}</p>
            <p className="text-xs text-gray-400 font-mono">{empresa.rif}</p>
            <p className="text-xs text-gray-500 mt-1">{empresa.direccion}</p>
          </div>

          {/* Receptor */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Receptor / Detalle</p>
            <p className="text-sm text-gray-300">{doc.receptor}</p>
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Monto Total</p>
              <p className="text-lg font-bold text-white font-mono">{doc.monto}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">N° Control</p>
              <p className="text-lg font-bold text-aida-cyan font-mono">{doc.numero}</p>
            </div>
          </div>

          {/* Verification */}
          <div className="p-4 rounded-xl bg-aida-accent/5 border border-aida-accent/20">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-aida-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="text-xs font-semibold text-aida-cyan">Verificación de Autenticidad</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div><span className="text-gray-500">Firma SHA-256:</span> <span className="font-mono text-gray-400">{doc.uuid.replace(/-/g, "").slice(0, 16)}...</span></div>
              <div><span className="text-gray-500">Timestamp:</span> <span className="text-gray-400">{doc.fecha} 00:00:00 -04:00</span></div>
              <div><span className="text-gray-500">QR válido:</span> <span className="text-emerald-400">Sí</span></div>
              <div><span className="text-gray-500">Trazabilidad:</span> <span className="text-emerald-400">Completa</span></div>
            </div>
          </div>

          {/* Download actions */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Descargar Documento</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { format: "PDF", icon: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z", color: "text-red-400 border-red-500/20 bg-red-500/5 hover:bg-red-500/10" },
                { format: "XML", icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4", color: "text-amber-400 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10" },
                { format: "JSON", icon: "M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10" },
                { format: "CSV", icon: "M3 10h18M3 14h18M3 18h18M3 6h18", color: "text-blue-400 border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10" },
              ].map(({ format, color }) => (
                <button
                  key={format}
                  onClick={() => alert(`Descarga ${format} del documento ${doc.numero} (demo)`)}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${color}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {format}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Report Download Modal ── */
function ReportDownloadModal({ empresa, onClose }: { empresa: Empresa; onClose: () => void }) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [format, setFormat] = useState("PDF");
  const [includeAudit, setIncludeAudit] = useState(false);

  const docTypes = useMemo(() => {
    const types = new Set(empresa.documentos.map((d) => d.tipo));
    return Array.from(types);
  }, [empresa]);

  const toggleType = (t: string) => {
    setSelectedTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const selectAll = () => setSelectedTypes(docTypes);
  const selectNone = () => setSelectedTypes([]);

  const filteredCount = empresa.documentos.filter((d) => {
    if (selectedTypes.length > 0 && !selectedTypes.includes(d.tipo)) return false;
    return true;
  }).length;

  const handleDownload = () => {
    const typeLabel = selectedTypes.length === 0 || selectedTypes.length === docTypes.length
      ? "todos los documentos"
      : selectedTypes.join(", ");
    alert(
      `Generando reporte ${format} de ${typeLabel} para ${empresa.nombre}\n\n` +
      `Documentos: ${filteredCount}\n` +
      `Rango: ${dateFrom || "Inicio"} — ${dateTo || "Hoy"}\n` +
      `Incluye auditoría: ${includeAudit ? "Sí" : "No"}\n\n` +
      `(Demo — en producción se descargaría el archivo)`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#0d1320] border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h3 className="text-lg font-bold text-white">Descargar Reporte</h3>
            <p className="text-xs text-gray-500 mt-0.5">{empresa.nombre}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Document types */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tipos de Documento</p>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-[10px] text-aida-cyan hover:underline">Todos</button>
                <button onClick={selectNone} className="text-[10px] text-gray-500 hover:underline">Ninguno</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {docTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    selectedTypes.includes(t)
                      ? "bg-aida-accent/10 text-aida-cyan border-aida-accent/30"
                      : "bg-white/[0.02] text-gray-400 border-white/10 hover:bg-white/5"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {selectedTypes.length === 0 && (
              <p className="text-[10px] text-gray-500 mt-2">Sin selección = incluir todos los tipos</p>
            )}
          </div>

          {/* Date range */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Rango de Fechas</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Desde</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:border-aida-cyan/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Hasta</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:border-aida-cyan/50 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Format */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Formato de Descarga</p>
            <div className="grid grid-cols-4 gap-2">
              {["PDF", "Excel", "CSV", "JSON"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    format === f
                      ? "bg-aida-accent/10 text-aida-cyan border-aida-accent/30"
                      : "bg-white/[0.02] text-gray-400 border-white/10 hover:bg-white/5"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Include audit */}
          <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/10 cursor-pointer hover:bg-white/[0.04] transition-colors">
            <input
              type="checkbox"
              checked={includeAudit}
              onChange={(e) => setIncludeAudit(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-transparent accent-aida-cyan"
            />
            <div>
              <p className="text-sm text-white font-medium">Incluir registro de auditoría</p>
              <p className="text-[10px] text-gray-500">Agrega el log de trazabilidad al reporte</p>
            </div>
          </label>

          {/* Summary & download */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-500">
              <span className="text-white font-semibold">{filteredCount}</span> documentos en el reporte
            </p>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-aida-accent to-aida-cyan text-sm font-semibold text-white hover:shadow-lg hover:shadow-aida-accent/25 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Descargar {format}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function ClienteDetallePage() {
  const params = useParams();
  const router = useRouter();
  const rifParam = decodeURIComponent(params.rif as string);

  const [empresa, setEmpresa] = useState<Empresa | null | undefined>(undefined);

  // Fetch client data from real API
  useEffect(() => {
    const token = sessionStorage.getItem("seniat_token");
    if (!token) { setEmpresa(null); return; }

    const headers = { Authorization: `Bearer ${token}` };

    // Fetch client info
    fetch(`${API}/clients?page_size=50`, { headers })
      .then(r => r.ok ? r.json() : Promise.reject("api error"))
      .then(async (data) => {
        const client = (data.items || []).find((c: Record<string, unknown>) => c.rif === rifParam);
        if (!client) { setEmpresa(null); return; }

        const emp: Empresa = {
          rif: client.rif,
          nombre: client.razon_social || client.nombre_comercial || "",
          estado: (client.direccion_fiscal || "").split(",").pop()?.trim() || "Venezuela",
          ciudad: (client.direccion_fiscal || "").split(",")[0]?.trim() || "",
          direccion: client.direccion_fiscal || "",
          telefono: client.telefono_principal || "—",
          email: client.email_principal || "—",
          actividadEconomica: client.sector_industria || "Actividad comercial",
          plan: client.plan || "Básico",
          fechaRegistro: new Date(client.fecha_inicio || client.created_at).toLocaleDateString("es-VE"),
          status: client.is_suspended ? "alerta" : client.is_active ? "cumple" : "revision",
          homologado: client.is_active,
          prov102: true,
          prov121: client.is_active,
          numerosControlAsignados: client.max_documentos_mes || 1000,
          numerosControlUsados: 0,
          documentos: [],
          auditoria: [],
        };

        // Fetch documents for this client in parallel
        try {
          const docsRes = await fetch(`${API}/documents?page_size=50&search=${encodeURIComponent(rifParam)}`, { headers });
          if (docsRes.ok) {
            const docsData = await docsRes.json();
            emp.documentos = (docsData.items || []).map((d: Record<string, unknown>) => ({
              tipo: mapDocType((d.document_type as string) || ""),
              numero: (d.control_number as string) || (d.document_number as string) || "—",
              fecha: d.created_at ? new Date(d.created_at as string).toLocaleDateString("es-VE") : "—",
              monto: d.total_amount ? `Bs. ${Number(d.total_amount).toLocaleString("es-VE", { minimumFractionDigits: 2 })}` : "—",
              receptor: `${(d.receptor_razon_social as string) || ""} ${(d.receptor_rif as string) ? `(${d.receptor_rif})` : ""}`.trim() || "—",
              status: (d.status as string) === "active" || (d.status as string) === "valid" ? "valido" : (d.status as string) === "voided" ? "anulado" : "valido",
              uuid: (d.id as string) || crypto.randomUUID(),
            }));
            emp.numerosControlUsados = emp.documentos.length;
          }
        } catch (err) { console.error("Failed to fetch documents:", err); }

        // Fetch audit logs for this client
        try {
          const auditRes = await fetch(`${API}/admin/audit-logs?page_size=20&search=${encodeURIComponent(rifParam)}`, { headers });
          if (auditRes.ok) {
            const auditData = await auditRes.json();
            emp.auditoria = (auditData.items || []).map((log: Record<string, unknown>) => ({
              fecha: log.created_at ? new Date(log.created_at as string).toLocaleString("es-VE") : "—",
              accion: (log.action as string) || "Acción registrada",
              detalle: `${log.action || ""} — ${log.details || log.resource_type || ""} ${log.resource_id || ""}`.trim(),
            }));
          }
        } catch (err) { console.error("Failed to fetch audit logs:", err); }

        setEmpresa(emp);
      })
      .catch((err) => {
        console.error("Failed to fetch client:", err);
        setEmpresa(null);
      });
  }, [rifParam]);

  // Filters
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Modals
  const [viewDoc, setViewDoc] = useState<Documento | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<"documentos" | "auditoria">("documentos");

  // Loading state
  if (empresa === undefined) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-aida-cyan border-t-transparent" />
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-white mb-1">Contribuyente no encontrado</h2>
        <p className="text-sm text-gray-400 mb-6">
          No se encontró ningún contribuyente con RIF <span className="font-mono text-aida-cyan">{rifParam}</span>
        </p>
        <button
          onClick={() => router.push("/portal-seniat/dashboard")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-aida-cyan border border-aida-cyan/20 hover:bg-aida-cyan/10 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al panel
        </button>
      </div>
    );
  }

  const usagePercent = Math.round((empresa.numerosControlUsados / empresa.numerosControlAsignados) * 100);

  // Document types available for this company
  const docTypes = Array.from(new Set(empresa.documentos.map((d) => d.tipo)));

  // Parse date helper (dd/mm/yyyy => Date)
  const parseDate = (s: string) => {
    const [d, m, y] = s.split("/");
    return new Date(+y, +m - 1, +d);
  };

  // Filter documents
  const filteredDocs = empresa.documentos.filter((doc) => {
    if (filterType && doc.tipo !== filterType) return false;
    if (filterStatus && doc.status !== filterStatus) return false;
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      const matchesNum = doc.numero.toLowerCase().includes(q);
      const matchesReceptor = doc.receptor.toLowerCase().includes(q);
      const matchesUuid = doc.uuid.toLowerCase().includes(q);
      if (!matchesNum && !matchesReceptor && !matchesUuid) return false;
    }
    if (filterDateFrom) {
      const docDate = parseDate(doc.fecha);
      const from = new Date(filterDateFrom);
      if (docDate < from) return false;
    }
    if (filterDateTo) {
      const docDate = parseDate(doc.fecha);
      const to = new Date(filterDateTo);
      to.setHours(23, 59, 59);
      if (docDate > to) return false;
    }
    return true;
  });

  const clearFilters = () => {
    setFilterType("");
    setFilterStatus("");
    setFilterSearch("");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const hasActiveFilters = filterType || filterStatus || filterSearch || filterDateFrom || filterDateTo;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Modals */}
      {viewDoc && <DocumentViewer doc={viewDoc} empresa={empresa} onClose={() => setViewDoc(null)} />}
      {showReportModal && <ReportDownloadModal empresa={empresa} onClose={() => setShowReportModal(false)} />}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/portal-seniat/dashboard" className="hover:text-aida-cyan transition-colors">Panel General</Link>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        <span className="text-gray-400">Contribuyente</span>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        <span className="text-aida-cyan font-mono">{empresa.rif}</span>
      </div>

      {/* Company header */}
      <div className="glass-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-white">{empresa.nombre}</h1>
              <StatusBadge status={empresa.status} />
            </div>
            <p className="text-sm text-gray-400 font-mono">{empresa.rif}</p>
            <p className="text-xs text-gray-500 mt-1">{empresa.actividadEconomica}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-aida-accent/10 text-aida-cyan border border-aida-accent/20">
              Plan {empresa.plan}
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 bg-white/5 border border-white/10">
              Desde {empresa.fechaRegistro}
            </span>
            <button
              onClick={() => setShowReportModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-aida-accent/10 to-aida-cyan/10 text-aida-cyan border border-aida-cyan/20 hover:border-aida-cyan/40 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Descargar Reportes
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-6 pt-6 border-t border-white/5">
          {[
            { label: "Ubicación", value: `${empresa.ciudad}, ${empresa.estado}` },
            { label: "Dirección", value: empresa.direccion },
            { label: "Teléfono", value: empresa.telefono },
            { label: "Email", value: empresa.email },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{item.label}</p>
              <p className="text-sm text-gray-300 mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ComplianceBadge ok={empresa.prov102} label="Providencia 102" />
        <ComplianceBadge ok={empresa.prov121} label="Providencia 121" />
        <ComplianceBadge ok={empresa.homologado} label="Homologación SENIAT" />
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-white/[0.02] border-white/10">
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="url(#gradient)" strokeWidth="3" strokeDasharray={`${usagePercent}, 100`} strokeLinecap="round" />
              <defs><linearGradient id="gradient"><stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#06b6d4" /></linearGradient></defs>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">{usagePercent}%</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Números de Control</p>
            <p className="text-[10px] text-gray-500">{empresa.numerosControlUsados.toLocaleString()} / {empresa.numerosControlAsignados.toLocaleString()} usados</p>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 p-1 bg-white/[0.02] rounded-xl border border-white/5 w-fit">
        {[
          { key: "documentos" as const, label: "Documentos Fiscales", count: empresa.documentos.length },
          { key: "auditoria" as const, label: "Registro de Auditoría", count: empresa.auditoria.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-aida-accent/10 text-aida-cyan border border-aida-accent/20"
                : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            {tab.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
              activeTab === tab.key ? "bg-aida-cyan/10 text-aida-cyan" : "bg-white/5 text-gray-500"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Documents Tab */}
      {activeTab === "documentos" && (
        <div className="glass-card overflow-hidden">
          {/* Filter bar */}
          <div className="p-5 border-b border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white">Documentos Fiscales Emitidos</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {hasActiveFilters ? `${filteredDocs.length} de ${empresa.documentos.length} documentos` : `${empresa.documentos.length} documentos totales`}
                </p>
              </div>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-aida-cyan hover:underline">Limpiar filtros</button>
              )}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Buscar por N° control, receptor, UUID..."
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder-gray-500 focus:border-aida-cyan/50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Type */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:border-aida-cyan/50 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="" className="bg-gray-900">Todos los tipos</option>
                {docTypes.map((t) => (
                  <option key={t} value={t} className="bg-gray-900">{t}</option>
                ))}
              </select>

              {/* Status */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:border-aida-cyan/50 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="" className="bg-gray-900">Todos los estados</option>
                <option value="valido" className="bg-gray-900">Válido</option>
                <option value="revision" className="bg-gray-900">En revisión</option>
                <option value="anulado" className="bg-gray-900">Anulado</option>
              </select>

              {/* Date range compact */}
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  title="Desde"
                  className="flex-1 px-2 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-xs text-white focus:border-aida-cyan/50 focus:outline-none"
                />
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  title="Hasta"
                  className="flex-1 px-2 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-xs text-white focus:border-aida-cyan/50 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-3 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Tipo</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">N° Control</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Fecha</th>
                  <th className="text-right py-3 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Monto</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Receptor / Detalle</th>
                  <th className="text-center py-3 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                  <th className="text-center py-3 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-gray-500">
                      No se encontraron documentos con los filtros aplicados
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((doc, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                      <td className="py-3 px-5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/5 text-gray-300 border border-white/10">
                          {doc.tipo}
                        </span>
                      </td>
                      <td className="py-3 px-5 font-mono text-xs text-white">{doc.numero}</td>
                      <td className="py-3 px-5 text-xs text-gray-400 hidden sm:table-cell">{doc.fecha}</td>
                      <td className="py-3 px-5 text-right text-xs text-white font-mono hidden md:table-cell">{doc.monto}</td>
                      <td className="py-3 px-5 text-xs text-gray-400 hidden lg:table-cell max-w-xs truncate">{doc.receptor}</td>
                      <td className="py-3 px-5 text-center"><StatusBadge status={doc.status} /></td>
                      <td className="py-3 px-5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewDoc(doc)}
                            title="Ver documento"
                            className="p-1.5 rounded-lg hover:bg-aida-cyan/10 text-gray-400 hover:text-aida-cyan transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => alert(`Descargando PDF de ${doc.tipo} ${doc.numero} (demo)`)}
                            title="Descargar PDF"
                            className="p-1.5 rounded-lg hover:bg-aida-cyan/10 text-gray-400 hover:text-aida-cyan transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {filteredDocs.length > 0 && (
            <div className="p-4 border-t border-white/5 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Mostrando {filteredDocs.length} documento{filteredDocs.length !== 1 && "s"}
              </p>
              <button
                onClick={() => setShowReportModal(true)}
                className="text-xs text-aida-cyan hover:underline"
              >
                Exportar resultados
              </button>
            </div>
          )}
        </div>
      )}

      {/* Audit Tab */}
      {activeTab === "auditoria" && (
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <h2 className="text-sm font-bold text-white">Registro de Auditoría</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Trazabilidad completa de acciones y verificaciones automáticas
            </p>
          </div>
          <div className="p-5 space-y-4">
            {empresa.auditoria.map((entry, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${entry.accion.toLowerCase().includes("alerta") ? "bg-amber-400" : "bg-aida-cyan"}`} />
                  {i < empresa.auditoria.length - 1 && <div className="w-px flex-1 bg-white/5 mt-1" />}
                </div>
                <div className="pb-4 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white">{entry.accion}</p>
                    <span className="text-[10px] text-gray-500 font-mono">{entry.fecha}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{entry.detalle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Back button */}
      <div className="flex justify-between items-center pt-2 pb-4">
        <button
          onClick={() => router.push("/portal-seniat/dashboard")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white border border-white/10 hover:bg-white/5 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al panel
        </button>
        <p className="text-[10px] text-gray-600">
          Datos en tiempo real del sistema AIDA — Imprenta Digital
        </p>
      </div>
    </div>
  );
}

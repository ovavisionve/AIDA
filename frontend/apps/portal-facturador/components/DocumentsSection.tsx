"use client";

import { useEffect, useState } from "react";

interface Props { token: string }

type DocType = "all" | "factura" | "nota_credito" | "nota_debito" | "guia_despacho";
type StatusFilter = "all" | "emitido" | "anulado" | "pagado";

interface DocumentRow {
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
  pdf_url?: string;
  xml_url?: string;
}

export default function DocumentsSection({ token }: Props) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<DocType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionMsg, setActionMsg] = useState("");

  const loadDocs = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), per_page: "20" });
      if (search) params.set("search", search);
      if (typeFilter !== "all") params.set("doc_type", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);

      const res = await fetch(`${apiUrl}/invoicing/documents?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDocs(data.items || []);
        setTotalPages(data.total_pages || 1);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || `Error ${res.status} al cargar documentos`);
      }
    } catch {
      setError("Error de conexión al cargar documentos");
    }
    setLoading(false);
  };

  useEffect(() => { loadDocs(); }, [page, typeFilter, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadDocs();
  };

  const handleVoid = async (docId: string, tipo: string) => {
    if (!confirm("¿Anular este documento? Esta acción no se puede deshacer.")) return;
    try {
      const motivo = encodeURIComponent("Anulación solicitada por facturador");
      const res = await fetch(`${apiUrl}/invoicing/invoices/${docId}/void?motivo=${motivo}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setActionMsg("Documento anulado exitosamente");
        loadDocs();
      } else {
        const data = await res.json().catch(() => ({}));
        setActionMsg(data.detail || "Error al anular documento");
      }
    } catch { setActionMsg("Error de conexión al anular"); }
    setTimeout(() => setActionMsg(""), 4000);
  };

  const handleResendEmail = async (docId: string) => {
    try {
      const res = await fetch(`${apiUrl}/invoicing/invoices/${docId}/send-email`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setActionMsg("Email reenviado exitosamente");
      } else {
        const data = await res.json().catch(() => ({}));
        setActionMsg(data.detail || "Error al reenviar email");
      }
    } catch { setActionMsg("Error de conexión al reenviar email"); }
    setTimeout(() => setActionMsg(""), 4000);
  };

  const typeLabels: Record<string, string> = {
    factura: "Factura", nota_credito: "N. Credito", nota_debito: "N. Debito", guia_despacho: "G. Despacho",
  };
  const statusColors: Record<string, string> = {
    emitido: "bg-emerald-500/10 text-emerald-400",
    anulado: "bg-red-500/10 text-red-400",
    pagado: "bg-blue-500/10 text-blue-400",
    vigente: "bg-amber-500/10 text-amber-400",
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400">{error}</div>
      )}
      {actionMsg && (
        <div className="rounded-lg bg-aida-accent/10 border border-aida-accent/20 px-4 py-2 text-sm text-aida-accent">
          {actionMsg}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-[11px] font-medium text-gray-500">Buscar</label>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="N. Control, documento, RIF, razon social..."
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none focus:ring-2 focus:ring-aida-accent/20" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">Tipo</label>
            <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value as DocType); setPage(1); }}
              className="rounded-lg bg-[#0a0f1a] border border-white/10 px-3 py-2 text-sm text-white focus:border-aida-accent focus:outline-none">
              <option value="all">Todos</option>
              <option value="factura">Facturas</option>
              <option value="nota_credito">Notas de Credito</option>
              <option value="nota_debito">Notas de Debito</option>
              <option value="guia_despacho">Guias de Despacho</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">Status</label>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as StatusFilter); setPage(1); }}
              className="rounded-lg bg-[#0a0f1a] border border-white/10 px-3 py-2 text-sm text-white focus:border-aida-accent focus:outline-none">
              <option value="all">Todos</option>
              <option value="emitido">Emitido</option>
              <option value="anulado">Anulado</option>
              <option value="pagado">Pagado</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">Desde</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:border-aida-accent focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">Hasta</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:border-aida-accent focus:outline-none" />
          </div>
          <button type="submit"
            className="rounded-lg bg-aida-accent px-4 py-2 text-sm font-medium text-white hover:bg-aida-accent/80 transition">
            Buscar
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/5 bg-white/[0.03] text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">N. Control</th>
              <th className="px-4 py-3">Numero</th>
              <th className="px-4 py-3">Receptor</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-aida-accent border-t-transparent" />
                <span className="ml-2">Cargando...</span>
              </td></tr>
            ) : docs.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                No se encontraron documentos. Emita su primera factura desde "Nueva Factura".
              </td></tr>
            ) : docs.map((doc) => (
              <tr key={doc.id} className="border-b border-white/5 hover:bg-white/5 transition">
                <td className="px-4 py-3">
                  <span className="rounded-full bg-aida-accent/10 px-2 py-0.5 text-[10px] font-medium text-aida-accent">
                    {typeLabels[doc.tipo] || doc.tipo}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-300">{doc.control_number}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-300">{doc.numero}</td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-300">{doc.receptor_razon_social}</div>
                  <div className="text-[11px] text-gray-500">{doc.receptor_rif}</div>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{doc.fecha}</td>
                <td className="px-4 py-3 text-right font-medium text-white">
                  {doc.moneda} {doc.total?.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[doc.status] || "bg-white/5 text-gray-500"}`}>
                    {doc.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    {doc.pdf_url && (
                      <a href={doc.pdf_url} target="_blank" title="Descargar PDF"
                        className="rounded p-1 text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      </a>
                    )}
                    {doc.xml_url && (
                      <a href={doc.xml_url} target="_blank" title="Descargar XML"
                        className="rounded p-1 text-gray-500 hover:bg-blue-500/10 hover:text-blue-400 transition">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                        </svg>
                      </a>
                    )}
                    <button onClick={() => handleResendEmail(doc.id)} title="Reenviar email"
                      className="rounded p-1 text-gray-500 hover:bg-amber-500/10 hover:text-amber-400 transition">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </button>
                    {doc.status === "emitido" && (
                      <button onClick={() => handleVoid(doc.id, doc.tipo)} title="Anular"
                        className="rounded p-1 text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/5 px-4 py-3">
            <span className="text-xs text-gray-500">Pagina {page} de {totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                className="rounded px-3 py-1 text-xs border border-white/10 text-gray-300 hover:bg-white/5 disabled:opacity-40">Anterior</button>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                className="rounded px-3 py-1 text-xs border border-white/10 text-gray-300 hover:bg-white/5 disabled:opacity-40">Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

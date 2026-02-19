"use client";

import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

type SearchMode = "nc" | "uuid" | "rif";

interface DocResult {
  found: boolean;
  document_type?: string;
  numero_control?: string;
  numero_documento?: string;
  fecha_emision?: string;
  rif_emisor?: string;
  razon_social_emisor?: string;
  rif_receptor?: string;
  razon_social_receptor?: string;
  subtotal?: number;
  iva?: number;
  total?: number;
  moneda?: string;
  status?: string;
  uuid?: string;
  hash_seguridad?: string;
  items?: any[];
}

export default function PortalValidacion() {
  const [mode, setMode] = useState<SearchMode>("nc");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DocResult | null>(null);
  const [rifDocs, setRifDocs] = useState<DocResult[]>([]);
  const [error, setError] = useState("");
  const [showDetail, setShowDetail] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setRifDocs([]);
    setShowDetail(false);

    try {
      let url = "";
      if (mode === "nc") url = `${API}/validation/verify/${encodeURIComponent(query)}`;
      else if (mode === "uuid") url = `${API}/validation/by-uuid/${encodeURIComponent(query)}`;
      else url = `${API}/validation/by-rif/${encodeURIComponent(query)}`;

      const res = await fetch(url);
      const data = await res.json();

      if (mode === "rif") {
        setRifDocs(data.documents || []);
        if ((data.documents || []).length === 0) setError("No se encontraron documentos para este RIF");
      } else {
        setResult(data);
        if (!data.found) setError("Documento no encontrado. Verifique el dato ingresado.");
      }
    } catch {
      setError("Error de conexion con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (nc: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/validation/verify/${encodeURIComponent(nc)}/detail`);
      const data = await res.json();
      setResult(data);
      setShowDetail(true);
    } catch {
      setError("Error al cargar detalle");
    } finally {
      setLoading(false);
    }
  };

  const typeLabel: Record<string, string> = {
    factura: "Factura",
    nota_credito: "Nota de Credito",
    nota_debito: "Nota de Debito",
  };

  const statusColor: Record<string, string> = {
    emitida: "bg-green-500/20 text-green-400 border-green-500/30",
    anulada: "bg-red-500/20 text-red-400 border-red-500/30",
    procesando: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-white.png" alt="AIDA" className="h-6" />
            <div>
              <p className="text-sm font-medium text-gray-300">Imprenta Digital</p>
              <p className="text-xs text-gray-400">Validacion de Documentos Fiscales</p>
            </div>
          </div>
          <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs text-green-400">
            Portal Publico
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-12">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold">Verificacion de Documentos</h2>
          <p className="mt-2 text-gray-400">
            Verifique la autenticidad de facturas y documentos fiscales emitidos a traves de AIDA
          </p>
        </div>

        {/* Search */}
        <div className="mx-auto w-full max-w-2xl space-y-4">
          <div className="flex gap-2 rounded-lg bg-white/5 p-1">
            {([
              { id: "nc" as const, label: "Numero de Control" },
              { id: "uuid" as const, label: "UUID" },
              { id: "rif" as const, label: "RIF Emisor" },
            ]).map((m) => (
              <button key={m.id} onClick={() => { setMode(m.id); setResult(null); setRifDocs([]); setError(""); }}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${mode === m.id ? "bg-aida-accent text-white" : "text-gray-400 hover:text-white"}`}>
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder={mode === "nc" ? "Ej: 00-00000001" : mode === "uuid" ? "Ej: 550e8400-e29b-41d4-..." : "Ej: J-12345678-9"}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none"
            />
            <button onClick={search} disabled={loading || !query.trim()}
              className="rounded-lg bg-aida-accent px-6 py-3 font-medium text-white transition hover:bg-aida-accent/80 disabled:opacity-50">
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : "Verificar"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-auto mt-6 w-full max-w-2xl rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Single result */}
        {result?.found && !showDetail && (
          <div className="mx-auto mt-8 w-full max-w-2xl rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                  <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-green-400">Documento Verificado</p>
                  <p className="text-xs text-gray-400">{typeLabel[result.document_type || ""] || result.document_type}</p>
                </div>
              </div>
              {result.status && (
                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusColor[result.status] || "bg-gray-500/20 text-gray-400"}`}>
                  {result.status}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-xs text-gray-500">N Control</p><p className="font-mono">{result.numero_control}</p></div>
              <div><p className="text-xs text-gray-500">Fecha Emision</p><p>{result.fecha_emision}</p></div>
              <div><p className="text-xs text-gray-500">RIF Emisor</p><p className="font-mono">{result.rif_emisor}</p></div>
              <div><p className="text-xs text-gray-500">Emisor</p><p>{result.razon_social_emisor || "-"}</p></div>
              <div><p className="text-xs text-gray-500">RIF Receptor</p><p className="font-mono">{result.rif_receptor}</p></div>
              <div><p className="text-xs text-gray-500">Receptor</p><p>{result.razon_social_receptor || "-"}</p></div>
              <div><p className="text-xs text-gray-500">Subtotal</p><p>{result.moneda} {result.subtotal?.toFixed(2)}</p></div>
              <div><p className="text-xs text-gray-500">IVA</p><p>{result.moneda} {result.iva?.toFixed(2)}</p></div>
              <div className="col-span-2 rounded-lg bg-white/5 p-3 text-center">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-2xl font-bold text-aida-accent">{result.moneda} {result.total?.toFixed(2)}</p>
              </div>
            </div>

            {result.uuid && (
              <div className="mt-4 rounded-lg bg-white/5 p-3">
                <p className="text-xs text-gray-500">UUID del documento</p>
                <p className="break-all font-mono text-xs text-gray-300">{result.uuid}</p>
              </div>
            )}

            {result.hash_seguridad && (
              <div className="mt-2 rounded-lg bg-white/5 p-3">
                <p className="text-xs text-gray-500">Hash de seguridad</p>
                <p className="break-all font-mono text-xs text-gray-300">{result.hash_seguridad}</p>
              </div>
            )}

            {mode === "nc" && result.numero_control && (
              <button onClick={() => loadDetail(result.numero_control!)}
                className="mt-4 w-full rounded-lg border border-white/10 py-2 text-sm text-gray-300 transition hover:bg-white/5">
                Ver detalle completo
              </button>
            )}
          </div>
        )}

        {/* Detail view with items */}
        {showDetail && result && (
          <div className="mx-auto mt-8 w-full max-w-2xl space-y-4">
            <button onClick={() => setShowDetail(false)} className="text-sm text-gray-400 hover:text-white">
              &larr; Volver al resumen
            </button>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h3 className="mb-4 text-lg font-semibold">Detalle del Documento</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-gray-500">Tipo</p><p>{typeLabel[result.document_type || ""] || result.document_type}</p></div>
                <div><p className="text-xs text-gray-500">N Control</p><p className="font-mono">{result.numero_control}</p></div>
                <div><p className="text-xs text-gray-500">Fecha</p><p>{result.fecha_emision}</p></div>
                <div><p className="text-xs text-gray-500">Estado</p><p>{result.status}</p></div>
                <div><p className="text-xs text-gray-500">Emisor</p><p>{result.rif_emisor} - {result.razon_social_emisor}</p></div>
                <div><p className="text-xs text-gray-500">Receptor</p><p>{result.rif_receptor} - {result.razon_social_receptor}</p></div>
              </div>

              {result.items && result.items.length > 0 && (
                <div className="mt-6">
                  <h4 className="mb-2 text-sm font-semibold text-gray-300">Items</h4>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-xs text-gray-500">
                        <th className="py-2 text-left">Descripcion</th>
                        <th className="py-2 text-right">Cant.</th>
                        <th className="py-2 text-right">P. Unit.</th>
                        <th className="py-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.items.map((item: any, i: number) => (
                        <tr key={i} className="border-b border-white/5">
                          <td className="py-2">{item.descripcion}</td>
                          <td className="py-2 text-right">{item.cantidad}</td>
                          <td className="py-2 text-right">{item.precio_unitario?.toFixed(2)}</td>
                          <td className="py-2 text-right">{item.subtotal?.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-4 flex justify-end gap-6 border-t border-white/10 pt-4 text-sm">
                <div><span className="text-gray-500">Subtotal:</span> <span className="font-medium">{result.moneda} {result.subtotal?.toFixed(2)}</span></div>
                <div><span className="text-gray-500">IVA:</span> <span className="font-medium">{result.moneda} {result.iva?.toFixed(2)}</span></div>
                <div><span className="text-gray-500">Total:</span> <span className="text-lg font-bold text-aida-accent">{result.moneda} {result.total?.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* RIF documents list */}
        {rifDocs.length > 0 && (
          <div className="mx-auto mt-8 w-full max-w-2xl space-y-3">
            <h3 className="text-lg font-semibold">Documentos encontrados ({rifDocs.length})</h3>
            {rifDocs.map((doc, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${doc.document_type === "factura" ? "bg-blue-500/20 text-blue-400" : doc.document_type === "nota_credito" ? "bg-orange-500/20 text-orange-400" : "bg-purple-500/20 text-purple-400"}`}>
                    {typeLabel[doc.document_type || ""] || doc.document_type}
                  </span>
                  <div>
                    <p className="font-mono text-sm">{doc.numero_control}</p>
                    <p className="text-xs text-gray-400">{doc.fecha_emision} - {doc.rif_receptor}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{doc.moneda} {doc.total?.toFixed(2)}</p>
                  <span className={`text-xs ${statusColor[doc.status || ""] || "text-gray-400"}`}>{doc.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-4 text-center text-xs text-gray-500">
        AIDA Imprenta Digital - Sistema de facturacion electronica conforme a la normativa SENIAT
      </footer>
    </div>
  );
}

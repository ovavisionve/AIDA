"use client";

import { useState } from "react";

interface Props { token: string }

type ReportType = "libro_ventas" | "libro_compras" | "iva" | "islr" | "ventas_periodo" | "ventas_vendedor" | "ventas_cliente";

const REPORTS: { id: ReportType; name: string; description: string; icon: string }[] = [
  { id: "libro_ventas", name: "Libro de Ventas", description: "Registro cronologico de todas las facturas emitidas", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { id: "libro_compras", name: "Libro de Compras", description: "Registro de facturas de proveedores con retenciones", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { id: "iva", name: "Declaracion IVA", description: "Resumen de debito y credito fiscal del periodo", icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
  { id: "islr", name: "Retenciones ISLR", description: "Comprobantes de retencion de impuesto sobre la renta", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  { id: "ventas_periodo", name: "Ventas por Periodo", description: "Resumen de ventas agrupado por dia, semana o mes", icon: "M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { id: "ventas_vendedor", name: "Ventas por Vendedor", description: "Desempeno de ventas por usuario facturador", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { id: "ventas_cliente", name: "Ventas por Cliente", description: "Facturacion acumulada por cada receptor/cliente", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
];

export default function ReportsSection({ token }: Props) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const [selected, setSelected] = useState<ReportType | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [format, setFormat] = useState<"pdf" | "excel" | "csv">("excel");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const generateReport = async () => {
    if (!selected || !dateFrom || !dateTo) return;
    setLoading(true);
    setReportData(null);
    try {
      const params = new URLSearchParams({
        report_type: selected,
        date_from: dateFrom,
        date_to: dateTo,
        format,
      });
      const res = await fetch(`${apiUrl}/invoicing/reports?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("json")) {
          const data = await res.json();
          setReportData(data);
        } else {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `reporte_${selected}_${dateFrom}_${dateTo}.${format === "excel" ? "xlsx" : format}`;
          a.click();
          URL.revokeObjectURL(url);
          setReportData({ downloaded: true });
        }
      }
    } catch { /* silently fail */ }
    setLoading(false);
  };

  if (!selected) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800">Reportes Fiscales</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {REPORTS.map(report => (
            <button key={report.id} onClick={() => setSelected(report.id)}
              className="group rounded-xl bg-white p-5 shadow-sm text-left hover:shadow-md hover:border-aida-accent/30 border border-transparent transition-all">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-aida-accent/10 p-2 group-hover:bg-aida-accent/20 transition">
                  <svg className="h-5 w-5 text-aida-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={report.icon} />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">{report.name}</h4>
                  <p className="mt-1 text-xs text-slate-500">{report.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const reportInfo = REPORTS.find(r => r.id === selected)!;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => { setSelected(null); setReportData(null); }}
          className="rounded-lg p-1 hover:bg-slate-100 transition">
          <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-lg font-semibold text-slate-800">{reportInfo.name}</h3>
      </div>

      {/* Parameters */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Fecha Desde</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-aida-accent focus:outline-none focus:ring-2 focus:ring-aida-accent/20" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Fecha Hasta</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-aida-accent focus:outline-none focus:ring-2 focus:ring-aida-accent/20" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Formato</label>
            <select value={format} onChange={e => setFormat(e.target.value as "pdf" | "excel" | "csv")}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-aida-accent focus:outline-none">
              <option value="excel">Excel (.xlsx)</option>
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
          <button onClick={generateReport} disabled={loading || !dateFrom || !dateTo}
            className="rounded-lg bg-aida-accent px-5 py-2 text-sm font-medium text-white hover:bg-aida-primary transition disabled:opacity-50">
            {loading ? "Generando..." : "Generar Reporte"}
          </button>
        </div>
      </div>

      {/* Results */}
      {reportData && (
        <div className="rounded-xl bg-white p-5 shadow-sm">
          {reportData.downloaded ? (
            <div className="text-center py-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-slate-600">Reporte descargado exitosamente</p>
            </div>
          ) : reportData.resumen ? (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-700">Resumen del Periodo</h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Object.entries(reportData.resumen).map(([key, val]) => (
                  <div key={key} className="rounded-lg bg-slate-50 p-3">
                    <p className="text-[11px] text-slate-500 capitalize">{key.replace(/_/g, " ")}</p>
                    <p className="mt-1 text-lg font-bold text-slate-800">
                      {typeof val === "number" ? val.toLocaleString("es-VE", { minimumFractionDigits: 2 }) : String(val)}
                    </p>
                  </div>
                ))}
              </div>

              {reportData.items && (
                <div className="mt-4 overflow-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">Fecha</th>
                        <th className="px-3 py-2 text-left">N. Control</th>
                        <th className="px-3 py-2 text-left">Receptor</th>
                        <th className="px-3 py-2 text-right">Base Imponible</th>
                        <th className="px-3 py-2 text-right">IVA</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {reportData.items.map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2 text-slate-600">{item.fecha}</td>
                          <td className="px-3 py-2 font-mono text-xs">{item.control_number}</td>
                          <td className="px-3 py-2">{item.receptor}</td>
                          <td className="px-3 py-2 text-right">{item.base_imponible?.toLocaleString("es-VE", { minimumFractionDigits: 2 })}</td>
                          <td className="px-3 py-2 text-right">{item.iva?.toLocaleString("es-VE", { minimumFractionDigits: 2 })}</td>
                          <td className="px-3 py-2 text-right font-medium">{item.total?.toLocaleString("es-VE", { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">No hay datos para el periodo seleccionado.</p>
          )}
        </div>
      )}
    </div>
  );
}

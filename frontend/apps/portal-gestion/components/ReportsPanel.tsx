"use client";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const fmt = (n: number) => new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

type ReportType = "sales-book" | "tax-summary" | "fiscal-summary" | "tax-optimization";

export default function ReportsPanel({ token }: { token: string }) {
  const [activeReport, setActiveReport] = useState<ReportType | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  // Params
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");

  const headers = { Authorization: `Bearer ${token}` };

  const generateReport = async (type: ReportType) => {
    setActiveReport(type);
    setLoading(true);
    setReportData(null);

    try {
      let url = "";
      switch (type) {
        case "sales-book":
          url = `${API}/ai/reports/sales-book?year=${year}&month=${month}`;
          break;
        case "tax-summary":
          url = `${API}/ai/reports/tax-summary?year=${year}&month=${month}`;
          break;
        case "fiscal-summary":
          url = `${API}/ai/fiscal-summary?period=${period}`;
          break;
        case "tax-optimization":
          url = `${API}/ai/tax-optimization`;
          break;
      }

      const res = await fetch(url, { headers });
      if (res.ok) {
        setReportData(await res.json());
      } else {
        const err = await res.json();
        setReportData({ error: err.detail || "Error generando reporte" });
      }
    } catch {
      setReportData({ error: "Error de conexion" });
    }
    setLoading(false);
  };

  const reports = [
    {
      key: "sales-book" as ReportType,
      title: "Libro de Ventas",
      description: "Libro de ventas del periodo con analisis IA del SENIAT",
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      color: "bg-blue-500",
    },
    {
      key: "tax-summary" as ReportType,
      title: "Resumen IVA",
      description: "Resumen para declaracion de IVA con recomendaciones IA",
      icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
      color: "bg-green-500",
    },
    {
      key: "fiscal-summary" as ReportType,
      title: "Resumen Fiscal IA",
      description: "Resumen ejecutivo inteligente del periodo con alertas y recomendaciones",
      icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z",
      color: "bg-purple-500",
    },
    {
      key: "tax-optimization" as ReportType,
      title: "Optimizacion Fiscal",
      description: "Analisis de patrones y sugerencias de optimizacion fiscal (3 meses)",
      icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes Inteligentes</h1>
        <p className="text-sm text-gray-500 mt-0.5">Generacion automatica con analisis de IA</p>
      </div>

      {/* Period selector */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Año:</label>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="border rounded-lg px-3 py-1.5 text-sm">
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Mes:</label>
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="border rounded-lg px-3 py-1.5 text-sm">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2024, i).toLocaleString("es", { month: "long" })}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Periodo IA:</label>
          <select value={period} onChange={e => setPeriod(e.target.value as any)} className="border rounded-lg px-3 py-1.5 text-sm">
            <option value="week">Semana</option>
            <option value="month">Mes</option>
            <option value="year">Año</option>
          </select>
        </div>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {reports.map(r => (
          <button
            key={r.key}
            onClick={() => generateReport(r.key)}
            disabled={loading && activeReport === r.key}
            className={`text-left bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition border-2 ${
              activeReport === r.key ? "border-aida-accent" : "border-transparent"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`${r.color} p-2 rounded-lg`}>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={r.icon} />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{r.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>
              </div>
            </div>
            {loading && activeReport === r.key && (
              <div className="mt-3 flex items-center gap-2 text-xs text-aida-accent">
                <div className="animate-spin w-4 h-4 border-2 border-aida-accent border-t-transparent rounded-full" />
                Generando reporte con IA...
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Report result */}
      {reportData && !loading && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          {reportData.error ? (
            <div className="text-center py-8">
              <p className="text-red-500">{reportData.error}</p>
            </div>
          ) : activeReport === "sales-book" ? (
            <SalesBookView data={reportData} />
          ) : activeReport === "tax-summary" ? (
            <TaxSummaryView data={reportData} />
          ) : activeReport === "fiscal-summary" ? (
            <FiscalSummaryView data={reportData} />
          ) : activeReport === "tax-optimization" ? (
            <TaxOptimizationView data={reportData} />
          ) : null}
        </div>
      )}
    </div>
  );
}

function SalesBookView({ data }: { data: any }) {
  const s = data.summary;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Libro de Ventas - {data.period}</h2>
        <span className="text-xs text-gray-400">Generado: {new Date(data.generated_at).toLocaleString()}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <Stat label="Total facturas" value={s.total_invoices} />
        <Stat label="Activas" value={s.active} />
        <Stat label="Anuladas" value={s.voided} />
        <Stat label="Total general" value={`Bs. ${fmt(s.total_general)}`} highlight />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <Stat label="Base imponible" value={`Bs. ${fmt(s.total_base_imponible)}`} />
        <Stat label="Base exenta" value={`Bs. ${fmt(s.total_base_exenta)}`} />
        <Stat label="IVA 16%" value={`Bs. ${fmt(s.total_iva_16)}`} />
        <Stat label="IVA 8%" value={`Bs. ${fmt(s.total_iva_8)}`} />
      </div>

      {data.entries?.length > 0 && (
        <div className="overflow-auto max-h-60 border rounded-lg">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left">N. Control</th>
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2 text-left">RIF</th>
                <th className="px-3 py-2 text-left">Razon Social</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((e: any, i: number) => (
                <tr key={i} className={`border-t ${e.status === "anulado" ? "bg-red-50 line-through text-gray-400" : ""}`}>
                  <td className="px-3 py-1.5 font-mono">{e.numero_control}</td>
                  <td className="px-3 py-1.5">{e.fecha}</td>
                  <td className="px-3 py-1.5">{e.rif_cliente}</td>
                  <td className="px-3 py-1.5 truncate max-w-[200px]">{e.razon_social}</td>
                  <td className="px-3 py-1.5 text-right">Bs. {fmt(e.total)}</td>
                  <td className="px-3 py-1.5 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-xs ${e.status === "anulado" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.ai_analysis && (
        <AIAnalysisBlock title="Analisis IA del Libro de Ventas" content={data.ai_analysis} />
      )}
    </div>
  );
}

function TaxSummaryView({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Resumen IVA - {data.period}</h2>
        <span className="text-xs text-gray-400">Generado: {new Date(data.generated_at).toLocaleString()}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-600 mb-2">Ventas</h4>
          <Stat label="Cantidad" value={data.ventas.cantidad} />
          <Stat label="Base imponible" value={`Bs. ${fmt(data.ventas.base_imponible)}`} />
          <Stat label="IVA 16%" value={`Bs. ${fmt(data.ventas.iva_16_pct)}`} />
          <Stat label="IVA 8%" value={`Bs. ${fmt(data.ventas.iva_8_pct)}`} />
          <Stat label="Total" value={`Bs. ${fmt(data.ventas.total)}`} highlight />
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="text-sm font-semibold text-red-600 mb-2">Notas de Credito</h4>
          <Stat label="Cantidad" value={data.notas_credito.cantidad} />
          <Stat label="Total" value={`Bs. ${fmt(data.notas_credito.total)}`} />
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="text-sm font-semibold text-orange-600 mb-2">Notas de Debito</h4>
          <Stat label="Cantidad" value={data.notas_debito.cantidad} />
          <Stat label="Total" value={`Bs. ${fmt(data.notas_debito.total)}`} />
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-yellow-800 mb-2">Resumen IVA para Declaracion</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Debito fiscal:</span>
            <p className="font-bold text-lg">Bs. {fmt(data.resumen_iva.debito_fiscal)}</p>
          </div>
          <div>
            <span className="text-gray-600">Credito fiscal:</span>
            <p className="font-bold text-lg">Bs. {fmt(data.resumen_iva.credito_fiscal)}</p>
          </div>
          <div>
            <span className="text-gray-600">IVA a pagar:</span>
            <p className="font-bold text-lg text-red-600">Bs. {fmt(data.resumen_iva.iva_a_pagar)}</p>
          </div>
        </div>
        {data.resumen_iva.nota && (
          <p className="text-xs text-yellow-700 mt-2">{data.resumen_iva.nota}</p>
        )}
      </div>

      {data.ai_recommendations && (
        <AIAnalysisBlock title="Recomendaciones IA" content={data.ai_recommendations} />
      )}
    </div>
  );
}

function FiscalSummaryView({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Resumen Fiscal - {data.period}</h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <Stat label="Facturas" value={data.raw_data.total_invoices} />
        <Stat label="Anuladas" value={data.raw_data.voided} />
        <Stat label="Total" value={`Bs. ${fmt(data.raw_data.total_amount)}`} highlight />
        <Stat label="NC restantes" value={data.raw_data.control_numbers_remaining} />
      </div>

      <AIAnalysisBlock title="Analisis IA del Periodo" content={data.summary} />
    </div>
  );
}

function TaxOptimizationView({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Optimizacion Fiscal</h2>

      {data.monthly_data?.length > 0 && (
        <div className="overflow-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Mes</th>
                <th className="px-4 py-2 text-right">Facturas</th>
                <th className="px-4 py-2 text-right">Total</th>
                <th className="px-4 py-2 text-right">IVA</th>
                <th className="px-4 py-2 text-right">Promedio</th>
              </tr>
            </thead>
            <tbody>
              {data.monthly_data.map((m: any, i: number) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-2">{m.mes}</td>
                  <td className="px-4 py-2 text-right">{m.facturas}</td>
                  <td className="px-4 py-2 text-right">Bs. {fmt(m.total)}</td>
                  <td className="px-4 py-2 text-right">Bs. {fmt(m.iva)}</td>
                  <td className="px-4 py-2 text-right">Bs. {fmt(m.promedio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AIAnalysisBlock title="Sugerencias de Optimizacion" content={data.suggestions} />
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: any; highlight?: boolean }) {
  return (
    <div className="py-1">
      <span className="text-xs text-gray-500">{label}</span>
      <p className={`font-semibold ${highlight ? "text-aida-accent text-lg" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}

function AIAnalysisBlock({ title, content }: { title: string; content: string }) {
  return (
    <div className="bg-gradient-to-br from-aida-accent/5 to-purple-50 rounded-xl p-5 border border-aida-accent/20">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-aida-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
        <h4 className="font-semibold text-gray-800">{title}</h4>
      </div>
      <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
        {content}
      </div>
    </div>
  );
}

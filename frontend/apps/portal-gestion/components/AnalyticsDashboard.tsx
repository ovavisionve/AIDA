"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface KPIs {
  today_invoices: number;
  today_total: number;
  month_invoices: number;
  month_total: number;
  month_avg_invoice: number;
  month_iva_16: number;
  month_iva_8: number;
  month_voided: number;
  prev_month_invoices: number;
  prev_month_total: number;
  month_variation_pct: number;
  void_rate_pct: number;
}

interface Analytics {
  kpis: KPIs;
  daily_trend: { date: string; invoices: number; total: number }[];
  tax_distribution: { base_gravada: number; base_exenta: number; iva_16: number; iva_8: number; pct_gravado: number; pct_exento: number };
  top_customers: { name: string; rif: string; invoices: number; total: number }[];
  payment_distribution: { method: string; count: number; total: number }[];
  hourly_pattern: { hour: number; count: number }[];
  prediction: { predicted_invoices: number; predicted_total: number; confidence: string; trend: string; monthly_avg?: number };
  control_numbers: { used_this_month: number; available: number; daily_rate: number; estimated_days_remaining: number; needs_refill: boolean };
}

const fmt = (n: number) => new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

export default function AnalyticsDashboard({ token }: { token: string }) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [periodDays, setPeriodDays] = useState(90);

  const headers = { Authorization: `Bearer ${token}` };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/ai/analytics?period_days=${periodDays}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch {}
    setLoading(false);
  };

  const loadInsights = async () => {
    setLoadingInsights(true);
    try {
      const res = await fetch(`${API}/ai/insights`, { headers });
      if (res.ok) {
        const data = await res.json();
        setInsights(data.insights);
      }
    } catch {}
    setLoadingInsights(false);
  };

  useEffect(() => { loadAnalytics(); }, [periodDays]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-aida-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!analytics) {
    return <div className="text-center py-20 text-gray-500">No se pudieron cargar los analytics</div>;
  }

  const k = analytics.kpis;
  const maxTrend = Math.max(...analytics.daily_trend.map(d => d.total), 1);
  const maxHourly = Math.max(...analytics.hourly_pattern.map(h => h.count), 1);
  const topCustomerMax = Math.max(...analytics.top_customers.map(c => c.total), 1);

  const trendInfo: Record<string, { label: string; color: string }> = {
    growing: { label: "Creciendo", color: "text-green-400" },
    declining: { label: "Decreciendo", color: "text-red-400" },
    stable: { label: "Estable", color: "text-blue-400" },
    insufficient_data: { label: "Sin datos suficientes", color: "text-gray-500" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics Avanzado</h1>
          <p className="text-sm text-gray-500">KPIs, tendencias y predicciones con IA</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={periodDays}
            onChange={e => setPeriodDays(Number(e.target.value))}
            className="bg-[#0a0f1a] border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-aida-accent"
          >
            <option value={30}>30 dias</option>
            <option value={90}>90 dias</option>
            <option value={180}>6 meses</option>
            <option value={365}>1 año</option>
          </select>
          <button
            onClick={loadInsights}
            disabled={loadingInsights}
            className="bg-aida-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-aida-accent/80 transition disabled:opacity-50"
          >
            {loadingInsights ? "Analizando..." : "Generar Insights IA"}
          </button>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard label="Hoy" value={`Bs. ${fmt(k.today_total)}`} sub={`${k.today_invoices} facturas`} color="bg-blue-500" />
        <KPICard label="Este mes" value={`Bs. ${fmt(k.month_total)}`} sub={`${k.month_invoices} facturas`} color="bg-green-500" />
        <KPICard
          label="vs. Mes anterior"
          value={`${k.month_variation_pct > 0 ? "+" : ""}${k.month_variation_pct}%`}
          sub={`Bs. ${fmt(k.prev_month_total)}`}
          color={k.month_variation_pct >= 0 ? "bg-emerald-500" : "bg-red-500"}
        />
        <KPICard
          label="Promedio factura"
          value={`Bs. ${fmt(k.month_avg_invoice)}`}
          sub={`${k.month_voided} anuladas (${k.void_rate_pct}%)`}
          color="bg-purple-500"
        />
      </div>

      {/* IVA summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">IVA Generado</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">IVA 16%</span>
              <span className="font-semibold text-white">Bs. {fmt(k.month_iva_16)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">IVA 8%</span>
              <span className="font-semibold text-white">Bs. {fmt(k.month_iva_8)}</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-2">
              <span className="text-sm font-medium text-gray-300">Total IVA</span>
              <span className="font-bold text-aida-accent">Bs. {fmt(k.month_iva_16 + k.month_iva_8)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">Distribucion Fiscal</h3>
          <div className="space-y-2">
            <BarItem label="Gravado" pct={analytics.tax_distribution.pct_gravado} color="bg-blue-500" />
            <BarItem label="Exento" pct={analytics.tax_distribution.pct_exento} color="bg-gray-500" />
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Base gravada: Bs. {fmt(analytics.tax_distribution.base_gravada)} |
            Exenta: Bs. {fmt(analytics.tax_distribution.base_exenta)}
          </div>
        </div>

        {/* Control Numbers */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">Numeros de Control</h3>
          <div className="text-3xl font-bold text-white">{analytics.control_numbers.available}</div>
          <p className="text-sm text-gray-500">disponibles</p>
          <div className="mt-3 space-y-1 text-xs text-gray-500">
            <div>Usados este mes: <strong className="text-gray-300">{analytics.control_numbers.used_this_month}</strong></div>
            <div>Ritmo diario: <strong className="text-gray-300">{analytics.control_numbers.daily_rate}</strong>/dia</div>
            <div>
              Estimado:{" "}
              <strong className={analytics.control_numbers.needs_refill ? "text-red-400" : "text-green-400"}>
                {analytics.control_numbers.estimated_days_remaining} dias restantes
              </strong>
            </div>
          </div>
          {analytics.control_numbers.needs_refill && (
            <div className="mt-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-3 py-1.5 text-xs font-medium">
              Solicitar mas NC pronto
            </div>
          )}
        </div>
      </div>

      {/* Prediction */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-sm font-semibold text-gray-500 mb-3">Prediccion Proximo Mes</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Facturas estimadas</p>
            <p className="text-2xl font-bold text-white">{analytics.prediction.predicted_invoices}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Monto estimado</p>
            <p className="text-2xl font-bold text-white">Bs. {fmt(analytics.prediction.predicted_total)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tendencia</p>
            <p className={`text-lg font-semibold ${trendInfo[analytics.prediction.trend]?.color || ""}`}>
              {trendInfo[analytics.prediction.trend]?.label || analytics.prediction.trend}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Confianza</p>
            <p className="text-lg font-semibold capitalize text-white">{analytics.prediction.confidence}</p>
          </div>
        </div>
      </div>

      {/* Daily trend chart */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-sm font-semibold text-gray-500 mb-4">Tendencia Diaria</h3>
        {analytics.daily_trend.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">Sin datos para el periodo seleccionado</p>
        ) : (
          <div className="flex items-end gap-px h-40">
            {analytics.daily_trend.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group relative">
                <div
                  className="w-full bg-aida-accent/70 hover:bg-aida-accent rounded-t transition-all"
                  style={{ height: `${(d.total / maxTrend) * 100}%`, minHeight: d.total > 0 ? "4px" : "0px" }}
                />
                <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                  {d.date}: {d.invoices} fact. / Bs. {fmt(d.total)}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{analytics.daily_trend[0]?.date || ""}</span>
          <span>{analytics.daily_trend[analytics.daily_trend.length - 1]?.date || ""}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top customers */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-sm font-semibold text-gray-500 mb-4">Top Clientes</h3>
          {analytics.top_customers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {analytics.top_customers.slice(0, 7).map((c, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="truncate max-w-[60%] text-gray-300" title={c.name}>
                      <strong className="text-gray-500 mr-1">#{i + 1}</strong>
                      {c.name}
                    </span>
                    <span className="font-medium text-white">Bs. {fmt(c.total)}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div
                      className="bg-aida-accent rounded-full h-1.5 transition-all"
                      style={{ width: `${(c.total / topCustomerMax) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{c.rif} | {c.invoices} facturas</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hourly pattern + Payment */}
        <div className="space-y-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">Patron Horario</h3>
            <div className="flex items-end gap-0.5 h-24">
              {Array.from({ length: 24 }, (_, hour) => {
                const entry = analytics.hourly_pattern.find(h => h.hour === hour);
                const count = entry?.count || 0;
                return (
                  <div key={hour} className="flex-1 flex flex-col items-center group relative">
                    <div
                      className="w-full bg-purple-400/60 hover:bg-purple-500 rounded-t transition-all"
                      style={{ height: `${(count / maxHourly) * 100}%`, minHeight: count > 0 ? "3px" : "0px" }}
                    />
                    <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                      {hour}:00 - {count} docs
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">Formas de Pago</h3>
            {analytics.payment_distribution.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Sin datos</p>
            ) : (
              <div className="space-y-2">
                {analytics.payment_distribution.map((p, i) => {
                  const payTotal = analytics.payment_distribution.reduce((s, x) => s + x.count, 0);
                  const pct = payTotal > 0 ? (p.count / payTotal) * 100 : 0;
                  const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-pink-500"];
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm w-32 truncate capitalize text-gray-300">{p.method}</span>
                      <div className="flex-1 bg-white/10 rounded-full h-2">
                        <div className={`${colors[i % colors.length]} rounded-full h-2`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-16 text-right">{p.count} ({Math.round(pct)}%)</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {insights && (
        <div className="bg-gradient-to-br from-aida-accent/10 to-purple-900/20 rounded-xl border border-aida-accent/20 p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-aida-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            <h3 className="font-semibold text-white">Insights IA</h3>
          </div>
          <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
            {insights}
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  );
}

function BarItem({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="font-medium text-gray-300">{pct}%</span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-2">
        <div className={`${color} rounded-full h-2 transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

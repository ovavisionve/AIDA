"use client";

import { useState, useMemo } from "react";

export default function SavingsCalculator() {
  const [docsPerMonth, setDocsPerMonth] = useState(5000);
  const [costPerDoc, setCostPerDoc] = useState(0.35);
  const [employeesInvolved, setEmployeesInvolved] = useState(3);

  const results = useMemo(() => {
    // Current traditional costs
    const currentMonthlyCost = docsPerMonth * costPerDoc;
    const currentAnnualCost = currentMonthlyCost * 12;

    // AIDA cost based on volume tiers
    let aidaCostPerDoc: number;
    if (docsPerMonth <= 500) aidaCostPerDoc = 0.058; // Plan Básico: $29/500
    else if (docsPerMonth <= 2000) aidaCostPerDoc = 0.04; // Plan Profesional: ~$79/2000
    else if (docsPerMonth <= 10000) aidaCostPerDoc = 0.015; // Plan Empresarial
    else aidaCostPerDoc = 0.008; // Plan Corporativo (volumen)

    const aidaMonthlyCost = docsPerMonth * aidaCostPerDoc;
    const aidaAnnualCost = aidaMonthlyCost * 12;

    // Savings
    const monthlySavings = currentMonthlyCost - aidaMonthlyCost;
    const annualSavings = currentAnnualCost - aidaAnnualCost;
    const savingsPercent = currentMonthlyCost > 0 ? Math.round((monthlySavings / currentMonthlyCost) * 100) : 0;

    // Time savings: traditional = ~3 min per document batch of 10, AIDA = instant
    const traditionalMinutesPerMonth = (docsPerMonth / 10) * 3 * employeesInvolved * 0.3;
    const hoursRecoveredPerMonth = Math.round(traditionalMinutesPerMonth / 60);
    const hoursRecoveredPerYear = hoursRecoveredPerMonth * 12;

    return {
      currentMonthlyCost,
      currentAnnualCost,
      aidaMonthlyCost,
      aidaAnnualCost,
      monthlySavings,
      annualSavings,
      savingsPercent,
      hoursRecoveredPerMonth,
      hoursRecoveredPerYear,
    };
  }, [docsPerMonth, costPerDoc, employeesInvolved]);

  const formatUSD = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <section id="calculadora" className="py-24 sm:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-aida-accent/5 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-aida-cyan">
            Calculadora de Ahorro
          </h2>
          <p className="mt-3 text-3xl sm:text-4xl font-bold">
            Descubre cuánto puedes{" "}
            <span className="gradient-text">ahorrar con AIDA</span>
          </p>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
            Ajusta los valores según tu operación actual y ve en tiempo real
            cuánto dinero y tiempo recuperas al migrar a la imprenta digital con IA.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 max-w-6xl mx-auto">
          {/* Sliders Panel */}
          <div className="glass-card p-8 space-y-8">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-aida-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Tu operación actual
            </h3>

            {/* Documents per month */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm text-slate-300">Documentos fiscales por mes</label>
                <span className="text-lg font-bold text-aida-cyan">
                  {docsPerMonth.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={100}
                max={50000}
                step={100}
                value={docsPerMonth}
                onChange={(e) => setDocsPerMonth(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 accent-aida-cyan [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-aida-accent [&::-webkit-slider-thumb]:to-aida-cyan [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-aida-accent/30"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>100</span>
                <span>10,000</span>
                <span>25,000</span>
                <span>50,000</span>
              </div>
            </div>

            {/* Cost per document */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm text-slate-300">Costo actual por documento (USD)</label>
                <span className="text-lg font-bold text-aida-cyan">
                  ${costPerDoc.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={0.05}
                max={1.0}
                step={0.05}
                value={costPerDoc}
                onChange={(e) => setCostPerDoc(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 accent-aida-cyan [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-aida-accent [&::-webkit-slider-thumb]:to-aida-cyan [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-aida-accent/30"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>$0.05</span>
                <span>$0.25</span>
                <span>$0.50</span>
                <span>$1.00</span>
              </div>
            </div>

            {/* Employees involved */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm text-slate-300">Personas involucradas en facturación</label>
                <span className="text-lg font-bold text-aida-cyan">
                  {employeesInvolved}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                step={1}
                value={employeesInvolved}
                onChange={(e) => setEmployeesInvolved(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 accent-aida-cyan [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-aida-accent [&::-webkit-slider-thumb]:to-aida-cyan [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-aida-accent/30"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>1</span>
                <span>5</span>
                <span>10</span>
                <span>20</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <p className="text-xs text-slate-500">
                * Cálculo basado en eficiencia conservadora del 85%. Los ahorros reales pueden ser mayores
                dependiendo de la complejidad de tu operación actual.
              </p>
            </div>
          </div>

          {/* Results Panel */}
          <div className="space-y-4">
            {/* Main savings card */}
            <div className="glass-card p-8 glow-blue relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-aida-accent/10 rounded-full blur-[60px] pointer-events-none" />
              <div className="relative">
                <div className="text-sm text-slate-400 uppercase tracking-wider">Ahorro mensual estimado</div>
                <div className="mt-2 text-5xl sm:text-6xl font-black gradient-text">
                  {formatUSD(results.monthlySavings)}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-semibold">
                    -{results.savingsPercent}% vs actual
                  </span>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-5">
                <div className="text-xs text-slate-500 uppercase tracking-wider">Ahorro anual</div>
                <div className="mt-1 text-2xl font-bold text-white">{formatUSD(results.annualSavings)}</div>
              </div>
              <div className="glass-card p-5">
                <div className="text-xs text-slate-500 uppercase tracking-wider">Horas recuperadas/año</div>
                <div className="mt-1 text-2xl font-bold text-white">{results.hoursRecoveredPerYear.toLocaleString()}</div>
              </div>
              <div className="glass-card p-5">
                <div className="text-xs text-slate-500 uppercase tracking-wider">Costo actual/mes</div>
                <div className="mt-1 text-2xl font-bold text-red-400">{formatUSD(results.currentMonthlyCost)}</div>
              </div>
              <div className="glass-card p-5">
                <div className="text-xs text-slate-500 uppercase tracking-wider">Costo AIDA/mes</div>
                <div className="mt-1 text-2xl font-bold text-green-400">{formatUSD(results.aidaMonthlyCost)}</div>
              </div>
            </div>

            {/* Example scenario */}
            <div className="glass-card p-6 border-aida-cyan/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aida-accent/20 to-aida-cyan/20 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-aida-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Ejemplo con 20,000 documentos/mes</div>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                    Una empresa que emite 20,000 números de control al mes y paga $0.35 por documento
                    con una imprenta tradicional gasta <span className="text-red-400 font-semibold">$7,000/mes</span>.
                    Con AIDA pagaría apenas <span className="text-green-400 font-semibold">$300/mes</span>,
                    ahorrando <span className="text-aida-cyan font-bold">$6,700 mensuales</span> y <span className="text-aida-cyan font-bold">$80,400 al año</span>.
                  </p>
                </div>
              </div>
            </div>

            <a
              href="#contacto"
              className="block w-full text-center py-3.5 rounded-xl bg-gradient-to-r from-aida-accent to-aida-cyan text-base font-bold text-white shadow-lg shadow-aida-accent/25 hover:shadow-xl hover:shadow-aida-accent/30 hover:scale-[1.01] transition-all"
            >
              Quiero ahorrar con AIDA
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

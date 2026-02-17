"use client";

import { useState } from "react";
import Link from "next/link";

/* ── Consolidated audit data across all companies ── */
const allAuditEntries = [
  { fecha: "17/02/2026 09:15", accion: "Emisión de factura", rif: "J-12345678-9", empresa: "Distribuidora Oriental C.A.", detalle: "Factura 00-045821 emitida correctamente. Número de control válido.", tipo: "emision", severidad: "normal" },
  { fecha: "17/02/2026 10:00", accion: "Retención IVA procesada", rif: "J-29876543-7", empresa: "Importadora del Caribe C.A.", detalle: "Comprobante 00-009812. Retención al 75% sobre factura de proveedor.", tipo: "retencion", severidad: "normal" },
  { fecha: "17/02/2026 08:30", accion: "Emisión factura alto monto", rif: "J-29876543-7", empresa: "Importadora del Caribe C.A.", detalle: "Factura 00-078910 por Bs. 125,000.00. Verificación IA: aprobada.", tipo: "emision", severidad: "alto_monto" },
  { fecha: "16/02/2026 15:00", accion: "Retención ISLR procesada", rif: "J-41567890-2", empresa: "Servicios Industriales del Sur C.A.", detalle: "Comprobante 00-002103 emitido correctamente.", tipo: "retencion", severidad: "normal" },
  { fecha: "16/02/2026 14:30", accion: "Retención IVA procesada", rif: "J-12345678-9", empresa: "Distribuidora Oriental C.A.", detalle: "Comprobante de retención IVA 00-009810 generado al 75%.", tipo: "retencion", severidad: "normal" },
  { fecha: "16/02/2026 11:00", accion: "Emisión de factura", rif: "J-40987654-3", empresa: "Inversiones Maracay 2020 C.A.", detalle: "Factura 00-012470 emitida. Monto alto verificado.", tipo: "emision", severidad: "normal" },
  { fecha: "16/02/2026 10:20", accion: "Emisión de factura", rif: "J-12345678-9", empresa: "Distribuidora Oriental C.A.", detalle: "Factura 00-045820 emitida correctamente. Monto alto verificado por IA.", tipo: "emision", severidad: "normal" },
  { fecha: "16/02/2026 09:00", accion: "Emisión de factura", rif: "J-41567890-2", empresa: "Servicios Industriales del Sur C.A.", detalle: "Factura 00-021340 emitida. Cliente industrial verificado.", tipo: "emision", severidad: "normal" },
  { fecha: "15/02/2026 16:45", accion: "Nota de crédito emitida", rif: "J-12345678-9", empresa: "Distribuidora Oriental C.A.", detalle: "NC 00-003449 vinculada a factura 00-045800. Monto dentro del rango permitido.", tipo: "emision", severidad: "normal" },
  { fecha: "15/02/2026 14:00", accion: "Alerta: Nota de débito en revisión", rif: "J-30112233-0", empresa: "Tecnología y Redes del Centro C.A.", detalle: "ND 00-001234 marcada para revisión. Monto de intereses requiere verificación.", tipo: "alerta", severidad: "alerta" },
  { fecha: "15/02/2026 10:00", accion: "Emisión factura institucional", rif: "G-20000001-0", empresa: "Alcaldía del Municipio Libertador", detalle: "Factura 00-089001 emitida por servicio de obra pública.", tipo: "emision", severidad: "normal" },
  { fecha: "15/02/2026 09:30", accion: "Emisión de factura", rif: "J-40987654-3", empresa: "Inversiones Maracay 2020 C.A.", detalle: "Factura 00-012469 emitida correctamente.", tipo: "emision", severidad: "normal" },
  { fecha: "15/02/2026 09:00", accion: "Emisión de factura", rif: "J-12345678-9", empresa: "Distribuidora Oriental C.A.", detalle: "Factura 00-045819 emitida. Monto Bs. 15,400.00 verificado por IA.", tipo: "emision", severidad: "normal" },
  { fecha: "15/02/2026 07:00", accion: "Guía de despacho emitida", rif: "J-50234567-1", empresa: "Agropecuaria Los Llanos S.A.", detalle: "GD 00-000892 para traslado de mercancía a Aragua.", tipo: "emision", severidad: "normal" },
  { fecha: "14/02/2026 11:00", accion: "Retención ISLR procesada", rif: "J-12345678-9", empresa: "Distribuidora Oriental C.A.", detalle: "Comprobante ISLR 00-002100. Porcentaje aplicado según tabla de actividades.", tipo: "retencion", severidad: "normal" },
  { fecha: "12/02/2026 08:00", accion: "Alerta: Homologación pendiente", rif: "J-30112233-0", empresa: "Tecnología y Redes del Centro C.A.", detalle: "Providencia 121 no cumplida. Sistema pendiente de homologación ante SENIAT.", tipo: "alerta", severidad: "alerta" },
  { fecha: "10/02/2026 08:00", accion: "Verificación de cumplimiento", rif: "J-12345678-9", empresa: "Distribuidora Oriental C.A.", detalle: "Auditoría automática: Providencia 102 ✓, Providencia 121 ✓. Sin observaciones.", tipo: "verificacion", severidad: "normal" },
  { fecha: "10/02/2026 08:00", accion: "Alerta: Inactividad detectada", rif: "V-18765432-5", empresa: "Carlos Mendoza (Persona Natural)", detalle: "Sin emisión de documentos en los últimos 20 días. Última factura: 28/01/2026.", tipo: "alerta", severidad: "alerta" },
  { fecha: "09/02/2026 14:10", accion: "Alerta: Factura anulada", rif: "J-12345678-9", empresa: "Distribuidora Oriental C.A.", detalle: "Factura 00-045816 anulada. Motivo: error en datos del receptor.", tipo: "alerta", severidad: "alerta" },
  { fecha: "05/02/2026 08:00", accion: "Alerta: Homologación pendiente", rif: "V-18765432-5", empresa: "Carlos Mendoza (Persona Natural)", detalle: "Sistema no homologado bajo Providencia 121. Riesgo de sanciones.", tipo: "alerta", severidad: "alerta" },
  { fecha: "01/02/2026 08:00", accion: "Verificación mensual", rif: "J-29876543-7", empresa: "Importadora del Caribe C.A.", detalle: "Auditoría automática: cumplimiento total. Sin observaciones.", tipo: "verificacion", severidad: "normal" },
  { fecha: "01/02/2026 08:00", accion: "Verificación mensual", rif: "J-40987654-3", empresa: "Inversiones Maracay 2020 C.A.", detalle: "Auditoría automática: todo en cumplimiento.", tipo: "verificacion", severidad: "normal" },
  { fecha: "01/02/2026 08:00", accion: "Verificación mensual", rif: "G-20000001-0", empresa: "Alcaldía del Municipio Libertador", detalle: "Entidad gubernamental en cumplimiento total.", tipo: "verificacion", severidad: "normal" },
];

const tipoColors: Record<string, string> = {
  emision: "bg-aida-cyan/10 text-aida-cyan border-aida-cyan/20",
  retencion: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  alerta: "bg-red-500/10 text-red-400 border-red-500/20",
  verificacion: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const tipoLabels: Record<string, string> = {
  emision: "Emisión",
  retencion: "Retención",
  alerta: "Alerta",
  verificacion: "Verificación",
};

export default function AuditoriaPage() {
  const [filterTipo, setFilterTipo] = useState("");
  const [filterEmpresa, setFilterEmpresa] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  const empresas = Array.from(new Set(allAuditEntries.map((e) => e.empresa)));

  const filtered = allAuditEntries.filter((entry) => {
    if (filterTipo && entry.tipo !== filterTipo) return false;
    if (filterEmpresa && entry.empresa !== filterEmpresa) return false;
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      if (!entry.accion.toLowerCase().includes(q) && !entry.detalle.toLowerCase().includes(q) && !entry.rif.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const alertCount = allAuditEntries.filter((e) => e.tipo === "alerta").length;
  const emisionCount = allAuditEntries.filter((e) => e.tipo === "emision").length;
  const retencionCount = allAuditEntries.filter((e) => e.tipo === "retencion").length;
  const verificacionCount = allAuditEntries.filter((e) => e.tipo === "verificacion").length;

  const hasFilters = filterTipo || filterEmpresa || filterSearch;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Centro de Auditoría</h1>
          <p className="text-sm text-gray-400 mt-1">Trazabilidad completa de todas las operaciones fiscales</p>
        </div>
        <button
          onClick={() => alert("Exportando log de auditoría completo (demo)")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-aida-accent/10 to-aida-cyan/10 text-aida-cyan border border-aida-cyan/20 hover:border-aida-cyan/40 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exportar Log
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Eventos", value: allAuditEntries.length, icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", color: "from-aida-accent to-aida-cyan" },
          { label: "Emisiones", value: emisionCount, icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", color: "from-cyan-500 to-blue-500" },
          { label: "Retenciones", value: retencionCount, icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z", color: "from-purple-500 to-indigo-500" },
          { label: "Alertas Activas", value: alertCount, icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", color: "from-red-500 to-amber-500" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-10 flex items-center justify-center`}>
                <svg className="w-5 h-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={stat.icon} />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-white">Filtros</p>
          {hasFilters && (
            <button onClick={() => { setFilterTipo(""); setFilterEmpresa(""); setFilterSearch(""); }} className="text-xs text-aida-cyan hover:underline">
              Limpiar
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar en acciones, detalle, RIF..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder-gray-500 focus:border-aida-cyan/50 focus:outline-none"
            />
          </div>
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:border-aida-cyan/50 focus:outline-none appearance-none cursor-pointer"
          >
            <option value="" className="bg-gray-900">Todos los tipos</option>
            <option value="emision" className="bg-gray-900">Emisiones</option>
            <option value="retencion" className="bg-gray-900">Retenciones</option>
            <option value="alerta" className="bg-gray-900">Alertas</option>
            <option value="verificacion" className="bg-gray-900">Verificaciones</option>
          </select>
          <select
            value={filterEmpresa}
            onChange={(e) => setFilterEmpresa(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:border-aida-cyan/50 focus:outline-none appearance-none cursor-pointer"
          >
            <option value="" className="bg-gray-900">Todas las empresas</option>
            {empresas.map((e) => (
              <option key={e} value={e} className="bg-gray-900">{e}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h2 className="text-sm font-bold text-white">Log de Auditoría</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {hasFilters ? `${filtered.length} de ${allAuditEntries.length} eventos` : `${allAuditEntries.length} eventos registrados`}
          </p>
        </div>
        <div className="divide-y divide-white/5">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">No se encontraron eventos con los filtros aplicados</div>
          ) : (
            filtered.map((entry, i) => (
              <div key={i} className="flex items-start gap-4 p-4 hover:bg-white/[0.02] transition-colors">
                {/* Severity indicator */}
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${entry.tipo === "alerta" ? "bg-red-400" : entry.tipo === "verificacion" ? "bg-emerald-400" : "bg-aida-cyan"}`} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-semibold text-white">{entry.accion}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${tipoColors[entry.tipo]}`}>
                      {tipoLabels[entry.tipo]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{entry.detalle}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <Link
                      href={`/portal-seniat/dashboard/cliente/${encodeURIComponent(entry.rif)}`}
                      className="text-[10px] text-aida-cyan hover:underline font-mono"
                    >
                      {entry.rif}
                    </Link>
                    <span className="text-[10px] text-gray-500">{entry.empresa}</span>
                  </div>
                </div>

                {/* Timestamp */}
                <span className="text-[10px] text-gray-500 font-mono shrink-0 hidden sm:block">{entry.fecha}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <p className="text-[10px] text-gray-600 text-center pb-4">
        Datos de demostración — Ambiente de pruebas AIDA
      </p>
    </div>
  );
}

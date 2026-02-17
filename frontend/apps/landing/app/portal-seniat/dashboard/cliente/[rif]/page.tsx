"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

/* ── Mock data de empresas (mismo dataset que el dashboard) ── */
const mockDB: Record<
  string,
  {
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
    documentos: {
      tipo: string;
      numero: string;
      fecha: string;
      monto: string;
      receptor: string;
      status: string;
    }[];
    auditoria: {
      fecha: string;
      accion: string;
      detalle: string;
    }[];
  }
> = {
  "J-12345678-9": {
    rif: "J-12345678-9",
    nombre: "Distribuidora Oriental C.A.",
    estado: "Carabobo",
    ciudad: "Valencia",
    direccion: "Av. Bolívar Norte, Torre Empresarial, Piso 8, Oficina 8-B",
    telefono: "+58 241-1234567",
    email: "fiscal@distribuidoraoriental.com.ve",
    actividadEconomica: "Distribución y comercialización de productos de consumo masivo",
    plan: "Empresarial",
    fechaRegistro: "15/03/2025",
    status: "cumple",
    homologado: true,
    prov102: true,
    prov121: true,
    numerosControlAsignados: 10000,
    numerosControlUsados: 4823,
    documentos: [
      { tipo: "Factura", numero: "00-045821", fecha: "17/02/2026", monto: "Bs. 2,340.50", receptor: "Comercial Los Andes C.A. (J-98765432-1)", status: "valido" },
      { tipo: "Factura", numero: "00-045820", fecha: "16/02/2026", monto: "Bs. 8,920.00", receptor: "Supermercados Unidos S.A. (J-11223344-5)", status: "valido" },
      { tipo: "Ret. IVA", numero: "00-009810", fecha: "16/02/2026", monto: "Bs. 1,338.00", receptor: "Agente de retención: Distribuidora Oriental C.A.", status: "valido" },
      { tipo: "Nota Crédito", numero: "00-003449", fecha: "15/02/2026", monto: "Bs. 456.80", receptor: "Comercial Los Andes C.A. (J-98765432-1)", status: "valido" },
      { tipo: "Factura", numero: "00-045819", fecha: "15/02/2026", monto: "Bs. 15,400.00", receptor: "Grupo Industrial Delta C.A. (J-55667788-0)", status: "valido" },
      { tipo: "Ret. ISLR", numero: "00-002100", fecha: "14/02/2026", monto: "Bs. 2,310.00", receptor: "Retención a proveedor: Transportes Rápido C.A.", status: "valido" },
      { tipo: "Guía Despacho", numero: "00-000890", fecha: "14/02/2026", monto: "—", receptor: "Destino: Barquisimeto, Lara", status: "valido" },
      { tipo: "Factura", numero: "00-045818", fecha: "13/02/2026", monto: "Bs. 3,200.75", receptor: "Farmacia Popular S.R.L. (J-33445566-9)", status: "valido" },
    ],
    auditoria: [
      { fecha: "17/02/2026 09:15", accion: "Emisión de factura", detalle: "Factura 00-045821 emitida correctamente. Número de control válido." },
      { fecha: "16/02/2026 14:30", accion: "Retención IVA procesada", detalle: "Comprobante de retención IVA 00-009810 generado al 75%." },
      { fecha: "16/02/2026 10:20", accion: "Emisión de factura", detalle: "Factura 00-045820 emitida correctamente. Monto alto verificado por IA." },
      { fecha: "15/02/2026 16:45", accion: "Nota de crédito emitida", detalle: "NC 00-003449 vinculada a factura 00-045800. Monto dentro del rango permitido." },
      { fecha: "14/02/2026 11:00", accion: "Retención ISLR procesada", detalle: "Comprobante ISLR 00-002100. Porcentaje aplicado según tabla de actividades." },
      { fecha: "10/02/2026 08:00", accion: "Verificación de cumplimiento", detalle: "Auditoría automática: Providencia 102 ✓, Providencia 121 ✓. Sin observaciones." },
    ],
  },
  "J-40987654-3": {
    rif: "J-40987654-3",
    nombre: "Inversiones Maracay 2020 C.A.",
    estado: "Aragua",
    ciudad: "Maracay",
    direccion: "Centro Comercial Las Américas, Local 45, Planta Baja",
    telefono: "+58 243-9876543",
    email: "administracion@inversionesmaracay.com.ve",
    actividadEconomica: "Importación y venta de equipos electrónicos",
    plan: "Profesional",
    fechaRegistro: "22/06/2025",
    status: "cumple",
    homologado: true,
    prov102: true,
    prov121: true,
    numerosControlAsignados: 2000,
    numerosControlUsados: 1247,
    documentos: [
      { tipo: "Factura", numero: "00-012470", fecha: "16/02/2026", monto: "Bs. 45,800.00", receptor: "Corporación Electrónica Nacional C.A. (J-22334455-6)", status: "valido" },
      { tipo: "Factura", numero: "00-012469", fecha: "15/02/2026", monto: "Bs. 12,350.00", receptor: "TecnoShop Express S.R.L. (J-44556677-8)", status: "valido" },
      { tipo: "Nota Débito", numero: "00-001230", fecha: "14/02/2026", monto: "Bs. 670.25", receptor: "Ajuste por diferencia cambiaria", status: "valido" },
    ],
    auditoria: [
      { fecha: "16/02/2026 11:00", accion: "Emisión de factura", detalle: "Factura 00-012470 emitida. Monto alto verificado." },
      { fecha: "15/02/2026 09:30", accion: "Emisión de factura", detalle: "Factura 00-012469 emitida correctamente." },
      { fecha: "01/02/2026 08:00", accion: "Verificación mensual", detalle: "Auditoría automática: todo en cumplimiento." },
    ],
  },
  "J-30112233-0": {
    rif: "J-30112233-0",
    nombre: "Tecnología y Redes del Centro C.A.",
    estado: "Distrito Capital",
    ciudad: "Caracas",
    direccion: "Av. Francisco de Miranda, Centro Lido, Torre D, Piso 12",
    telefono: "+58 212-5551234",
    email: "contabilidad@tecyredes.com.ve",
    actividadEconomica: "Servicios de tecnología, redes y telecomunicaciones",
    plan: "Profesional",
    fechaRegistro: "10/09/2025",
    status: "revision",
    homologado: true,
    prov102: true,
    prov121: false,
    numerosControlAsignados: 2000,
    numerosControlUsados: 892,
    documentos: [
      { tipo: "Factura", numero: "00-008920", fecha: "15/02/2026", monto: "Bs. 28,500.00", receptor: "Banco del Tesoro (G-20001234-0)", status: "valido" },
      { tipo: "Nota Débito", numero: "00-001234", fecha: "15/02/2026", monto: "Bs. 670.25", receptor: "Ajuste por intereses de mora", status: "revision" },
    ],
    auditoria: [
      { fecha: "15/02/2026 14:00", accion: "Alerta: Nota de débito en revisión", detalle: "ND 00-001234 marcada para revisión. Monto de intereses requiere verificación." },
      { fecha: "12/02/2026 08:00", accion: "Alerta: Homologación pendiente", detalle: "Providencia 121 no cumplida. Sistema pendiente de homologación ante SENIAT." },
    ],
  },
  "V-18765432-5": {
    rif: "V-18765432-5",
    nombre: "Carlos Mendoza (Persona Natural)",
    estado: "Zulia",
    ciudad: "Maracaibo",
    direccion: "Av. 5 de Julio, Sector Tierra Negra, Edif. Don Carlos, PB",
    telefono: "+58 261-7654321",
    email: "carlos.mendoza@gmail.com",
    actividadEconomica: "Servicios profesionales de consultoría empresarial",
    plan: "Básico",
    fechaRegistro: "05/01/2026",
    status: "alerta",
    homologado: false,
    prov102: true,
    prov121: false,
    numerosControlAsignados: 500,
    numerosControlUsados: 56,
    documentos: [
      { tipo: "Factura", numero: "00-000056", fecha: "28/01/2026", monto: "Bs. 4,500.00", receptor: "Constructora Lago Azul C.A. (J-88990011-2)", status: "valido" },
      { tipo: "Factura", numero: "00-000055", fecha: "20/01/2026", monto: "Bs. 3,200.00", receptor: "Ingeniería Moderna C.A. (J-77889900-3)", status: "valido" },
    ],
    auditoria: [
      { fecha: "10/02/2026 08:00", accion: "Alerta: Inactividad detectada", detalle: "Sin emisión de documentos en los últimos 20 días. Última factura: 28/01/2026." },
      { fecha: "05/02/2026 08:00", accion: "Alerta: Homologación pendiente", detalle: "Sistema no homologado bajo Providencia 121. Riesgo de sanciones." },
    ],
  },
  "J-29876543-7": {
    rif: "J-29876543-7",
    nombre: "Importadora del Caribe C.A.",
    estado: "Nueva Esparta",
    ciudad: "Porlamar",
    direccion: "Zona Franca de Margarita, Galpón 12-B",
    telefono: "+58 295-2631234",
    email: "fiscal@importadoradelcaribe.com.ve",
    actividadEconomica: "Importación y distribución de mercancía general",
    plan: "Empresarial",
    fechaRegistro: "01/01/2025",
    status: "cumple",
    homologado: true,
    prov102: true,
    prov121: true,
    numerosControlAsignados: 50000,
    numerosControlUsados: 7891,
    documentos: [
      { tipo: "Ret. IVA", numero: "00-009812", fecha: "17/02/2026", monto: "Bs. 1,872.00", receptor: "Retención a: Naviera del Sur C.A. (J-66778899-4)", status: "valido" },
      { tipo: "Factura", numero: "00-078910", fecha: "17/02/2026", monto: "Bs. 125,000.00", receptor: "Cadena de Tiendas Popular C.A. (J-99001122-5)", status: "valido" },
      { tipo: "Factura", numero: "00-078909", fecha: "16/02/2026", monto: "Bs. 89,500.00", receptor: "Supermercados Isla C.A. (J-11002233-6)", status: "valido" },
    ],
    auditoria: [
      { fecha: "17/02/2026 10:00", accion: "Retención IVA procesada", detalle: "Comprobante 00-009812. Retención al 75% sobre factura de proveedor." },
      { fecha: "17/02/2026 08:30", accion: "Emisión de factura de alto monto", detalle: "Factura 00-078910 por Bs. 125,000.00. Verificación IA: aprobada." },
      { fecha: "01/02/2026 08:00", accion: "Verificación mensual", detalle: "Auditoría automática: cumplimiento total. Sin observaciones." },
    ],
  },
  "J-41567890-2": {
    rif: "J-41567890-2",
    nombre: "Servicios Industriales del Sur C.A.",
    estado: "Bolívar",
    ciudad: "Ciudad Guayana",
    direccion: "Zona Industrial Matanzas, Calle 3, Galpón 7",
    telefono: "+58 286-9112345",
    email: "admin@servindsur.com.ve",
    actividadEconomica: "Servicios industriales, mantenimiento y suministros",
    plan: "Profesional",
    fechaRegistro: "18/07/2025",
    status: "cumple",
    homologado: true,
    prov102: true,
    prov121: true,
    numerosControlAsignados: 2000,
    numerosControlUsados: 2134,
    documentos: [
      { tipo: "Ret. ISLR", numero: "00-002103", fecha: "16/02/2026", monto: "Bs. 3,100.75", receptor: "Retención a: Suministros CVG C.A. (J-12340000-1)", status: "valido" },
      { tipo: "Factura", numero: "00-021340", fecha: "16/02/2026", monto: "Bs. 67,800.00", receptor: "SIDOR C.A. (J-00000001-0)", status: "valido" },
    ],
    auditoria: [
      { fecha: "16/02/2026 15:00", accion: "Retención ISLR procesada", detalle: "Comprobante 00-002103 emitido correctamente." },
      { fecha: "16/02/2026 09:00", accion: "Emisión de factura", detalle: "Factura 00-021340 emitida. Cliente industrial verificado." },
    ],
  },
  "J-50234567-1": {
    rif: "J-50234567-1",
    nombre: "Agropecuaria Los Llanos S.A.",
    estado: "Barinas",
    ciudad: "Barinas",
    direccion: "Carretera Nacional vía Torunos, Km 12, Finca Los Llanos",
    telefono: "+58 273-5321234",
    email: "contabilidad@agrollanos.com.ve",
    actividadEconomica: "Producción agropecuaria y comercialización de ganado",
    plan: "Básico",
    fechaRegistro: "20/11/2025",
    status: "cumple",
    homologado: true,
    prov102: true,
    prov121: true,
    numerosControlAsignados: 500,
    numerosControlUsados: 341,
    documentos: [
      { tipo: "Guía Despacho", numero: "00-000892", fecha: "15/02/2026", monto: "—", receptor: "Destino: Frigorífico Central, Maracay", status: "valido" },
      { tipo: "Factura", numero: "00-003410", fecha: "15/02/2026", monto: "Bs. 180,000.00", receptor: "Frigorífico Central C.A. (J-10203040-5)", status: "valido" },
    ],
    auditoria: [
      { fecha: "15/02/2026 07:00", accion: "Guía de despacho emitida", detalle: "GD 00-000892 para traslado de mercancía a Aragua." },
      { fecha: "15/02/2026 07:05", accion: "Factura emitida", detalle: "Factura 00-003410 asociada a guía de despacho." },
    ],
  },
  "G-20000001-0": {
    rif: "G-20000001-0",
    nombre: "Alcaldía del Municipio Libertador",
    estado: "Distrito Capital",
    ciudad: "Caracas",
    direccion: "Esquina de Municipal, Edificio Sede Alcaldía, Piso 3",
    telefono: "+58 212-8621234",
    email: "recaudacion@alcaldialibertador.gob.ve",
    actividadEconomica: "Administración pública municipal — recaudación de impuestos",
    plan: "Empresarial",
    fechaRegistro: "01/06/2025",
    status: "cumple",
    homologado: true,
    prov102: true,
    prov121: true,
    numerosControlAsignados: 50000,
    numerosControlUsados: 12340,
    documentos: [
      { tipo: "Factura", numero: "00-089001", fecha: "15/02/2026", monto: "Bs. 45,000.00", receptor: "Consorcio Vial Caracas C.A. (J-55443322-1)", status: "valido" },
      { tipo: "Factura", numero: "00-089000", fecha: "14/02/2026", monto: "Bs. 32,500.00", receptor: "Constructora Capital S.A. (J-66554433-2)", status: "valido" },
    ],
    auditoria: [
      { fecha: "15/02/2026 10:00", accion: "Emisión de factura institucional", detalle: "Factura 00-089001 emitida por servicio de obra pública." },
      { fecha: "01/02/2026 08:00", accion: "Verificación mensual", detalle: "Entidad gubernamental en cumplimiento total." },
    ],
  },
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; classes: string }> = {
    cumple: { label: "Cumple", classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    revision: { label: "En revisión", classes: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    alerta: { label: "Alerta", classes: "bg-red-500/10 text-red-400 border-red-500/20" },
    valido: { label: "Válido", classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
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
    <div
      className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${
        ok
          ? "bg-emerald-500/5 border-emerald-500/20"
          : "bg-red-500/5 border-red-500/20"
      }`}
    >
      {ok ? (
        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      <div>
        <p className={`text-sm font-semibold ${ok ? "text-emerald-400" : "text-red-400"}`}>
          {label}
        </p>
        <p className="text-[10px] text-gray-500">{ok ? "Cumple" : "No cumple"}</p>
      </div>
    </div>
  );
}

export default function ClienteDetallePage() {
  const params = useParams();
  const router = useRouter();
  const rifParam = decodeURIComponent(params.rif as string);

  const empresa = mockDB[rifParam];

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link
          href="/portal-seniat/dashboard"
          className="hover:text-aida-cyan transition-colors"
        >
          Panel General
        </Link>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-400">Contribuyente</span>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
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
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-aida-accent/10 text-aida-cyan border border-aida-accent/20">
              Plan {empresa.plan}
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 bg-white/5 border border-white/10">
              Desde {empresa.fechaRegistro}
            </span>
          </div>
        </div>

        {/* Info grid */}
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
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="3"
                strokeDasharray={`${usagePercent}, 100`}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">
              {usagePercent}%
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Números de Control</p>
            <p className="text-[10px] text-gray-500">
              {empresa.numerosControlUsados.toLocaleString()} / {empresa.numerosControlAsignados.toLocaleString()} usados
            </p>
          </div>
        </div>
      </div>

      {/* Documents table */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h2 className="text-sm font-bold text-white">Documentos Fiscales Emitidos</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Historial de documentos emitidos por este contribuyente
          </p>
        </div>
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
              </tr>
            </thead>
            <tbody>
              {empresa.documentos.map((doc, i) => (
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
                  <td className="py-3 px-5 text-center">
                    <StatusBadge status={doc.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit trail */}
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
              {/* Timeline dot */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-2.5 h-2.5 rounded-full mt-1.5 ${
                    entry.accion.toLowerCase().includes("alerta")
                      ? "bg-amber-400"
                      : "bg-aida-cyan"
                  }`}
                />
                {i < empresa.auditoria.length - 1 && (
                  <div className="w-px flex-1 bg-white/5 mt-1" />
                )}
              </div>

              {/* Content */}
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
          Datos de demostración — Ambiente de pruebas AIDA
        </p>
      </div>
    </div>
  );
}

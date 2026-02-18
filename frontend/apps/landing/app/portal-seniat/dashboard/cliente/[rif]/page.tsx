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

/* ── Mock DB ── */
const mockDB: Record<string, Empresa> = {
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
      { tipo: "Factura", numero: "00-045821", fecha: "17/02/2026", monto: "Bs. 2,340.50", receptor: "Comercial Los Andes C.A. (J-98765432-1)", status: "valido", uuid: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" },
      { tipo: "Factura", numero: "00-045820", fecha: "16/02/2026", monto: "Bs. 8,920.00", receptor: "Supermercados Unidos S.A. (J-11223344-5)", status: "valido", uuid: "b2c3d4e5-f6a7-8901-bcde-f12345678901" },
      { tipo: "Ret. IVA", numero: "00-009810", fecha: "16/02/2026", monto: "Bs. 1,338.00", receptor: "Agente de retención: Distribuidora Oriental C.A.", status: "valido", uuid: "c3d4e5f6-a7b8-9012-cdef-123456789012" },
      { tipo: "Nota Crédito", numero: "00-003449", fecha: "15/02/2026", monto: "Bs. 456.80", receptor: "Comercial Los Andes C.A. (J-98765432-1)", status: "valido", uuid: "d4e5f6a7-b8c9-0123-defa-234567890123" },
      { tipo: "Factura", numero: "00-045819", fecha: "15/02/2026", monto: "Bs. 15,400.00", receptor: "Grupo Industrial Delta C.A. (J-55667788-0)", status: "valido", uuid: "e5f6a7b8-c9d0-1234-efab-345678901234" },
      { tipo: "Ret. ISLR", numero: "00-002100", fecha: "14/02/2026", monto: "Bs. 2,310.00", receptor: "Retención a proveedor: Transportes Rápido C.A.", status: "valido", uuid: "f6a7b8c9-d0e1-2345-fabc-456789012345" },
      { tipo: "Guía Despacho", numero: "00-000890", fecha: "14/02/2026", monto: "—", receptor: "Destino: Barquisimeto, Lara", status: "valido", uuid: "a7b8c9d0-e1f2-3456-abcd-567890123456" },
      { tipo: "Factura", numero: "00-045818", fecha: "13/02/2026", monto: "Bs. 3,200.75", receptor: "Farmacia Popular S.R.L. (J-33445566-9)", status: "valido", uuid: "b8c9d0e1-f2a3-4567-bcde-678901234567" },
      { tipo: "Nota Débito", numero: "00-001580", fecha: "12/02/2026", monto: "Bs. 890.25", receptor: "Ajuste por diferencia cambiaria - Supermercados Unidos S.A.", status: "valido", uuid: "c9d0e1f2-a3b4-5678-cdef-789012345678" },
      { tipo: "Factura", numero: "00-045817", fecha: "11/02/2026", monto: "Bs. 22,100.00", receptor: "Distribuidora Nacional C.A. (J-44556677-8)", status: "valido", uuid: "d0e1f2a3-b4c5-6789-defa-890123456789" },
      { tipo: "Ret. IVA", numero: "00-009809", fecha: "10/02/2026", monto: "Bs. 3,315.00", receptor: "Agente de retención: Distribuidora Oriental C.A.", status: "valido", uuid: "e1f2a3b4-c5d6-7890-efab-901234567890" },
      { tipo: "Factura", numero: "00-045816", fecha: "09/02/2026", monto: "Bs. 5,670.30", receptor: "Ferretería El Constructor C.A. (J-22334455-7)", status: "anulado", uuid: "f2a3b4c5-d6e7-8901-fabc-012345678901" },
    ],
    auditoria: [
      { fecha: "17/02/2026 09:15", accion: "Emisión de factura", detalle: "Factura 00-045821 emitida correctamente. Número de control válido." },
      { fecha: "16/02/2026 14:30", accion: "Retención IVA procesada", detalle: "Comprobante de retención IVA 00-009810 generado al 75%." },
      { fecha: "16/02/2026 10:20", accion: "Emisión de factura", detalle: "Factura 00-045820 emitida correctamente. Monto alto verificado por IA." },
      { fecha: "15/02/2026 16:45", accion: "Nota de crédito emitida", detalle: "NC 00-003449 vinculada a factura 00-045800. Monto dentro del rango permitido." },
      { fecha: "15/02/2026 09:00", accion: "Emisión de factura", detalle: "Factura 00-045819 emitida. Monto Bs. 15,400.00 verificado por IA." },
      { fecha: "14/02/2026 11:00", accion: "Retención ISLR procesada", detalle: "Comprobante ISLR 00-002100. Porcentaje aplicado según tabla de actividades." },
      { fecha: "14/02/2026 08:30", accion: "Guía de despacho emitida", detalle: "GD 00-000890 para traslado a Barquisimeto, Lara." },
      { fecha: "12/02/2026 15:20", accion: "Nota de débito emitida", detalle: "ND 00-001580 por ajuste cambiario. Monto verificado." },
      { fecha: "10/02/2026 08:00", accion: "Verificación de cumplimiento", detalle: "Auditoría automática: Providencia 102 ✓, Providencia 121 ✓. Sin observaciones." },
      { fecha: "09/02/2026 14:10", accion: "Alerta: Factura anulada", detalle: "Factura 00-045816 anulada. Motivo: error en datos del receptor." },
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
      { tipo: "Factura", numero: "00-012470", fecha: "16/02/2026", monto: "Bs. 45,800.00", receptor: "Corporación Electrónica Nacional C.A. (J-22334455-6)", status: "valido", uuid: "aa11bb22-cc33-dd44-ee55-ff6677889900" },
      { tipo: "Factura", numero: "00-012469", fecha: "15/02/2026", monto: "Bs. 12,350.00", receptor: "TecnoShop Express S.R.L. (J-44556677-8)", status: "valido", uuid: "bb22cc33-dd44-ee55-ff66-778899001122" },
      { tipo: "Nota Débito", numero: "00-001230", fecha: "14/02/2026", monto: "Bs. 670.25", receptor: "Ajuste por diferencia cambiaria", status: "valido", uuid: "cc33dd44-ee55-ff66-7788-990011223344" },
      { tipo: "Ret. IVA", numero: "00-004560", fecha: "13/02/2026", monto: "Bs. 6,870.00", receptor: "Agente de retención: Inversiones Maracay 2020 C.A.", status: "valido", uuid: "dd44ee55-ff66-7788-9900-112233445566" },
      { tipo: "Nota Crédito", numero: "00-000890", fecha: "10/02/2026", monto: "Bs. 2,100.00", receptor: "TecnoShop Express S.R.L. (J-44556677-8)", status: "valido", uuid: "ee55ff66-7788-9900-1122-334455667788" },
    ],
    auditoria: [
      { fecha: "16/02/2026 11:00", accion: "Emisión de factura", detalle: "Factura 00-012470 emitida. Monto alto verificado." },
      { fecha: "15/02/2026 09:30", accion: "Emisión de factura", detalle: "Factura 00-012469 emitida correctamente." },
      { fecha: "14/02/2026 16:00", accion: "Nota de débito emitida", detalle: "ND 00-001230 por ajuste cambiario." },
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
      { tipo: "Factura", numero: "00-008920", fecha: "15/02/2026", monto: "Bs. 28,500.00", receptor: "Banco del Tesoro (G-20001234-0)", status: "valido", uuid: "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d" },
      { tipo: "Nota Débito", numero: "00-001234", fecha: "15/02/2026", monto: "Bs. 670.25", receptor: "Ajuste por intereses de mora", status: "revision", uuid: "2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e" },
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
      { tipo: "Factura", numero: "00-000056", fecha: "28/01/2026", monto: "Bs. 4,500.00", receptor: "Constructora Lago Azul C.A. (J-88990011-2)", status: "valido", uuid: "3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f" },
      { tipo: "Factura", numero: "00-000055", fecha: "20/01/2026", monto: "Bs. 3,200.00", receptor: "Ingeniería Moderna C.A. (J-77889900-3)", status: "valido", uuid: "4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a" },
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
      { tipo: "Ret. IVA", numero: "00-009812", fecha: "17/02/2026", monto: "Bs. 1,872.00", receptor: "Retención a: Naviera del Sur C.A. (J-66778899-4)", status: "valido", uuid: "5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b" },
      { tipo: "Factura", numero: "00-078910", fecha: "17/02/2026", monto: "Bs. 125,000.00", receptor: "Cadena de Tiendas Popular C.A. (J-99001122-5)", status: "valido", uuid: "6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c" },
      { tipo: "Factura", numero: "00-078909", fecha: "16/02/2026", monto: "Bs. 89,500.00", receptor: "Supermercados Isla C.A. (J-11002233-6)", status: "valido", uuid: "7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d" },
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
      { tipo: "Ret. ISLR", numero: "00-002103", fecha: "16/02/2026", monto: "Bs. 3,100.75", receptor: "Retención a: Suministros CVG C.A. (J-12340000-1)", status: "valido", uuid: "8b9c0d1e-2f3a-4b5c-6d7e-8f9a0b1c2d3e" },
      { tipo: "Factura", numero: "00-021340", fecha: "16/02/2026", monto: "Bs. 67,800.00", receptor: "SIDOR C.A. (J-00000001-0)", status: "valido", uuid: "9c0d1e2f-3a4b-5c6d-7e8f-9a0b1c2d3e4f" },
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
      { tipo: "Guía Despacho", numero: "00-000892", fecha: "15/02/2026", monto: "—", receptor: "Destino: Frigorífico Central, Maracay", status: "valido", uuid: "0d1e2f3a-4b5c-6d7e-8f9a-0b1c2d3e4f5a" },
      { tipo: "Factura", numero: "00-003410", fecha: "15/02/2026", monto: "Bs. 180,000.00", receptor: "Frigorífico Central C.A. (J-10203040-5)", status: "valido", uuid: "1e2f3a4b-5c6d-7e8f-9a0b-1c2d3e4f5a6b" },
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
      { tipo: "Factura", numero: "00-089001", fecha: "15/02/2026", monto: "Bs. 45,000.00", receptor: "Consorcio Vial Caracas C.A. (J-55443322-1)", status: "valido", uuid: "2f3a4b5c-6d7e-8f9a-0b1c-2d3e4f5a6b7c" },
      { tipo: "Factura", numero: "00-089000", fecha: "14/02/2026", monto: "Bs. 32,500.00", receptor: "Constructora Capital S.A. (J-66554433-2)", status: "valido", uuid: "3a4b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d" },
    ],
    auditoria: [
      { fecha: "15/02/2026 10:00", accion: "Emisión de factura institucional", detalle: "Factura 00-089001 emitida por servicio de obra pública." },
      { fecha: "01/02/2026 08:00", accion: "Verificación mensual", detalle: "Entidad gubernamental en cumplimiento total." },
    ],
  },
};

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

  // Fetch client data from API, fallback to mockDB
  useEffect(() => {
    const token = sessionStorage.getItem("seniat_token");

    // Try API first
    if (token) {
      fetch(`${API}/clients?page_size=50`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : Promise.reject("api error"))
        .then(data => {
          const client = (data.items || []).find((c: Record<string, unknown>) => c.rif === rifParam);
          if (client) {
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
              numerosControlUsados: Math.floor((client.max_documentos_mes || 1000) * 0.4),
              documentos: [],
              auditoria: [],
            };
            setEmpresa(emp);
          } else {
            // Fallback to mockDB
            setEmpresa(mockDB[rifParam] || null);
          }
        })
        .catch(() => {
          setEmpresa(mockDB[rifParam] || null);
        });
    } else {
      setEmpresa(mockDB[rifParam] || null);
    }
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

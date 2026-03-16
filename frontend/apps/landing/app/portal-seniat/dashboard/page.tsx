"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

interface ClientData {
  rif: string;
  nombre: string;
  estado: string;
  plan: string;
  status: string;
  docsEmitidos: number;
  ultimaEmision: string;
  homologado: boolean;
  prov102: boolean;
  prov121: boolean;
}

interface DocReciente {
  tipo: string;
  numero: string;
  rif: string;
  empresa: string;
  fecha: string;
  monto: string;
  status: string;
}

interface DashboardStats {
  totalClientes: string;
  totalDocs: string;
  cumplimiento: string;
  alertas: string;
  cambioClientes: string;
  cambioDocs: string;
  cambioCumplimiento: string;
  cambioAlertas: string;
}

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

export default function DashboardPage() {
  const router = useRouter();
  const [rifSearch, setRifSearch] = useState("");
  const [empresas, setEmpresas] = useState<ClientData[]>([]);
  const [documentos, setDocumentos] = useState<DocReciente[]>([]);
  const [dashStats, setDashStats] = useState<DashboardStats>({
    totalClientes: "0", totalDocs: "0", cumplimiento: "0%", alertas: "0",
    cambioClientes: "Cargando...", cambioDocs: "Cargando...", cambioCumplimiento: "Cargando...", cambioAlertas: "Cargando...",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem("seniat_token");
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    // Fetch clients
    fetch(`${API}/clients?page_size=50`, { headers })
      .then(r => r.ok ? r.json() : Promise.reject("clients error"))
      .then(data => {
        const clients: ClientData[] = (data.items || []).map((c: Record<string, unknown>) => ({
          rif: c.rif as string,
          nombre: (c.razon_social || c.nombre_comercial || "") as string,
          estado: ((c.direccion_fiscal as string) || "").split(",").pop()?.trim() || "Venezuela",
          plan: `Completo ${c.plan || "Básico"}`,
          status: c.is_suspended ? "alerta" : c.is_active ? "cumple" : "revision",
          docsEmitidos: (c.max_documentos_mes as number) || 0,
          ultimaEmision: new Date(c.created_at as string).toISOString().split("T")[0],
          homologado: c.is_active as boolean,
          prov102: true,
          prov121: c.is_active as boolean,
        }));
        setEmpresas(clients);
      })
      .catch(err => console.error("Failed to fetch clients:", err));

    // Fetch dashboard stats
    fetch(`${API}/admin/dashboard`, { headers })
      .then(r => r.ok ? r.json() : Promise.reject("dashboard error"))
      .then(data => {
        setDashStats({
          totalClientes: String(data.total_clients || 0),
          totalDocs: (data.total_documents_month || 0).toLocaleString(),
          cumplimiento: data.active_clients && data.total_clients
            ? `${Math.round((data.active_clients / data.total_clients) * 100)}%`
            : "100%",
          alertas: String((data.alerts || []).length),
          cambioClientes: `${data.active_clients || 0} activos`,
          cambioDocs: `${data.total_documents_today || 0} hoy`,
          cambioCumplimiento: `${data.active_clients || 0} de ${data.total_clients || 0} activos`,
          cambioAlertas: (data.alerts || []).slice(0, 2).join(", ") || "Sin alertas",
        });
      })
      .catch(err => console.error("Failed to fetch dashboard stats:", err));

    // Fetch recent documents
    fetch(`${API}/documents?page_size=10`, { headers })
      .then(r => r.ok ? r.json() : Promise.reject("documents error"))
      .then(data => {
        const docs: DocReciente[] = (data.items || []).map((d: Record<string, unknown>) => ({
          tipo: (d.document_type as string) || "Factura",
          numero: (d.control_number as string) || (d.document_number as string) || "—",
          rif: (d.emitter_rif as string) || "—",
          empresa: (d.emitter_name as string) || "—",
          fecha: d.created_at ? new Date(d.created_at as string).toLocaleDateString("es-VE") : "—",
          monto: d.total_amount ? `Bs. ${Number(d.total_amount).toLocaleString("es-VE", { minimumFractionDigits: 2 })}` : "—",
          status: (d.status as string) === "active" || (d.status as string) === "valid" ? "valido" : (d.status as string) || "valido",
        }));
        setDocumentos(docs);
      })
      .catch(err => console.error("Failed to fetch documents:", err));

    setLoading(false);
  }, []);

  const filteredEmpresas = rifSearch
    ? empresas.filter(
        (e) =>
          e.rif.toLowerCase().includes(rifSearch.toLowerCase()) ||
          e.nombre.toLowerCase().includes(rifSearch.toLowerCase())
      )
    : empresas;

  const handleVerDetalle = (rif: string) => {
    router.push(`/portal-seniat/dashboard/cliente/${encodeURIComponent(rif)}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Panel de Auditoría — Facturación Digital</h1>
        <p className="text-sm text-gray-400 mt-1">
          Supervisión en tiempo real de contribuyentes con <span className="text-aida-cyan font-medium">Facturación Digital</span> (Imprenta Digital AIDA).
          Solo se muestran los clientes que adquirieron el servicio de números de control fiscal.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Contribuyentes Registrados", value: dashStats.totalClientes, change: dashStats.cambioClientes, color: "from-aida-accent to-blue-400", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
          { label: "Documentos Emitidos (Mes)", value: dashStats.totalDocs, change: dashStats.cambioDocs, color: "from-aida-cyan to-teal-400", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
          { label: "Tasa de Cumplimiento", value: dashStats.cumplimiento, change: dashStats.cambioCumplimiento, color: "from-emerald-500 to-green-400", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
          { label: "Alertas Activas", value: dashStats.alertas, change: dashStats.cambioAlertas, color: "from-amber-500 to-orange-400", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-5 hover:bg-white/[0.06] transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
                <p className="text-2xl font-black text-white mt-1">{stat.value}</p>
                <p className="text-[10px] text-gray-500 mt-1">{stat.change}</p>
              </div>
              <div className="p-2.5 rounded-xl" style={{ background: `linear-gradient(135deg, rgba(99,102,241,0.1), rgba(14,165,233,0.1))` }}>
                <svg className={`w-6 h-6 bg-gradient-to-br ${stat.color} bg-clip-text`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={stat.icon} />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div id="buscar" className="glass-card p-5">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Buscar Contribuyente
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={rifSearch}
                onChange={(e) => setRifSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-aida-accent/50 focus:ring-1 focus:ring-aida-accent/30 transition-all"
                placeholder="Buscar por RIF o razón social... ej: J-12345678-9"
              />
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {filteredEmpresas.length} de {empresas.length} contribuyentes
          </div>
        </div>
      </div>

      {/* Empresas table */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h2 className="text-sm font-bold text-white">Contribuyentes con Facturación Digital</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Solo empresas con servicio de Imprenta Digital (números de control SENIAT). Los clientes con solo Facturador no aparecen aquí.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">RIF</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Razón Social</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Estado</th>
                <th className="text-center py-3 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Prov. 102</th>
                <th className="text-center py-3 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Prov. 121</th>
                <th className="text-right py-3 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Docs.</th>
                <th className="text-center py-3 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-center py-3 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmpresas.map((empresa) => (
                <tr
                  key={empresa.rif}
                  className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                >
                  <td className="py-3 px-5 font-mono text-xs text-aida-cyan">{empresa.rif}</td>
                  <td className="py-3 px-5">
                    <p className="text-white font-medium text-sm">{empresa.nombre}</p>
                    <p className="text-[10px] text-gray-500">Plan {empresa.plan}</p>
                  </td>
                  <td className="py-3 px-5 text-gray-400 text-xs hidden md:table-cell">{empresa.estado}</td>
                  <td className="py-3 px-5 text-center hidden lg:table-cell">
                    {empresa.prov102 ? (
                      <svg className="w-4 h-4 text-emerald-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-red-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </td>
                  <td className="py-3 px-5 text-center hidden lg:table-cell">
                    {empresa.prov121 ? (
                      <svg className="w-4 h-4 text-emerald-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-red-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </td>
                  <td className="py-3 px-5 text-right text-white font-mono text-xs hidden sm:table-cell">
                    {empresa.docsEmitidos.toLocaleString()}
                  </td>
                  <td className="py-3 px-5 text-center">
                    <StatusBadge status={empresa.status} />
                  </td>
                  <td className="py-3 px-5 text-center">
                    <button
                      onClick={() => handleVerDetalle(empresa.rif)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-aida-cyan hover:bg-aida-cyan/10 border border-aida-cyan/20 hover:border-aida-cyan/40 transition-all"
                    >
                      Ver
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredEmpresas.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500 text-sm">
                    No se encontraron contribuyentes con ese criterio de búsqueda
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Documents */}
      <div id="documentos" className="glass-card overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h2 className="text-sm font-bold text-white">Documentos Fiscales Recientes</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Últimos documentos emitidos en la plataforma AIDA
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Tipo</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">N° Control</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Contribuyente</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Fecha</th>
                <th className="text-right py-3 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Monto</th>
                <th className="text-center py-3 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody>
              {documentos.map((doc, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                  <td className="py-3 px-5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/5 text-gray-300 border border-white/10">
                      {doc.tipo}
                    </span>
                  </td>
                  <td className="py-3 px-5 font-mono text-xs text-white">{doc.numero}</td>
                  <td className="py-3 px-5">
                    <p className="text-white text-xs font-medium">{doc.empresa}</p>
                    <p className="text-[10px] text-gray-500 font-mono">{doc.rif}</p>
                  </td>
                  <td className="py-3 px-5 text-xs text-gray-400 hidden sm:table-cell">{doc.fecha}</td>
                  <td className="py-3 px-5 text-right text-xs text-white font-mono hidden md:table-cell">{doc.monto}</td>
                  <td className="py-3 px-5 text-center">
                    <StatusBadge status={doc.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reportes section */}
      <div id="reportes" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            title: "Reporte de Cumplimiento",
            desc: "Estado de cumplimiento de Providencia 102 y 121 por contribuyente",
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
          {
            title: "Reporte de Documentos",
            desc: "Resumen de documentos fiscales emitidos por tipo, período y contribuyente",
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            ),
          },
          {
            title: "Reporte de Retenciones",
            desc: "Comprobantes de retención IVA e ISLR emitidos en el período fiscal",
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            ),
          },
        ].map((report) => (
          <div
            key={report.title}
            className="glass-card p-5 hover:bg-white/[0.06] hover:border-white/20 transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-aida-accent/10 text-aida-cyan group-hover:bg-aida-accent/20 transition-all">
                {report.icon}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-aida-cyan transition-colors">{report.title}</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{report.desc}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs text-aida-cyan font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Generar reporte
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="text-center py-4">
        <p className="text-[10px] text-gray-600">
          Datos en tiempo real del sistema AIDA — Imprenta Digital
        </p>
      </div>
    </div>
  );
}

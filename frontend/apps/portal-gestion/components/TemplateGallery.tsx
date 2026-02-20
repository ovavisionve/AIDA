"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface Template {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  version: string;
  supports_sync: boolean;
  supports_webhook: boolean;
  supports_batch: boolean;
  supports_realtime: boolean;
  is_official: boolean;
}

export default function TemplateGallery({ token }: { token: string }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [seeding, setSeeding] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const loadTemplates = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (categoryFilter) params.set("category", categoryFilter);
    fetch(`${API}/portal5/templates?${params}`, { headers })
      .then(r => r.json())
      .then(data => setTemplates(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTemplates(); }, [categoryFilter]);

  const seedTemplates = async () => {
    setSeeding(true);
    try {
      await fetch(`${API}/portal5/templates/seed`, {
        method: "POST", headers,
      });
      loadTemplates();
    } catch {} finally {
      setSeeding(false);
    }
  };

  const viewDetail = async (id: string) => {
    const res = await fetch(`${API}/portal5/templates/${id}`, { headers });
    const data = await res.json();
    setSelectedDetail(data);
  };

  const categoryInfo: Record<string, { color: string; label: string; icon: string }> = {
    erp: { color: "bg-blue-500", label: "ERP", icon: "🏢" },
    ecommerce: { color: "bg-green-500", label: "E-Commerce", icon: "🛒" },
    contabilidad: { color: "bg-purple-500", label: "Contabilidad", icon: "📊" },
    custom: { color: "bg-gray-500", label: "Custom/API", icon: "⚡" },
    pos: { color: "bg-orange-500", label: "POS", icon: "💳" },
    seniat: { color: "bg-emerald-500", label: "SENIAT", icon: "🏛️" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Templates de Integracion</h1>
        <button onClick={seedTemplates} disabled={seeding}
          className="bg-aida-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-aida-accent/80 transition disabled:opacity-50">
          {seeding ? "Cargando..." : "Cargar Templates Oficiales"}
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2">
        {["", "erp", "ecommerce", "contabilidad", "pos", "seniat", "custom"].map(cat => (
          <button key={cat} onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              categoryFilter === cat ? "bg-aida-accent text-white" : "border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
            }`}>
            {cat ? `${categoryInfo[cat]?.icon || ""} ${categoryInfo[cat]?.label || cat}` : "Todos"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-aida-accent border-t-transparent rounded-full" /></div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">📦</div>
          <p className="text-gray-400">No hay templates cargados.</p>
          <p className="text-sm text-gray-500 mt-1">Presione "Cargar Templates Oficiales" para inicializar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => {
            const cat = categoryInfo[t.category] || { color: "bg-gray-500", label: t.category, icon: "📄" };
            return (
              <div key={t.id} className="rounded-xl border border-white/10 bg-white/5 p-5 hover:bg-white/[0.08] transition cursor-pointer"
                onClick={() => viewDetail(t.id)}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{cat.icon}</span>
                  <div className="flex gap-1">
                    {t.is_official && (
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">Oficial</span>
                    )}
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs font-medium">V1.4</span>
                    <span className="px-2 py-0.5 bg-white/10 text-gray-500 rounded text-xs">v{t.version}</span>
                  </div>
                </div>
                <h3 className="font-bold text-lg text-white">{t.name}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-3">{t.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <span className={`px-2 py-0.5 ${cat.color} text-white rounded text-xs`}>{cat.label}</span>
                  {t.supports_sync && <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">Sync</span>}
                  {t.supports_webhook && <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">Webhook</span>}
                  {t.supports_batch && <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded text-xs">Batch</span>}
                  {t.supports_realtime && <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">Realtime</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {selectedDetail && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setSelectedDetail(null)}>
          <div className="rounded-2xl border border-white/10 bg-[#0a0f1a] p-6 max-w-2xl w-full max-h-[80vh] overflow-auto m-4"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">{selectedDetail.name}</h2>
              <button onClick={() => setSelectedDetail(null)} className="text-gray-500 hover:text-gray-300 text-xl">&times;</button>
            </div>
            <p className="text-sm text-gray-400 mb-4">{selectedDetail.description}</p>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-gray-300 mb-1">Autenticacion</h4>
                <pre className="bg-white/[0.03] p-3 rounded-lg text-xs overflow-auto max-h-32 text-gray-400">
                  {JSON.stringify(selectedDetail.auth_config, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-300 mb-1">Mapeo de Campos</h4>
                <pre className="bg-white/[0.03] p-3 rounded-lg text-xs overflow-auto max-h-32 text-gray-400">
                  {JSON.stringify(selectedDetail.field_mapping, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-300 mb-1">Endpoints</h4>
                <pre className="bg-white/[0.03] p-3 rounded-lg text-xs overflow-auto max-h-32 text-gray-400">
                  {JSON.stringify(selectedDetail.endpoint_mapping, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-300 mb-1">Configuracion por defecto</h4>
                <pre className="bg-white/[0.03] p-3 rounded-lg text-xs overflow-auto max-h-32 text-gray-400">
                  {JSON.stringify(selectedDetail.default_config, null, 2)}
                </pre>
              </div>
              {selectedDetail.transformation_rules && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-300 mb-1">Reglas de Transformacion</h4>
                  <pre className="bg-white/[0.03] p-3 rounded-lg text-xs overflow-auto max-h-32 text-gray-400">
                    {JSON.stringify(selectedDetail.transformation_rules, null, 2)}
                  </pre>
                </div>
              )}

              {/* SENIAT V1.4 Compliance */}
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs font-semibold">SENIAT V1.4</span>
                  <h4 className="font-semibold text-sm text-gray-300">Compatibilidad</h4>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { label: "Facturas (01)", supported: true },
                    { label: "Notas de Crédito (02)", supported: true },
                    { label: "Notas de Débito (03)", supported: true },
                    { label: "Guías de Despacho (04)", supported: true },
                    { label: "Retención IVA (07)", supported: true },
                    { label: "Retención ISLR (08)", supported: true },
                  ].map(dt => (
                    <div key={dt.label} className="flex items-center gap-2 text-gray-400">
                      <span className={`w-1.5 h-1.5 rounded-full ${dt.supported ? "bg-emerald-500" : "bg-gray-600"}`} />
                      {dt.label}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-gray-500 mt-3">
                  Todos los templates generan documentos compatibles con la estructura JSON SENIAT V1.4.
                  El nodo imprenta es generado automáticamente por AIDA.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

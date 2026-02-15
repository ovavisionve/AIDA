"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
    fetch(`${API}/api/v1/portal5/templates?${params}`, { headers })
      .then(r => r.json())
      .then(data => setTemplates(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTemplates(); }, [categoryFilter]);

  const seedTemplates = async () => {
    setSeeding(true);
    try {
      await fetch(`${API}/api/v1/portal5/templates/seed`, {
        method: "POST", headers,
      });
      loadTemplates();
    } catch {} finally {
      setSeeding(false);
    }
  };

  const viewDetail = async (id: string) => {
    const res = await fetch(`${API}/api/v1/portal5/templates/${id}`, { headers });
    const data = await res.json();
    setSelectedDetail(data);
  };

  const categoryInfo: Record<string, { color: string; label: string; icon: string }> = {
    erp: { color: "bg-blue-500", label: "ERP", icon: "🏢" },
    ecommerce: { color: "bg-green-500", label: "E-Commerce", icon: "🛒" },
    contabilidad: { color: "bg-purple-500", label: "Contabilidad", icon: "📊" },
    custom: { color: "bg-gray-500", label: "Custom/API", icon: "⚡" },
    pos: { color: "bg-orange-500", label: "POS", icon: "💳" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Templates de Integración</h1>
        <button onClick={seedTemplates} disabled={seeding}
          className="bg-aida-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-aida-primary transition disabled:opacity-50">
          {seeding ? "Cargando..." : "Cargar Templates Oficiales"}
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2">
        {["", "erp", "ecommerce", "contabilidad", "custom"].map(cat => (
          <button key={cat} onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              categoryFilter === cat ? "bg-aida-accent text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
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
          <p className="text-gray-500">No hay templates cargados.</p>
          <p className="text-sm text-gray-400 mt-1">Presione "Cargar Templates Oficiales" para inicializar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => {
            const cat = categoryInfo[t.category] || { color: "bg-gray-500", label: t.category, icon: "📄" };
            return (
              <div key={t.id} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition cursor-pointer"
                onClick={() => viewDetail(t.id)}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{cat.icon}</span>
                  <div className="flex gap-1">
                    {t.is_official && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">Oficial</span>
                    )}
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">v{t.version}</span>
                  </div>
                </div>
                <h3 className="font-bold text-lg">{t.name}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-3">{t.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <span className={`px-2 py-0.5 ${cat.color} text-white rounded text-xs`}>{cat.label}</span>
                  {t.supports_sync && <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs">Sync</span>}
                  {t.supports_webhook && <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-xs">Webhook</span>}
                  {t.supports_batch && <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-xs">Batch</span>}
                  {t.supports_realtime && <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs">Realtime</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {selectedDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-auto m-4"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{selectedDetail.name}</h2>
              <button onClick={() => setSelectedDetail(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <p className="text-sm text-gray-600 mb-4">{selectedDetail.description}</p>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-1">Autenticación</h4>
                <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-auto max-h-32">
                  {JSON.stringify(selectedDetail.auth_config, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-1">Mapeo de Campos</h4>
                <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-auto max-h-32">
                  {JSON.stringify(selectedDetail.field_mapping, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-1">Endpoints</h4>
                <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-auto max-h-32">
                  {JSON.stringify(selectedDetail.endpoint_mapping, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-1">Configuración por defecto</h4>
                <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-auto max-h-32">
                  {JSON.stringify(selectedDetail.default_config, null, 2)}
                </pre>
              </div>
              {selectedDetail.transformation_rules && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-1">Reglas de Transformación</h4>
                  <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-auto max-h-32">
                    {JSON.stringify(selectedDetail.transformation_rules, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

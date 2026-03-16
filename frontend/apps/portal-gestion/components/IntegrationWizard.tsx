"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

/* ── SENIAT V1.4 Document Types ── */
const SENIAT_DOC_TYPES = [
  { code: "01", name: "Factura", desc: "Documento fiscal de venta" },
  { code: "02", name: "Nota de Crédito", desc: "Reduce/anula factura emitida" },
  { code: "03", name: "Nota de Débito", desc: "Incrementa monto de factura" },
  { code: "04", name: "Guía de Despacho", desc: "Traslado de mercancías" },
  { code: "07", name: "Retención IVA", desc: "Comprobante retención IVA" },
  { code: "08", name: "Retención ISLR", desc: "Comprobante retención ISLR" },
];

/* ── SENIAT V1.4 field mapping reference ── */
const SENIAT_MAPPING_REF = [
  { section: "encabezado.identificacionDocumento", fields: ["tipoDocumento", "numeroDocumento", "tipoProveedor", "tipoTransaccion", "fechaEmision", "horaEmision", "moneda", "tipoDePago", "tipoDeVenta"], required: true },
  { section: "encabezado.comprador", fields: ["tipoIdentificacion", "numeroIdentificacion", "razonSocial", "direccion", "pais"], required: true },
  { section: "encabezado.totales", fields: ["nroItems", "subtotal", "totalIVA", "montoTotalConIVA", "totalAPagar", "formasPago", "impuestosSubtotal"], required: true },
  { section: "detalleItems[]", fields: ["numeroLinea", "indicadorBienoServicio", "descripcion", "cantidad", "unidadMedida", "precioUnitario", "precioItem", "tasaIVA", "valorIVA", "valorTotalItem"], required: true },
  { section: "encabezado.sujetoRetenido", fields: ["tipoIdentificacion", "numeroIdentificacion", "razonSocial", "pais"], required: false },
  { section: "detallesRetencion[]", fields: ["numeroLinea", "fechaDocumento", "tipoDocumento", "baseImponible", "porcentajeRetencion", "retenido", "moneda"], required: false },
  { section: "imprenta (auto)", fields: ["snat", "nombre", "rif", "autorizacion", "numeroControl", "rangoInicial", "rangoFinal"], required: false },
];

interface Template {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  supports_sync: boolean;
  supports_webhook: boolean;
  supports_realtime: boolean;
  is_official: boolean;
}

const STEP_NAMES = [
  "Seleccionar Sistema",
  "Credenciales",
  "Mapeo de Campos",
  "Webhooks",
  "Sincronización",
  "Test y Activación",
];

export default function IntegrationWizard({ token }: { token: string }) {
  const [step, setStep] = useState(0);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [authConfig, setAuthConfig] = useState<any>(null);
  const [currentMapping, setCurrentMapping] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form states
  const [projectId, setProjectId] = useState("");
  const [connName, setConnName] = useState("");
  const [environment, setEnvironment] = useState("sandbox");
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [systemUrl, setSystemUrl] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<string[]>(["document.emitted", "document.voided"]);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncInterval, setSyncInterval] = useState(300);
  const [activate, setActivate] = useState(false);

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  useEffect(() => {
    fetch(`${API}/portal5/templates`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setTemplates)
      .catch(() => {});
  }, []);

  const [selectedDocTypes, setSelectedDocTypes] = useState<string[]>(["01"]);
  const [showMappingRef, setShowMappingRef] = useState(false);

  const categoryColors: Record<string, string> = {
    erp: "bg-blue-500/20 text-blue-400",
    ecommerce: "bg-green-500/20 text-green-400",
    contabilidad: "bg-purple-500/20 text-purple-400",
    custom: "bg-gray-500/20 text-gray-400",
    pos: "bg-orange-500/20 text-orange-400",
    seniat: "bg-emerald-500/20 text-emerald-400",
  };

  const handleStep1 = async () => {
    if (!selectedTemplate || !projectId || !connName) {
      setError("Complete todos los campos requeridos");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/portal5/wizard/start`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          name: connName,
          environment,
          project_id: projectId,
          seniat_doc_types: selectedDocTypes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al iniciar wizard");
      setConnectionId(data.connection_id);
      setAuthConfig(data.template.auth_config);
      setStep(1);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async () => {
    if (!systemUrl) { setError("Ingrese la URL del sistema"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/portal5/wizard/${connectionId}/credentials`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ system_base_url: systemUrl, credentials }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al guardar credenciales");
      setCurrentMapping(data.current_mapping);
      setStep(2);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStep3 = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/portal5/wizard/${connectionId}/mapping`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ field_mapping: currentMapping || {} }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al guardar mapeo");
      setStep(3);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStep4 = async () => {
    setLoading(true);
    setError("");
    try {
      const webhooks = webhookUrl ? [{
        name: `Webhook ${connName}`,
        url: webhookUrl,
        events: webhookEvents,
        retry_count: 3,
        timeout_seconds: 30,
      }] : [];
      const res = await fetch(`${API}/portal5/wizard/${connectionId}/webhooks`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ webhooks, callback_url: webhookUrl || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al configurar webhooks");
      setStep(4);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStep5 = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/portal5/wizard/${connectionId}/sync`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ sync_enabled: syncEnabled, sync_interval_seconds: syncInterval }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al configurar sync");
      setStep(5);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStep6 = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/portal5/wizard/${connectionId}/test`, {
        method: "POST",
        headers,
        body: JSON.stringify({ activate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error en test");
      setTestResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Wizard de Integracion</h1>

      {/* Progress steps */}
      <div className="flex items-center mb-8">
        {STEP_NAMES.map((name, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
              i < step ? "bg-green-500 text-white"
                : i === step ? "bg-aida-accent text-white"
                : "bg-white/10 text-gray-500"
            }`}>{i < step ? "✓" : i + 1}</div>
            <span className={`ml-2 text-xs hidden lg:block ${i === step ? "text-aida-accent font-semibold" : "text-gray-500"}`}>
              {name}
            </span>
            {i < STEP_NAMES.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i < step ? "bg-green-500" : "bg-white/10"}`} />}
          </div>
        ))}
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      {/* Step 0: Select template */}
      {step === 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">ID del Proyecto *</label>
              <input value={projectId} onChange={e => setProjectId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-aida-accent" placeholder="UUID del proyecto" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nombre de la Conexion *</label>
              <input value={connName} onChange={e => setConnName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-aida-accent" placeholder="Ej: Odoo Empresa XYZ" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Entorno</label>
            <select value={environment} onChange={e => setEnvironment(e.target.value)}
              className="bg-[#0a0f1a] border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-aida-accent">
              <option value="sandbox">Sandbox</option>
              <option value="staging">Staging</option>
              <option value="production">Produccion</option>
            </select>
          </div>

          {/* SENIAT V1.4 Document Types */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs font-semibold">SENIAT V1.4</span>
              <h3 className="font-semibold text-gray-300 text-sm">Tipos de documento a integrar</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SENIAT_DOC_TYPES.map(dt => (
                <label key={dt.code}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition text-sm ${
                    selectedDocTypes.includes(dt.code)
                      ? "border-emerald-500/40 bg-emerald-500/10 text-white"
                      : "border-white/10 bg-white/[0.02] text-gray-400 hover:border-white/20"
                  }`}>
                  <input type="checkbox" checked={selectedDocTypes.includes(dt.code)}
                    onChange={e => {
                      if (e.target.checked) setSelectedDocTypes([...selectedDocTypes, dt.code]);
                      else setSelectedDocTypes(selectedDocTypes.filter(c => c !== dt.code));
                    }} className="rounded w-3.5 h-3.5" />
                  <div>
                    <span className="font-mono text-xs text-emerald-400 mr-1.5">{dt.code}</span>
                    <span className="text-xs">{dt.name}</span>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-[11px] text-gray-500 mt-2">Seleccione los tipos de documento fiscal que el sistema externo enviará a AIDA.</p>
          </div>

          <h3 className="font-semibold text-gray-300">Seleccione el sistema a integrar:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(t => (
              <button key={t.id} onClick={() => setSelectedTemplate(t)}
                className={`text-left p-4 rounded-xl border-2 transition ${
                  selectedTemplate?.id === t.id
                    ? "border-aida-accent bg-aida-accent/10"
                    : "border-white/10 hover:border-white/20 bg-white/5"
                }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-white">{t.name}</span>
                  {t.is_official && <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">Oficial</span>}
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">{t.description}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${categoryColors[t.category] || "bg-white/10 text-gray-400"}`}>
                    {t.category}
                  </span>
                  <div className="flex gap-1">
                    {t.supports_sync && <span className="text-xs text-gray-500">sync</span>}
                    {t.supports_webhook && <span className="text-xs text-gray-500">webhook</span>}
                    {t.supports_realtime && <span className="text-xs text-gray-500">realtime</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <button onClick={handleStep1} disabled={loading || !selectedTemplate}
            className="bg-aida-accent text-white px-6 py-2.5 rounded-lg font-medium hover:bg-aida-accent/80 transition disabled:opacity-50">
            {loading ? "Creando..." : "Siguiente →"}
          </button>
        </div>
      )}

      {/* Step 1: Credentials */}
      {step === 1 && authConfig && (
        <div className="space-y-6">
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg text-sm text-blue-400">
            {authConfig.description || "Configure las credenciales de conexion al sistema externo."}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">URL del Sistema *</label>
            <input value={systemUrl} onChange={e => setSystemUrl(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-aida-accent" placeholder={authConfig.fields?.[0]?.placeholder || "https://..."} />
          </div>
          {authConfig.fields?.map((field: any) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-300 mb-1">{field.label} {field.required && "*"}</label>
              <input type={field.type === "password" ? "password" : "text"}
                value={credentials[field.name] || ""}
                onChange={e => setCredentials({ ...credentials, [field.name]: e.target.value })}
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-aida-accent"
                placeholder={field.placeholder || ""} />
            </div>
          ))}
          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="border border-white/10 text-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-white/5">← Atras</button>
            <button onClick={handleStep2} disabled={loading}
              className="bg-aida-accent text-white px-6 py-2.5 rounded-lg font-medium hover:bg-aida-accent/80 transition disabled:opacity-50">
              {loading ? "Guardando..." : "Siguiente →"}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Field mapping */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg text-sm text-green-400">
            El mapeo de campos viene pre-configurado según el template. Los campos deben corresponder a la estructura SENIAT V1.4.
          </div>

          {/* SENIAT V1.4 Reference Panel */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 overflow-hidden">
            <button onClick={() => setShowMappingRef(!showMappingRef)}
              className="w-full flex items-center justify-between p-4 hover:bg-emerald-500/5 transition">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs font-semibold">SENIAT V1.4</span>
                <span className="text-sm text-gray-300">Referencia de campos requeridos</span>
              </div>
              <svg className={`w-4 h-4 text-gray-500 transition-transform ${showMappingRef ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showMappingRef && (
              <div className="border-t border-emerald-500/10 p-4 space-y-3">
                {SENIAT_MAPPING_REF.map(ref => (
                  <div key={ref.section} className="rounded-lg bg-white/[0.03] p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-xs text-aida-cyan">{ref.section}</span>
                      {ref.required
                        ? <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">Requerido</span>
                        : <span className="text-[10px] bg-gray-500/20 text-gray-400 px-1.5 py-0.5 rounded">Condicional</span>}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {ref.fields.map(f => (
                        <span key={f} className="text-[10px] font-mono bg-white/10 text-gray-300 px-1.5 py-0.5 rounded">{f}</span>
                      ))}
                    </div>
                  </div>
                ))}
                <p className="text-[11px] text-gray-500">
                  Su sistema externo debe mapear estos campos al formato SENIAT V1.4. El nodo <code className="text-emerald-400">imprenta</code> es generado automáticamente por AIDA.
                </p>
              </div>
            )}
          </div>

          <div className="bg-white/[0.03] rounded-lg p-4">
            <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Mapeo actual del template</h4>
            <pre className="text-xs overflow-auto max-h-64 text-gray-300">{JSON.stringify(currentMapping, null, 2)}</pre>
          </div>
          <p className="text-sm text-gray-500">El mapeo por defecto es adecuado para la mayoría de instalaciones. Modifique solo si su sistema tiene campos personalizados.</p>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="border border-white/10 text-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-white/5">← Atras</button>
            <button onClick={handleStep3} disabled={loading}
              className="bg-aida-accent text-white px-6 py-2.5 rounded-lg font-medium hover:bg-aida-accent/80 transition disabled:opacity-50">
              {loading ? "Guardando..." : "Siguiente →"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Webhooks */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-lg text-sm text-purple-400">
            Configure webhooks para recibir notificaciones de eventos SENIAT V1.4: emisión, anulación, retenciones y validación de documentos fiscales.
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">URL del Webhook (opcional)</label>
            <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-aida-accent" placeholder="https://su-sistema.com/webhook/aida" />
          </div>
          {webhookUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Eventos a escuchar:</label>
              <div className="grid grid-cols-2 gap-2">
                {["document.emitted", "document.voided", "document.updated", "control_number.assigned", "control_number.low",
                  "seniat.accepted", "seniat.rejected", "seniat.duplicate",
                  "retention.iva", "retention.islr",
                  "sync.completed", "sync.failed", "integration.error"].map(evt => (
                  <label key={evt} className="flex items-center gap-2 text-sm text-gray-300">
                    <input type="checkbox" checked={webhookEvents.includes(evt)}
                      onChange={e => {
                        if (e.target.checked) setWebhookEvents([...webhookEvents, evt]);
                        else setWebhookEvents(webhookEvents.filter(x => x !== evt));
                      }} className="rounded" />
                    {evt}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="border border-white/10 text-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-white/5">← Atras</button>
            <button onClick={handleStep4} disabled={loading}
              className="bg-aida-accent text-white px-6 py-2.5 rounded-lg font-medium hover:bg-aida-accent/80 transition disabled:opacity-50">
              {loading ? "Guardando..." : "Siguiente →"}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Sync config */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-lg text-sm text-orange-400">
            Configure la sincronizacion automatica para importar documentos del sistema externo.
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={syncEnabled} onChange={e => setSyncEnabled(e.target.checked)}
              className="w-5 h-5 rounded" />
            <span className="font-medium text-white">Habilitar sincronizacion automatica</span>
          </label>
          {syncEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Intervalo (segundos)</label>
              <select value={syncInterval} onChange={e => setSyncInterval(Number(e.target.value))}
                className="bg-[#0a0f1a] border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-aida-accent">
                <option value={60}>Cada minuto</option>
                <option value={120}>Cada 2 minutos</option>
                <option value={300}>Cada 5 minutos</option>
                <option value={600}>Cada 10 minutos</option>
                <option value={1800}>Cada 30 minutos</option>
                <option value={3600}>Cada hora</option>
              </select>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="border border-white/10 text-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-white/5">← Atras</button>
            <button onClick={handleStep5} disabled={loading}
              className="bg-aida-accent text-white px-6 py-2.5 rounded-lg font-medium hover:bg-aida-accent/80 transition disabled:opacity-50">
              {loading ? "Guardando..." : "Siguiente →"}
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Test */}
      {step === 5 && (
        <div className="space-y-6">
          {!testResult ? (
            <>
              <div className="rounded-xl border-2 border-dashed border-white/10 bg-white/5 p-8 text-center">
                <div className="text-4xl mb-3">🔌</div>
                <h3 className="text-lg font-semibold mb-2 text-white">Listo para probar la conexion</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Se verificará la conectividad con el sistema externo y la compatibilidad con SENIAT V1.4.
                </p>
                {selectedDocTypes.length > 0 && (
                  <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                    <span className="text-xs text-gray-500">Tipos SENIAT:</span>
                    {selectedDocTypes.map(dt => {
                      const info = SENIAT_DOC_TYPES.find(d => d.code === dt);
                      return (
                        <span key={dt} className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono">
                          {dt} {info?.name}
                        </span>
                      );
                    })}
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 mb-4 cursor-pointer">
                  <input type="checkbox" checked={activate} onChange={e => setActivate(e.target.checked)}
                    className="w-4 h-4 rounded" />
                  <span className="text-sm font-medium text-gray-300">Activar en produccion si el test es exitoso</span>
                </label>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(4)} className="border border-white/10 text-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-white/5">← Atras</button>
                <button onClick={handleStep6} disabled={loading}
                  className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50">
                  {loading ? "Probando..." : "Ejecutar Test"}
                </button>
              </div>
            </>
          ) : (
            <div className={`border-2 rounded-xl p-8 text-center ${
              testResult.test_result?.success ? "border-green-500/50 bg-green-500/10" : "border-red-500/50 bg-red-500/10"
            }`}>
              <div className="text-5xl mb-3">{testResult.test_result?.success ? "✅" : "❌"}</div>
              <h3 className="text-xl font-bold mb-2 text-white">
                {testResult.test_result?.success ? "Conexion Exitosa" : "Error de Conexion"}
              </h3>
              <p className="text-sm text-gray-400 mb-2">{testResult.message}</p>
              <p className="text-sm text-gray-300">
                Latencia: <strong>{testResult.test_result?.latency_ms}ms</strong> |
                Estado: <strong>{testResult.status}</strong>
              </p>
              {testResult.wizard_completed && (
                <div className="mt-4 p-3 rounded-lg border border-white/10 bg-white/5 text-sm text-gray-300">
                  Wizard completado. La conexion esta{" "}
                  <span className="font-bold text-white">{testResult.status === "activa" ? "ACTIVA en produccion" : "en modo testing"}</span>.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

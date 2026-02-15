"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
    fetch(`${API}/api/v1/portal5/templates`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setTemplates)
      .catch(() => {});
  }, []);

  const categoryColors: Record<string, string> = {
    erp: "bg-blue-100 text-blue-700",
    ecommerce: "bg-green-100 text-green-700",
    contabilidad: "bg-purple-100 text-purple-700",
    custom: "bg-gray-100 text-gray-700",
    pos: "bg-orange-100 text-orange-700",
  };

  const handleStep1 = async () => {
    if (!selectedTemplate || !projectId || !connName) {
      setError("Complete todos los campos requeridos");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/v1/portal5/wizard/start`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          name: connName,
          environment,
          project_id: projectId,
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
      const res = await fetch(`${API}/api/v1/portal5/wizard/${connectionId}/credentials`, {
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
      const res = await fetch(`${API}/api/v1/portal5/wizard/${connectionId}/mapping`, {
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
      const res = await fetch(`${API}/api/v1/portal5/wizard/${connectionId}/webhooks`, {
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
      const res = await fetch(`${API}/api/v1/portal5/wizard/${connectionId}/sync`, {
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
      const res = await fetch(`${API}/api/v1/portal5/wizard/${connectionId}/test`, {
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Wizard de Integración</h1>

      {/* Progress steps */}
      <div className="flex items-center mb-8">
        {STEP_NAMES.map((name, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
              i < step ? "bg-green-500 text-white"
                : i === step ? "bg-aida-accent text-white"
                : "bg-gray-200 text-gray-500"
            }`}>{i < step ? "✓" : i + 1}</div>
            <span className={`ml-2 text-xs hidden lg:block ${i === step ? "text-aida-accent font-semibold" : "text-gray-400"}`}>
              {name}
            </span>
            {i < STEP_NAMES.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i < step ? "bg-green-500" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      {/* Step 0: Select template */}
      {step === 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID del Proyecto *</label>
              <input value={projectId} onChange={e => setProjectId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="UUID del proyecto" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Conexión *</label>
              <input value={connName} onChange={e => setConnName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Ej: Odoo Empresa XYZ" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entorno</label>
            <select value={environment} onChange={e => setEnvironment(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm">
              <option value="sandbox">Sandbox</option>
              <option value="staging">Staging</option>
              <option value="production">Producción</option>
            </select>
          </div>

          <h3 className="font-semibold text-gray-700">Seleccione el sistema a integrar:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(t => (
              <button key={t.id} onClick={() => setSelectedTemplate(t)}
                className={`text-left p-4 rounded-xl border-2 transition ${
                  selectedTemplate?.id === t.id
                    ? "border-aida-accent bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">{t.name}</span>
                  {t.is_official && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Oficial</span>}
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">{t.description}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${categoryColors[t.category] || "bg-gray-100 text-gray-700"}`}>
                    {t.category}
                  </span>
                  <div className="flex gap-1">
                    {t.supports_sync && <span className="text-xs text-gray-400">sync</span>}
                    {t.supports_webhook && <span className="text-xs text-gray-400">webhook</span>}
                    {t.supports_realtime && <span className="text-xs text-gray-400">realtime</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <button onClick={handleStep1} disabled={loading || !selectedTemplate}
            className="bg-aida-accent text-white px-6 py-2.5 rounded-lg font-medium hover:bg-aida-primary transition disabled:opacity-50">
            {loading ? "Creando..." : "Siguiente →"}
          </button>
        </div>
      )}

      {/* Step 1: Credentials */}
      {step === 1 && authConfig && (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
            {authConfig.description || "Configure las credenciales de conexión al sistema externo."}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL del Sistema *</label>
            <input value={systemUrl} onChange={e => setSystemUrl(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" placeholder={authConfig.fields?.[0]?.placeholder || "https://..."} />
          </div>
          {authConfig.fields?.map((field: any) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{field.label} {field.required && "*"}</label>
              <input type={field.type === "password" ? "password" : "text"}
                value={credentials[field.name] || ""}
                onChange={e => setCredentials({ ...credentials, [field.name]: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder={field.placeholder || ""} />
            </div>
          ))}
          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="border px-4 py-2 rounded-lg text-sm">← Atrás</button>
            <button onClick={handleStep2} disabled={loading}
              className="bg-aida-accent text-white px-6 py-2.5 rounded-lg font-medium hover:bg-aida-primary transition disabled:opacity-50">
              {loading ? "Guardando..." : "Siguiente →"}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Field mapping */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-green-50 p-4 rounded-lg text-sm text-green-800">
            El mapeo de campos viene pre-configurado según el template. Puede personalizarlo si es necesario.
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-xs overflow-auto max-h-64">{JSON.stringify(currentMapping, null, 2)}</pre>
          </div>
          <p className="text-sm text-gray-500">El mapeo por defecto es adecuado para la mayoría de instalaciones. Modifique solo si su sistema tiene campos personalizados.</p>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="border px-4 py-2 rounded-lg text-sm">← Atrás</button>
            <button onClick={handleStep3} disabled={loading}
              className="bg-aida-accent text-white px-6 py-2.5 rounded-lg font-medium hover:bg-aida-primary transition disabled:opacity-50">
              {loading ? "Guardando..." : "Siguiente →"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Webhooks */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-purple-50 p-4 rounded-lg text-sm text-purple-800">
            Configure webhooks para recibir notificaciones cuando se emitan o anulen documentos fiscales.
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL del Webhook (opcional)</label>
            <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="https://su-sistema.com/webhook/aida" />
          </div>
          {webhookUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Eventos a escuchar:</label>
              <div className="grid grid-cols-2 gap-2">
                {["document.emitted", "document.voided", "document.updated", "control_number.assigned", "control_number.low",
                  "sync.completed", "sync.failed", "integration.error"].map(evt => (
                  <label key={evt} className="flex items-center gap-2 text-sm">
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
            <button onClick={() => setStep(2)} className="border px-4 py-2 rounded-lg text-sm">← Atrás</button>
            <button onClick={handleStep4} disabled={loading}
              className="bg-aida-accent text-white px-6 py-2.5 rounded-lg font-medium hover:bg-aida-primary transition disabled:opacity-50">
              {loading ? "Guardando..." : "Siguiente →"}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Sync config */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="bg-orange-50 p-4 rounded-lg text-sm text-orange-800">
            Configure la sincronización automática para importar documentos del sistema externo.
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={syncEnabled} onChange={e => setSyncEnabled(e.target.checked)}
              className="w-5 h-5 rounded" />
            <span className="font-medium">Habilitar sincronización automática</span>
          </label>
          {syncEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Intervalo (segundos)</label>
              <select value={syncInterval} onChange={e => setSyncInterval(Number(e.target.value))}
                className="border rounded-lg px-3 py-2 text-sm">
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
            <button onClick={() => setStep(3)} className="border px-4 py-2 rounded-lg text-sm">← Atrás</button>
            <button onClick={handleStep5} disabled={loading}
              className="bg-aida-accent text-white px-6 py-2.5 rounded-lg font-medium hover:bg-aida-primary transition disabled:opacity-50">
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
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                <div className="text-4xl mb-3">🔌</div>
                <h3 className="text-lg font-semibold mb-2">Listo para probar la conexión</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Se verificará la conectividad con el sistema externo usando las credenciales configuradas.
                </p>
                <label className="flex items-center justify-center gap-2 mb-4 cursor-pointer">
                  <input type="checkbox" checked={activate} onChange={e => setActivate(e.target.checked)}
                    className="w-4 h-4 rounded" />
                  <span className="text-sm font-medium">Activar en producción si el test es exitoso</span>
                </label>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(4)} className="border px-4 py-2 rounded-lg text-sm">← Atrás</button>
                <button onClick={handleStep6} disabled={loading}
                  className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50">
                  {loading ? "Probando..." : "Ejecutar Test"}
                </button>
              </div>
            </>
          ) : (
            <div className={`border-2 rounded-xl p-8 text-center ${
              testResult.test_result?.success ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"
            }`}>
              <div className="text-5xl mb-3">{testResult.test_result?.success ? "✅" : "❌"}</div>
              <h3 className="text-xl font-bold mb-2">
                {testResult.test_result?.success ? "Conexión Exitosa" : "Error de Conexión"}
              </h3>
              <p className="text-sm text-gray-600 mb-2">{testResult.message}</p>
              <p className="text-sm">
                Latencia: <strong>{testResult.test_result?.latency_ms}ms</strong> |
                Estado: <strong>{testResult.status}</strong>
              </p>
              {testResult.wizard_completed && (
                <div className="mt-4 p-3 bg-white rounded-lg text-sm">
                  Wizard completado. La conexión está{" "}
                  <span className="font-bold">{testResult.status === "activa" ? "ACTIVA en producción" : "en modo testing"}</span>.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

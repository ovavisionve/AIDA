"use client";

import { useState, useEffect, useRef } from "react";

interface Template {
  id: string;
  name: string;
  code: string;
  description: string;
  document_types: string[];
  preview_image_url: string | null;
  is_default: boolean;
  layout_config: Record<string, string>;
}

interface Preferences {
  [docType: string]: {
    template_id: string;
    template_name: string;
    template_code: string;
  };
}

interface BannerInfo {
  id: string;
  document_type: string;
  position: string;
  url: string;
}

const DOC_TYPES = [
  { key: "factura", label: "Facturas" },
  { key: "nota_credito", label: "Notas de Credito" },
  { key: "nota_debito", label: "Notas de Debito" },
  { key: "guia_despacho", label: "Guias de Despacho" },
  { key: "retencion", label: "Retenciones" },
];

export default function TemplateSelector({ token }: { token: string }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [preferences, setPreferences] = useState<Preferences>({});
  const [selectedDocType, setSelectedDocType] = useState("factura");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Logo & Banner state
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [banners, setBanners] = useState<BannerInfo[]>([]);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const authOnly = { Authorization: `Bearer ${token}` };

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tplRes, prefRes, bannerRes, profileRes] = await Promise.all([
        fetch(`${apiUrl}/templates/`, { headers }),
        fetch(`${apiUrl}/templates/preferences/me`, { headers }),
        fetch(`${apiUrl}/uploads/banners`, { headers: authOnly }),
        fetch(`${apiUrl}/users/me/profile`, { headers: authOnly }),
      ]);
      if (tplRes.ok) setTemplates(await tplRes.json());
      if (prefRes.ok) setPreferences(await prefRes.json());
      if (bannerRes.ok) {
        const bannerData = await bannerRes.json();
        setBanners(Array.isArray(bannerData) ? bannerData : []);
      }
      if (profileRes.ok) {
        const profile = await profileRes.json();
        if (profile.client?.logo_url) setLogoUrl(profile.client.logo_url);
      }
    } catch {
      setError("Error al cargar datos");
    }
    setLoading(false);
  };

  const showMsg = (msg: string, isError = false) => {
    if (isError) { setError(msg); setTimeout(() => setError(""), 4000); }
    else { setMessage(msg); setTimeout(() => setMessage(""), 4000); }
  };

  const selectTemplate = async (templateId: string) => {
    setSaving(true);
    try {
      const res = await fetch(
        `${apiUrl}/templates/preference?document_type=${selectedDocType}&template_id=${templateId}`,
        { method: "POST", headers }
      );
      if (res.ok) {
        const data = await res.json();
        setPreferences((prev) => ({
          ...prev,
          [selectedDocType]: { template_id: templateId, template_name: data.template_name, template_code: "" },
        }));
        showMsg("Plantilla seleccionada correctamente");
      }
    } catch {
      showMsg("Error al guardar preferencia", true);
    }
    setSaving(false);
  };

  const openPreview = async (templateId: string) => {
    try {
      const res = await fetch(`${apiUrl}/templates/${templateId}/preview-pdf`, { headers: authOnly });
      if (res.ok) {
        const blob = await res.blob();
        window.open(URL.createObjectURL(blob), "_blank");
      } else {
        showMsg("Error al generar vista previa", true);
      }
    } catch {
      showMsg("Error de conexion", true);
    }
  };

  // ── Logo Upload ──
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { showMsg("Solo se permiten imagenes", true); return; }
    if (file.size > 2 * 1024 * 1024) { showMsg("Maximo 2 MB", true); return; }

    setUploadingLogo(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${apiUrl}/uploads/logo`, { method: "POST", headers: authOnly, body: form });
      if (res.ok) {
        const data = await res.json();
        setLogoUrl(data.url);
        showMsg("Logo subido correctamente");
      } else {
        const err = await res.json().catch(() => ({}));
        showMsg(err.detail || "Error al subir logo", true);
      }
    } catch {
      showMsg("Error de conexion", true);
    }
    setUploadingLogo(false);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  // ── Banner Upload ──
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { showMsg("Solo se permiten imagenes", true); return; }
    if (file.size > 2 * 1024 * 1024) { showMsg("Maximo 2 MB", true); return; }

    setUploadingBanner(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(
        `${apiUrl}/uploads/banner?document_type=todos&position=footer`,
        { method: "POST", headers: authOnly, body: form }
      );
      if (res.ok) {
        const data = await res.json();
        setBanners((prev) => [...prev.filter((b) => b.document_type !== "todos"), data]);
        showMsg("Banner subido correctamente");
      } else {
        const err = await res.json().catch(() => ({}));
        showMsg(err.detail || "Error al subir banner", true);
      }
    } catch {
      showMsg("Error de conexion", true);
    }
    setUploadingBanner(false);
    if (bannerInputRef.current) bannerInputRef.current.value = "";
  };

  const deleteBanner = async (bannerId: string) => {
    try {
      const res = await fetch(`${apiUrl}/uploads/banners/${bannerId}`, { method: "DELETE", headers: authOnly });
      if (res.ok) {
        setBanners((prev) => prev.filter((b) => b.id !== bannerId));
        showMsg("Banner eliminado");
      }
    } catch {
      showMsg("Error al eliminar banner", true);
    }
  };

  const currentPref = preferences[selectedDocType];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-aida-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">Plantillas de Documentos</h2>
        <p className="mt-1 text-sm text-gray-500">
          Personaliza el diseno de tus documentos fiscales: elige plantilla, sube tu logo y banner publicitario.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400">{error}</div>
      )}
      {message && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-sm text-emerald-400">{message}</div>
      )}

      {/* ═══ BRANDING: Logo & Banner ═══ */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Logo */}
        <div className="rounded-xl border border-white/10 bg-[#111827] p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Logo de Empresa</h3>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-white/20 bg-white/5 overflow-hidden">
              {logoUrl ? (
                <img src={`${apiUrl.replace("/api/v1", "")}${logoUrl}`} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-2">PNG, JPG o WebP. Maximo 2 MB.</p>
              <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="rounded-lg bg-aida-accent/10 border border-aida-accent/20 px-3 py-1.5 text-xs font-medium text-aida-cyan hover:bg-aida-accent/20 transition disabled:opacity-50"
              >
                {uploadingLogo ? "Subiendo..." : logoUrl ? "Cambiar logo" : "Subir logo"}
              </button>
            </div>
          </div>
        </div>

        {/* Banner */}
        <div className="rounded-xl border border-white/10 bg-[#111827] p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Banner Publicitario</h3>
          {banners.length > 0 ? (
            <div className="space-y-2">
              {banners.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <span className="text-xs text-gray-400 truncate">
                    {b.document_type === "todos" ? "Todos los documentos" : b.document_type} — {b.position}
                  </span>
                  <button onClick={() => deleteBanner(b.id)} className="text-xs text-red-400 hover:text-red-300 ml-2">Eliminar</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 mb-2">Aparece al pie de tus documentos. Ideal para publicidad o promociones.</p>
          )}
          <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
          <button
            onClick={() => bannerInputRef.current?.click()}
            disabled={uploadingBanner}
            className="mt-2 rounded-lg bg-aida-accent/10 border border-aida-accent/20 px-3 py-1.5 text-xs font-medium text-aida-cyan hover:bg-aida-accent/20 transition disabled:opacity-50"
          >
            {uploadingBanner ? "Subiendo..." : "Subir banner"}
          </button>
        </div>
      </div>

      {/* ═══ TEMPLATE SELECTION ═══ */}
      {/* Document type tabs */}
      <div className="flex flex-wrap gap-2">
        {DOC_TYPES.map((dt) => (
          <button
            key={dt.key}
            onClick={() => setSelectedDocType(dt.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              selectedDocType === dt.key
                ? "bg-aida-accent/10 text-aida-cyan border border-aida-accent/20"
                : "bg-[#111827] text-gray-500 border border-white/10 hover:border-aida-accent/30 hover:text-gray-300"
            }`}
          >
            {dt.label}
            {preferences[dt.key] && (
              <span className="ml-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />
            )}
          </button>
        ))}
      </div>

      {/* Current selection */}
      {currentPref && (
        <div className="rounded-lg bg-aida-accent/10 border border-aida-accent/20 px-4 py-3 text-sm">
          <span className="text-aida-accent font-medium">Plantilla actual:</span>{" "}
          <span className="text-white">{currentPref.template_name}</span>
        </div>
      )}

      {/* Template grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {templates.map((tpl) => {
          const isSelected = currentPref?.template_id === tpl.id;
          const layoutConfig = tpl.layout_config || {};
          const headerColor = (layoutConfig.header_color as string) || "#4a6741";
          const accentColor = (layoutConfig.accent_color as string) || "#5c8a4f";
          const headerBg = (layoutConfig.header_bg as string) || "#e8f0e5";
          const tableHeaderBg = (layoutConfig.table_header_bg as string) || "#4a6741";
          const style = (layoutConfig.style as string) || "formal";

          return (
            <div
              key={tpl.id}
              className={`group relative rounded-xl border-2 bg-[#111827] overflow-hidden transition-all duration-300 hover:bg-white/10 ${
                isSelected
                  ? "border-aida-accent shadow-md shadow-aida-accent/15"
                  : "border-white/10 hover:border-aida-accent/50"
              }`}
            >
              {/* Color preview header */}
              <div
                className="h-24 relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${headerColor}, ${accentColor})` }}
              >
                {/* Mini document preview */}
                <div className="absolute inset-2 rounded bg-white/95 shadow-sm p-2">
                  <div className="flex gap-1.5">
                    <div className="w-6 h-5 rounded" style={{ backgroundColor: headerBg }} />
                    <div className="flex-1 space-y-1">
                      <div className="h-1.5 w-full rounded" style={{ backgroundColor: headerColor, opacity: 0.4 }} />
                      <div className="h-1 w-3/4 rounded bg-slate-200" />
                    </div>
                    <div className="w-10 rounded" style={{ backgroundColor: headerColor }}>
                      <div className="h-1.5 mt-1 mx-1 rounded bg-white/50" />
                      <div className="h-1 mt-0.5 mx-1 rounded bg-white/30" />
                    </div>
                  </div>
                  <div className="mt-1.5 space-y-0.5">
                    <div className="h-1 w-full rounded" style={{ backgroundColor: tableHeaderBg, opacity: 0.5 }} />
                    <div className="h-1 w-full rounded bg-slate-100" />
                    <div className="h-1 w-full rounded bg-slate-50" />
                    <div className="h-1 w-full rounded bg-slate-100" />
                  </div>
                </div>
                {isSelected && (
                  <div className="absolute top-1 right-1 rounded-full bg-aida-accent p-1">
                    <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {tpl.is_default && (
                  <div className="absolute bottom-1 left-1 rounded bg-white/90 px-1.5 py-0.5 text-[9px] font-medium text-slate-600">
                    Por defecto
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="font-semibold text-sm text-white">{tpl.name}</h3>
                <p className="mt-1 text-[11px] text-gray-500 line-clamp-2">{tpl.description}</p>

                {/* Style badge */}
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: headerColor }} />
                  <span className="text-[10px] text-gray-500 capitalize">{style}</span>
                </div>

                {/* Actions */}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => openPreview(tpl.id)}
                    className="flex-1 rounded-lg border border-white/10 px-2 py-1.5 text-[11px] font-medium text-gray-300 hover:bg-white/5 transition"
                  >
                    Vista previa
                  </button>
                  <button
                    onClick={() => selectTemplate(tpl.id)}
                    disabled={saving || isSelected}
                    className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition ${
                      isSelected
                        ? "bg-emerald-500/10 text-emerald-400 cursor-default"
                        : "bg-aida-accent text-white hover:bg-aida-accent/80 shadow-sm"
                    }`}
                  >
                    {isSelected ? "Seleccionada" : saving ? "..." : "Usar esta"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No hay plantillas disponibles</p>
          <p className="text-sm mt-1">Contacta al administrador para crear plantillas.</p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "../../lib/api";

export default function SettingsSection() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api("/admin/settings").then(r => r.json()).then(d => setSettings(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = (key: string, value: string) => {
    setEditing(key);
    setEditValue(value);
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    const res = await api(`/admin/settings/${editing}`, { method: "PUT", body: JSON.stringify({ value: editValue }) });
    if (res.ok) {
      setEditing(null);
      load();
    }
    setSaving(false);
  };

  const grouped = settings.reduce((acc: any, s: any) => {
    const cat = s.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const categoryLabels: Record<string, string> = {
    empresa: "Empresa",
    facturacion: "Facturacion",
    seguridad: "Seguridad",
    email: "Email",
    almacenamiento: "Almacenamiento",
    general: "General",
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-aida-accent border-t-transparent" /></div>
      ) : settings.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm text-center">
          <p className="text-gray-500">No hay configuraciones del sistema. Ejecute el seed de datos iniciales desde la base de datos.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, items]: [string, any]) => (
          <div key={cat} className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <span className="h-2 w-2 rounded-full bg-aida-accent" />
              {categoryLabels[cat] || cat}
            </h3>
            <div className="divide-y divide-white/5">
              {items.map((s: any) => (
                <div key={s.key} className="flex items-center justify-between py-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-300">{s.key}</p>
                    {s.description && <p className="text-xs text-gray-500">{s.description}</p>}
                  </div>
                  {editing === s.key ? (
                    <div className="flex items-center gap-2">
                      <input value={editValue} onChange={(e) => setEditValue(e.target.value)}
                        className="rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none focus:ring-1 focus:ring-aida-accent/30" />
                      <button onClick={saveEdit} disabled={saving} className="rounded bg-aida-accent px-2 py-1 text-xs text-white hover:bg-aida-accent/80">
                        {saving ? "..." : "Guardar"}
                      </button>
                      <button onClick={() => setEditing(null)} className="rounded border border-white/10 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/5">Cancelar</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-white/10 px-2 py-1 font-mono text-xs text-gray-300">{s.value}</span>
                      <button onClick={() => startEdit(s.key, s.value)} className="rounded px-2 py-1 text-xs text-aida-accent hover:bg-aida-accent/10">Editar</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

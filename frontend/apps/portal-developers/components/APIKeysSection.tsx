"use client";

import { useState, useEffect } from "react";
import { api } from "../lib/api";

export default function APIKeysSection() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = () => {
    setLoading(true);
    api("/developers/api-keys").then(r => r.json()).then(d => setKeys(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    const res = await api("/developers/api-keys", {
      method: "POST",
      body: JSON.stringify({ name, description: desc || null }),
    });
    if (res.ok) {
      const data = await res.json();
      setNewKey(data.full_key);
      setShowCreate(false);
      setName("");
      setDesc("");
      load();
    }
  };

  const revoke = async (id: string) => {
    await api(`/developers/api-keys/${id}`, { method: "DELETE" });
    load();
  };

  const copyKey = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Keys</h2>
          <p className="mt-1 text-gray-400">Gestione sus llaves de acceso a la API fiscal</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="rounded-lg bg-aida-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-aida-accent/80">
          + Nueva API Key
        </button>
      </div>

      {newKey && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
          <p className="mb-2 text-sm font-medium text-green-400">API Key creada exitosamente. Copiela ahora, no se mostrara nuevamente.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-black/30 p-2 font-mono text-sm text-green-300">{newKey}</code>
            <button onClick={copyKey} className="rounded bg-green-600 px-3 py-2 text-xs text-white hover:bg-green-700">
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
          <button onClick={() => setNewKey(null)} className="mt-2 text-xs text-gray-400 hover:text-white">Cerrar</button>
        </div>
      )}

      {showCreate && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 font-semibold">Crear API Key</h3>
          <div className="space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre (ej: Produccion, Testing)"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none" />
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descripcion (opcional)"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 focus:border-aida-accent focus:outline-none" />
            <div className="flex gap-2">
              <button onClick={create} disabled={!name.trim()} className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50">Crear</button>
              <button onClick={() => setShowCreate(false)} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-white/5">
        {loading ? (
          <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-aida-accent border-t-transparent" /></div>
        ) : keys.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">No tiene API keys. Cree una para comenzar a integrar.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {keys.map((k: any) => (
              <div key={k.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{k.name}</p>
                  <p className="text-xs text-gray-500">{k.description || "Sin descripcion"}</p>
                  <p className="mt-1 font-mono text-xs text-gray-400">{k.key_prefix}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${k.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                    {k.is_active ? "Activa" : "Revocada"}
                  </span>
                  <span className="text-xs text-gray-500">{new Date(k.created_at).toLocaleDateString("es-VE")}</span>
                  {k.is_active && (
                    <button onClick={() => revoke(k.id)} className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-500/10">Revocar</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

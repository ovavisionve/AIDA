"use client";

import { useState, useEffect } from "react";
import { api } from "../../lib/api";

export default function RolesSection() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [rolePerms, setRolePerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api("/admin/roles").then(r => r.json()),
      api("/admin/permissions").then(r => r.json()),
    ]).then(([r, p]) => {
      setRoles(Array.isArray(r) ? r : []);
      setPermissions(Array.isArray(p) ? p : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const loadRolePerms = async (roleId: string) => {
    setSelectedRole(roleId);
    const res = await api(`/admin/roles/${roleId}/permissions`);
    const data = await res.json();
    setRolePerms(Array.isArray(data) ? data : []);
  };

  const seed = async () => {
    setSeeding(true);
    setSeedResult(null);
    const res = await api("/admin/seed", { method: "POST" });
    const data = await res.json();
    setSeedResult(data.message || JSON.stringify(data));
    const [r, p] = await Promise.all([
      api("/admin/roles").then(r => r.json()),
      api("/admin/permissions").then(r => r.json()),
    ]);
    setRoles(Array.isArray(r) ? r : []);
    setPermissions(Array.isArray(p) ? p : []);
    setSeeding(false);
  };

  const grouped = permissions.reduce((acc: any, p: any) => {
    const mod = p.module || "general";
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={seed} disabled={seeding} className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">
          {seeding ? "Ejecutando seed..." : "Seed Roles y Permisos"}
        </button>
        {seedResult && <span className="text-sm text-green-600">{seedResult}</span>}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">Roles ({roles.length})</h3>
            {roles.length === 0 ? (
              <p className="text-sm text-gray-400">No hay roles. Ejecute Seed para crear los roles por defecto.</p>
            ) : (
              <div className="space-y-2">
                {roles.map((r: any) => (
                  <button key={r.id} onClick={() => loadRolePerms(r.id)}
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left text-sm transition ${selectedRole === r.id ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"}`}>
                    <div>
                      <p className="font-medium text-gray-800">{r.display_name}</p>
                      <p className="text-xs text-gray-500">{r.description || r.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${r.level === "platform" ? "bg-purple-100 text-purple-700" : r.level === "client" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                        {r.level}
                      </span>
                      {r.is_system && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">sistema</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            {selectedRole ? (
              <>
                <h3 className="mb-4 text-lg font-semibold text-gray-800">
                  Permisos del rol ({rolePerms.length})
                </h3>
                {rolePerms.length === 0 ? (
                  <p className="text-sm text-gray-400">Este rol no tiene permisos asignados</p>
                ) : (
                  <div className="max-h-96 space-y-1 overflow-y-auto">
                    {rolePerms.map((p: any) => (
                      <div key={p.code} className="flex items-center justify-between rounded border px-3 py-2 text-xs">
                        <span className="font-medium text-gray-700">{p.name}</span>
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-500">{p.code}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <h3 className="mb-4 text-lg font-semibold text-gray-800">
                  Todos los permisos ({permissions.length})
                </h3>
                {Object.keys(grouped).length === 0 ? (
                  <p className="text-sm text-gray-400">No hay permisos. Ejecute Seed primero.</p>
                ) : (
                  <div className="max-h-96 space-y-4 overflow-y-auto">
                    {Object.entries(grouped).map(([mod, perms]: [string, any]) => (
                      <div key={mod}>
                        <h4 className="mb-1 text-xs font-semibold uppercase text-gray-500">{mod}</h4>
                        <div className="space-y-1">
                          {perms.map((p: any) => (
                            <div key={p.code} className="flex items-center justify-between rounded bg-gray-50 px-2 py-1.5 text-xs">
                              <span className="text-gray-700">{p.name}</span>
                              <span className="font-mono text-gray-400">{p.code}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

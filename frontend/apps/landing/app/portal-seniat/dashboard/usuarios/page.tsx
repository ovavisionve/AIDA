"use client";

import { useState } from "react";

interface Usuario {
  id: string;
  nombre: string;
  cedula: string;
  cargo: string;
  rol: "auditor" | "supervisor" | "gerente";
  email: string;
  estado: "activo" | "inactivo" | "suspendido";
  ultimoAcceso: string;
  regionAsignada: string;
  creadoPor: string;
  fechaCreacion: string;
}

const mockUsers: Usuario[] = [
  { id: "USR-001", nombre: "María Elena Rodríguez", cedula: "V-15.234.567", cargo: "Auditor Fiscal Senior", rol: "auditor", email: "m.rodriguez@seniat.gob.ve", estado: "activo", ultimoAcceso: "17/02/2026 08:45", regionAsignada: "Región Capital", creadoPor: "José Hernández", fechaCreacion: "15/01/2025" },
  { id: "USR-002", nombre: "Carlos Alberto Pérez", cedula: "V-18.765.432", cargo: "Auditor Fiscal", rol: "auditor", email: "c.perez@seniat.gob.ve", estado: "activo", ultimoAcceso: "16/02/2026 14:20", regionAsignada: "Región Central", creadoPor: "José Hernández", fechaCreacion: "22/03/2025" },
  { id: "USR-003", nombre: "Ana María González", cedula: "V-20.123.456", cargo: "Supervisor de Auditoría", rol: "supervisor", email: "a.gonzalez@seniat.gob.ve", estado: "activo", ultimoAcceso: "17/02/2026 09:10", regionAsignada: "Región Capital + Central", creadoPor: "José Hernández", fechaCreacion: "10/01/2025" },
  { id: "USR-004", nombre: "José Antonio Hernández", cedula: "V-12.345.678", cargo: "Gerente de Auditoría Digital", rol: "gerente", email: "j.hernandez@seniat.gob.ve", estado: "activo", ultimoAcceso: "17/02/2026 07:30", regionAsignada: "Nacional", creadoPor: "Sistema", fechaCreacion: "01/01/2025" },
  { id: "USR-005", nombre: "Luis Fernando Ramírez", cedula: "V-19.876.543", cargo: "Auditor Fiscal", rol: "auditor", email: "l.ramirez@seniat.gob.ve", estado: "inactivo", ultimoAcceso: "28/01/2026 16:00", regionAsignada: "Región Oriente", creadoPor: "Ana González", fechaCreacion: "05/06/2025" },
  { id: "USR-006", nombre: "Carmen Teresa Díaz", cedula: "V-16.543.210", cargo: "Auditor Fiscal Senior", rol: "auditor", email: "c.diaz@seniat.gob.ve", estado: "suspendido", ultimoAcceso: "10/01/2026 09:00", regionAsignada: "Región Zulia", creadoPor: "José Hernández", fechaCreacion: "15/04/2025" },
];

const rolBadge: Record<string, { label: string; classes: string }> = {
  auditor: { label: "Auditor", classes: "bg-aida-cyan/10 text-aida-cyan border-aida-cyan/20" },
  supervisor: { label: "Supervisor", classes: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  gerente: { label: "Gerente", classes: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
};

const estadoBadge: Record<string, { label: string; classes: string }> = {
  activo: { label: "Activo", classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  inactivo: { label: "Inactivo", classes: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
  suspendido: { label: "Suspendido", classes: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export default function UsuariosPage() {
  const [search, setSearch] = useState("");
  const [filterRol, setFilterRol] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create user form
  const [formNombre, setFormNombre] = useState("");
  const [formCedula, setFormCedula] = useState("");
  const [formCargo, setFormCargo] = useState("");
  const [formRol, setFormRol] = useState("auditor");
  const [formEmail, setFormEmail] = useState("");
  const [formRegion, setFormRegion] = useState("");

  const filtered = mockUsers.filter((u) => {
    if (filterRol && u.rol !== filterRol) return false;
    if (filterEstado && u.estado !== filterEstado) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!u.nombre.toLowerCase().includes(q) && !u.cedula.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const activos = mockUsers.filter((u) => u.estado === "activo").length;
  const totalAuditores = mockUsers.filter((u) => u.rol === "auditor").length;
  const totalSupervisores = mockUsers.filter((u) => u.rol === "supervisor").length;

  const handleCreate = () => {
    alert(
      `Creando usuario SENIAT (demo):\n\n` +
      `Nombre: ${formNombre}\n` +
      `Cédula: ${formCedula}\n` +
      `Cargo: ${formCargo}\n` +
      `Rol: ${formRol}\n` +
      `Email: ${formEmail}\n` +
      `Región: ${formRegion}\n\n` +
      `En producción, se enviaría una invitación por correo con credenciales temporales.`
    );
    setShowCreateModal(false);
    setFormNombre(""); setFormCedula(""); setFormCargo(""); setFormRol("auditor"); setFormEmail(""); setFormRegion("");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative w-full max-w-lg bg-[#0d1320] border border-white/10 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div>
                <h3 className="text-lg font-bold text-white">Crear Usuario SENIAT</h3>
                <p className="text-xs text-gray-500 mt-0.5">Nuevo usuario para el portal de auditoría</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block mb-1">Nombre completo *</label>
                  <input type="text" value={formNombre} onChange={(e) => setFormNombre(e.target.value)} placeholder="María Elena Rodríguez" className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder-gray-600 focus:border-aida-cyan/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block mb-1">Cédula *</label>
                  <input type="text" value={formCedula} onChange={(e) => setFormCedula(e.target.value)} placeholder="V-12.345.678" className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder-gray-600 focus:border-aida-cyan/50 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block mb-1">Cargo *</label>
                  <input type="text" value={formCargo} onChange={(e) => setFormCargo(e.target.value)} placeholder="Auditor Fiscal" className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder-gray-600 focus:border-aida-cyan/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block mb-1">Rol *</label>
                  <select value={formRol} onChange={(e) => setFormRol(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:border-aida-cyan/50 focus:outline-none appearance-none cursor-pointer">
                    <option value="auditor" className="bg-gray-900">Auditor</option>
                    <option value="supervisor" className="bg-gray-900">Supervisor</option>
                    <option value="gerente" className="bg-gray-900">Gerente</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block mb-1">Email institucional *</label>
                <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="usuario@seniat.gob.ve" className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder-gray-600 focus:border-aida-cyan/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block mb-1">Región asignada *</label>
                <select value={formRegion} onChange={(e) => setFormRegion(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:border-aida-cyan/50 focus:outline-none appearance-none cursor-pointer">
                  <option value="" className="bg-gray-900">Seleccionar región</option>
                  <option value="Región Capital" className="bg-gray-900">Región Capital (D.C.)</option>
                  <option value="Región Central" className="bg-gray-900">Región Central (Aragua, Carabobo, Cojedes)</option>
                  <option value="Región Los Llanos" className="bg-gray-900">Región Los Llanos (Barinas, Portuguesa, Apure, Guárico)</option>
                  <option value="Región Oriente" className="bg-gray-900">Región Oriente (Anzoátegui, Sucre, Monagas, N. Esparta)</option>
                  <option value="Región Zulia" className="bg-gray-900">Región Zulia</option>
                  <option value="Región Los Andes" className="bg-gray-900">Región Los Andes (Mérida, Táchira, Trujillo)</option>
                  <option value="Región Guayana" className="bg-gray-900">Región Guayana (Bolívar, Amazonas, Delta Amacuro)</option>
                  <option value="Nacional" className="bg-gray-900">Nacional (todas las regiones)</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <p className="text-xs text-amber-400 font-medium">Al crear el usuario se enviará una invitación al email institucional con credenciales temporales. El usuario deberá cambiar su contraseña en el primer inicio de sesión.</p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 border border-white/10 hover:bg-white/5 transition-all">
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!formNombre || !formCedula || !formEmail || !formRegion}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-aida-accent to-aida-cyan text-sm font-semibold text-white hover:shadow-lg hover:shadow-aida-accent/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Crear Usuario
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Gestión de Usuarios</h1>
          <p className="text-sm text-gray-400 mt-1">Administrar cuentas de auditores y supervisores SENIAT</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-aida-accent to-aida-cyan text-sm font-semibold text-white hover:shadow-lg hover:shadow-aida-accent/25 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Crear Usuario
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Usuarios", value: mockUsers.length, color: "from-aida-accent to-aida-cyan" },
          { label: "Activos", value: activos, color: "from-emerald-500 to-cyan-500" },
          { label: "Auditores", value: totalAuditores, color: "from-cyan-500 to-blue-500" },
          { label: "Supervisores", value: totalSupervisores, color: "from-purple-500 to-indigo-500" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <span className="text-sm font-bold text-white">{stat.value}</span>
              </div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, cédula, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder-gray-500 focus:border-aida-cyan/50 focus:outline-none"
          />
        </div>
        <select value={filterRol} onChange={(e) => setFilterRol(e.target.value)} className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:border-aida-cyan/50 focus:outline-none appearance-none cursor-pointer">
          <option value="" className="bg-gray-900">Todos los roles</option>
          <option value="auditor" className="bg-gray-900">Auditor</option>
          <option value="supervisor" className="bg-gray-900">Supervisor</option>
          <option value="gerente" className="bg-gray-900">Gerente</option>
        </select>
        <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:border-aida-cyan/50 focus:outline-none appearance-none cursor-pointer">
          <option value="" className="bg-gray-900">Todos los estados</option>
          <option value="activo" className="bg-gray-900">Activo</option>
          <option value="inactivo" className="bg-gray-900">Inactivo</option>
          <option value="suspendido" className="bg-gray-900">Suspendido</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Usuario</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Cédula</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Rol</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Región</th>
                <th className="text-center py-3 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden xl:table-cell">Último Acceso</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => {
                const rol = rolBadge[user.rol];
                const estado = estadoBadge[user.estado];
                return (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${user.rol === "gerente" ? "from-amber-500 to-orange-500" : user.rol === "supervisor" ? "from-purple-500 to-indigo-500" : "from-aida-accent to-aida-cyan"} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                          {user.nombre.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{user.nombre}</p>
                          <p className="text-[10px] text-gray-500 truncate">{user.cargo} — {user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5 font-mono text-xs text-gray-400 hidden sm:table-cell">{user.cedula}</td>
                    <td className="py-3 px-5 hidden md:table-cell">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${rol.classes}`}>{rol.label}</span>
                    </td>
                    <td className="py-3 px-5 text-xs text-gray-400 hidden lg:table-cell">{user.regionAsignada}</td>
                    <td className="py-3 px-5 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${estado.classes}`}>{estado.label}</span>
                    </td>
                    <td className="py-3 px-5 text-xs text-gray-500 font-mono hidden xl:table-cell">{user.ultimoAcceso}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-white/5">
          <p className="text-xs text-gray-500">{filtered.length} usuario{filtered.length !== 1 && "s"} encontrados</p>
        </div>
      </div>

      <p className="text-[10px] text-gray-600 text-center pb-4">
        Datos de demostración — Ambiente de pruebas AIDA
      </p>
    </div>
  );
}

'use client';

import type { User } from '@/lib/types';

type Props = {
  users: User[];
  loading: boolean;
  currentUserId?: number;
  onToggleActive: (user: User) => void;
};

export default function UsersTable({ users, loading, currentUserId, onToggleActive }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Área / Rol</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-slate-500">Cargando…</td>
            </tr>
          )}
          {!loading && users.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-slate-500">Sin resultados</td>
            </tr>
          )}
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">{u.firstName} {u.lastName}</td>
              <td className="px-4 py-3 text-slate-600">{u.email}</td>
              <td className="px-4 py-3">
                <span className="rounded-md bg-brand-light px-2 py-0.5 text-xs font-medium text-brand">
                  {u.area}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {u.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  className="text-sm font-medium text-brand hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
                  disabled={u.id === currentUserId}
                  onClick={() => onToggleActive(u)}
                >
                  {u.isActive ? 'Desactivar' : 'Activar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

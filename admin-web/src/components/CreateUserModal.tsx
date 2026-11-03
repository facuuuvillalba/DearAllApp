'use client';

import { FormEvent, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import type { Role, User } from '@/lib/types';

type Props = {
  roles: Role[];
  onClose: () => void;
  onCreated: (user: User) => void;
};

export default function CreateUserModal({ roles, onClose, onCreated }: Props) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', roleId: '' });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (field: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const { user } = await api<{ user: User }>('/admin/users', {
        method: 'POST',
        body: { ...form, roleId: Number(form.roleId) },
      });
      onCreated(user);
    } catch (err) {
      if (err instanceof ApiError && err.details?.length) {
        setError(err.details.map((d) => `${d.field}: ${d.message}`).join(' · '));
      } else {
        setError(err instanceof Error ? err.message : 'No se pudo crear el usuario');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-user-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="create-user-title" className="text-lg font-semibold">Crear nuevo usuario</h2>
          <button onClick={onClose} aria-label="Cerrar" className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="firstName">Nombre</label>
              <input id="firstName" className="input" required value={form.firstName} onChange={set('firstName')} />
            </div>
            <div>
              <label className="label" htmlFor="lastName">Apellido</label>
              <input id="lastName" className="input" required value={form.lastName} onChange={set('lastName')} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="newEmail">Email</label>
            <input id="newEmail" type="email" className="input" required value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label className="label" htmlFor="newPassword">Contraseña temporal</label>
            <input
              id="newPassword"
              type="password"
              className="input"
              required
              minLength={8}
              autoComplete="new-password"
              value={form.password}
              onChange={set('password')}
            />
            <p className="mt-1 text-xs text-slate-500">Mínimo 8 caracteres, con letras y números.</p>
          </div>
          <div>
            <label className="label" htmlFor="roleId">Área / Rol</label>
            <select id="roleId" className="input" required value={form.roleId} onChange={set('roleId')}>
              <option value="" disabled>Selecciona un área…</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.description}</option>
              ))}
            </select>
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Creando…' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

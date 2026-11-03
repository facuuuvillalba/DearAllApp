'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import type { Group, Role } from '@/lib/types';

const EMPTY_FORM = { name: '', description: '', isAnnouncementOnly: false, targetRoleId: '' };

export default function ChannelsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [g, r] = await Promise.all([
        api<{ groups: Group[] }>('/groups'),
        api<{ roles: Role[] }>('/admin/roles'),
      ]);
      setGroups(g.groups);
      setRoles(r.roles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar canales');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      await api('/admin/groups', {
        method: 'POST',
        body: {
          name: form.name,
          description: form.description,
          isAnnouncementOnly: form.isAnnouncementOnly,
          targetRoleId: form.targetRoleId ? Number(form.targetRoleId) : null,
        },
      });
      setSuccess(`Canal "${form.name}" creado correctamente`);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.details?.length) {
        setError(err.details.map((d) => `${d.field}: ${d.message}`).join(' · '));
      } else {
        setError(err instanceof Error ? err.message : 'No se pudo crear el canal');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="grid gap-8 lg:grid-cols-5">
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
        <h1 className="text-lg font-semibold">Nuevo canal</h1>

        <div>
          <label className="label" htmlFor="name">Nombre</label>
          <input id="name" className="input" required minLength={2} value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="description">Descripción</label>
          <textarea id="description" rows={3} className="input" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="targetRole">Visible para</label>
          <select id="targetRole" className="input" value={form.targetRoleId}
            onChange={(e) => setForm({ ...form, targetRoleId: e.target.value })}>
            <option value="">Todos los empleados</option>
            {roles.filter((r) => r.name !== 'Admin').map((r) => (
              <option key={r.id} value={r.id}>{r.description}</option>
            ))}
          </select>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand" checked={form.isAnnouncementOnly}
            onChange={(e) => setForm({ ...form, isAnnouncementOnly: e.target.checked })} />
          <span>
            <span className="block text-sm font-medium text-slate-800">Canal de anuncios (solo lectura)</span>
            <span className="block text-xs text-slate-500">
              Todos los miembros leen; solo RRHH y Admin pueden publicar.
            </span>
          </span>
        </label>

        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {success && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}

        <button className="btn-primary w-full" disabled={saving}>
          {saving ? 'Creando…' : 'Crear canal'}
        </button>
      </form>

      <div className="lg:col-span-3">
        <h2 className="mb-3 text-lg font-semibold">Canales existentes</h2>
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {groups.map((g) => (
            <li key={g.id} className="flex items-start justify-between gap-4 px-4 py-3">
              <div>
                <p className="font-medium text-slate-900">{g.name}</p>
                {g.description && <p className="text-sm text-slate-500">{g.description}</p>}
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-2">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {g.targetArea ?? 'Todos'}
                </span>
                {g.isAnnouncementOnly && (
                  <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Solo lectura
                  </span>
                )}
              </div>
            </li>
          ))}
          {groups.length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-500">Sin canales</li>}
        </ul>
      </div>
    </section>
  );
}

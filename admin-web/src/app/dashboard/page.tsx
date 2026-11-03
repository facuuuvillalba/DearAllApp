'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import type { Role, User } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import CreateUserModal from '@/components/CreateUserModal';
import UsersTable from '@/components/UsersTable';

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [u, r] = await Promise.all([
        api<{ users: User[] }>('/admin/users'),
        api<{ roles: Role[] }>('/admin/roles'),
      ]);
      setUsers(u.users);
      setRoles(r.roles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      `${u.firstName} ${u.lastName} ${u.email} ${u.area}`.toLowerCase().includes(q)
    );
  }, [users, search]);

  async function toggleActive(target: User) {
    try {
      const { user } = await api<{ user: User }>(`/admin/users/${target.id}`, {
        method: 'PATCH',
        body: { isActive: !target.isActive },
      });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? user : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el usuario');
    }
  }

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Usuarios</h1>
          <p className="text-sm text-slate-500">{users.length} empleados registrados</p>
        </div>
        <div className="flex gap-3">
          <input
            className="input w-64"
            placeholder="Buscar por nombre, email o área"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            + Nuevo usuario
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <UsersTable users={filtered} loading={loading} currentUserId={me?.id} onToggleActive={toggleActive} />

      {modalOpen && (
        <CreateUserModal
          roles={roles}
          onClose={() => setModalOpen(false)}
          onCreated={(created) => {
            setUsers((prev) => [...prev, created]);
            setModalOpen(false);
          }}
        />
      )}
    </section>
  );
}

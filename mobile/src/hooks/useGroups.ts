import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { groupsApi } from '@/api/endpoints';
import type { Group } from '@/api/types';

/** Carga los grupos autorizados del usuario; se refresca cada vez que la pantalla gana foco. */
export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    try {
      const { groups: data } = await groupsApi.list();
      setGroups(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los grupos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [fetchGroups])
  );

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchGroups();
  }, [fetchGroups]);

  return { groups, loading, refreshing, error, refresh };
}

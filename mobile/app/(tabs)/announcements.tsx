import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatRoom } from '@/components/ChatRoom';
import { useGroups } from '@/hooks/useGroups';
import { colors, radius } from '@/theme';

/** Canal(es) de comunicados corporativos. Muestra badge "Solo lectura" y bloquea el input sin permisos. */
export default function AnnouncementsScreen() {
  const { groups, loading, error } = useGroups();
  const channels = useMemo(() => groups.filter((g) => g.isAnnouncementOnly), [groups]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (channels.length && !channels.some((c) => c.id === selectedId)) setSelectedId(channels[0].id);
  }, [channels, selectedId]);

  const selected = channels.find((c) => c.id === selectedId);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!selected) {
    return (
      <View style={styles.center}>
        <Text style={error ? styles.error : styles.empty}>{error ?? 'No hay canales de anuncios disponibles.'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{selected.name}</Text>
          {!selected.canWrite && (
            <View style={styles.badge}>
              <Ionicons name="lock-closed" size={12} color={colors.warning} />
              <Text style={styles.badgeText}>Solo lectura</Text>
            </View>
          )}
        </View>
        {channels.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {channels.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setSelectedId(c.id)}
                style={[styles.chip, c.id === selected.id && styles.chipActive]}
              >
                <Text style={[styles.chipText, c.id === selected.id && styles.chipTextActive]}>{c.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
      <ChatRoom key={selected.id} group={selected} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.bg },
  empty: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
  error: { color: colors.danger, fontSize: 14, textAlign: 'center' },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { flexShrink: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.warningBg,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: colors.warning },
  chips: { gap: 8, paddingTop: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.textMuted },
  chipTextActive: { color: colors.primary, fontWeight: '600' },
});

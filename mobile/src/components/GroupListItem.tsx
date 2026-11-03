import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';
import type { Group } from '@/api/types';

type Props = { group: Group; onPress: () => void };

const formatDate = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
};

export function GroupListItem({ group, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.avatar}>
        <Ionicons name="people" size={22} color={colors.primary} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>{group.name}</Text>
          <Text style={styles.date}>{formatDate(group.lastMessageAt)}</Text>
        </View>
        <Text style={styles.preview} numberOfLines={1}>
          {group.lastMessageContent ?? group.description ?? 'Sin mensajes'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pressed: { backgroundColor: '#F8FAFC' },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { flexShrink: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  date: { fontSize: 12, color: colors.textMuted },
  preview: { marginTop: 2, fontSize: 14, color: colors.textMuted },
});

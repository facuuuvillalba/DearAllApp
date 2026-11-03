import { useMemo } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { GroupListItem } from '@/components/GroupListItem';
import { useGroups } from '@/hooks/useGroups';
import { colors } from '@/theme';

/** Chats grupales del usuario (los canales de anuncios viven en su propia pestaña). */
export default function ChatsScreen() {
  const router = useRouter();
  const { groups, loading, refreshing, error, refresh } = useGroups();
  const chats = useMemo(() => groups.filter((g) => !g.isAnnouncementOnly), [groups]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={chats}
      keyExtractor={(g) => String(g.id)}
      renderItem={({ item }) => (
        <GroupListItem
          group={item}
          onPress={() => router.push({ pathname: '/chat/[id]', params: { id: String(item.id), name: item.name } })}
        />
      )}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={error ? styles.error : styles.empty}>
            {error ?? 'No perteneces a ningún grupo todavía.'}
          </Text>
        </View>
      }
      contentContainerStyle={chats.length === 0 && styles.grow}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.bg },
  grow: { flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  empty: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
  error: { color: colors.danger, fontSize: 14, textAlign: 'center' },
});

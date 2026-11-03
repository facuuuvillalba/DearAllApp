import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ChatRoom } from '@/components/ChatRoom';
import { useGroups } from '@/hooks/useGroups';
import { colors } from '@/theme';

/** Chat grupal: /chat/[id] */
export default function ChatScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const { groups, loading } = useGroups();
  const group = groups.find((g) => String(g.id) === id);

  return (
    <View style={styles.flex}>
      <Stack.Screen options={{ title: group?.name ?? name ?? 'Chat' }} />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : group ? (
        <ChatRoom group={group} />
      ) : (
        <View style={styles.center}>
          <Text style={styles.error}>No tienes acceso a este grupo o ya no existe.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { color: colors.danger, textAlign: 'center' },
});

import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuth } from '@/context/AuthContext';
import { colors, radius } from '@/theme';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  if (!user) return null;

  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();

  const confirmSignOut = () => {
    // Alert.alert con botones no funciona en web.
    if (Platform.OS === 'web') {
      if (window.confirm('¿Seguro que deseas salir?')) signOut();
      return;
    }
    Alert.alert('Cerrar sesión', '¿Seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.initials}>{initials}</Text>
      </View>
      <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
      <View style={styles.areaBadge}>
        <Text style={styles.areaText}>{user.area}</Text>
      </View>

      <View style={styles.card}>
        <InfoRow icon="mail" label="Correo" value={user.email} />
        <InfoRow icon="briefcase" label="Área" value={user.area} />
        <InfoRow icon="shield-checkmark" label="Rol" value={user.role} last />
      </View>

      <Pressable onPress={confirmSignOut} style={({ pressed }) => [styles.logout, pressed && styles.logoutPressed]}>
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </Pressable>

      <Text style={styles.version}>Versión {Constants.expoConfig?.version ?? '1.0.0'}</Text>
    </ScrollView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { alignItems: 'center', padding: 20 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  initials: { color: '#fff', fontSize: 32, fontWeight: '700' },
  name: { marginTop: 12, fontSize: 22, fontWeight: '700', color: colors.text },
  areaBadge: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
  },
  areaText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  card: {
    alignSelf: 'stretch',
    marginTop: 24,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowBody: { flex: 1 },
  rowLabel: { fontSize: 12, color: colors.textMuted },
  rowValue: { fontSize: 15, color: colors.text, marginTop: 2 },
  logout: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.dangerBg,
  },
  logoutPressed: { opacity: 0.7 },
  logoutText: { color: colors.danger, fontSize: 16, fontWeight: '600' },
  version: { marginTop: 20, fontSize: 12, color: colors.textMuted },
});

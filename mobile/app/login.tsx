import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { colors, radius } from '@/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) next.email = 'Ingresa un correo válido';
    if (password.length === 0) next.password = 'Ingresa tu contraseña';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async () => {
    setSubmitError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      // La redirección la realiza AuthGate al detectar la sesión.
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logo}>
          <Ionicons name="chatbubbles" size={34} color="#fff" />
        </View>
        <Text style={styles.title}>Bienvenido</Text>
        <Text style={styles.subtitle}>Inicia sesión con tu cuenta corporativa</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            value={email}
            onChangeText={setEmail}
            placeholder="nombre@empresa.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="username"
            autoComplete="email"
            editable={!loading}
          />
          {errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}

          <Text style={[styles.label, styles.labelSpacing]}>Contraseña</Text>
          <View style={[styles.passwordRow, errors.password && styles.inputError]}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              textContentType="password"
              autoComplete="password"
              editable={!loading}
              onSubmitEditing={onSubmit}
            />
            <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={10} accessibilityLabel="Mostrar contraseña">
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.textMuted} />
            </Pressable>
          </View>
          {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}

          {submitError && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{submitError}</Text>
            </View>
          )}

          <Pressable
            onPress={onSubmit}
            disabled={loading}
            style={({ pressed }) => [styles.button, (pressed || loading) && styles.buttonPressed]}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Iniciar sesión</Text>}
          </Pressable>
        </View>

        <Text style={styles.footer}>¿Sin acceso? Solicítalo al administrador de tu empresa.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: '700', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 4, marginBottom: 24 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  labelSpacing: { marginTop: 14 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  inputError: { borderColor: colors.danger },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    backgroundColor: colors.bg,
  },
  passwordInput: { flex: 1, fontSize: 15, color: colors.text },
  fieldError: { color: colors.danger, fontSize: 12, marginTop: 4 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    padding: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.dangerBg,
  },
  errorText: { flex: 1, color: colors.danger, fontSize: 13 },
  button: {
    height: 50,
    marginTop: 20,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: { backgroundColor: colors.primaryDark },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer: { marginTop: 20, textAlign: 'center', fontSize: 12, color: colors.textMuted },
});

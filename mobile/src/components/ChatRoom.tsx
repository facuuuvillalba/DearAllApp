import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { messagesApi } from '@/api/endpoints';
import type { Group, Message } from '@/api/types';
import { POLL_INTERVAL_MS } from '@/config';
import { useAuth } from '@/context/AuthContext';
import { colors, radius } from '@/theme';
import { MessageBubble } from './MessageBubble';

type Props = { group: Group };

/** Agrega mensajes nuevos evitando duplicados (el polling y el envío pueden solaparse). */
const mergeMessages = (current: Message[], incoming: Message[]) => {
  if (incoming.length === 0) return current;
  const known = new Set(current.map((m) => m.id));
  const fresh = incoming.filter((m) => !known.has(m.id));
  return fresh.length ? [...current, ...fresh].sort((a, b) => a.id - b.id) : current;
};

export function ChatRoom({ group }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);
  const lastIdRef = useRef(0);

  useEffect(() => {
    lastIdRef.current = messages.length ? messages[messages.length - 1].id : 0;
  }, [messages]);

  // Carga inicial + sincronización periódica (solo trae mensajes posteriores al último conocido).
  useEffect(() => {
    let cancelled = false;
    setMessages([]);
    setLoading(true);

    const sync = async (initial: boolean) => {
      try {
        const { messages: incoming } = await messagesApi.list(
          group.id,
          initial ? {} : { after: lastIdRef.current }
        );
        if (cancelled) return;
        setMessages((prev) => mergeMessages(prev, incoming));
        setError(null);
      } catch (err) {
        if (!cancelled && initial) setError(err instanceof Error ? err.message : 'Error al cargar mensajes');
      } finally {
        if (!cancelled && initial) setLoading(false);
      }
    };

    sync(true);
    const timer = setInterval(() => sync(false), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [group.id]);

  const send = useCallback(async () => {
    const content = draft.trim();
    if (!content || sending || !group.canWrite) return;
    setSending(true);
    try {
      const { message } = await messagesApi.send(group.id, content);
      setMessages((prev) => mergeMessages(prev, [message]));
      setDraft('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el mensaje');
    } finally {
      setSending(false);
    }
  }, [draft, sending, group.canWrite, group.id]);

  const canSend = group.canWrite && draft.trim().length > 0 && !sending;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => String(m.id)}
          renderItem={({ item }) => <MessageBubble message={item} isOwn={item.senderId === user?.id} />}
          contentContainerStyle={styles.list}
          // Autoscroll al último mensaje cuando cambia el contenido.
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Aún no hay mensajes en este canal.</Text>
            </View>
          }
          keyboardShouldPersistTaps="handled"
        />
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      {!group.canWrite && (
        <View style={styles.readOnlyBanner}>
          <Ionicons name="lock-closed" size={14} color={colors.warning} />
          <Text style={styles.readOnlyText}>Solo lectura: únicamente RRHH o Admin pueden publicar</Text>
        </View>
      )}

      <View style={[styles.composer, !group.canWrite && styles.composerDisabled]}>
        <TextInput
          style={styles.input}
          placeholder={group.canWrite ? 'Escribe un mensaje…' : 'No tienes permiso para escribir'}
          placeholderTextColor={colors.textMuted}
          value={draft}
          onChangeText={setDraft}
          editable={group.canWrite}
          multiline
          maxLength={4000}
        />
        <Pressable
          onPress={send}
          disabled={!canSend}
          accessibilityLabel="Enviar mensaje"
          style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
        >
          {sending ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={18} color="#fff" />}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  list: { paddingVertical: 12, flexGrow: 1 },
  emptyText: { color: colors.textMuted, fontSize: 14 },
  error: {
    color: colors.danger,
    backgroundColor: colors.dangerBg,
    fontSize: 13,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  readOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.warningBg,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  readOnlyText: { color: colors.warning, fontSize: 12, fontWeight: '600', flexShrink: 1 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  composerDisabled: { opacity: 0.6 },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 42,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.bg,
    fontSize: 15,
    color: colors.text,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#93C5FD' },
});

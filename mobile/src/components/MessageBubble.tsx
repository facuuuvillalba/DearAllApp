import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';
import type { Message } from '@/api/types';

type Props = { message: Message; isOwn: boolean };

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

function MessageBubbleBase({ message, isOwn }: Props) {
  return (
    <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        {!isOwn && (
          <Text style={styles.sender} numberOfLines={1}>
            {message.senderName}
          </Text>
        )}
        <Text style={[styles.content, isOwn && styles.contentOwn]}>{message.content}</Text>
        <Text style={[styles.time, isOwn && styles.timeOwn]}>{formatTime(message.createdAt)}</Text>
      </View>
    </View>
  );
}

export const MessageBubble = memo(MessageBubbleBase);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginVertical: 3, paddingHorizontal: 12 },
  rowOwn: { justifyContent: 'flex-end' },
  rowOther: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  bubbleOwn: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleOther: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sender: { fontSize: 12, fontWeight: '700', color: colors.primary, marginBottom: 2 },
  content: { fontSize: 15, color: colors.text, lineHeight: 20 },
  contentOwn: { color: '#FFFFFF' },
  time: { fontSize: 10, color: colors.textMuted, alignSelf: 'flex-end', marginTop: 4 },
  timeOwn: { color: '#BFDBFE' },
});

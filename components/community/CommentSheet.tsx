import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { OrbitLoader } from '@/components/ui/OrbitLoader';
import { useAlertCommentsQuery } from '@/hooks/useTruQueries';
import { supabase } from '@/lib/supabase';
import { hapticLight, hapticSuccess } from '@/lib/haptics';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

type Row = {
  id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
};

type Props = {
  visible: boolean;
  alertId: string | null;
  onClose: () => void;
};

export function CommentSheet({ visible, alertId, onClose }: Props) {
  const session = useAuthStore((s) => s.session);
  const qc = useQueryClient();
  const commentsQ = useAlertCommentsQuery(alertId);
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const post = useMutation({
    mutationFn: async (text: string) => {
      if (!session?.user.id || !alertId) throw new Error('auth');
      const { error } = await supabase.from('alert_comments').insert({
        alert_id: alertId,
        user_id: session.user.id,
        body: text.trim(),
        parent_id: replyTo,
      });
      if (error) throw error;
    },
    onMutate: async (text: string) => {
      if (!session?.user.id || !alertId) return;
      const key = ['alert-comments', alertId] as const;
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Row[]>(key);
      const optimistic: Row = {
        id: `local-${Date.now()}`,
        user_id: session.user.id,
        parent_id: replyTo,
        body: text.trim(),
        created_at: new Date().toISOString(),
      };
      qc.setQueryData<Row[]>(key, (old) => [...(old ?? []), optimistic]);
      return { prev };
    },
    onError: (_e, _t, ctx) => {
      if (alertId && ctx?.prev !== undefined) {
        qc.setQueryData(['alert-comments', alertId], ctx.prev);
      }
    },
    onSuccess: async () => {
      hapticSuccess();
      setBody('');
      setReplyTo(null);
      await qc.invalidateQueries({ queryKey: ['alert-comments', alertId] });
    },
  });

  const renderItem = useCallback(
    ({ item }: { item: Row }) => {
      const indent = item.parent_id ? 16 : 0;
      return (
        <View style={[styles.threadRow, { marginLeft: indent }]}>
          <Text style={[typography.caption, styles.meta]}>
            Member · {new Date(item.created_at).toLocaleString()}
          </Text>
          <Text style={[typography.body]}>{item.body}</Text>
          <Pressable
            onPress={() => {
              hapticLight();
              setReplyTo(item.id);
            }}
            style={styles.replyLnk}
          >
            <Text style={[typography.caption, { color: colors.tealGlow }]}>Reply</Text>
          </Pressable>
        </View>
      );
    },
    []
  );

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.scrimTap} onPress={onClose} accessibilityLabel="Close comments" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <Animated.View entering={SlideInDown.duration(320)} style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={[typography.headlineSm]}>Discussion</Text>
            {replyTo ? (
              <Text style={[typography.caption, styles.replyHint]}>Replying to thread</Text>
            ) : null}
            {commentsQ.isLoading ? (
              <View style={styles.loader}>
                <OrbitLoader size={32} />
              </View>
            ) : (
              <FlatList
                data={(commentsQ.data ?? []) as Row[]}
                keyExtractor={(i) => i.id}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                initialNumToRender={14}
                maxToRenderPerBatch={12}
                windowSize={7}
                removeClippedSubviews
                renderItem={renderItem}
                ListEmptyComponent={
                  <Animated.View entering={FadeIn}>
                    <Text style={[typography.caption, styles.empty]}>No comments yet.</Text>
                  </Animated.View>
                }
                keyboardShouldPersistTaps="handled"
              />
            )}
            <TextInput
              style={styles.input}
              placeholder="Add a thoughtful comment…"
              placeholderTextColor={colors.textMuted}
              value={body}
              onChangeText={setBody}
              multiline
            />
            <PrimaryButton
              label={post.isPending ? 'Posting…' : 'Post'}
              variant="gold"
              onPress={() => {
                if (!body.trim()) return;
                void post.mutate(body);
              }}
              loading={post.isPending}
              disabled={!body.trim()}
            />
            <Pressable onPress={onClose} style={styles.close}>
              <Text style={[typography.caption, { color: colors.textMuted }]}>Close</Text>
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  flex: { justifyContent: 'flex-end' },
  scrimTap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    maxHeight: '78%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.cardBorder,
    marginBottom: 14,
  },
  replyHint: { marginTop: 6, color: colors.tealGlow },
  list: { maxHeight: 280, marginTop: 12 },
  listContent: { paddingBottom: 12 },
  threadRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cardBorder,
  },
  meta: { opacity: 0.7, marginBottom: 4 },
  replyLnk: { marginTop: 6 },
  empty: { paddingVertical: 20, textAlign: 'center' },
  loader: { paddingVertical: 24, alignItems: 'center' },
  input: {
    minHeight: 72,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 12,
    color: colors.textPrimary,
    marginTop: 8,
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  close: { alignItems: 'center', marginTop: 12 },
});

import {
  deleteChatSession,
  formatSessionWhen,
  listChatSessions,
  renameChatSession,
  type ChatSession,
} from '@/lib/chatHistory';
import { hapticLight, hapticMedium } from '@/lib/haptics';
import { useTheme } from '@/theme/ThemeContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Called when the user taps an existing session to open it. */
  onOpenSession: (sessionId: string) => void;
  /** Called when the user taps "New chat" to start a fresh session. */
  onNewSession: () => void;
  /** Id of the currently active session (highlighted in the list). */
  activeSessionId: string | null;
}

function PlusIcon({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}

function ChatBubbleIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4V5z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TrashIcon({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PencilIcon({ color, size = 13 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 20h4l10-10-4-4L4 16v4zM14 6l4 4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChatHistoryModal({
  visible,
  onClose,
  onOpenSession,
  onNewSession,
  activeSessionId,
}: Props) {
  const { theme } = useTheme();
  const qc = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: () => listChatSessions(50),
    enabled: visible,
    staleTime: 10_000,
  });

  const sessions = sessionsQuery.data ?? [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleRename = async (s: ChatSession) => {
    try {
      await renameChatSession(s.id, editingTitle);
      await qc.invalidateQueries({ queryKey: ['chat-sessions'] });
      setEditingId(null);
    } catch (e) {
      Alert.alert('Rename failed', e instanceof Error ? e.message : 'Please try again.');
    }
  };

  const handleDelete = (s: ChatSession) => {
    Alert.alert(
      'Delete conversation?',
      `"${s.title}" will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              hapticMedium();
              await deleteChatSession(s.id);
              await qc.invalidateQueries({ queryKey: ['chat-sessions'] });
              // If the session being viewed was deleted, route caller to a new chat.
              if (s.id === activeSessionId) onNewSession();
            } catch (e) {
              Alert.alert('Could not delete', e instanceof Error ? e.message : 'Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.panel, { backgroundColor: theme.bg1 }]}
          onPress={() => { /* swallow */ }}
        >
          <View style={[styles.handle, { backgroundColor: theme.border }]} />

          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: theme.text1 }]}>Chat history</Text>
            <TouchableOpacity
              onPress={() => { hapticLight(); onNewSession(); onClose(); }}
              activeOpacity={0.85}
              style={[styles.newBtn, { backgroundColor: theme.teal }]}
            >
              <PlusIcon color={theme.bg0} size={12} />
              <Text style={[styles.newBtnTxt, { color: theme.bg0 }]}>New chat</Text>
            </TouchableOpacity>
          </View>

          {/* Body */}
          {sessionsQuery.isLoading ? (
            <View style={styles.state}>
              <ActivityIndicator color={theme.teal} />
              <Text style={[styles.stateSub, { color: theme.text3 }]}>Loading conversations...</Text>
            </View>
          ) : sessionsQuery.isError ? (
            <View style={styles.state}>
              <Text style={[styles.stateTitle, { color: theme.text1 }]}>Couldn&apos;t load history</Text>
              <Text style={[styles.stateSub, { color: theme.text3 }]}>
                {sessionsQuery.error instanceof Error
                  ? sessionsQuery.error.message
                  : 'Please try again.'}
              </Text>
            </View>
          ) : sessions.length === 0 ? (
            <View style={styles.state}>
              <View style={[styles.emptyIcon, { backgroundColor: `${theme.teal}14`, borderColor: `${theme.teal}44` }]}>
                <ChatBubbleIcon color={theme.teal} size={22} />
              </View>
              <Text style={[styles.stateTitle, { color: theme.text1 }]}>No conversations yet</Text>
              <Text style={[styles.stateSub, { color: theme.text3 }]}>
                Your past chats with TruWell AI will appear here.
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {sessions.map((s) => {
                const active = s.id === activeSessionId;
                const isEditing = editingId === s.id;
                return (
                  <View
                    key={s.id}
                    style={[
                      styles.row,
                      {
                        backgroundColor: active ? `${theme.teal}10` : theme.bg2,
                        borderColor: active ? `${theme.teal}55` : theme.border,
                      },
                    ]}
                  >
                    {isEditing ? (
                      <View style={styles.rowEditing}>
                        <TextInput
                          value={editingTitle}
                          onChangeText={setEditingTitle}
                          autoFocus
                          placeholder="Conversation title"
                          placeholderTextColor={theme.text3}
                          style={[styles.editInput, { color: theme.text1, borderColor: theme.border, backgroundColor: theme.bg3 }]}
                          maxLength={80}
                          returnKeyType="done"
                          onSubmitEditing={() => void handleRename(s)}
                        />
                        <TouchableOpacity
                          onPress={() => void handleRename(s)}
                          style={[styles.editSave, { backgroundColor: theme.teal }]}
                        >
                          <Text style={[styles.editSaveTxt, { color: theme.bg0 }]}>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setEditingId(null)} style={styles.editCancel}>
                          <Text style={[styles.editCancelTxt, { color: theme.text3 }]}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.rowContent}
                        onPress={() => { hapticLight(); onOpenSession(s.id); onClose(); }}
                      >
                        <View style={[styles.rowIcon, { backgroundColor: `${theme.teal}14`, borderColor: `${theme.teal}44` }]}>
                          <ChatBubbleIcon color={theme.teal} size={14} />
                        </View>
                        <View style={styles.rowTxtWrap}>
                          <View style={styles.rowTitleRow}>
                            <Text
                              style={[styles.rowTitle, { color: theme.text1 }]}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {s.title || 'New conversation'}
                            </Text>
                            <Text style={[styles.rowWhen, { color: theme.text3 }]}>
                              {formatSessionWhen(s.updated_at)}
                            </Text>
                          </View>
                          {s.last_message_preview ? (
                            <Text
                              style={[styles.rowPreview, { color: theme.text3 }]}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {s.last_message_preview}
                            </Text>
                          ) : (
                            <Text style={[styles.rowPreview, { color: theme.text3, fontStyle: 'italic' }]}>
                              No messages yet
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    )}

                    {!isEditing && (
                      <View style={styles.rowActions}>
                        <TouchableOpacity
                          onPress={() => {
                            hapticLight();
                            setEditingTitle(s.title || '');
                            setEditingId(s.id);
                          }}
                          hitSlop={6}
                          style={styles.rowActionBtn}
                          accessibilityLabel="Rename conversation"
                        >
                          <PencilIcon color={theme.text3} size={13} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDelete(s)}
                          hitSlop={6}
                          style={styles.rowActionBtn}
                          accessibilityLabel="Delete conversation"
                        >
                          <TrashIcon color={theme.red} size={14} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  panel: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.select({ ios: 36, android: 24, default: 24 }),
    maxHeight: '88%',
    minHeight: '55%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 14,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  newBtnTxt: { fontSize: 12, fontWeight: '800', letterSpacing: 0.1 },

  state: { paddingVertical: 44, alignItems: 'center', gap: 10 },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stateTitle: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  stateSub: { fontSize: 12.5, fontWeight: '500', textAlign: 'center', paddingHorizontal: 24 },

  list: { gap: 8, paddingBottom: 14 },
  row: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTxtWrap: { flex: 1, gap: 3 },
  rowTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowTitle: { fontSize: 14, fontWeight: '800', letterSpacing: -0.2, flex: 1 },
  rowWhen: { fontSize: 11, fontWeight: '600' },
  rowPreview: { fontSize: 12, fontWeight: '500' },

  rowActions: {
    flexDirection: 'row',
    gap: 4,
  },
  rowActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Edit mode
  rowEditing: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  editSave: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  editSaveTxt: { fontSize: 12, fontWeight: '800' },
  editCancel: { paddingHorizontal: 6 },
  editCancelTxt: { fontSize: 12, fontWeight: '600' },
});

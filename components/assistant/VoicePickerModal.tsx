import { hapticLight } from '@/lib/haptics';
import { VOICE_OPTIONS, useVoiceStore, type VoiceId, type VoiceGender } from '@/stores/voiceStore';
import { useTheme } from '@/theme/ThemeContext';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

function PlayIcon({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 3l14 9-14 9V3z" fill={color} />
    </Svg>
  );
}

function StopIcon({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6h12v12H6z" fill={color} />
    </Svg>
  );
}

export const VOICE_PREVIEW_TEXT = "Hello, I'm here to help with your health questions today.";

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Called when user taps the preview button for a voice. */
  onPreview?: (voiceId: VoiceId) => void;
  /** Voice id currently being loaded for preview. */
  previewLoadingId?: string | null;
  /** Voice id currently playing for preview. */
  previewPlayingId?: string | null;
}

function CheckIcon({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12.5l4.5 4.5L20 7"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PersonIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={2} />
      <Path
        d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

const GENDER_TABS: { id: VoiceGender | 'all'; label: string }[] = [
  { id: 'all',     label: 'All' },
  { id: 'female',  label: 'Female' },
  { id: 'male',    label: 'Male' },
  { id: 'neutral', label: 'Neutral' },
];

export function VoicePickerModal({ visible, onClose, onPreview, previewLoadingId, previewPlayingId }: Props) {
  const { theme } = useTheme();
  const currentVoice = useVoiceStore((s) => s.voiceId);
  const setVoice = useVoiceStore((s) => s.setVoice);
  const [filter, setFilter] = useState<VoiceGender | 'all'>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return VOICE_OPTIONS;
    return VOICE_OPTIONS.filter((v) => v.gender === filter);
  }, [filter]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.panel, { backgroundColor: theme.bg1 }]} onPress={() => { /* swallow */ }}>
          {/* Grab handle */}
          <View style={[styles.handle, { backgroundColor: theme.border }]} />

          <Text style={[styles.title, { color: theme.text1 }]}>Choose a voice</Text>
          <Text style={[styles.sub, { color: theme.text3 }]}>
            Your assistant will speak responses in this voice.
          </Text>

          {/* Gender filter tabs */}
          <View style={styles.tabs}>
            {GENDER_TABS.map((t) => {
              const active = filter === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => { hapticLight(); setFilter(t.id); }}
                  activeOpacity={0.7}
                  style={[
                    styles.tab,
                    {
                      backgroundColor: active ? `${theme.teal}1A` : 'transparent',
                      borderColor: active ? `${theme.teal}55` : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabLabel,
                      { color: active ? theme.teal : theme.text3, fontWeight: active ? '800' : '600' },
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Voice list */}
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {filtered.map((v) => {
              const selected = v.id === currentVoice;
              return (
                <TouchableOpacity
                  key={v.id}
                  activeOpacity={0.85}
                  onPress={() => {
                    hapticLight();
                    setVoice(v.id);
                  }}
                  style={[
                    styles.voiceRow,
                    {
                      backgroundColor: selected ? `${theme.teal}10` : theme.bg2,
                      borderColor: selected ? `${theme.teal}55` : theme.border,
                    },
                  ]}
                >
                  <View style={[styles.voiceAvatar, { backgroundColor: `${theme.teal}1A`, borderColor: `${theme.teal}44` }]}>
                    <PersonIcon color={theme.teal} size={18} />
                  </View>
                  <View style={styles.voiceText}>
                    <View style={styles.voiceNameRow}>
                      <Text style={[styles.voiceName, { color: theme.text1 }]}>{v.label}</Text>
                      <View style={[styles.genderPill, { backgroundColor: theme.bg3 }]}>
                        <Text style={[styles.genderTxt, { color: theme.text3 }]}>
                          {v.gender.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.voiceDesc, { color: theme.text3 }]}>{v.description}</Text>
                  </View>
                  <View style={styles.rowActions}>
                    {onPreview && (
                      <TouchableOpacity
                        onPress={() => { hapticLight(); onPreview(v.id); }}
                        hitSlop={6}
                        style={[
                          styles.previewBtn,
                          {
                            backgroundColor: previewPlayingId === `preview-${v.id}` ? `${theme.teal}20` : theme.bg3,
                            borderColor: previewPlayingId === `preview-${v.id}` ? `${theme.teal}55` : theme.border,
                          },
                        ]}
                      >
                        {previewLoadingId === `preview-${v.id}` ? (
                          <ActivityIndicator size={12} color={theme.teal} />
                        ) : previewPlayingId === `preview-${v.id}` ? (
                          <StopIcon color={theme.teal} size={11} />
                        ) : (
                          <PlayIcon color={theme.text3} size={11} />
                        )}
                      </TouchableOpacity>
                    )}
                    <View
                      style={[
                        styles.check,
                        {
                          backgroundColor: selected ? theme.teal : 'transparent',
                          borderColor: selected ? theme.teal : theme.border,
                        },
                      ]}
                    >
                      {selected && <CheckIcon color={theme.bg0} size={14} />}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: theme.teal }]}
            onPress={() => { hapticLight(); onClose(); }}
          >
            <Text style={[styles.doneTxt, { color: theme.bg0 }]}>Done</Text>
          </TouchableOpacity>
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
    maxHeight: '82%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 14,
  },
  title: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
  sub: { fontSize: 13, fontWeight: '500', marginBottom: 14 },

  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabLabel: { fontSize: 12, letterSpacing: 0.2 },

  list: { maxHeight: 420 },
  listContent: { gap: 8, paddingBottom: 14 },

  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  voiceAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceText: { flex: 1, gap: 3 },
  voiceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voiceName: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  genderPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  genderTxt: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  voiceDesc: { fontSize: 12, fontWeight: '500' },

  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  doneBtn: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  doneTxt: { fontSize: 14, fontWeight: '800', letterSpacing: -0.1 },
});

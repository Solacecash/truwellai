/**
 * Wellness reminders settings.
 *
 * Lets the user turn hydration / breathing reminders on or off, pick a
 * notification sound for each, choose the hydration window + cadence, and
 * edit the list of times for breathing reminders. Each sound option has a
 * preview button that plays the clip immediately.
 */

import { BackHeader } from '@/components/ui/BackHeader';
import { hapticLight, hapticSuccess } from '@/lib/haptics';
import { loadWellnessPrefs, saveWellnessPrefs } from '@/lib/wellnessPrefs';
import {
  applyWellnessReminderPrefs,
  cancelAllWellnessReminders,
  DEFAULT_WELLNESS_PREFS,
  type WellnessReminderPrefs,
} from '@/lib/wellnessReminders';
import {
  BREATHING_SOUNDS,
  HYDRATION_SOUNDS,
  playBreathingSound,
  playHydrationSound,
  type BreathingSoundId,
  type HydrationSoundId,
} from '@/lib/wellnessSound';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme/ThemeContext';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

const INTERVAL_OPTIONS = [60, 90, 120, 180];

function PlayIcon({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M8 5v14l11-7z" />
    </Svg>
  );
}

function PlusIcon({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

function XIcon({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}

export default function WellnessRemindersScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id);

  const [prefs, setPrefs] = useState<WellnessReminderPrefs>(DEFAULT_WELLNESS_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timeEditor, setTimeEditor] = useState<{ visible: boolean; index: number | null }>({
    visible: false,
    index: null,
  });
  const [draftTime, setDraftTime] = useState('10:00');

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      try {
        const loaded = await loadWellnessPrefs(userId);
        setPrefs(loaded);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const set = <K extends keyof WellnessReminderPrefs>(key: K, value: WellnessReminderPrefs[K]) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const addBreathingTime = () => {
    setDraftTime('09:00');
    setTimeEditor({ visible: true, index: null });
  };
  const editBreathingTime = (i: number) => {
    setDraftTime(prefs.breathing_reminder_times[i] ?? '09:00');
    setTimeEditor({ visible: true, index: i });
  };
  const confirmBreathingTime = () => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(draftTime.trim());
    if (!m) {
      Alert.alert('Invalid time', 'Use HH:MM format, e.g. 09:30.');
      return;
    }
    const hour = parseInt(m[1], 10);
    const minute = parseInt(m[2], 10);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      Alert.alert('Invalid time', 'Hour 0-23, minute 0-59.');
      return;
    }
    const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    setPrefs((prev) => {
      const next = [...prev.breathing_reminder_times];
      if (timeEditor.index == null) {
        if (next.length >= 6) {
          Alert.alert('Limit reached', 'Up to 6 breathing reminders per day.');
          return prev;
        }
        next.push(value);
      } else {
        next[timeEditor.index] = value;
      }
      next.sort();
      return { ...prev, breathing_reminder_times: next };
    });
    setTimeEditor({ visible: false, index: null });
  };
  const removeBreathingTime = (i: number) => {
    setPrefs((prev) => ({
      ...prev,
      breathing_reminder_times: prev.breathing_reminder_times.filter((_, idx) => idx !== i),
    }));
  };

  const save = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      await saveWellnessPrefs(userId, prefs);
      // Re-apply OS schedule.
      if (!prefs.hydration_reminder_enabled && !prefs.breathing_reminder_enabled) {
        await cancelAllWellnessReminders();
      } else {
        await applyWellnessReminderPrefs(prefs);
      }
      hapticSuccess();
      router.back();
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const hydrationPreview = useMemo(() => {
    const windowHours = prefs.hydration_reminder_end_hour - prefs.hydration_reminder_start_hour;
    const windowMin = windowHours * 60;
    const count = Math.min(10, Math.floor(windowMin / prefs.hydration_reminder_interval_min) + 1);
    return `~${count} reminders per day`;
  }, [prefs.hydration_reminder_interval_min, prefs.hydration_reminder_start_hour, prefs.hydration_reminder_end_hour]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg0 }]} edges={['top']}>
      <BackHeader title="Wellness reminders" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {loading ? (
          <Text style={[styles.hint, { color: theme.text3 }]}>Loading your preferences...</Text>
        ) : (
          <>
            {/* ── Hydration ───────────────────────────────────────────────── */}
            <View style={[styles.card, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: theme.teal }]}>Hydration reminders</Text>
                  <Text style={[styles.cardSub, { color: theme.text3 }]}>{hydrationPreview}</Text>
                </View>
                <Switch
                  value={prefs.hydration_reminder_enabled}
                  onValueChange={(v) => { hapticLight(); set('hydration_reminder_enabled', v); }}
                  trackColor={{ false: theme.bg3, true: `${theme.teal}80` }}
                  thumbColor={prefs.hydration_reminder_enabled ? theme.teal : theme.text3}
                />
              </View>

              <Text style={[styles.label, { color: theme.text3 }]}>Cadence</Text>
              <View style={styles.chipsRow}>
                {INTERVAL_OPTIONS.map((m) => {
                  const active = prefs.hydration_reminder_interval_min === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      activeOpacity={0.8}
                      onPress={() => { hapticLight(); set('hydration_reminder_interval_min', m); }}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active ? `${theme.teal}1A` : theme.bg2,
                          borderColor: active ? `${theme.teal}66` : theme.border,
                        },
                      ]}
                    >
                      <Text style={[styles.chipTxt, { color: active ? theme.teal : theme.text2, fontWeight: active ? '800' : '600' }]}>
                        Every {m < 60 ? `${m}m` : `${m / 60}h${m % 60 ? ` ${m % 60}m` : ''}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.label, { color: theme.text3 }]}>Active window</Text>
              <View style={styles.windowRow}>
                <HourStepper
                  value={prefs.hydration_reminder_start_hour}
                  onChange={(v) => set('hydration_reminder_start_hour', Math.min(v, prefs.hydration_reminder_end_hour - 1))}
                  label="From"
                  theme={theme}
                />
                <HourStepper
                  value={prefs.hydration_reminder_end_hour}
                  onChange={(v) => set('hydration_reminder_end_hour', Math.max(v, prefs.hydration_reminder_start_hour + 1))}
                  label="Until"
                  theme={theme}
                />
              </View>

              <Text style={[styles.label, { color: theme.text3 }]}>Sound</Text>
              {HYDRATION_SOUNDS.map((s) => {
                const active = prefs.hydration_reminder_sound === s.id;
                return (
                  <SoundRow
                    key={s.id}
                    label={s.label}
                    description={s.description}
                    active={active}
                    onSelect={() => { hapticLight(); set('hydration_reminder_sound', s.id as HydrationSoundId); }}
                    onPreview={() => void playHydrationSound(s.id as HydrationSoundId)}
                    accent={theme.teal}
                    theme={theme}
                  />
                );
              })}
            </View>

            {/* ── Breathing ────────────────────────────────────────────────── */}
            <View style={[styles.card, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: theme.purple }]}>Breathing reminders</Text>
                  <Text style={[styles.cardSub, { color: theme.text3 }]}>
                    {prefs.breathing_reminder_times.length} daily check-ins
                  </Text>
                </View>
                <Switch
                  value={prefs.breathing_reminder_enabled}
                  onValueChange={(v) => { hapticLight(); set('breathing_reminder_enabled', v); }}
                  trackColor={{ false: theme.bg3, true: `${theme.purple}80` }}
                  thumbColor={prefs.breathing_reminder_enabled ? theme.purple : theme.text3}
                />
              </View>

              <Text style={[styles.label, { color: theme.text3 }]}>Times</Text>
              <View style={styles.timeGrid}>
                {prefs.breathing_reminder_times.map((t, i) => (
                  <View
                    key={`${t}-${i}`}
                    style={[styles.timeChip, { backgroundColor: `${theme.purple}14`, borderColor: `${theme.purple}55` }]}
                  >
                    <TouchableOpacity onPress={() => editBreathingTime(i)} activeOpacity={0.7}>
                      <Text style={[styles.timeTxt, { color: theme.purple }]}>{t}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => removeBreathingTime(i)}
                      hitSlop={6}
                      style={styles.timeX}
                    >
                      <XIcon color={theme.text3} size={11} />
                    </TouchableOpacity>
                  </View>
                ))}
                {prefs.breathing_reminder_times.length < 6 && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={addBreathingTime}
                    style={[styles.timeAdd, { borderColor: theme.border }]}
                  >
                    <PlusIcon color={theme.text2} size={11} />
                    <Text style={[styles.timeAddTxt, { color: theme.text2 }]}>Add time</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={[styles.label, { color: theme.text3 }]}>Sound</Text>
              {BREATHING_SOUNDS.map((s) => {
                const active = prefs.breathing_reminder_sound === s.id;
                return (
                  <SoundRow
                    key={s.id}
                    label={s.label}
                    description={s.description}
                    active={active}
                    onSelect={() => { hapticLight(); set('breathing_reminder_sound', s.id as BreathingSoundId); }}
                    onPreview={() => void playBreathingSound(s.id as BreathingSoundId)}
                    accent={theme.purple}
                    theme={theme}
                  />
                );
              })}
            </View>

            <Text style={[styles.footnote, { color: theme.text3 }]}>
              TruWell will share your hydration and breathing activity with the AI chat so it can give
              you personalized advice (for example, suggesting water when you mention headaches, or
              more breathing sessions when your stress patterns change).
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => void save()}
              disabled={saving}
              style={[
                styles.saveBtn,
                { backgroundColor: theme.teal, opacity: saving ? 0.7 : 1 },
              ]}
            >
              <Text style={[styles.saveTxt, { color: theme.bg0 }]}>
                {saving ? 'Saving...' : 'Save reminders'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* ── Time editor modal ─────────────────────────────────────────────── */}
      <Modal
        visible={timeEditor.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setTimeEditor({ visible: false, index: null })}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setTimeEditor({ visible: false, index: null })}
          />
          <Pressable style={[styles.modalCard, { backgroundColor: theme.bg1 }]} onPress={() => { /* swallow */ }}>
            <Text style={[styles.modalTitle, { color: theme.text1 }]}>
              {timeEditor.index == null ? 'Add breathing time' : 'Edit time'}
            </Text>
            <TextInput
              value={draftTime}
              onChangeText={setDraftTime}
              placeholder="HH:MM"
              placeholderTextColor={theme.text3}
              keyboardType="numbers-and-punctuation"
              autoFocus
              style={[styles.modalInput, { color: theme.text1, borderColor: theme.border, backgroundColor: theme.bg2, minHeight: 52 }]}
              maxLength={5}
              returnKeyType="done"
              onSubmitEditing={confirmBreathingTime}
            />
            <View style={styles.modalRow}>
              <TouchableOpacity onPress={() => setTimeEditor({ visible: false, index: null })} style={styles.modalCancel}>
                <Text style={[styles.modalCancelTxt, { color: theme.text3 }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmBreathingTime}
                style={[styles.modalSave, { backgroundColor: theme.teal }]}
              >
                <Text style={[styles.modalSaveTxt, { color: theme.bg0 }]}>
                  {timeEditor.index == null ? 'Add' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Inline components ─────────────────────────────────────────────────────

function SoundRow({
  label,
  description,
  active,
  onSelect,
  onPreview,
  accent,
  theme,
}: {
  label: string;
  description: string;
  active: boolean;
  onSelect: () => void;
  onPreview: () => void;
  accent: string;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onSelect}
      style={[
        styles.soundRow,
        {
          backgroundColor: active ? `${accent}12` : theme.bg2,
          borderColor: active ? `${accent}55` : theme.border,
        },
      ]}
    >
      <View style={styles.soundTxt}>
        <Text style={[styles.soundLabel, { color: active ? accent : theme.text1 }]}>{label}</Text>
        <Text style={[styles.soundDesc, { color: theme.text3 }]}>{description}</Text>
      </View>
      <TouchableOpacity
        onPress={onPreview}
        hitSlop={8}
        style={[styles.soundPreview, { borderColor: `${accent}66`, backgroundColor: `${accent}1A` }]}
      >
        <PlayIcon color={accent} size={12} />
      </TouchableOpacity>
      <View
        style={[
          styles.radio,
          {
            backgroundColor: active ? accent : 'transparent',
            borderColor: active ? accent : theme.border,
          },
        ]}
      />
    </TouchableOpacity>
  );
}

function HourStepper({
  value,
  onChange,
  label,
  theme,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  const formatHour = (h: number) => {
    if (h === 0) return '12 AM';
    if (h === 12) return '12 PM';
    return h < 12 ? `${h} AM` : `${h - 12} PM`;
  };
  return (
    <View style={[styles.stepper, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
      <Text style={[styles.stepperLabel, { color: theme.text3 }]}>{label}</Text>
      <View style={styles.stepperRow}>
        <TouchableOpacity
          onPress={() => { hapticLight(); onChange(Math.max(0, value - 1)); }}
          style={[styles.stepperBtn, { borderColor: theme.border }]}
        >
          <Text style={[styles.stepperSign, { color: theme.text1 }]}>−</Text>
        </TouchableOpacity>
        <Text style={[styles.stepperValue, { color: theme.text1 }]}>{formatHour(value)}</Text>
        <TouchableOpacity
          onPress={() => { hapticLight(); onChange(Math.min(23, value + 1)); }}
          style={[styles.stepperBtn, { borderColor: theme.border }]}
        >
          <Text style={[styles.stepperSign, { color: theme.text1 }]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 48, gap: 14 },
  hint: { fontSize: 13, textAlign: 'center', marginTop: 24 },

  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
  cardSub: { fontSize: 12, fontWeight: '600', marginTop: 2 },

  label: {
    fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase',
    marginTop: 6,
  },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 20, borderWidth: 1,
  },
  chipTxt: { fontSize: 12, letterSpacing: 0.1 },

  windowRow: { flexDirection: 'row', gap: 10 },
  stepper: {
    flex: 1, borderRadius: 14, borderWidth: 1,
    padding: 10, gap: 6,
  },
  stepperLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepperBtn: {
    width: 30, height: 30, borderRadius: 15, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  stepperSign: { fontSize: 18, fontWeight: '700', lineHeight: 20 },
  stepperValue: { fontSize: 14, fontWeight: '800', letterSpacing: -0.2 },

  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingLeft: 12, paddingRight: 6, paddingVertical: 7,
    borderRadius: 16, borderWidth: 1,
  },
  timeTxt: { fontSize: 13, fontWeight: '800', letterSpacing: -0.1 },
  timeX: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  timeAdd: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 16, borderWidth: 1, borderStyle: 'dashed',
  },
  timeAddTxt: { fontSize: 12, fontWeight: '700' },

  soundRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderRadius: 14, borderWidth: 1,
    gap: 10,
  },
  soundTxt: { flex: 1 },
  soundLabel: { fontSize: 14, fontWeight: '800', letterSpacing: -0.2 },
  soundDesc: { fontSize: 11.5, fontWeight: '500', marginTop: 2 },
  soundPreview: {
    width: 30, height: 30, borderRadius: 15, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.8 },

  footnote: { fontSize: 11.5, lineHeight: 17, fontWeight: '500', marginTop: 4 },

  saveBtn: {
    marginTop: 6, paddingVertical: 15,
    borderRadius: 14, alignItems: 'center',
  },
  saveTxt: { fontSize: 14, fontWeight: '800', letterSpacing: -0.1 },

  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%', borderRadius: 18, padding: 18, gap: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  modalInput: {
    borderRadius: 12, borderWidth: 1,
    paddingVertical: 12, paddingHorizontal: 14,
    fontSize: 16, fontWeight: '700', letterSpacing: 0.5,
  },
  modalRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalCancel: { paddingVertical: 10, paddingHorizontal: 14 },
  modalCancelTxt: { fontSize: 13, fontWeight: '600' },
  modalSave: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12 },
  modalSaveTxt: { fontSize: 13, fontWeight: '800' },
});

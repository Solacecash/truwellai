import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/theme/ThemeContext';
import { useAuthStore } from '@/stores/authStore';
import { loadRecentStress } from '@/lib/stressEngine';
import { loadSessionHistory } from '@/lib/breathingProgress';

const VOICE_PREF_KEY = 'breathing.voice_guidance';

interface Props {
  isPro: boolean;
}

/**
 * Pro section shown on the breathing hub. Free users see the same content
 * blurred behind an unlock overlay with a CTA to subscription checkout.
 */
export function ProFeatures({ isPro }: Props) {
  const { theme } = useTheme();
  const userId = useAuthStore((s) => s.session?.user.id);
  const [voiceOn, setVoiceOn] = useState(false);
  const [trend, setTrend] = useState<Array<{ stress_score: number; created_at: string }>>([]);
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(VOICE_PREF_KEY).then(v => setVoiceOn(v === 'on'));
  }, []);

  useEffect(() => {
    if (!userId || !isPro) return;
    (async () => {
      const t = await loadRecentStress(userId, 7);
      setTrend(t);

      const hist = await loadSessionHistory(userId, 20);
      const analyses: string[] = [];

      // Drop-off detection: for long cycle exercises like wim-hof
      const wimHof = hist.filter(h => h.exercise_id === 'wim-hof');
      if (wimHof.length >= 3) {
        const avgCycles = wimHof.reduce((a, b) => a + (b.cycles_completed ?? 0), 0) / wimHof.length;
        if (avgCycles < 20) {
          analyses.push('You tend to drop off Wim Hof after ~15 cycles. I can shorten your session automatically.');
        }
      }

      // Completion pattern
      const byId = new Map<string, { total: number; completed: number }>();
      hist.forEach(h => {
        const id = h.exercise_id ?? h.pattern ?? 'unknown';
        const bucket = byId.get(id) ?? { total: 0, completed: 0 };
        bucket.total += 1;
        bucket.completed += (h.cycles_completed ?? 0) > 0 ? 1 : 0;
        byId.set(id, bucket);
      });
      for (const [id, b] of byId) {
        if (b.total >= 3 && b.completed / b.total >= 0.9) {
          analyses.push(`You complete ${id} ${Math.round((b.completed / b.total) * 100)}% of the time. Prioritising it for you.`);
          break;
        }
      }

      // Evening recommendation
      const lateNight = hist.filter(h => {
        const hour = new Date(h.created_at).getHours();
        return hour >= 21 || hour < 5;
      });
      if (lateNight.length >= 2) {
        analyses.push('Late night activity detected. Recommending Diaphragmatic for tonight.');
      }

      setInsights(analyses.slice(0, 3));
    })();
  }, [userId, isPro]);

  const avgStress = useMemo(() => {
    if (trend.length === 0) return null;
    return Math.round(trend.reduce((a, b) => a + b.stress_score, 0) / trend.length);
  }, [trend]);

  const toggleVoice = (v: boolean) => {
    setVoiceOn(v);
    AsyncStorage.setItem(VOICE_PREF_KEY, v ? 'on' : 'off');
  };

  return (
    <View style={{ position: 'relative' }}>
      {/* Stress Dashboard */}
      <View style={[styles.card, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
        <View style={styles.row}>
          <Ionicons name="pulse" size={16} color={theme.teal} />
          <Text style={[styles.title, { color: theme.text1 }]}>Stress Detection</Text>
          <View style={styles.proPill}>
            <Text style={styles.proPillText}>PRO</Text>
          </View>
        </View>

        {avgStress != null ? (
          <>
            <Text style={[styles.bigScore, { color: stressColor(avgStress) }]}>
              {avgStress}
            </Text>
            <Text style={[styles.muted, { color: theme.text3 }]}>
              7-day average stress
            </Text>
            <View style={styles.trendRow}>
              {trend.map((p, i) => {
                const h = Math.max(8, Math.round((p.stress_score / 100) * 60));
                return (
                  <View
                    key={i}
                    style={[
                      styles.trendBar,
                      {
                        height: h,
                        backgroundColor: stressColor(p.stress_score),
                      },
                    ]}
                  />
                );
              })}
            </View>
          </>
        ) : (
          <Text style={[styles.muted, { color: theme.text3 }]}>
            Complete a stress check-in to begin tracking.
          </Text>
        )}
      </View>

      {/* AI Adaptive Coaching */}
      <View style={[styles.card, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
        <View style={styles.row}>
          <Ionicons name="sparkles" size={16} color={theme.gold} />
          <Text style={[styles.title, { color: theme.text1 }]}>AI Insights</Text>
          <View style={styles.proPill}>
            <Text style={styles.proPillText}>PRO</Text>
          </View>
        </View>
        {insights.length > 0 ? (
          insights.map((msg, i) => (
            <View
              key={i}
              style={[styles.insightRow, { borderColor: theme.border }]}
            >
              <Ionicons name="bulb" size={14} color={theme.gold} />
              <Text style={[styles.insight, { color: theme.text2 }]}>{msg}</Text>
            </View>
          ))
        ) : (
          <Text style={[styles.muted, { color: theme.text3 }]}>
            Complete a few more sessions so the AI can learn your patterns.
          </Text>
        )}
      </View>

      {/* Voice guidance toggle */}
      <View style={[styles.card, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
        <View style={styles.row}>
          <Ionicons name="mic" size={16} color={theme.teal} />
          <Text style={[styles.title, { color: theme.text1 }]}>Voice Guidance</Text>
          <View style={styles.proPill}>
            <Text style={styles.proPillText}>PRO</Text>
          </View>
        </View>
        <View style={[styles.row, { marginTop: 6 }]}>
          <Text style={[styles.muted, { color: theme.text3, flex: 1 }]}>
            Speak coaching cues aloud during sessions
          </Text>
          <Switch
            value={voiceOn}
            onValueChange={toggleVoice}
            trackColor={{ true: theme.teal, false: theme.border }}
          />
        </View>
      </View>

      {!isPro && (
        <View style={styles.lockOverlay}>
          <View style={styles.lockBox}>
            <Ionicons name="lock-closed" size={32} color={theme.gold} />
            <Text style={[styles.lockTitle, { color: theme.text1 }]}>
              AI Breath Intelligence
            </Text>
            <Text style={[styles.lockSub, { color: theme.text2 }]}>
              Stress detection, adaptive AI coaching, voice guidance and advanced analytics.
            </Text>
            <Pressable
              onPress={() => router.push('/settings/subscription' as never)}
              style={[styles.upgradeBtn, { backgroundColor: theme.gold }]}
            >
              <Text style={styles.upgradeText}>Unlock with Pro</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function stressColor(score: number): string {
  if (score <= 30) return '#2ED573';
  if (score <= 60) return '#C9A84C';
  if (score <= 80) return '#FF6B35';
  return '#FF4757';
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 14, fontWeight: '900', flex: 1 },
  proPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(201,168,76,0.25)',
    borderRadius: 4,
  },
  proPillText: { color: '#C9A84C', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  bigScore: { fontSize: 42, fontWeight: '900', marginTop: 6 },
  muted: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginTop: 10,
    height: 64,
  },
  trendBar: {
    flex: 1,
    borderRadius: 2,
    minHeight: 8,
  },
  insightRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  insight: { fontSize: 12, flex: 1, lineHeight: 17 },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(2,10,20,0.78)',
    borderRadius: 18,
  },
  lockBox: {
    alignItems: 'center',
    paddingHorizontal: 24,
    maxWidth: 320,
  },
  lockTitle: { fontSize: 18, fontWeight: '900', marginTop: 8, textAlign: 'center' },
  lockSub: { fontSize: 12, marginTop: 6, textAlign: 'center', lineHeight: 17 },
  upgradeBtn: {
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  upgradeText: { color: '#020A14', fontSize: 13, fontWeight: '900' },
});

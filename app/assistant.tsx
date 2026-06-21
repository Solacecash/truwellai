import { AssistantWelcomeCard, QUICK_CHIPS } from '@/components/assistant/AssistantWelcomeCard';
import { AIMessageBubble } from '@/components/assistant/AIMessageBubble';
import type { Message } from '@/components/assistant/AIMessageBubble';
import { ChatHistoryModal } from '@/components/assistant/ChatHistoryModal';
import { TypingIndicator } from '@/components/assistant/TypingIndicator';
import { VoicePaywallModal } from '@/components/assistant/VoicePaywallModal';
import { VoicePickerModal, VOICE_PREVIEW_TEXT } from '@/components/assistant/VoicePickerModal';
import { SofiaAvatar } from '@/components/ai/SofiaAvatar';
import { SofiaBadge } from '@/components/ai/SofiaBadge';
import { BackHeader } from '@/components/ui/BackHeader';
import EmergencyNotice from '@/components/legal/EmergencyNotice';
import { LEGAL } from '@/lib/legalContent';
import { buildAssistantContext } from '@/lib/assistantContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createChatSession,
  loadChatMessages,
  persistChatMessage,
} from '@/lib/chatHistory';
import { invokeAiHealthAssistant, invokeSttTranscription } from '@/lib/edge';
import { hapticLight, hapticMedium } from '@/lib/haptics';
import { useSpeechPlayer } from '@/lib/useSpeechPlayer';
import {
  filenameForMime,
  guessAudioMime,
  readRecordingAsBase64,
} from '@/lib/voiceAudio';
import { useAuthStore } from '@/stores/authStore';
import { isPro as isPlanPro, type PlanId } from '@/lib/subscriptionPlans';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useScanStore } from '@/stores/scanStore';
import { useUiStore } from '@/stores/uiStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useVoiceStore, voiceLabel } from '@/stores/voiceStore';
import { useTheme } from '@/theme/ThemeContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import * as DocumentPicker from 'expo-document-picker';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeInUp,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { NIMTTSButton } from '@/lib/tts/components/NIMTTSButton';
import { NIMTTSPlayerBar } from '@/lib/tts/components/NIMTTSPlayerBar';
import { useNIMTTS } from '@/lib/tts/hooks/useNIMTTS';

// Conversation starters now live in components/assistant/AssistantWelcomeCard.tsx
const MAX_RETRIES = 3;

// ---------------------------------------------------------------------------
// Scroll-to-bottom FAB
// ---------------------------------------------------------------------------

// Microphone glyph used inside the input bar mic button.
function MicGlyph({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ScrollToBottomFab({ visible, onPress, color }: { visible: boolean; onPress: () => void; color: string }) {
  if (!visible) return null;
  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={fabStyles.wrap}>
      <TouchableOpacity onPress={onPress} style={[fabStyles.btn, { backgroundColor: color }]} activeOpacity={0.8}>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path d="M6 9l6 6 6-6" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </TouchableOpacity>
    </Animated.View>
  );
}

const fabStyles = StyleSheet.create({
  wrap: { position: 'absolute', bottom: 80, right: 16, zIndex: 20 },
  btn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
});

// ---------------------------------------------------------------------------
// XP float animation
// ---------------------------------------------------------------------------

function XpFloat({ onDone }: { onDone: () => void }) {
  const { theme } = useTheme();
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withTiming(-40, { duration: 1200 });
    opacity.value = withTiming(0, { duration: 1200 });
    const t = setTimeout(onDone, 1250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const anim = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[xpStyles.text, { color: theme.gold }, anim]}>+5 XP</Animated.Text>
  );
}

const xpStyles = StyleSheet.create({
  text: { position: 'absolute', top: -8, alignSelf: 'center', fontSize: 14, fontWeight: '900', zIndex: 30 },
});

function PersistentQuickActions({
  onChipPress,
  theme,
}: {
  onChipPress: (prompt: string, autoSend: boolean) => void;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={{
        paddingHorizontal: 14,
        paddingVertical: 6,
        gap: 8,
      }}
    >
      {QUICK_CHIPS.map((chip) => (
        <TouchableOpacity
          key={chip.label}
          onPress={() => {
            hapticLight();
            onChipPress(chip.prompt, chip.autoSend);
          }}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 50,
            backgroundColor: theme.bg2,
            borderWidth: 0.5,
            borderColor: theme.border,
          }}
        >
          <Text style={{ fontSize: 13 }}>{chip.emoji}</Text>
          <Text
            style={{ fontSize: 11.5, fontWeight: '500', color: theme.text1 }}
            numberOfLines={1}
          >
            {chip.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function PulsingDot({ color }: { color: string }) {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 800 }),
        withTiming(1, { duration: 800 }),
      ),
      -1,
      true,
    );
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[
        { width: 6, height: 6, borderRadius: 3, backgroundColor: color },
        style,
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function AssistantScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id;
  const onboardingUserName = useOnboardingStore((s) => s.userName);
  const onboardingConditions = useOnboardingStore((s) => s.conditions);
  const onboardingAllergies = useOnboardingStore((s) => s.allergies);
  const onboardingDietType = useOnboardingStore((s) => s.dietType);
  const onboardingLifestyle = useOnboardingStore((s) => s.lifestyle);
  const onboardingStressLevel = useOnboardingStore((s) => s.stressLevel);
  const onboardingFamilyRole = useOnboardingStore((s) => s.familyRole);
  const onboardingProductConcerns = useOnboardingStore((s) => s.productConcerns);
  const onboardingGoals = useOnboardingStore((s) => s.guardianGoals);
  const onboardingHealthScore = useOnboardingStore((s) => s.healthScore);
  const onboardingAgeRange = useOnboardingStore((s) => s.ageRange);
  const onboardingGender = useOnboardingStore((s) => s.gender);
  const checkAndRecord = useUiStore((s) => s.checkAndRecordAiRequest);
  const getRemainingRequests = useUiStore((s) => s.getRemainingRequests);

  // ── Keyboard tracking ────────────────────────────────────────────────────
  // We manage keyboard-avoidance manually rather than using KeyboardAvoidingView
  // because this app enables `edgeToEdgeEnabled: true` on Android. In edge-to-
  // edge mode the Android window does NOT resize when the keyboard opens, so
  // KeyboardAvoidingView's padding calculation (which depends on the resize)
  // fails and the input bar ends up hidden behind the keyboard. Listening to
  // the Keyboard API directly and applying dynamic bottom padding is reliable
  // on both iOS and edge-to-edge Android.
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvt, (e) => {
      // `endCoordinates.height` is the keyboard's height in window coords.
      // On edge-to-edge Android the keyboard covers the entire bottom of the
      // window (including where the nav bar was), so this IS the padding we
      // need — do NOT subtract insets.bottom. Subtracting it caused the input
      // bar to sit half-behind the keyboard.
      const h = e.endCoordinates?.height ?? 0;
      setKeyboardHeight(Math.max(0, h));
    });
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardHeight(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // ── Router params for pre-population ─────────────────────────────────────
  const params = useLocalSearchParams<{
    productName?: string;
    ingredientName?: string;
    prescribedMedication?: string;
    dietMealName?: string;
    sessionId?: string;
  }>();
  const productNameParam = params.productName ?? '';
  const ingredientNameParam = params.ingredientName ?? '';
  const prescribedMedicationParam = params.prescribedMedication ?? '';
  const dietMealNameParam = typeof params.dietMealName === 'string' ? params.dietMealName.trim() : '';
  const sessionIdParam = typeof params.sessionId === 'string' ? params.sessionId : '';

  // ── Subscription tier for rate limits ────────────────────────────────────
  const tierQuery = useQuery<PlanId>({
    queryKey: ['subscription-tier', userId],
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('subscription_plan')
        .eq('id', userId!)
        .maybeSingle();
      return ((data as { subscription_plan: string } | null)?.subscription_plan ?? 'free') as PlanId;
    },
  });
  const tier = tierQuery.data ?? 'free';
  const isPaid = isPlanPro(tier);

  // ── Voice (TTS + STT) state ──────────────────────────────────────────────
  // TTS: controlled by useSpeechPlayer; we pass the loading/playing ids to each
  // bubble so it can render its own Listen state.
  const speech = useSpeechPlayer();
  const currentVoice = useVoiceStore((s) => s.voiceId);

  // STT: expo-audio recorder + state.
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // First-open legal disclaimer
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    const checkFirstOpen = async () => {
      const seen = await AsyncStorage.getItem('truwell_ai_disclaimer_seen_v2');
      if (!seen) {
        setShowDisclaimer(true);
      }
    };
    void checkFirstOpen();
  }, []);

  const dismissDisclaimer = async () => {
    await AsyncStorage.setItem('truwell_ai_disclaimer_seen_v2', 'true');
    setShowDisclaimer(false);
  };

  // Modals
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState<null | 'listen' | 'speak' | 'history'>(null);

  // ── Chat history (pro / premium gated) ───────────────────────────────────
  // `sessionId` is lazy-created on the first outgoing message so free users
  // and idle screens never produce empty rows in the DB. Callbacks that
  // reference message-state setters are declared after those setters below.
  const [sessionId, setSessionId] = useState<string | null>(sessionIdParam || null);
  const sessionCreateRef = useRef<Promise<string> | null>(null);
  const qc = useQueryClient();

  // ── Message state ─────────────────────────────────────────────────────────
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [rateLimitHit, setRateLimitHit] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showTyping, setShowTyping] = useState(false);

  // ── XP reward (first message per session) ─────────────────────────────────
  const [xpAwarded, setXpAwarded] = useState(false);
  const [showXp, setShowXp] = useState(false);

  // ── Chat history callbacks (depend on the message setters declared above) ─
  const ensureSessionId = useCallback(async (): Promise<string | null> => {
    if (!isPaid) return null;
    if (sessionId) return sessionId;
    if (sessionCreateRef.current) return sessionCreateRef.current;
    sessionCreateRef.current = (async () => {
      try {
        const s = await createChatSession();
        setSessionId(s.id);
        void qc.invalidateQueries({ queryKey: ['chat-sessions'] });
        return s.id;
      } catch (e) {
        if (__DEV__) console.log('[chat-history] createChatSession failed:', e);
        return '';
      } finally {
        sessionCreateRef.current = null;
      }
    })();
    const id = await sessionCreateRef.current;
    return id || null;
  }, [isPaid, sessionId, qc]);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      try {
        const loaded = await loadChatMessages(sessionId);
        if (cancelled) return;
        if (loaded.length > 0) setMessages(loaded);
      } catch (e) {
        if (__DEV__) console.log('[chat-history] loadChatMessages failed:', e);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId]);

  const startNewChat = useCallback(() => {
    hapticLight();
    setSessionId(null);
    setMessages([]);
    setXpAwarded(false);
  }, []);

  const handleHistoryPress = useCallback(() => {
    hapticLight();
    if (!isPaid) {
      setPaywallFeature('history');
      return;
    }
    setShowHistory(true);
  }, [isPaid]);

  const handleOpenSession = useCallback((id: string) => {
    if (id === sessionId) return;
    setSessionId(id);
  }, [sessionId]);

  // ── Scroll-to-bottom state ───────────────────────────────────────────────
  const [showScrollFab, setShowScrollFab] = useState(false);

  // ── Feedback modal state ─────────────────────────────────────────────────
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const submitFeedback = useCallback(async () => {
    if (feedbackRating === 0) return;
    try {
      await supabase.from('assistant_feedback').insert({
        user_id: userId ?? null,
        rating: feedbackRating,
        comment: feedbackComment.trim() || null,
      });
    } catch { /* silent */ }
    setFeedbackSubmitted(true);
    setTimeout(() => {
      setShowFeedback(false);
      setFeedbackSubmitted(false);
      setFeedbackRating(0);
      setFeedbackComment('');
    }, 1600);
  }, [feedbackRating, feedbackComment, userId]);

  // ── Animation shared values ──────────────────────────────────────────────
  const inputBarScale = useSharedValue(1);
  const sendBtnRotation = useSharedValue(0);

  const listRef = useRef<FlatList<Message>>(null);
  const lastUserRef = useRef('');
  const dismissedSpecialtyKeys = useRef(new Set<string>());

  // ── Pre-populate from route params ───────────────────────────────────────
  useEffect(() => {
    if (prescribedMedicationParam) {
      setInput(
        `I was prescribed ${prescribedMedicationParam}. Please explain in plain language what this medication is often used for, typical dosage forms in general (not my personal instructions), common side effects, what to discuss with a pharmacist or clinician, and when to get urgent care. This is for general education only, not personal medical advice.`
      );
      return;
    }
    if (dietMealNameParam) {
      setInput(
        `Tell me about the ${dietMealNameParam} meal. What are its nutritional benefits for my body? What happens if I eat this consistently for 21 days? Are there any improvements or concerns for my health profile?`
      );
      return;
    }
    if (!productNameParam && !ingredientNameParam) return;

    // Build a specific scan-analysis query and auto-send it
    if (productNameParam) {
      const q = `Analyze this scanned product for me: "${productNameParam}". Is it suitable for my health profile? Flag any allergens, ingredients I should avoid, or concerns based on my conditions. If you need the full ingredient list to give a detailed analysis, let me know.`;
      setInput(q);
      const t = setTimeout(() => { void send(q); }, 400);
      return () => clearTimeout(t);
    }
    if (ingredientNameParam) {
      const q = `Tell me about the ingredient "${ingredientNameParam}" and whether it is safe for my health profile.`;
      setInput(q);
      const t = setTimeout(() => { void send(q); }, 400);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productNameParam, ingredientNameParam, prescribedMedicationParam, dietMealNameParam]);

  const scrollEnd = useCallback(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, []);

  useEffect(() => { scrollEnd(); }, [messages, showTyping, scrollEnd]);

  // ── Animated styles ──────────────────────────────────────────────────────
  const inputBarAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: inputBarScale.value }],
  }));

  const sendBtnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sendBtnRotation.value}deg` }],
  }));

  // ── Call ai-health-assistant (non-streaming JSON) ─────────────────────────
  const runAiHealthAssistant = useCallback(
    async (threadForApi: Message[], botId: string) => {
      const profile  = useUserProfileStore.getState().profile;
      const lastScan = useScanStore.getState().lastResult;
      const userId   = useAuthStore.getState().session?.user?.id;

      let extendedProfile = null;
      let wellnessData    = null;
      let recentScans: Array<{ productName: string; grade?: string; score?: number }> = [];

      if (userId) {
        try {
          // We pull the user's full wellness row (including goals) so the AI
          // can give personalized advice tied to their actual hydration and
          // breathing patterns. We also fetch:
          //  - last completed breathing session timestamp
          //  - 7-day hydration history (to compute a rolling average)
          const sevenDaysAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          const [hpRes, wellRes, scansRes, lastBreathRes, hydrHistoryRes] = await Promise.allSettled([
            supabase.from('user_health_profiles')
              .select('allergens,conditions,medications,diet_preference,activity_level,skin_type,sun_exposure,city,country,lifestyle_habits,is_pregnant_or_breastfeeding')
              .eq('user_id', userId).maybeSingle(),
            supabase.from('user_wellness')
              .select('current_streak,xp_level,total_xp,daily_water_cups,water_goal,breathing_sessions_today,breathing_goal')
              .eq('user_id', userId).maybeSingle(),
            supabase.from('scan_history')
              .select('product_name,grade,score')
              .eq('user_id', userId)
              .order('created_at', { ascending: false })
              .limit(5),
            supabase.from('breathing_sessions')
              .select('completed_at')
              .eq('user_id', userId)
              .order('completed_at', { ascending: false })
              .limit(1),
            supabase.from('hydration_logs')
              .select('ml, logged_at')
              .eq('user_id', userId)
              .gte('logged_at', sevenDaysAgoIso),
          ]);
          if (hpRes.status === 'fulfilled') extendedProfile = hpRes.value.data;
          if (wellRes.status === 'fulfilled' && wellRes.value.data) {
            const w = wellRes.value.data as Record<string, unknown>;
            const hydrationTodayCups = w.daily_water_cups as number | undefined;
            const hydrationGoalCups  = (w.water_goal as number | undefined) ?? 8;
            const breathingTodaySessions = w.breathing_sessions_today as number | undefined;
            const breathingGoalSessions  = (w.breathing_goal as number | undefined) ?? 3;

            let breathingLastSessionAt: string | undefined;
            if (lastBreathRes.status === 'fulfilled') {
              const rows = (lastBreathRes.value.data ?? []) as Array<{ completed_at?: string }>;
              breathingLastSessionAt = rows[0]?.completed_at;
            }

            // Rolling 7-day hydration average: prefer hydration_logs if they
            // exist (ml per entry, we convert to cups at 250ml each). If the
            // table isn't populated, we silently skip — the AI still has today.
            let hydrationWeekAvgCups: number | undefined;
            if (hydrHistoryRes.status === 'fulfilled') {
              const rows = (hydrHistoryRes.value.data ?? []) as Array<{ ml?: number; logged_at?: string }>;
              if (rows.length > 0) {
                const byDay = new Map<string, number>();
                rows.forEach((r) => {
                  if (!r.logged_at || typeof r.ml !== 'number') return;
                  const day = r.logged_at.slice(0, 10);
                  byDay.set(day, (byDay.get(day) ?? 0) + r.ml);
                });
                if (byDay.size > 0) {
                  const totalMl = Array.from(byDay.values()).reduce((a, b) => a + b, 0);
                  hydrationWeekAvgCups = totalMl / 250 / byDay.size;
                }
              }
            }

            wellnessData = {
              currentStreak:           w.current_streak     as number | undefined,
              xpLevel:                 w.xp_level           as number | undefined,
              totalXp:                 w.total_xp           as number | undefined,
              avgDailyWater:           hydrationTodayCups,
              breathingThisWeek:       breathingTodaySessions,
              hydrationTodayCups,
              hydrationGoalCups,
              hydrationWeekAvgCups,
              breathingTodaySessions,
              breathingGoalSessions,
              breathingLastSessionAt,
            };
          }
          if (scansRes.status === 'fulfilled') {
            recentScans = ((scansRes.value.data ?? []) as Array<{ product_name: string; grade?: string; score?: number }>)
              .map((s) => ({ productName: s.product_name, grade: s.grade, score: s.score }));
          }
        } catch { /* non-critical, continue without */ }
      }

      const onboardingProfile = {
        userName:        onboardingUserName || undefined,
        ageRange:        onboardingAgeRange || undefined,
        gender:          onboardingGender || undefined,
        conditions:      onboardingConditions,
        allergies:       onboardingAllergies,
        dietType:        onboardingDietType || undefined,
        lifestyle:       onboardingLifestyle || undefined,
        stressLevel:     onboardingStressLevel || undefined,
        familyRole:      onboardingFamilyRole || undefined,
        productConcerns: onboardingProductConcerns,
        guardianGoals:   onboardingGoals,
        healthScore:     onboardingHealthScore || undefined,
      };

      const context = buildAssistantContext(profile, lastScan, {
        extendedProfile,
        wellnessData,
        recentScans,
        onboardingProfile,
      });
      const payload = threadForApi.map(({ role, content }) => ({ role, content }));

      setShowTyping(true);
      setLoading(true);

      try {
        const result = await invokeAiHealthAssistant({
          messages: payload,
          context,
          product_name: productNameParam || undefined,
          ingredient_name: ingredientNameParam || undefined,
          diet_meal_name: dietMealNameParam || undefined,
        });

        setShowTyping(false);
        hapticLight();
        setMessages((prev) =>
          prev.map((x) =>
            x.id === botId
              ? {
                  ...x,
                  content: result.reply,
                }
              : x
          )
        );
        setRetryAttempts(0);
        // Persist the assistant reply (paid users only; helper is a no-op for free).
        const sid = await ensureSessionId();
        if (sid) {
          void persistChatMessage({
            sessionId: sid,
            role: 'assistant',
            content: result.reply,
          });
          void qc.invalidateQueries({ queryKey: ['chat-sessions'] });
        }
      } catch (e) {
        setShowTyping(false);
        // Use the friendly message already produced by invokeAiHealthAssistant / edge.ts
        const msg = e instanceof Error ? e.message : "I'm having trouble connecting right now. Please try again in a moment.";
        setMessages((prev) =>
          prev.map((x) =>
            x.id === botId
              ? { ...x, content: msg, failed: true }
              : x
          )
        );
      } finally {
        setLoading(false);
      }
    },
    [
      productNameParam,
      ingredientNameParam,
      dietMealNameParam,
      ensureSessionId,
      qc,
      onboardingUserName,
      onboardingAgeRange,
      onboardingGender,
      onboardingConditions,
      onboardingAllergies,
      onboardingDietType,
      onboardingLifestyle,
      onboardingStressLevel,
      onboardingFamilyRole,
      onboardingProductConcerns,
      onboardingGoals,
      onboardingHealthScore,
    ]
  );

  // ── Send ──────────────────────────────────────────────────────────────────
  const send = useCallback(
    async (text?: string) => {
      const body = (text ?? input).trim();
      if (!body || loading) return;

      const allowed = checkAndRecord(tier);
      if (!allowed) {
        setRateLimitHit(true);
        return;
      }
      setRateLimitHit(false);

      // Dopamine: input bar compress + send button spin
      hapticMedium();
      inputBarScale.value = withSequence(
        withTiming(0.97, { duration: 80 }),
        withSpring(1, { damping: 14, stiffness: 200 }),
      );
      sendBtnRotation.value = withTiming(sendBtnRotation.value + 360, { duration: 300 });

      // XP reward on first message per session
      if (!xpAwarded) {
        setXpAwarded(true);
        setShowXp(true);
      }

      setInput('');
      lastUserRef.current = body;

      const now = new Date().toISOString();
      const userMsg: Message = { id: String(Date.now()), role: 'user', content: body, created_at: now };
      const botId = `bot-${Date.now()}`;
      const botShell: Message = { id: botId, role: 'assistant', content: '', created_at: now };

      setMessages((prev) => [...prev, userMsg, botShell]);
      const threadForApi = [...messages, userMsg];
      setRetryAttempts(0);

      // Persist the user message (paid users only). We fire-and-forget so the
      // UI never waits on the DB insert. The DB trigger also auto-titles the
      // session from the first user message.
      const sid = await ensureSessionId();
      if (sid) {
        void persistChatMessage({
          sessionId: sid,
          role: 'user',
          content: body,
        });
      }

      await runAiHealthAssistant(threadForApi, botId);
    },
    [input, loading, messages, checkAndRecord, tier, runAiHealthAssistant, xpAwarded, inputBarScale, sendBtnRotation, ensureSessionId]
  );

  // ── Retry ─────────────────────────────────────────────────────────────────
  const retry = useCallback(() => {
    if (retryAttempts >= MAX_RETRIES) return;
    hapticLight();
    setRetryAttempts((n) => n + 1);
    setMessages((prev) => {
      const trimmed = prev.filter((x) => !(x as Message & { failed?: boolean }).failed);
      const botId = `bot-${Date.now()}`;
      const threadForApi = trimmed.filter((x) => x.content.trim().length > 0);
      const next: Message[] = [...trimmed, { id: botId, role: 'assistant', content: '', created_at: new Date().toISOString() }];
      queueMicrotask(() => void runAiHealthAssistant(threadForApi, botId));
      return next;
    });
  }, [retryAttempts, runAiHealthAssistant]);

  // ── Image picker ──────────────────────────────────────────────────────────
  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.4,
    });
    if (!res.canceled && res.assets[0]?.base64) {
      await send('I attached an ingredient label image. Please summarize what to watch for.');
    }
  };

  const takePhoto = async () => {
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.4,
    });
    if (!res.canceled && res.assets[0]?.base64) {
      await send('I took a photo of an ingredient label. Please summarize what to watch for.');
    }
  };

  // ── Document picker ───────────────────────────────────────────────────────
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        await handleDocumentUpload(result.assets[0]);
      }
    } catch {
      Alert.alert('Error', 'Could not open document picker.');
    }
  };

  const handleDocumentUpload = async (asset: DocumentPicker.DocumentPickerAsset) => {
    const sizeKb = Math.round((asset.size ?? 0) / 1024);
    const now    = new Date().toISOString();

    const docMsg: Message = {
      id:             `doc-${Date.now()}`,
      role:           'user',
      content:        `Uploaded: ${asset.name}`,
      documentName:   asset.name,
      documentSizeKb: sizeKb,
      created_at:     now,
    };
    setMessages((prev) => [...prev, docMsg]);

    let fileContent = `[${asset.name} | ${asset.mimeType ?? 'document'} | ${sizeKb}KB]`;
    if (asset.mimeType === 'text/plain') {
      try {
        fileContent = (await new File(asset.uri).text()).slice(0, 2000);
      } catch { /* non-fatal */ }
    }

    await send(
      `The user has uploaded a file named "${asset.name}" (${asset.mimeType ?? 'document'}, ${sizeKb}KB). ` +
      `File content or reference: ${fileContent}`
    );
  };

  // ── Attachment action sheet ───────────────────────────────────────────────
  const [showAttachSheet, setShowAttachSheet] = useState(false);

  const openAttachSheet = () => {
    hapticLight();
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Gallery', 'Upload Document (PDF, Word, Text)'],
          cancelButtonIndex: 0,
        },
        (idx) => {
          if (idx === 1) void takePhoto();
          if (idx === 2) void pickImage();
          if (idx === 3) void pickDocument();
        }
      );
    } else {
      setShowAttachSheet(true);
    }
  };

  const remaining = getRemainingRequests(tier);
  const hasUserMessages = messages.length >= 1;

  const clearSpecialty = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const sk = m.specialty_suggestion?.specialty.trim().toLowerCase();
        if (sk) dismissedSpecialtyKeys.current.add(sk);
        return { ...m, specialty_suggestion: undefined };
      })
    );
  }, []);

  // ── Welcome card chip handler (2x2 grid) ──────────────────────────────────
  const handleWelcomeChip = useCallback(
    (prompt: string, autoSend: boolean) => {
      hapticLight();
      setInput(prompt);
      if (autoSend) {
        const t = setTimeout(() => {
          void send(prompt);
        }, 280);
        return () => clearTimeout(t);
      }
      return undefined;
    },
    [router, send],
  );

  // ── Listen (TTS) handler — shown on each AI bubble ────────────────────────
  const handleListen = useCallback((id: string, text: string) => {
    if (!isPaid) {
      setPaywallFeature('listen');
      return;
    }
    void speech.play(id, text);
  }, [isPaid, speech]);

  // ── Mic (STT) flow: start/stop recording, then transcribe ─────────────────
  const startRecording = useCallback(async () => {
    // Gate on subscription tier first.
    if (!isPaid) {
      setPaywallFeature('speak');
      return;
    }
    try {
      hapticMedium();
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Microphone access needed',
          'Please enable microphone permissions in Settings to talk to the assistant.'
        );
        return;
      }
      // Put the audio session in record mode. play-mode settings left from TTS
      // can suppress the mic on iOS.
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
        shouldPlayInBackground: false,
        interruptionMode: 'duckOthers',
      });
      // Stop any currently-playing TTS so we don't record it.
      speech.stop();
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (e) {
      if (__DEV__) console.log('[voice] startRecording failed', e);
      Alert.alert('Could not start recording', 'Please try again.');
    }
  }, [isPaid, recorder, speech]);

  const stopRecordingAndTranscribe = useCallback(async () => {
    if (!recorderState.isRecording) return;
    try {
      hapticLight();
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) {
        Alert.alert('Nothing to transcribe', 'No recording was captured.');
        return;
      }
      setIsTranscribing(true);
      const mime = guessAudioMime(uri);
      const audio_base64 = await readRecordingAsBase64(uri);
      const { text } = await invokeSttTranscription({
        audio_base64,
        mime_type: mime,
        filename: filenameForMime(mime),
      });
      if (text.trim().length === 0) {
        Alert.alert("Didn't catch that", 'We could not hear any speech. Please try again.');
      } else {
        // Merge the transcription into any existing typed text.
        setInput((prev) => (prev ? `${prev.trim()} ${text}` : text));
      }
    } catch (e) {
      if (__DEV__) console.log('[voice] transcription failed', e);
      Alert.alert(
        'Transcription failed',
        e instanceof Error ? e.message : 'Please try again.'
      );
    } finally {
      setIsTranscribing(false);
    }
  }, [recorder, recorderState.isRecording]);

  const handleMicPress = useCallback(() => {
    if (!isPaid) {
      setPaywallFeature('speak');
      return;
    }
    if (recorderState.isRecording) {
      void stopRecordingAndTranscribe();
    } else {
      void startRecording();
    }
  }, [isPaid, recorderState.isRecording, startRecording, stopRecordingAndTranscribe]);

  // Surface TTS errors to the user — quota / rate-limit errors are silent
  // (the feature is non-critical and spamming an Alert every message is disruptive).
  useEffect(() => {
    if (!speech.error) return;
    if (__DEV__) console.log('[voice] TTS error:', speech.error);
    const isQuotaError = /429|quota|rate.?limit|billing/i.test(speech.error);
    if (!isQuotaError) {
      Alert.alert('Voice playback failed', speech.error || 'Could not play audio. Please try again.');
    }
  }, [speech.error]);

  // ── Voice preview handler (used in VoicePickerModal) ─────────────────────
  const handleVoicePreview = useCallback(async (voiceId: string) => {
    if (speech.playingId === `preview-${voiceId}`) {
      speech.stop();
      return;
    }
    // Temporarily override voice via a direct play with the chosen voice id
    // We reuse the same speech player but pass the specific voice in the text id.
    // The VoiceStore is updated first so the player picks up the right voice.
    const { setVoice } = await import('@/stores/voiceStore').then(m => ({ setVoice: m.useVoiceStore.getState().setVoice }));
    setVoice(voiceId as Parameters<typeof setVoice>[0]);
    void speech.play(`preview-${voiceId}`, VOICE_PREVIEW_TEXT);
  }, [speech]);

  const nimTTS = useNIMTTS();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg0 }]} edges={['top']}>
      {/* First-open legal disclaimer modal */}
      {showDisclaimer && (
        <Modal
          visible={showDisclaimer}
          animationType="fade"
          transparent
          onRequestClose={() => void dismissDisclaimer()}
        >
          <View style={styles.disclaimerOverlay}>
            <View style={styles.disclaimerCard}>
              <Text style={styles.disclaimerTitle}>Before We Begin</Text>
              <Text style={styles.disclaimerBody}>{LEGAL.AI_FIRST_OPEN}</Text>
              <TouchableOpacity
                style={styles.disclaimerBtn}
                onPress={() => void dismissDisclaimer()}
              >
                <Text style={styles.disclaimerBtnText}>I Understand — Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* ── Redesigned compact header: avatar, live status, icons ── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 18,
          paddingTop: 6,
          paddingBottom: 12,
          borderBottomWidth: 0.5,
          borderBottomColor: theme.border,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={10}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: theme.bg1,
            borderWidth: 0.5,
            borderColor: theme.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityLabel="Go back"
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 18l-6-6 6-6"
              stroke={theme.text1}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>

        <View style={{ position: 'relative' }}>
          <SofiaAvatar
            size="small"
            teal={theme.teal}
            gold={theme.gold}
            purple={theme.purple}
            thinking={showTyping}
            speaking={!hasUserMessages && !showTyping}
          />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <SofiaBadge variant="compact" />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '500',
                color: showTyping ? theme.gold : !hasUserMessages ? theme.teal : '#2ECC71',
              }}
            >
              ●
            </Text>
            <Text style={{ fontSize: 11, color: theme.text3 }} numberOfLines={1}>
              {showTyping
                ? 'Thinking...'
                : !hasUserMessages
                  ? 'Speaking'
                  : 'Wellness intelligence'}
            </Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: theme.bg1,
            borderWidth: 0.5,
            borderColor: theme.border,
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 4,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '800', color: theme.teal, lineHeight: 16 }}>47</Text>
          <Text style={{ fontSize: 8, fontWeight: '700', letterSpacing: 0.5, color: theme.text3, textTransform: 'uppercase' }}>
            DBs
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleHistoryPress}
          hitSlop={10}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: isPaid ? `${theme.teal}12` : theme.bg1,
            borderWidth: 0.5,
            borderColor: isPaid ? `${theme.teal}44` : theme.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityLabel="View chat history"
        >
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path
              d="M4 12a8 8 0 1 0 2.5-5.8M4 4v4h4M12 7v5l3 2"
              stroke={isPaid ? theme.teal : theme.text3}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => { hapticLight(); setShowFeedback(true); }}
          hitSlop={10}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: theme.bg1,
            borderWidth: 0.5,
            borderColor: theme.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityLabel="Give feedback or contact support"
        >
          <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 19V8a4 4 0 0 0-4-4H4"
              stroke={theme.text3}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0}
            />
            <Circle cx="12" cy="12" r="1" fill={theme.text3} />
            <Circle cx="12" cy="5" r="1" fill={theme.text3} />
            <Circle cx="12" cy="19" r="1" fill={theme.text3} />
          </Svg>
        </TouchableOpacity>
      </View>

      {/*
        Manual keyboard avoidance — see the useEffect near the top of this
        component for why we don't use KeyboardAvoidingView here. The bottom
        padding below tracks the reported keyboard height and pushes the input
        bar above it reliably on iOS and edge-to-edge Android.
      */}
      <View style={[styles.flex, { paddingBottom: keyboardHeight }]}>
        {/* ── Chat list ────────────────────────────────────────────────────── */}
        <View style={styles.flex}>
          <FlatList
            ref={listRef}
            style={styles.flex}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={scrollEnd}
            onScroll={(e) => {
              const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
              const distFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
              setShowScrollFab(distFromBottom > 120);
            }}
            scrollEventThrottle={64}
            removeClippedSubviews
            initialNumToRender={14}
            maxToRenderPerBatch={14}
            windowSize={7}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            ListHeaderComponent={
              !hasUserMessages ? (
                <AssistantWelcomeCard onChipPress={handleWelcomeChip} />
              ) : null
            }
            renderItem={({ item }) => {
              const isFailed = !!(item as Message & { failed?: boolean }).failed;
              const isUser = item.role === 'user';
              const entering = isUser
                ? FadeInRight.duration(300).springify().damping(18).stiffness(200)
                : FadeInDown.duration(400).springify().damping(16).stiffness(180);
              return (
                <Animated.View entering={entering}>
                  <AIMessageBubble
                    message={item}
                    onDismissSpecialty={clearSpecialty}
                    onRequestListen={handleListen}
                    listenLoadingId={speech.loadingId}
                    listenPlayingId={speech.playingId}
                  />
                  {!isUser && !item.documentName && item.content.trim().length > 0 && !isFailed && (
                    <NIMTTSButton
                      text={item.content}
                      messageId={item.id}
                      status={nimTTS.status}
                      isActive={nimTTS.currentMessageId === item.id}
                      isNIMAvailable={nimTTS.isNIMAvailable}
                      onSpeak={nimTTS.speak}
                      onStop={nimTTS.stop}
                    />
                  )}
                  {isFailed && (
                    <View style={styles.retryRow}>
                      <TouchableOpacity
                        onPress={retry}
                        disabled={retryAttempts >= MAX_RETRIES}
                        style={[
                          styles.retryBtn,
                          {
                            borderColor: retryAttempts >= MAX_RETRIES ? theme.border : `${theme.gold}40`,
                            backgroundColor: retryAttempts >= MAX_RETRIES ? 'transparent' : `${theme.gold}14`,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.retryText,
                            { color: retryAttempts >= MAX_RETRIES ? theme.text3 : theme.gold },
                          ]}
                        >
                          {retryAttempts >= MAX_RETRIES ? 'Max retries reached' : 'Retry'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </Animated.View>
              );
            }}
            ListFooterComponent={
              showTyping ? (
                <Animated.View
                  entering={FadeInUp.duration(220)}
                  exiting={FadeOut.duration(200)}
                  style={[styles.typingWrap, { backgroundColor: theme.bg1, borderColor: theme.border }]}
                >
                  <TypingIndicator />
                </Animated.View>
              ) : null
            }
          />

          {/* Scroll-to-bottom FAB */}
          <ScrollToBottomFab
            visible={showScrollFab}
            color={theme.teal}
            onPress={() => listRef.current?.scrollToEnd({ animated: true })}
          />

          {/* XP float */}
          {showXp && <XpFloat onDone={() => setShowXp(false)} />}
        </View>

        {/* ── Rate limit warning ────────────────────────────────────────────── */}
        {(rateLimitHit || remaining <= 3) && (
          <View style={[styles.rateBanner, { backgroundColor: `${theme.gold}14`, borderColor: `${theme.gold}30` }]}>
            <Text style={[styles.rateText, { color: theme.gold }]}>
              {rateLimitHit
                ? `Hourly limit reached (${!isPaid ? '20' : '100'} requests). Upgrade for more.`
                : `${remaining} request${remaining !== 1 ? 's' : ''} remaining this hour`}
            </Text>
            {!isPaid && (
              <TouchableOpacity onPress={() => router.push('/settings/subscription' as never)} hitSlop={8}>
                <Text style={[styles.upgradeLink, { color: theme.gold }]}>Upgrade</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {hasUserMessages && (
          <PersistentQuickActions
            onChipPress={handleWelcomeChip}
            theme={theme}
          />
        )}

        {/* ── Voice controls strip (shown for paid users) ──────────────────── */}
        {isPaid && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 16,
              paddingBottom: 2,
            }}
          >
            <TouchableOpacity
              onPress={() => { hapticLight(); setShowVoicePicker(true); }}
              activeOpacity={0.8}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <PulsingDot color={theme.teal} />
              <Text style={{ fontSize: 11, color: theme.text3, fontWeight: '500' }}>
                Voice:
              </Text>
              <Text style={{ fontSize: 11, color: theme.teal, fontWeight: '600' }}>
                {voiceLabel(currentVoice)}
              </Text>
            </TouchableOpacity>
            {recorderState.isRecording && (
              <View style={[styles.recordingPill, { backgroundColor: `${theme.red}18`, borderColor: `${theme.red}55` }]}>
                <View style={[styles.recordingDot, { backgroundColor: theme.red }]} />
                <Text style={[styles.recordingTxt, { color: theme.red }]}>Recording...</Text>
              </View>
            )}
            {isTranscribing && (
              <View style={[styles.recordingPill, { backgroundColor: `${theme.gold}18`, borderColor: `${theme.gold}55` }]}>
                <Text style={[styles.recordingTxt, { color: theme.gold }]}>Transcribing...</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Input bar ─────────────────────────────────────────────────────── */}
        <Animated.View
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              gap: 9,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderTopWidth: 0.5,
              backgroundColor: theme.bg0,
              borderColor: theme.border,
            },
            inputBarAnimStyle,
          ]}
        >
          <TouchableOpacity
            onPress={openAttachSheet}
            hitSlop={8}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: theme.bg1,
              borderWidth: 0.5,
              borderColor: theme.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 5v14M5 12h14"
                stroke={theme.text3}
                strokeWidth={2}
                strokeLinecap="round"
              />
            </Svg>
          </TouchableOpacity>
          <TextInput
            style={{
              flex: 1,
              backgroundColor: theme.bg1,
              borderWidth: 0.5,
              borderColor: theme.border,
              borderRadius: 22,
              paddingHorizontal: 16,
              paddingVertical: 9,
              fontSize: 13.5,
              color: theme.text1,
              maxHeight: 100,
            }}
            placeholder="Message Sofia..."
            placeholderTextColor={theme.text3}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => void send()}
            onFocus={() => {
              setTimeout(() => scrollEnd(), 250);
            }}
            returnKeyType="send"
            multiline
          />

          {/* Mic button: gated for free users via paywall callback. */}
          <TouchableOpacity
            onPress={handleMicPress}
            disabled={isTranscribing}
            hitSlop={6}
            style={[
              {
                width: 34,
                height: 34,
                borderRadius: 17,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 0.5,
              },
              {
                backgroundColor: recorderState.isRecording
                  ? theme.red
                  : isPaid
                    ? `${theme.teal}18`
                    : `${theme.text3}14`,
                borderColor: recorderState.isRecording
                  ? theme.red
                  : isPaid
                    ? `${theme.teal}44`
                    : `${theme.text3}33`,
              },
            ]}
            accessibilityLabel={
              recorderState.isRecording ? 'Stop recording and transcribe' : 'Tap to speak to the assistant'
            }
          >
            <MicGlyph
              color={
                recorderState.isRecording
                  ? theme.bg0
                  : isPaid
                    ? theme.teal
                    : theme.text3
              }
              size={16}
            />
          </TouchableOpacity>

          {/* Send: solid cyan circle + paper-plane icon (replaces text pill) */}
          <Animated.View style={sendBtnAnimStyle}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => void send()}
              disabled={loading || !input.trim()}
              style={[
                {
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#22E6D6',
                  opacity: loading || !input.trim() ? 0.5 : 1,
                },
              ]}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                  stroke="#0B0F1A"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
        <Text style={{
          fontSize: 9.5,
          color: 'rgba(160,174,192,0.5)',
          textAlign: 'center',
          paddingHorizontal: 16,
          paddingBottom: 4,
          lineHeight: 13,
        }}>
          Not a medical device. Does not diagnose, treat, or prevent any condition.
        </Text>
        <EmergencyNotice compact />
      </View>

      {/* ── Android attach action sheet ──────────────────────────────────── */}
      <Modal
        visible={showAttachSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAttachSheet(false)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setShowAttachSheet(false)}>
          <View style={[styles.sheetPanel, { backgroundColor: theme.bg1 }]}>
            {[
              { label: 'Take Photo',                         onPress: () => { setShowAttachSheet(false); void takePhoto(); } },
              { label: 'Choose from Gallery',                onPress: () => { setShowAttachSheet(false); void pickImage(); } },
              { label: 'Upload Document (PDF, Word, Text)',  onPress: () => { setShowAttachSheet(false); void pickDocument(); } },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.label}
                onPress={opt.onPress}
                style={[styles.sheetOption, { borderBottomColor: theme.border }]}
              >
                <Text style={[styles.sheetOptionText, { color: theme.text1 }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setShowAttachSheet(false)}
              style={[styles.sheetCancel, { borderTopColor: theme.border }]}
            >
              <Text style={[styles.sheetCancelText, { color: theme.text3 }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* ── Feedback / Support modal ─────────────────────────────────────── */}
      <Modal
        visible={showFeedback}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFeedback(false)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setShowFeedback(false)}>
          <View style={[styles.feedbackPanel, { backgroundColor: theme.bg1 }]}>
            {feedbackSubmitted ? (
              <View style={styles.feedbackThanks}>
                <Text style={[styles.feedbackThanksText, { color: theme.teal }]}>Thank you for your feedback!</Text>
              </View>
            ) : (
              <>
                <Text style={[styles.feedbackTitle, { color: theme.text1 }]}>Rate this conversation</Text>
                <Text style={[styles.feedbackSub, { color: theme.text3 }]}>Help us improve TruWell AI</Text>

                {/* Star rating */}
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <TouchableOpacity
                      key={n}
                      onPress={() => { hapticLight(); setFeedbackRating(n); }}
                      hitSlop={6}
                    >
                      <Text style={[styles.star, { color: n <= feedbackRating ? theme.gold : theme.border }]}>
                        ★
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Comment */}
                <TextInput
                  style={[styles.feedbackInput, { backgroundColor: theme.bg2, borderColor: theme.border, color: theme.text1 }]}
                  placeholder="Optional comment..."
                  placeholderTextColor={theme.text3}
                  value={feedbackComment}
                  onChangeText={setFeedbackComment}
                  multiline
                  maxLength={300}
                />

                {/* Submit */}
                <TouchableOpacity
                  onPress={() => void submitFeedback()}
                  disabled={feedbackRating === 0}
                  style={[
                    styles.feedbackSubmit,
                    { backgroundColor: feedbackRating === 0 ? `${theme.teal}30` : theme.teal },
                  ]}
                >
                  <Text style={[styles.feedbackSubmitText, { color: theme.bg0 }]}>Submit Feedback</Text>
                </TouchableOpacity>

                {/* Contact support */}
                <TouchableOpacity
                  onPress={() => {
                    hapticLight();
                    void import('react-native').then(({ Linking }) =>
                      Linking.openURL('mailto:support@truwellai.xyz?subject=TruWell%20AI%20Support')
                    );
                  }}
                  style={[styles.contactSupport, { borderTopColor: theme.border }]}
                >
                  <Text style={[styles.contactSupportText, { color: theme.text3 }]}>
                    Contact Support  →  support@truwellai.xyz
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* ── Voice picker (paid users choose voice) ────────────────────────── */}
      <VoicePickerModal
        visible={showVoicePicker}
        onClose={() => setShowVoicePicker(false)}
        onPreview={handleVoicePreview}
        previewLoadingId={speech.loadingId}
        previewPlayingId={speech.playingId}
      />

      {/* ── Chat history browser (paid users) ─────────────────────────────── */}
      <ChatHistoryModal
        visible={showHistory}
        onClose={() => setShowHistory(false)}
        onOpenSession={handleOpenSession}
        onNewSession={startNewChat}
        activeSessionId={sessionId}
      />

      {/* ── Paywall for free users tapping premium features ───────────────── */}
      <VoicePaywallModal
        visible={paywallFeature !== null}
        feature={paywallFeature ?? 'listen'}
        onClose={() => setPaywallFeature(null)}
      />
      <NIMTTSPlayerBar
        status={nimTTS.status}
        voiceName={nimTTS.selectedVoice.name}
        durationMs={nimTTS.durationMs}
        progressMs={nimTTS.progressMs}
        onPause={nimTTS.pause}
        onResume={nimTTS.resume}
        onStop={nimTTS.stop}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  listContent: { paddingTop: 8, paddingBottom: 12 },

  // Header
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerFlex: { flex: 1 },
  historyBtn: {
    marginRight: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackBtn: {
    marginRight: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackBtnText: { fontSize: 14, fontWeight: '700' },

  // Feedback modal
  feedbackPanel: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 24,
    gap: 14,
  },
  feedbackTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  feedbackSub: { fontSize: 12, fontWeight: '500', marginTop: -8 },
  starsRow: { flexDirection: 'row', gap: 12, paddingVertical: 4 },
  star: { fontSize: 30 },
  feedbackInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  feedbackSubmit: {
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  feedbackSubmitText: { fontSize: 14, fontWeight: '800' },
  contactSupport: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 14,
    alignItems: 'center',
  },
  contactSupportText: { fontSize: 12, fontWeight: '500' },
  feedbackThanks: { paddingVertical: 32, alignItems: 'center' },
  feedbackThanksText: { fontSize: 16, fontWeight: '800' },

  typingWrap: {
    alignSelf: 'flex-start',
    marginLeft: 50,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
  },

  retryRow: { paddingHorizontal: 50, marginBottom: 6 },
  retryBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  retryText: { fontSize: 12, fontWeight: '700' },

  rateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  rateText: { flex: 1, fontSize: 12, fontWeight: '500' },
  upgradeLink: { fontSize: 12, fontWeight: '700', flexShrink: 0 },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    margin: 12,
    marginTop: 4,
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  attachBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 2,
  },
  attachIcon: { fontSize: 24, fontWeight: '300', lineHeight: 28 },

  // Voice strip above the input bar
  voiceStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  voiceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    maxWidth: 180,
  },
  voiceChipTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },
  recordingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  recordingDot: { width: 7, height: 7, borderRadius: 4 },
  recordingTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },

  // Mic button inside the input bar
  micBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },

  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    fontWeight: '500',
    maxHeight: 120,
  },
  sendBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 0.5,
    alignSelf: 'flex-end',
  },
  sendText: { fontSize: 13, fontWeight: '800' },

  // Android attach sheet
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetPanel: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  sheetOption: {
    paddingVertical: 17,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetOptionText: { fontSize: 15, fontWeight: '600' },
  sheetCancel: {
    paddingVertical: 17,
    paddingHorizontal: 20,
    borderTopWidth: 6,
  },
  sheetCancelText: { fontSize: 15, fontWeight: '500', textAlign: 'center' },

  // First-open legal disclaimer
  disclaimerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  disclaimerCard: {
    backgroundColor: '#020A14',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,229,200,0.2)',
    maxWidth: 400,
    width: '100%',
  },
  disclaimerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#EEF2FF',
    marginBottom: 14,
    textAlign: 'center',
  },
  disclaimerBody: {
    fontSize: 13,
    color: 'rgba(238,242,255,0.72)',
    lineHeight: 20,
    marginBottom: 22,
  },
  disclaimerBtn: {
    backgroundColor: '#00E5C8',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  disclaimerBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#020A14',
  },
});

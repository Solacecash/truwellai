import AsyncStorage from '@react-native-async-storage/async-storage';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, Pressable, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Path } from 'react-native-svg';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme/ThemeContext';
import type { Theme } from '@/theme/index';

const STORAGE_KEY = 'truwell_tip_dismissed_date';
const HELPFUL_STORAGE_KEY = 'truwell_tip_helpful_marked';

// ---------------------------------------------------------------------------
// 60 Expanded health tips and facts
// ---------------------------------------------------------------------------

export const HEALTH_TIPS_AND_FACTS: readonly string[] = [
  // BODY FACTS
  '\uD83E\uDDE0 Your brain generates about 23 watts of electricity while awake, enough to power a small LED bulb. Every thought you have is an electrical signal.',
  '\u2764\uFE0F Your heart beats about 100,000 times per day and pumps 7,500 litres of blood. Over a lifetime it beats over 2.5 billion times without rest.',
  '\uD83E\uDD7F Tooth enamel is the hardest substance your body produces, harder than bone. Yet it cannot regenerate once destroyed. Protect it.',
  '\uD83D\uDC41\uFE0F Your eyes can detect a single photon of light in complete darkness. They can distinguish up to 10 million different colors.',
  '\uD83E\uDDEC You share 60% of your DNA with a banana, 85% with a mouse, and 96% with a chimpanzee.',
  '\uD83D\uDCAA The human body has over 600 muscles. The strongest relative to size is the masseter (jaw muscle) which can exert up to 91kg of force.',
  '\uD83E\uDEC1 Your lungs have a surface area roughly equal to a tennis court if fully unfolded, around 70 square metres.',
  '\uD83E\uDE78 A single drop of blood contains about 5 million red blood cells, 10,000 white blood cells, and 250,000 platelets.',
  '\uD83E\uDDB4 Babies are born with 270 bones. Adults have 206. Bones fuse together during childhood and early adulthood.',
  '\uD83E\uDDEA Your body produces about 25 million new cells every second. You replace your entire skin every 2-3 weeks.',
  '\uD83D\uDC43 You can smell up to 1 trillion different scents. Your sense of smell is the only sense directly connected to the memory and emotion center of the brain.',
  '\uD83C\uDF21\uFE0F Your body temperature is highest at 6pm and lowest at 4am. Falling body temperature is one of the primary sleep triggers.',

  // NUTRITION FACTS
  '\uD83E\uDD51 Avocados contain more potassium than bananas. They are also one of the few fruits that are high in healthy monounsaturated fats.',
  '\uD83C\uDF6B Dark chocolate (85%+) contains more iron per 100g than beef. It is also one of the highest antioxidant foods on earth.',
  '\uD83E\uDD66 Broccoli contains more vitamin C per gram than oranges. It also contains sulforaphane, one of the most studied anti-cancer compounds.',
  '\uD83C\uDF73 Cooking tomatoes in olive oil increases lycopene absorption by up to 400%. Lycopene is a powerful antioxidant and prostate protector.',
  '\uD83E\uDDC4 One clove of garlic contains allicin, which is activated when you crush or chop it. Let it sit 10 minutes before cooking to maximise its immune properties.',
  '\uD83E\uDED0 Blueberries can improve memory and cognitive function within hours of eating them. Regular consumption slows brain aging by up to 2.5 years.',
  '\uD83C\uDF30 A small handful of walnuts (7 halves) contains over 100% of your daily omega-3 requirement. They literally look like brains and are your brain\'s best food.',
  '\u2615 Coffee is the largest source of antioxidants in the Western diet. It reduces risk of type 2 diabetes, Parkinson\'s, and liver disease.',
  '\uD83C\uDF75 Green tea EGCG antioxidants are 100 times more potent than vitamin C and 25 times more potent than vitamin E.',
  '\uD83C\uDF36\uFE0F Capsaicin in chili peppers triggers the release of endorphins, the same chemicals released during exercise. It also boosts metabolism by 4-5% for hours.',

  // SLEEP FACTS
  '\uD83D\uDE34 Sleeping under 6 hours per night for two weeks produces cognitive impairment equivalent to two full nights without sleep, and you do not feel it.',
  '\uD83C\uDF19 During deep sleep your brain shrinks slightly, allowing cerebrospinal fluid to flush out beta-amyloid plaques linked to Alzheimer\'s disease.',
  '\u23F0 Your body temperature needs to drop 1-2 degrees to initiate sleep. A warm bath paradoxically helps, it draws heat to the skin surface which then dissipates.',
  '\uD83D\uDCA4 REM sleep is when your brain processes emotional memories. People who sleep 8 hours remember emotional experiences 40% better than those sleeping 6 hours.',
  '\uD83C\uDF05 Viewing natural light within 30 minutes of waking sets your circadian rhythm precisely, improving sleep quality that night by 50%.',
  '\uD83D\uDCF1 The blue light from screens suppresses melatonin production for 3 hours after exposure. This is why scrolling before bed delays sleep.',

  // EXERCISE FACTS
  '\uD83C\uDFC3 A single 20-minute walk increases attention, memory, and creativity for up to 2 hours afterward. Movement is the cheapest brain drug available.',
  '\uD83D\uDCAA Strength training raises your metabolism for up to 72 hours after the session. Muscle tissue burns 6x more calories at rest than fat tissue.',
  '\uD83E\uDDD8 Yoga has been clinically shown to reduce cortisol (stress hormone) by up to 30% after a single session. It is as effective as antidepressants for mild depression.',
  '\uD83D\uDEB4 Exercise is the number one scientifically proven intervention for mental health. It generates BDNF (brain-derived neurotrophic factor) which regrows neurons.',
  '\u26A1 Your muscles have a memory. If you were once fit and stop training, you return to fitness 3x faster than someone who has never trained. Muscle nuclei remain.',
  '\uD83C\uDFCA Swimming is the only exercise that works every major muscle group simultaneously while being completely joint-safe.',

  // HYDRATION FACTS
  '\uD83D\uDCA7 You lose 1 litre of water overnight through breathing and sweating. Drinking water first thing in the morning rehydrates the brain which is 75% water.',
  '\uD83E\uDEC0 Even mild dehydration (1-2%) reduces cognitive performance, mood, and physical endurance significantly. Thirst means you are already dehydrated.',
  '\uD83C\uDF75 Herbal teas count toward daily fluid intake. The diuretic effect of tea and coffee is much weaker than their water content. They hydrate net positive.',
  '\uD83E\uDD64 Drinking 500ml of water before each meal reduces calorie intake by 13% and is one of the most effective evidence-based weight management strategies.',

  // MENTAL HEALTH FACTS
  '\uD83E\uDDE0 Gratitude journaling for 5 minutes daily increases long-term wellbeing by 10%, the same as doubling your income according to research.',
  '\uD83D\uDE0A Smiling, even when you do not feel like it, triggers the release of dopamine, serotonin, and endorphins. Your brain does not differentiate a fake smile from a real one.',
  '\uD83C\uDF3F Spending 20 minutes in nature reduces cortisol levels significantly. You do not need to exercise, just being outdoors is enough.',
  '\uD83E\uDD1D Social connection is the single greatest predictor of longevity, more than diet, exercise, or genetics. Loneliness is as harmful as smoking 15 cigarettes per day.',
  '\uD83D\uDCF5 A 7-day social media break reduces anxiety and depression by the equivalent of a 1-2 point decrease on standard clinical scales.',

  // INGREDIENT AND PRODUCT FACTS
  '\u26A0\uFE0F The EU has banned over 1,400 cosmetic ingredients. The USA has banned only 11. Your shampoo may be illegal in France.',
  '\uD83E\uDDF4 The average woman applies 515 chemicals to her body daily through cosmetic products. The skin absorbs up to 60% of what is applied to it.',
  '\uD83C\uDFED Parabens in cosmetics mimic estrogen and have been found in breast tissue samples. They are widely banned in Europe.',
  '\uD83C\uDF3F Fragrance on a label can legally hide up to 3,000 different chemical compounds without disclosure. Fragrance-free is safer than unscented.',
  '\uD83E\uDD64 One can of regular cola contains up to 39g of sugar, more than the entire WHO daily recommended limit for adults.',
  '\uD83C\uDF5E Ultra-processed foods (defined as having 5+ unrecognisable ingredients) have been shown to reduce life expectancy and significantly increase cancer risk.',

  // GUT HEALTH FACTS
  '\uD83E\uDDA0 You have approximately 39 trillion bacteria in your gut, more than the total number of human cells in your body. They outnumber you.',
  '\uD83E\uDDE0 Your gut produces 95% of your body\'s serotonin. This is why gut health directly affects mood, anxiety, and depression.',
  '\uD83E\uDD57 Eating 30 different plant species per week is the most powerful dietary intervention for gut microbiome diversity. Count every herb and spice.',
  '\uD83E\uDED9 Fermented foods (yogurt, kimchi, kefir, sauerkraut) have been shown to increase microbiome diversity and reduce inflammatory markers within 10 weeks.',

  // HORMONE HEALTH
  '\u2600\uFE0F Vitamin D is technically a hormone, not a vitamin. It affects over 2,000 genes and 80% of the global population is deficient.',
  '\uD83D\uDE24 Chronic stress shrinks the hippocampus (memory center) and impairs immune function. It is a genuine medical condition, not weakness.',
  '\uD83C\uDF19 Cortisol naturally peaks at 8-9am and should be lowest at midnight. Artificial light, late eating, and phone use at night disrupt this cycle entirely.',
  '\uD83E\uDDEC Epigenetics shows that your lifestyle choices change which genes are expressed, and these changes can be passed to your children.',
];

const TOTAL_TIPS = HEALTH_TIPS_AND_FACTS.length;
const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = 60;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mixHex(bg: string, fg: string, fgFraction: number): string {
  const parse = (hex: string) => {
    const x = hex.replace('#', '');
    return {
      r: parseInt(x.slice(0, 2), 16),
      g: parseInt(x.slice(2, 4), 16),
      b: parseInt(x.slice(4, 6), 16),
    };
  };
  const a = parse(bg);
  const b = parse(fg);
  const t = fgFraction;
  const r = Math.round(a.r * (1 - t) + b.r * t);
  const g = Math.round(a.g * (1 - t) + b.g * t);
  const bl = Math.round(a.b * (1 - t) + b.b * t);
  return `#${[r, g, bl].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

function cardColors(theme: Theme) {
  return {
    backgroundColor: mixHex(theme.bg1, theme.gold, 0.05),
    borderColor: mixHex(theme.border, theme.teal, 0.25),
  };
}

function dayOfYearLocal(date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function todayDateKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Stable numeric hash from a user id string so each user sees a different
// rotation. Returns [0, mod-1].
function userIdHashMod(uid: string | null | undefined, mod: number): number {
  if (!uid) return 0;
  let h = 0;
  for (let i = 0; i < uid.length; i++) {
    h = (h * 31 + uid.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % mod;
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function LightbulbIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 21h6M12 3a6 6 0 00-3 11.2V17h6v-2.8A6 6 0 0012 3z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 18h6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function CloseIcon({ color }: { color: string }) {
  return (
    <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ShareIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7M16 6l-4-4m0 0L8 6m4-4v14"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Typewriter hook (renders up to `visibleChars` of the target string)
// ---------------------------------------------------------------------------

function useTypewriter(text: string, enabled: boolean, speed = 20) {
  const [visibleChars, setVisibleChars] = useState(() => (enabled ? 0 : text.length));
  const [isDone, setIsDone] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      setVisibleChars(text.length);
      setIsDone(true);
      return;
    }
    setVisibleChars(0);
    setIsDone(false);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setVisibleChars(i);
      if (i >= text.length) {
        clearInterval(id);
        setIsDone(true);
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, enabled, speed]);

  return { visible: text.slice(0, visibleChars), isDone };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function DailyHealthTipInner() {
  const { theme } = useTheme();
  const uid = useAuthStore((s) => s.session?.user?.id);

  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const [hasPlayedTypewriter, setHasPlayedTypewriter] = useState(false);
  const [offsetIndex, setOffsetIndex] = useState(0);
  const [helpfulCount, setHelpfulCount] = useState(248000);
  const [markedHelpful, setMarkedHelpful] = useState(false);
  const [viewCount] = useState(1240000);

  const fmtCount = (n: number): string => {
    if (n >= 1_000_000)
      return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M';
    if (n >= 1_000) return Math.round(n / 1_000) + 'k';
    return n.toString();
  };

  const baseIndex = useMemo(() => {
    const offset = userIdHashMod(uid, TOTAL_TIPS);
    return (dayOfYearLocal() + offset) % TOTAL_TIPS;
  }, [uid]);

  const activeIndex = (baseIndex + offsetIndex + TOTAL_TIPS) % TOTAL_TIPS;
  const tip = HEALTH_TIPS_AND_FACTS[activeIndex] ?? HEALTH_TIPS_AND_FACTS[0];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(HELPFUL_STORAGE_KEY);
        const markedSet: string[] = stored ? JSON.parse(stored) : [];
        if (!cancelled && markedSet.includes(String(activeIndex))) {
          setMarkedHelpful(true);
        }
      } catch {
        /* non-fatal */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeIndex]);

  const handleHelpful = () => {
    if (markedHelpful) return;
    setMarkedHelpful(true);
    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(HELPFUL_STORAGE_KEY);
        const markedSet: string[] = stored ? JSON.parse(stored) : [];
        if (!markedSet.includes(String(activeIndex))) {
          markedSet.push(String(activeIndex));
          await AsyncStorage.setItem(HELPFUL_STORAGE_KEY, JSON.stringify(markedSet));
        }
      } catch {
        /* non-fatal */
      }
    })();
    setHelpfulCount((c) => c + 1);
    void (async () => {
      try {
        const { error } = await supabase.rpc('increment_tip_helpful', {
          p_tip_index: activeIndex,
        });
        if (error) throw error;
      } catch {
        setMarkedHelpful(false);
        setHelpfulCount((c) => Math.max(0, c - 1));
      }
    })();
  };

  const { visible: shownText, isDone: typewriterDone } = useTypewriter(
    tip,
    !hasPlayedTypewriter,
    18,
  );

  const colors = cardColors(theme);

  // ── Entry animation ──
  const entry = useSharedValue(0);
  const cardHeight = useSharedValue(1);

  useEffect(() => {
    const t = setTimeout(() => {
      entry.value = withSpring(1, { damping: 18, stiffness: 200 });
    }, 300);
    return () => clearTimeout(t);
  }, [entry]);

  const entryStyle = useAnimatedStyle(() => ({
    opacity: entry.value,
    transform: [{ translateY: (1 - entry.value) * 20 }],
  }));

  const collapseStyle = useAnimatedStyle(() => ({
    maxHeight: cardHeight.value * 400,
    opacity: cardHeight.value,
  }));

  // ── Bulb pulse ──
  const bulbScale = useSharedValue(1);
  useEffect(() => {
    bulbScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
  }, [bulbScale]);
  const bulbStyle = useAnimatedStyle(() => ({ transform: [{ scale: bulbScale.value }] }));

  // ── Cursor blink ──
  const cursorOpacity = useSharedValue(1);
  useEffect(() => {
    cursorOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 400 }),
        withTiming(1, { duration: 400 }),
      ),
      -1,
      true,
    );
  }, [cursorOpacity]);
  const cursorStyle = useAnimatedStyle(() => ({ opacity: cursorOpacity.value }));

  // ── Swipe gesture ──
  const translateX = useSharedValue(0);

  const goNext = useCallback(() => {
    setHasPlayedTypewriter(true);
    setOffsetIndex((v) => v + 1);
  }, []);

  const goPrev = useCallback(() => {
    setHasPlayedTypewriter(true);
    setOffsetIndex((v) => v - 1);
  }, []);

  const swipe = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      if (e.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_W, { duration: 180 }, () => {
          translateX.value = 0;
          runOnJS(goNext)();
        });
      } else if (e.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(SCREEN_W, { duration: 180 }, () => {
          translateX.value = 0;
          runOnJS(goPrev)();
        });
      } else {
        translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
      }
    });

  const swipeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));

  // ── Dismiss ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && stored === todayDateKey()) {
          setVisible(false);
        }
      } catch {
        /* show tip */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const finishDismiss = useCallback(() => {
    setVisible(false);
  }, []);

  const dismiss = useCallback(() => {
    void AsyncStorage.setItem(STORAGE_KEY, todayDateKey()).catch(() => undefined);
    cardHeight.value = withTiming(0, { duration: 260 }, (finished) => {
      if (finished) runOnJS(finishDismiss)();
    });
  }, [cardHeight, finishDismiss]);

  // ── Share ──
  const share = useCallback(() => {
    void Share.share({
      message: `Share this health fact: ${tip}\n\nFrom TruWell AI.`,
    });
  }, [tip]);

  if (!ready || !visible) return null;

  return (
    <Animated.View style={[entryStyle, collapseStyle, { marginBottom: 12 }]}>
      <GestureDetector gesture={swipe}>
          <Animated.View
            style={[
              swipeStyle,
              styles.card,
              colors,
            ]}
          >
            {/* Header row */}
            <View style={styles.headerRow}>
              <Animated.View style={bulbStyle}>
                <LightbulbIcon color={theme.gold} />
              </Animated.View>
              <Text style={[styles.label, { color: theme.gold }]}>TruWell Daily</Text>
              <View style={styles.headerRight}>
                <Text style={[styles.counter, { color: theme.text4 }]}>
                  Fact #{activeIndex + 1}
                </Text>
                <Pressable
                  onPress={share}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Share this tip"
                  style={styles.shareBtn}
                >
                  <ShareIcon color={theme.text3} />
                </Pressable>
                <Pressable
                  onPress={dismiss}
                  style={[styles.dismissBtn, { backgroundColor: theme.bg3 }]}
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss daily tip"
                  hitSlop={10}
                >
                  <CloseIcon color={theme.text3} />
                </Pressable>
              </View>
            </View>

            {/* Tip text */}
            <View style={styles.body}>
              <Text style={[styles.tip, { color: theme.text2 }]}>
                {shownText}
                {!typewriterDone && (
                  <Animated.Text style={[styles.cursor, { color: theme.teal }, cursorStyle]}>
                    {'|'}
                  </Animated.Text>
                )}
              </Text>
            </View>

            {/* Dot indicators */}
            <View style={styles.reactionRow}>
              <TouchableOpacity
                onPress={handleHelpful}
                disabled={markedHelpful}
                style={[
                  styles.helpfulPill,
                  markedHelpful
                    ? {
                        backgroundColor: `${theme.teal}15`,
                        borderColor: `${theme.teal}40`,
                      }
                    : {
                        backgroundColor: theme.bg3,
                        borderColor: theme.border,
                      },
                ]}
                accessibilityLabel="Mark as helpful"
              >
                <Text
                  style={[
                    styles.helpfulText,
                    { color: markedHelpful ? theme.teal : theme.text3 },
                  ]}
                >
                  {markedHelpful
                    ? `👍 ${fmtCount(helpfulCount)} found this helpful`
                    : `👍 Helpful  ${fmtCount(helpfulCount)}`}
                </Text>
              </TouchableOpacity>

              <View style={styles.viewRow}>
                <Text style={[styles.viewText, { color: theme.text4 }]}>
                  👁 {fmtCount(viewCount)} views
                </Text>
              </View>
            </View>

            <View style={styles.dots}>
              <View style={[styles.dot, { backgroundColor: `${theme.text3}55` }]} />
              <View style={[styles.dotActive, { backgroundColor: theme.teal }]} />
              <View style={[styles.dot, { backgroundColor: `${theme.text3}55` }]} />
            </View>

            <Text style={[styles.hint, { color: theme.text3 }]}>
              Swipe for more
            </Text>
          </Animated.View>
        </GestureDetector>
    </Animated.View>
  );
}

export const DailyHealthTip = memo(DailyHealthTipInner);

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  counter: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  shareBtn: {
    padding: 4,
  },
  body: {
    minHeight: 44,
  },
  tip: {
    fontSize: 13,
    lineHeight: 22,
    fontWeight: '500',
  },
  cursor: {
    fontWeight: '900',
    fontSize: 14,
  },
  reactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  helpfulPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 0.5,
  },
  helpfulText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewText: {
    fontSize: 11,
    fontWeight: '500',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dotActive: {
    width: 18,
    height: 4,
    borderRadius: 2,
  },
  hint: {
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  dismissBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { DrTruWellAvatar } from '@/components/ai/DrTruWellAvatar';
import { hapticLight } from '@/lib/haptics';
import { useTheme } from '@/theme/ThemeContext';

// ---------------------------------------------------------------------------
// Welcome message definition — driven by a timeline of segments
// ---------------------------------------------------------------------------

type Segment =
  | { kind: 'line'; text: string; bold?: boolean }
  | { kind: 'pause'; ms: number }
  | { kind: 'bullet'; text: string }
  | { kind: 'disclaimer'; text: string }
  | { kind: 'closer'; text: string };

// Hero copy: heading + subtext typewriter (disclaimer lives outside the card)
const TIMELINE: Segment[] = [
  {
    kind: 'line',
    text: "Hi, I'm Sofia",
  },
  { kind: 'pause', ms: 40 },
  {
    kind: 'line',
    text:
      'Your product safety & ingredient intelligence companion. Scan a product or ask me anything below.',
  },
  { kind: 'pause', ms: 40 },
];

const CHAR_STEP_MS = 16;
const CHARS_PER_TICK = 5;

const HERO_CARD_BG = 'rgba(30, 36, 51, 0.65)';
const HERO_CARD_BORDER = '#2E3648';
const HERO_ICON_RING = '#2DD4BF';
const HERO_ICON_FILL = '#0B0F1A';
const HERO_SUBTEXT = '#9CA3C0';
const DISCLAIMER_AMBER = '#F2C200';

// ---------------------------------------------------------------------------
// Quick-start chips
// ---------------------------------------------------------------------------

export interface QuickChip {
  emoji: string;
  label: string;
  /** Text pre-filled into the input. */
  prompt: string;
  /** If true, send immediately after fill. If false, only pre-fill. */
  autoSend: boolean;
}

export const QUICK_CHIPS: QuickChip[] = [
  {
    emoji: '\uD83D\uDD0D',
    label: 'Explain my scan',
    prompt: 'Explain my last scan result and what the flagged ingredients mean for me',
    autoSend: true,
  },
  {
    emoji: '\uD83E\uDDEA',
    label: 'Is this ingredient safe?',
    prompt: 'Is this ingredient safe for me: ',
    autoSend: false,
  },
  {
    emoji: '\uD83D\uDEA8',
    label: 'Check for recalls',
    prompt: 'Are any products I have scanned recently under a recall or safety alert?',
    autoSend: true,
  },
  {
    emoji: '\uD83C\uDF3F',
    label: 'Find a safer alternative',
    prompt: 'Suggest a safer alternative to this product for my health profile: ',
    autoSend: false,
  },
];

// ---------------------------------------------------------------------------
// Bold-segment renderer
// ---------------------------------------------------------------------------

function renderBold(text: string, boldColor: string, regularColor: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return (
        <Text key={i} style={{ color: boldColor, fontWeight: '900' }}>
          {p.slice(2, -2)}
        </Text>
      );
    }
    return (
      <Text key={i} style={{ color: regularColor }}>
        {p}
      </Text>
    );
  });
}

function lineSegmentIndex(segments: Segment[], segIdx: number): number {
  let count = 0;
  for (let i = 0; i < segIdx; i++) {
    if (segments[i]?.kind === 'line') count += 1;
  }
  return count;
}

// ---------------------------------------------------------------------------
// Chip component with press spring
// ---------------------------------------------------------------------------

function Chip({
  chip,
  onPress,
  theme,
  delay,
}: {
  chip: QuickChip;
  onPress: () => void;
  theme: ReturnType<typeof useTheme>['theme'];
  delay: number;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(320).springify().damping(16).stiffness(200)}
      style={[style, { width: 'auto' }]}
    >
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.95, { damping: 18, stiffness: 320 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 14, stiffness: 220 });
        }}
        onPress={() => {
          hapticLight();
          onPress();
        }}
        style={[
          chipStyles.chip,
          {
            backgroundColor: `${theme.teal}10`,
            borderColor: `${theme.teal}40`,
          },
        ]}
      >
        <Text style={chipStyles.emoji}>{chip.emoji}</Text>
        <Text style={[chipStyles.label, { color: theme.teal }]} numberOfLines={2}>
          {chip.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
    minHeight: 68,
    alignItems: 'flex-start',
  },
  emoji: {
    fontSize: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface Props {
  onChipPress: (prompt: string, autoSend: boolean) => void;
}

export function AssistantWelcomeCard({ onChipPress }: Props) {
  const { theme } = useTheme();

  const segments = useMemo(() => TIMELINE, []);
  const [segIndex, setSegIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [doneAll, setDoneAll] = useState(false);
  const [shownTexts, setShownTexts] = useState<{ seg: number; text: string }[]>([]);

  useEffect(() => {
    if (segIndex >= segments.length) {
      setDoneAll(true);
      return;
    }
    const seg = segments[segIndex];

    if (seg.kind === 'pause') {
      const t = setTimeout(() => {
        setSegIndex((i) => i + 1);
      }, seg.ms);
      return () => clearTimeout(t);
    }

    const fullText = seg.text;
    if (charCount < fullText.length) {
      const t = setTimeout(() => {
        setCharCount((c) => Math.min(c + CHARS_PER_TICK, fullText.length));
      }, CHAR_STEP_MS);
      return () => clearTimeout(t);
    }

    setShownTexts((arr) => [...arr, { seg: segIndex, text: fullText }]);
    setCharCount(0);
    setSegIndex((i) => i + 1);
    return undefined;
  }, [segIndex, charCount, segments]);

  const current = segIndex < segments.length ? segments[segIndex] : null;

  const handleChipPress = useCallback(
    (chip: QuickChip) => {
      onChipPress(chip.prompt, chip.autoSend);
    },
    [onChipPress],
  );

  const textStyleForSeg = (segIdx: number) =>
    lineSegmentIndex(segments, segIdx) === 0 ? styles.heroHeading : styles.heroSubtext;

  return (
    <Animated.View
      entering={FadeInDown.duration(320)}
      exiting={FadeOutUp.duration(260)}
      style={styles.bubbleWrap}
    >
      {/* Hero card: translucent navy panel, symmetric radius, centered content */}
      <View style={styles.heroCard}>
        <View style={styles.heroIconWrap}>
          <View style={styles.heroIconRing}>
            <DrTruWellAvatar
              size="small"
              teal={theme.teal}
              gold={theme.gold}
              greetOnMount={false}
              speaking={!doneAll}
            />
          </View>
        </View>

        <View style={styles.heroTextWrap}>
          {shownTexts.map((s, idx) => {
            const seg = segments[s.seg];
            if (!seg) return null;
            if (seg.kind === 'line') {
              return (
                <Text key={`done-${idx}`} style={textStyleForSeg(s.seg)}>
                  {renderBold(s.text, theme.text1, HERO_SUBTEXT)}
                </Text>
              );
            }
            if (seg.kind === 'bullet') {
              return (
                <View key={`done-${idx}`} style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, { color: theme.teal }]}>•</Text>
                  <Text style={[styles.bullet, { color: theme.text2 }]}>{s.text}</Text>
                </View>
              );
            }
            if (seg.kind === 'disclaimer') {
              return (
                <View
                  key={`done-${idx}`}
                  style={[
                    styles.disclaimerBox,
                    { backgroundColor: `${theme.amber}14`, borderColor: `${theme.amber}40` },
                  ]}
                >
                  <Text style={[styles.disclaimer, { color: theme.text2 }]}>
                    {renderBold(s.text, theme.amber, theme.text2)}
                  </Text>
                </View>
              );
            }
            if (seg.kind === 'closer') {
              return (
                <Text key={`done-${idx}`} style={[styles.closer, { color: theme.teal }]}>
                  {s.text}
                </Text>
              );
            }
            return null;
          })}

          {current && current.kind === 'line' && (
            <Text style={textStyleForSeg(segIndex)}>
              {renderBold(current.text.slice(0, charCount), theme.text1, HERO_SUBTEXT)}
            </Text>
          )}
          {current && current.kind === 'bullet' && (
            <View style={styles.bulletRow}>
              <Text style={[styles.bulletDot, { color: theme.teal }]}>•</Text>
              <Text style={[styles.bullet, { color: theme.text2 }]}>
                {current.text.slice(0, charCount)}
              </Text>
            </View>
          )}
          {current && current.kind === 'disclaimer' && (
            <View
              style={[
                styles.disclaimerBox,
                { backgroundColor: `${theme.amber}14`, borderColor: `${theme.amber}40` },
              ]}
            >
              <Text style={[styles.disclaimer, { color: theme.text2 }]}>
                {renderBold(current.text.slice(0, charCount), theme.amber, theme.text2)}
              </Text>
            </View>
          )}
          {current && current.kind === 'closer' && (
            <Text style={[styles.closer, { color: theme.teal }]}>
              {current.text.slice(0, charCount)}
            </Text>
          )}
        </View>
      </View>

      {/* Disclaimer: outside card, plain inline text per reference */}
      <Text style={styles.heroDisclaimer}>
        <Text style={{ color: DISCLAIMER_AMBER }}>⚠ </Text>
        <Text style={{ fontWeight: '700', color: DISCLAIMER_AMBER }}>Educational info only. </Text>
        <Text style={{ color: HERO_SUBTEXT }}>
          Always consult a qualified healthcare professional for personal health decisions.
        </Text>
      </Text>

      {doneAll && (
        <Animated.View entering={FadeInDown.duration(220)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingRight: 4 }}
          >
            {QUICK_CHIPS.map((chip, i) => (
              <Chip
                key={chip.label}
                chip={chip}
                theme={theme}
                delay={60 * i}
                onPress={() => handleChipPress(chip)}
              />
            ))}
          </ScrollView>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubbleWrap: {
    marginHorizontal: 16,
    marginTop: 12,
    gap: 4,
  },
  heroCard: {
    backgroundColor: HERO_CARD_BG,
    borderWidth: 1,
    borderColor: HERO_CARD_BORDER,
    borderRadius: 20,
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroIconWrap: {
    marginBottom: 12,
    shadowColor: HERO_ICON_RING,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  heroIconRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: HERO_ICON_RING,
    backgroundColor: HERO_ICON_FILL,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroTextWrap: {
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  heroHeading: {
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  heroSubtext: {
    fontSize: 14,
    lineHeight: 21,
    color: HERO_SUBTEXT,
    textAlign: 'center',
    maxWidth: 280,
  },
  heroDisclaimer: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 8,
    lineHeight: 18,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 20,
  },
  bullet: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  disclaimerBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginTop: 4,
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  closer: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
    marginTop: 4,
  },
});

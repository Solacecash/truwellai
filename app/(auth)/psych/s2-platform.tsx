import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PsychDynamicCard } from '@/components/onboarding/psych/PsychDynamicCard';
import { PsychGradientButton } from '@/components/onboarding/psych/PsychGradientButton';
import { PsychScreenShell } from '@/components/onboarding/psych/PsychScreenShell';
import { getPsychHrefForStep } from '@/lib/psychFlow';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { psychBrand } from '@/theme/colors';

const { width: SW } = Dimensions.get('window');

const CARDS = [
  {
    key: 'ios',
    title: 'iPhone',
    emoji: '',
    body: 'Optimised gestures, haptics, and deep links for your daily check-ins.',
  },
  {
    key: 'android',
    title: 'Android',
    emoji: '🤖',
    body: 'Consistent scanning across brands and notifications you already use.',
  },
  {
    key: 'both',
    title: 'Both platforms',
    emoji: '🔁',
    body: 'Switch devices without losing progress. TruWell keeps your context aligned.',
  },
] as const;

export default function PsychS2Platform() {
  const router = useRouter();
  const goToStep = useOnboardingStore((s) => s.goToStep);
  const [slide, setSlide] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const selectedMeta = useMemo(
    () => CARDS.find((c) => c.key === selectedKey),
    [selectedKey]
  );

  const dynamic = useMemo(() => {
    if (!selectedMeta) return '';
    return `${selectedMeta.title} is a strong fit. ${selectedMeta.body}`;
  }, [selectedMeta]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / SW);
    setSlide(Math.max(0, Math.min(CARDS.length - 1, idx)));
  };

  const onCta = () => {
    goToStep(3);
    router.push(getPsychHrefForStep(3));
  };

  return (
    <PsychScreenShell
      step={2}
      title="Where will TruWell live?"
      subtitle="Swipe to compare. Tap the card that matches how you move through your day."
      trustPill="Built for daily use"
      showBack
      onBack={() => router.back()}
      footer={
        <PsychGradientButton
          label="Continue"
          disabled={!selectedKey}
          onPress={onCta}
        />
      }
    >
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.carousel}
      >
        {CARDS.map((c) => {
          const sel = selectedKey === c.key;
          return (
            <Pressable
              key={c.key}
              accessibilityRole="button"
              accessibilityState={{ selected: sel }}
              onPress={() => setSelectedKey(c.key)}
              style={[styles.cardPage, { width: SW }, sel && styles.cardOn]}
            >
              <Text style={styles.cardEmoji}>{c.emoji || '📱'}</Text>
              <Text style={styles.cardTitle}>{c.title}</Text>
              <Text style={styles.cardBody}>{c.body}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Text style={styles.hint}>Card {slide + 1} of {CARDS.length}</Text>

      <PsychDynamicCard visible={!!selectedKey} text={dynamic} />
    </PsychScreenShell>
  );
}

const styles = StyleSheet.create({
  carousel: { marginHorizontal: -8 },
  cardPage: {
    marginHorizontal: 8,
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    minHeight: 220,
  },
  cardOn: {
    borderColor: psychBrand.tealBorder,
    backgroundColor: 'rgba(0,168,120,0.1)',
  },
  cardEmoji: { fontSize: 42, marginBottom: 8 },
  cardTitle: { fontSize: 20, fontWeight: '900', color: '#F4F8FC', marginBottom: 8 },
  cardBody: { fontSize: 13, fontWeight: '500', color: 'rgba(240,248,255,0.65)', lineHeight: 19 },
  hint: { marginTop: 10, fontSize: 12, color: 'rgba(240,248,255,0.45)' },
});

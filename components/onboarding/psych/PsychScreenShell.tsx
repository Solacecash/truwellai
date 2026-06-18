import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { memo } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SegmentedIndicator } from '@/components/onboarding/ui/SegmentedIndicator';
import { PSYCH_SEGMENT_TOTAL, psychStepToSegmentCurrent } from '@/lib/psychFlow';
import type { PsychStepNumber } from '@/lib/psychFlow';
import { psychBrand } from '@/theme/colors';

import { PsychAmbientBg } from './PsychAmbientBg';

type Props = {
  step: PsychStepNumber;
  title: string;
  subtitle?: string;
  trustPill?: string;
  showBack: boolean;
  onBack?: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
};

function PsychScreenShellInner({
  step,
  title,
  subtitle,
  trustPill,
  showBack,
  onBack,
  children,
  footer,
}: Props) {
  const insets = useSafeAreaInsets();
  const seg = psychStepToSegmentCurrent(step);
  const fullBar = step === 13;
  const showProgress = seg !== null;
  const currentSeg = fullBar ? PSYCH_SEGMENT_TOTAL : seg ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.flex}>
          <PsychAmbientBg />
          {showBack ? (
            <Pressable
              accessibilityRole="button"
              onPress={onBack}
              style={styles.backBtn}
              hitSlop={12}
            >
              <Text style={styles.backTxt}>‹ Back</Text>
            </Pressable>
          ) : (
            <View style={styles.backSpacer} />
          )}

          {showProgress || fullBar ? (
            <SegmentedIndicator
              totalSteps={PSYCH_SEGMENT_TOTAL}
              currentStep={currentSeg}
              gradientColors={[psychBrand.primary, psychBrand.secondary]}
            />
          ) : (
            <View style={styles.progSpacer} />
          )}

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {trustPill ? (
              <View style={styles.trustPill} accessibilityRole="text">
                <Text style={styles.trustPillText}>{trustPill}</Text>
              </View>
            ) : null}
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            {children}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>{footer}</View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export const PsychScreenShell = memo(PsychScreenShellInner);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: psychBrand.background,
  },
  flex: { flex: 1 },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  backTxt: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  backSpacer: { height: 36 },
  progSpacer: { height: 20 },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  trustPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: psychBrand.trustPillBg,
    marginBottom: 14,
  },
  trustPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: psychBrand.primary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F4F8FC',
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(240,248,255,0.58)',
    lineHeight: 20,
    marginBottom: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
});

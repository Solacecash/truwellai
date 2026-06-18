import * as Haptics from 'expo-haptics';
import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SegmentedIndicator } from '@/components/ui/SegmentedIndicator';
import {
  ONBOARD_TOTAL_SEGMENTS,
  segmentsFilledForConversionStep,
} from '@/lib/onboardingProgress';
import type { OnboardingPathVariant } from '@/theme/truwellBrand';
import { TRUWELL_COLORS, accentForVariant, onboardingScreenColors } from '@/theme/truwellBrand';

export type OnboardingHeaderProps = {
  conversionFlowStep: number;
  onBack: () => void;
  showSkip?: boolean;
  onSkip?: () => void;
  variant?: OnboardingPathVariant;
  isDark?: boolean;
};

function OnboardingHeaderInner({
  conversionFlowStep,
  onBack,
  showSkip = false,
  onSkip,
  variant = 'neutral',
  isDark = true,
}: OnboardingHeaderProps) {
  const palette = onboardingScreenColors(isDark);
  const filled = segmentsFilledForConversionStep(conversionFlowStep);
  const progressValue = (filled / ONBOARD_TOTAL_SEGMENTS) * 100;
  const activeColor = accentForVariant(variant);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onBack();
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={[
            styles.backBtn,
            { backgroundColor: palette.backBtnBg, borderColor: palette.backBtnBorder },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={[styles.backIcon, { color: palette.backIcon }]}>‹</Text>
        </Pressable>

        {showSkip && onSkip ? (
          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              onSkip();
            }}
            style={[
              styles.skipBtn,
              { backgroundColor: palette.backBtnBg, borderColor: palette.backBtnBorder },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
          >
            <Text style={[styles.skipText, { color: palette.textMuted }]}>Skip</Text>
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
      </View>

      {conversionFlowStep > 1 ? (
        <>
          <SegmentedIndicator
            value={progressValue}
            count={ONBOARD_TOTAL_SEGMENTS}
            color={activeColor}
            animated
            style={styles.segment}
          />
          <Text style={[styles.stepCounter, { color: palette.textMuted }]}>
            {filled} of {ONBOARD_TOTAL_SEGMENTS}
          </Text>
        </>
      ) : null}
    </View>
  );
}

export const OnboardingHeader = memo(OnboardingHeaderInner);

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: -2,
  },
  skipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 50,
    borderWidth: 1,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  segment: {
    marginBottom: 6,
  },
  stepCounter: {
    fontSize: 11,
    textAlign: 'right',
    letterSpacing: 0.8,
    fontWeight: '600',
  },
});

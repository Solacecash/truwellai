import * as Haptics from 'expo-haptics';
import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useOnboardingStore, type WizardStep } from '@/stores/onboardingStore';

import { OB } from '../tokens';

function WizardHeaderInner() {
  const wizardStep = useOnboardingStore((s) => s.wizardStep);
  const setWizardStep = useOnboardingStore((s) => s.setWizardStep);
  const setWizardOpen = useOnboardingStore((s) => s.setWizardOpen);

  const handleBack = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (wizardStep === 1) {
      setWizardOpen(false);
    } else {
      setWizardStep((wizardStep - 1) as WizardStep);
    }
  }, [setWizardOpen, setWizardStep, wizardStep]);

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={handleBack}
        style={styles.back}
      >
        <Svg width={16} height={16} viewBox="0 0 16 16">
          <Path
            d="M10 3L5 8l5 5"
            stroke={OB.t45}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <View style={styles.dots}>
        {([1, 2, 3, 4, 5] as const).map((n) => (
          <View
            key={n}
            style={[
              styles.dot,
              n < wizardStep && styles.dotDone,
              n === wizardStep && styles.dotActive,
              n > wizardStep && styles.dotFuture,
              n === wizardStep && { transform: [{ scale: 1.2 }] },
            ]}
          />
        ))}
      </View>
      <Text style={styles.stepLbl}>
        Step {wizardStep} of 5
      </Text>
    </View>
  );
}

export const WizardHeader = memo(WizardHeaderInner);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: OB.glass1,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 14, fontWeight: '600', color: OB.t45 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotDone: { backgroundColor: OB.gold },
  dotActive: { backgroundColor: OB.teal },
  dotFuture: { backgroundColor: OB.glass2 },
  stepLbl: { fontSize: 12, color: OB.t20, minWidth: 72, textAlign: 'right' },
});

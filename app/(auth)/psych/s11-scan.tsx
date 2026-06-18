import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { PsychGradientButton } from '@/components/onboarding/psych/PsychGradientButton';
import { PsychScreenShell } from '@/components/onboarding/psych/PsychScreenShell';
import { getPsychHrefForStep } from '@/lib/psychFlow';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { psychBrand } from '@/theme/colors';

export default function PsychS11Scan() {
  const router = useRouter();
  const goToStep = useOnboardingStore((s) => s.goToStep);

  const onCta = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    goToStep(12);
    router.push(getPsychHrefForStep(12));
  };

  const openScan = () => {
    void Haptics.selectionAsync();
    router.push('/scan');
  };

  return (
    <PsychScreenShell
      step={11}
      title="Your first confident scan"
      subtitle="Tap a product label when you are ready. TruWell reads what others skip."
      trustPill="Instant clarity"
      showBack
      onBack={() => router.back()}
      footer={<PsychGradientButton label="Continue" onPress={onCta} />}
    >
      <Text style={styles.body}>
        Open the scan tab to capture any ingredient list or barcode. Your earlier answers already tune the flags you will
        see.
      </Text>
      <Text style={styles.link} onPress={openScan}>
        Jump to scanner now
      </Text>
    </PsychScreenShell>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(240,248,255,0.72)',
    marginBottom: 12,
  },
  link: {
    fontSize: 15,
    fontWeight: '800',
    color: psychBrand.primary,
  },
});

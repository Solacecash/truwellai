import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { PsychGradientButton } from '@/components/onboarding/psych/PsychGradientButton';
import { PsychScreenShell } from '@/components/onboarding/psych/PsychScreenShell';
export default function PsychS9Account() {
  const router = useRouter();

  const onCta = () => {
    router.push({ pathname: '/(auth)/register', params: { psych: '1' } });
  };

  return (
    <PsychScreenShell
      step={9}
      title="Secure your Guardian profile"
      subtitle="Email and password only. Everything else is already captured."
      trustPill="Encrypted identity"
      showBack
      onBack={() => router.back()}
      footer={<PsychGradientButton label="Create my account" onPress={onCta} />}
    >
      <Text style={styles.body}>
        TruWell saves your psychological blueprint to the same vault as your scans. After this step you will choose a subscription
        plan that fits how you want to move.
      </Text>
    </PsychScreenShell>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(240,248,255,0.7)',
    fontWeight: '500',
  },
});

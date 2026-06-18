import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { PsychGradientButton } from '@/components/onboarding/psych/PsychGradientButton';
import { PsychScreenShell } from '@/components/onboarding/psych/PsychScreenShell';
import { registerForPushNotifications } from '@/lib/notifications';
import { getPsychHrefForStep } from '@/lib/psychFlow';
import { supabase } from '@/lib/supabase';
import { useOnboardingStore } from '@/stores/onboardingStore';

export default function PsychS12Notifications() {
  const router = useRouter();
  const goToStep = useOnboardingStore((s) => s.goToStep);
  const [busy, setBusy] = useState(false);

  const enable = async () => {
    setBusy(true);
    try {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id;
      if (uid) await registerForPushNotifications(uid);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Notifications', 'You can enable alerts later in Settings.');
    } finally {
      setBusy(false);
      goToStep(13);
      router.push(getPsychHrefForStep(13));
    }
  };

  const skip = () => {
    goToStep(13);
    router.push(getPsychHrefForStep(13));
  };

  return (
    <PsychScreenShell
      step={12}
      title="Stay ahead of risky ingredients"
      subtitle="We only ping what matters. No spam, no shame notifications."
      trustPill="You control channels"
      showBack
      onBack={() => router.back()}
      footer={
        <View>
          <PsychGradientButton
            label={busy ? 'Opening settings…' : 'Enable smart alerts'}
            loading={busy}
            onPress={() => void enable()}
          />
          <Text style={styles.skip} onPress={skip}>
            Maybe later
          </Text>
        </View>
      }
    >
      <Text style={styles.body}>
        TruWell can watch recalls, reformulations, and watchlist hits for the people you protect.
      </Text>
    </PsychScreenShell>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(240,248,255,0.72)',
  },
  skip: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(240,248,255,0.5)',
  },
});

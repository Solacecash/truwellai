import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { ONBOARDING_ROUTES } from '@/lib/onboardingRoutePaths';
import { OB_COLORS } from '@/lib/_obShared';

export default function OnboardingRole() {
  const router = useRouter();
  const setRole = useOnboardingStore((s) => s.setRole);
  const setConversionFlowStep = useOnboardingStore((s) => s.setConversionFlowStep);

  useEffect(() => {
    setRole('guardian');
    setConversionFlowStep(2);
    router.replace(ONBOARDING_ROUTES.name);
  }, []);

  return <View style={styles.root} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: OB_COLORS.navy },
});

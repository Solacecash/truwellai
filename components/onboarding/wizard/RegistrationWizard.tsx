import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { submitUserRegistration } from '@/lib/onboardingSubmit';
import {
  useOnboardingStore,
  type WizardStep,
} from '@/stores/onboardingStore';
import HealthDataConsentModal from '@/components/legal/HealthDataConsentModal';

import { TruWellShield } from '../TruWellShield';
import { OB, WIZARD_PROMPTS } from '../tokens';
import { CtaButton } from '../ui/CtaButton';
import { ConvoPrompt } from './ConvoPrompt';
import { UserStep1, type UserStep1Errors, type UserStep1Handle } from './user/UserStep1';
import { UserStep2 } from './user/UserStep2';
import { UserStep3 } from './user/UserStep3';
import { UserStep4 } from './user/UserStep4';
import { UserStep5 } from './user/UserStep5';
import { WizardHeader } from './WizardHeader';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const { height: SCREEN_H } = Dimensions.get('window');

type Props = {
  onRegistrationSuccess: () => void;
};

function validateUserStep1(f: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): UserStep1Errors {
  const e: UserStep1Errors = {};
  if (!f.firstName.trim()) e.firstName = 'Required';
  if (!f.lastName.trim()) e.lastName = 'Required';
  if (!f.email.trim()) e.email = 'Required';
  else if (!EMAIL_RE.test(f.email)) e.email = 'Enter a valid email';
  if (!f.password) e.password = 'Required';
  else if (f.password.length < 8) e.password = 'Password must be at least 8 characters';
  return e;
}

function RegistrationWizardInner({ onRegistrationSuccess }: Props) {
  const insets = useSafeAreaInsets();
  const wizardOpen = useOnboardingStore((s) => s.wizardOpen);
  const wizardStep = useOnboardingStore((s) => s.wizardStep);
  const setWizardStep = useOnboardingStore((s) => s.setWizardStep);
  const selectedType = useOnboardingStore((s) => s.selectedType);
  const userForm = useOnboardingStore((s) => s.userForm);

  const translateY = useSharedValue(SCREEN_H);
  const userStep1Ref = useRef<UserStep1Handle | null>(null);
  const [user1e, setUser1e] = useState<UserStep1Errors>({});
  const [busy, setBusy] = useState(false);
  const [healthConsentGiven, setHealthConsentGiven] = useState(false);
  const [showHealthConsent, setShowHealthConsent] = useState(false);
  const [ageConfirmedAt] = useState(() => new Date().toISOString());

  useEffect(() => {
    if (wizardOpen) {
      translateY.value = withSpring(0, { damping: 26, stiffness: 300 });
    } else {
      translateY.value = withSpring(SCREEN_H, { damping: 28, stiffness: 280 });
    }
  }, [translateY, wizardOpen]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const promptHtml = WIZARD_PROMPTS.user[wizardStep - 1] ?? '';

  const handleContinue = useCallback(async () => {
    if (selectedType !== 'user') return;

    if (wizardStep === 1) {
      const e = validateUserStep1(userForm);
      const consent = userStep1Ref.current?.validateConsent() ?? {};
      const merged = { ...e, ...consent };
      setUser1e(merged);
      if (Object.keys(merged).length > 0) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (wizardStep === 1 && !healthConsentGiven) {
      setShowHealthConsent(true);
      return;
    }

    if (wizardStep < 5) {
      setWizardStep((wizardStep + 1) as WizardStep);
      return;
    }

    setBusy(true);
    try {
      const res = await submitUserRegistration({ ...userForm, ageConfirmedAt });
      if (res.success) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        useOnboardingStore.getState().setWizardOpen(false);
        onRegistrationSuccess();
      } else {
        Alert.alert('Something went wrong', res.error ?? 'Please try again.');
      }
    } catch {
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      setBusy(false);
    }
  }, [onRegistrationSuccess, selectedType, setWizardStep, userForm, wizardStep, healthConsentGiven, ageConfirmedAt]);

  const stepBody = (
    <>
      {wizardStep === 1 ? <UserStep1 ref={userStep1Ref} errors={user1e} /> : null}
      {wizardStep === 2 ? <UserStep2 /> : null}
      {wizardStep === 3 ? <UserStep3 /> : null}
      {wizardStep === 4 ? <UserStep4 /> : null}
      {wizardStep === 5 ? <UserStep5 /> : null}
    </>
  );

  if (selectedType !== 'user') return null;

  if (showHealthConsent) {
    return (
      <Animated.View style={[styles.shell, sheetStyle]} pointerEvents={wizardOpen ? 'auto' : 'none'}>
        <HealthDataConsentModal
          visible={true}
          userId={null}
          onConsented={() => {
            setHealthConsentGiven(true);
            setShowHealthConsent(false);
            setWizardStep(2 as WizardStep);
          }}
          onDeclined={() => {
            setHealthConsentGiven(false);
            setShowHealthConsent(false);
            setWizardStep(5 as WizardStep);
          }}
        />
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.shell, sheetStyle]} pointerEvents={wizardOpen ? 'auto' : 'none'}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top}
      >
        <View style={[styles.inner, { paddingTop: insets.top }]}>
          <WizardHeader />
          <ConvoPrompt key={`user-${wizardStep}`} html={promptHtml} />
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {stepBody}
          </ScrollView>
          <LinearGradient
            colors={[OB.ink, 'transparent']}
            start={{ x: 0.5, y: 1 }}
            end={{ x: 0.5, y: 0 }}
            style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}
          >
            <CtaButton
              label={wizardStep < 5 ? 'Continue →' : 'Finish'}
              onPress={handleContinue}
              disabled={busy}
            />
          </LinearGradient>
        </View>
      </KeyboardAvoidingView>
      {busy ? (
        <View style={styles.overlay}>
          <TruWellShield size={72} animated />
          <Text style={styles.overlayText}>Setting up your guardian...</Text>
          <ActivityIndicator color={OB.teal} style={{ marginTop: 12 }} />
        </View>
      ) : null}
    </Animated.View>
  );
}

export const RegistrationWizard = memo(RegistrationWizardInner);

const styles = StyleSheet.create({
  shell: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 200,
    backgroundColor: OB.navy,
  },
  flex: { flex: 1 },
  inner: { flex: 1 },
  scroll: { flex: 1, paddingHorizontal: 20 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3,8,15,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 300,
  },
  overlayText: {
    marginTop: 16,
    fontSize: 15,
    color: OB.t70,
    fontWeight: '600',
  },
});

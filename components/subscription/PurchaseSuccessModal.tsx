import { TruWellShield } from '@/components/onboarding/TruWellShield';
import { getPlanById, type PlanId } from '@/lib/subscriptionPlans';
import { useRouter } from 'expo-router';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
const TEAL = '#00E5C8';
const BG_DARK = '#020A14';

const BODY_TEXT: Record<string, string> = {
  lifetime:
    'You are now one of the 127 Founders. Your protection is permanent. Every scan, every report, every future feature - yours forever.',
  family:
    'Five profiles unlocked. Unlimited scans for your household. What hides in the label no longer hides from you.',
  pro_yearly: 'Unlimited protection activated. Scan anything. Know everything.',
  pro_monthly: 'Unlimited protection activated. Scan anything. Know everything.',
};

interface Props {
  planId: PlanId;
  visible: boolean;
  onDismiss: () => void;
}

export function PurchaseSuccessModal({ planId, visible, onDismiss }: Props) {
  const plan = getPlanById(planId);
  const router = useRouter();

  const contentScale = useSharedValue(0.8);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      contentScale.value = withSpring(1, { damping: 15, stiffness: 180 });
      contentOpacity.value = withTiming(1, { duration: 400 });
    } else {
      contentScale.value = 0.8;
      contentOpacity.value = 0;
    }
  }, [visible]);

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: contentScale.value }],
    opacity: contentOpacity.value,
  }));

  const handleContinue = () => {
    onDismiss();
    router.replace('/(tabs)');
  };

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.content, contentStyle]}>
          <TruWellShield size={80} showCheckmark animated={false} />

          <Text style={styles.headline}>You are subscribed to {plan.name}</Text>
          <Text style={styles.body}>
            {BODY_TEXT[planId] ?? 'Unlimited protection activated. Scan anything. Know everything.'}
          </Text>

          <TouchableOpacity onPress={handleContinue} style={styles.continueBtn} activeOpacity={0.85}>
            <Text style={styles.continueBtnText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: BG_DARK,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  content: {
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  headline: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F0F4FF',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  body: {
    fontSize: 15,
    color: 'rgba(240,244,255,0.65)',
    textAlign: 'center',
    lineHeight: 22,
  },
  continueBtn: {
    marginTop: 8,
    width: '100%',
    height: 56,
    borderRadius: 14,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: BG_DARK,
  },
});

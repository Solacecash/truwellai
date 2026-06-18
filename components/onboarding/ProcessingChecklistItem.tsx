import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { OB } from '@/components/onboarding/tokens';

type Props = {
  label: string;
  complete: boolean;
};

/** Spec checklist item — spinner → teal checkmark spring (lines 301–303). */
export function ProcessingChecklistItem({ label, complete }: Props) {
  const scale = useSharedValue(complete ? 1 : 0.6);
  const opacity = useSharedValue(complete ? 1 : 0.4);

  useEffect(() => {
    if (complete) {
      scale.value = withSpring(1, { damping: 12, stiffness: 180 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = 0.6;
      opacity.value = 0.4;
    }
  }, [complete, opacity, scale]);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.row}>
      {complete ? (
        <Animated.View style={[styles.iconWrap, checkStyle]}>
          <Text style={styles.check}>✓</Text>
        </Animated.View>
      ) : (
        <View style={styles.iconWrap}>
          <PendingDot />
        </View>
      )}
      <Text style={[styles.item, complete && styles.itemDone]}>{label}</Text>
    </View>
  );
}

function PendingDot() {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 600, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.35, { duration: 600, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, [opacity]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.dot, dotStyle]} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 22, alignItems: 'center', justifyContent: 'center' },
  check: { color: OB.teal, fontSize: 18, fontWeight: '900' },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: OB.w40,
  },
  item: { color: OB.t70, fontSize: 14, fontWeight: '600', flex: 1 },
  itemDone: { color: OB.t100 },
});

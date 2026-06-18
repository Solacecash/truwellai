import React, { memo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { psychBrand } from '@/theme/colors';

type Props = {
  text: string;
  visible: boolean;
};

function PsychDynamicCardInner({ text, visible }: Props) {
  const y = useSharedValue(24);
  const o = useSharedValue(0);

  useEffect(() => {
    if (!visible || !text) {
      o.value = withSpring(0);
      return;
    }
    y.value = 24;
    y.value = withSpring(0, { damping: 16, stiffness: 180 });
    o.value = withSpring(1, { damping: 18, stiffness: 200 });
  }, [visible, text, o, y]);

  const anim = useAnimatedStyle(() => ({
    opacity: o.value,
    transform: [{ translateY: y.value }],
  }));

  if (!text || !visible) return null;

  return (
    <Animated.View style={[styles.wrap, anim]} accessibilityLiveRegion="polite">
      <Text style={styles.text}>{text}</Text>
    </Animated.View>
  );
}

export const PsychDynamicCard = memo(PsychDynamicCardInner);

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: psychBrand.tealBorder,
    backgroundColor: 'rgba(5,15,26,0.85)',
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: psychBrand.primary,
    lineHeight: 19,
  },
});

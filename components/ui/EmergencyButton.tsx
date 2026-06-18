import { useTheme } from '@/theme/ThemeContext';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { EmergencySheet } from './EmergencySheet';

const TAB_BAR_AREA = 60;

export function EmergencyButton() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    shadowColor: theme.red,
    shadowOpacity: 0.55,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  }));

  const bottom = insets.bottom + TAB_BAR_AREA + 16;

  return (
    <>
      <Animated.View style={[styles.wrap, { bottom, right: 16 }, animStyle]}>
        <Pressable
          onPress={() => setOpen(true)}
          style={[styles.circle, { backgroundColor: theme.red }]}
          accessibilityLabel="Emergency"
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M12 3v18M3 12h18" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" />
          </Svg>
        </Pressable>
        <Text style={[styles.lbl, { color: theme.red }]}>Emergency</Text>
      </Animated.View>
      <EmergencySheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
    gap: 4,
    zIndex: 40,
  },
  circle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lbl: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
});

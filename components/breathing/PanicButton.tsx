import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { PanicBottomSheet } from './PanicBottomSheet';

// Tabs + emergency FAB area. Panic sits above emergency button.
const TAB_BAR_AREA = 60;

interface Props {
  /** Additional bottom offset to clear the emergency button. */
  liftAboveEmergency?: boolean;
}

export function PanicButton({ liftAboveEmergency = true }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0, { duration: 1200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    setOpen(true);
  };

  // bottom = tab bar + insets + (emergency button space) + 16
  const bottomOffset =
    insets.bottom + TAB_BAR_AREA + (liftAboveEmergency ? 80 : 16) + 16;

  return (
    <>
      <Animated.View
        style={[styles.wrap, { bottom: bottomOffset, right: 16 }, style]}
      >
        <Pressable
          onPress={handlePress}
          accessibilityLabel="Breathing panic button"
          style={[
            styles.circle,
            {
              backgroundColor: 'rgba(255,71,87,0.9)',
              shadowColor: '#FF4757',
            },
          ]}
        >
          <Ionicons name="pulse" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={[styles.label, { color: '#FFFFFF' }]}>Breathe</Text>
      </Animated.View>

      <PanicBottomSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 50,
  },
  circle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 14,
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

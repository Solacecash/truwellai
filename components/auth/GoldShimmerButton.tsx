import React, { useEffect } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  color?: 'gold' | 'teal';
  disabled?: boolean;
  icon?: React.ReactNode;
}

export default function GoldShimmerButton({
  label, onPress, loading = false, color = 'gold', disabled = false, icon
}: Props) {
  const shimmerX = useSharedValue(-1);

  useEffect(() => {
    shimmerX.value = withRepeat(
      withTiming(2, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value * 200 }, { skewX: '-20deg' }],
  }));

  const bg = color === 'gold' ? '#C9A84C' : '#00E5C8';
  const textColor = '#020A14';

  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      disabled={disabled || loading}
      activeOpacity={0.92}
      style={{
        width: '100%',
        height: 56,
        borderRadius: 16,
        backgroundColor: disabled ? 'rgba(201,168,76,0.4)' : bg,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexDirection: 'row',
        gap: 8,
      }}
    >
      <Animated.View
        style={[shimmerStyle, {
          position: 'absolute',
          top: 0, bottom: 0,
          width: '50%',
          backgroundColor: 'rgba(255,255,255,0.22)',
        }]}
      />
      {loading ? (
        <ActivityIndicator color={textColor} size="small"/>
      ) : (
        <>
          {icon}
          <Text style={{ fontSize: 16, fontWeight: '800', color: textColor, letterSpacing: 0.1 }}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

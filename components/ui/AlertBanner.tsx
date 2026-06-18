import React, { useCallback, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeContext';

interface Props {
  message: string;
  actionText?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  style?: ViewStyle;
}

export function AlertBanner({ message, actionText, onAction, onDismiss, style }: Props) {
  const { theme } = useTheme();
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(0.3, { duration: 800 }), -1, true);
  }, []);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  const handleDismiss = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: `${theme.red}14`,
          borderColor: `${theme.red}44`,
        },
        style,
      ]}
    >
      <Animated.View
        style={[styles.dot, { backgroundColor: theme.red }, dotStyle]}
      />
      <Text style={[styles.message, { color: theme.text1 }]} numberOfLines={2}>
        {message}
      </Text>
      {actionText && onAction ? (
        <TouchableOpacity onPress={onAction} hitSlop={6}>
          <Text style={[styles.action, { color: theme.red }]}>{actionText}</Text>
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity onPress={handleDismiss} hitSlop={6} style={styles.dismiss}>
        <Text style={[styles.dismissText, { color: theme.text3 }]}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    flexShrink: 0,
  },
  message: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  action: {
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 0,
  },
  dismiss: {
    flexShrink: 0,
    paddingLeft: 2,
  },
  dismissText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

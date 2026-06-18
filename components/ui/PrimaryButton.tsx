import { hapticMedium } from '@/lib/haptics';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';

type Props = {
  label: string;
  onPress: () => void;
  /** Default: Circuit Gold (primary). Teal = accent CTA. Outline = secondary. */
  variant?: 'gold' | 'teal' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export function PrimaryButton({
  label,
  onPress,
  variant = 'gold',
  disabled,
  loading,
  style,
}: Props) {
  const isGold = variant === 'gold';
  const isOutline = variant === 'outline';
  return (
    <Pressable
      onPress={() => {
        hapticMedium();
        onPress();
      }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isOutline ? styles.outline : isGold ? styles.gold : styles.teal,
        (disabled || loading) && styles.disabled,
        pressed && (isOutline ? styles.pressedOutline : styles.pressed),
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.tealGlow : colors.dark} />
      ) : (
        <Text
          style={[
            typography.headlineSm,
            styles.label,
            isGold && styles.labelOnGold,
            !isGold && !isOutline && styles.labelOnTeal,
            isOutline && styles.labelOutline,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  gold: { backgroundColor: colors.accentGold },
  teal: { backgroundColor: colors.tealGlow },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.tealGlow,
    shadowOpacity: 0,
    elevation: 0,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  pressedOutline: { opacity: 0.92, transform: [{ scale: 0.98 }], backgroundColor: 'rgba(0,229,200,0.08)' },
  disabled: { opacity: 0.45 },
  label: { color: colors.dark },
  labelOnGold: { color: colors.dark },
  labelOnTeal: { color: colors.dark },
  labelOutline: { color: colors.tealGlow },
});

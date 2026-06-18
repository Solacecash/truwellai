import { colors } from '@/theme/colors';
import { ReactNode } from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
};

export function GlowCard({ children, style }: Props) {
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.cardBg,
    ...Platform.select({
      ios: {
        shadowColor: colors.tealGlow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  inner: {
    borderRadius: 15,
    padding: 16,
    overflow: 'hidden',
  },
});

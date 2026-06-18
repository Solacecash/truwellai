import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

type Props = {
  icon?: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
  style?: ViewStyle;
};

/** Consistent empty states — icon emoji + short copy + optional gold CTA */
export function EmptyState({ icon = '✧', title, subtitle, ctaLabel, onCta, style }: Props) {
  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[typography.headlineSm, styles.title]}>{title}</Text>
      {subtitle ? <Text style={[typography.caption, styles.sub]}>{subtitle}</Text> : null}
      {ctaLabel && onCta ? (
        <PrimaryButton label={ctaLabel} onPress={onCta} style={styles.btn} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: 'rgba(8, 14, 26, 0.65)',
  },
  icon: { fontSize: 36, marginBottom: 12, opacity: 0.85 },
  title: { textAlign: 'center', color: colors.textPrimary },
  sub: { textAlign: 'center', marginTop: 8, opacity: 0.85, maxWidth: 280 },
  btn: { marginTop: 20, alignSelf: 'stretch' },
});

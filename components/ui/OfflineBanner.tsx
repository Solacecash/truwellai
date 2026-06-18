import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
};

export function OfflineBanner({ visible }: Props) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  return (
    <View style={[styles.bar, { paddingTop: Math.max(insets.top, 8) }]} pointerEvents="none">
      <Text style={[typography.caption, styles.text]}>
        You're offline. Some features may not work.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: 'rgba(180, 72, 48, 0.94)',
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.2)',
  },
  text: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
});

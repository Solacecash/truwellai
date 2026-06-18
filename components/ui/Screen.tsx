import { colors } from '@/theme/colors';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  children: ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
};

export function Screen({ children, edges = ['top', 'bottom'] }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <View style={styles.inner}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  inner: { flex: 1, backgroundColor: colors.background },
});

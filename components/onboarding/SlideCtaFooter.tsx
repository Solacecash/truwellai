import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OB } from './tokens';

type Props = { children: ReactNode };

function SlideCtaFooterInner({ children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={['rgba(3,8,15,0)', 'rgba(3,8,15,0.88)', 'rgba(3,8,15,1)']}
      locations={[0, 0.35, 1]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.zone, { paddingBottom: insets.bottom + 16 }]}
      pointerEvents="box-none"
    >
      <View style={styles.inner} pointerEvents="box-none">
        {children}
      </View>
    </LinearGradient>
  );
}

export const SlideCtaFooter = memo(SlideCtaFooterInner);

const styles = StyleSheet.create({
  zone: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 55,
    paddingTop: 10,
    paddingHorizontal: 22,
  },
  inner: {
    width: '100%',
    alignSelf: 'stretch',
  },
});

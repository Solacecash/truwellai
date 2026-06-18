import { LinearGradient } from 'expo-linear-gradient';
import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { OB } from '../tokens';

type Props = {
  value: string;
  label: string;
  valueColor?: string;
};

function StatCardInner({ value, label, valueColor = OB.gold }: Props) {
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['rgba(201,168,76,0.07)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.card}
      >
        <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
        <Text style={styles.caption}>{label}</Text>
      </LinearGradient>
    </View>
  );
}

export const StatCard = memo(StatCardInner);

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  card: {
    borderRadius: OB.r16,
    paddingVertical: 13,
    paddingHorizontal: 8,
    alignItems: 'center',
    backgroundColor: OB.glass1,
    borderWidth: 1,
    borderColor: OB.glassBorder,
  },
  value: {
    fontSize: 21,
    fontWeight: '900',
    textShadowColor: 'rgba(201,168,76,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  caption: {
    marginTop: 4,
    fontSize: 11,
    color: OB.t20,
    lineHeight: 14,
    textAlign: 'center',
  },
});

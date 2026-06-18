import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { OB } from '@/components/onboarding/tokens';

type Props = {
  icon: string;
  title: string;
  description?: string;
  locked?: boolean;
};

function BlueprintRowInner({ icon, title, description, locked = false }: Props) {
  return (
    <View style={[styles.row, locked && styles.rowLocked]}>
      <Text style={[styles.icon, locked && styles.dim]}>{icon}</Text>
      <View style={styles.titleCol}>
        <Text style={[styles.title, locked && styles.dim]}>{title}</Text>
        {description ? (
          <Text style={[styles.description, locked && styles.dim]}>{description}</Text>
        ) : null}
        {locked ? <Text style={styles.premiumTag}>Premium</Text> : null}
      </View>
      <Text style={[styles.badge, locked ? styles.lock : styles.open]}>{locked ? '🔒' : '✓'}</Text>
      {locked ? (
        <View style={styles.blurOverlay} pointerEvents="none">
          <View style={styles.frost} />
        </View>
      ) : null}
    </View>
  );
}

export const BlueprintRow = memo(BlueprintRowInner);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: OB.glassBorder,
    backgroundColor: OB.glass1,
    marginBottom: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  rowLocked: { opacity: 0.85 },
  icon: { fontSize: 20, zIndex: 1 },
  titleCol: { flex: 1, gap: 4, zIndex: 1 },
  title: { color: OB.t100, fontSize: 14, fontWeight: '700', fontFamily: OB.fontBody },
  description: {
    color: OB.t45,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: OB.fontBody,
  },
  premiumTag: {
    color: OB.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontFamily: OB.fontHead,
  },
  dim: { color: OB.t45 },
  badge: { fontSize: 14, zIndex: 1 },
  lock: { opacity: 0.9 },
  open: { color: OB.teal },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  frost: {
    flex: 1,
    backgroundColor: 'rgba(10,22,40,0.55)',
    opacity: 0.4,
  },
});

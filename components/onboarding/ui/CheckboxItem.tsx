import * as Haptics from 'expo-haptics';
import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { OB } from '../tokens';

type Props = {
  label?: string;
  /** Rich label (links, etc.). Use either `label` or `children`, not both required together. */
  children?: React.ReactNode;
  checked: boolean;
  onToggle: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

function CheckboxItemInner({ label, children, checked, onToggle, accessibilityLabel, style }: Props) {
  const handlePress = useCallback(() => {
    void Haptics.selectionAsync();
    onToggle();
  }, [onToggle]);

  const a11yLabel = accessibilityLabel ?? label ?? 'Checkbox';

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={a11yLabel}
      onPress={handlePress}
      style={[styles.row, style]}
    >
      <View style={[styles.box, checked ? styles.boxOn : styles.boxOff]}>
        {checked ? (
          <Text style={styles.check}>✓</Text>
        ) : null}
      </View>
      {children ? (
        <View style={styles.labelWrap}>{children}</View>
      ) : label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}
    </Pressable>
  );
}

export const CheckboxItem = memo(CheckboxItemInner);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: OB.glass1,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginTop: 1,
  },
  boxOff: {
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'transparent',
  },
  boxOn: {
    borderColor: OB.gold,
    backgroundColor: OB.gold,
  },
  check: {
    fontSize: 13,
    fontWeight: '800',
    color: OB.ink,
  },
  labelWrap: { flex: 1 },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: OB.t70,
  },
});

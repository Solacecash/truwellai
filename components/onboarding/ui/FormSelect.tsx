import React, { memo, useCallback, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { OB } from '../tokens';

type Option = { label: string; value: string };

type Props = {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
};

function FormSelectInner({
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Select',
}: Props) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  const close = useCallback(() => setOpen(false), []);
  const openSheet = useCallback(() => setOpen(true), []);

  const pick = useCallback(
    (v: string) => {
      onValueChange(v);
      setOpen(false);
    },
    [onValueChange]
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={openSheet}
        style={[
          styles.field,
          {
            borderColor: value
              ? 'rgba(201,168,76,0.4)'
              : OB.glassBorder,
          },
        ]}
      >
        <Text style={[styles.fieldText, !selected ? styles.placeholder : null]}>
          {selected?.label ?? placeholder}
        </Text>
        <Svg width={16} height={16} viewBox="0 0 24 24">
          <Path
            d="M6 9l6 6 6-6"
            stroke={OB.t45}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.backdrop}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.optionRow}
                  onPress={() => pick(item.value)}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

export const FormSelect = memo(FormSelectInner);

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: OB.t45,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderRadius: OB.r12,
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  fieldText: {
    color: OB.t100,
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  placeholder: {
    color: OB.t20,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    maxHeight: '55%',
    backgroundColor: OB.navy2,
    borderTopLeftRadius: OB.r20,
    borderTopRightRadius: OB.r20,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderWidth: 1,
    borderColor: OB.glassBorder,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: OB.t100,
    marginBottom: 12,
  },
  optionRow: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OB.glassBorder,
  },
  optionText: {
    fontSize: 15,
    color: OB.t70,
    fontWeight: '600',
  },
});

import React, { memo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { TRUWELL_COLORS, onboardingScreenColors } from '@/theme/truwellBrand';

export type OnboardingInputProps = {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  secureTextEntry?: boolean;
  error?: string;
  isDark?: boolean;
  autoFocus?: boolean;
  editable?: boolean;
};

function OnboardingInputInner({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  error,
  isDark = true,
  autoFocus = false,
  editable = true,
}: OnboardingInputProps) {
  const [focused, setFocused] = useState(false);
  const palette = onboardingScreenColors(isDark);

  const bg = focused
    ? isDark
      ? 'rgba(0,168,120,0.10)'
      : 'rgba(0,168,120,0.08)'
    : isDark
      ? 'rgba(255,255,255,0.07)'
      : 'rgba(0,0,0,0.05)';

  const border = error
    ? TRUWELL_COLORS.error
    : focused
      ? TRUWELL_COLORS.guardian
      : isDark
        ? 'rgba(255,255,255,0.12)'
        : 'rgba(0,0,0,0.18)';

  const placeholderColor = isDark ? 'rgba(255,255,255,0.30)' : 'rgba(10,15,30,0.38)';

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={[styles.label, { color: palette.textSecondary }]}>{label.toUpperCase()}</Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoFocus={autoFocus}
        editable={editable}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          {
            backgroundColor: bg,
            borderColor: border,
            color: palette.textPrimary,
          },
        ]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export const OnboardingInput = memo(OnboardingInputInner);

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 7,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  error: {
    fontSize: 12,
    color: TRUWELL_COLORS.error,
    marginTop: 5,
  },
});

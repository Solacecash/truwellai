import React, { memo, useCallback, useState } from 'react';
import {
  KeyboardTypeOptions,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { OB } from '../tokens';

type Props = {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  autoComplete?: 'off' | 'email' | 'password' | 'name' | 'username';
  showPasswordToggle?: boolean;
  error?: string;
  onSubmitEditing?: () => void;
  returnKeyType?: 'next' | 'done';
};

function FormInputInner({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  autoComplete = 'off',
  showPasswordToggle = false,
  error,
  onSubmitEditing,
  returnKeyType = 'done',
}: Props) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry);

  const toggleHidden = useCallback(() => {
    setHidden((h) => !h);
  }, []);

  const valid = value.length > 0 && !error;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={OB.t20}
          keyboardType={keyboardType}
          secureTextEntry={showPasswordToggle ? hidden : secureTextEntry}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          style={[
            styles.input,
            showPasswordToggle ? styles.inputWithToggle : null,
            {
              borderColor: error
                ? OB.red
                : focused
                  ? 'rgba(201,168,76,0.5)'
                  : valid
                    ? 'rgba(46,213,115,0.4)'
                    : OB.glassBorder,
            },
          ]}
        />
        {showPasswordToggle ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            onPress={toggleHidden}
            style={styles.eye}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24">
              {hidden ? (
                <>
                  <Path
                    d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"
                    stroke={OB.t45}
                    strokeWidth={1.5}
                    fill="none"
                  />
                  <Path
                    d="M12 9a3 3 0 100 6 3 3 0 000-6z"
                    stroke={OB.t45}
                    strokeWidth={1.5}
                    fill="none"
                  />
                </>
              ) : (
                <Path
                  d="M3 3l18 18M10.5 10.5a3 3 0 004 4M9.9 5.1A10.4 10.4 0 0112 5c7 0 11 7 11 7a18 18 0 01-3.5 5M6.1 6.1A18 18 0 001 12s4 7 11 7a10 10 0 004-.3"
                  stroke={OB.t45}
                  strokeWidth={1.5}
                  fill="none"
                  strokeLinecap="round"
                />
              )}
            </Svg>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export const FormInput = memo(FormInputInner);

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
  inputWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderRadius: OB.r12,
    paddingVertical: 15,
    paddingHorizontal: 16,
    color: OB.t100,
    fontSize: 15,
    fontWeight: '500',
  },
  inputWithToggle: {
    paddingRight: 48,
  },
  eye: {
    position: 'absolute',
    right: 14,
    height: 44,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    marginTop: 4,
    fontSize: 11,
    color: OB.red,
  },
});

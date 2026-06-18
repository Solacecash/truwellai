import React, { forwardRef, memo, useImperativeHandle, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { useOnboardingStore } from '@/stores/onboardingStore';
import { LEGAL } from '@/lib/legalContent';
import { ONBOARDING_PRIVACY_URL, ONBOARDING_TERMS_URL } from '@/lib/onboardingLegalUrls';

import { CheckboxItem } from '../../ui/CheckboxItem';
import { FormInput } from '../../ui/FormInput';
import { OB } from '../../tokens';

export type UserStep1Errors = Partial<
  Record<'firstName' | 'lastName' | 'email' | 'password' | 'ageConfirm' | 'terms', string>
>;

export type UserStep1Handle = {
  validateConsent: () => Pick<UserStep1Errors, 'ageConfirm' | 'terms'>;
};

type Props = { errors?: UserStep1Errors };

const UserStep1Inner = forwardRef<UserStep1Handle, Props>(function UserStep1Inner({ errors }, ref) {
  const userForm = useOnboardingStore((s) => s.userForm);
  const setUserField = useOnboardingStore((s) => s.setUserField);

  const [over18, setOver18] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useImperativeHandle(ref, () => ({
    validateConsent: () => {
      const e: Pick<UserStep1Errors, 'ageConfirm' | 'terms'> = {};
      if (!over18) e.ageConfirm = 'You must be 18 or older to use TruWell AI';
      if (!termsAccepted) e.terms = 'Please accept our Terms of Service and Privacy Policy';
      return e;
    },
  }));

  return (
    <View style={styles.wrap}>
      <FormInput
        label="First Name"
        value={userForm.firstName}
        onChangeText={(t) => setUserField('firstName', t)}
        placeholder="e.g. Jane"
        autoComplete="name"
        error={errors?.firstName}
        returnKeyType="next"
      />
      <FormInput
        label="Last Name"
        value={userForm.lastName}
        onChangeText={(t) => setUserField('lastName', t)}
        placeholder="e.g. Doe"
        autoComplete="name"
        error={errors?.lastName}
        returnKeyType="next"
      />
      <FormInput
        label="Email"
        value={userForm.email}
        onChangeText={(t) => setUserField('email', t)}
        placeholder="your@email.com"
        keyboardType="email-address"
        autoComplete="email"
        error={errors?.email}
        returnKeyType="next"
      />
      <FormInput
        label="Password"
        value={userForm.password}
        onChangeText={(t) => setUserField('password', t)}
        placeholder="Minimum 8 characters"
        secureTextEntry
        showPasswordToggle
        error={errors?.password}
        returnKeyType="done"
      />

      <CheckboxItem
        checked={over18}
        onToggle={() => setOver18((v) => !v)}
        accessibilityLabel={LEGAL.AGE_CONFIRMATION_TEXT}
        style={styles.checkboxNoBorder}
      >
        <Text style={styles.termsText}>{LEGAL.AGE_CONFIRMATION_TEXT}</Text>
      </CheckboxItem>
      {errors?.ageConfirm ? <Text style={styles.fieldError}>{errors.ageConfirm}</Text> : null}

      <CheckboxItem
        checked={termsAccepted}
        onToggle={() => setTermsAccepted((v) => !v)}
        accessibilityLabel="I have read and agree to TruWell AI's Terms of Service and Privacy Policy"
        style={styles.checkboxNoBorder}
      >
        <Text style={styles.termsText}>
          I have read and agree to TruWell AI&apos;s{' '}
          <Text
            style={styles.termsLink}
            onPress={() => void Linking.openURL(ONBOARDING_TERMS_URL)}
          >
            Terms of Service
          </Text>
          {' '}and{' '}
          <Text
            style={styles.termsLink}
            onPress={() => void Linking.openURL(ONBOARDING_PRIVACY_URL)}
          >
            Privacy Policy
          </Text>
          .
        </Text>
      </CheckboxItem>
      {errors?.terms ? <Text style={styles.fieldError}>{errors.terms}</Text> : null}
    </View>
  );
});

export const UserStep1 = memo(UserStep1Inner);

const styles = StyleSheet.create({
  wrap: { paddingTop: 8 },
  checkboxNoBorder: {
    borderBottomWidth: 0,
    paddingBottom: 4,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: OB.t70,
    lineHeight: 20,
  },
  termsLink: {
    color: OB.teal,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  fieldError: {
    fontSize: 12,
    fontWeight: '600',
    color: OB.red,
    marginTop: -6,
    marginBottom: 4,
    marginLeft: 34,
  },
});

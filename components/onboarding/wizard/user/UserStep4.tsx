import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useOnboardingStore } from '@/stores/onboardingStore';

import { OB } from '../../tokens';
import { ChoiceCard } from '../../ui/ChoiceCard';
import { FormInput } from '../../ui/FormInput';

const REF = [
  { emoji: '👨‍⚕️', title: 'Doctor recommended it', value: 'doctor' },
  { emoji: '📱', title: 'Social media', value: 'social' },
  { emoji: '👋', title: 'Friend or family', value: 'friend' },
  { emoji: '🔍', title: 'Searched for it myself', value: 'search' },
] as const;

function UserStep4Inner() {
  const userForm = useOnboardingStore((s) => s.userForm);
  const setUserField = useOnboardingStore((s) => s.setUserField);

  return (
    <View style={styles.wrap}>
      <FormInput
        label="Current Medications (Optional)"
        value={userForm.medications}
        onChangeText={(t) => setUserField('medications', t)}
        placeholder="e.g. Levothyroxine, Metformin"
      />
      <FormInput
        label="Supplements (Optional)"
        value={userForm.supplements}
        onChangeText={(t) => setUserField('supplements', t)}
        placeholder="e.g. Omega-3, Vitamin D"
      />
      <Text style={styles.section}>How did you find TruWell AI?</Text>
      {REF.map((c) => (
        <ChoiceCard
          key={c.value}
          emoji={c.emoji}
          title={c.title}
          selected={userForm.referralSource === c.value}
          onSelect={() => setUserField('referralSource', c.value)}
          groupName="Referral"
        />
      ))}
    </View>
  );
}

export const UserStep4 = memo(UserStep4Inner);

const styles = StyleSheet.create({
  wrap: { paddingTop: 8 },
  section: {
    fontSize: 11,
    fontWeight: '700',
    color: OB.t45,
    marginBottom: 8,
    marginTop: 4,
  },
});

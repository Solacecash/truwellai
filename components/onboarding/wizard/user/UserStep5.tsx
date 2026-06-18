import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useOnboardingStore } from '@/stores/onboardingStore';

import { OB } from '../../tokens';
import { ChoiceCard } from '../../ui/ChoiceCard';

const PLANS = [
  {
    emoji: '🛡',
    title: 'Free Guardian',
    subtitle: '10 scans/month · A-F grade · 1 profile',
    value: 'free',
  },
  {
    emoji: '⚡',
    title: 'Pro · $6.58/mo (yearly)',
    subtitle: 'Unlimited scans · Full breakdown · Offline',
    value: 'pro',
  },
  {
    emoji: '👨‍👩‍👧‍👦',
    title: 'Family · $16.58/mo (yearly)',
      subtitle: '5 profiles · Shared family protection',
    value: 'family',
  },
  {
    emoji: '♾',
    title: 'Lifetime · $249 once',
    subtitle: 'Everything forever · Founder status',
    value: 'lifetime',
  },
] as const;

function UserStep5Inner() {
  const userForm = useOnboardingStore((s) => s.userForm);
  const setUserField = useOnboardingStore((s) => s.setUserField);

  return (
    <View style={styles.wrap}>
      {PLANS.map((p) => (
        <ChoiceCard
          key={p.value}
          emoji={p.emoji}
          title={p.title}
          subtitle={p.subtitle}
          selected={userForm.selectedPlan === p.value}
          onSelect={() => setUserField('selectedPlan', p.value)}
          groupName="Plan"
        />
      ))}
      <View style={styles.fomo}>
        <View style={styles.goldDot} />
        <Text style={styles.fomoText}>3,427 lifetime spots left. They will not come back.</Text>
      </View>
    </View>
  );
}

export const UserStep5 = memo(UserStep5Inner);

const styles = StyleSheet.create({
  wrap: { paddingTop: 8 },
  fomo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(201,168,76,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.18)',
  },
  goldDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: OB.gold,
  },
  fomoText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: OB.gold,
  },
});

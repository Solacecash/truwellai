import React, { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { useOnboardingStore } from '@/stores/onboardingStore';

import { ChoiceCard } from '../../ui/ChoiceCard';
import { TagCloud } from '../../ui/TagCloud';

const ALLERGY_TAGS = [
  'Gluten',
  'Soy',
  'Peanuts',
  'Tree Nuts',
  'Latex',
  'Nickel',
  'Fragrance',
  'Sulfites',
  'Dairy',
  'Eggs',
  'None',
] as const;

const LIFE = [
  { emoji: '🤰', title: 'Currently Pregnant', subtitle: 'Trimester-specific safety alerts', value: 'pregnant' },
  { emoji: '🍼', title: 'Breastfeeding', subtitle: 'Protects what you pass to your baby', value: 'breastfeeding' },
  {
    emoji: '👨‍👩‍👧',
    title: 'Protecting Young Children',
    subtitle: 'Strictest child-safe filters activated',
    value: 'children',
  },
  { emoji: '🧬', title: 'None of the above', subtitle: 'Standard guardian protection', value: 'none' },
] as const;

function UserStep3Inner() {
  const userForm = useOnboardingStore((s) => s.userForm);
  const setUserField = useOnboardingStore((s) => s.setUserField);

  const toggleAllergy = useCallback(
    (tag: string) => {
      const cur = userForm.allergies;
      const next = cur.includes(tag) ? cur.filter((x) => x !== tag) : [...cur, tag];
      setUserField('allergies', next);
    },
    [setUserField, userForm.allergies]
  );

  return (
    <View style={styles.wrap}>
      <TagCloud
        tags={[...ALLERGY_TAGS]}
        selected={userForm.allergies}
        onToggle={toggleAllergy}
        sectionLabel="Known Allergies"
      />
      <View style={styles.section}>
        {LIFE.map((c) => (
          <ChoiceCard
            key={c.value}
            emoji={c.emoji}
            title={c.title}
            subtitle={c.subtitle}
            selected={userForm.lifeStage === c.value}
            onSelect={() => setUserField('lifeStage', c.value)}
            groupName="Life stage"
          />
        ))}
      </View>
    </View>
  );
}

export const UserStep3 = memo(UserStep3Inner);

const styles = StyleSheet.create({
  wrap: { paddingTop: 8 },
  section: { marginTop: 20 },
});

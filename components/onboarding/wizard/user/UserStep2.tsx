import React, { memo, useCallback } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import * as Location from 'expo-location';
import Svg, { Path } from 'react-native-svg';

import { useOnboardingStore } from '@/stores/onboardingStore';
import { useTheme } from '@/theme/ThemeContext';

import { FormInput } from '../../ui/FormInput';
import { FormSelect } from '../../ui/FormSelect';
import { TagCloud } from '../../ui/TagCloud';

const TAGS = [
  'PCOS',
  'Eczema',
  'Migraines',
  'Asthma',
  'Diabetes',
  'Thyroid',
  'Rosacea',
  'IBS',
  'Kidney Disease',
  'Endometriosis',
  'Autoimmune',
  'Heart Disease',
  'None',
] as const;

const SEX = [
  { label: 'Female', value: 'female' },
  { label: 'Male', value: 'male' },
  { label: 'Prefer not to say', value: 'unspecified' },
];

function LocationPinIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21s7-4.35 7-11a7 7 0 10-14 0c0 6.65 7 11 7 11z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M12 11a2 2 0 100-4 2 2 0 000 4z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function UserStep2Inner() {
  const { theme } = useTheme();
  const userForm = useOnboardingStore((s) => s.userForm);
  const setUserField = useOnboardingStore((s) => s.setUserField);

  const toggle = (tag: string) => {
    const cur = userForm.conditions;
    const next = cur.includes(tag) ? cur.filter((x) => x !== tag) : [...cur, tag];
    setUserField('conditions', next);
  };

  const onLocationToggle = useCallback(
    async (on: boolean) => {
      if (!on) {
        setUserField('locationOptIn', false);
        setUserField('latitude', null);
        setUserField('longitude', null);
        setUserField('countryCode', null);
        return;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setUserField('locationOptIn', false);
        return;
      }
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let cc: string | null = null;
        try {
          const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
          cc = geo[0]?.isoCountryCode ?? null;
        } catch {
          cc = null;
        }
        setUserField('latitude', lat);
        setUserField('longitude', lng);
        setUserField('countryCode', cc);
        setUserField('locationOptIn', true);
      } catch {
        setUserField('locationOptIn', false);
        setUserField('latitude', null);
        setUserField('longitude', null);
        setUserField('countryCode', null);
      }
    },
    [setUserField]
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.half}>
          <FormInput
            label="Age"
            value={userForm.age}
            onChangeText={(t) => setUserField('age', t)}
            placeholder="32"
            keyboardType="number-pad"
            returnKeyType="next"
          />
        </View>
        <View style={styles.half}>
          <FormSelect
            label="Sex"
            value={userForm.sex}
            onValueChange={(v) => setUserField('sex', v)}
            options={[...SEX]}
            placeholder="Select"
          />
        </View>
      </View>
      <TagCloud tags={[...TAGS]} selected={userForm.conditions} onToggle={toggle} sectionLabel="Health Conditions" />

      <Text style={[styles.locSectionLabel, { color: theme.text3 }]}>Location (Optional)</Text>
      <View style={[styles.locRow, { borderColor: theme.border, backgroundColor: theme.bg2 }]}>
        <LocationPinIcon color={theme.teal} />
        <Text style={[styles.locMain, { color: theme.text2 }]}>Allow location for nearby doctors</Text>
        <Switch
          value={userForm.locationOptIn}
          onValueChange={(v) => void onLocationToggle(v)}
          trackColor={{ false: theme.bg3, true: `${theme.teal}80` }}
          thumbColor={userForm.locationOptIn ? theme.teal : theme.text3}
        />
      </View>
      <Text style={[styles.locNote, { color: theme.text3 }]}>
        Your location is only used to show nearby specialists. We never share it.
      </Text>
    </View>
  );
}

export const UserStep2 = memo(UserStep2Inner);

const styles = StyleSheet.create({
  wrap: { paddingTop: 8 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  locSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 18,
    marginBottom: 8,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  locMain: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  locNote: { fontSize: 10, fontStyle: 'italic', marginTop: 8, lineHeight: 15 },
});

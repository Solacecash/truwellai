import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/ThemeContext';

export const ALL_ALLERGENS = [
  'Shellfish',
  'Nuts (tree nuts)',
  'Peanuts',
  'Dairy',
  'Eggs',
  'Gluten',
  'Wheat',
  'Soy',
  'Fish',
  'Sesame',
  'Latex',
  'Nickel',
  'Fragrance',
  'Parabens',
  'Sulfates',
  'Formaldehyde',
  'Propylene Glycol',
  'Lanolin',
  'Balsam of Peru',
  'Cobalt',
] as const;

interface Props {
  selected: string[];
  onToggle: (allergen: string) => void;
}

function CheckboxIcon({ checked, color, border }: { checked: boolean; color: string; border: string }) {
  if (checked) {
    return (
      <Svg width={20} height={20} viewBox="0 0 20 20">
        <Rect x={1} y={1} width={18} height={18} rx={4} fill={`${color}22`} stroke={color} strokeWidth={1.5} />
        <Path d="M5 10 L8.5 13.5 L15 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Svg>
    );
  }
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Rect x={1} y={1} width={18} height={18} rx={4} fill="none" stroke={border} strokeWidth={1.5} />
    </Svg>
  );
}

export function AllergenSelector({ selected, onToggle }: Props) {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return ALL_ALLERGENS;
    const q = query.toLowerCase();
    return ALL_ALLERGENS.filter((a) => a.toLowerCase().includes(q));
  }, [query]);

  return (
    <View>
      {/* Search bar */}
      <TextInput
        style={[styles.search, { backgroundColor: theme.bg2, borderColor: theme.border, color: theme.text1 }]}
        placeholder="Search allergens..."
        placeholderTextColor={theme.text4}
        value={query}
        onChangeText={setQuery}
        returnKeyType="search"
      />

      {/* List */}
      <View style={[styles.listBox, { borderColor: theme.border }]}>
        {filtered.map((item) => {
          const checked = selected.includes(item);
          return (
            <Pressable
              key={item}
              onPress={() => { void Haptics.selectionAsync(); onToggle(item); }}
              style={[styles.row, { borderBottomColor: theme.border }]}
            >
              <Text style={[styles.rowText, { color: checked ? theme.text1 : theme.text2, fontWeight: checked ? '700' : '500' }]}>
                {item}
              </Text>
              <CheckboxIcon checked={checked} color={theme.teal} border={theme.border} />
            </Pressable>
          );
        })}
      </View>

      {/* Count */}
      {selected.length > 0 && (
        <Text style={[styles.countLabel, { color: theme.teal }]}>
          {selected.length} allergen{selected.length !== 1 ? 's' : ''} selected
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    height:            44,
    borderRadius:      12,
    borderWidth:       1,
    paddingHorizontal: 14,
    fontSize:          14,
    marginBottom:      8,
  },
  listBox: {
    borderRadius:  12,
    borderWidth:   1,
    overflow:      'hidden',
    marginBottom:  6,
  },
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 14,
    paddingVertical:   12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText:    { fontSize: 14 },
  countLabel: { fontSize: 12, fontWeight: '700', marginTop: 4 },
});

import { GradedIngredient } from '@/stores/scanStore';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const trafficColor = (t: GradedIngredient['traffic']) => {
  switch (t) {
    case 'safe':
      return colors.safe;
    case 'moderate':
      return colors.moderate;
    default:
      return colors.avoid;
  }
};

type Props = { item: GradedIngredient };

export function IngredientCard({ item }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      onPress={() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setOpen(!open);
      }}
      style={styles.row}
    >
      <View style={[styles.dot, { backgroundColor: trafficColor(item.traffic) }]} />
      <View style={styles.textCol}>
        <Text style={[typography.bodyStrong, styles.name]}>{item.name}</Text>
        {open && item.note ? (
          <Text style={[typography.caption, styles.note]}>{item.note}</Text>
        ) : null}
      </View>
      <Text style={styles.chev}>{open ? '−' : '+'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cardBorder,
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6, marginRight: 12 },
  textCol: { flex: 1 },
  name: { fontSize: 15 },
  note: { marginTop: 6 },
  chev: { color: colors.tealGlow, fontSize: 18, fontFamily: 'Montserrat_700Bold' },
});

import { hapticLight } from '@/lib/haptics';
import { MealSlot } from '@/stores/dietStore';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = { meal: MealSlot; onSwap?: () => void };

export function MealCard({ meal, onSwap }: Props) {
  return (
    <Pressable
      onPress={() => {
        if (onSwap) {
          hapticLight();
          onSwap();
        }
      }}
      disabled={!onSwap}
      style={({ pressed }) => [styles.press, pressed && onSwap && styles.pressed]}
    >
      <LinearGradient
        colors={['rgba(22, 163, 74, 0.38)', 'rgba(8, 14, 26, 0.96)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.row}>
          <View style={styles.meta}>
            <Text style={[typography.caption]}>{meal.label}</Text>
            <Text style={[typography.bodyStrong, styles.name]}>{meal.name}</Text>
          </View>
          <Text style={[typography.headlineSm, styles.kcal]}>{meal.kcal}</Text>
        </View>
        {onSwap ? (
          <Text style={[typography.caption, styles.swap]}>Tap to swap meal</Text>
        ) : null}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  press: { marginBottom: 10, borderRadius: 18 },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.95 },
  card: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 200, 0.14)',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { flex: 1, paddingRight: 12 },
  name: { fontSize: 15, marginTop: 4 },
  kcal: { color: colors.diet, fontSize: 18 },
  swap: { color: colors.tealGlow, marginTop: 10 },
});

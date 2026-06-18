import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { Link } from 'expo-router';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';

export type AltProduct = {
  id: string;
  name: string;
  brand: string;
  grade: string;
  score: number;
  priceBand?: string;
  imageUrl?: string;
};

type Props = {
  items: AltProduct[];
  onSelect?: (item: AltProduct) => void;
  /** Barcode of scanned product — excludes it from comparison alternatives */
  excludeBarcode?: string;
};

export function AlternativesCarousel({ items, onSelect, excludeBarcode }: Props) {
  return (
    <View style={styles.section}>
      <Text style={[typography.headlineSm, styles.title]}>Smarter picks</Text>
      <FlatList
        horizontal
        data={items}
        keyExtractor={(i) => i.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews
        renderItem={({ item }) => (
          <Link
            href={{
              pathname: '/comparison',
              params: {
                id: item.id,
                ...(excludeBarcode ? { excludeBarcode } : {}),
              },
            }}
            asChild
          >
            <Pressable onPress={() => onSelect?.(item)} style={styles.card}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.img} />
              ) : (
                <View style={[styles.img, styles.imgPh]} />
              )}
              <Text style={[typography.bodyStrong, styles.name]} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={[typography.caption]}>{item.brand}</Text>
              <View style={styles.badgeRow}>
                <Text style={styles.badge}>{item.grade}</Text>
                <Text style={[typography.caption, styles.score]}>{item.score}</Text>
              </View>
              {item.priceBand ? (
                <Text style={[typography.caption, styles.price]}>{item.priceBand}</Text>
              ) : null}
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 8 },
  title: { marginBottom: 12, paddingHorizontal: 4 },
  list: { gap: 12, paddingBottom: 8 },
  card: {
    width: 156,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  img: { width: '100%', height: 72, borderRadius: 10, marginBottom: 8 },
  imgPh: { backgroundColor: colors.dark },
  name: { fontSize: 14 },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  badge: {
    fontFamily: 'Montserrat_700Bold',
    color: colors.tealGlow,
    fontSize: 14,
  },
  score: { color: colors.textPrimary },
  price: { marginTop: 4, color: colors.accentGold },
});

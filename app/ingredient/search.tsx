import { BackHeader } from '@/components/ui/BackHeader';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/theme/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────

type RiskLevel = 'safe' | 'moderate' | 'avoid';

interface IngredientRow {
  name: string;
  safety_rating: RiskLevel;
  is_eu_banned: boolean;
  risk_category: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RISK_CONFIG: Record<RiskLevel, { label: string; colorKey: 'green' | 'gold' | 'red' }> = {
  safe:     { label: 'Safe',     colorKey: 'green' },
  moderate: { label: 'Moderate', colorKey: 'gold' },
  avoid:    { label: 'Avoid',    colorKey: 'red' },
};

const RECENT_KEY = 'truwell_recent_searches';
const MAX_RECENT = 8;
const DEBOUNCE_MS = 300;

// ─── Sub-components ───────────────────────────────────────────────────────────

function RiskPill({
  rating,
  theme,
}: {
  rating: RiskLevel;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  const cfg = RISK_CONFIG[rating] ?? RISK_CONFIG.moderate;
  const color = theme[cfg.colorKey];
  return (
    <View style={[ig.riskPill, { backgroundColor: `${color}14`, borderColor: `${color}40` }]}>
      <View style={[ig.riskDot, { backgroundColor: color }]} />
      <Text style={[ig.riskText, { color }]}>{cfg.label}</Text>
    </View>
  );
}

function EUBadge({ theme }: { theme: ReturnType<typeof useTheme>['theme'] }) {
  return (
    <View style={[ig.euBadge, { backgroundColor: `${theme.red}14`, borderColor: `${theme.red}40` }]}>
      <Text style={[ig.euText, { color: theme.red }]}>EU Banned</Text>
    </View>
  );
}

function IngredientItem({
  item,
  index,
  theme,
  onPress,
}: {
  item: IngredientRow;
  index: number;
  theme: ReturnType<typeof useTheme>['theme'];
  onPress: () => void;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(250).springify().damping(20).stiffness(220)}>
      <TouchableOpacity
        activeOpacity={0.78}
        onPress={onPress}
        style={[ig.resultRow, { backgroundColor: theme.bg1, borderColor: theme.border }]}
      >
        <View style={ig.resultLeft}>
          <Text style={[ig.resultName, { color: theme.text1 }]} numberOfLines={1}>
            {item.name}
          </Text>
          {item.risk_category ? (
            <Text style={[ig.resultCategory, { color: theme.text3 }]} numberOfLines={1}>
              {item.risk_category}
            </Text>
          ) : null}
        </View>
        <View style={ig.resultBadges}>
          {item.is_eu_banned ? <EUBadge theme={theme} /> : null}
          <RiskPill rating={item.safety_rating ?? 'moderate'} theme={theme} />
        </View>
        <Text style={[ig.chev, { color: theme.text3 }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Recent searches ──────────────────────────────────────────────────────────

async function loadRecent(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

async function saveRecent(query: string, prev: string[]): Promise<string[]> {
  const deduped = [query, ...prev.filter((q) => q.toLowerCase() !== query.toLowerCase())].slice(0, MAX_RECENT);
  try {
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(deduped));
  } catch { /* non-fatal */ }
  return deduped;
}

async function removeRecent(query: string, prev: string[]): Promise<string[]> {
  const next = prev.filter((q) => q !== query);
  try {
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch { /* non-fatal */ }
  return next;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function IngredientSearchScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [recent, setRecent] = useState<string[]>([]);

  // Auto-focus on mount
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, []);

  // Load recent searches
  useEffect(() => {
    void loadRecent().then(setRecent);
  }, []);

  // Debounce the query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  // Search query
  const searchQuery = useQuery<IngredientRow[]>({
    queryKey: ['ingredient-search', debouncedQuery],
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ingredients_database')
        .select('name, safety_rating, is_eu_banned, risk_category')
        .or(`name.ilike.%${debouncedQuery}%,aliases.cs.{${debouncedQuery}}`)
        .order('safety_rating', { ascending: true })
        .limit(50);

      if (error) throw error;
      return (data ?? []) as IngredientRow[];
    },
  });

  const handleSelectIngredient = async (ingredient: IngredientRow) => {
    const updated = await saveRecent(ingredient.name, recent);
    setRecent(updated);
    router.push(`/ingredient/${encodeURIComponent(ingredient.name)}` as never);
  };

  const handleSelectRecent = async (term: string) => {
    setQuery(term);
    const updated = await saveRecent(term, recent);
    setRecent(updated);
  };

  const handleRemoveRecent = async (term: string) => {
    const updated = await removeRecent(term, recent);
    setRecent(updated);
  };

  const showRecent = debouncedQuery.length < 2 && recent.length > 0;
  const showResults = debouncedQuery.length >= 2;
  const isLoading = searchQuery.isFetching;
  const results = searchQuery.data ?? [];
  const noResults = showResults && !isLoading && results.length === 0;

  return (
    <SafeAreaView style={[ig.safe, { backgroundColor: theme.bg0 }]} edges={['top']}>
      <BackHeader title="Search Ingredients" onBack={() => router.back()} />

      {/* ── Search bar ───────────────────────────────────────────────────────── */}
      <View style={[ig.searchWrap, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
        <Text style={[ig.searchIcon, { color: theme.text3 }]}>⌕</Text>
        <TextInput
          ref={inputRef}
          style={[ig.searchInput, { color: theme.text1 }]}
          placeholder="e.g. Sodium Lauryl Sulfate, Parabens…"
          placeholderTextColor={theme.text3}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Text style={[ig.clearBtn, { color: theme.text3 }]}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      {/* ── Recent searches ──────────────────────────────────────────────────── */}
      {showRecent ? (
        <Animated.View entering={FadeIn.duration(200)}>
          <Text style={[ig.sectionLabel, { color: theme.text3 }]}>Recent Searches</Text>
          {recent.map((term) => (
            <View
              key={term}
              style={[ig.recentRow, { borderBottomColor: theme.border }]}
            >
              <TouchableOpacity
                style={ig.recentLeft}
                activeOpacity={0.7}
                onPress={() => void handleSelectRecent(term)}
              >
                <Text style={[ig.recentIcon, { color: theme.text4 }]}>�-�</Text>
                <Text style={[ig.recentText, { color: theme.text2 }]}>{term}</Text>
              </TouchableOpacity>
              <Pressable
                onPress={() => void handleRemoveRecent(term)}
                hitSlop={10}
                style={ig.recentRemove}
              >
                <Text style={[ig.recentRemoveText, { color: theme.text4 }]}>✕</Text>
              </Pressable>
            </View>
          ))}
        </Animated.View>
      ) : null}

      {/* ── Loading skeleton ─────────────────────────────────────────────────── */}
      {isLoading && showResults ? (
        <View style={ig.skeletonWrap}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={[ig.skeletonRow, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
              <View style={ig.skeletonLeft}>
                <SkeletonLoader width="55%" height={14} borderRadius={6} />
                <SkeletonLoader width="35%" height={11} borderRadius={6} />
              </View>
              <SkeletonLoader width={64} height={24} borderRadius={12} />
            </View>
          ))}
        </View>
      ) : null}

      {/* ── Results ──────────────────────────────────────────────────────────── */}
      {showResults && !isLoading ? (
        <>
          {noResults ? (
            <Animated.View entering={FadeIn.duration(200)} style={ig.noResultsWrap}>
              <Text style={[ig.noResultsIcon]}>🔍</Text>
              <Text style={[ig.noResultsTitle, { color: theme.text1 }]}>
                No ingredients found for "{debouncedQuery}"
              </Text>
              <Text style={[ig.noResultsSub, { color: theme.text3 }]}>
                Try a different spelling, or scan the product barcode to analyse its full ingredient list.
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[ig.scanSuggestBtn, { backgroundColor: `${theme.teal}14`, borderColor: `${theme.teal}40` }]}
                onPress={() => router.push('/(tabs)/scan' as never)}
              >
                <Text style={[ig.scanSuggestText, { color: theme.teal }]}>Scan Product Instead</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.name}
              contentContainerStyle={ig.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item, index }) => (
                <IngredientItem
                  item={item}
                  index={index}
                  theme={theme}
                  onPress={() => void handleSelectIngredient(item)}
                />
              )}
            />
          )}
        </>
      ) : null}

      {/* ── Empty state (no query yet) ───────────────────────────────────────── */}
      {!showRecent && !showResults ? (
        <Animated.View entering={FadeIn.duration(300)} style={ig.emptyPrompt}>
          <Text style={ig.emptyIcon}>🧬</Text>
          <Text style={[ig.emptyTitle, { color: theme.text2 }]}>
            Search 500,000+ ingredients
          </Text>
          <Text style={[ig.emptySub, { color: theme.text3 }]}>
            Check safety ratings, EU ban status, and alternatives for any cosmetic or food ingredient.
          </Text>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ig = StyleSheet.create({
  safe: { flex: 1 },

  // Search bar
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    height: 48,
    gap: 8,
  },
  searchIcon: { fontSize: 18 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },
  clearBtn: { fontSize: 14, fontWeight: '700', padding: 4 },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginTop: 18,
    marginBottom: 4,
  },

  // Recent
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  recentLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  recentIcon: { fontSize: 15 },
  recentText: { fontSize: 14, fontWeight: '500' },
  recentRemove: { padding: 4 },
  recentRemoveText: { fontSize: 13, fontWeight: '700' },

  // Skeleton
  skeletonWrap: { padding: 16, gap: 10 },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  skeletonLeft: { gap: 6, flex: 1, marginRight: 12 },

  // Results list
  listContent: { padding: 16, gap: 8, paddingBottom: 48 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  resultLeft: { flex: 1, gap: 3 },
  resultName: { fontSize: 14, fontWeight: '700', letterSpacing: -0.1 },
  resultCategory: { fontSize: 11, fontWeight: '500' },
  resultBadges: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  chev: { fontSize: 20, fontWeight: '300' },

  // Risk pill
  riskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  riskDot: { width: 5, height: 5, borderRadius: 2.5 },
  riskText: { fontSize: 11, fontWeight: '700' },

  // EU badge
  euBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  euText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.2 },

  // No results
  noResultsWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  noResultsIcon: { fontSize: 40, marginBottom: 14 },
  noResultsTitle: { fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  noResultsSub: { fontSize: 13, lineHeight: 20, textAlign: 'center', marginBottom: 24, maxWidth: 280 },
  scanSuggestBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 50,
    borderWidth: 1,
  },
  scanSuggestText: { fontSize: 14, fontWeight: '800' },

  // Empty prompt
  emptyPrompt: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { fontSize: 40, marginBottom: 14 },
  emptyTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  emptySub: { fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 280 },
});

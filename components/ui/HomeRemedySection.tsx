import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { hapticLight } from '@/lib/haptics';
import {
  HOME_REMEDIES,
  REMEDY_CATEGORIES,
  TARGET_GROUPS,
  type HomeRemedy,
} from '@/lib/homeRemedies';
import LegalDisclaimer from '@/components/legal/LegalDisclaimer';
import EmergencyNotice from '@/components/legal/EmergencyNotice';
import { LEGAL } from '@/lib/legalContent';
import { useTheme } from '@/theme/ThemeContext';
import type { Theme } from '@/theme/index';

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function SearchIconSmall({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 21l-5.2-5.2M11 19a8 8 0 100-16 8 8 0 000 16z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ChevronIcon({ color, up }: { color: string; up?: boolean }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d={up ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'}
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ClockIcon({ color }: { color: string }) {
  return (
    <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 6v6l4 2M22 12a10 10 0 11-20 0 10 10 0 0120 0z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function AlertIcon({ color }: { color: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Target group badge helpers
// ---------------------------------------------------------------------------

const TARGET_LABEL: Record<HomeRemedy['targetGroup'], string> = {
  all: 'All',
  men: 'Men',
  women: 'Women',
  children: 'Children',
  elderly: 'Elderly',
};

const TARGET_COLOR: Record<HomeRemedy['targetGroup'], string> = {
  all: '#00E5C8',
  men: '#1E90FF',
  women: '#FF6B9D',
  children: '#2ED573',
  elderly: '#F39C12',
};

// ---------------------------------------------------------------------------
// Filter pills row (category / target)
// ---------------------------------------------------------------------------

function FilterPill({
  label,
  color,
  active,
  onPress,
  theme,
}: {
  label: string;
  color: string;
  active: boolean;
  onPress: () => void;
  theme: Theme;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={style}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.94, { damping: 18, stiffness: 320 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 14, stiffness: 220 });
        }}
        onPress={() => {
          hapticLight();
          onPress();
        }}
        style={[
          pillStyles.pill,
          {
            backgroundColor: active ? color : `${color}14`,
            borderColor: active ? color : `${color}40`,
          },
        ]}
      >
        <Text
          style={[
            pillStyles.pillTxt,
            { color: active ? (theme.bg0 === '#FFFFFF' ? '#FFFFFF' : '#0A0E16') : color },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const pillStyles = StyleSheet.create({
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
  },
  pillTxt: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});

// ---------------------------------------------------------------------------
// Remedy card
// ---------------------------------------------------------------------------

function RemedyCardNew({ remedy, theme }: { remedy: HomeRemedy; theme: Theme }) {
  const [expanded, setExpanded] = useState(false);
  const scale = useSharedValue(1);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(expanded ? 1 : 0, { duration: 260 });
  }, [expanded, progress]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bodyStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const severityColor = remedy.severity === 'moderate' ? '#FFA94D' : '#2ED573';
  const severityLabel = remedy.severity === 'moderate' ? 'MODERATE' : 'MILD';
  const tgLabel = TARGET_LABEL[remedy.targetGroup];
  const tgColor = TARGET_COLOR[remedy.targetGroup];

  return (
    <Animated.View
      style={[
        cardStyle,
        cardStyles.card,
        { backgroundColor: theme.bg1, borderColor: theme.border },
      ]}
      entering={FadeInDown.duration(260).springify().damping(18).stiffness(200)}
    >
      {/* Left strip */}
      <View style={[cardStyles.strip, { backgroundColor: remedy.categoryColor }]} />

      <View style={cardStyles.inner}>
        <Pressable
          onPressIn={() => {
            scale.value = withSpring(0.98, { damping: 18, stiffness: 320 });
          }}
          onPressOut={() => {
            scale.value = withSpring(1, { damping: 14, stiffness: 220 });
          }}
          onPress={() => {
            hapticLight();
            setExpanded((e) => !e);
          }}
          style={cardStyles.pressable}
        >
          {/* Header row */}
          <View style={cardStyles.headerRow}>
            <Text style={cardStyles.icon}>{remedy.icon}</Text>
            <View style={cardStyles.headerText}>
              <Text style={[cardStyles.title, { color: theme.text1 }]} numberOfLines={2}>
                {remedy.title}
              </Text>
              <View style={cardStyles.metaRow}>
                <View style={[cardStyles.severityBadge, { backgroundColor: `${severityColor}22` }]}>
                  <Text style={[cardStyles.severityTxt, { color: severityColor }]}>
                    {severityLabel}
                  </Text>
                </View>
                {remedy.prepTime && (
                  <View style={cardStyles.prepRow}>
                    <ClockIcon color={theme.text3} />
                    <Text style={[cardStyles.prepTxt, { color: theme.text3 }]}>
                      {remedy.prepTime}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            {/* Target group tag */}
            <View style={[cardStyles.targetTag, { backgroundColor: `${tgColor}18`, borderColor: `${tgColor}50` }]}>
              <Text style={[cardStyles.targetTxt, { color: tgColor }]}>{tgLabel}</Text>
            </View>
          </View>

          {/* Natural ingredients chips */}
          {remedy.naturalIngredients.length > 0 && (
            <View style={cardStyles.ingRow}>
              {remedy.naturalIngredients.slice(0, 6).map((ing) => (
                <View
                  key={ing}
                  style={[cardStyles.ingChip, { backgroundColor: `${theme.gold}16`, borderColor: `${theme.gold}44` }]}
                >
                  <Text style={[cardStyles.ingTxt, { color: theme.gold }]}>{ing}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Collapsed preview */}
          {!expanded && remedy.remedy.length > 0 && (
            <Text style={[cardStyles.preview, { color: theme.text3 }]} numberOfLines={1}>
              {remedy.remedy[0]}
            </Text>
          )}

          {/* Expand/collapse affordance */}
          <View style={cardStyles.toggleRow}>
            <Text style={[cardStyles.toggleTxt, { color: remedy.categoryColor }]}>
              {expanded ? 'Show less' : `See all ${remedy.remedy.length} steps`}
            </Text>
            <ChevronIcon color={remedy.categoryColor} up={expanded} />
          </View>
        </Pressable>

        {/* Expanded body */}
        {expanded && (
          <Animated.View style={bodyStyle} entering={FadeIn.duration(220)} exiting={FadeOut.duration(180)}>
            <View style={cardStyles.stepsWrap}>
              {remedy.remedy.map((step, i) => (
                <View key={i} style={cardStyles.stepRow}>
                  <View style={[cardStyles.stepNum, { backgroundColor: theme.teal }]}>
                    <Text style={cardStyles.stepNumTxt}>{i + 1}</Text>
                  </View>
                  <Text style={[cardStyles.stepTxt, { color: theme.text2 }]}>{step}</Text>
                </View>
              ))}
            </View>
            {remedy.warning && (
              <View style={[cardStyles.warnBox, { backgroundColor: `${theme.amber}18`, borderColor: `${theme.amber}55` }]}>
                <AlertIcon color={theme.amber} />
                <Text style={[cardStyles.warnTxt, { color: theme.amber }]}>{remedy.warning}</Text>
              </View>
            )}
            <LegalDisclaimer
              text={LEGAL.SHORT_DISCLAIMER}
              variant="footer"
            />
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  strip: {
    width: 4,
  },
  inner: {
    flex: 1,
    padding: 14,
  },
  pressable: {
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    fontSize: 24,
  },
  headerText: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  severityTxt: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  prepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  prepTxt: {
    fontSize: 10,
    fontWeight: '600',
  },
  targetTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  targetTxt: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  ingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  ingChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  ingTxt: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  preview: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleTxt: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  stepsWrap: {
    marginTop: 10,
    gap: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumTxt: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  stepTxt: {
    flex: 1,
    fontSize: 12,
    lineHeight: 19,
    fontWeight: '500',
  },
  warnBox: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  warnTxt: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
});

// ---------------------------------------------------------------------------
// Main section
// ---------------------------------------------------------------------------

export function HomeRemedySection() {
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [targetId, setTargetId] = useState<HomeRemedy['targetGroup']>('all');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebounced(search), 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    return HOME_REMEDIES.filter((r) => {
      if (categoryId !== 'all' && r.category !== categoryId) return false;
      if (targetId !== 'all' && r.targetGroup !== targetId && r.targetGroup !== 'all') return false;
      if (!q) return true;
      if (r.title.toLowerCase().includes(q)) return true;
      if (r.category.toLowerCase().includes(q)) return true;
      if (r.naturalIngredients.some((i) => i.toLowerCase().includes(q))) return true;
      if (r.remedy.some((s) => s.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [debounced, categoryId, targetId]);

  return (
    <View style={sectionStyles.container}>
      {/* Emergency notice — always visible at top */}
      <EmergencyNotice compact />

      {/* Legal disclaimer — always visible at top */}
      <LegalDisclaimer
        text={LEGAL.HOME_REMEDIES_DISCLAIMER}
        variant="card"
      />

      {/* Search */}
      <View style={[sectionStyles.searchWrap, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
        <SearchIconSmall color={theme.text3} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search remedies, teas, symptoms..."
          placeholderTextColor={theme.text3}
          style={[sectionStyles.searchInput, { color: theme.text1 }]}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Text style={{ color: theme.text3, fontSize: 16, fontWeight: '800' }}>�-</Text>
          </Pressable>
        )}
      </View>

      {/* Category pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={sectionStyles.pillScroll}
      >
        {REMEDY_CATEGORIES.map((cat) => (
          <FilterPill
            key={cat.id}
            label={cat.label}
            color={cat.color}
            active={categoryId === cat.id}
            onPress={() => setCategoryId(cat.id)}
            theme={theme}
          />
        ))}
      </ScrollView>

      {/* Target group pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={sectionStyles.pillScroll}
      >
        {TARGET_GROUPS.map((tg) => (
          <FilterPill
            key={tg.id}
            label={tg.label}
            color={TARGET_COLOR[tg.id]}
            active={targetId === tg.id}
            onPress={() => setTargetId(tg.id)}
            theme={theme}
          />
        ))}
      </ScrollView>

      {/* Result count */}
      <Text style={[sectionStyles.count, { color: theme.text3 }]}>
        {filtered.length} remedy{filtered.length === 1 ? '' : 's'} found
      </Text>

      {/* Cards */}
      {filtered.length === 0 ? (
        <Text style={[sectionStyles.empty, { color: theme.text3 }]}>
          No remedies match your filters. Try clearing the search or category.
        </Text>
      ) : (
        filtered.map((r) => <RemedyCardNew key={r.id} remedy={r} theme={theme} />)
      )}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: {
    gap: 10,
    paddingTop: 8,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    padding: 0,
  },
  pillScroll: {
    paddingVertical: 2,
    paddingRight: 12,
  },
  count: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginTop: 2,
    marginBottom: 2,
  },
  empty: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 24,
  },
});

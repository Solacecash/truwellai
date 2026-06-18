import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/theme/ThemeContext';

// ── Types ──────────────────────────────────────────────────────────────────────

type Severity = 'critical' | 'high' | 'medium' | 'low';
type AlertType = 'recall' | 'warning' | 'ban' | 'regulation';

export interface RegulatoryAlert {
  id:                  string;
  title:               string;
  body:                string;
  agency:              string;
  agency_logo_color:   string;
  alert_type:          AlertType;
  severity:            Severity;
  affected_products:   string[];
  affected_ingredients:string[];
  countries:           string[];
  source_url?:         string;
  published_at:        string;
  is_active:           boolean;
}

interface Props {
  userAllergens?: string[];
  userCountry?:   string;
  onNewAlert?:    (alert: RegulatoryAlert) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const AGENCY_FILTERS = ['All', 'FDA', 'EU/ECA', 'WHO', 'NAFDAC', 'Other'] as const;

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: '#FF4C2E',
  high:     '#F59E0B',
  medium:   '#D4A017',
  low:      '#10B981',
};

const ALERT_TYPE_COLORS: Record<AlertType, string> = {
  recall:     '#FF4C2E',
  warning:    '#F59E0B',
  ban:        '#FF4C2E',
  regulation: '#3B82F6',
};

const AGENCY_COLORS: Record<string, string> = {
  FDA:          '#FF4C2E',
  ECA:          '#3B82F6',
  'EU Commission': '#3B82F6',
  WHO:          '#2563EB',
  NAFDAC:       '#10B981',
};

const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸', EU: '🇪🇺', UK: '🇬🇧', CA: '🇨🇦', NG: '🇳🇬',
  AU: '🇦🇺', IN: '🇮🇳', ZA: '🇿🇦', DE: '🇩🇪', FR: '🇫🇷',
};

function timeAgo(iso: string): string {
  const ms   = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)   return `${days} day${days !== 1 ? 's' : ''} ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function matchesFilter(alert: RegulatoryAlert, filter: string): boolean {
  if (filter === 'All') return true;
  if (filter === 'EU/ECA') return alert.agency === 'ECA' || alert.agency.includes('EU');
  return alert.agency.toUpperCase() === filter.toUpperCase();
}

function isRelevantToUser(alert: RegulatoryAlert, allergens: string[], country: string | undefined): boolean {
  if (!allergens.length && !country) return false;
  const lowerIngredients = alert.affected_ingredients.map((i) => i.toLowerCase());
  const lowerAllergens   = allergens.map((a) => a.toLowerCase());
  const ingredientMatch  = lowerAllergens.some((a) => lowerIngredients.some((i) => i.includes(a) || a.includes(i)));
  const countryMatch     = country ? alert.countries.includes(country.toUpperCase()) : false;
  return ingredientMatch || countryMatch;
}

// ── Pulsing live dot ───────────────────────────────────────────────────────────

function PulsingDot({ color }: { color: string }) {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(withSequence(withTiming(0.2, { duration: 700 }), withTiming(1, { duration: 700 })), -1, false);
  }, [opacity]);
  return (
    <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }, { opacity }]} />
  );
}

// ── Alert card ─────────────────────────────────────────────────────────────────

function AlertCard({
  alert,
  userAllergens,
  userCountry,
  theme,
}: {
  alert:         RegulatoryAlert;
  userAllergens: string[];
  userCountry?:  string;
  theme:         ReturnType<typeof useTheme>['theme'];
}) {
  const [expanded,   setExpanded]   = useState(false);
  const [relevance,  setRelevance]  = useState<string | null>(null);
  const relevant = isRelevantToUser(alert, userAllergens, userCountry);

  const checkRelevance = () => {
    if (relevant) {
      const matches: string[] = [];
      const lowerAllergens = userAllergens.map((a) => a.toLowerCase());
      alert.affected_ingredients.forEach((ing) => {
        if (lowerAllergens.some((a) => ing.toLowerCase().includes(a) || a.includes(ing.toLowerCase()))) {
          matches.push(ing);
        }
      });
      const msg = matches.length
        ? `This alert involves ${matches.join(', ')}, which match${matches.length === 1 ? 'es' : ''} your profile.`
        : `This alert affects ${userCountry}, which matches your location.`;
      setRelevance(msg);
    } else {
      setRelevance('This alert does not appear to directly affect your current profile or location.');
    }
  };

  const sevColor    = SEVERITY_COLORS[alert.severity] ?? theme.text3;
  const typeColor   = ALERT_TYPE_COLORS[alert.alert_type] ?? theme.text3;
  const agencyColor = AGENCY_COLORS[alert.agency] ?? theme.text3;

  return (
    <View style={[
      styles.card,
      { backgroundColor: theme.bg2, borderColor: relevant ? sevColor : theme.border },
      relevant && { borderWidth: 1.5 },
    ]}>
      {/* Severity bar */}
      <View style={[styles.sevBar, { backgroundColor: sevColor }]} />

      <View style={styles.cardInner}>
        {/* Top row: agency + type + relevance badge */}
        <View style={styles.badgeRow}>
          <View style={[styles.agencyBadge, { backgroundColor: `${agencyColor}18`, borderColor: `${agencyColor}40` }]}>
            <Text style={[styles.badgeText, { color: agencyColor }]}>{alert.agency}</Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: `${typeColor}18`, borderColor: `${typeColor}40` }]}>
            <Text style={[styles.badgeText, { color: typeColor }]}>{alert.alert_type.toUpperCase()}</Text>
          </View>
          {relevant && (
            <View style={[styles.relevanceBadge, { backgroundColor: `${sevColor}18`, borderColor: `${sevColor}40` }]}>
              <Text style={[styles.badgeText, { color: sevColor }]}>Affects your profile</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={[styles.cardTitle, { color: theme.text1 }]}>{alert.title}</Text>

        {/* Body */}
        <Text
          style={[styles.cardBody, { color: theme.text3 }]}
          numberOfLines={expanded ? undefined : 2}
        >
          {alert.body}
        </Text>
        <TouchableOpacity onPress={() => setExpanded((v) => !v)}>
          <Text style={[styles.readMore, { color: theme.teal }]}>{expanded ? 'Show less' : 'Read more'}</Text>
        </TouchableOpacity>

        {/* Affected products */}
        {alert.affected_products.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productsRow}>
            {alert.affected_products.map((p) => (
              <View key={p} style={[styles.productChip, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
                <Text style={[styles.productChipText, { color: theme.text3 }]}>{p}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Countries + time */}
        <View style={styles.footerRow}>
          <Text style={[styles.countriesText, { color: theme.text3 }]}>
            {alert.countries.map((c) => `${COUNTRY_FLAGS[c] ?? ''}${c}`).join('  ')}
          </Text>
          <Text style={[styles.timeAgo, { color: theme.text4 }]}>{timeAgo(alert.published_at)}</Text>
        </View>

        {/* Relevance check */}
        {relevance !== null ? (
          <View style={[styles.relevanceBox, { backgroundColor: relevant ? `${sevColor}10` : `${theme.teal}10`, borderColor: relevant ? `${sevColor}30` : `${theme.teal}30` }]}>
            <Text style={[styles.relevanceText, { color: relevant ? sevColor : theme.teal }]}>{relevance}</Text>
          </View>
        ) : (
          <TouchableOpacity onPress={checkRelevance} style={[styles.relevanceBtn, { borderColor: `${theme.teal}50` }]}>
            <Text style={[styles.relevanceBtnText, { color: theme.teal }]}>Does this affect my profile?</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function GlobalWatchlist({ userAllergens = [], userCountry, onNewAlert }: Props) {
  const { theme }      = useTheme();
  const [filter,       setFilter]   = useState<string>('All');
  const [showAll,      setShowAll]  = useState(false);
  const lastAlertIds   = useRef<Set<string>>(new Set());

  const { data: alerts, isLoading, refetch } = useQuery({
    queryKey: ['regulatory-alerts'],
    staleTime: 5 * 60 * 1000,
    queryFn:  async () => {
      const { data, error } = await supabase
        .from('regulatory_alerts')
        .select('*')
        .eq('is_active', true)
        .order('published_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as RegulatoryAlert[];
    },
  });

  // Detect new alerts for realtime callback
  useEffect(() => {
    if (!alerts || !onNewAlert) return;
    alerts.forEach((a) => {
      if (!lastAlertIds.current.has(a.id)) {
        if (lastAlertIds.current.size > 0) onNewAlert(a);
        lastAlertIds.current.add(a.id);
      }
    });
  }, [alerts, onNewAlert]);

  const filtered = (alerts ?? []).filter((a) => matchesFilter(a, filter));
  const displayed = showAll ? filtered : filtered.slice(0, 3);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: theme.text1 }]}>Global Safety Watchlist</Text>
          <View style={styles.liveRow}>
            <PulsingDot color={theme.red} />
            <Text style={[styles.liveText, { color: theme.red }]}>LIVE</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setShowAll((v) => !v)}>
          <Text style={[styles.seeAll, { color: theme.teal }]}>{showAll ? 'Show less' : 'See all'}</Text>
        </TouchableOpacity>
      </View>

      {/* Agency filter pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {AGENCY_FILTERS.map((f) => {
          const active = filter === f;
          return (
            <Pressable key={f} onPress={() => setFilter(f)}
              style={[styles.filterPill, { backgroundColor: active ? `${theme.teal}18` : theme.bg2, borderColor: active ? theme.teal : theme.border }]}
            >
              <Text style={[styles.filterPillText, { color: active ? theme.teal : theme.text3 }]}>{f}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Content */}
      {isLoading ? (
        <ActivityIndicator color={theme.teal} style={{ marginVertical: 24 }} />
      ) : displayed.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.text4 }]}>No alerts for selected agency.</Text>
      ) : (
        <View style={styles.cardList}>
          {displayed.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              userAllergens={userAllergens}
              userCountry={userCountry}
              theme={theme}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ── Compact banner for Home screen ─────────────────────────────────────────────

export function CriticalAlertBanner({
  onPress,
}: {
  onPress: () => void;
}) {
  const { theme } = useTheme();

  const { data: topAlert } = useQuery({
    queryKey: ['regulatory-alerts-top'],
    staleTime: 10 * 60 * 1000,
    queryFn:  async () => {
      const { data } = await supabase
        .from('regulatory_alerts')
        .select('id,title,body,agency,severity,alert_type,published_at')
        .eq('is_active', true)
        .in('severity', ['critical', 'high'])
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as Pick<RegulatoryAlert, 'id'|'title'|'body'|'agency'|'severity'|'alert_type'|'published_at'> | null;
    },
  });

  if (!topAlert) return null;

  const sevColor = SEVERITY_COLORS[topAlert.severity] ?? '#FF4C2E';
  const agColor  = AGENCY_COLORS[topAlert.agency]    ?? sevColor;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}
      style={[bannerStyles.card, { backgroundColor: `${sevColor}0D`, borderColor: `${sevColor}30` }]}
    >
      <View style={[bannerStyles.leftBar, { backgroundColor: sevColor }]} />
      <View style={bannerStyles.content}>
        <View style={bannerStyles.topRow}>
          <View style={[bannerStyles.agencyBadge, { backgroundColor: `${agColor}18`, borderColor: `${agColor}40` }]}>
            <Text style={[bannerStyles.agencyText, { color: agColor }]}>{topAlert.agency}</Text>
          </View>
          <Text style={[bannerStyles.time, { color: theme.text4 }]}>{timeAgo(topAlert.published_at)}</Text>
        </View>
        <Text style={[bannerStyles.title, { color: theme.text1 }]} numberOfLines={1}>{topAlert.title}</Text>
        <Text style={[bannerStyles.body,  { color: theme.text3 }]} numberOfLines={1}>{topAlert.body}</Text>
        <Text style={[bannerStyles.cta,   { color: theme.teal }]}>View all alerts →</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:     { marginBottom: 8 },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerLeft:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle:   { fontSize: 15, fontWeight: '800' },
  liveRow:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveText:      { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  seeAll:        { fontSize: 13, fontWeight: '700' },

  filterScroll:   { marginBottom: 12 },
  filterContent:  { gap: 8, paddingRight: 8 },
  filterPill:     { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, borderWidth: 1 },
  filterPillText: { fontSize: 12, fontWeight: '600' },

  emptyText:  { textAlign: 'center', fontSize: 13, marginVertical: 20 },
  cardList:   { gap: 12 },

  card:       { borderRadius: 16, borderWidth: 1, flexDirection: 'row', overflow: 'hidden' },
  sevBar:     { width: 4 },
  cardInner:  { flex: 1, padding: 12 },
  badgeRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  agencyBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50, borderWidth: 1 },
  typeBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50, borderWidth: 1 },
  relevanceBadge:{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50, borderWidth: 1 },
  badgeText:     { fontSize: 10, fontWeight: '700' },

  cardTitle:     { fontSize: 13, fontWeight: '700', marginBottom: 6, lineHeight: 18 },
  cardBody:      { fontSize: 11.5, lineHeight: 17, marginBottom: 4 },
  readMore:      { fontSize: 11, fontWeight: '700', marginBottom: 8 },

  productsRow:   { marginBottom: 8 },
  productChip:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50, borderWidth: 1, marginRight: 6 },
  productChipText:{ fontSize: 10, fontWeight: '500' },

  footerRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  countriesText: { fontSize: 10, lineHeight: 16 },
  timeAgo:       { fontSize: 10 },

  relevanceBox:  { borderRadius: 10, borderWidth: 1, padding: 10 },
  relevanceText: { fontSize: 12, lineHeight: 17, fontWeight: '600' },
  relevanceBtn:  { borderRadius: 10, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 12, alignSelf: 'flex-start' },
  relevanceBtnText: { fontSize: 12, fontWeight: '700' },
});

const bannerStyles = StyleSheet.create({
  card:        { flexDirection: 'row', borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 8 },
  leftBar:     { width: 4 },
  content:     { flex: 1, padding: 12 },
  topRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  agencyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50, borderWidth: 1 },
  agencyText:  { fontSize: 10, fontWeight: '700' },
  time:        { fontSize: 10 },
  title:       { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  body:        { fontSize: 11, marginBottom: 6 },
  cta:         { fontSize: 12, fontWeight: '700' },
});

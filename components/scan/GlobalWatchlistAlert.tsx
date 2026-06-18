import {
  JURISDICTION_LABELS,
  type WatchlistEntry,
  type WatchlistResult,
} from '@/lib/globalWatchlist';
import LegalDisclaimer from '@/components/legal/LegalDisclaimer';
import WatchlistDisputeButton from '@/components/legal/WatchlistDisputeButton';
import { LEGAL } from '@/lib/legalContent';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme/ThemeContext';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  watchlist: WatchlistResult;
  userJurisdiction?: string;
  style?: object;
}

const FILTERS = ['All', 'EU', 'USA', 'UK', 'NAFDAC', 'WHO'] as const;

function regulatoryLabel(status: WatchlistEntry['status'], jurisdiction: string): string {
  if (status === 'banned') {
    if (jurisdiction === 'EU') return 'Restricted under EU Cosmetics Regulation 1223/2009';
    if (jurisdiction === 'USA') return 'Not approved for use by the US FDA';
    if (jurisdiction === 'UK') return 'Restricted under UK Cosmetics Regulation';
    if (jurisdiction === 'NAFDAC') return 'Restricted by NAFDAC';
    if (jurisdiction === 'WHO') return 'Listed in WHO restricted substances';
    return `Restricted under ${jurisdiction} regulations`;
  }
  if (status === 'recalled') return 'Subject to regulatory recall action (see source)';
  if (status === 'restricted') return `Restricted under ${jurisdiction} regulations`;
  return `Under regulatory notice — ${jurisdiction}`;
}

export function GlobalWatchlistAlert({ watchlist, userJurisdiction, style }: Props) {
  const { theme } = useTheme();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id ?? '';
  const [filter, setFilter] = useState<string>(
    userJurisdiction && (FILTERS as readonly string[]).includes(userJurisdiction)
      ? userJurisdiction
      : 'All'
  );
  const [expanded, setExpanded] = useState(false);

  const filteredAlerts = useMemo<WatchlistEntry[]>(() => {
    if (filter === 'All') return watchlist.alerts;
    return watchlist.alerts.filter(
      (a) => a.jurisdiction === filter || a.jurisdiction === 'Global'
    );
  }, [watchlist.alerts, filter]);

  if (!watchlist.hasAlerts) {
    return (
      <View style={[styles.clearWrap, style]}>
        <View style={[styles.clearPill, { backgroundColor: `${theme.teal}16`, borderColor: `${theme.teal}40` }]}>
          <Text style={[styles.clearTxt, { color: theme.teal }]}>✓ Global watchlist clear</Text>
        </View>
      </View>
    );
  }

  const critical = watchlist.riskLevel === 'critical';
  const palette = critical
    ? { bg: 'rgba(255,71,87,0.12)', fg: theme.red, border: 'rgba(255,71,87,0.55)', label: 'GLOBAL ALERT' }
    : { bg: `${theme.amber}1a`, fg: theme.amber, border: `${theme.amber}70`, label: 'REGULATORY WARNING' };

  const title = critical
    ? 'This product contains ingredients with regulatory restrictions'
    : 'This product matches regulatory watchlist entries';

  const uniqueJurisdictions = Array.from(new Set(watchlist.alerts.map((a) => a.jurisdiction)));
  const restrictedIngredients = Array.from(
    new Set(
      filteredAlerts
        .filter((a) => (a.status === 'banned' || a.status === 'restricted') && a.ingredient)
        .map((a) => a.ingredient as string)
    )
  );

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: palette.bg, borderColor: palette.border },
        style,
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.warningIcon, { color: palette.fg }]}>⚠️</Text>
        <Text style={[styles.label, { color: palette.fg }]}>{palette.label}</Text>
      </View>

      <Text style={[styles.title, { color: palette.fg }]}>{title}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f) => {
          const selected = filter === f;
          return (
            <TouchableOpacity
              key={f}
              activeOpacity={0.85}
              onPress={() => setFilter(f)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selected ? palette.fg : 'transparent',
                  borderColor: selected ? palette.fg : `${palette.fg}60`,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterChipTxt,
                  { color: selected ? theme.bg0 : palette.fg },
                ]}
              >
                {(JURISDICTION_LABELS[f]?.flag ?? '') + ' ' + f}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {uniqueJurisdictions.length > 0 && (
        <View style={styles.jurisdictionRow}>
          <Text style={[styles.jurisdictionLbl, { color: theme.text3 }]}>Flagged in:</Text>
          <Text style={[styles.jurisdictionList, { color: theme.text2 }]} numberOfLines={2}>
            {uniqueJurisdictions
              .map((j) => `${JURISDICTION_LABELS[j]?.flag ?? ''} ${j}`)
              .join('   ')}
          </Text>
        </View>
      )}

      {restrictedIngredients.length > 0 && (
        <View style={styles.chipRow}>
          {restrictedIngredients.map((ing) => (
            <View key={ing} style={[styles.bannedChip, { backgroundColor: `${theme.red}22`, borderColor: `${theme.red}66` }]}>
              <Text style={[styles.bannedChipTxt, { color: theme.red }]}>{ing}</Text>
            </View>
          ))}
        </View>
      )}

      {filteredAlerts.slice(0, expanded ? filteredAlerts.length : 3).map((a, i) => (
        <View key={`${a.id ?? a.ingredient}-${i}`} style={styles.alertLine}>
          <Text style={[styles.alertIngredient, { color: theme.text1 }]} numberOfLines={1}>
            {a.ingredient || a.productName || 'Regulated item'}
          </Text>
          <Text style={[styles.alertReason, { color: theme.text2 }]}>
            {regulatoryLabel(a.status, a.jurisdiction)}
          </Text>
          {a.source && (
            <Text style={[styles.alertSource, { color: theme.text3 }]}>
              {LEGAL.WATCHLIST_CITATION_PREFIX} {a.source}
            </Text>
          )}
          {userId && (a.ingredient || a.productName) && (
            <WatchlistDisputeButton
              ingredientName={a.ingredient || a.productName || 'Unknown'}
              jurisdiction={a.jurisdiction}
              userId={userId}
            />
          )}
        </View>
      ))}

      {filteredAlerts.length > 3 && (
        <TouchableOpacity onPress={() => setExpanded((e) => !e)}>
          <Text style={[styles.expandTxt, { color: palette.fg }]}>
            {expanded ? 'Show less' : `View full report (${filteredAlerts.length})`}
          </Text>
        </TouchableOpacity>
      )}

      {filteredAlerts.length === 0 && (
        <Text style={[styles.emptyTxt, { color: theme.text3 }]}>
          No alerts for {filter} in this product.
        </Text>
      )}

      <LegalDisclaimer
        text={LEGAL.WATCHLIST_DISCLAIMER}
        variant="inline"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
    gap: 10,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  warningIcon: { fontSize: 24 },
  label: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  title: { fontSize: 15, fontWeight: '900', letterSpacing: -0.2 },

  filterRow: { gap: 6, paddingRight: 12 },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  filterChipTxt: { fontSize: 10, fontWeight: '800' },

  jurisdictionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  jurisdictionLbl: { fontSize: 10, fontWeight: '700' },
  jurisdictionList: { flex: 1, fontSize: 12, fontWeight: '700' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  bannedChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  bannedChipTxt: { fontSize: 11, fontWeight: '800' },

  alertLine: { gap: 2, paddingTop: 6 },
  alertIngredient: { fontSize: 13, fontWeight: '800' },
  alertReason: { fontSize: 12, lineHeight: 17 },
  alertSource: { fontSize: 10, fontStyle: 'italic' },

  expandTxt: { fontSize: 11, fontWeight: '800', marginTop: 2 },
  emptyTxt: { fontSize: 12, fontStyle: 'italic' },

  clearWrap: { alignItems: 'flex-start' },
  clearPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14, borderWidth: 1 },
  clearTxt: { fontSize: 10, fontWeight: '800' },
});

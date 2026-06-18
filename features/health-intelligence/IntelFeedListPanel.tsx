import { useTheme } from '@/theme/ThemeContext';
import React from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';

import type { IntelligenceFeedItem } from '@/lib/intelligence/types';
import LegalDisclaimer from '@/components/legal/LegalDisclaimer';
import { LEGAL } from '@/lib/legalContent';
import type { IntelTierVisibility } from '@/stores/intelFeedPrefsStore';

interface Props {
  items: IntelligenceFeedItem[];
  onClose: () => void;
  tierPrefs: IntelTierVisibility;
  onChangeTierPrefs: (patch: Partial<IntelTierVisibility>) => void;
}

function tierLabel(tier: number): string {
  if (tier === 1) return 'Tier 1 · Primary literature or government index';
  if (tier === 2) return 'Tier 2 · Guideline bodies';
  return 'Tier 3 · Community signal';
}

export function IntelFeedListPanel({ items, onClose, tierPrefs, onChangeTierPrefs }: Props) {
  const { theme } = useTheme();
  const renderItem = ({ item }: { item: IntelligenceFeedItem }) => (
    <View
      style={[
        styles.card,
        {
          borderColor: item.communitySignal ? theme.amber : theme.border,
          backgroundColor: theme.bg1,
        },
      ]}
    >
      <Text style={[styles.meta, { color: theme.text3 }]}>{tierLabel(item.tier)}</Text>
      <Text style={[styles.cardTitle, { color: theme.text1 }]}>{item.title}</Text>
      <Text style={[styles.summary, { color: theme.text2 }]}>{item.summary}</Text>
      <Text style={[styles.caveat, { color: theme.amber }]}>{item.caveat}</Text>
      <Text style={[styles.fresh, { color: theme.text3 }]}>
        Source: {item.sourceOrg} · {item.sourceType} · {item.freshness}
      </Text>
      <TouchableOpacity
        onPress={() => {
          void Linking.openURL(item.url);
        }}
      >
        <Text style={{ color: theme.teal, fontWeight: '800', marginTop: 6 }}>Open source</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.sheet, { backgroundColor: theme.bg0 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.heading, { color: theme.text1 }]}>Health intelligence</Text>
        <TouchableOpacity onPress={onClose} hitSlop={12}>
          <Text style={{ color: theme.teal, fontWeight: '900' }}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.toggles, { borderColor: theme.border, backgroundColor: theme.bg1 }]}>
        <Text style={[styles.togglesTitle, { color: theme.text2 }]}>Evidence tiers shown</Text>
        <View style={styles.switchRow}>
          <Text style={{ color: theme.text1, flex: 1 }}>Tier 1</Text>
          <Switch
            value={tierPrefs.tier1GovernmentAndPrimaryLiterature}
            onValueChange={(v) => onChangeTierPrefs({ tier1GovernmentAndPrimaryLiterature: v })}
            trackColor={{ false: theme.border, true: theme.teal }}
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={{ color: theme.text1, flex: 1 }}>Tier 2</Text>
          <Switch
            value={tierPrefs.tier2GuidelinesBodies}
            onValueChange={(v) => onChangeTierPrefs({ tier2GuidelinesBodies: v })}
            trackColor={{ false: theme.border, true: theme.teal }}
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={{ color: theme.text1, flex: 1 }}>Tier 3</Text>
          <Switch
            value={tierPrefs.tier3CommunitySignals}
            onValueChange={(v) => onChangeTierPrefs({ tier3CommunitySignals: v })}
            trackColor={{ false: theme.border, true: theme.teal }}
          />
        </View>
      </View>

      <LegalDisclaimer text={LEGAL.HEALTH_INTELLIGENCE_TIER_NOTICE} variant="card" />

      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={5}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  heading: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    marginBottom: 12,
  },
  meta: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  summary: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  caveat: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
  },
  fresh: {
    fontSize: 11,
    fontWeight: '800',
  },
  toggles: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    marginBottom: 12,
  },
  togglesTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

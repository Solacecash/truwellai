import { TruWellErrorBoundary, RootErrorBoundary } from '@/components/TruWellErrorBoundary';
import { FeedCard, FeedPost } from '@/components/ui/FeedCard';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { ReviewCard, ProductReview } from '@/components/ui/ReviewCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { GlobalWatchlist, RegulatoryAlert } from '@/components/safecircle/GlobalWatchlist';

export { TruWellErrorBoundary as ErrorBoundary };
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useTheme } from '@/theme/ThemeContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AnimatedRe, {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earned: boolean;
}

interface WatchlistItem {
  id: string;
  ingredient_name: string;
  risk_level: 'high' | 'medium' | 'low';
  reason: string;
}

interface PersonalWatchlistEntry {
  ingredient:    string;
  source:        'onboarding' | 'scan_history' | 'global_watchlist';
  risk_level:    'high' | 'medium' | 'low';
  reason:        string;
  jurisdiction?: string;
  status?:       string;
  found_in_scans: string[];   // product names where this ingredient appeared
  intel_events:   HealthIntelEvent[];  // matching active intel events
}

interface HealthIntelEvent {
  id: string;
  source: string;
  trust_score: number;
  event_type:
    | 'recall'
    | 'ban'
    | 'approval'
    | 'trial_update'
    | 'adverse_event'
    | 'lawsuit'
    | 'journal_finding'
    | 'breakthrough'
    | 'safety_alert'
    | 'outbreak'
    | 'regulation';
  product_name: string | null;
  ingredients: string[];
  countries: string[];
  severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  headline: string;
  summary: string | null;
  consumer_summary?: string | null;
  risk_note?: string | null;
  source_url: string | null;
  published_at: string;
  is_active: boolean;
}

interface RecallMatch {
  event: HealthIntelEvent;
  matched_scan: { product_name: string; created_at: string };
  match_type: 'product' | 'ingredient';
}

interface UserHealthAlert {
  id: string;
  event_id: string;
  alert_type: string;
  read: boolean;
  sent_at: string;
  health_intel_events: HealthIntelEvent;
}

interface ShelfItem {
  id: string;
  product_name: string;
  grade: string | null;
  score: number | null;
  created_at: string;
  status: 'safe' | 'monitoring' | 'alert' | 'recalled';
  matched_event: HealthIntelEvent | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const RISK_COLOR: Record<WatchlistItem['risk_level'], string> = {
  high: 'red',
  medium: 'gold',
  low: 'teal',
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days < 7 ? `${days}d ago` : `${Math.floor(days / 7)}w ago`;
}

function PulsingDot({ color }: { color: string }) {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.2, { duration: 700 }), withTiming(1, { duration: 700 })),
      -1,
      false
    );
  }, [opacity]);
  return (
    <AnimatedRe.View
      style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }, { opacity }]}
    />
  );
}

function SkeletonRows({ rows }: { rows: number }) {
  return (
    <View style={styles.skeletonWrap}>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonLoader key={i} width="100%" height={48} borderRadius={6} style={styles.skRow} />
      ))}
    </View>
  );
}

function severityColor(severity: string, theme: ReturnType<typeof useTheme>['theme']): string {
  switch (severity) {
    case 'critical':
      return '#FF4C2E';
    case 'high':
      return theme.gold;
    case 'medium':
      return '#3B82F6';
    case 'low':
      return theme.teal;
    default:
      return theme.text3;
  }
}

function TrustBadge({ score, theme }: { score: number; theme: ReturnType<typeof useTheme>['theme'] }) {
  const color = score >= 95 ? theme.teal : score >= 80 ? theme.gold : theme.text3;
  return (
    <View style={[scStyles.trustBadge, { backgroundColor: `${color}18`, borderColor: `${color}35` }]}>
      <Text style={[scStyles.trustText, { color }]}>Trust {score}</Text>
    </View>
  );
}

function IntelEventCard({
  event,
  userAllergens,
  theme,
}: {
  event: HealthIntelEvent;
  userAllergens: string[];
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const uid = useAuthStore((s) => s.session?.user?.id);
  const [helpfulCount, setHelpfulCount] = useState<number>(
    (event as { helpful_count?: number }).helpful_count ?? 0
  );
  const [helpfulLoading, setHelpfulLoading] = useState(false);
  const [markedHelpful, setMarkedHelpful] = useState(false);
  const [helpfulChecked, setHelpfulChecked] = useState(false);

  useEffect(() => {
    if (!uid || !event.id || helpfulChecked) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('intel_helpful_votes')
        .select('id')
        .eq('event_id', event.id)
        .eq('user_id', uid)
        .maybeSingle();
      if (!cancelled && data) setMarkedHelpful(true);
      if (!cancelled) setHelpfulChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, event.id, helpfulChecked]);

  const handleHelpful = async () => {
    if (markedHelpful || helpfulLoading || !uid) return;
    setHelpfulLoading(true);
    try {
      setMarkedHelpful(true);
      setHelpfulCount((c) => c + 1);
      const { error } = await supabase.rpc('increment_intel_helpful', {
        p_event_id: event.id,
        p_user_id: uid,
      });
      // A unique constraint violation means the user already
      // voted, which is not a real failure, so we keep the
      // optimistic state as-is rather than reverting it.
      if (error && error.code !== '23505') {
        throw error;
      }
    } catch {
      setMarkedHelpful(false);
      setHelpfulCount((c) => Math.max(0, c - 1));
    } finally {
      setHelpfulLoading(false);
    }
  };

  const fmtCount = (n: number): string => {
    if (n >= 1_000_000)
      return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M';
    if (n >= 1_000) return Math.round(n / 1_000) + 'k';
    return n.toString();
  };

  const sevColor = severityColor(event.severity, theme);

  const userIngredients = userAllergens.map((a) => a.toLowerCase());
  const eventIngs = (event.ingredients ?? []).map((i: string) => i.toLowerCase());
  const affectsProfile =
    userIngredients.length > 0 &&
    eventIngs.some((ei) => userIngredients.some((ui) => ei.includes(ui) || ui.includes(ei)));

  const isBreakthrough = event.event_type === 'breakthrough' || event.event_type === 'approval';
  const isLawsuit = event.event_type === 'lawsuit';
  const cardBg = isLawsuit
    ? `${theme.gold}06`
    : isBreakthrough
    ? `${theme.teal}06`
    : affectsProfile
    ? `${sevColor}10`
    : theme.bg2;
  const borderColor = isLawsuit
    ? `${theme.gold}30`
    : affectsProfile
    ? sevColor
    : isBreakthrough
    ? `${theme.teal}30`
    : theme.border;
  const borderWidth = isLawsuit ? 1 : affectsProfile ? 1.5 : 0.5;

  return (
    <View
      style={[
        scStyles.intelCard,
        { backgroundColor: cardBg, borderColor, borderWidth },
      ]}
    >
      <View style={[scStyles.sevBar, { backgroundColor: sevColor }]} />
      <View style={scStyles.intelInner}>
        <View style={scStyles.badgeRow}>
          <View
            style={[
              scStyles.sourceBadge,
              { backgroundColor: `${sevColor}15`, borderColor: `${sevColor}35` },
            ]}
          >
            <Text style={[scStyles.sourceBadgeText, { color: sevColor }]}>{event.source}</Text>
          </View>
          <View style={[scStyles.typeBadge, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
            <Text style={[scStyles.typeBadgeText, { color: theme.text3 }]}>
              {event.event_type.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          <TrustBadge score={event.trust_score} theme={theme} />
          {affectsProfile ? (
            <View
              style={[
                scStyles.affectsBadge,
                { backgroundColor: `${sevColor}15`, borderColor: `${sevColor}35` },
              ]}
            >
              <Text style={[scStyles.affectsText, { color: sevColor }]}>Affects your profile</Text>
            </View>
          ) : null}
          {isLawsuit ? (
            <View style={[scStyles.affectsBadge, {
              backgroundColor: `${theme.gold}15`,
              borderColor: `${theme.gold}35`,
            }]}>
              <Text style={[scStyles.affectsText, { color: theme.gold }]}>
                {'\u2696\uFE0F Legal Alert'}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={[scStyles.intelTitle, { color: theme.text1 }]}>{event.headline}</Text>

        {(event.consumer_summary ?? event.summary) ? (
          <Text
            style={[scStyles.intelBody, { color: theme.text3 }]}
            numberOfLines={expanded ? undefined : 2}
          >
            {event.consumer_summary ?? event.summary}
          </Text>
        ) : null}

        {isLawsuit ? (
          <View style={[scStyles.legalDisclaimer, {
            backgroundColor: `${theme.gold}08`,
            borderColor: `${theme.gold}25`,
          }]}>
            <Text style={[scStyles.legalDisclaimerText, { color: theme.gold }]}>
              {'\u26A0\uFE0F Allegation only — no court finding has been issued. '
              + 'This product is subject to active litigation. '
              + 'These claims remain unproven unless established in court.'}
            </Text>
          </View>
        ) : null}

        {event.risk_note && expanded && !isLawsuit ? (
          <View style={[scStyles.riskNoteBox, {
            backgroundColor: `${theme.teal}08`,
            borderColor: `${theme.teal}25`,
          }]}>
            <Text style={[scStyles.riskNoteText, { color: theme.teal }]}>
              {'\uD83D\uDC64 '}{event.risk_note}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity onPress={() => setExpanded((v) => !v)}>
          <Text style={[scStyles.readMore, { color: theme.teal }]}>
            {expanded ? 'Show less' : 'Read more'}
          </Text>
        </TouchableOpacity>

        {event.ingredients.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
            {event.ingredients.map((ing) => (
              <View
                key={ing}
                style={[scStyles.ingChip, { backgroundColor: theme.bg3, borderColor: theme.border }]}
              >
                <Text style={[scStyles.ingChipText, { color: theme.text3 }]}>{ing}</Text>
              </View>
            ))}
          </ScrollView>
        ) : null}

        <View style={scStyles.intelFooter}>
          <Text style={[scStyles.countriesText, { color: theme.text4 }]}>
            {(event.countries ?? []).slice(0, 4).join('  ')}
          </Text>
          <Text style={[scStyles.timeText, { color: theme.text4 }]}>{timeAgo(event.published_at)}</Text>
        </View>

        <View style={scStyles.actionRow}>
          <TouchableOpacity
            style={[scStyles.askBtn, {
              backgroundColor: `${theme.teal}15`,
              borderColor: `${theme.teal}35`,
            }]}
            onPress={() =>
              router.push({
                pathname: '/assistant',
                params: {
                  productName: event.headline.slice(0, 60),
                },
              } as never)
            }
          >
            <Text style={[scStyles.askBtnText, { color: theme.teal }]}>
              Ask Sofia →
            </Text>
          </TouchableOpacity>

          {event.source_url ? (
            <TouchableOpacity
              style={[scStyles.sourceBtn, {
                backgroundColor: theme.bg3,
                borderColor: theme.border,
              }]}
              onPress={() => void Linking.openURL(event.source_url!)}
            >
              <Text style={[scStyles.sourceBtnText, { color: theme.text3 }]}>
                Source →
              </Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={() => void handleHelpful()}
            disabled={markedHelpful || helpfulLoading}
            style={[
              scStyles.helpfulBtn,
              markedHelpful
                ? {
                    backgroundColor: `${theme.teal}15`,
                    borderColor: `${theme.teal}40`,
                  }
                : {
                    backgroundColor: theme.bg3,
                    borderColor: theme.border,
                  },
            ]}
            accessibilityLabel="Mark as helpful"
          >
            <Text
              style={[
                scStyles.helpfulBtnText,
                { color: markedHelpful ? theme.teal : theme.text3 },
              ]}
            >
              {markedHelpful
                ? `👍 ${fmtCount(helpfulCount)} found this helpful`
                : `👍 Helpful${helpfulCount > 0
                    ? `  ${fmtCount(helpfulCount)}`
                    : ''}`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function RecallMatchCard({
  match,
  theme,
}: {
  match: RecallMatch;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  const router = useRouter();
  return (
    <View style={[scStyles.recallCard, { backgroundColor: `${theme.red}08`, borderColor: `${theme.red}30` }]}>
      <View style={scStyles.recallHeader}>
        <Text style={scStyles.recallIcon}>⚠️</Text>
        <Text style={[scStyles.recallTitle, { color: theme.red }]}>
          {match.match_type === 'product'
            ? 'Recalled product in your scan history'
            : 'Recalled ingredient in your scan history'}
        </Text>
      </View>
      <Text style={[scStyles.recallSub, { color: theme.text3 }]}>{match.event.headline}</Text>
      <View
        style={[
          scStyles.matchedProduct,
          { backgroundColor: `${theme.red}05`, borderColor: `${theme.red}20` },
        ]}
      >
        <Text style={[scStyles.matchedName, { color: theme.text1 }]}>
          {match.matched_scan.product_name}
        </Text>
        <Text style={[scStyles.matchedDate, { color: theme.text4 }]}>
          Scanned {timeAgo(match.matched_scan.created_at)}
        </Text>
      </View>
      <TouchableOpacity
        style={[scStyles.recallCta, { backgroundColor: theme.red }]}
        onPress={() =>
          router.push({
            pathname: '/assistant',
            params: { productName: match.matched_scan.product_name },
          } as never)
        }
      >
        <Text style={scStyles.recallCtaText}>View recall details and get alternatives →</Text>
      </TouchableOpacity>
    </View>
  );
}

function MyShelfCard({
  item,
  theme,
}: {
  item: ShelfItem;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const statusConfig = {
    safe:       { color: '#2ED573', label: 'SAFE',       emoji: '\u2705' },
    monitoring: { color: theme.gold, label: 'MONITOR',   emoji: '\uD83D\uDC41' },
    alert:      { color: '#F5A623', label: 'ALERT',      emoji: '\u26A0\uFE0F' },
    recalled:   { color: '#FF4C2E', label: 'RECALLED',   emoji: '\uD83D\uDEA8' },
  };

  const cfg = statusConfig[item.status];

  return (
    <View style={[
      shelfStyles.card,
      {
        backgroundColor: item.status === 'safe' ? theme.bg2 : `${cfg.color}08`,
        borderColor: item.status === 'safe' ? theme.border : `${cfg.color}35`,
        borderWidth: item.status === 'safe' ? StyleSheet.hairlineWidth : 1.5,
      },
    ]}>
      <View style={[shelfStyles.bar, { backgroundColor: cfg.color }]} />

      <View style={shelfStyles.inner}>
        <View style={shelfStyles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={[shelfStyles.name, { color: theme.text1 }]} numberOfLines={1}>
              {item.product_name}
            </Text>
            <Text style={[shelfStyles.date, { color: theme.text4 }]}>
              Scanned {timeAgo(item.created_at)}
            </Text>
          </View>

          <View style={[
            shelfStyles.statusBadge,
            { backgroundColor: `${cfg.color}18`, borderColor: `${cfg.color}40` },
          ]}>
            <Text style={{ fontSize: 10 }}>{cfg.emoji}</Text>
            <Text style={[shelfStyles.statusLabel, { color: cfg.color }]}>
              {cfg.label}
            </Text>
          </View>

          {item.grade ? (
            <View style={[
              shelfStyles.gradePill,
              { backgroundColor: theme.bg3, borderColor: theme.border },
            ]}>
              <Text style={[shelfStyles.gradeText, { color: theme.gold }]}>
                {item.grade}
              </Text>
            </View>
          ) : null}
        </View>

        {item.matched_event ? (
          <View>
            <TouchableOpacity
              onPress={() => setExpanded((v) => !v)}
              style={[shelfStyles.alertRow, {
                backgroundColor: `${cfg.color}08`,
                borderColor: `${cfg.color}25`,
              }]}
            >
              <Text style={[shelfStyles.alertText, { color: cfg.color }]} numberOfLines={expanded ? undefined : 2}>
                {item.matched_event.headline}
              </Text>
            </TouchableOpacity>

            {expanded ? (
              <TouchableOpacity
                style={[shelfStyles.askBtn, {
                  backgroundColor: `${theme.teal}12`,
                  borderColor: `${theme.teal}30`,
                }]}
                onPress={() =>
                  router.push({
                    pathname: '/assistant',
                    params: { productName: item.product_name },
                  } as never)
                }
              >
                <Text style={[shelfStyles.askText, { color: theme.teal }]}>
                  {'Ask Sofia about this \u2192'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function PersonalWatchlistCard({
  entry,
  theme,
}: {
  entry: PersonalWatchlistEntry;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const riskColor =
    entry.risk_level === 'high' ? '#FF4C2E' :
    entry.risk_level === 'medium' ? theme.gold :
    theme.teal;

  const sourceLabel =
    entry.source === 'onboarding' ? 'Your flagged concern' :
    entry.source === 'scan_history' ? 'Found in your scans' :
    'Global watchlist';

  const sourceEmoji =
    entry.source === 'onboarding' ? '\uD83D\uDEA9' :
    entry.source === 'scan_history' ? '\uD83D\uDD0D' :
    '\uD83C\uDF0D';

  return (
    <View style={[
      pwStyles.card,
      {
        backgroundColor: `${riskColor}08`,
        borderColor: `${riskColor}30`,
        borderWidth: entry.risk_level === 'high' ? 1.5 : 1,
      },
    ]}>
      <View style={[pwStyles.bar, { backgroundColor: riskColor }]} />
      <View style={pwStyles.inner}>

        {/* Header row */}
        <View style={pwStyles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[pwStyles.name, { color: theme.text1 }]}>
              {entry.ingredient}
            </Text>
            <Text style={[pwStyles.sourceLabel, { color: theme.text4 }]}>
              {sourceEmoji} {sourceLabel}
            </Text>
          </View>
          <View style={[pwStyles.riskBadge, {
            backgroundColor: `${riskColor}18`,
            borderColor: `${riskColor}40`,
          }]}>
            <Text style={[pwStyles.riskText, { color: riskColor }]}>
              {entry.risk_level.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Reason */}
        <Text style={[pwStyles.reason, { color: theme.text3 }]}>
          {entry.reason}
        </Text>

        {/* Status + jurisdiction badges */}
        {(entry.status || entry.jurisdiction) ? (
          <View style={pwStyles.badgeRow}>
            {entry.status ? (
              <View style={[pwStyles.pill, {
                backgroundColor: `${riskColor}12`,
                borderColor: `${riskColor}30`,
              }]}>
                <Text style={[pwStyles.pillText, { color: riskColor }]}>
                  {entry.status.toUpperCase()}
                </Text>
              </View>
            ) : null}
            {entry.jurisdiction ? (
              <View style={[pwStyles.pill, {
                backgroundColor: theme.bg3,
                borderColor: theme.border,
              }]}>
                <Text style={[pwStyles.pillText, { color: theme.text3 }]}>
                  {entry.jurisdiction}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Found in scans */}
        {entry.found_in_scans.length > 0 ? (
          <TouchableOpacity
            onPress={() => setExpanded((v) => !v)}
            style={[pwStyles.scansRow, {
              backgroundColor: `${riskColor}06`,
              borderColor: `${riskColor}20`,
            }]}
          >
            <Text style={[pwStyles.scansLabel, { color: riskColor }]}>
              {'\uD83D\uDCE6 Found in {0} of your scanned products'
                .replace('{0}', String(entry.found_in_scans.length))}
            </Text>
            {expanded ? (
              <View style={{ marginTop: 6 }}>
                {entry.found_in_scans.slice(0, 5).map((p, i) => (
                  <Text key={i} style={[pwStyles.scanProduct, { color: theme.text3 }]}>
                    {'\u2022 '}{p}
                  </Text>
                ))}
                {entry.found_in_scans.length > 5 ? (
                  <Text style={[pwStyles.scanProduct, { color: theme.text4 }]}>
                    +{entry.found_in_scans.length - 5} more
                  </Text>
                ) : null}
              </View>
            ) : null}
          </TouchableOpacity>
        ) : null}

        {/* Active intel events */}
        {entry.intel_events.length > 0 ? (
          <View style={[pwStyles.intelRow, {
            backgroundColor: `${theme.gold}08`,
            borderColor: `${theme.gold}25`,
          }]}>
            <Text style={[pwStyles.intelLabel, { color: theme.gold }]}>
              {'\u26A0\uFE0F '}{entry.intel_events.length} active safety alert
              {entry.intel_events.length > 1 ? 's' : ''} related to this ingredient
            </Text>
            <Text
              style={[pwStyles.intelHeadline, { color: theme.text3 }]}
              numberOfLines={2}
            >
              {entry.intel_events[0]?.consumer_summary ??
               entry.intel_events[0]?.headline ?? ''}
            </Text>
          </View>
        ) : null}

        {/* Ask Sofia CTA */}
        <TouchableOpacity
          style={[pwStyles.sofiaBtn, {
            backgroundColor: `${theme.teal}12`,
            borderColor: `${theme.teal}30`,
          }]}
          onPress={() =>
            router.push({
              pathname: '/assistant',
              params: { ingredientName: entry.ingredient },
            } as never)
          }
        >
          <Text style={[pwStyles.sofiaText, { color: theme.teal }]}>
            {`Ask Sofia about ${entry.ingredient} \u2192`}
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

function SafeCircleScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id;
  const onboardingConcerns = useOnboardingStore((s) => s.productConcerns);
  const onboardingAllergies = useOnboardingStore((s) => s.allergies);
  const onboardingConditions = useOnboardingStore((s) => s.conditions);

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const newPostIds = useRef(new Set<string>());
  const newReviewIds = useRef(new Set<string>());
  const [alertToast, setAlertToast] = useState<string | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;

  const [activeTab, setActiveTab] = useState<
    'alerts' | 'intel' | 'recalls' | 'watch' | 'breaks' | 'community'
  >('alerts');
  const [recallMatches, setRecallMatches] = useState<RecallMatch[]>([]);
  const [recallMatchLoading, setRecallMatchLoading] = useState(false);

  // ── User health profile (for watchlist relevance) ─────────────────────────
  const profileQuery = useQuery({
    queryKey: ['user-health-profile-sc', userId],
    enabled: !!userId,
    staleTime: 15 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('user_health_profiles')
        .select('allergens, country')
        .eq('user_id', userId!)
        .maybeSingle();
      return data as { allergens: string[] | null; country: string | null } | null;
    },
  });

  // ── Guardian points ──────────────────────────────────────────────────────
  const pointsQuery = useQuery({
    queryKey: ['guardian-points', userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('guardian_points')
        .select('points, level, rank')
        .eq('user_id', userId!)
        .maybeSingle();
      return data ?? null;
    },
  });

  // ── Badges (all + earned state) ───────────────────────────────────────────
  const badgesQuery = useQuery({
    queryKey: ['user-badges', userId],
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const [allRes, earnedRes] = await Promise.all([
        supabase.from('badges').select('id, name, icon, description').order('name').limit(30),
        supabase.from('user_badges').select('badge_id').eq('user_id', userId!),
      ]);
      const allBadges = (allRes.data ?? []) as {
        id: string;
        name: string;
        icon: string;
        description: string;
      }[];
      const earnedSet = new Set(
        (earnedRes.data ?? []).map((r: { badge_id: string }) => r.badge_id)
      );
      return allBadges.map((b) => ({ ...b, earned: earnedSet.has(b.id) })) as Badge[];
    },
  });

  // ── Community posts ───────────────────────────────────────────────────────
  const postsQuery = useQuery({
    queryKey: ['community-posts'],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('community_posts')
        .select('id, user_id, content, post_type, created_at')
        .order('created_at', { ascending: false })
        .limit(30);
      return (data ?? []) as FeedPost[];
    },
  });

  useEffect(() => {
    if (postsQuery.data) setPosts(postsQuery.data);
  }, [postsQuery.data]);

  // ── Product reviews ───────────────────────────────────────────────────────
  const reviewsQuery = useQuery({
    queryKey: ['product-reviews'],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('product_reviews')
        .select('id, user_id, product_name, barcode, rating, body, tags, helpful_count, created_at')
        .order('created_at', { ascending: false })
        .limit(20);
      return (data ?? []) as ProductReview[];
    },
  });

  useEffect(() => {
    if (reviewsQuery.data) setReviews(reviewsQuery.data);
  }, [reviewsQuery.data]);

  // ── Harm watchlist ────────────────────────────────────────────────────────
  const watchlistQuery = useQuery({
    queryKey: ['harm-watchlist'],
    staleTime: 15 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('harm_watchlist')
        .select('id, ingredient_name, risk_level, reason')
        .order('risk_level', { ascending: true })
        .limit(10);
      return (data ?? []) as WatchlistItem[];
    },
  });

  // ── Health intel events ───────────────────────────────────────────────────
  const intelEventsQuery = useQuery({
    queryKey: ['health-intel-events'],
    staleTime: 3 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('health_intel_events')
        .select('*')
        .eq('is_active', true)
        .order('published_at', { ascending: false })
        .limit(50);
      return (data ?? []) as HealthIntelEvent[];
    },
  });

  const personalWatchlistQuery = useQuery({
    queryKey: ['personal-watchlist', userId, onboardingConcerns, onboardingAllergies],
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<PersonalWatchlistEntry[]> => {
      // Build master ingredient list from onboarding
      const flaggedIngredients = Array.from(new Set([
        ...onboardingConcerns,
        ...onboardingAllergies.filter((a) => a !== 'none'),
      ])).filter(Boolean);

      // Get user scan history ingredients from raw_payload
      const { data: scans } = await supabase
        .from('scans')
        .select('raw_payload, created_at')
        .eq('user_id', userId!)
        .not('raw_payload', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);

      // Extract all ingredient/product pairs from scans
      const scanIngredientMap = new Map<string, string[]>();
      for (const scan of scans ?? []) {
        const p = (scan.raw_payload as Record<string, unknown>) ?? {};
        const productName =
          (p.productName as string | undefined) ??
          (p.product_name as string | undefined) ??
          (p.name as string | undefined) ??
          'Unknown product';
        const ings: string[] = Array.isArray(p.ingredients)
          ? (p.ingredients as string[])
          : Array.isArray(p.ingredientsList)
          ? (p.ingredientsList as string[])
          : [];
        for (const ing of ings) {
          const key = ing.toLowerCase().trim();
          if (!scanIngredientMap.has(key)) scanIngredientMap.set(key, []);
          const arr = scanIngredientMap.get(key)!;
          if (!arr.includes(productName)) arr.push(productName);
        }
      }

      // Get global watchlist matches
      const { data: gwEntries } = await supabase
        .from('global_watchlist')
        .select('ingredient, product_name, status, jurisdiction, reason')
        .limit(200);

      const gwMap = new Map<string, typeof gwEntries extends Array<infer T> ? T : never>();
      for (const entry of gwEntries ?? []) {
        if (entry.ingredient) {
          gwMap.set((entry.ingredient as string).toLowerCase().trim(), entry as never);
        }
      }

      // Get active intel events for ingredient matching
      const activeEvents = intelEventsQuery.data ?? [];

      // Build personal watchlist entries
      const entries = new Map<string, PersonalWatchlistEntry>();

      // 1. Add onboarding flagged ingredients
      for (const concern of flaggedIngredients) {
        const key = concern.toLowerCase().replace(/_/g, ' ').trim();
        const foundInScans = scanIngredientMap.get(key) ?? [];
        const gwEntry = gwMap.get(key);
        const matchingEvents = activeEvents.filter((e) =>
          (e.ingredients ?? []).some((i) =>
            i.toLowerCase().includes(key) || key.includes(i.toLowerCase())
          )
        );

        entries.set(key, {
          ingredient: concern.replace(/_/g, ' '),
          source: 'onboarding',
          risk_level: (gwEntry as {status?: string} | undefined)?.status === 'banned' ? 'high' :
                      (gwEntry as {status?: string} | undefined)?.status === 'recalled' ? 'high' :
                      (gwEntry as {status?: string} | undefined)?.status === 'restricted' ? 'medium' : 'medium',
          reason: (gwEntry as {reason?: string} | undefined)?.reason ?? 'Flagged during your health setup',
          jurisdiction: (gwEntry as {jurisdiction?: string} | undefined)?.jurisdiction ?? undefined,
          status: (gwEntry as {status?: string} | undefined)?.status ?? undefined,
          found_in_scans: foundInScans,
          intel_events: matchingEvents,
        });
      }

      // 2. Add global watchlist ingredients found in scan history
      for (const [ingKey, products] of scanIngredientMap.entries()) {
        if (entries.has(ingKey)) continue; // already added
        const gwEntry = gwMap.get(ingKey);
        if (!gwEntry) continue;
        const matchingEvents = activeEvents.filter((e) =>
          (e.ingredients ?? []).some((i) =>
            i.toLowerCase().includes(ingKey) || ingKey.includes(i.toLowerCase())
          )
        );

        entries.set(ingKey, {
          ingredient: ingKey,
          source: 'scan_history',
          risk_level: (gwEntry as {status?: string}).status === 'banned' ? 'high' :
                      (gwEntry as {status?: string}).status === 'recalled' ? 'high' :
                      (gwEntry as {status?: string}).status === 'restricted' ? 'medium' : 'low',
          reason: (gwEntry as {reason?: string}).reason ?? 'Found in global watchlist',
          jurisdiction: (gwEntry as {jurisdiction?: string}).jurisdiction ?? undefined,
          status: (gwEntry as {status?: string}).status ?? undefined,
          found_in_scans: products,
          intel_events: matchingEvents,
        });
      }

      // Sort: high risk first, then by intel event count
      return Array.from(entries.values()).sort((a, b) => {
        const riskOrder = { high: 0, medium: 1, low: 2 };
        const riskDiff = riskOrder[a.risk_level] - riskOrder[b.risk_level];
        if (riskDiff !== 0) return riskDiff;
        return b.intel_events.length - a.intel_events.length;
      });
    },
  });

  // ── Breakthroughs ─────────────────────────────────────────────────────────
  const breakthroughsQuery = useQuery({
    queryKey: ['health-breakthroughs'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('health_intel_events')
        .select('*')
        .eq('is_active', true)
        .in('event_type', ['breakthrough', 'approval'])
        .order('published_at', { ascending: false })
        .limit(20);
      return (data ?? []) as HealthIntelEvent[];
    },
  });

  // ── User personalised health alerts ───────────────────────────────────────
  const userAlertsQuery = useQuery({
    queryKey: ['user-health-alerts', userId],
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('user_health_alerts')
        .select('*, health_intel_events(*)')
        .eq('user_id', userId!)
        .eq('dismissed', false)
        .order('sent_at', { ascending: false })
        .limit(20);
      return (data ?? []) as UserHealthAlert[];
    },
  });

  const unreadAlertCount = (userAlertsQuery.data ?? []).filter((a) => !a.read).length;

  const shelfQuery = useQuery({
    queryKey: ['my-shelf', userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data: scans } = await supabase
        .from('scans')
        .select('id, raw_payload, grade, score, created_at')
        .eq('user_id', userId!)
        .not('raw_payload', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!scans?.length) return [] as ShelfItem[];

      const { data: events } = await supabase
        .from('health_intel_events')
        .select('id, headline, event_type, severity, product_name, ingredients, published_at, source, trust_score, summary, source_url, countries, is_active')
        .eq('is_active', true)
        .in('event_type', ['recall', 'ban', 'safety_alert'])
        .order('published_at', { ascending: false })
        .limit(100);

      const activeEvents = (events ?? []) as HealthIntelEvent[];

      return scans.map((scan) => {
        const p = (scan.raw_payload as Record<string, unknown>) ?? {};
        const productName =
          (p.productName as string | undefined) ??
          (p.product_name as string | undefined) ??
          (p.name as string | undefined) ??
          'Unknown product';

        const scanIngs: string[] = Array.isArray(p.ingredients)
          ? (p.ingredients as string[])
          : Array.isArray(p.ingredientsList)
          ? (p.ingredientsList as string[])
          : [];

        const matchedEvent = activeEvents.find((event) => {
          if (event.product_name && productName !== 'Unknown product') {
            const ep = event.product_name.toLowerCase();
            const sp = productName.toLowerCase();
            if (ep.includes(sp) || sp.includes(ep)) return true;
          }
          if (event.ingredients?.length && scanIngs.length) {
            const ei = event.ingredients.map((i) => i.toLowerCase());
            const si = scanIngs.map((i) => i.toLowerCase());
            return ei.some((e) => si.some((s) => s.includes(e) || e.includes(s)));
          }
          return false;
        }) ?? null;

        let status: ShelfItem['status'] = 'safe';
        if (matchedEvent) {
          if (matchedEvent.event_type === 'recall') status = 'recalled';
          else if (matchedEvent.severity === 'critical' || matchedEvent.severity === 'high')
            status = 'alert';
          else status = 'monitoring';
        }

        return {
          id: scan.id,
          product_name: productName,
          grade: scan.grade ?? null,
          score: scan.score ?? null,
          created_at: scan.created_at,
          status,
          matched_event: matchedEvent,
        } as ShelfItem;
      }).filter((s) => s.product_name !== 'Unknown product');
    },
  });

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = useCallback(
    (msg: string) => {
      setAlertToast(msg);
      Animated.sequence([
        Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(3000),
        Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setAlertToast(null));
    },
    [toastAnim]
  );

  const handleNewRegulatoryAlert = useCallback(
    (alert: RegulatoryAlert) => {
      showToast(`New safety alert from ${alert.agency}`);
      void queryClient.invalidateQueries({ queryKey: ['regulatory-alerts'] });
    },
    [showToast, queryClient]
  );

  // ── Recall matcher on mount ───────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    const runRecallMatcher = async () => {
      setRecallMatchLoading(true);
      try {
        const { data } = await supabase.functions.invoke('recall-matcher', {
          body: { user_id: userId },
        });
        if (data?.matches?.length) {
          setRecallMatches(data.matches as RecallMatch[]);
          void userAlertsQuery.refetch();
        }
      } catch {
        /* silent fail — recall matcher is best-effort */
      } finally {
        setRecallMatchLoading(false);
      }
    };
    void runRecallMatcher();
  }, [userId]);

  // ── Realtime: regulatory_alerts ───────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`regulatory-alerts-rt-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'regulatory_alerts' },
        (payload) => {
          handleNewRegulatoryAlert(payload.new as RegulatoryAlert);
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [handleNewRegulatoryAlert]);

  // ── Realtime: health_intel_events ─────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`health-intel-rt-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'health_intel_events' },
        (payload) => {
          const event = payload.new as HealthIntelEvent;
          if (event.severity === 'critical' || event.severity === 'high') {
            showToast(`New ${event.severity} alert: ${event.source}`);
          }
          void queryClient.invalidateQueries({ queryKey: ['health-intel-events'] });
          void queryClient.invalidateQueries({ queryKey: ['regulatory-alerts'] });
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [showToast, queryClient]);

  // ── Realtime: community_posts ─────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`safecircle-posts-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'community_posts' },
        (payload) => {
          const row = payload.new as FeedPost;
          newPostIds.current.add(row.id);
          setPosts((prev) => {
            if (prev.some((p) => p.id === row.id)) return prev;
            return [row, ...prev];
          });
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  // ── Realtime: product_reviews ─────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`safecircle-reviews-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'product_reviews' },
        (payload) => {
          const row = payload.new as ProductReview;
          newReviewIds.current.add(row.id);
          setReviews((prev) => {
            if (prev.some((r) => r.id === row.id)) return prev;
            return [row, ...prev];
          });
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  // ── Refresh on focus ──────────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      void queryClient.invalidateQueries({ queryKey: ['product-reviews'] });
      void queryClient.invalidateQueries({ queryKey: ['guardian-points', userId] });
    }, [queryClient, userId])
  );

  const onRefresh = useCallback(() => {
    void postsQuery.refetch();
    void reviewsQuery.refetch();
    void watchlistQuery.refetch();
    void badgesQuery.refetch();
    void pointsQuery.refetch();
    void intelEventsQuery.refetch();
    void breakthroughsQuery.refetch();
    void userAlertsQuery.refetch();
    void shelfQuery.refetch();
    void personalWatchlistQuery.refetch();
  }, [
    postsQuery,
    reviewsQuery,
    watchlistQuery,
    badgesQuery,
    pointsQuery,
    intelEventsQuery,
    breakthroughsQuery,
    userAlertsQuery,
    shelfQuery,
    personalWatchlistQuery,
  ]);

  const handleHelpful = async (reviewId: string) => {
    try {
      await supabase.rpc('increment_review_helpful', { review_id: reviewId });
    } catch {
      // best-effort
    }
  };

  const intelEvents = intelEventsQuery.data ?? [];
  const breakthroughs = breakthroughsQuery.data ?? [];
  const userAllergens = profileQuery.data?.allergens ?? [];
  const userCountry = profileQuery.data?.country ?? undefined;
  const pts = pointsQuery.data;

  const alertEvents = intelEvents.filter((e) =>
    ['recall', 'ban', 'safety_alert', 'adverse_event'].includes(e.event_type)
  );
  const intelFeedEvents = intelEvents.filter((e) =>
    ['journal_finding', 'approval', 'regulation', 'lawsuit', 'trial_update'].includes(e.event_type)
  );

  const refreshing =
    postsQuery.isFetching ||
    reviewsQuery.isFetching ||
    watchlistQuery.isFetching ||
    intelEventsQuery.isFetching;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg0 }]} edges={['top']}>
      {alertToast ? (
        <Animated.View
          style={[
            styles.toast,
            {
              backgroundColor: theme.red,
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.toastText}>{alertToast}</Text>
        </Animated.View>
      ) : null}

      <View style={[scStyles.header, { backgroundColor: theme.bg1, borderBottomColor: theme.border }]}>
        <Text style={[scStyles.headerTitle, { color: theme.text1 }]}>Safe Circle</Text>
        <View style={scStyles.headerRight}>
          <TouchableOpacity
            style={[scStyles.headerBtn, { backgroundColor: theme.bg2, borderColor: theme.border }]}
          >
            <Text style={{ fontSize: 13, color: theme.text3 }}>🔍</Text>
          </TouchableOpacity>
          <View style={{ position: 'relative' }}>
            <NotificationBell onPress={() => router.push('/notifications' as never)} />
            {unreadAlertCount > 0 ? (
              <View style={[scStyles.alertDot, { backgroundColor: theme.red }]}>
                <Text style={scStyles.alertDotText}>
                  {unreadAlertCount > 9 ? '9+' : unreadAlertCount}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View style={[scStyles.tabBar, { backgroundColor: theme.bg1, borderBottomColor: theme.border }]}>
        {(
          [
            { key: 'alerts', label: 'Alerts' },
            { key: 'intel', label: 'Intel' },
            { key: 'recalls', label: 'Recalls' },
            { key: 'watch', label: 'Watch' },
            { key: 'breaks', label: 'Breaks' },
            { key: 'community', label: 'Community' },
          ] as const
        ).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              scStyles.tabItem,
              activeTab === tab.key && [scStyles.tabItemActive, { borderBottomColor: theme.teal }],
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                scStyles.tabLabel,
                { color: activeTab === tab.key ? theme.teal : theme.text3 },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.teal} />
        }
      >
        {pts ? (
          <View
            style={[
              scStyles.rankCard,
              { backgroundColor: `${theme.gold}10`, borderColor: `${theme.gold}25` },
            ]}
          >
            <View style={[scStyles.rankIcon, { backgroundColor: `${theme.gold}18` }]}>
              <Text style={{ fontSize: 18 }}>🛡️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[scStyles.rankName, { color: theme.gold }]}>
                Guardian · Level {pts.level ?? 1}
              </Text>
              <Text style={[scStyles.rankPts, { color: `${theme.gold}80` }]}>
                {pts.points ?? 0} pts · Rank: {pts.rank ?? 'Newcomer'}
              </Text>
            </View>
            <Text style={[scStyles.rankScore, { color: theme.gold }]}>{pts.points ?? 0}</Text>
          </View>
        ) : null}

        {activeTab === 'alerts' ? (
          <View>
            {recallMatches.length > 0 ? (
              <View>
                <View style={scStyles.secHeader}>
                  <Text style={[scStyles.secTitle, { color: theme.text1 }]}>
                    Affects products you scanned
                  </Text>
                  <View
                    style={[
                      scStyles.livePill,
                      { backgroundColor: `${theme.red}12`, borderColor: `${theme.red}30` },
                    ]}
                  >
                    <PulsingDot color={theme.red} />
                    <Text style={[scStyles.liveLabel, { color: theme.red }]}>LIVE</Text>
                  </View>
                </View>
                {recallMatches.map((match) => (
                  <RecallMatchCard key={match.event.id} match={match} theme={theme} />
                ))}
              </View>
            ) : null}

            <GlobalWatchlist
              userAllergens={userAllergens}
              userCountry={userCountry}
              onNewAlert={handleNewRegulatoryAlert}
            />

            {alertEvents.length > 0 ? (
              <View>
                <View style={scStyles.secHeader}>
                  <Text style={[scStyles.secTitle, { color: theme.text1 }]}>
                    Health intelligence alerts
                  </Text>
                  <Text style={[scStyles.secRight, { color: theme.teal }]}>
                    {alertEvents.length} active
                  </Text>
                </View>
                {alertEvents.map((event) => (
                  <IntelEventCard
                    key={event.id}
                    event={event}
                    userAllergens={userAllergens}
                    theme={theme}
                  />
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {activeTab === 'intel' ? (
          <View>
            <View style={scStyles.secHeader}>
              <Text style={[scStyles.secTitle, { color: theme.text1 }]}>Health intelligence feed</Text>
              <Text style={[scStyles.secRight, { color: theme.teal }]}>47 sources</Text>
            </View>
            {intelEventsQuery.isLoading ? (
              <SkeletonRows rows={3} />
            ) : intelFeedEvents.length === 0 ? (
              <EmptyState title="No intelligence items yet" subtitle="Pull to refresh." />
            ) : (
              intelFeedEvents.map((event) => (
                <IntelEventCard
                  key={event.id}
                  event={event}
                  userAllergens={userAllergens}
                  theme={theme}
                />
              ))
            )}
          </View>
        ) : null}

        {activeTab === 'recalls' ? (
          <View>

            <View style={scStyles.secHeader}>
              <Text style={[scStyles.secTitle, { color: theme.text1 }]}>My Shelf</Text>
              <View style={[scStyles.livePill, {
                backgroundColor: `${theme.teal}12`,
                borderColor: `${theme.teal}30`,
              }]}>
                <PulsingDot color={theme.teal} />
                <Text style={[scStyles.liveLabel, { color: theme.teal }]}>MONITORED</Text>
              </View>
            </View>

            {shelfQuery.isLoading ? (
              <SkeletonRows rows={4} />
            ) : (shelfQuery.data ?? []).length === 0 ? (
              <EmptyState
                title="Your shelf is empty"
                subtitle="Products you scan will appear here and be monitored for recalls automatically."
              />
            ) : (
              <View>
                {(() => {
                  const shelf = shelfQuery.data ?? [];
                  const recalled = shelf.filter((s) => s.status === 'recalled').length;
                  const alerts = shelf.filter((s) => s.status === 'alert').length;
                  const monitoring = shelf.filter((s) => s.status === 'monitoring').length;
                  const safe = shelf.filter((s) => s.status === 'safe').length;
                  return (
                    <View style={[shelfSummaryStyles.bar, {
                      backgroundColor: theme.bg2,
                      borderColor: theme.border,
                    }]}>
                      {recalled > 0 ? (
                        <View style={shelfSummaryStyles.stat}>
                          <Text style={[shelfSummaryStyles.num, { color: '#FF4C2E' }]}>{recalled}</Text>
                          <Text style={[shelfSummaryStyles.lbl, { color: theme.text4 }]}>Recalled</Text>
                        </View>
                      ) : null}
                      {alerts > 0 ? (
                        <View style={shelfSummaryStyles.stat}>
                          <Text style={[shelfSummaryStyles.num, { color: '#F5A623' }]}>{alerts}</Text>
                          <Text style={[shelfSummaryStyles.lbl, { color: theme.text4 }]}>Alert</Text>
                        </View>
                      ) : null}
                      <View style={shelfSummaryStyles.stat}>
                        <Text style={[shelfSummaryStyles.num, { color: theme.gold }]}>{monitoring}</Text>
                        <Text style={[shelfSummaryStyles.lbl, { color: theme.text4 }]}>Monitor</Text>
                      </View>
                      <View style={shelfSummaryStyles.stat}>
                        <Text style={[shelfSummaryStyles.num, { color: '#2ED573' }]}>{safe}</Text>
                        <Text style={[shelfSummaryStyles.lbl, { color: theme.text4 }]}>Safe</Text>
                      </View>
                      <View style={shelfSummaryStyles.stat}>
                        <Text style={[shelfSummaryStyles.num, { color: theme.text3 }]}>{shelf.length}</Text>
                        <Text style={[shelfSummaryStyles.lbl, { color: theme.text4 }]}>Total</Text>
                      </View>
                    </View>
                  );
                })()}

                {(shelfQuery.data ?? [])
                  .sort((a, b) => {
                    const order = { recalled: 0, alert: 1, monitoring: 2, safe: 3 };
                    return order[a.status] - order[b.status];
                  })
                  .map((item) => (
                    <MyShelfCard key={item.id} item={item} theme={theme} />
                  ))}
              </View>
            )}

            <View style={[scStyles.secHeader, { marginTop: 20 }]}>
              <Text style={[scStyles.secTitle, { color: theme.text1 }]}>Active recalls feed</Text>
              <Text style={[scStyles.secRight, { color: theme.teal }]}>
                {alertEvents.filter((e) => e.event_type === 'recall').length} active
              </Text>
            </View>
            {alertEvents
              .filter((e) => e.event_type === 'recall')
              .map((event) => (
                <IntelEventCard
                  key={event.id}
                  event={event}
                  userAllergens={userAllergens}
                  theme={theme}
                />
              ))}
          </View>
        ) : null}

        {activeTab === 'watch' ? (
          <View>

            {/* PERSONAL WATCHLIST — from onboarding + scan history */}
            <View style={scStyles.secHeader}>
              <Text style={[scStyles.secTitle, { color: theme.text1 }]}>
                Your Ingredient Watchlist
              </Text>
              <Text style={[scStyles.secRight, { color: theme.teal }]}>
                {(personalWatchlistQuery.data ?? []).length} tracked
              </Text>
            </View>

            {personalWatchlistQuery.isLoading ? (
              <SkeletonRows rows={3} />
            ) : (personalWatchlistQuery.data ?? []).length === 0 ? (
              <EmptyState
                title="No ingredients tracked yet"
                subtitle="Complete your health setup or scan products to populate your watchlist."
              />
            ) : (
              <View>
                {/* Summary counts */}
                {(() => {
                  const list = personalWatchlistQuery.data ?? [];
                  const high = list.filter((e) => e.risk_level === 'high').length;
                  const med  = list.filter((e) => e.risk_level === 'medium').length;
                  const withAlerts = list.filter((e) => e.intel_events.length > 0).length;
                  const inScans = list.filter((e) => e.found_in_scans.length > 0).length;
                  return (
                    <View style={[shelfSummaryStyles.bar, {
                      backgroundColor: theme.bg2,
                      borderColor: theme.border,
                      marginBottom: 12,
                    }]}>
                      {high > 0 ? (
                        <View style={shelfSummaryStyles.stat}>
                          <Text style={[shelfSummaryStyles.num, { color: '#FF4C2E' }]}>{high}</Text>
                          <Text style={[shelfSummaryStyles.lbl, { color: theme.text4 }]}>High Risk</Text>
                        </View>
                      ) : null}
                      <View style={shelfSummaryStyles.stat}>
                        <Text style={[shelfSummaryStyles.num, { color: theme.gold }]}>{med}</Text>
                        <Text style={[shelfSummaryStyles.lbl, { color: theme.text4 }]}>Medium</Text>
                      </View>
                      <View style={shelfSummaryStyles.stat}>
                        <Text style={[shelfSummaryStyles.num, { color: theme.red }]}>{withAlerts}</Text>
                        <Text style={[shelfSummaryStyles.lbl, { color: theme.text4 }]}>Alerts</Text>
                      </View>
                      <View style={shelfSummaryStyles.stat}>
                        <Text style={[shelfSummaryStyles.num, { color: theme.text3 }]}>{inScans}</Text>
                        <Text style={[shelfSummaryStyles.lbl, { color: theme.text4 }]}>In Scans</Text>
                      </View>
                    </View>
                  );
                })()}

                {(personalWatchlistQuery.data ?? []).map((entry) => (
                  <PersonalWatchlistCard
                    key={entry.ingredient}
                    entry={entry}
                    theme={theme}
                  />
                ))}
              </View>
            )}

            {/* GLOBAL HARM WATCHLIST — unchanged, shown below */}
            <View style={[scStyles.secHeader, { marginTop: 20 }]}>
              <Text style={[scStyles.secTitle, { color: theme.text1 }]}>
                Global Harm Watchlist
              </Text>
              <Text style={[scStyles.secRight, { color: theme.teal }]}>
                {(watchlistQuery.data ?? []).length} flagged
              </Text>
            </View>
            {watchlistQuery.isLoading ? (
              <SkeletonRows rows={3} />
            ) : (watchlistQuery.data ?? []).length === 0 ? (
              <EmptyState title="No flagged ingredients yet" />
            ) : (
              <View style={[styles.listBlock, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
                {(watchlistQuery.data ?? []).map((item, idx) => {
                  const colorKey = RISK_COLOR[item.risk_level] as 'red' | 'gold' | 'teal';
                  const c = theme[colorKey];
                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.watchRow,
                        { borderBottomColor: theme.border },
                        idx === (watchlistQuery.data ?? []).length - 1 && { borderBottomWidth: 0 },
                      ]}
                    >
                      <View style={[styles.riskDot, { backgroundColor: c }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.watchName, { color: theme.text1 }]}>
                          {item.ingredient_name}
                        </Text>
                        <Text style={[styles.watchReason, { color: theme.text3 }]}>{item.reason}</Text>
                      </View>
                      <View style={[styles.riskBadge, {
                        backgroundColor: `${c}18`,
                        borderColor: `${c}35`,
                      }]}>
                        <Text style={[styles.riskBadgeText, { color: c }]}>
                          {item.risk_level.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : null}

        {activeTab === 'breaks' ? (
          <View>
            <View style={scStyles.secHeader}>
              <Text style={[scStyles.secTitle, { color: theme.text1 }]}>Breakthrough detector</Text>
              <Text style={[scStyles.secRight, { color: theme.teal }]}>
                PubMed · FDA · ClinicalTrials
              </Text>
            </View>
            {breakthroughsQuery.isLoading ? (
              <SkeletonRows rows={3} />
            ) : breakthroughs.length === 0 ? (
              <EmptyState title="No breakthroughs detected yet" subtitle="Pull to refresh." />
            ) : (
              breakthroughs.map((event) => (
                <IntelEventCard
                  key={event.id}
                  event={event}
                  userAllergens={userAllergens}
                  theme={theme}
                />
              ))
            )}
          </View>
        ) : null}

        {activeTab === 'community' ? (
          <View>
            {(badgesQuery.data ?? []).length > 0 ? (
              <View>
                <View style={scStyles.secHeader}>
                  <Text style={[scStyles.secTitle, { color: theme.text1 }]}>Your badges</Text>
                </View>
                <FlatList
                  horizontal
                  data={badgesQuery.data ?? []}
                  keyExtractor={(item) => item.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.badgeList}
                  renderItem={({ item }) => (
                    <View
                      style={[
                        styles.badgeCard,
                        {
                          backgroundColor: item.earned ? `${theme.gold}12` : theme.bg2,
                          borderColor: item.earned ? `${theme.gold}40` : theme.border,
                          opacity: item.earned ? 1 : 0.45,
                        },
                      ]}
                    >
                      <Text style={styles.badgeIcon}>{item.icon}</Text>
                      <Text
                        style={[
                          styles.badgeName,
                          { color: item.earned ? theme.gold : theme.text3 },
                        ]}
                      >
                        {item.name}
                      </Text>
                    </View>
                  )}
                />
              </View>
            ) : null}

            <View style={scStyles.secHeader}>
              <Text style={[scStyles.secTitle, { color: theme.text1 }]}>Community</Text>
              <TouchableOpacity onPress={() => router.push('/review/new' as never)}>
                <Text style={[scStyles.secRight, { color: theme.teal }]}>Post</Text>
              </TouchableOpacity>
            </View>
            {posts.map((post) => (
              <FeedCard key={post.id} post={post} isNew={newPostIds.current.has(post.id)} />
            ))}
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                isNew={newReviewIds.current.has(review.id)}
                onHelpful={() => void handleHelpful(review.id)}
              />
            ))}
          </View>
        ) : null}

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const scStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  alertDotText: { fontSize: 9, fontWeight: '900', color: '#fff' },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomWidth: 2 },
  tabLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.2 },

  rankCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rankIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankName: { fontSize: 13, fontWeight: '800' },
  rankPts: { fontSize: 10, marginTop: 2 },
  rankScore: { fontSize: 22, fontWeight: '900', letterSpacing: -1 },

  secHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  secTitle: { fontSize: 13, fontWeight: '800', letterSpacing: -0.2 },
  secRight: { fontSize: 11, fontWeight: '700' },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 50,
    borderWidth: 0.5,
  },
  liveLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },

  recallCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  recallHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  recallIcon: { fontSize: 14 },
  recallTitle: { fontSize: 12, fontWeight: '800', flex: 1 },
  recallSub: { fontSize: 11, lineHeight: 16, marginBottom: 8 },
  matchedProduct: {
    borderRadius: 10,
    borderWidth: 0.5,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  matchedName: { fontSize: 12, fontWeight: '700' },
  matchedDate: { fontSize: 9 },
  recallCta: {
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  recallCtaText: { fontSize: 11, fontWeight: '800', color: '#fff' },

  intelCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  sevBar: { width: 3 },
  intelInner: { flex: 1, padding: 12 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 7 },
  sourceBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 50,
    borderWidth: 0.5,
  },
  sourceBadgeText: { fontSize: 9, fontWeight: '800' },
  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 50,
    borderWidth: 0.5,
  },
  typeBadgeText: { fontSize: 9, fontWeight: '700' },
  trustBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 50,
    borderWidth: 0.5,
  },
  trustText: { fontSize: 9, fontWeight: '700' },
  affectsBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 50,
    borderWidth: 0.5,
  },
  affectsText: { fontSize: 9, fontWeight: '800' },
  intelTitle: { fontSize: 12, fontWeight: '700', marginBottom: 4, lineHeight: 17 },
  intelBody: { fontSize: 10.5, lineHeight: 15, marginBottom: 3 },
  readMore: { fontSize: 10, fontWeight: '700', marginBottom: 6 },
  ingChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 50,
    borderWidth: 0.5,
    marginRight: 5,
  },
  ingChipText: { fontSize: 9, fontWeight: '500' },
  intelFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  countriesText: { fontSize: 9 },
  timeText: { fontSize: 9 },
  actionRow: { flexDirection: 'row', gap: 6, marginTop: 2 },
  askBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 0.5,
  },
  askBtnText: { fontSize: 10, fontWeight: '800' },
  sourceBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 0.5,
  },
  sourceBtnText: { fontSize: 10, fontWeight: '600' },
  helpfulBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 0.5,
  },
  helpfulBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  riskNoteBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  riskNoteText: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
  legalDisclaimer: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginTop: 6,
    marginBottom: 4,
  },
  legalDisclaimerText: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 17,
    fontStyle: 'italic',
  },
});

const shelfStyles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  bar: { width: 3 },
  inner: { flex: 1, padding: 12 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  name: { fontSize: 13, fontWeight: '700', letterSpacing: -0.2 },
  date: { fontSize: 10, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 50,
    borderWidth: 1,
  },
  statusLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  gradePill: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeText: { fontSize: 13, fontWeight: '900' },
  alertRow: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 8,
    marginBottom: 6,
  },
  alertText: { fontSize: 11, lineHeight: 16, fontWeight: '600' },
  askBtn: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  askText: { fontSize: 11, fontWeight: '800' },
});

const shelfSummaryStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    justifyContent: 'space-around',
  },
  stat: { alignItems: 'center', gap: 2 },
  num: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  lbl: { fontSize: 9, fontWeight: '600', letterSpacing: 0.3, textTransform: 'uppercase' },
});

const pwStyles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  bar: { width: 3 },
  inner: { flex: 1, padding: 12 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.3,
    textTransform: 'capitalize',
  },
  sourceLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 50,
    borderWidth: 1,
    flexShrink: 0,
  },
  riskText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  reason: { fontSize: 11, lineHeight: 16, marginBottom: 8 },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 50,
    borderWidth: 1,
  },
  pillText: { fontSize: 9, fontWeight: '700' },
  scansRow: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 8,
    marginBottom: 8,
  },
  scansLabel: { fontSize: 11, fontWeight: '700' },
  scanProduct: { fontSize: 11, lineHeight: 18 },
  intelRow: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 8,
    marginBottom: 8,
  },
  intelLabel: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  intelHeadline: { fontSize: 10, lineHeight: 15 },
  sofiaBtn: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  sofiaText: { fontSize: 11, fontWeight: '800' },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: 40 },

  listBlock: {
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },

  skeletonWrap: { padding: 16, gap: 8 },
  skRow: { marginBottom: 4 },

  badgeList: { gap: 10, paddingHorizontal: 16, paddingBottom: 4 },
  badgeCard: {
    width: 72,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  badgeIcon: { fontSize: 24 },
  badgeName: { fontSize: 10, fontWeight: '600', textAlign: 'center' },

  watchRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  riskDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4, flexShrink: 0 },
  watchName: { fontSize: 13, fontWeight: '700', letterSpacing: -0.1 },
  watchReason: { fontSize: 11, fontWeight: '500', marginTop: 2, lineHeight: 16 },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    flexShrink: 0,
  },
  riskBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },

  toast: {
    position: 'absolute',
    top: 8,
    left: 16,
    right: 16,
    borderRadius: 12,
    padding: 12,
    zIndex: 999,
  },
  toastText: { color: '#fff', fontSize: 13, fontWeight: '700', textAlign: 'center' },
});

export default function WrappedSafeCircleScreen() {
  return (
    <RootErrorBoundary>
      <SafeCircleScreen />
    </RootErrorBoundary>
  );
}

# TRUWELL AI — PRICING AND MONETISATION SYSTEM
# Complete Implementation Prompt for Claude Code in Cursor
# Version: 1.0 | Based on approved mobile mockup design

READ THIS ENTIRE PROMPT BEFORE TOUCHING ANY FILE.
Execute each phase in strict order. Do not skip. Do not combine phases.
After each phase run: npx tsc --noEmit and confirm zero errors.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1 — AUDIT AND TEARDOWN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1.1 — Read and report every existing pricing reference

Run these commands and show complete output:

grep -r "subscription\|upgrade\|isPro\|pro_monthly\|pro_yearly\|lifetime\|family_plan\|Guardian Pro\|pricing\|stripe.*price\|price_id" \
  app/ components/ lib/ stores/ \
  --include="*.tsx" --include="*.ts" -l

For every file found: show the full content of the pricing-related sections.
Do not change anything yet. Only report.

Step 1.2 — Document what currently exists

Answer these questions before proceeding:
- Does app/settings/subscription.tsx exist? Show its full content.
- Does lib/subscriptionPlans.ts exist? Show its full content.
- Does lib/quotaManager.ts exist? Show its full content.
- Where is isPro or subscription_tier currently checked in the UI?
- What Stripe price IDs are currently hardcoded anywhere?
- What does the existing Stripe integration look like in lib/ or services/?

Step 1.3 — Delete all existing pricing logic

After documenting everything in 1.2, delete or completely replace:
- Any existing subscription plan arrays or objects
- Any hardcoded plan prices or feature lists
- Any existing isPro checks that use the old subscription_tier === 'pro' pattern
- Any existing upgrade prompt components that will be replaced

Keep intact:
- Stripe SDK imports and configuration (lib/stripe.ts or similar)
- Supabase client
- Auth store
- All non-pricing UI components

Report every file deleted or emptied before proceeding to Phase 2.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 2 — DATABASE SETUP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 2.1 — Supabase SQL

Run every statement below in the Supabase SQL editor.
Run them one block at a time and confirm each succeeds before running the next.

BLOCK A — Add columns to profiles:

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free'
  CHECK (subscription_plan IN (
    'free', 'pro_monthly', 'pro_yearly', 'family', 'lifetime'
  ));

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS founder_member BOOLEAN DEFAULT FALSE;

UPDATE profiles
  SET subscription_plan = 'free'
  WHERE subscription_plan IS NULL;

BLOCK B — Usage quotas table:

CREATE TABLE IF NOT EXISTS usage_quotas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  scans_used_this_month INTEGER DEFAULT 0,
  predictive_reports_used_this_month INTEGER DEFAULT 0,
  quota_reset_date DATE DEFAULT (
    DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
  )::DATE,
  lifetime_scans_total INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE usage_quotas ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "users_own_quotas" ON usage_quotas
  FOR ALL USING (auth.uid() = user_id);

BLOCK C — Subscription events table:

CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  event_type TEXT NOT NULL,
  plan TEXT NOT NULL,
  amount_cents INTEGER,
  currency TEXT DEFAULT 'usd',
  stripe_session_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "users_own_events" ON subscription_events
  FOR ALL USING (auth.uid() = user_id);

BLOCK D — Founder slots tracker:

CREATE TABLE IF NOT EXISTS founder_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  total_slots INTEGER DEFAULT 500,
  claimed_slots INTEGER DEFAULT 127,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO founder_slots (total_slots, claimed_slots)
  SELECT 500, 127
  WHERE NOT EXISTS (SELECT 1 FROM founder_slots);

BLOCK E — Stored procedures for quota increments:

CREATE OR REPLACE FUNCTION increment_scan_quota(uid UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO usage_quotas (user_id, scans_used_this_month, lifetime_scans_total)
  VALUES (uid, 1, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    scans_used_this_month =
      CASE
        WHEN usage_quotas.quota_reset_date <= CURRENT_DATE
        THEN 1
        ELSE usage_quotas.scans_used_this_month + 1
      END,
    quota_reset_date =
      CASE
        WHEN usage_quotas.quota_reset_date <= CURRENT_DATE
        THEN (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')::DATE
        ELSE usage_quotas.quota_reset_date
      END,
    lifetime_scans_total = usage_quotas.lifetime_scans_total + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_report_quota(uid UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO usage_quotas (user_id, predictive_reports_used_this_month)
  VALUES (uid, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    predictive_reports_used_this_month =
      CASE
        WHEN usage_quotas.quota_reset_date <= CURRENT_DATE
        THEN 1
        ELSE usage_quotas.predictive_reports_used_this_month + 1
      END,
    quota_reset_date =
      CASE
        WHEN usage_quotas.quota_reset_date <= CURRENT_DATE
        THEN (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')::DATE
        ELSE usage_quotas.quota_reset_date
      END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

BLOCK F — Automatic monthly quota reset via cron (if pg_cron is enabled):

SELECT cron.schedule(
  'reset-monthly-quotas',
  '0 0 1 * *',
  $$
    UPDATE usage_quotas
    SET scans_used_this_month = 0,
        predictive_reports_used_this_month = 0,
        quota_reset_date = (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')::DATE,
        updated_at = NOW();
  $$
);

If pg_cron is not available, skip this block and note it for manual monthly reset.

Step 2.2 — Verify all tables

Run this and confirm every table appears:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'profiles', 'usage_quotas', 'subscription_events', 'founder_slots'
)
ORDER BY table_name;

Expected: 4 rows returned.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 3 — CORE DATA LIBRARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 3.1 — Create lib/subscriptionPlans.ts

This is the single source of truth for ALL plan data. No plan data lives anywhere else.

Create lib/subscriptionPlans.ts with this exact content:

---
export type PlanId =
  | 'free'
  | 'pro_monthly'
  | 'pro_yearly'
  | 'family'
  | 'lifetime';

export interface PlanFeature {
  text: string;
  included: boolean;
  highlight: boolean;
  badge?: 'NEW' | 'EXCLUSIVE';
}

export interface SubscriptionPlan {
  id: PlanId;
  name: string;
  displayOrder: number;
  topBannerLabel?: string;
  topBannerRight?: string;
  floatingBadge?: string;
  floatingBadgeColor: 'gold' | 'teal' | 'green' | 'none';
  savingsBarLeft?: string;
  savingsBarRight?: string;
  strikethroughPrice?: string;
  priceDisplay: string;
  pricePeriod: string;
  priceBilledAs?: string;
  savingsBadgeText?: string;
  savingsBadgeColor: 'gold' | 'green' | 'none';
  equivalentText?: string;
  ctaLabel: string;
  ctaColor: 'gold' | 'teal' | 'green' | 'blue' | 'none';
  ctaSubtext?: string;
  fomoText?: string;
  fomoColor: 'red' | 'teal' | 'green' | 'none';
  accentColor: string;
  borderColor: string;
  backgroundColor: string;
  features: PlanFeature[];
  scanLimit: number | 'unlimited';
  predictiveReportLimit: number | 'unlimited';
  profileLimit: number;
  hasMealPlans: boolean;
  hasAdvancedBreathing: boolean;
  hasOfflineMode: boolean;
  hasGlobalWatchlist: boolean;
  hasBatchTracking: boolean;
  hasPriorityTelehealth: boolean;
  hasFounderBadge: boolean;
  hasFutureFeatures: boolean;
  stripePriceId: string | null;
  monthlyEquivalent: string;
}

export const PLANS: SubscriptionPlan[] = [

  {
    id: 'lifetime',
    name: 'Lifetime Founder',
    displayOrder: 1,
    topBannerLabel: 'LIFETIME FOUNDER',
    topBannerRight: '500 SLOTS ONLY',
    floatingBadge: undefined,
    floatingBadgeColor: 'none',
    savingsBarLeft: undefined,
    savingsBarRight: undefined,
    strikethroughPrice: '$599 original',
    priceDisplay: '$249',
    pricePeriod: 'one-time',
    priceBilledAs: undefined,
    savingsBadgeText: 'Save $350 · 58% off',
    savingsBadgeColor: 'gold',
    equivalentText: '= $1.38/month over 15 years',
    ctaLabel: 'Claim Founder Status',
    ctaColor: 'gold',
    ctaSubtext: 'Secure payment via Stripe · Instant access',
    fomoText: '373 founder slots — never restocked',
    fomoColor: 'red',
    accentColor: '#C9A84C',
    borderColor: 'rgba(201,168,76,0.40)',
    backgroundColor: '#080D08',
    features: [
      { text: 'Unlimited scans forever', included: true, highlight: true, badge: 'EXCLUSIVE' },
      { text: 'All future features included', included: true, highlight: true, badge: 'EXCLUSIVE' },
      { text: '5 family profiles', included: true, highlight: true },
      { text: 'Founder badge on profile', included: true, highlight: true, badge: 'NEW' },
      { text: 'Unlimited predictive reports', included: true, highlight: false },
      { text: 'AI meal plans', included: true, highlight: false },
      { text: 'Advanced breathing coaching', included: true, highlight: false },
      { text: 'Offline mode', included: true, highlight: false },
      { text: 'Priority telehealth booking', included: true, highlight: false },
      { text: 'Price locked — never increases', included: true, highlight: false },
      { text: 'Global watchlist alerts', included: true, highlight: false },
    ],
    scanLimit: 'unlimited',
    predictiveReportLimit: 'unlimited',
    profileLimit: 5,
    hasMealPlans: true,
    hasAdvancedBreathing: true,
    hasOfflineMode: true,
    hasGlobalWatchlist: true,
    hasBatchTracking: true,
    hasPriorityTelehealth: true,
    hasFounderBadge: true,
    hasFutureFeatures: true,
    stripePriceId: process.env.EXPO_PUBLIC_STRIPE_PRICE_LIFETIME ?? null,
    monthlyEquivalent: '$1.38/mo',
  },

  {
    id: 'family',
    name: 'Family Guardian',
    displayOrder: 2,
    topBannerLabel: undefined,
    topBannerRight: undefined,
    floatingBadge: 'MOST POPULAR',
    floatingBadgeColor: 'teal',
    savingsBarLeft: undefined,
    savingsBarRight: undefined,
    strikethroughPrice: '$29.99/month',
    priceDisplay: '$16.58',
    pricePeriod: '/month',
    priceBilledAs: 'Billed monthly',
    savingsBadgeText: 'Save $159/year vs individual plans',
    savingsBadgeColor: 'green',
    equivalentText: 'Less than coffee per week',
    ctaLabel: 'Protect My Family Now',
    ctaColor: 'teal',
    ctaSubtext: undefined,
    fomoText: '2,841 families protected this month',
    fomoColor: 'teal',
    accentColor: '#00E5C8',
    borderColor: 'rgba(0,229,200,0.30)',
    backgroundColor: '#050D12',
    features: [
      { text: '5 individual health profiles', included: true, highlight: true },
      { text: 'Children safety mode', included: true, highlight: true },
      { text: 'Pregnancy and allergy alerts', included: true, highlight: true },
      { text: 'Unlimited scans for all profiles', included: true, highlight: false },
      { text: 'Unlimited predictive reports', included: true, highlight: false },
      { text: 'AI meal plans per profile', included: true, highlight: false },
      { text: 'Priority telehealth booking', included: true, highlight: false },
      { text: 'Advanced breathing coaching', included: true, highlight: false },
      { text: 'Offline mode', included: true, highlight: false },
      { text: 'Global watchlist alerts', included: true, highlight: false },
    ],
    scanLimit: 'unlimited',
    predictiveReportLimit: 'unlimited',
    profileLimit: 5,
    hasMealPlans: true,
    hasAdvancedBreathing: true,
    hasOfflineMode: true,
    hasGlobalWatchlist: true,
    hasBatchTracking: true,
    hasPriorityTelehealth: true,
    hasFounderBadge: false,
    hasFutureFeatures: false,
    stripePriceId: process.env.EXPO_PUBLIC_STRIPE_PRICE_FAMILY ?? null,
    monthlyEquivalent: '$16.58/mo',
  },

  {
    id: 'pro_yearly',
    name: 'Guardian Pro',
    displayOrder: 3,
    topBannerLabel: undefined,
    topBannerRight: undefined,
    floatingBadge: 'BEST VALUE',
    floatingBadgeColor: 'green',
    savingsBarLeft: '2 MONTHS FREE',
    savingsBarRight: 'SAVE $39.89/YEAR',
    strikethroughPrice: undefined,
    priceDisplay: '$6.66',
    pricePeriod: '/month',
    priceBilledAs: 'Billed $79.99/year',
    savingsBadgeText: '33% cheaper than monthly',
    savingsBadgeColor: 'green',
    equivalentText: '$9.99/mo if billed monthly',
    ctaLabel: 'Get 2 Months Free',
    ctaColor: 'green',
    ctaSubtext: undefined,
    fomoText: '47 people upgraded in last 24 hours',
    fomoColor: 'green',
    accentColor: '#2ED573',
    borderColor: 'rgba(46,213,115,0.25)',
    backgroundColor: '#020A14',
    features: [
      { text: 'Unlimited scans', included: true, highlight: true },
      { text: 'Unlimited predictive reports', included: true, highlight: true },
      { text: 'AI personalised meal plans', included: true, highlight: false },
      { text: 'Advanced breathing coaching', included: true, highlight: false },
      { text: 'Offline mode', included: true, highlight: false },
      { text: 'Global watchlist alerts', included: true, highlight: false },
      { text: 'Batch recall tracking', included: true, highlight: false },
      { text: 'Priority telehealth booking', included: true, highlight: false },
      { text: '5 family profiles', included: false, highlight: false },
    ],
    scanLimit: 'unlimited',
    predictiveReportLimit: 'unlimited',
    profileLimit: 1,
    hasMealPlans: true,
    hasAdvancedBreathing: true,
    hasOfflineMode: true,
    hasGlobalWatchlist: true,
    hasBatchTracking: true,
    hasPriorityTelehealth: true,
    hasFounderBadge: false,
    hasFutureFeatures: false,
    stripePriceId: process.env.EXPO_PUBLIC_STRIPE_PRICE_PRO_YEARLY ?? null,
    monthlyEquivalent: '$6.66/mo',
  },

  {
    id: 'pro_monthly',
    name: 'Guardian Pro',
    displayOrder: 4,
    topBannerLabel: undefined,
    topBannerRight: undefined,
    floatingBadge: undefined,
    floatingBadgeColor: 'none',
    savingsBarLeft: undefined,
    savingsBarRight: undefined,
    strikethroughPrice: undefined,
    priceDisplay: '$9.99',
    pricePeriod: '/month',
    priceBilledAs: 'Cancel anytime',
    savingsBadgeText: undefined,
    savingsBadgeColor: 'none',
    equivalentText: 'Save $39.89/year by choosing yearly',
    ctaLabel: 'Start Monthly',
    ctaColor: 'blue',
    ctaSubtext: undefined,
    fomoText: undefined,
    fomoColor: 'none',
    accentColor: '#1E90FF',
    borderColor: 'rgba(30,144,255,0.22)',
    backgroundColor: '#020A14',
    features: [
      { text: 'Unlimited scans', included: true, highlight: true },
      { text: 'Unlimited predictive reports', included: true, highlight: true },
      { text: 'All Pro features', included: true, highlight: false },
      { text: '5 family profiles', included: false, highlight: false },
    ],
    scanLimit: 'unlimited',
    predictiveReportLimit: 'unlimited',
    profileLimit: 1,
    hasMealPlans: true,
    hasAdvancedBreathing: true,
    hasOfflineMode: true,
    hasGlobalWatchlist: true,
    hasBatchTracking: true,
    hasPriorityTelehealth: false,
    hasFounderBadge: false,
    hasFutureFeatures: false,
    stripePriceId: process.env.EXPO_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ?? null,
    monthlyEquivalent: '$9.99/mo',
  },

  {
    id: 'free',
    name: 'Free Plan',
    displayOrder: 5,
    topBannerLabel: undefined,
    topBannerRight: undefined,
    floatingBadge: undefined,
    floatingBadgeColor: 'none',
    savingsBarLeft: undefined,
    savingsBarRight: undefined,
    strikethroughPrice: undefined,
    priceDisplay: '$0',
    pricePeriod: 'forever',
    priceBilledAs: 'No card required',
    savingsBadgeText: undefined,
    savingsBadgeColor: 'none',
    equivalentText: undefined,
    ctaLabel: 'Continue with Free',
    ctaColor: 'none',
    ctaSubtext: 'Missing full protection',
    fomoText: undefined,
    fomoColor: 'none',
    accentColor: 'rgba(240,244,255,0.35)',
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    features: [
      { text: '10 scans per month', included: true, highlight: false },
      { text: '5 predictive reports per month', included: true, highlight: false },
      { text: 'Basic AI health assistant', included: true, highlight: false },
      { text: 'A-F safety grades', included: true, highlight: false },
      { text: 'Unlimited scans', included: false, highlight: false },
      { text: 'Unlimited predictive reports', included: false, highlight: false },
      { text: 'AI meal plans', included: false, highlight: false },
      { text: 'Advanced breathing', included: false, highlight: false },
      { text: 'Offline mode', included: false, highlight: false },
      { text: 'Family profiles', included: false, highlight: false },
    ],
    scanLimit: 10,
    predictiveReportLimit: 5,
    profileLimit: 1,
    hasMealPlans: false,
    hasAdvancedBreathing: false,
    hasOfflineMode: false,
    hasGlobalWatchlist: false,
    hasBatchTracking: false,
    hasPriorityTelehealth: false,
    hasFounderBadge: false,
    hasFutureFeatures: false,
    stripePriceId: null,
    monthlyEquivalent: 'Free',
  },
];

export const FREE_PLAN = PLANS.find(p => p.id === 'free')!;
export const PAID_PLANS = PLANS.filter(p => p.id !== 'free');
export const DISPLAYED_PLANS = [...PLANS].sort((a, b) => a.displayOrder - b.displayOrder);

export function getPlanById(id: PlanId): SubscriptionPlan {
  return PLANS.find(p => p.id === id) ?? FREE_PLAN;
}

export function isPaidPlan(id: PlanId): boolean {
  return id !== 'free';
}

export function isPro(id: PlanId): boolean {
  return ['pro_monthly', 'pro_yearly', 'family', 'lifetime'].includes(id);
}

export function hasUnlimitedScans(id: PlanId): boolean {
  const plan = getPlanById(id);
  return plan.scanLimit === 'unlimited';
}

export function hasUnlimitedReports(id: PlanId): boolean {
  const plan = getPlanById(id);
  return plan.predictiveReportLimit === 'unlimited';
}

export function canAccessFeature(
  planId: PlanId,
  feature: keyof Pick<SubscriptionPlan,
    'hasMealPlans' | 'hasAdvancedBreathing' | 'hasOfflineMode' |
    'hasGlobalWatchlist' | 'hasBatchTracking' | 'hasPriorityTelehealth' |
    'hasFounderBadge' | 'hasFutureFeatures'>
): boolean {
  return getPlanById(planId)[feature];
}
---

Step 3.2 — Create lib/quotaManager.ts

---
import { supabase } from './supabase';
import { PlanId, isPro, hasUnlimitedScans, hasUnlimitedReports } from './subscriptionPlans';

export interface QuotaStatus {
  planId: PlanId;
  scansUsed: number;
  scansLimit: number | 'unlimited';
  scansRemaining: number | 'unlimited';
  percentScansUsed: number;
  reportsUsed: number;
  reportsLimit: number | 'unlimited';
  reportsRemaining: number | 'unlimited';
  percentReportsUsed: number;
  canScan: boolean;
  canGenerateReport: boolean;
  resetDate: string;
  isNearScanLimit: boolean;
  isAtScanLimit: boolean;
  isNearReportLimit: boolean;
  isAtReportLimit: boolean;
}

export async function getQuotaStatus(userId: string): Promise<QuotaStatus> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_plan')
    .eq('id', userId)
    .single();

  const planId = (profile?.subscription_plan ?? 'free') as PlanId;

  if (isPro(planId)) {
    return {
      planId,
      scansUsed: 0,
      scansLimit: 'unlimited',
      scansRemaining: 'unlimited',
      percentScansUsed: 0,
      reportsUsed: 0,
      reportsLimit: 'unlimited',
      reportsRemaining: 'unlimited',
      percentReportsUsed: 0,
      canScan: true,
      canGenerateReport: true,
      resetDate: '',
      isNearScanLimit: false,
      isAtScanLimit: false,
      isNearReportLimit: false,
      isAtReportLimit: false,
    };
  }

  const { data: quota } = await supabase
    .from('usage_quotas')
    .select('scans_used_this_month, predictive_reports_used_this_month, quota_reset_date')
    .eq('user_id', userId)
    .single();

  const scansUsed = quota?.scans_used_this_month ?? 0;
  const reportsUsed = quota?.predictive_reports_used_this_month ?? 0;
  const scanLimit = 10;
  const reportLimit = 5;

  const resetDate = quota?.quota_reset_date
    ? new Date(quota.quota_reset_date).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric',
      })
    : 'end of month';

  return {
    planId,
    scansUsed,
    scansLimit: scanLimit,
    scansRemaining: Math.max(0, scanLimit - scansUsed),
    percentScansUsed: Math.min(100, (scansUsed / scanLimit) * 100),
    reportsUsed,
    reportsLimit: reportLimit,
    reportsRemaining: Math.max(0, reportLimit - reportsUsed),
    percentReportsUsed: Math.min(100, (reportsUsed / reportLimit) * 100),
    canScan: scansUsed < scanLimit,
    canGenerateReport: reportsUsed < reportLimit,
    resetDate,
    isNearScanLimit: scansUsed >= 7 && scansUsed < scanLimit,
    isAtScanLimit: scansUsed >= scanLimit,
    isNearReportLimit: reportsUsed >= 4 && reportsUsed < reportLimit,
    isAtReportLimit: reportsUsed >= reportLimit,
  };
}

export async function incrementScanCount(userId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_scan_quota', { uid: userId });
  if (error) console.error('[quotaManager] increment scan error:', error.message);
}

export async function incrementReportCount(userId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_report_quota', { uid: userId });
  if (error) console.error('[quotaManager] increment report error:', error.message);
}

export async function getFounderSlotsRemaining(): Promise<number> {
  const { data } = await supabase
    .from('founder_slots')
    .select('total_slots, claimed_slots')
    .single();
  if (!data) return 373;
  return data.total_slots - data.claimed_slots;
}

export async function claimFounderSlot(userId: string): Promise<void> {
  await supabase.from('founder_slots').update({
    claimed_slots: supabase.rpc('increment_claimed_slots') as unknown as number,
  });
  await supabase.from('profiles').update({
    founder_member: true,
    subscription_plan: 'lifetime',
  }).eq('id', userId);
}
---

Step 3.3 — Add Stripe price IDs to app.config.ts

Open app.config.ts (or app.json). In the extra field add:

EXPO_PUBLIC_STRIPE_PRICE_LIFETIME: process.env.EXPO_PUBLIC_STRIPE_PRICE_LIFETIME,
EXPO_PUBLIC_STRIPE_PRICE_FAMILY: process.env.EXPO_PUBLIC_STRIPE_PRICE_FAMILY,
EXPO_PUBLIC_STRIPE_PRICE_PRO_YEARLY: process.env.EXPO_PUBLIC_STRIPE_PRICE_PRO_YEARLY,
EXPO_PUBLIC_STRIPE_PRICE_PRO_MONTHLY: process.env.EXPO_PUBLIC_STRIPE_PRICE_PRO_MONTHLY,

Add these to your .env file with the actual Stripe price IDs from your Stripe dashboard.
Use test mode price IDs during development. Never commit real keys.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 4 — SUBSCRIPTION SCREEN IMPLEMENTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 4.1 — Create the subscription screen

Create or fully replace app/settings/subscription.tsx.

This screen must match the approved mobile mockup pixel for pixel.
The approved design shows: Lifetime first, Family second, Pro Yearly third,
Pro Monthly fourth (visible when toggle switches to Monthly), Free last.

EXACT SCREEN STRUCTURE top to bottom:

───── SECTION: HEADER ─────
Position: top of ScrollView content, no sticky header
Content:
  TruWell AI shield SVG (36x36px, centered)
  Headline: "Upgrade Your Guardian" — fontSize 22, fontWeight 900,
    letterSpacing -0.5, color theme.text1, textAlign center
    "Guardian" word in Sovereign Gold (#C9A84C)
  Rotating subtitle: cycles through these 5 messages every 3 seconds
    with 300ms opacity fade transition:
    "47 databases. Your body. Zero compromises."
    "The EU banned 1,400 ingredients. The USA banned 11."
    "Your shampoo may be illegal in France."
    "126 chemicals absorbed before breakfast."
    "2,841 families protected this month."
    fontSize 11, color rgba(240,244,255,0.45), fontStyle italic

Implementation:
  const [msgIdx, setMsgIdx] = useState(0);
  const rotOpacity = useSharedValue(1);
  useEffect(() => {
    const interval = setInterval(() => {
      rotOpacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(setMsgIdx)(prev => (prev + 1) % ROTATING_MESSAGES.length);
        rotOpacity.value = withTiming(1, { duration: 300 });
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

───── SECTION: SOCIAL PROOF TICKER ─────
A single row below the header that auto-scrolls left infinitely.
Background: rgba(255,255,255,0.03)
Border top and bottom: 1px solid rgba(255,255,255,0.06)
Padding: 7px 0
Overflow: hidden

Items (duplicate the array twice for seamless loop):
  "2,841 families protected"  ·  "47 databases"  ·
  "1,247 professionals"  ·  "127 of 500 founder slots"  ·
  "50,000+ guardians"

Font: 10px, rgba(240,244,255,0.45), fontWeight 700
Gold dot separator (·) between items, color #C9A84C

Animation: Reanimated useSharedValue for translateX
  Start at 0, animate to -(totalWidth / 2), duration 16000ms,
  linear easing, withRepeat(-1, false)
  Use onLayout to measure total width before starting

───── SECTION: URGENCY BAR ─────
Full width below the proof ticker.
Background: rgba(255,71,87,0.09)
Border top and bottom: 1px solid rgba(255,71,87,0.20)
Padding: 8px 14px
Layout: row, alignItems center, gap 8

Left: pulsing red dot (7px circle, background #FF4757)
  Pulse: scale 1.0→1.4 opacity 1→0.4, 1.4s ease-in-out infinite

Center: "373 of 500 lifetime founder slots remaining"
  Fetch actual count from founder_slots table on mount
  fontSize 11, color #FF4757, fontWeight 700, flex 1

Right: countdown timer
  Start at a random value between 2-8 hours when screen mounts
  Count down every second
  Format: H:MM:SS
  fontSize 11, color #FF4757, fontWeight 800
  fontVariant: 'tabular-nums' for stable width

───── SECTION: BILLING TOGGLE ─────
Centered below urgency bar.
Padding: 10px 0 4px

Toggle pill:
  Background: rgba(255,255,255,0.05)
  Border: 1px solid rgba(255,255,255,0.09)
  Border radius: 999px
  Padding: 3px

Two buttons inside:
  "Monthly" and "Yearly"
  Default selected: Yearly

Active button:
  Background: #00E5C8, color #020A14, fontWeight 700
Inactive button:
  Background: transparent, color rgba(240,244,255,0.40)

Below toggle: "Save 33% yearly — 2 months free"
  fontSize 10, color #2ED573, fontWeight 700
  This line always visible regardless of toggle state

State: const [billingCycle, setBillingCycle] = useState<'yearly' | 'monthly'>('yearly');
When 'monthly': show pro_monthly card instead of pro_yearly card
When 'yearly': show pro_yearly card (default)

───── SECTION: PLAN CARDS ─────
Padding: 10px 12px
Gap between cards: 10px

Render DISPLAYED_PLANS in displayOrder (1 through 5).
For pro plans: render pro_yearly when billingCycle === 'yearly',
render pro_monthly when billingCycle === 'monthly'.
Always render lifetime, family, free regardless of toggle.

═══ CARD: LIFETIME FOUNDER ═══

Container:
  borderRadius: 18
  border: 1.5px solid rgba(201,168,76,0.40)
  backgroundColor: '#080D08'
  overflow: hidden
  Entry animation: scaleX 0.95→1, opacity 0→1, 500ms spring,
    damping 20, stiffness 200, delay 50ms

TOP BANNER (inside card, top):
  backgroundColor: '#C9A84C'
  padding: 8px 14px
  flexDirection: row, justifyContent: space-between, alignItems: center
  Left: "LIFETIME FOUNDER" — fontSize 10, fontWeight 800, color #020A14, letterSpacing 2
  Right: "500 SLOTS ONLY" — fontSize 8, fontWeight 700, color rgba(2,10,20,0.65), letterSpacing 1

CARD BODY (padding: 14px):

  Row: left column + right stat box
  Left:
    Strikethrough price: "$599 original" — fontSize 12, color rgba(240,244,255,0.30), textDecoration line-through
    Price row: "$249" (fontSize 38, fontWeight 800, letterSpacing -1.5, color #C9A84C)
      + "one-time" (fontSize 12, color rgba(240,244,255,0.50), alignSelf flex-end, marginBottom 6)
    Savings badge: "Save $350 · 58% off" — gold tinted pill (background rgba(201,168,76,0.10),
      border rgba(201,168,76,0.22), borderRadius 999, padding 3px 10px, fontSize 9, fontWeight 800, color #C9A84C)

  Right stat box:
    background: rgba(201,168,76,0.09), border rgba(201,168,76,0.22), borderRadius 10, padding 6px 10px
    "127" — fontSize 18, fontWeight 800, color #C9A84C, letterSpacing -0.5
    "CLAIMED" — fontSize 7, color rgba(201,168,76,0.60), fontWeight 700, letterSpacing 1

  Equivalent line: "= $1.38/month over 15 years"
    fontSize 10, color rgba(240,244,255,0.30), fontStyle italic, marginTop 4

  FOUNDER SLOTS PROGRESS BAR:
    marginTop: 10, marginBottom: 8
    Row: "Founder slots" left + "373/500 available" right
      Both: fontSize 10, color rgba(240,244,255,0.35)
      Right color: #C9A84C
    Track: height 5, background rgba(255,255,255,0.06), borderRadius 3
    Fill: width 25.4% (127/500), background #C9A84C, borderRadius 3
    Animate fill width on mount: useSharedValue(0) → withTiming(0.254 * trackWidth, { duration: 1200, easing: Easing.out(Easing.cubic) })

  DIVIDER: height 1, background rgba(255,255,255,0.06), marginVertical 10

  FEATURES LIST:
    Display all 11 features from PLANS lifetime.features
    Each feature row: flexDirection row, alignItems flex-start, gap 8, marginBottom 6

    Check circle (for included features):
      width: 16, height: 16, borderRadius: 8
      background: rgba(201,168,76,0.15), border: rgba(201,168,76,0.30)
      Contains: "✓" fontSize 8, fontWeight 800, color #C9A84C, centered

    X circle (for excluded):
      background: rgba(255,255,255,0.04), border: rgba(255,255,255,0.10)
      Contains: "✗" fontSize 8, color rgba(240,244,255,0.18)

    Feature text:
      highlight: true → fontSize 12, fontWeight 700, color #F0F4FF
      highlight: false → fontSize 12, fontWeight 400, color rgba(240,244,255,0.72)
      excluded → fontSize 12, color rgba(240,244,255,0.18), textDecoration line-through

    Badge pills (NEW, EXCLUSIVE) inline after feature text:
      fontSize 8, fontWeight 800, padding 2px 6px, borderRadius 999
      background rgba(201,168,76,0.12), border rgba(201,168,76,0.25), color #C9A84C

  CTA BUTTON:
    width: '100%', height: 56, borderRadius: 14
    backgroundColor: '#C9A84C'
    Text: "Claim Founder Status" — fontSize 15, fontWeight 800, color #020A14
    Shimmer animation: white gradient strip sweeps left to right over button, 3s infinite
    Active: scale 0.97 with spring
    Haptic: notificationAsync(Success) on press

  CTA SUBTEXT: "Secure payment via Stripe · Instant access"
    fontSize 9, color rgba(240,244,255,0.30), textAlign center, marginTop 5

  FOMO STRIP:
    flexDirection row, alignItems center, gap 6
    background rgba(255,71,87,0.06), borderRadius 10, padding 7px 10px, marginTop 8
    Red pulsing dot (6px) + "373 founder slots — never restocked"
    fontSize 10, fontWeight 700, color #FF4757
    Slot count fetched from Supabase founder_slots table

═══ CARD: FAMILY GUARDIAN ═══

Container:
  borderRadius: 18, overflow: hidden, position: relative
  border: 1.5px solid rgba(0,229,200,0.30)
  backgroundColor: '#050D12'
  marginTop: 8 (gap from previous card handled by parent)
  paddingTop: 14 (space for floating badge)
  Entry animation: scale 0.96→1, opacity 0→1, 500ms spring, delay 100ms

FLOATING BADGE (drooping from top center):
  position: absolute, top: -1, alignSelf: center
  background: rgba(0,229,200,0.12)
  border: 1px solid rgba(0,229,200,0.28) (no top border)
  borderRadius: 0 0 9 9
  padding: 4px 12px
  Text: "MOST POPULAR" — fontSize 9, fontWeight 800, color #00E5C8, letterSpacing 1.5

CARD BODY (padding: 14px, paddingTop: 8):

  Sub-header row:
    Left: family icon SVG (16x16, teal strokes) + "Family Guardian" (fontSize 12, color #00E5C8, fontWeight 700)
    Right: "5 People" chip — background rgba(0,229,200,0.09), border rgba(0,229,200,0.18),
      borderRadius 999, padding 3px 9px, fontSize 9, fontWeight 800, color #00E5C8

  Strikethrough: "$29.99/month" — fontSize 12, color rgba(240,244,255,0.30), textDecoration line-through
  Price row: "$16.58" (fontSize 36, fontWeight 800, letterSpacing -1.5, color #00E5C8) + "/month"
  Savings badge: "Save $159/year vs individual plans" — green tinted pill
  Equivalent: "Less than coffee per week" — fontSize 10, italic, color rgba(240,244,255,0.30)

  DIVIDER

  FEATURES: 10 features with teal check circles (background rgba(0,229,200,0.12), border rgba(0,229,200,0.25))

  CTA BUTTON:
    backgroundColor: '#00E5C8', text color: '#020A14'
    Label: "Protect My Family Now"

  FOMO STRIP:
    Teal dot + "2,841 families protected this month" — color #00E5C8

═══ CARD: GUARDIAN PRO YEARLY (shown when billingCycle === 'yearly') ═══

Container:
  borderRadius: 18, position: relative
  border: 1px solid rgba(46,213,115,0.25)
  backgroundColor: '#020A14'
  paddingTop: 12 (space for floating badge)
  Entry animation: scale 0.96→1, opacity 0→1, 500ms spring, delay 150ms

FLOATING BADGE: "BEST VALUE" — green version (same structure as family badge)
  background rgba(46,213,115,0.10), border rgba(46,213,115,0.22)
  Text color: #2ED573

SAVINGS BAR (below floating badge, before card body):
  background rgba(46,213,115,0.07)
  borderBottom: 1px solid rgba(46,213,115,0.12)
  padding: 6px 14px
  flexDirection: row, justifyContent: space-between
  Left: "2 MONTHS FREE" — fontSize 9, fontWeight 800, color #2ED573, letterSpacing 1.2
  Right: "SAVE $39.89/YEAR" — same style

CARD BODY (padding: 14px, paddingTop: 10):

  Price row: "$6.66" (fontSize 36, fontWeight 800, letterSpacing -1.5, color #2ED573) + "/month"
  Billed as: "Billed $79.99/year" — fontSize 10, italic, color rgba(240,244,255,0.35)
  Savings badge: "33% cheaper than monthly" — green pill
  Equivalent: "$9.99/mo if billed monthly" — fontSize 10, italic, muted

  Comparison nudge box:
    background rgba(46,213,115,0.06), border rgba(46,213,115,0.14), borderRadius 10, padding 6px 10px
    ONLY visible when billingCycle === 'yearly'
    Text: "2 months free vs paying monthly" — fontSize 10, color #2ED573, fontWeight 700

  DIVIDER

  FEATURES: 9 features with green check circles

  CTA BUTTON: backgroundColor '#2ED573', label "Get 2 Months Free", text '#020A14'

  FOMO: Green dot + "47 people upgraded in last 24 hours"

═══ CARD: GUARDIAN PRO MONTHLY (shown when billingCycle === 'monthly') ═══

Container:
  borderRadius: 16
  border: 1px solid rgba(30,144,255,0.22)
  backgroundColor: '#020A14'
  This card is deliberately less prominent than the yearly card

Pre-price note (italic, small, muted):
  "Or start monthly — no commitment"
  fontSize 10, color rgba(240,244,255,0.30), fontStyle italic, marginBottom 5

Price row: "$9.99" (fontSize 32, fontWeight 800, color #1E90FF) + "/month"
Billed as: "Cancel anytime" — fontSize 10, italic, muted

NUDGE BOX (pushes user back to yearly):
  background rgba(46,213,115,0.06), border rgba(46,213,115,0.14), borderRadius 10, padding 7px 10px
  "Save $39.89/year by choosing yearly above" — fontSize 10, color #2ED573, fontWeight 700

FEATURES: 4 features (shorter list, less impressive)

CTA BUTTON: height 50px (shorter than other CTAs — intentionally less prominent)
  backgroundColor rgba(30,144,255,0.85), color #F0F4FF
  Label: "Start Monthly"

NO FOMO strip on this card — deliberate

═══ CARD: FREE PLAN ═══

Container:
  borderRadius: 14
  border: 1px solid rgba(255,255,255,0.07)
  backgroundColor: rgba(255,255,255,0.02)
  This card must look visually weak by contrast

SINGLE ROW LAYOUT (not expanded):
  padding: 12px 14px, flexDirection: row, alignItems: center

  Left:
    "Free Plan" — fontSize 13, fontWeight 600, color rgba(240,244,255,0.38)
    "10 scans · 5 reports · basic only" — fontSize 10, color rgba(240,244,255,0.20)

  Right (text link, NOT a button):
    "Continue →" — fontSize 11, fontWeight 700, color rgba(240,244,255,0.30)
    onPress: navigation.goBack() or router.back()

BELOW ROW:
  "Missing full protection. Upgrade anytime."
  fontSize 9, color rgba(240,244,255,0.18), textAlign center, fontStyle italic
  padding: 0 14px 10px

───── SECTION: TRUST BADGES ─────
Below all cards.
Section label: "Why thousands trust us" — fontSize 9, fontWeight 700, letterSpacing 3,
  color #00E5C8, textTransform uppercase, textAlign center, padding: 10px 0 4px

2x2 grid (gap 8px, padding 0 12px 10px):

Card 1: Lock icon + "Stripe secured" + "256-bit SSL"
Card 2: Checkmark icon + "Cancel anytime" + "No questions"
Card 3: Plus icon + "Instant access" + "Activated now"
Card 4: Star icon + "7-day refund" + "If not satisfied"

Each trust card:
  background rgba(255,255,255,0.025)
  border 1px solid rgba(255,255,255,0.06)
  borderRadius 12, padding 9px 11px, textAlign center

  Icon container: 22x22px circle, background rgba(0,229,200,0.09), centered
  Icon: 12x12 SVG, teal strokes

  Title: fontSize 11, fontWeight 700, color rgba(240,244,255,0.65), marginBottom 1
  Subtitle: fontSize 9, color rgba(240,244,255,0.30)

───── SECTION: BOTTOM SPACER ─────
height: 16px to clear the safe area

Step 4.2 — Purchase flow

When any paid CTA is tapped:

1. Show loading state on the button (spinner replaces text, button stays same size)
2. Call the existing Stripe checkout function from lib/stripe.ts (or wherever it lives)
   Pass the plan's stripePriceId
   For lifetime plan also call claimFounderSlot(userId) after payment confirms

3. On successful payment:
   a. UPDATE profiles.subscription_plan = planId for the user
   b. INSERT into subscription_events table
   c. Show SuccessModal (Step 4.3)

4. On payment error:
   Alert.alert with error message, no crash

Step 4.3 — Success modal after purchase

Create components/subscription/PurchaseSuccessModal.tsx:

Full screen modal (animationType: 'fade'):
Background: '#020A14'

Center content (animated in with Reanimated spring):
  Large shield SVG (80x80px, gold glow)
  Confetti particles (30 particles, Reanimated, radial burst)
  Headline: "You are now a [Plan Name] Guardian"
    fontSize 24, fontWeight 900, color #F0F4FF, textAlign center
  Plan-specific body text:
    lifetime: "You are now one of the 127 Founders. Your protection is permanent. Every scan, every report, every future feature — yours forever."
    family: "Your family is now fully protected. 5 profiles, unlimited scans. What hides in the label no longer hides from you."
    pro_yearly or pro_monthly: "Unlimited protection activated. Scan anything. Know everything."
  "Continue" button → dismisses modal → router.replace to home or previous screen

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 5 — REUSABLE UPGRADE COMPONENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 5.1 — Quota warning banner

Create components/subscription/QuotaWarningBanner.tsx:

Props:
  quotaStatus: QuotaStatus
  onUpgrade: () => void
  type: 'scan' | 'report'

Three visual states based on usage:

STATE 1 — Approaching limit (scans >= 7, reports >= 4):
  background: rgba(255,165,2,0.08), border rgba(255,165,2,0.20)
  Amber pulsing dot + "3 free scans remaining this month" (or reports)
  Right: "Upgrade" — teal text link (no button)

STATE 2 — One remaining (scans === 9, reports === 4):
  background: rgba(255,71,87,0.08), border rgba(255,71,87,0.25)
  Red pulsing dot + "Last free scan remaining"
  Right: "Upgrade Now" — small teal pill button

STATE 3 — Limit reached (scans >= 10, reports >= 5):
  background: rgba(255,71,87,0.12), border rgba(255,71,87,0.40)
  padding: 14px
  Title: "Monthly [scan/report] limit reached" — fontSize 14, fontWeight 700, color #FF4757
  Body: "You have used all [10 scans / 5 reports] for [month]. Upgrade to Guardian Pro for unlimited [scans/reports]."
  CTA button: full width, teal, "Unlock Unlimited [Scans/Reports]"
  Below: "Resets on [reset date] if you stay on free" — fontSize 10, muted, italic

Animations:
  Entry: translateY -20→0, opacity 0→1, 350ms spring
  Exit: translateY 0→-20, opacity 1→0, 250ms ease

Step 5.2 — Inline upgrade prompt card

Create components/subscription/UpgradePromptCard.tsx:

Props:
  featureName: string
  description: string
  highlightedPlan?: PlanId (default 'pro_yearly')
  onUpgrade: () => void

Visual:
  background rgba(201,168,76,0.06)
  border 1px solid rgba(201,168,76,0.25)
  borderRadius 18, padding 14px
  Left accent strip: position absolute, left 0, top 0, bottom 0, width 4, background #C9A84C,
    borderRadius 4 0 0 4

  Header row: gold lock SVG icon (18px) + "Pro Feature" gold pill badge

  Title: [featureName] — fontSize 14, fontWeight 700, color #F0F4FF
  Description: [description] — fontSize 12, color rgba(240,244,255,0.55), marginTop 4

  CTA button: full width, 50px, gold gradient
    "Unlock [featureName]" — fontSize 14, fontWeight 800, color #020A14
    onPress: router.push('/settings/subscription')

  Below button: "From $6.66/month · Cancel anytime"
    fontSize 10, color rgba(240,244,255,0.30), textAlign center, marginTop 5

Step 5.3 — Mini upgrade chip (for inline use)

Create components/subscription/UpgradeChip.tsx:

Props: onPress: () => void, label?: string

Tiny tappable chip used inline next to feature names:
  background rgba(201,168,76,0.10), border rgba(201,168,76,0.25), borderRadius 999
  padding 3px 8px
  Text: label ?? "Upgrade" — fontSize 9, fontWeight 800, color #C9A84C
  Gold lock icon (10px) to left of text

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 6 — QUOTA GATES ACROSS THE APP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 6.1 — Scan screen quota gate

Find the scan screen file (app/(tabs)/scan.tsx or similar).

Before allowing a scan:
1. Call getQuotaStatus(userId)
2. If isAtScanLimit: show QuotaWarningBanner (STATE 3) above the camera view
   Block the scan — camera view still shows but capture button is disabled and grey
3. If isNearScanLimit: show QuotaWarningBanner (STATE 1 or 2) below the top bar
   Scan still allowed
4. After a successful scan result: call incrementScanCount(userId)

Do not change ANY existing scan logic, camera implementation, or result display.
Only add the quota check before allowing capture and the increment after success.

Step 6.2 — Predictive report quota gate

Find wherever predictive reports render (from PHASE 4 of TRUWELL_ONBOARDING_IMPLEMENTATION.md context, likely in scan result screen).

Before generating a predictive report:
1. Call getQuotaStatus(userId)
2. If isAtReportLimit: replace the predictive report section with UpgradePromptCard
   featureName: "Predictive Impact Reports"
   description: "You have used all 5 free reports this month. Upgrade for unlimited health impact analysis."
3. If isNearReportLimit: show QuotaWarningBanner (STATE 1) above the report section
4. After generating report: call incrementReportCount(userId)

Step 6.3 — AI meal plans gate

Find the meal plan section in wellness screen or wherever it renders.

If user is free plan (not isPro):
  Replace the meal plan generator with UpgradePromptCard:
    featureName: "AI Meal Plans"
    description: "Generate personalised 7-day meal plans with grocery lists tailored to your health profile and goals."
  The card replaces the entire meal plan area — no partial access

Step 6.4 — Advanced breathing coaching gate

Find the breathing exercises grid in the breathing hub.

For each exercise where isPro: true in BREATHING_EXERCISES:
  Show the exercise card but with a gold lock overlay:
    Overlay: position absolute, inset 0, background rgba(2,10,20,0.75)
    Center: UpgradeChip component
    Tapping the overlay or chip: router.push('/settings/subscription')

Step 6.5 — Offline mode gate

If user attempts to access any offline/downloaded content:
  Check if canAccessFeature(planId, 'hasOfflineMode')
  If false: show UpgradePromptCard inline

Step 6.6 — Batch tracking gate

In scan result screen, where batch/QR data displays:
  Check canAccessFeature(planId, 'hasBatchTracking')
  If false: show blurred/obscured batch card with UpgradeChip overlay

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 7 — PROFILE SCREEN SUBSCRIPTION STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 7.1 — Update app/(tabs)/profile.tsx subscription section

Find the subscription row or section in the profile screen.
Replace it with context-aware subscription status display.

FOR FREE USERS:
Show a prominent upgrade card ABOVE the settings groups list.

Card structure:
  background: linear feel — teal-to-gold subtle tint
  border 1px solid rgba(201,168,76,0.25), borderRadius 18, padding 14px

  Header row: "Guardian Free" badge (glass pill, left) + "Upgrade" link (right, gold)

  Quota bars section:
    "Scans this month" — progress bar, gold fill
    Current: "[X] of 10 used" — numbers update from QuotaStatus
    "Reports this month" — progress bar, gold fill
    Current: "[X] of 5 used"
    Below bars: "Resets [reset date]" — fontSize 10, muted

  CTA button: full width, 50px, gold gradient
    "Upgrade for Unlimited Protection"
    onPress: router.push('/settings/subscription')

FOR PRO MONTHLY / PRO YEARLY:
Clean status card, no urgent upsell.

  background rgba(0,229,200,0.05), border rgba(0,229,200,0.25), borderRadius 18, padding 14px
  Left accent: 4px teal strip

  Row: shield checkmark icon (teal) + plan name + "Active" green pill
  "Guardian [Pro/Pro Yearly]" — fontSize 14, fontWeight 700, color #00E5C8
  "Unlimited scans · Full protection" — fontSize 11, color rgba(240,244,255,0.45)

  If plan expires: "Renews [date]" — fontSize 10, muted
  "Manage subscription" text link → router.push('/settings/subscription')

FOR FAMILY:
Same teal status card but shows:
  "Family Guardian — 5 profiles"
  Row of 5 avatar initials circles below

FOR LIFETIME FOUNDER:
Gold status card — most premium treatment.

  background rgba(201,168,76,0.08), border rgba(201,168,76,0.35), borderRadius 18, padding 14px
  Left accent: 4px gold strip

  Crown SVG icon + "Lifetime Founder"
  "Unlimited everything · Forever" — fontSize 11, muted
  Founder badge (crown SVG) inline next to user name at top of profile

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 8 — ENVIRONMENT VARIABLES AND STRIPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 8.1 — Find the existing Stripe integration

Run: find lib/ services/ -name "*.ts" | xargs grep -l "stripe\|Stripe" 2>/dev/null

Show the full content of every Stripe-related file found.

Step 8.2 — Integrate plan IDs into existing Stripe checkout

Find the function that initiates a Stripe payment or checkout session.
Update it to accept a planId parameter and use the matching stripePriceId from PLANS.

The checkout function must:
1. Accept planId: PlanId as parameter
2. Look up stripePriceId from getPlanById(planId).stripePriceId
3. If stripePriceId is null: show Alert "Plan not available. Please contact support."
4. Otherwise: proceed with existing Stripe checkout flow
5. On success callback: update profiles.subscription_plan = planId in Supabase
6. On success: INSERT into subscription_events with event_type, plan, amount

Do NOT change the Stripe SDK configuration, keys, or payment sheet setup.
Only change how the price ID is passed and how the result is stored.

Step 8.3 — Add required .env entries

Add to your .env file (DO NOT COMMIT):
EXPO_PUBLIC_STRIPE_PRICE_LIFETIME=price_xxxxx (from Stripe dashboard)
EXPO_PUBLIC_STRIPE_PRICE_FAMILY=price_xxxxx
EXPO_PUBLIC_STRIPE_PRICE_PRO_YEARLY=price_xxxxx
EXPO_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_xxxxx

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 9 — NAVIGATION REGISTRATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 9.1 — Root layout Stack registration

In app/_layout.tsx confirm this screen is registered:
<Stack.Screen name="settings/subscription" options={{ headerShown: false }} />

If missing: add it.

Step 9.2 — Entry points to subscription screen

These locations must all navigate to '/settings/subscription':
1. Profile screen → Subscription row in settings group
2. Profile screen → "Upgrade for Unlimited Protection" card CTA
3. Scan screen → QuotaWarningBanner "Upgrade Now" button
4. Any UpgradePromptCard component CTA button
5. Any UpgradeChip component tap
6. Breathing hub → locked exercise overlay tap
7. Meal plan section → upgrade prompt CTA

All use: router.push('/settings/subscription')

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 10 — ANIMATION SPECIFICATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All animations use react-native-reanimated v3. No React Native Animated API.

Plan card entry animations (staggered):
  Lifetime: delay 50ms
  Family: delay 100ms
  Pro (yearly or monthly): delay 150ms
  Free: delay 0ms (no animation — it is meant to be unimpressive)

Each card: scale 0.96→1.0, opacity 0→1
  Duration: 500ms
  Spring: withSpring, damping 20, stiffness 200
  Use useAnimatedStyle with useSharedValue

Pulsing dots (urgency bar, fomo strips):
  useSharedValue(1) for scale
  withRepeat(withSequence(withTiming(1.4, {duration:700}), withTiming(1.0, {duration:700})), -1, false)
  opacity: withRepeat(withSequence(withTiming(0.4, {duration:700}), withTiming(1.0, {duration:700})), -1, false)

Founder slots progress bar fill:
  useSharedValue(0) → withTiming(targetWidth, {duration:1200, easing: Easing.out(Easing.cubic)})
  Start animation on screen mount with 300ms delay

CTA button shimmer (Lifetime, Family, Pro CTA buttons):
  Use a white LinearGradient overlay (opacity 0.12) that translates across the button
  translateX: -buttonWidth → buttonWidth
  Duration: 2500ms, linear, withRepeat(-1, false), delay varies per button

Social proof ticker:
  translateX: 0 → -(totalContentWidth / 2)
  Duration: 16000ms, linear, withRepeat(-1, false)
  Measure content width with onLayout before starting

Rotating hero message:
  Fade out: withTiming(0, {duration:300})
  Update text in runOnJS callback
  Fade in: withTiming(1, {duration:300})
  Every 3000ms via useEffect setInterval

Countdown timer:
  useEffect with setInterval every 1000ms
  Update local state (no animation needed — tabular-nums handles layout)
  Start value: random between 7200 and 28800 seconds (2-8 hours)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 11 — FINAL CHECKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 11.1 — TypeScript

Run: npx tsc --noEmit
Expected: zero errors
Fix every error before proceeding. Do not use @ts-ignore or any type.

Step 11.2 — Dead code check

Run: grep -r "isPro\|subscription_tier.*pro\|plan.*===.*pro" app/ components/ --include="*.tsx"
For each match verify it now uses isPro(planId) from subscriptionPlans.ts not the old pattern.
Fix any that still use the old check.

Step 11.3 — Single source of truth verification

Run: grep -r "Guardian Pro\|\$9.99\|\$6.66\|\$16.58\|\$249" app/ components/ --include="*.tsx"
Every match should be inside subscription.tsx or subscriptionPlans.ts ONLY.
If any plan pricing appears hardcoded elsewhere: move it to use getPlanById().priceDisplay instead.

Step 11.4 — Build

Run: npx expo start --clear then Ctrl+C
Run: npx expo run:android

Step 11.5 — Manual test checklist

TEST 1 — Subscription screen visual order:
Open Profile → Subscription
Verify top to bottom: Lifetime (gold banner) → Family (teal badge) →
  Pro Yearly (green savings bar) → Free (barely visible)
PASS or FAIL?

TEST 2 — Billing toggle:
Default state: Yearly selected, Pro Yearly card visible at $6.66
Tap Monthly: Pro Monthly card appears at $9.99 with "save $39 by choosing yearly" nudge
Tap Yearly again: reverts to $6.66 card
PASS or FAIL?

TEST 3 — Countdown timer:
Open subscription screen
Verify red timer in urgency bar is counting down in real time
PASS or FAIL?

TEST 4 — Social proof ticker:
Verify proof strip auto-scrolls left continuously without interruption
PASS or FAIL?

TEST 5 — Card animations:
Close and reopen screen
Verify cards animate in with staggered spring entrance
PASS or FAIL?

TEST 6 — Scan quota enforcement:
Log in as free user who has done 10 scans (manually update usage_quotas in Supabase for testing)
Go to scan tab
Verify: camera shows but capture button disabled, QuotaWarningBanner state 3 visible
Tap upgrade button in banner: goes to subscription screen
PASS or FAIL?

TEST 7 — Report quota enforcement:
As free user, after 5 reports, go to predictive report section
Verify: UpgradePromptCard replaces the report section
PASS or FAIL?

TEST 8 — Pro feature locks:
As free user navigate to breathing hub
Verify: Wim Hof, Kapalbhati, and other isPro exercises show lock overlay
Tap lock overlay: goes to subscription screen
PASS or FAIL?

TEST 9 — Profile subscription status:
As free user: verify quota bars visible in profile with upgrade card
As pro user: verify clean teal status card, no upgrade pressure
PASS or FAIL?

TEST 10 — Stripe integration:
Tap "Claim Founder Status"
Verify: Stripe payment sheet opens with correct price
Complete with test card 4242 4242 4242 4242, exp 12/28, CVC 123
Verify: success modal appears with founder-specific message
Verify: profiles.subscription_plan updated to 'lifetime' in Supabase
Verify: subscription_events row inserted
PASS or FAIL?

Step 11.6 — Report output

After all tests complete provide:
1. List of every file created
2. List of every file modified
3. List of every file deleted
4. Confirmation of zero TypeScript errors
5. Pass/Fail for each of the 10 tests above
6. Any known limitations or items requiring attention


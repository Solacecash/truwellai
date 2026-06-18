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
  hasFounderBadge: boolean;
  hasFutureFeatures: boolean;
  monthlyEquivalent: string;
}

export const PLANS: SubscriptionPlan[] = [
  {
    id: 'lifetime',
    name: 'Lifetime Founder',
    displayOrder: 1,
    topBannerLabel: '⚡ LIFETIME FOUNDER',
    topBannerRight: 'PRICE RISES TO $249 AT 500',
    floatingBadge: undefined,
    floatingBadgeColor: 'none',
    savingsBarLeft: undefined,
    savingsBarRight: undefined,
    strikethroughPrice: '$249 one-time',
    priceDisplay: '$149',
    pricePeriod: 'one-time',
    priceBilledAs: 'Pay once · own forever · no renewals',
    savingsBadgeText: 'Save $100 forever · 40% off',
    savingsBadgeColor: 'gold',
    equivalentText: '= $0.83/mo over 15 years vs $6.99/mo forever',
    ctaLabel: 'Claim Founder Status · Save $100',
    ctaColor: 'gold',
    ctaSubtext: 'One-time payment · no subscription ever',
    fomoText: 'Only [N] founder slots left · price rises to $249',
    fomoColor: 'red',
    accentColor: '#C9A84C',
    borderColor: 'rgba(201,168,76,0.40)',
    backgroundColor: '#080D08',
    features: [
      { text: 'Unlimited scans · pay once, own forever', included: true, highlight: true, badge: 'EXCLUSIVE' },
      { text: 'All future features included', included: true, highlight: true, badge: 'EXCLUSIVE' },
      { text: '5 family profiles', included: true, highlight: true },
      { text: 'Founder badge on profile', included: true, highlight: true, badge: 'NEW' },
      { text: 'Unlimited predictive reports', included: true, highlight: false },
      { text: 'AI meal plans', included: true, highlight: false },
      { text: 'Advanced breathing coaching', included: true, highlight: false },
      { text: 'Offline mode', included: true, highlight: false },
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
    hasFounderBadge: true,
    hasFutureFeatures: true,
    monthlyEquivalent: '$0.83/mo over 15 years',
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
    strikethroughPrice: '$15.99/mo',
    priceDisplay: '$10.83',
    pricePeriod: '/mo',
    priceBilledAs: 'Billed $129.96/year · includes 5 accounts',
    savingsBadgeText: 'Save $62.00/year vs monthly',
    savingsBadgeColor: 'green',
    equivalentText: 'Includes 5 accounts · less than coffee per week',
    ctaLabel: 'Protect My Family · Save $62/year',
    ctaColor: 'teal',
    ctaSubtext: undefined,
    fomoText: 'Includes 5 accounts · price locks today',
    fomoColor: 'teal',
    accentColor: '#00E5C8',
    borderColor: 'rgba(0,229,200,0.30)',
    backgroundColor: '#050D12',
    features: [
      { text: '5 individual health profiles included', included: true, highlight: true },
      { text: 'Children safety mode', included: true, highlight: true },
      { text: 'Pregnancy and allergy alerts', included: true, highlight: true },
      { text: 'Unlimited scans for all profiles', included: true, highlight: false },
      { text: 'Unlimited predictive reports', included: true, highlight: false },
      { text: 'AI meal plans per profile', included: true, highlight: false },
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
    hasFounderBadge: false,
    hasFutureFeatures: false,
    monthlyEquivalent: '$10.83/mo billed yearly',
  },

  {
    id: 'pro_yearly',
    name: 'TruWell Pro',
    displayOrder: 3,
    topBannerLabel: undefined,
    topBannerRight: undefined,
    floatingBadge: 'BEST VALUE FOR INDIVIDUALS',
    floatingBadgeColor: 'green',
    savingsBarLeft: '2 MONTHS FREE',
    savingsBarRight: 'SAVE $24.00/YEAR',
    strikethroughPrice: '$6.99/mo',
    priceDisplay: '$4.99',
    pricePeriod: '/mo',
    priceBilledAs: 'Billed $59.88/year · 2 months free',
    savingsBadgeText: 'Save $24.00/year vs monthly',
    savingsBadgeColor: 'green',
    equivalentText: 'Best value for individuals',
    ctaLabel: 'Get 2 Months Free · $59.88/yr',
    ctaColor: 'green',
    ctaSubtext: undefined,
    fomoText: 'Best value for individuals · most popular plan',
    fomoColor: 'green',
    accentColor: '#2ED573',
    borderColor: 'rgba(46,213,115,0.25)',
    backgroundColor: '#020A14',
    features: [
      { text: 'Unlimited scans forever', included: true, highlight: true },
      { text: 'Unlimited AI safety reports', included: true, highlight: true },
      { text: 'AI personalised meal plans', included: true, highlight: false },
      { text: 'Advanced breathing coaching', included: true, highlight: false },
      { text: 'Offline mode', included: true, highlight: false },
      { text: 'Global watchlist alerts', included: true, highlight: false },
      { text: 'Batch recall tracking', included: true, highlight: false },
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
    hasFounderBadge: false,
    hasFutureFeatures: false,
    monthlyEquivalent: '$4.99/mo billed yearly',
  },

  {
    id: 'pro_monthly',
    name: 'TruWell Pro',
    displayOrder: 4,
    topBannerLabel: undefined,
    topBannerRight: undefined,
    floatingBadge: undefined,
    floatingBadgeColor: 'none',
    savingsBarLeft: undefined,
    savingsBarRight: undefined,
    strikethroughPrice: '$9.99/mo',
    priceDisplay: '$6.99',
    pricePeriod: '/mo',
    priceBilledAs: '7-day free trial · cancel anytime',
    savingsBadgeText: 'Save 30% instantly',
    savingsBadgeColor: 'green',
    equivalentText: 'Save $24.00/year by switching to yearly',
    ctaLabel: 'Start Free 7-Day Trial',
    ctaColor: 'blue',
    ctaSubtext: 'Then $6.99/mo · cancel before trial ends',
    fomoText: '7-day free trial · no charge until day 8',
    fomoColor: 'teal',
    accentColor: '#1E90FF',
    borderColor: 'rgba(30,144,255,0.22)',
    backgroundColor: '#020A14',
    features: [
      { text: 'Unlimited scans · 7-day free trial', included: true, highlight: true },
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
    hasFounderBadge: false,
    hasFutureFeatures: false,
    monthlyEquivalent: '$6.99/mo',
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
    ctaSubtext: '10 scans only · upgrade for full protection',
    fomoText: undefined,
    fomoColor: 'none',
    accentColor: 'rgba(240,244,255,0.35)',
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    features: [
      { text: '10 product scans per month', included: true, highlight: false },
      { text: '3 predictive AI reports per month', included: true, highlight: false },
      { text: '20 AI assistant questions per month', included: true, highlight: false },
      { text: 'A-F safety grades', included: true, highlight: false },
      { text: 'Unlimited scans', included: false, highlight: false },
      { text: 'Unlimited predictive reports', included: false, highlight: false },
      { text: 'AI meal plans', included: false, highlight: false },
      { text: 'Advanced breathing', included: false, highlight: false },
      { text: 'Offline mode', included: false, highlight: false },
      { text: 'Family profiles', included: false, highlight: false },
    ],
    scanLimit: 10,
    predictiveReportLimit: 3,
    profileLimit: 1,
    hasMealPlans: false,
    hasAdvancedBreathing: false,
    hasOfflineMode: false,
    hasGlobalWatchlist: false,
    hasBatchTracking: false,
    hasFounderBadge: false,
    hasFutureFeatures: false,
    monthlyEquivalent: 'Free',
  },
];

export const FREE_PLAN = PLANS.find(p => p.id === 'free')!;
export const PAID_PLANS = PLANS.filter(p => p.id !== 'free');
export const DISPLAYED_PLANS = [...PLANS].sort((a, b) => a.displayOrder - b.displayOrder);

/** Family card copy that tracks the Monthly / Yearly billing toggle (store SKU unchanged). */
export function withFamilyPlanForBillingCycle(
  plan: SubscriptionPlan,
  billingCycle: 'monthly' | 'yearly'
): SubscriptionPlan {
  if (plan.id !== 'family') return plan;

  if (billingCycle === 'yearly') {
    return {
      ...plan,
      strikethroughPrice: '$15.99/mo',
      priceDisplay: '$10.83',
      pricePeriod: '/mo',
      priceBilledAs: 'Billed $129.96/year · includes 5 accounts',
      savingsBadgeText: 'Save $62.00/year vs monthly',
      equivalentText: 'Includes 5 accounts · price locks today',
      monthlyEquivalent: '$10.83/mo billed yearly',
    };
  }

  return {
    ...plan,
    strikethroughPrice: '$19.99/mo',
    priceDisplay: '$15.99',
    pricePeriod: '/mo',
    priceBilledAs: 'Billed monthly · cancel anytime',
    savingsBadgeText: 'Switch to yearly · save $62.00/year',
    equivalentText: 'Switch to yearly for $10.83/mo effective',
    monthlyEquivalent: '$15.99/mo',
  };
}

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
    'hasGlobalWatchlist' | 'hasBatchTracking' |
    'hasFounderBadge' | 'hasFutureFeatures'>
): boolean {
  return getPlanById(planId)[feature];
}

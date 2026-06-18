import type { Href } from 'expo-router';

/** Canonical spec routes under `app/(onboarding)/`. */
export const ONBOARDING_ROUTES = {
  welcome:               '/(onboarding)/welcome'                        as Href,
  role:                  '/(onboarding)/role'                           as Href,
  name:                  '/(onboarding)/name'                           as Href,
  goals:                 '/(onboarding)/goals'                          as Href,
  ageRange:              '/(onboarding)/age-range'                      as Href,
  gender:                '/(onboarding)/gender'                        as Href,
  conditions:            '/(onboarding)/conditions'                     as Href,
  allergies:             '/(onboarding)/allergies'                     as Href,
  dietType:              '/(onboarding)/diet-type'                     as Href,
  productConcerns:       '/(onboarding)/product-concerns'               as Href,
  sleep:                 '/(onboarding)/sleep'                          as Href,
  lifestyle:             '/(onboarding)/lifestyle'                      as Href,
  familyRole:            '/(onboarding)/family-role'                    as Href,
  featurePreview:        '/(onboarding)/feature-preview'                as Href,
  aiProcessing:          '/(onboarding)/ai-processing'                  as Href,
  scoreReveal:           '/(onboarding)/score-reveal'                   as Href,
  prePaywall:            '/(onboarding)/pre-paywall'                    as Href,
  /** @deprecated Use prePaywall — kept for account.tsx back navigation */
  blueprint:             '/(onboarding)/pre-paywall'                    as Href,
  subscription:          '/(onboarding)/subscription'                   as Href,
  account:               '/(onboarding)/account'                        as Href,
  success:               '/(onboarding)/success'                        as Href,
} as const;

/** Legacy paths without route-group parens → canonical `/(onboarding)/*` hrefs. */
export const LEGACY_ONBOARDING_REDIRECTS: Record<string, Href> = {
  '/(onboarding)':                              ONBOARDING_ROUTES.welcome,
  '/onboarding':                                ONBOARDING_ROUTES.welcome,
  '/(onboarding)/role':                         ONBOARDING_ROUTES.role,
  '/onboarding/role':                           ONBOARDING_ROUTES.role,
  '/(onboarding)/guardian/care-discovery':      ONBOARDING_ROUTES.goals,
  '/onboarding/guardian/care-discovery':        ONBOARDING_ROUTES.goals,
  '/(onboarding)/guardian/assessment':          ONBOARDING_ROUTES.conditions,
  '/onboarding/guardian/assessment':            ONBOARDING_ROUTES.conditions,
  '/(onboarding)/ai-processing':               ONBOARDING_ROUTES.aiProcessing,
  '/onboarding/ai-processing':                 ONBOARDING_ROUTES.aiProcessing,
  '/(onboarding)/score-reveal':                ONBOARDING_ROUTES.scoreReveal,
  '/onboarding/score-reveal':                  ONBOARDING_ROUTES.scoreReveal,
  '/(onboarding)/future-vision':               ONBOARDING_ROUTES.featurePreview,
  '/onboarding/future-vision':                   ONBOARDING_ROUTES.featurePreview,
  '/(onboarding)/ai-demo':                     ONBOARDING_ROUTES.featurePreview,
  '/onboarding/ai-demo':                       ONBOARDING_ROUTES.featurePreview,
  '/(onboarding)/blueprint':                   ONBOARDING_ROUTES.prePaywall,
  '/onboarding/blueprint':                     ONBOARDING_ROUTES.prePaywall,
  '/(onboarding)/paywall-onboarding':          ONBOARDING_ROUTES.subscription,
  '/onboarding/paywall-onboarding':            ONBOARDING_ROUTES.subscription,
};

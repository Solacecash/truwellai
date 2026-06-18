# Phase 20A — Findings Validation Report

**Date:** 2026-05-30  
**Source:** `PHASE_19_EXECUTIVE_RELEASE_REVIEW.md` + Phase 19 sub-reports  
**Method:** Re-validated against live repo files. No secrets read.

---

## Validation key

| Validated | Meaning |
| --------- | ------- |
| **TRUE** | Confirmed in codebase |
| **PARTIALLY TRUE** | Correct direction; nuance or scope differs |
| **FALSE** | Not supported by evidence |

---

## Phase 19 top risks — validated

| Finding | Severity | Validated | Evidence | Action Required |
| ------- | -------- | --------- | -------- | --------------- |
| No device QA on 4 device classes | Critical | **TRUE** | `PHASE_17_DEVICE_VALIDATION_MATRIX.md` — all Pass/Fail blank | Execute `PHASE_20_QA_EXECUTION_PACKAGE.md` |
| EAS production env + OAuth unverified on release binary | Critical | **TRUE** | Env not in repo; `eas env:list` not run in audit; `googleAuth.ts` fails without web client ID | DevOps: set EAS env + build preview |
| Onboarding account terms not tappable | High | **TRUE** | `account.tsx` L250–259: `Pressable` toggles checkbox only; L259 plain `Text`, no `Linking.openURL` | Engineering: add tappable links (Phase 21) |
| OAuth signup bypasses terms acceptance | High | **TRUE** (new detail) | `agreedToTerms` checked only in `validateEmail()` L143; `handleApple`/`handleGoogle` have no terms gate | Engineering: terms for all signup paths |
| Trial CTA vs no StoreKit/Play billing at screen 10 | High | **TRUE** | `subscription.tsx` L44–47 `advanceToAccount()` — no Adapty call | Product sign-off OR wire IAP |
| Privacy URL domain inconsistency | Medium | **TRUE** | `privacy.tsx` L25–26 `truwellai.xyz`; `UserStep1.tsx` L98–105 `truwell.ai` | Legal: canonical URLs |
| app.json / app.config.ts version drift | Medium | **TRUE** | `app.json` L5 `1.0.0`; `app.config.ts` L12 `3.0.0` | Sync per alignment plan |
| Pre-auth onboarding analytics | Medium | **TRUE** | `onboardingAnalytics.ts` L17–19: no userId → analytics enabled; events from welcome L30 | Privacy disclosure + optional defer pre-auth |
| Zero production build artifact | Critical | **TRUE** | Phase 18–19: builds not executed | DevOps preview build |
| TypeScript clean | — | **TRUE** | `npx tsc --noEmit` exit 0 Phase 20 | None |
| app.json version FAIL for EAS output | Medium | **PARTIALLY TRUE** | EAS merges config; **effective** version is 3.0.0 from dynamic config | Sync app.json for developer clarity |
| expo-location plugin drift | Medium | **TRUE** | `app.json` L64–68 has plugin; **absent** from `app.config.ts`; code uses `expo-location` in `EmergencySheet.tsx`, `nearby/index.tsx` | Add plugin to `app.config.ts` |
| EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY undocumented | Medium | **TRUE** | `StripeRoot.tsx` L12; not in `.env.example` | Document in `.env.example` |
| Adapty key hardcoded | Low–Medium | **TRUE** | `adapty.ts` L23 `public_live_…` | Optional env migration post-launch |
| register.tsx terms not linked | Medium | **TRUE** | `register.tsx` L765–767 styled text only | Legacy path fix or deprecate |
| No google-services.json in repo | Low | **PARTIALLY TRUE** | Not required for Google Sign-In id_token flow; may be needed for FCM | DevOps verify push setup |
| expo-dev-client in production plugins | Medium | **PARTIALLY TRUE** | Common Expo pattern; not automatically a store blocker | DevOps confirm artifact type |
| Cold-start routing fixed | — | **TRUE** | Phase 14 `index.tsx` — static revalidation | C1 runtime confirm |
| Pro OAuth metadata | — | **TRUE** | `onboardingAuthMetadata.ts` + `account.tsx` | C4/C5 runtime confirm |
| Settings restore purchases | — | **TRUE** | `settings/subscription.tsx` L816+ | QA regression |
| Account deletion path | — | **TRUE** | `settings/privacy.tsx` + `accountDeletion.ts` | QA spot-check |

---

## Phase 19 build audit findings — validated

| Finding | Validated | Evidence |
| ------- | --------- | -------- |
| eas.json profiles valid | **TRUE** | `eas.json` L6–28 |
| runtimeVersion absent | **TRUE** | No match in configs — N/A unless OTA added |
| supportsTablet drift | **TRUE** | `app.json` true vs `app.config.ts` false |
| plugin set differs | **TRUE** | Stripe/Adapty/dev-client/audio in config.ts only; location in app.json only |
| package.json version 1.0.0 | **TRUE** | L4 — npm metadata only |

---

## False / overstated findings

| Claim | Validated | Reason |
| ----- | --------- | ------ |
| Build config has FAIL preventing EAS start | **FALSE** | No code FAIL; only CONDITIONAL env/credentials |
| Onboarding funnel not implemented | **FALSE** | 11 screens present per prior phases |
| Adapty removed | **FALSE** | `react-native-adapty` in package.json + plugin |

---

## Summary

| Validated | Count |
| --------- | ----- |
| TRUE | 18 |
| PARTIALLY TRUE | 4 |
| FALSE | 2 |

**Highest-priority validated gaps for Phase 21 remediation:** terms links + OAuth terms bypass + expo-location plugin + URL canonicalization.

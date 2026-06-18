# Phase 20D — Environment Certification

**Date:** 2026-05-30  
**Sources:** `.env.example`, `app.config.ts`, runtime modules  
**Secrets:** Not read. `.env` not opened.

---

## Certification status

| Category | Certified for prod build | Notes |
| -------- | ------------------------ | ----- |
| Supabase | **NOT CERTIFIED** | Vars documented; EAS presence unverified |
| Google OAuth | **NOT CERTIFIED** | Documented commented; EAS unverified |
| Apple OAuth | **NOT CERTIFIED** | Dashboard-only |
| Adapty | **PARTIALLY CERTIFIED** | Key in code; dashboard unverified |
| Stripe | **NOT CERTIFIED** | Undocumented in `.env.example` |
| Analytics | **PARTIALLY CERTIFIED** | No env key; depends on Supabase |

---

## Variable certification table

| Variable | Required | Optional | Documented (.env.example) | Production criticality | Missing risk |
| -------- | -------- | -------- | ------------------------- | ---------------------- | ------------ |
| `EXPO_PUBLIC_SUPABASE_URL` | **Yes** | No | Yes | **P0 Critical** | All auth/data fails; placeholder URL used |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | No | Yes | **P0 Critical** | Auth fails; demo key fallback insecure |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | **Yes** (OAuth QA) | No | Commented | **P0 Critical** | Google sign-in disabled with user error |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | No | **Yes** | Commented | P1 High | iOS Google may fail without it |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Conditional | **Yes** | **Missing** | P2 Medium | Stripe PaymentSheet disabled; telehealth card flows skip |
| `EXPO_PUBLIC_ALLOW_LOCAL_SUPABASE` | No | Dev only | Yes | **P0 if set in prod** | Allows insecure URLs in production build |
| `NODE_ENV` | Build-time | — | No | Low | Dev URL allowance in app.config |
| Adapty public key (constant) | **Yes** (IAP) | — | N/A (hardcoded) | P1 High | Wrong key = no subscriptions |
| Apple OAuth secrets | **Yes** (iOS) | — | N/A (Supabase/Apple Dev) | P0 iOS | Apple sign-in fails |
| Android OAuth SHA-1 | **Yes** (Android) | — | N/A (Google Cloud) | P0 Android | DEVELOPER_ERROR on Google sign-in |

---

## Undocumented variables (flagged)

| Variable | Used in | In .env.example | Recommendation |
| -------- | ------- | --------------- | -------------- |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `components/StripeRoot.tsx` L12 | **No** | Add with comment: telehealth/card flows only; IAP uses Adapty |
| `TRUWELL_RELEASE_*` | `scripts/build-release-apk.cjs` | No | Document as local APK only (not EAS) |
| `SKIP_ADAPTY_IAP_VERIFY` | verify script | No | Dev optional |
| `SKIP_ANDROID_PATH_CHECK` | check script | No | Dev optional |

---

## Onboarding-related keys

| Key | Onboarding impact | Certified |
| --- | ----------------- | --------- |
| `EXPO_PUBLIC_SUPABASE_URL` | Account signup, profile save, analytics insert | NOT CERTIFIED (EAS) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Same | NOT CERTIFIED |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | C4 professional Google signup | NOT CERTIFIED |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | iOS Google variant | NOT CERTIFIED |
| Adapty constant | Screen 10 unaffected; settings subs | PARTIAL |
| Stripe key | Not on onboarding path | NOT CERTIFIED |

---

## Trace summary

### Supabase
- Build: `app.config.ts` L6, L110 → `extra`
- Runtime: `lib/env.ts`, `lib/supabase.ts`
- Onboarding: `account.tsx`, `saveTruwellOnboarding.ts`, `onboardingAnalytics.ts`

### Google auth
- Build: `extra.googleWebClientId`, `extra.googleIosClientId`
- Runtime: `lib/googleAuth.ts`, `_layout.tsx` configure

### Apple auth
- Config: `usesAppleSignIn`, plugin
- Runtime: `account.tsx` — no env vars

### Adapty
- `lib/adapty.ts` L23 hardcoded public key
- Init: `_layout.tsx`

### Analytics
- No dedicated env; Supabase table `onboarding_analytics_events`

### Stripe
- Optional `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Onboarding: **not used**

---

## Pre-build certification checklist (DevOps)

| Step | Command / action | Certified |
| ---- | ---------------- | --------- |
| 1 | `eas env:list --environment preview` | ☐ |
| 2 | `eas env:list --environment production` | ☐ |
| 3 | Confirm Supabase URL is production project | ☐ |
| 4 | Confirm Google web client ID present | ☐ |
| 5 | Confirm `EXPO_PUBLIC_ALLOW_LOCAL_SUPABASE` absent in prod | ☐ |
| 6 | Google Cloud Android SHA-1 for EAS keystore | ☐ |
| 7 | Supabase Apple provider enabled | ☐ |
| 8 | Add Stripe key to `.env.example` (engineering) | ☐ |

**Environment certification:** **NOT COMPLETE** until rows 1–7 signed.

---

## DevOps sign-off

**Certified for preview build:** ☐ NOT YET  
**Certified for production build:** ☐ NOT YET  

Name: __________ Date: __________

# Phase 17 Production Configuration Verification

**Date:** 2026-05-30  
**Scope:** Production deployment prerequisites for onboarding release  
**Method:** Static repo audit + Phase 14–16 evidence. **No secrets read.** **No runtime verification performed in this phase.**

**Legend**

| Status | Meaning |
| ------ | ------- |
| **VERIFIED** | Evidence in repo or prior phase confirms production-ready configuration |
| **NEEDS VERIFICATION** | Code or pattern present; live/production value not confirmed |
| **BLOCKED** | Missing config, failed gate, or cannot proceed without human action |

---

## Summary table

| Area | Status | Blocker? |
| ---- | ------ | -------- |
| Google OAuth | **NEEDS VERIFICATION** | Yes (release build) |
| Apple OAuth | **NEEDS VERIFICATION** | Yes (release build) |
| Supabase Auth | **NEEDS VERIFICATION** | Conditional |
| Supabase Email Confirmation | **NEEDS VERIFICATION** | Conditional |
| Adapty | **NEEDS VERIFICATION** | Conditional |
| Revenue Tracking | **NEEDS VERIFICATION** | Conditional |
| Analytics | **NEEDS VERIFICATION** | No |
| Environment Variables | **NEEDS VERIFICATION** | Yes |
| EAS Build Profiles | **VERIFIED** (structure) | No |

---

## 1. Google OAuth

| Check | Evidence | Status |
| ----- | -------- | ------ |
| Plugin declared | `app.config.ts` L55 `@react-native-google-signin/google-signin` | **VERIFIED** |
| Web client ID env var | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in `.env.example` L9; wired in `app.config.ts` L111 | **NEEDS VERIFICATION** (EAS secret) |
| iOS client ID (optional) | `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` in `.env.example` L10; `app.config.ts` L112 | **NEEDS VERIFICATION** |
| Sign-in flow | `lib/googleAuth.ts` → `signInWithIdToken` | **VERIFIED** (code) |
| Missing ID handling | User-facing error if web client ID absent | **VERIFIED** (code) |
| Onboarding metadata | `buildOnboardingAuthMetadata()` on account screen | **VERIFIED** (Phase 14) |
| Production device test | C4 on matrix | **BLOCKED** (0 executions) |

**Overall:** **NEEDS VERIFICATION**

**Required actions:** Set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (and iOS ID if used) in EAS **production** and **preview** profiles. Confirm Google Cloud Console OAuth client authorized for bundle ID `com.truwell.ai` and package `com.truwell.ai`. Run C4 on iPhone SE, 15 Pro, Pixel, Samsung.

---

## 2. Apple OAuth

| Check | Evidence | Status |
| ----- | -------- | ------ |
| Capability | `usesAppleSignIn: true` — `app.config.ts` L28 | **VERIFIED** (declared) |
| Plugin | `expo-apple-authentication` — `app.config.ts` L57 | **VERIFIED** |
| Account screen flow | `AppleAuthentication.signInAsync` + `signInWithIdToken` — `account.tsx` | **VERIFIED** (code) |
| Metadata on sign-in | `buildOnboardingAuthMetadata(selectedRole, 'apple')` | **VERIFIED** (code) |
| Apple Developer entitlement | Not visible in repo | **NEEDS VERIFICATION** |
| TestFlight / App Store build | Not executed | **BLOCKED** (device QA) |

**Overall:** **NEEDS VERIFICATION**

**Required actions:** Confirm Sign in with Apple enabled for App ID `com.truwell.ai` in Apple Developer. Run C5 on iOS devices with production or TestFlight build.

---

## 3. Supabase Auth

| Check | Evidence | Status |
| ----- | -------- | ------ |
| Client SDK | `@supabase/supabase-js` in `package.json` | **VERIFIED** |
| Public URL env | `EXPO_PUBLIC_SUPABASE_URL` — `.env.example` L4 | **NEEDS VERIFICATION** (prod URL in EAS) |
| Anon key env | `EXPO_PUBLIC_SUPABASE_ANON_KEY` — `.env.example` L5 | **NEEDS VERIFICATION** (EAS secret) |
| URL sanitization | `app.config.ts` + `supabasePublicUrl.forAppConfig.cjs` | **VERIFIED** (code) |
| Email signup | `supabase.auth.signUp` — `account.tsx` | **VERIFIED** (code) |
| OAuth providers | Google + Apple id token flows | **VERIFIED** (code) |
| Profile persistence | `saveTruwellOnboarding.ts` upsert to `profiles` | **VERIFIED** (code) |
| Auth metadata | `user_type`, `role`, `onboarding_role_path` | **VERIFIED** (Phase 14) |
| Live session on prod project | Not tested in Phase 17 | **NEEDS VERIFICATION** |

**Overall:** **NEEDS VERIFICATION**

**Required actions:** Confirm EAS production env points to **production** Supabase project (not staging). Run C6, C2, C3 end-to-end on release build.

---

## 4. Supabase Email Confirmation

| Check | Evidence | Status |
| ----- | -------- | ------ |
| Sign-up API used | `signUp` with email/password — `account.tsx` | **VERIFIED** (code) |
| Confirm-email redirect / deep link | Not found in onboarding account flow | **NEEDS VERIFICATION** |
| Supabase dashboard setting | "Confirm email" toggle not visible in repo | **NEEDS VERIFICATION** |
| UX if confirmation required | User may stall at account step post-signup | **NEEDS VERIFICATION** |

**Overall:** **NEEDS VERIFICATION**

**Required actions:** Document Supabase Auth setting (enabled vs disabled). If enabled, test email signup on staging/production and confirm onboarding completes or shows appropriate messaging.

---

## 5. Adapty (In-App Subscriptions)

| Check | Evidence | Status |
| ----- | -------- | ------ |
| SDK installed | `react-native-adapty` — `package.json`; plugin `app.config.ts` L100 | **VERIFIED** |
| Public SDK key | Hardcoded `public_live_ZaqbQVZs...` — `lib/adapty.ts` L23 | **VERIFIED** (present; not env-scoped) |
| Products defined | `truwell_pro_monthly`, yearly, family, lifetime — L33–37 | **VERIFIED** (code) |
| Placement | `truwell_upgrade_guardian` — L28–29 | **NEEDS VERIFICATION** (dashboard match) |
| Init on auth | `_layout.tsx` session bootstrap | **VERIFIED** (code) |
| Settings subscription screen | Full purchase + restore — `app/settings/subscription.tsx` | **VERIFIED** (code) |
| Onboarding screen 10 IAP | **No** Adapty purchase on subscription screen | **NEEDS VERIFICATION** (product decision) |
| Store products live | ASC / Play Console linkage not in repo | **NEEDS VERIFICATION** |

**Overall:** **NEEDS VERIFICATION**

**Required actions:** Product sign-off on Option A (trial UX → account, IAP later in settings) vs wiring IAP at screen 10. Confirm Adapty dashboard products match `PRODUCT_IDS`. Test purchase/restore on sandbox in settings flow.

---

## 6. Revenue Tracking

| Check | Evidence | Status |
| ----- | -------- | ------ |
| Adapty profile sync | `adapty.ts` syncs with Supabase post-purchase | **VERIFIED** (code pattern) |
| Stripe (card payments) | `@stripe/stripe-react-native` — `app.config.ts` L94–98 | **VERIFIED** (declared) |
| Stripe publishable key | `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` — `StripeRoot.tsx` | **NEEDS VERIFICATION** (not in `.env.example`) |
| Onboarding funnel revenue event | `paywall_viewed` only; no purchase event at screen 10 | **NEEDS VERIFICATION** |
| App Store / Play revenue | Requires live IAP test | **NEEDS VERIFICATION** |

**Overall:** **NEEDS VERIFICATION**

---

## 7. Analytics

| Check | Evidence | Status |
| ----- | -------- | ------ |
| Onboarding events | `lib/onboardingAnalytics.ts` | **VERIFIED** (code) |
| Events tracked | `onboarding_started`, `role_selected`, `blueprint_viewed`, `paywall_viewed`, `registration_completed`, `onboarding_completed` | **VERIFIED** (code) |
| Storage | `onboarding_analytics_events` Supabase table insert | **NEEDS VERIFICATION** (table/migration in prod) |
| Privacy opt-out | Respects `user_preferences.usage_analytics` when authenticated | **VERIFIED** (code) |
| Third-party analytics (Firebase, etc.) | Not found in onboarding path | **N/A** |
| Production event delivery | Not tested | **NEEDS VERIFICATION** |

**Overall:** **NEEDS VERIFICATION**

**Required actions:** Confirm `onboarding_analytics_events` table exists in production Supabase. Spot-check events after QA run.

---

## 8. Environment Variables

| Variable | In `.env.example` | In `app.config.ts` / code | EAS production set? |
| -------- | ----------------- | --------------------------- | ------------------- |
| `EXPO_PUBLIC_SUPABASE_URL` | Yes | Yes | **NEEDS VERIFICATION** |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes | Yes | **NEEDS VERIFICATION** |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Commented | Yes | **NEEDS VERIFICATION** |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Commented optional | Yes | **NEEDS VERIFICATION** |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | No | `StripeRoot.tsx` | **NEEDS VERIFICATION** |
| `EXPO_PUBLIC_ALLOW_LOCAL_SUPABASE` | Dev only | Yes | N/A prod |
| Adapty public key | No (hardcoded) | `lib/adapty.ts` | **VERIFIED** (in bundle) |

**Overall:** **NEEDS VERIFICATION**

**Required actions:** Run `eas env:list --environment production` (or equivalent) and confirm all required `EXPO_PUBLIC_*` vars. Document owner sign-off.

---

## 9. EAS Build Profiles

| Profile | Config | Status |
| ------- | ------ | ------ |
| `development` | Dev client, internal distribution | **VERIFIED** |
| `preview` | Internal, Android APK | **VERIFIED** |
| `production` | Android app-bundle, iOS Release | **VERIFIED** |
| Submit profile | `submit.production` empty object | **VERIFIED** (structure) |
| EAS project ID | `4e20596c-020b-4df8-a5bc-32b96aa42708` — `app.config.ts` L114 | **VERIFIED** |
| App version | `3.0.0` / iOS build `1` / Android `versionCode` 1 | **VERIFIED** |
| Env injection per profile | Not defined in `eas.json` (secrets external) | **NEEDS VERIFICATION** |
| Successful production build artifact | Not confirmed in Phase 17 | **NEEDS VERIFICATION** |

**Overall:** **VERIFIED** (profile structure) — **NEEDS VERIFICATION** (successful prod build + secrets)

---

## DevOps sign-off

| Item | Sign-off | Name | Date |
| ---- | -------- | ---- | ---- |
| EAS production secrets complete | ☐ | | |
| Production build succeeded | ☐ | | |
| Google OAuth on release binary | ☐ | | |
| Apple OAuth on TestFlight | ☐ | | |
| Supabase prod project confirmed | ☐ | | |
| Adapty dashboard aligned | ☐ | | |

**DevOps lead:** _________________________ Date: __________

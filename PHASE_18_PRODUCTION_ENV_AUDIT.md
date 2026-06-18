# Phase 18 Production Environment Audit

**Date:** 2026-05-30  
**Scope:** Every production dependency requiring human verification before store submission  
**Method:** Static repo audit + Phase 17 baseline. **Secrets not read.**

---

## Summary

| Dependency | Owner | Blocking severity | Required before submission? |
| ---------- | ----- | ----------------- | --------------------------- |
| Google OAuth | DevOps + Backend | **Critical** | **Y** |
| Apple OAuth | DevOps + Backend | **Critical** | **Y** (iOS) |
| Supabase Auth | Backend | **Critical** | **Y** |
| Supabase Email Confirmation | Backend | **High** | **Y** (if email signup primary) |
| Adapty | DevOps + Product | **High** | **Y** (if monetization claimed) |
| Analytics | Backend + Engineering | **Medium** | **Y** |
| Revenue Tracking | DevOps + Product | **High** | **Conditional** |
| Push Notifications | DevOps + Engineering | **Medium** | **N** (onboarding path) |
| Deep Linking | Engineering + Backend | **Medium** | **Conditional** |

---

## 1. Google OAuth

| Field | Detail |
| ----- | ------ |
| **Owner** | DevOps (EAS env), Backend (Supabase provider config) |
| **Code reference** | `lib/googleAuth.ts`, `app.config.ts` L111, `app/_layout.tsx` |
| **Env var** | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (required); `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` (optional) |
| **Verification method** | 1) `eas env:list --environment production` shows web client ID. 2) Google Cloud Console: OAuth client type **Web application**; authorized redirect URIs include Supabase callback. 3) Android: release SHA-1 from `eas credentials` added to OAuth client. 4) Run matrix test **C4** on all devices with preview/production build. |
| **Blocking severity** | **Critical** — onboarding account screen blocks professional path without Google on Android |
| **Required before submission?** | **Y** |

**Status:** **NEEDS VERIFICATION**

---

## 2. Apple OAuth

| Field | Detail |
| ----- | ------ |
| **Owner** | DevOps (Apple Developer), Backend (Supabase Apple provider) |
| **Code reference** | `expo-apple-authentication`, `app/(onboarding)/account.tsx`, `usesAppleSignIn: true` |
| **Env var** | None in app (Apple Services ID / key in Supabase dashboard) |
| **Verification method** | 1) Apple Developer: Sign in with Apple enabled for App ID `com.truwell.ai`. 2) Supabase Auth → Apple provider configured (Services ID, secret key). 3) TestFlight or preview iOS build. 4) Run matrix test **C5** on iPhone SE + 15 Pro. |
| **Blocking severity** | **Critical** for iOS (Guideline 4.8 if Google offered) |
| **Required before submission?** | **Y** (iOS only) |

**Status:** **NEEDS VERIFICATION**

---

## 3. Supabase

| Field | Detail |
| ----- | ------ |
| **Owner** | Backend |
| **Code reference** | `lib/supabase.ts`, `lib/env.ts`, `app.config.ts` L106–110 |
| **Env vars** | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| **Verification method** | 1) EAS production env points to **production** project (not staging). 2) Build app; confirm no `CRITICAL: Missing Supabase` log. 3) Sign up via email (C6), Google (C4), Apple (C5). 4) Confirm `profiles` row upsert after onboarding (`saveTruwellOnboarding.ts`). 5) Auth redirect: `truwell://auth/callback` in Supabase URL config. |
| **Blocking severity** | **Critical** — entire auth and persistence |
| **Required before submission?** | **Y** |

**Status:** **NEEDS VERIFICATION**

---

## 4. Supabase Email Confirmation

| Field | Detail |
| ----- | ------ |
| **Owner** | Backend |
| **Code reference** | `supabase.auth.signUp` — `account.tsx` |
| **Verification method** | 1) Supabase Dashboard → Authentication → Providers → Email: note **Confirm email** on/off. 2) If ON: create test account on preview build; verify user receives email and can complete onboarding or sees clear UX. 3) Document policy in release notes. |
| **Blocking severity** | **High** — can block C6 / C10 if enabled without deep-link handling |
| **Required before submission?** | **Y** (document behavior either way) |

**Status:** **NEEDS VERIFICATION**

---

## 5. Adapty

| Field | Detail |
| ----- | ------ |
| **Owner** | DevOps (dashboard), Product (trial UX decision) |
| **Code reference** | `lib/adapty.ts`, `app.config.ts` plugin, `app/settings/subscription.tsx` |
| **Env var** | Public SDK key hardcoded (`public_live_ZaqbQVZs...`) |
| **Verification method** | 1) Adapty dashboard: products match `PRODUCT_IDS` in code. 2) Placement `truwell_upgrade_guardian` exists. 3) Sandbox purchase + restore in **Settings → Subscription** (not onboarding screen 10). 4) Product sign-off: screen 10 trial CTA is intent-only (Option A). |
| **Blocking severity** | **High** if store listing promises subscription/trial at onboarding |
| **Required before submission?** | **Y** if app description mentions paid plans; **Conditional** if trial is post-account only |

**Status:** **NEEDS VERIFICATION**

---

## 6. Analytics

| Field | Detail |
| ----- | ------ |
| **Owner** | Backend (table), Engineering (events) |
| **Code reference** | `lib/onboardingAnalytics.ts` |
| **Events** | `onboarding_started`, `role_selected`, `blueprint_viewed`, `paywall_viewed`, `registration_completed`, `onboarding_completed` |
| **Verification method** | 1) Confirm `onboarding_analytics_events` table exists in production Supabase. 2) Complete guardian path on preview build; query table for events. 3) Confirm `user_preferences.usage_analytics` opt-out respected when logged in. 4) Map events to App Privacy / Data safety forms. |
| **Blocking severity** | **Medium** — does not block onboarding function; blocks accurate privacy disclosure |
| **Required before submission?** | **Y** |

**Status:** **NEEDS VERIFICATION**

---

## 7. Revenue Tracking

| Field | Detail |
| ----- | ------ |
| **Owner** | DevOps, Product, Finance |
| **Code reference** | `lib/adapty.ts` (IAP), `@stripe/stripe-react-native` (card/telehealth) |
| **Env var** | `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` (not in `.env.example`) |
| **Verification method** | 1) Adapty: sandbox purchase updates profile entitlement. 2) Stripe: telehealth payment-return deep link `truwell://telehealth/payment-return` (regression, not onboarding C1–C15). 3) Confirm no RevenueCat / expo-iap (`npm run verify:iap-sdk`). |
| **Blocking severity** | **High** for monetized GA; **Low** for onboarding-only release gate |
| **Required before submission?** | **Conditional** — **Y** if store metadata mentions pricing; **N** for onboarding QA gate alone |

**Status:** **NEEDS VERIFICATION**

---

## 8. Push Notifications

| Field | Detail |
| ----- | ------ |
| **Owner** | DevOps (APNs/FCM credentials), Engineering |
| **Code reference** | `expo-notifications` plugin, `lib/notifications.ts`, `registerForPushNotifications` in `_layout.tsx` |
| **Verification method** | 1) iOS: APNs key in EAS credentials. 2) Android: FCM configured in EAS. 3) Permission prompt on first schedule/request. 4) Not on critical path for C1–C15 unless notifications onboarding step added. |
| **Blocking severity** | **Medium** — permission strings present; runtime delivery unverified |
| **Required before submission?** | **N** for onboarding matrix; **Y** for full app privacy labels if push used in production |

**Status:** **NEEDS VERIFICATION**

---

## 9. Deep Linking

| Field | Detail |
| ----- | ------ |
| **Owner** | Engineering, Backend |
| **Code reference** | Scheme `truwell` — `app.config.ts` L15; `authService.ts` (`auth/callback`); `telehealth/payment-return.tsx` |
| **Verification method** | 1) `npx uri-scheme open truwell:// --ios` / Android intent (device). 2) Supabase magic link / OAuth redirect lands in app. 3) Optional matrix: deep link `/onboarding`. 4) Stripe success URL alignment — `supabase/functions/process-payment`. |
| **Blocking severity** | **Medium** — email confirm and telehealth payments depend on links |
| **Required before submission?** | **Conditional** — **Y** if email confirmation enabled; **N** for OAuth id_token-only path |

**Status:** **NEEDS VERIFICATION**

---

## Environment variable master list

| Variable | Production EAS | Verified | Owner |
| -------- | -------------- | -------- | ----- |
| `EXPO_PUBLIC_SUPABASE_URL` | ☐ | ☐ | Backend |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | ☐ | ☐ | Backend |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | ☐ | ☐ | DevOps |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | ☐ | ☐ | DevOps |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ☐ | ☐ | DevOps |
| Adapty public key (in code) | N/A | ☐ | DevOps |

---

## External console checklist

| Console | Item | Owner | Done |
| ------- | ---- | ----- | ---- |
| Google Cloud | Web OAuth client ID in EAS | DevOps | ☐ |
| Google Cloud | Android SHA-1 (release) | DevOps | ☐ |
| Apple Developer | Sign in with Apple | DevOps | ☐ |
| Apple Developer | Push Notifications capability | DevOps | ☐ |
| Supabase | Auth providers (Google, Apple, Email) | Backend | ☐ |
| Supabase | Redirect URLs `truwell://*` | Backend | ☐ |
| Supabase | `onboarding_analytics_events` table | Backend | ☐ |
| Adapty | Products + placement | DevOps | ☐ |
| App Store Connect | App record + bundle ID | Product | ☐ |
| Play Console | App record + package name | Product | ☐ |

---

## Sign-off

| Role | All P0 items verified | Name | Date |
| ---- | --------------------- | ---- | ---- |
| DevOps | ☐ | | |
| Backend | ☐ | | |
| Product | ☐ | | |

# Phase 19B — Environment Validation Report

**Date:** 2026-05-30  
**Method:** Trace all env references in codebase. **Secrets not read.** `.env` not opened.

---

## Summary

| Category | Vars traced | Required for prod QA | In `.env.example` |
| -------- | ----------- | -------------------- | ----------------- |
| Supabase | 3 | Yes | 2 documented |
| Google OAuth | 2 | Yes | Commented |
| Apple OAuth | 0 (dashboard) | Yes (Supabase/Apple Dev) | N/A |
| Adapty | 1 (hardcoded) | Yes | Not env-based |
| Analytics | 0 dedicated | Conditional | N/A |
| Stripe | 1 | Conditional | **Missing** |
| Expo/build | 2 | Dev only | 1 documented |
| Local build scripts | 6 | No (local APK only) | No |

---

## Master variable table

| Variable | Used In | Required | Missing Risk |
| -------- | ------- | -------- | ------------ |
| `EXPO_PUBLIC_SUPABASE_URL` | `app.config.ts` L6–109; `lib/env.ts` L39; `lib/supabasePublicUrl.ts`; `scripts/verify-onboarding-migration.cjs` | **Yes** (all auth/onboarding) | **Critical** — placeholder URL in `lib/supabase.ts` L36–37; all API calls fail |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `app.config.ts` L110; `lib/env.ts` L52; `lib/supabase.ts` | **Yes** | **Critical** — demo anon key fallback; auth insecure/non-functional |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | `app.config.ts` L111; `lib/googleAuth.ts` L14–71 | **Yes** (Google sign-in) | **Critical** — user error "Google Sign-In is not configured" |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | `app.config.ts` L112; `lib/googleAuth.ts` L21–51 | **Optional** (iOS) | **Medium** — iOS Google may fail without correct client |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `components/StripeRoot.tsx` L12 | **Conditional** (Stripe PaymentSheet / telehealth) | **Medium** — Stripe wrapper skipped; card flows disabled |
| `EXPO_PUBLIC_ALLOW_LOCAL_SUPABASE` | `supabasePublicUrl.ts`; `app.config.ts` L107–108; `.forAppConfig.cjs` | **No** (production) | **High if set in prod** — allows insecure HTTP/local hosts |
| `NODE_ENV` | `app.config.ts` L108 | Build-time | Low — enables local URL allowance in dev |
| `ADAPTY_PUBLIC_KEY` | N/A — hardcoded `lib/adapty.ts` L23 | **Yes** (IAP) | **Medium** — wrong key = IAP failure; cannot rotate without code change |
| Apple Services ID / secret | Supabase dashboard (not app env) | **Yes** (iOS Apple OAuth) | **Critical** on iOS if dashboard misconfigured |
| EAS secrets (generic) | EAS build injection | **Yes** | **Critical** — vars must exist at **build time** for `extra` embedding |
| `TRUWELL_RELEASE_STORE_FILE` | `scripts/build-release-apk.cjs` | **No** (EAS path) | N/A for EAS |
| `TRUWELL_RELEASE_STORE_PASSWORD` | `scripts/build-release-apk.cjs` | **No** (EAS path) | N/A |
| `TRUWELL_RELEASE_KEY_ALIAS` | `scripts/build-release-apk.cjs` | **No** | N/A |
| `TRUWELL_RELEASE_KEY_PASSWORD` | `scripts/build-release-apk.cjs` | **No** | N/A |
| `ANDROID_HOME` / `ANDROID_SDK_ROOT` | build scripts | **No** (EAS cloud) | N/A |
| `SKIP_ADAPTY_IAP_VERIFY` | `scripts/verify-adapty-only-iap.cjs` | **No** | Low |
| `SKIP_ANDROID_PATH_CHECK` | `scripts/check-android-path.cjs` | **No** | Low |

---

## Supabase trace

```
Build time:  EXPO_PUBLIC_SUPABASE_URL → app.config.ts → extra.supabaseUrl (sanitized)
             EXPO_PUBLIC_SUPABASE_ANON_KEY → extra.supabaseAnonKey
Runtime:     lib/env.ts reads extra + process.env fallback
             lib/supabase.ts → createClient (CRITICAL log if missing)
Consumers:   auth, onboarding save, analytics insert, account deletion, all data screens
```

**Build impact:** Missing at EAS build → empty/extra missing → runtime placeholder → onboarding account creation fails.

---

## Google OAuth trace

```
Build time:  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID → extra.googleWebClientId
             EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID → extra.googleIosClientId
Startup:     app/_layout.tsx → configureGoogleSignIn()
Runtime:     lib/googleAuth.ts → GoogleSignin.configure → signInWithIdToken → Supabase
Onboarding:  app/(onboarding)/account.tsx handleGoogle
```

**Build impact:** Missing web client ID → Google button fails at tap with user-facing error.

**External (not env):** Android release SHA-1 in Google Cloud Console must match EAS keystore.

---

## Apple OAuth trace

```
Config:      usesAppleSignIn: true (app.config.ts L28)
             expo-apple-authentication plugin
Runtime:     account.tsx → AppleAuthentication.signInAsync → signInWithIdToken
Env vars:    None in app — Supabase Apple provider + Apple Developer portal
```

**Build impact:** Entitlements applied by EAS/Expo plugin; failure is credential/config not env var.

---

## Adapty trace

```
Config:      react-native-adapty plugin (app.config.ts L100)
Key:         ADAPTY_PUBLIC_KEY constant in lib/adapty.ts (public_live_…)
Init:        app/_layout.tsx → initRevenueCat on session
Purchase:    app/settings/subscription.tsx (NOT onboarding screen 10)
Onboarding:  subscription.tsx — no Adapty purchase call
```

**Build impact:** Key baked into JS bundle; no EAS env needed for activation. Dashboard product mismatch = runtime IAP failure.

---

## Analytics trace

```
Module:      lib/onboardingAnalytics.ts
Events:      onboarding_started, role_selected, blueprint_viewed, paywall_viewed,
             registration_completed, onboarding_completed
Storage:     supabase.from('onboarding_analytics_events').insert
Opt-out:     user_preferences.usage_analytics (authenticated only)
Env vars:    None — uses Supabase client
```

**Build impact:** Depends on Supabase env + prod table existence. No separate analytics API key.

---

## Expo / EAS vars

| Item | Location | Notes |
| ---- | -------- | ----- |
| EAS project ID | `app.config.ts` / `app.json` extra | PASS |
| Env per profile | Not in `eas.json` | Must use `eas env:*` |
| `.env.example` | Documents Supabase + Google (commented) | Stripe not documented |

---

## .env.example coverage gap

| Variable | In `.env.example` |
| -------- | ----------------- |
| `EXPO_PUBLIC_SUPABASE_URL` | Yes |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Commented |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Commented |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | **No** |
| `EXPO_PUBLIC_ALLOW_LOCAL_SUPABASE` | Yes (dev) |

---

## Pre-build verification commands (DevOps)

```powershell
cd mobile
eas env:list --environment production
eas env:list --environment preview
```

Expected presence: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.

---

## Sign-off

| Check | Verified | Owner |
| ----- | -------- | ----- |
| Production EAS env complete | ☐ | DevOps |
| Preview EAS env complete | ☐ | DevOps |
| No `EXPO_PUBLIC_ALLOW_LOCAL_SUPABASE` in prod | ☐ | DevOps |
| Google Cloud SHA-1 for release keystore | ☐ | DevOps |
| Supabase Apple provider configured | ☐ | Backend |

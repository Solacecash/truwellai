# Phase 18 Build Readiness Report

**Date:** 2026-05-30  
**Phase:** Production build preparation & QA execution  
**Code modifications:** **None**  
**Builds executed:** **None** (commands documented only)

---

## Executive summary

TruWell AI mobile is **structurally ready for EAS builds**. `app.config.ts` is the authoritative Expo config for EAS; `eas.json` defines valid development, preview, and production profiles. **Configuration drift** between `app.json` and `app.config.ts` is a **CONDITIONAL** item (EAS uses dynamic config, but drift risks local confusion). **Production environment variables are not embedded in repo** and must be set in EAS before preview/production builds used for QA or store submit.

**Overall build readiness:** **CONDITIONAL**

---

## Section 1 — Build readiness audit

### Rating key

| Rating | Meaning |
| ------ | ------- |
| **PASS** | Ready for build pipeline without code changes |
| **CONDITIONAL** | Build possible; human verification or EAS secrets required |
| **FAIL** | Blocks build or store submission without remediation |

---

### 1.1 `eas.json`

| Check | Evidence | Rating |
| ----- | -------- | ------ |
| CLI version constraint | `"version": ">= 5.0.0"` | **PASS** |
| App version source | `"appVersionSource": "remote"` | **PASS** |
| Development profile | `developmentClient: true`, internal distribution | **PASS** |
| Preview profile | Internal, Android `apk` | **PASS** |
| Production profile | Android `app-bundle`, iOS `Release` | **PASS** |
| Submit profile | `submit.production` defined | **PASS** |
| Environment per profile | Not defined in file (external EAS env) | **CONDITIONAL** |
| iOS credentials / Android keystore | Not in repo (EAS-managed expected) | **CONDITIONAL** |

**Overall:** **CONDITIONAL**

---

### 1.2 `app.json` vs `app.config.ts`

EAS evaluates **`app.config.ts`** (dynamic). `app.json` is merged as base config.

| Field | `app.json` | `app.config.ts` | Rating |
| ----- | ---------- | --------------- | ------ |
| `version` | `1.0.0` | `3.0.0` | **CONDITIONAL** — store-facing version is **3.0.0** via dynamic config |
| `ios.supportsTablet` | `true` | `false` | **CONDITIONAL** — EAS uses `false` |
| `userInterfaceStyle` | `dark` | `automatic` | **CONDITIONAL** |
| `ios.buildNumber` | absent | `1` | **PASS** (in dynamic config) |
| `android.versionCode` | absent | `1` | **PASS** |
| Plugins | Subset | Full (Stripe, Adapty, dev-client, audio) | **PASS** for EAS |
| EAS project ID | Present | Present (`4e20596c-020b-4df8-a5bc-32b96aa42708`) | **PASS** |
| Expo owner | `truwellai` in app.json | — | **PASS** |

**Note:** Comment in `app.config.ts` L17 says "Must stay in sync with app.json" but versions diverge. **No code change in Phase 18** — DevOps should treat **`app.config.ts` as source of truth** for builds.

**Overall:** **CONDITIONAL**

---

### 1.3 Expo configuration

| Check | Evidence | Rating |
| ----- | -------- | ------ |
| Expo SDK | `~54.0.33` — `package.json` | **PASS** |
| Entry | `expo-router/entry` | **PASS** |
| Scheme (deep links) | `truwell` | **PASS** |
| Typed routes experiment | Enabled | **PASS** |
| New architecture | `false` (both configs) | **PASS** |
| `expo-dev-client` plugin | In `app.config.ts` only | **CONDITIONAL** — included in all builds; expected for dev/preview |
| Fonts / assets paths | `./assets/images/*` referenced | **PASS** (paths exist in repo) |

**Overall:** **PASS**

---

### 1.4 iOS configuration

| Check | Evidence | Rating |
| ----- | -------- | ------ |
| Bundle ID | `com.truwell.ai` | **PASS** |
| Build number | `1` | **PASS** |
| Apple Sign-In | `usesAppleSignIn: true` | **PASS** |
| Tablet support | `supportsTablet: false` | **PASS** |
| Permission strings | Camera, photos, notifications, mic, Face ID — `infoPlist` | **PASS** |
| Stripe merchant ID | `merchant.com.truwell.ai` | **PASS** |
| Production entitlements | Not visible in repo | **CONDITIONAL** — verify in Apple Developer + EAS |

**Overall:** **CONDITIONAL**

---

### 1.5 Android configuration

| Check | Evidence | Rating |
| ----- | -------- | ------ |
| Package | `com.truwell.ai` | **PASS** |
| Version code | `1` | **PASS** |
| Build type (production) | `app-bundle` (Play Store) | **PASS** |
| Permissions declared | Camera, storage, boot, audio, biometric | **PASS** |
| Edge-to-edge | Enabled | **PASS** |
| Google Sign-In SHA-1 | Release keystore fingerprint in Google Cloud | **CONDITIONAL** — must match EAS production keystore |
| Adaptive icon | Configured | **PASS** |

**Overall:** **CONDITIONAL**

---

### 1.6 Environment variable usage

| Variable | Consumed by | In `.env.example` | EAS prod required | Rating |
| -------- | ----------- | ----------------- | ----------------- | ------ |
| `EXPO_PUBLIC_SUPABASE_URL` | `app.config.ts`, `lib/env.ts`, `lib/supabase.ts` | Yes | **Yes** | **CONDITIONAL** |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Same | Yes | **Yes** | **CONDITIONAL** |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | `app.config.ts` → `googleAuth.ts` | Commented | **Yes** (OAuth QA) | **CONDITIONAL** |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Optional iOS | Commented | Optional | **CONDITIONAL** |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `StripeRoot.tsx` | **No** | If Stripe used | **CONDITIONAL** |
| `EXPO_PUBLIC_ALLOW_LOCAL_SUPABASE` | Dev only | Yes | **No** (prod) | **PASS** |
| Adapty public key | Hardcoded `lib/adapty.ts` L23 | N/A | Baked in bundle | **PASS** |

**Critical:** Supabase vars must be present **at EAS build time** so `app.config.ts` bakes them into `extra` (`lib/supabase.ts` L31).

**Overall:** **CONDITIONAL**

---

### 1.7 OAuth configuration references

| Provider | Code reference | Native config | Rating |
| -------- | -------------- | ------------- | ------ |
| Google | `@react-native-google-signin/google-signin`, `configureGoogleSignIn()` in `_layout.tsx` | Web client ID via env/extra | **CONDITIONAL** |
| Apple | `expo-apple-authentication`, `account.tsx` | `usesAppleSignIn: true` | **CONDITIONAL** |
| Supabase id_token | `signInWithIdToken` in `googleAuth.ts`, `account.tsx` | Supabase dashboard providers | **CONDITIONAL** |
| Auth callback deep link | `truwell` scheme, `auth/callback` — `authService.ts` | Supabase redirect URLs | **CONDITIONAL** |

**Overall:** **CONDITIONAL**

---

### 1.8 Adapty configuration references

| Check | Evidence | Rating |
| ----- | -------- | ------ |
| Plugin | `react-native-adapty` in `app.config.ts` L100 | **PASS** |
| SDK key | `public_live_ZaqbQVZs...` — `lib/adapty.ts` L23 | **PASS** (in bundle) |
| Products | `truwell_pro_monthly`, yearly, family, lifetime | **PASS** (code) |
| Placement | `truwell_upgrade_guardian` | **CONDITIONAL** (dashboard match) |
| Init on session | `initRevenueCat` in `_layout.tsx` | **PASS** (code) |
| Onboarding screen 10 | No IAP call | **PASS** (by design; product sign-off separate) |
| IAP verify script | `npm run verify:iap-sdk` | **PASS** |

**Overall:** **CONDITIONAL** (dashboard + store products)

---

### 1.9 Supabase configuration references

| Check | Evidence | Rating |
| ----- | -------- | ------ |
| Client | `@supabase/supabase-js` | **PASS** |
| URL sanitization | `supabasePublicUrl.forAppConfig.cjs` | **PASS** |
| Auth storage | SecureStore (standalone builds) | **PASS** |
| Missing env fallback | Placeholder URL with console error | **CONDITIONAL** — build succeeds but API fails |
| Profile upsert | `saveTruwellOnboarding.ts` | **PASS** |
| Analytics table | `onboarding_analytics_events` insert | **CONDITIONAL** (prod table) |

**Overall:** **CONDITIONAL**

---

## Consolidated build readiness matrix

| Area | Rating |
| ---- | ------ |
| `eas.json` | **CONDITIONAL** |
| `app.json` / `app.config.ts` | **CONDITIONAL** |
| Expo configuration | **PASS** |
| iOS configuration | **CONDITIONAL** |
| Android configuration | **CONDITIONAL** |
| Environment variables | **CONDITIONAL** |
| OAuth references | **CONDITIONAL** |
| Adapty references | **CONDITIONAL** |
| Supabase references | **CONDITIONAL** |

| PASS | CONDITIONAL | FAIL |
| ---- | ----------- | ---- |
| 1 | 8 | 0 |

---

## Pre-build blockers (DevOps)

| # | Blocker | Severity |
| - | ------- | -------- |
| 1 | EAS production/preview env vars for Supabase + Google | **P0** |
| 2 | Apple Developer: Sign in with Apple + push capability | **P0** (iOS OAuth QA) |
| 3 | Google Cloud: OAuth client + Android SHA-1 for release keystore | **P0** (Android OAuth QA) |
| 4 | Confirm Adapty products live in ASC / Play Console | **P1** |
| 5 | Supabase redirect URL includes `truwell://auth/callback` | **P1** |

---

## TypeScript validation (Phase 18)

```powershell
cd mobile
npx tsc --noEmit
```

**Exit code:** `0`  
**Result:** **PASS**

---

## Related Phase 18 artifacts

- `PHASE_18_EAS_DEPLOYMENT_CHECKLIST.md` — exact build commands
- `PHASE_18_PRODUCTION_ENV_AUDIT.md` — env verification owners
- `PHASE_18_QA_EXECUTION_PLAN.md` — device test order
- `PHASE_18_STORE_SUBMISSION_PACKAGE.md` — store checklists
- `PHASE_17_DEVICE_VALIDATION_MATRIX.md` — test recording template

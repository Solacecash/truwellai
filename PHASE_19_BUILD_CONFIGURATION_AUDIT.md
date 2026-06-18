# Phase 19A — Build Configuration Audit

**Date:** 2026-05-30  
**Method:** Static audit of repo files. No builds executed. No config modified.

---

## Summary

| PASS | CONDITIONAL | FAIL |
| ---- | ----------- | ---- |
| 12 | 14 | 1 |

**Critical finding:** `app.json` version **1.0.0** vs `app.config.ts` version **3.0.0**. EAS uses dynamic config, so store builds should emit **3.0.0**, but drift creates local tooling confusion and risks accidental sync errors.

---

## Audit table

| Area | Status | Issue | Risk |
| ---- | ------ | ----- | ---- |
| **EAS project linkage** | PASS | `extra.eas.projectId` = `4e20596c-020b-4df8-a5bc-32b96aa42708` in both configs | Low |
| **EAS CLI constraint** | PASS | `eas.json` requires CLI `>= 5.0.0` | Low |
| **EAS appVersionSource** | CONDITIONAL | `"remote"` — version may be overridden in EAS dashboard, not only `app.config.ts` | Medium — verify remote version before submit |
| **Development profile** | PASS | `developmentClient: true`, internal distribution | Low |
| **Preview profile** | PASS | Internal, Android `apk` | Low |
| **Production profile** | PASS | Android `app-bundle`, iOS `Release` | Low |
| **Submit profile** | PASS | `submit.production` defined (empty object) | Low |
| **app.config.ts version** | PASS | `version: '3.0.0'` | Low |
| **app.json version** | FAIL | `version: "1.0.0"` — conflicts with `app.config.ts` L12 comment "Must stay in sync" | **High** — developer confusion; wrong version if static config used |
| **package.json version** | CONDITIONAL | `"version": "1.0.0"` — npm package version unrelated to store version | Low — documentation only |
| **iOS buildNumber** | PASS | `buildNumber: '1'` in `app.config.ts` only | Low |
| **Android versionCode** | PASS | `versionCode: 1` in `app.config.ts` only | Low |
| **runtimeVersion** | PASS | Not set — standard Expo SDK 54 managed workflow; no OTA `expo-updates` plugin in config | Low — N/A unless updates added |
| **iOS bundleIdentifier** | PASS | `com.truwell.ai` consistent | Low |
| **Android package** | PASS | `com.truwell.ai` consistent | Low |
| **ios.supportsTablet** | CONDITIONAL | `app.json`: `true`; `app.config.ts`: `false` | Medium — EAS uses `false`; App Store iPad screenshots N/A |
| **userInterfaceStyle** | CONDITIONAL | `app.json`: `dark`; `app.config.ts`: `automatic` | Low — EAS uses `automatic` |
| **newArchEnabled** | PASS | `false` in both | Low |
| **Expo SDK** | PASS | `expo ~54.0.33` in `package.json`; lockfile aligned | Low |
| **Plugin: Google Sign-In** | PASS | Both configs | Low |
| **Plugin: Apple Auth** | PASS | Both configs | Low |
| **Plugin: expo-dev-client** | CONDITIONAL | In `app.config.ts` only — included in all native builds | Medium — confirm production artifact acceptable |
| **Plugin: Stripe** | CONDITIONAL | `app.config.ts` only; absent from `app.json` | Low for EAS |
| **Plugin: Adapty** | CONDITIONAL | `app.config.ts` only; absent from `app.json` | Low for EAS |
| **Plugin: expo-location** | CONDITIONAL | `app.json` only; **absent** from `app.config.ts` | Medium — location permission may not ship in EAS build unless dependency auto-links |
| **Plugin: expo-audio** | CONDITIONAL | `app.config.ts` only | Low |
| **Plugin: expo-splash-screen** | CONDITIONAL | `app.config.ts` only (config plugin with imageWidth) | Low |
| **iOS infoPlist strings** | CONDITIONAL | `app.config.ts` has mic, notifications, Face ID; `app.json` has camera/photos only | Medium — EAS uses fuller set in `app.config.ts` |
| **Android permissions array** | CONDITIONAL | Explicit in `app.config.ts`; absent from `app.json` android block | Low — EAS uses `app.config.ts` |
| **Stripe merchant ID** | PASS | `merchant.com.truwell.ai` | Low |
| **Expo owner** | CONDITIONAL | `owner: "truwellai"` in `app.json` only | Low |
| **package-lock.json** | PASS | Present; locks dependency tree for reproducible CI/EAS | Low |
| **IAP guard script** | PASS | `verify:iap-sdk` + `preandroid` hook enforce Adapty-only | Low |
| **Local release APK script** | PASS | `android:release-apk` uses separate signing env (`TRUWELL_RELEASE_*`) — not EAS | Informational |

---

## Versioning detail

| Source | marketing version | iOS build | Android versionCode |
| ------ | ----------------- | --------- | ------------------- |
| `app.config.ts` | **3.0.0** | **1** | **1** |
| `app.json` | **1.0.0** | absent | absent |
| `package.json` | **1.0.0** | N/A | N/A |
| `eas.json` | remote-managed | remote | remote |

**EAS behavior:** Dynamic config merges `app.json` base then applies `app.config.ts` overrides. **Effective EAS version: 3.0.0 / build 1 / versionCode 1** unless EAS remote version overrides.

---

## Plugin inventory (authoritative: app.config.ts)

| Plugin | Present |
| ------ | ------- |
| `@react-native-google-signin/google-signin` | Yes |
| `expo-dev-client` | Yes |
| `expo-apple-authentication` | Yes |
| `expo-router` | Yes |
| `expo-splash-screen` | Yes |
| `expo-secure-store` | Yes |
| `expo-camera` | Yes |
| `expo-notifications` | Yes |
| `expo-image-picker` | Yes |
| `expo-audio` | Yes |
| `@stripe/stripe-react-native` | Yes |
| `react-native-adapty` | Yes |

**Not in app.config.ts but in app.json:** `expo-location` (dependency exists in `package.json`).

---

## Recommendations (documentation only — no changes made)

1. Treat **`app.config.ts` as single source of truth** for EAS builds.
2. Before store submit, run `eas project:info` and confirm remote app version matches **3.0.0**.
3. Resolve `app.json` / `package.json` version drift in a future engineering phase (out of scope Phase 19).
4. Confirm whether `expo-location` permission string is required in production build (emergency/hospital feature).

---

## TypeScript (Phase 19)

`npx tsc --noEmit` — **PASS** (exit 0)

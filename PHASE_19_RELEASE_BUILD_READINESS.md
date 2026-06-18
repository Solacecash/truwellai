# Phase 19C — Release Build Readiness

**Date:** 2026-05-30  
**Method:** Static capability audit. **No EAS builds executed.**

**Rating:** PASS | CONDITIONAL | FAIL

---

## Overall verdict

| Build type | iOS | Android |
| ---------- | --- | ------- |
| **Preview** | **CONDITIONAL** | **CONDITIONAL** |
| **Production** | **CONDITIONAL** | **CONDITIONAL** |

Capable of producing artifacts **if** EAS credentials and env vars are configured. No code-level FAIL preventing build start.

---

## iOS subsystems

| Subsystem | Status | Evidence / gap |
| --------- | ------ | -------------- |
| **Expo config valid** | PASS | `app.config.ts` complete |
| **Bundle identifier** | PASS | `com.truwell.ai` |
| **Version / build** | PASS | `3.0.0` / `1` |
| **Plugins compile** | CONDITIONAL | `expo-dev-client` in production profile — verify artifact type |
| **Camera permission** | PASS | NSCameraUsageDescription |
| **Photo library** | PASS | NSPhotoLibraryUsageDescription |
| **Microphone** | PASS | NSMicrophoneUsageDescription |
| **Notifications** | PASS | NSUserNotificationUsageDescription + expo-notifications plugin |
| **Face ID / biometrics** | PASS | NSFaceIDUsageDescription + expo-local-authentication dep |
| **Apple Sign In** | PASS | `usesAppleSignIn: true` + plugin |
| **Google Sign In** | CONDITIONAL | Plugin present; env + entitlements at build |
| **Associated domains** | PASS | Not configured — N/A unless universal links required |
| **Entitlements file in repo** | PASS | None — EAS/Expo managed (expected) |
| **Stripe Apple Pay** | CONDITIONAL | `merchant.com.truwell.ai` — merchant cert in Apple Dev |
| **Adapty IAP** | PASS | Plugin declared |
| **Deep link scheme** | PASS | `scheme: 'truwell'` |
| **Supabase auth storage** | PASS | SecureStore on standalone builds |
| **New Architecture** | PASS | Disabled (`newArchEnabled: false`) |
| **Tablet** | PASS | `supportsTablet: false` |

**iOS preview build:** **CONDITIONAL**  
**iOS production build:** **CONDITIONAL**

---

## Android subsystems

| Subsystem | Status | Evidence / gap |
| --------- | ------ | -------------- |
| **Package name** | PASS | `com.truwell.ai` |
| **Version code** | PASS | `1` |
| **Preview artifact** | PASS | APK via `eas.json` preview profile |
| **Production artifact** | PASS | AAB via production profile |
| **Permissions** | PASS | CAMERA, STORAGE, AUDIO, BIOMETRIC, BOOT |
| **Edge-to-edge** | PASS | Enabled |
| **Google Sign In** | CONDITIONAL | Plugin + web client ID; **release SHA-1** in Google Cloud |
| **google-services.json** | CONDITIONAL | **Not in repo** — may not be required for Google Sign-In id_token flow; verify if FCM/push needs it |
| **Apple Sign In** | PASS | N/A on Android |
| **Deep links** | PASS | Scheme `truwell`; expo-router + expo-linking |
| **Intent filters** | PASS | Expo default for custom scheme (no explicit config) |
| **Adapty / Play Billing** | CONDITIONAL | Plugin + products in code; Play Console linkage unverified |
| **Stripe Google Pay** | CONDITIONAL | `enableGooglePay: true` in plugin config |
| **Notifications FCM** | CONDITIONAL | Plugin present; FCM credentials via EAS |
| **ProGuard / minify** | PASS | EAS default Release handling |

**Android preview build:** **CONDITIONAL**  
**Android production build:** **CONDITIONAL**

---

## Cross-platform build pipeline

| Subsystem | Status | Notes |
| --------- | ------ | ----- |
| **eas.json profiles** | PASS | dev, preview, production defined |
| **EAS project ID** | PASS | Linked |
| **TypeScript** | PASS | `tsc --noEmit` exit 0 |
| **Dependencies locked** | PASS | `package-lock.json` present |
| **Adapty-only IAP guard** | PASS | `verify-adapty-only-iap.cjs` |
| **Env at build time** | CONDITIONAL | Not in eas.json — external |
| **Remote app version** | CONDITIONAL | `appVersionSource: remote` |
| **Expo SDK 54 compatibility** | PASS | Consistent in package.json |

---

## Blockers to artifact quality (not build start)

| ID | Issue | Affects |
| -- | ----- | ------- |
| B1 | Missing EAS Supabase/Google env | Runtime auth broken in QA build |
| B2 | Google Android SHA-1 not registered | C4 fails on Android release |
| B3 | Apple Supabase provider not configured | C5 fails on iOS |
| B4 | Device QA not run | Unknown runtime defects |

---

## Build readiness checklist

| Step | Preview | Production |
| ---- | ------- | ------------ |
| `eas env:list` shows required vars | ☐ | ☐ |
| `npx tsc --noEmit` PASS | ☐ | ☐ |
| Credentials configured (`eas credentials`) | ☐ | ☐ |
| Build command documented (`PHASE_18_EAS_DEPLOYMENT_CHECKLIST.md`) | ☐ | ☐ |
| QA matrix build ID field ready | ☐ | ☐ |

**Release engineering sign-off:** __________________ Date: __________

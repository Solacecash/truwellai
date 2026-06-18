# Phase 20C — Configuration Alignment Plan

**Date:** 2026-05-30  
**Authoritative source for EAS builds:** **`app.config.ts`** (dynamic Expo config)  
**Base merge input:** `app.json`  
**Changes applied in Phase 20:** None — recommendations only

---

## Resolution principle

```
EAS Build → reads app.config.ts → merges over app.json → env vars at build time → extra.*
Local expo config → same path
Store version/build → app.config.ts values unless eas.json appVersionSource remote overrides
```

**Action:** Align `app.json` to `app.config.ts` to eliminate drift and satisfy L17 comment ("Must stay in sync with app.json").

---

## Alignment table

| Config Area | Current (app.json) | Current (app.config.ts) | Expected | Source of Truth | Action |
| ----------- | ------------------ | ----------------------- | -------- | --------------- | ------ |
| **version** | `1.0.0` | `3.0.0` | `3.0.0` | app.config.ts | Update `app.json` `"version": "3.0.0"` |
| **package.json version** | `1.0.0` | N/A | `3.0.0` (optional) | app.config.ts | Update npm version for consistency |
| **ios.buildNumber** | absent | `'1'` | `'1'` | app.config.ts | Add to app.json or document as config.ts-only |
| **android.versionCode** | absent | `1` | `1` | app.config.ts | Add to app.json android block |
| **runtimeVersion** | absent | absent | absent | N/A | No action unless enabling expo-updates |
| **ios.supportsTablet** | `true` | `false` | `false` | app.config.ts | Set app.json `supportsTablet: false` |
| **userInterfaceStyle** | `dark` | `automatic` | `automatic` | app.config.ts | Set app.json to `automatic` |
| **ios.infoPlist** | camera, photos only | + notifications, mic, Face ID | full set | app.config.ts | Copy full infoPlist to app.json |
| **android.permissions** | implicit | explicit array | explicit | app.config.ts | Mirror permissions in app.json |
| **plugin: expo-dev-client** | absent | present | present | app.config.ts | Add to app.json OR document as intentional dev-only in config.ts |
| **plugin: expo-splash-screen** | absent | present | present | app.config.ts | Add to app.json |
| **plugin: expo-audio** | absent | present | present | app.config.ts | Add to app.json |
| **plugin: Stripe** | absent | present | present | app.config.ts | Add to app.json |
| **plugin: Adapty** | absent | present | present | app.config.ts | Add to app.json |
| **plugin: expo-location** | present | **absent** | **present** | app.json + runtime usage | **Add to app.config.ts** — used in `EmergencySheet.tsx`, `nearby/index.tsx` |
| **notification icon color** | `#0A1628` | `#020A14` | `#020A14` | app.config.ts | Align app.json |
| **extra.supabase/google** | absent | present | present | app.config.ts | Keep config.ts-only (env-driven) |
| **owner** | `truwellai` | absent | `truwellai` | app.json | Add owner to app.config.ts export if needed |
| **eas.json profiles** | OK | OK | unchanged | eas.json | No change |
| **eas appVersionSource** | `remote` | — | verify before submit | eas.json + dashboard | DevOps confirm remote version = 3.0.0 |

---

## expo-location — priority fix

**Problem:** Location APIs used at runtime but `expo-location` config plugin missing from `app.config.ts`.

**Impact:** iOS may omit `NSLocationWhenInUseUsageDescription` in EAS builds → location features fail or crash on permission request.

**Recommended change (app.config.ts plugins array):**

```typescript
[
  'expo-location',
  {
    locationWhenInUsePermission:
      'TruWell AI uses your location to find nearby hospitals in emergencies.',
  },
],
```

(Copy string from `app.json` L66 or harmonize with brand voice in app.config.ts.)

---

## Version sync — recommended exact edits

### app.json

```json
"version": "3.0.0"
```

```json
"ios": {
  "supportsTablet": false,
  "buildNumber": "1",
  ...
}
```

```json
"android": {
  "versionCode": 1,
  ...
}
```

```json
"userInterfaceStyle": "automatic"
```

### package.json (optional consistency)

```json
"version": "3.0.0"
```

---

## Execution order (Phase 21)

| Step | File | Risk if skipped |
| ---- | ---- | --------------- |
| 1 | Add expo-location to app.config.ts | Location permission missing in prod |
| 2 | Sync app.json version + tablet + UI style | Developer confusion |
| 3 | Sync plugin lists | Local `expo prebuild` drift |
| 4 | Verify `npx tsc --noEmit` | — |
| 5 | DevOps confirm EAS remote version | Wrong store version |

---

## Do not change in alignment phase

- Bundle ID / package name (`com.truwell.ai`)  
- EAS project ID  
- newArchEnabled: false  
- Onboarding routes or flow  

# Phase 18 EAS Deployment Checklist

**Date:** 2026-05-30  
**App:** TruWell AI (`com.truwell.ai`)  
**EAS Project ID:** `4e20596c-020b-4df8-a5bc-32b96aa42708`  
**Store version (dynamic config):** `3.0.0` (iOS build `1`, Android `versionCode` 1)

**Important:** Commands below are **documented only**. Phase 18 does **not** execute builds.

---

## Prerequisites (all profiles)

| Step | Command / action | Owner |
| ---- | ---------------- | ----- |
| 1 | Install EAS CLI: `npm install -g eas-cli` | DevOps |
| 2 | Login: `eas login` | DevOps |
| 3 | Working directory: `mobile/` | DevOps |
| 4 | Confirm linked project: `eas project:info` | DevOps |
| 5 | Node 18+ and dependencies: `npm ci` | DevOps |
| 6 | TypeScript clean: `npx tsc --noEmit` | Engineering |

### Environment secrets (preview + production)

Set before **preview** or **production** builds used for QA or store:

```powershell
cd mobile

# List current env (verify before build)
eas env:list --environment production
eas env:list --environment preview

# Example: create/update (use actual values — do not commit)
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL --value "https://YOUR_REF.supabase.co" --visibility plaintext
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "YOUR_ANON_KEY" --visibility secret
eas env:create --environment production --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com" --visibility plaintext
```

Optional:

```powershell
eas env:create --environment production --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --value "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com" --visibility plaintext
eas env:create --environment production --name EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY --value "pk_live_..." --visibility secret
```

Mirror the same vars for `--environment preview` if QA uses preview builds.

---

## Profile 1 — Development build

**Purpose:** Dev client with hot reload, native module debugging, local iteration.  
**Distribution:** Internal  
**Not for store submit.**

### iOS — development

**Prerequisites**

- Apple Developer account enrolled
- Device registered for ad hoc/internal install (or simulator build via local `expo run:ios`)
- EAS iOS credentials configured (`eas credentials`)

**Commands**

```powershell
cd mobile
eas build --profile development --platform ios
```

**Expected output**

- EAS build URL in terminal
- `.ipa` artifact for internal distribution
- Install via EAS internal distribution link or `eas build:run`

**Post-build verify**

- App launches with dev menu
- Supabase connects (dev env vars)
- Onboarding welcome loads

### Android — development

**Prerequisites**

- Google Play Console not required for internal APK/AAB from EAS
- USB debugging optional for sideload

**Commands**

```powershell
cd mobile
eas build --profile development --platform android
```

**Expected output**

- `.apk` or dev-client artifact (profile default)
- Download link from EAS dashboard

**Post-build verify**

- Dev client installs on Pixel/Samsung
- `adb install` if sideloading

---

## Profile 2 — Preview build

**Purpose:** **QA primary artifact** — internal distribution, Android APK for fast sideload, iOS TestFlight-adjacent internal testing.  
**Distribution:** Internal  
**Use for:** Phase 18 QA matrix (C1–C15).

### iOS — preview

**Prerequisites**

- Production-like env vars on `preview` environment
- Test devices registered
- Recommend TestFlight if internal ad hoc limit reached

**Commands**

```powershell
cd mobile
eas build --profile preview --platform ios
```

**Expected output**

- Release-style iOS build (no dev menu if dev-client not primary)
- Internal install link or TestFlight upload (if configured)

**QA handoff**

- Record build ID in `PHASE_17_DEVICE_VALIDATION_MATRIX.md` header
- Distribute to iPhone SE + iPhone 15 Pro testers

### Android — preview

**Prerequisites**

- `preview` env vars set (Supabase + Google)
- Release keystore via EAS (or first-build credential setup)

**Commands**

```powershell
cd mobile
eas build --profile preview --platform android
```

**Expected output**

- **APK** (`buildType: apk` in `eas.json`) — direct sideload
- SHA-1 from EAS credentials → add to Google Cloud OAuth if not done

**QA handoff**

- Sideload APK on Pixel + Samsung
- Run C4 Google OAuth immediately after install

### Both platforms — preview

```powershell
cd mobile
eas build --profile preview --platform all
```

---

## Profile 3 — Production build

**Purpose:** App Store + Google Play submission artifacts.  
**Distribution:** Store  
**Use for:** Final submit after QA matrix **PASS**.

### iOS — production

**Prerequisites**

- All P0 env vars on `production` environment
- App Store Connect app record for `com.truwell.ai`
- Sign in with Apple capability confirmed
- Version `3.0.0` / build `1` (increment build for resubmit)
- QA matrix signed off on **preview** or prior production RC

**Commands**

```powershell
cd mobile
eas build --profile production --platform ios
```

**Expected output**

- `.ipa` for App Store Connect
- Build appears in EAS dashboard as `finished`

**Submit (separate step — do not run until QA PASS)**

```powershell
cd mobile
eas submit --profile production --platform ios --latest
```

Or submit specific build:

```powershell
eas submit --profile production --platform ios --id BUILD_ID
```

### Android — production

**Prerequisites**

- Play Console app created
- Production signing key in EAS
- **AAB** required (`buildType: app-bundle`)
- Data safety + privacy policy URLs ready
- OAuth SHA-1 for **production** keystore in Google Cloud

**Commands**

```powershell
cd mobile
eas build --profile production --platform android
```

**Expected output**

- `.aab` (Android App Bundle)
- Upload-ready for Play Console internal / closed / production track

**Submit**

```powershell
cd mobile
eas submit --profile production --platform android --latest
```

### Both platforms — production

```powershell
cd mobile
eas build --profile production --platform all
```

---

## Recommended execution sequence (Phase 18)

| Order | Action | Profile | Platform |
| ----- | ------ | ------- | -------- |
| 1 | Set EAS env vars | preview + production | — |
| 2 | `eas build` | preview | android |
| 3 | QA starts Pixel + Samsung (C1, C4, C6 first) | preview | android |
| 4 | `eas build` | preview | ios |
| 5 | QA iPhone SE + 15 Pro | preview | ios |
| 6 | Fix defects if any | — | — |
| 7 | `eas build` | production | all |
| 8 | `eas submit` | production | all |

---

## Credential commands (reference)

```powershell
cd mobile
eas credentials --platform ios
eas credentials --platform android
```

---

## Build verification checklist

| Check | Dev | Preview | Production |
| ----- | --- | ------- | ---------- |
| Build completes on EAS | ☐ | ☐ | ☐ |
| Correct version `3.0.0` shown in app | ☐ | ☐ | ☐ |
| Supabase session works | ☐ | ☐ | ☐ |
| Google OAuth works | ☐ | ☐ | ☐ |
| Apple OAuth works (iOS) | ☐ | N/A Android | ☐ |
| Onboarding cold start → welcome | ☐ | ☐ | ☐ |
| No placeholder Supabase URL in logs | ☐ | ☐ | ☐ |

---

## DevOps sign-off

| Item | Initials | Date |
| ---- | -------- | ---- |
| EAS env vars set (preview) | | |
| EAS env vars set (production) | | |
| Preview Android build ID: __________ | | |
| Preview iOS build ID: __________ | | |
| Production build IDs recorded | | |

# Phase 18 Store Submission Package

**Date:** 2026-05-30  
**App:** TruWell AI v3.0.0  
**Bundle ID:** `com.truwell.ai` (iOS + Android)  
**EAS Project:** `4e20596c-020b-4df8-a5bc-32b96aa42708`  
**Prerequisite:** QA matrix **PASS** (`PHASE_17_DEVICE_VALIDATION_MATRIX.md`)

---

## Submission readiness overview

| Store | Status | Submit after |
| ----- | ------ | ------------ |
| Apple App Store | **READY WITH CONDITIONS** | QA PASS + production iOS build |
| Google Play Store | **READY WITH CONDITIONS** | QA PASS + production AAB |

---

## Section 5 — Apple App Store submission checklist

### Build requirements

| Item | Requirement | Status |
| ---- | ----------- | ------ |
| Build profile | EAS `production` — iOS Release | ☐ |
| Artifact | `.ipa` via `eas build --profile production --platform ios` | ☐ |
| Version | `3.0.0` (CFBundleShortVersionString) | ☐ |
| Build number | `1` (increment for resubmits) | ☐ |
| Bundle ID | `com.truwell.ai` | ☐ |
| Minimum iOS | Verify in Expo SDK 54 docs / build settings | ☐ |
| Sign in with Apple | Required (Google also offered) | ☐ |
| No dev-only dependencies blocking release | Review `expo-dev-client` in production artifact | ☐ |
| TestFlight validation | Optional but recommended before App Review | ☐ |
| Submit command | `eas submit --profile production --platform ios --latest` | ☐ |

### Screenshots required

| Device class | Size (typical) | Content suggestion | Count |
| ------------ | -------------- | ------------------ | ----- |
| iPhone 6.7" | 1290 × 2796 | Welcome, role selection, score reveal | 3–10 |
| iPhone 6.5" | 1284 × 2778 | Subscription screen, account creation | 3–10 |
| iPhone 5.5" | 1242 × 2208 | iPhone SE layout proof (optional) | 1–3 |
| iPad | N/A | `supportsTablet: false` — iPad screenshots not required | — |

**Onboarding screenshots to capture after QA PASS:**

1. Screen 1 — Welcome (ShieldLogo, CTA)
2. Screen 2 — Role selection (Guardian / Professional)
3. Screen 6 — Score reveal
4. Screen 10 — Subscription / trial
5. Screen 11 — Account creation

### Metadata required

| Field | Guidance | Status |
| ----- | -------- | ------ |
| App name | TruWell AI | ☐ |
| Subtitle | Health / wellness positioning (≤30 chars) | ☐ |
| Description | Mention onboarding, AI wellness plan, **not medical advice** | ☐ |
| Keywords | Comma-separated | ☐ |
| Support URL | Required | ☐ |
| Marketing URL | Optional | ☐ |
| Copyright | Entity name + year | ☐ |
| Primary category | Health & Fitness (typical) | ☐ |
| Age rating | Complete questionnaire (health content) | ☐ |
| Review notes | Test account credentials for Apple reviewer | ☐ |

### Privacy requirements

| Item | Detail | Status |
| ---- | ------ | ------ |
| Privacy Policy URL | Required; must match in-app links | ☐ |
| App Privacy (nutrition labels) | Declare: health, contact info, identifiers, usage data | ☐ |
| Data linked to user | Email, profile, onboarding events | ☐ |
| Data used to track | Confirm no third-party ad tracking or declare | ☐ |
| Permission strings | Camera, photos, mic, notifications, Face ID — match `app.config.ts` | ☐ |
| HealthKit | Only if HealthKit integrated — verify scope | ☐ |

### Subscription disclosures

| Item | Detail | Status |
| ---- | ------ | ------ |
| In-app purchases | Declare subscriptions if Adapty products live | ☐ |
| Subscription group | App Store Connect configuration | ☐ |
| Price display | $9.99/month, 7-day trial — **align with actual IAP behavior** | ☐ |
| Trial terms | If screen 10 CTA does not start StoreKit trial, **description must not mislead** | ☐ |
| Restore purchases | Available in Settings → Subscription | ☐ |
| Terms of Use (EULA) | Required for subscriptions — link in App Store Connect | ☐ |

### Account creation disclosures

| Item | Detail | Status |
| ---- | ------ | ------ |
| Sign in with Apple | Offered on iOS account screen | ☐ |
| Google Sign-In | Offered | ☐ |
| Email registration | Offered with password | ☐ |
| Terms acceptance | Checkbox on account screen — **verify tappable links** (Phase 17 R05) | ☐ |
| Continue without account | "Continue Free" on subscription — disclose limited access | ☐ |
| Account deletion | In-app deletion path (`lib/accountDeletion.ts`) — disclose in privacy policy | ☐ |
| Demo account for review | Provide in App Review notes | ☐ |

---

## Section 5 — Google Play Store submission checklist

### Build requirements

| Item | Requirement | Status |
| ---- | ----------- | ------ |
| Build profile | EAS `production` — Android app-bundle | ☐ |
| Artifact | `.aab` via `eas build --profile production --platform android` | ☐ |
| Version name | `3.0.0` | ☐ |
| Version code | `1` (increment for updates) | ☐ |
| Package name | `com.truwell.ai` | ☐ |
| Target SDK | Expo SDK 54 default — verify Play requirements | ☐ |
| Signing | EAS-managed production keystore | ☐ |
| Internal testing track | Upload AAB before production promotion | ☐ |
| Submit command | `eas submit --profile production --platform android --latest` | ☐ |

### Screenshots required

| Type | Size (typical) | Content | Count |
| ---- | -------------- | ------- | ----- |
| Phone | 1080 × 1920 min | Onboarding funnel screens | 2–8 |
| 7-inch tablet | Optional | Not required if phone-only | — |
| 10-inch tablet | Optional | — | — |
| Feature graphic | 1024 × 500 | Brand + tagline | 1 |

**Same five onboarding screens as Apple list.**

### Metadata required

| Field | Guidance | Status |
| ----- | -------- | ------ |
| App title | TruWell AI (≤30 chars) | ☐ |
| Short description | ≤80 chars | ☐ |
| Full description | Features, onboarding, disclaimers | ☐ |
| App category | Health & Fitness | ☐ |
| Contact email | Required | ☐ |
| Privacy policy URL | Required | ☐ |
| Content rating | IARC questionnaire | ☐ |
| Target audience | Age groups | ☐ |
| News app / COVID declarations | If applicable | ☐ |

### Privacy requirements

| Item | Detail | Status |
| ---- | ------ | ------ |
| Data safety form | Complete all sections | ☐ |
| Data collected | Email, name, health preferences, photos (camera), location (if used) | ☐ |
| Data shared | Supabase, Adapty, Stripe (if applicable) | ☐ |
| Encryption in transit | Yes (HTTPS) | ☐ |
| Deletion request | Account deletion supported — document | ☐ |
| Permissions justification | Match `AndroidManifest` from build | ☐ |

### Subscription disclosures

| Item | Detail | Status |
| ---- | ------ | ------ |
| Subscriptions declared | If monetization active | ☐ |
| Base plan IDs | Match Adapty / Play Console products | ☐ |
| Free trial | 7-day — align UX with Play Billing policy | ☐ |
| Pricing | $9.99/month in metadata if offered | ☐ |
| Restore / manage | Settings subscription screen | ☐ |

### Account creation disclosures

| Item | Detail | Status |
| ---- | ------ | ------ |
| OAuth (Google) | Declared in Data safety | ☐ |
| Email signup | Declared | ☐ |
| Optional account | Continue Free path documented | ☐ |
| Terms & Privacy | Links required in store listing and in-app | ☐ |
| Families policy | If applicable | ☐ |

---

## Cross-store legal & product bundle

| Document / decision | Apple | Google | Owner |
| ------------------- | ----- | ------ | ----- |
| Privacy policy (hosted URL) | ☐ | ☐ | Legal |
| Terms of Service URL | ☐ | ☐ | Legal |
| Trial UX product sign-off (Option A) | ☐ | ☐ | Product |
| Health disclaimer in description | ☐ | ☐ | Product + Legal |
| Reviewer test credentials | ☐ | ☐ | QA |
| Export compliance (encryption) | ☐ | N/A | DevOps |

---

## Pre-submit final gate

| Gate | Apple | Google |
| ---- | ----- | ------ |
| QA matrix 100% Pass | ☐ | ☐ |
| Production build uploaded | ☐ | ☐ |
| Metadata complete | ☐ | ☐ |
| Privacy forms complete | ☐ | ☐ |
| Subscription disclosure accurate | ☐ | ☐ |
| Legal URLs live | ☐ | ☐ |

---

## Section 6 — Final release readiness (Phase 18)

### Updated metrics

| Metric | Phase 17 | Phase 18 | Delta |
| ------ | -------- | -------- | ----- |
| **Production readiness %** | 91% | **93%** | +2 (build runbook + env audit package complete) |
| **Confidence %** | 80% | **82%** | +2 (operational clarity; execution not yet done) |
| Spec compliance | 95% | 95% | — |

### Release stage readiness

| Stage | Status | Rationale |
| ----- | ------ | --------- |
| **READY FOR BUILD** | **CONDITIONAL** | EAS profiles valid; env vars must be set first |
| **READY FOR QA** | **NO** | No preview/production QA artifact distributed; matrix empty |
| **READY FOR SUBMISSION** | **NO** | QA gate open; legal/terms conditional |
| **READY FOR RELEASE** | **NO** | Store review + GA not started |

### Recommended timeline (from Phase 18)

| Milestone | Target |
| --------- | ------ |
| EAS env + preview builds | Day 0 |
| QA matrix complete | Day 3–5 |
| Production build + store submit | Day 5–10 |
| Public release (post-review) | Day 10–21 |

---

## Package contents index

| File | Purpose |
| ---- | ------- |
| `PHASE_18_BUILD_READINESS_REPORT.md` | Config audit PASS/CONDITIONAL |
| `PHASE_18_EAS_DEPLOYMENT_CHECKLIST.md` | Exact build commands |
| `PHASE_18_PRODUCTION_ENV_AUDIT.md` | Env owners + verification |
| `PHASE_18_QA_EXECUTION_PLAN.md` | Test order + time estimates |
| `PHASE_17_DEVICE_VALIDATION_MATRIX.md` | Pass/Fail recording |
| `PHASE_17_STORE_SUBMISSION_READINESS.md` | Phase 17 store baseline |

---

## Store release approver

**Apple submit approved:** ☐ Name: __________ Date: __________  
**Google submit approved:** ☐ Name: __________ Date: __________

---

## TypeScript validation (Phase 18)

```powershell
cd mobile
npx tsc --noEmit
```

**Exit code:** `0`  
**Result:** **PASS**

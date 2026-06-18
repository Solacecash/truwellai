# Phase 20E — Build Authorization

**Date:** 2026-05-30  
**Decision:** Preview builds only (production build deferred)

---

# AUTHORIZED WITH CONDITIONS

---

## Gate evaluation

### Engineering readiness

| Criterion | Status | Evidence |
| --------- | ------ | -------- |
| TypeScript compile | **PASS** | `tsc --noEmit` exit 0 |
| Onboarding funnel code-complete | **PASS** | Phases 14–19 |
| No open code regressions | **PASS** | Phase 20 validation |
| Known legal gaps in onboarding account | **CONDITIONAL** | L1 BLOCKING — does not prevent build, affects store |
| expo-location plugin gap | **CONDITIONAL** | May affect non-onboarding QA (C13/C14 adjacent) |

**Engineering:** **AUTHORIZED** for preview build

---

### Configuration readiness

| Criterion | Status | Evidence |
| --------- | ------ | -------- |
| eas.json profiles | **PASS** | dev, preview, production |
| app.config.ts valid | **PASS** | Full plugin set |
| app.json drift | **CONDITIONAL** | Version 1.0.0 vs 3.0.0 — EAS uses 3.0.0 |
| EAS env vars set | **NOT VERIFIED** | **Condition** |
| Remote app version | **NOT VERIFIED** | `appVersionSource: remote` |

**Configuration:** **CONDITIONAL** — authorize preview **after** EAS preview env confirmed

---

### Store readiness

| Criterion | Status |
| --------- | ------ |
| Terms links on onboarding account | **FAIL** |
| OAuth terms bypass | **FAIL** |
| Trial/IAP alignment | **CONDITIONAL** |
| Deletion / restore | **PASS** |

**Store:** **NOT AUTHORIZED** for production submit

---

### QA readiness

| Criterion | Status |
| --------- | ------ |
| QA execution package | **PASS** — Phase 20F |
| Device matrix template | **PASS** |
| Build artifact | **MISSING** |
| QA team briefed | **UNKNOWN** |

**QA:** **CONDITIONAL** — authorize handoff **after** preview artifact delivered

---

## Authorization matrix

| Build type | Authorized? | Conditions |
| ---------- | ----------- | ---------- |
| **Development** | **YES** | Standard local/EAS dev |
| **Preview (iOS + Android)** | **YES WITH CONDITIONS** | See below |
| **Production** | **NO** | After QA PASS + legal remediation |
| **Store submit** | **NO** | After full gate |

---

## Conditions for preview build authorization

| # | Condition | Owner | Required before `eas build --profile preview` |
| - | --------- | ----- | --------------------------------------------- |
| 1 | `EXPO_PUBLIC_SUPABASE_URL` set on EAS preview | DevOps | **Yes** |
| 2 | `EXPO_PUBLIC_SUPABASE_ANON_KEY` set on EAS preview | DevOps | **Yes** |
| 3 | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` set on EAS preview | DevOps | **Yes** (C4) |
| 4 | Engineering notified of L1/L2 legal gaps — QA only, not store | Product/Legal | **Yes** |
| 5 | Build ID recorded for QA matrix | DevOps | **Yes** (post-build) |

**Conditions NOT required for preview** (defer to Phase 21):
- Terms link code fix  
- app.json sync  
- expo-location plugin add  

*Rationale:* Preview validates onboarding funnel; legal fixes required before production/submit, not necessarily before first internal QA.*

---

## Evidence summary

| For | Against |
| --- | ------- |
| tsc PASS | EAS env not certified |
| Complete QA runbooks | Zero prior builds |
| Preview profile ready (APK for Android) | Store blockers on account screen |
| Phase 19 build readiness CONDITIONAL not FAIL | OAuth SHA-1 unverified |

---

## Authorized commands (DevOps — after conditions 1–3)

```powershell
cd mobile
eas build --profile preview --platform android
eas build --profile preview --platform ios
```

**Not authorized in Phase 20:** `eas build --profile production`, `eas submit`

---

## Signatures

| Role | Preview authorized | Name | Date |
| ---- | ------------------ | ---- | ---- |
| Engineering Lead | ☐ | | |
| DevOps | ☐ | | |
| QA Lead | ☐ | | |
| Product | ☐ | | |

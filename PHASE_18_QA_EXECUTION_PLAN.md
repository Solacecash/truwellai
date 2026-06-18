# Phase 18 QA Execution Plan

**Date:** 2026-05-30  
**Build requirement:** EAS **preview** or **production** profile (not Expo Go)  
**Recording template:** `PHASE_17_DEVICE_VALIDATION_MATRIX.md`  
**Code modifications:** **None**

---

## Objectives

1. Execute all **C1–C15** critical tests on four device classes  
2. Prioritize onboarding, auth, subscription, resume, and completion paths  
3. Block store submit until QA lead sign-off on matrix  
4. File defects against preview build ID before production build

---

## Prerequisites

| # | Prerequisite | Owner | Status |
| - | ------------ | ----- | ------ |
| 1 | Preview Android APK built and distributed | DevOps | ☐ |
| 2 | Preview iOS build on iPhone SE + 15 Pro | DevOps | ☐ |
| 3 | EAS env vars verified (`PHASE_18_PRODUCTION_ENV_AUDIT.md`) | DevOps | ☐ |
| 4 | Test accounts: fresh emails, Google, Apple | QA | ☐ |
| 5 | Matrix header filled (build ID, version `3.0.0`) | QA Lead | ☐ |
| 6 | Defect tracking tool ready (Linear/Jira/etc.) | QA Lead | ☐ |

---

## Test account strategy

| Account type | Purpose | Notes |
| ------------ | ------- | ----- |
| Fresh install (no account) | C1, C2, C3, C7–C12 | Delete app between cold-start tests |
| `+alias` email pool | C6, C10 | e.g. `qa+guardian1@domain.com` |
| Google test user | C4 | Professional path only |
| Apple ID (sandbox) | C5 | iOS only |
| Pre-existing login user | C15 | Created before test session |
| Continue-free only | C9 | No account; verify no crash |

**Rule:** One full path (C2 or C3) per clean install. Resume tests (C7, C8) use dedicated installs.

---

## Priority tiers

| Tier | Tests | Focus |
| ---- | ----- | ----- |
| **P0 — Critical onboarding** | C1, C2, C3, C12 | Funnel entry, both role paths, AI processing |
| **P0 — Authentication** | C4, C5, C6, C11, C15 | OAuth, email, returning user |
| **P0 — Subscription** | C9, C10 | Continue free, trial → account |
| **P0 — Resume** | C7, C8 | Kill/reopen persistence |
| **P1 — Completion** | C2, C3, C10 (end state) | `/enter` vs `/(expert)` |
| **P1 — Regression** | C13, C14 | Scanner, telehealth post-onboarding |

---

## Recommended execution order

### Wave 1 — Smoke (all devices, ~30 min per device)

Run first to catch build/config failures before full paths.

| Order | Test | Device order |
| ----- | ---- | -------------- |
| 1 | **C1** Fresh cold start | Pixel → Samsung → iPhone SE → 15 Pro |
| 2 | **C11** Sign in from welcome | Same order |
| 3 | **C15** Existing login user | Same order |
| 4 | **C12** ai-processing (partial path) | One device per OS |

**Gate:** If C1 fails on any device, **stop** — escalate to DevOps (env/build).

---

### Wave 2 — Authentication (~45 min per device)

| Order | Test | iPhone SE | 15 Pro | Pixel | Samsung |
| ----- | ---- | --------- | ------ | ----- | ------- |
| 1 | **C6** Email guardian | ✓ | ✓ | ✓ | ✓ |
| 2 | **C4** Google professional | ✓ | ✓ | ✓ | ✓ |
| 3 | **C5** Apple professional | ✓ | ✓ | N/A | N/A |

**Parallelization:** Android C4/C6 on Pixel while iOS C5 on SE.

---

### Wave 3 — Full onboarding paths (~60 min per path per device)

| Order | Test | Description |
| ----- | ---- | ----------- |
| 1 | **C2** Guardian 1→11 | Full funnel + account → `/enter` |
| 2 | **C3** Professional 1→11 | Full funnel → `/(expert)` |

**Device assignment suggestion**

| Tester | Device | Primary paths |
| ------ | ------ | ------------- |
| Tester A | iPhone SE | C2, C3, C7, C8 |
| Tester B | iPhone 15 Pro | C2, C3 (safe area check) |
| Tester C | Pixel | C2, C3, C4 |
| Tester D | Samsung | C2, C3, C4 |

---

### Wave 4 — Subscription & resume (~40 min per device)

| Order | Test | Notes |
| ----- | ---- | ----- |
| 1 | **C9** Continue free | From subscription screen; no account |
| 2 | **C10** Trial → account → complete | Full loop check |
| 3 | **C7** Kill at score-reveal | Dedicated install; mid-funnel |
| 4 | **C8** Kill at subscription | Dedicated install |

---

### Wave 5 — Regression (~20 min per device)

| Order | Test | Notes |
| ----- | ---- | ----- |
| 1 | **C13** Scanner | After onboarding complete |
| 2 | **C14** Telehealth | After onboarding complete |

---

### Wave 6 — Extended (optional)

| Flow | Devices |
| ---- | ------- |
| Logout → cold start → spec welcome | All |
| Logout → login → dashboard | All |
| Deep link `/onboarding` | One iOS + one Android |

---

## Per-device execution schedule

### iPhone SE (iOS baseline, smallest viewport)

| Block | Tests | Est. time |
| ----- | ----- | --------- |
| Smoke | C1, C11, C15, C12 | 45 min |
| Auth | C5, C6, C4 | 45 min |
| Full paths | C2, C3 | 2 hr |
| Subscription + resume | C9, C10, C7, C8 | 1 hr |
| Regression | C13, C14 | 20 min |
| **Total** | **15 tests** | **~4.5 hr** |

### iPhone 15 Pro (iOS safe area / Dynamic Island)

| Block | Tests | Est. time |
| ----- | ----- | --------- |
| Smoke | C1, C11, C15 | 30 min |
| Auth | C5, C6, C4 | 45 min |
| Full paths | C2, C3 | 2 hr |
| Subscription + resume | C9, C10, C7, C8 | 1 hr |
| Regression | C13, C14 | 20 min |
| **Total** | **15 tests** | **~4.5 hr** |

### Pixel (Android reference)

| Block | Tests | Est. time |
| ----- | ----- | --------- |
| Smoke | C1, C11, C15, C12 | 45 min |
| Auth | C6, C4 (C5 N/A) | 40 min |
| Full paths | C2, C3 | 2 hr |
| Subscription + resume | C9, C10, C7, C8 | 1 hr |
| Regression | C13, C14 | 20 min |
| **Total** | **14 executable** (C5 N/A) | **~4.5 hr** |

### Samsung Galaxy (Android OEM variance)

| Block | Tests | Est. time |
| ----- | ----- | --------- |
| Smoke | C1, C11, C15 | 30 min |
| Auth | C6, C4 | 40 min |
| Full paths | C2, C3 | 2 hr |
| Subscription + resume | C9, C10, C7, C8 | 1 hr |
| Regression | C13, C14 | 20 min |
| **Total** | **14 executable** | **~4.5 hr** |

---

## Team effort summary

| Metric | Value |
| ------ | ----- |
| Critical tests per device | 15 (14 on Android with C5 N/A) |
| Total device executions | 60 slots (58 executable + 2 N/A documented) |
| Sequential single tester | **~18 hours** |
| Parallel (4 testers, 1 device each) | **~1.5–2 business days** |
| With DevOps env fixes + 1 retest cycle | **~3–5 business days** |

---

## Defect severity guide

| Severity | Examples | Action |
| -------- | -------- | ------ |
| **S0 Blocker** | C1 crash, OAuth total failure, cannot complete C2/C3 | Stop QA; hotfix + new preview build |
| **S1 Critical** | Wrong route after pro signup, resume broken (C7/C8) | Fix before production build |
| **S2 Major** | C9 crash, C10 loop, missing profile save | Fix before store submit |
| **S3 Minor** | Copy, animation timing, visual on SE | Can ship with documented known issue if Product approves |

---

## Daily standup template

| Day | Goal | Exit criteria |
| --- | ---- | ------------- |
| Day 0 | DevOps delivers preview builds + env | C1 passes on Pixel + SE |
| Day 1 | Wave 1–2 all devices | Auth tests pass or defects filed |
| Day 2 | Wave 3–4 | C2, C3, C7–C10 pass on all devices |
| Day 3 | Wave 5 + retests | Matrix 100% Pass or N/A |
| Day 4 | QA lead sign-off | Matrix signed; production build approved |

---

## QA completion gate

| Criterion | Required |
| --------- | -------- |
| All C1–C15 Pass or documented N/A (C5 Android) | **Yes** |
| Zero open S0/S1 defects | **Yes** |
| Build ID recorded in matrix | **Yes** |
| QA lead signature on matrix | **Yes** |
| Product sign-off on trial UX (C10 behavior) | **Yes** |

**QA lead:** _________________________ **Date:** __________

---

## TypeScript validation (Phase 18)

```powershell
cd mobile
npx tsc --noEmit
```

**Exit code:** `0` — **PASS**

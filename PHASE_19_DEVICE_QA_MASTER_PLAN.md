# Phase 19E — Device QA Master Plan

**Date:** 2026-05-30  
**Build:** EAS preview or production (not Expo Go)  
**Recording template:** `PHASE_17_DEVICE_VALIDATION_MATRIX.md`  
**Execution guide:** `PHASE_18_QA_EXECUTION_PLAN.md`

**Global rules**

- Fresh install = delete app before C1/C2/C3/C7/C8  
- Screenshot every **FAIL** and every **first Pass per device** for C1, C2, C3, C10  
- Screen record C4, C5, C6, C7, C8, C10 (auth + resume + completion)  
- Fill matrix Pass/Fail/Blocked + initials + date  

---

## iPhone SE

| Test ID | Expected result | Failure criteria | Screenshot | Recording |
| ------- | --------------- | ---------------- | ---------- | --------- |
| **C1** | Spec welcome: ShieldLogo, primary CTA, circuit texture visible | Legacy welcome, crash, blank screen, wrong route | Yes (first pass) | Optional |
| **C2** | Guardian path screens 1→11; lands on `/enter`; profile saved in Supabase | Wrong screen order, crash, stuck loop, wrong destination | Yes (completion screen) | Yes (full path) |
| **C3** | Professional path 1→11; lands on `/(expert)` | Routes to `/enter` instead of expert | Yes | Yes |
| **C4** | Google pro signup → expert dashboard; metadata `user_type: expert` | OAuth error, wrong dashboard, config missing alert | Yes on fail | Yes |
| **C5** | Apple pro signup → expert dashboard | Apple sheet fails, wrong route | Yes on fail | Yes |
| **C6** | Email guardian signup → `/enter`; profile row exists | Email confirm block with no UX, signup error | Yes on fail | Yes |
| **C7** | Kill at score-reveal; reopen resumes mid-funnel (not welcome) | Resets to welcome or wrong step | Yes on fail | Yes |
| **C8** | Kill at subscription; reopen at subscription or account | Lost state, crash | Yes on fail | Yes |
| **C9** | Continue Free → main app without crash | Crash, forced account | No | Optional |
| **C10** | Trial CTA → account → complete; no nav loop | Infinite loop, crash at account | Yes | Yes |
| **C11** | Welcome sign-in → login works | Broken link, crash | No | Optional |
| **C12** | ai-processing: no back; auto-advance ~3–4s | Stuck, back button visible | No | Optional |
| **C13** | Scanner opens post-onboarding | Regression crash | No | Optional |
| **C14** | Telehealth opens post-onboarding | Regression crash | No | Optional |
| **C15** | Existing user login → dashboard; no forced onboarding | Forced back into funnel | Yes on fail | Optional |

**Est. time:** ~4.5 hours

---

## iPhone 15 Pro

| Test ID | Expected result | Failure criteria | Screenshot | Recording |
| ------- | --------------- | ---------------- | ---------- | --------- |
| **C1** | Spec welcome; safe areas correct (Dynamic Island) | Clipped UI, wrong layout | Yes (first pass) | Optional |
| **C2** | Guardian 1→11 → `/enter` | Same as SE | Yes | Yes |
| **C3** | Professional → `/(expert)` | Same as SE | Yes | Yes |
| **C4** | Google → expert dashboard | OAuth fail | On fail | Yes |
| **C5** | Apple → expert dashboard | OAuth fail | On fail | Yes |
| **C6** | Email guardian → `/enter` | Signup fail | On fail | Yes |
| **C7** | Resume score-reveal | State loss | On fail | Yes |
| **C8** | Resume subscription | State loss | On fail | Yes |
| **C9** | Continue Free stable | Crash | No | Optional |
| **C10** | Trial path completes | Loop/crash | Yes | Yes |
| **C11** | Sign-in works | Broken | No | Optional |
| **C12** | ai-processing auto-advance | Stuck | No | Optional |
| **C13** | Scanner regression | Crash | No | Optional |
| **C14** | Telehealth regression | Crash | No | Optional |
| **C15** | Returning user → dashboard | Forced onboarding | On fail | Optional |

**Est. time:** ~4.5 hours

---

## Pixel

| Test ID | Expected result | Failure criteria | Screenshot | Recording |
| ------- | --------------- | ---------------- | ---------- | --------- |
| **C1** | Spec welcome | Legacy route, crash | Yes | Optional |
| **C2** | Guardian → `/enter` | Path break | Yes | Yes |
| **C3** | Professional → `/(expert)` | Wrong route | Yes | Yes |
| **C4** | Google pro → expert (SHA-1 must match release keystore) | `DEVELOPER_ERROR`, sign-in failed | **Required** | **Required** |
| **C5** | N/A Android — document N/A | — | N/A note in matrix | N/A |
| **C6** | Email guardian → `/enter` | Fail | On fail | Yes |
| **C7** | Resume score-reveal | Fail | On fail | Yes |
| **C8** | Resume subscription | Fail | On fail | Yes |
| **C9** | Continue Free | Crash | No | Optional |
| **C10** | Trial → account → complete | Loop | Yes | Yes |
| **C11** | Sign-in | Fail | No | Optional |
| **C12** | ai-processing | Stuck | No | Optional |
| **C13** | Scanner | Crash | No | Optional |
| **C14** | Telehealth | Crash | No | Optional |
| **C15** | Returning login | Forced onboarding | On fail | Optional |

**Est. time:** ~4.5 hours (14 executable tests)

---

## Samsung Galaxy

| Test ID | Expected result | Failure criteria | Screenshot | Recording |
| ------- | --------------- | ---------------- | ---------- | --------- |
| **C1** | Spec welcome | OEM-specific layout crash | Yes | Optional |
| **C2** | Guardian → `/enter` | Fail | Yes | Yes |
| **C3** | Professional → `/(expert)` | Fail | Yes | Yes |
| **C4** | Google pro → expert | OAuth / Play Services error | On fail | Yes |
| **C5** | N/A Android | Document N/A | N/A | N/A |
| **C6** | Email signup | Fail | On fail | Yes |
| **C7** | Resume score-reveal | Fail | On fail | Yes |
| **C8** | Resume subscription | Fail | On fail | Yes |
| **C9** | Continue Free | Crash on Samsung One UI | On fail | Optional |
| **C10** | Trial complete path | Loop | Yes | Yes |
| **C11** | Sign-in | Fail | No | Optional |
| **C12** | ai-processing | Stuck | No | Optional |
| **C13** | Scanner | Crash | No | Optional |
| **C14** | Telehealth | Crash | No | Optional |
| **C15** | Returning user | Forced onboarding | On fail | Optional |

**Est. time:** ~4.5 hours

---

## Execution order (all devices)

| Wave | Tests | Priority |
| ---- | ----- | -------- |
| 1 Smoke | C1, C11, C15 | P0 — stop if C1 fails |
| 2 Auth | C4, C5 (iOS), C6 | P0 |
| 3 Full paths | C2, C3 | P0 |
| 4 Subscription/resume | C9, C10, C7, C8 | P0 |
| 5 Regression | C12, C13, C14 | P1 |

---

## Evidence package (per QA sign-off)

| Artifact | Format | Location |
| -------- | ------ | -------- |
| Completed matrix | Markdown | `PHASE_17_DEVICE_VALIDATION_MATRIX.md` |
| Build ID | Text | Matrix header |
| OAuth screen recordings | MP4 | Shared drive |
| FAIL screenshots | PNG | `/qa/phase19/{device}/{testId}/` |
| Defect tickets | Jira/Linear | Linked in matrix notes |

---

## Pass gate

**Minimum:** All C1–C15 Pass on all 4 device classes (C5 = N/A documented on Android).

**QA lead sign-off:** __________________ **Date:** __________

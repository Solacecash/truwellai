# Phase 17 Device Validation Matrix

**Date:** 2026-05-30  
**Reference:** `PHASE_15_PRODUCTION_GO_LIVE_CHECKLIST.md` (C1–C15)  
**Instructions:** Complete one row per test per device. Mark **Pass**, **Fail**, or **Blocked**. Do not assume Pass without runtime execution.

**Build under test:** _______________  
**Build ID / version:** _______________ (app `3.0.0`, build `1`)

---

## iPhone SE

| Test ID | Test Description | Expected Result | Pass | Fail | Blocked | Tester Initials | Device | Date |
| ------- | ---------------- | --------------- | ---- | ---- | ------- | --------------- | ------ | ---- |
| C1 | Fresh install cold start | Spec welcome: ShieldLogo, CTA, circuit texture | ☐ | ☐ | ☐ | | iPhone SE | |
| C2 | Guardian full path 1→11 | Completes to `/enter`; account + profile saved | ☐ | ☐ | ☐ | | iPhone SE | |
| C3 | Professional full path 1→11 | Completes to `/(expert)`; pro OAuth/email | ☐ | ☐ | ☐ | | iPhone SE | |
| C4 | Google signup (professional) | `user_type: expert` → expert dashboard | ☐ | ☐ | ☐ | | iPhone SE | |
| C5 | Apple signup (professional) | Same as C4 (iOS) | ☐ | ☐ | ☐ | | iPhone SE | |
| C6 | Email signup (guardian) | `/enter` + profile saved | ☐ | ☐ | ☐ | | iPhone SE | |
| C7 | Kill app at score-reveal; reopen | Resumes funnel, not welcome | ☐ | ☐ | ☐ | | iPhone SE | |
| C8 | Kill app at subscription; reopen | Resumes subscription or account | ☐ | ☐ | ☐ | | iPhone SE | |
| C9 | Continue free on subscription | Main app without crash | ☐ | ☐ | ☐ | | iPhone SE | |
| C10 | Trial CTA → account → complete | No navigation loop | ☐ | ☐ | ☐ | | iPhone SE | |
| C11 | Sign in from welcome | `/sign-in` → `/login` works | ☐ | ☐ | ☐ | | iPhone SE | |
| C12 | ai-processing | No back button; auto-advance ~3–4s | ☐ | ☐ | ☐ | | iPhone SE | |
| C13 | Post-onboarding scanner | Opens (regression) | ☐ | ☐ | ☐ | | iPhone SE | |
| C14 | Post-onboarding telehealth | Opens (regression) | ☐ | ☐ | ☐ | | iPhone SE | |
| C15 | Existing `/login` user | Dashboard; not forced onboarding | ☐ | ☐ | ☐ | | iPhone SE | |

**iPhone SE summary:** Pass _____ / 15 | Fail _____ | Blocked _____

---

## iPhone 15 Pro

| Test ID | Test Description | Expected Result | Pass | Fail | Blocked | Tester Initials | Device | Date |
| ------- | ---------------- | --------------- | ---- | ---- | ------- | --------------- | ------ | ---- |
| C1 | Fresh install cold start | Spec welcome; safe area OK | ☐ | ☐ | ☐ | | iPhone 15 Pro | |
| C2 | Guardian full path 1→11 | `/enter` + account | ☐ | ☐ | ☐ | | iPhone 15 Pro | |
| C3 | Professional full path 1→11 | `/(expert)` | ☐ | ☐ | ☐ | | iPhone 15 Pro | |
| C4 | Google signup (professional) | Expert dashboard | ☐ | ☐ | ☐ | | iPhone 15 Pro | |
| C5 | Apple signup (professional) | Expert dashboard | ☐ | ☐ | ☐ | | iPhone 15 Pro | |
| C6 | Email signup (guardian) | `/enter` + profile | ☐ | ☐ | ☐ | | iPhone 15 Pro | |
| C7 | Resume score-reveal | Correct step | ☐ | ☐ | ☐ | | iPhone 15 Pro | |
| C8 | Resume subscription | Correct step | ☐ | ☐ | ☐ | | iPhone 15 Pro | |
| C9 | Continue free | No crash | ☐ | ☐ | ☐ | | iPhone 15 Pro | |
| C10 | Trial → account → complete | No loop | ☐ | ☐ | ☐ | | iPhone 15 Pro | |
| C11 | Sign in from welcome | Login works | ☐ | ☐ | ☐ | | iPhone 15 Pro | |
| C12 | ai-processing | Auto-advance | ☐ | ☐ | ☐ | | iPhone 15 Pro | |
| C13 | Scanner regression | Opens | ☐ | ☐ | ☐ | | iPhone 15 Pro | |
| C14 | Telehealth regression | Opens | ☐ | ☐ | ☐ | | iPhone 15 Pro | |
| C15 | Returning login user | Dashboard | ☐ | ☐ | ☐ | | iPhone 15 Pro | |

**iPhone 15 Pro summary:** Pass _____ / 15 | Fail _____ | Blocked _____

---

## Pixel

| Test ID | Test Description | Expected Result | Pass | Fail | Blocked | Tester Initials | Device | Date |
| ------- | ---------------- | --------------- | ---- | ---- | ------- | --------------- | ------ | ---- |
| C1 | Fresh install cold start | Spec welcome | ☐ | ☐ | ☐ | | Pixel | |
| C2 | Guardian full path 1→11 | `/enter` | ☐ | ☐ | ☐ | | Pixel | |
| C3 | Professional full path 1→11 | `/(expert)` | ☐ | ☐ | ☐ | | Pixel | |
| C4 | Google signup (professional) | Expert dashboard | ☐ | ☐ | ☐ | | Pixel | |
| C5 | Apple signup (professional) | N/A Android | ☐ | ☐ | ☐ | | Pixel | |
| C6 | Email signup (guardian) | `/enter` | ☐ | ☐ | ☐ | | Pixel | |
| C7 | Resume score-reveal | Correct step | ☐ | ☐ | ☐ | | Pixel | |
| C8 | Resume subscription | Correct step | ☐ | ☐ | ☐ | | Pixel | |
| C9 | Continue free | No crash | ☐ | ☐ | ☐ | | Pixel | |
| C10 | Trial → account → complete | No loop | ☐ | ☐ | ☐ | | Pixel | |
| C11 | Sign in from welcome | Login works | ☐ | ☐ | ☐ | | Pixel | |
| C12 | ai-processing | No back; auto-advance | ☐ | ☐ | ☐ | | Pixel | |
| C13 | Scanner regression | Opens | ☐ | ☐ | ☐ | | Pixel | |
| C14 | Telehealth regression | Opens | ☐ | ☐ | ☐ | | Pixel | |
| C15 | Returning login user | Dashboard | ☐ | ☐ | ☐ | | Pixel | |

**Pixel summary:** Pass _____ / 15 | Fail _____ | Blocked _____

---

## Samsung Galaxy

| Test ID | Test Description | Expected Result | Pass | Fail | Blocked | Tester Initials | Device | Date |
| ------- | ---------------- | --------------- | ---- | ---- | ------- | --------------- | ------ | ---- |
| C1 | Fresh install cold start | Spec welcome | ☐ | ☐ | ☐ | | Samsung Galaxy | |
| C2 | Guardian full path 1→11 | `/enter` | ☐ | ☐ | ☐ | | Samsung Galaxy | |
| C3 | Professional full path 1→11 | `/(expert)` | ☐ | ☐ | ☐ | | Samsung Galaxy | |
| C4 | Google signup (professional) | Expert dashboard | ☐ | ☐ | ☐ | | Samsung Galaxy | |
| C5 | Apple signup (professional) | N/A Android | ☐ | ☐ | ☐ | | Samsung Galaxy | |
| C6 | Email signup (guardian) | `/enter` | ☐ | ☐ | ☐ | | Samsung Galaxy | |
| C7 | Resume score-reveal | Correct step | ☐ | ☐ | ☐ | | Samsung Galaxy | |
| C8 | Resume subscription | Correct step | ☐ | ☐ | ☐ | | Samsung Galaxy | |
| C9 | Continue free | No crash | ☐ | ☐ | ☐ | | Samsung Galaxy | |
| C10 | Trial → account → complete | No loop | ☐ | ☐ | ☐ | | Samsung Galaxy | |
| C11 | Sign in from welcome | Login works | ☐ | ☐ | ☐ | | Samsung Galaxy | |
| C12 | ai-processing | Auto-advance | ☐ | ☐ | ☐ | | Samsung Galaxy | |
| C13 | Scanner regression | Opens | ☐ | ☐ | ☐ | | Samsung Galaxy | |
| C14 | Telehealth regression | Opens | ☐ | ☐ | ☐ | | Samsung Galaxy | |
| C15 | Returning login user | Dashboard | ☐ | ☐ | ☐ | | Samsung Galaxy | |

**Samsung Galaxy summary:** Pass _____ / 15 | Fail _____ | Blocked _____

---

## Extended flows (optional sign-off)

| Flow | iPhone SE | 15 Pro | Pixel | Samsung |
| ---- | --------- | ------ | ----- | ------- |
| Logout → cold start → spec welcome | ☐ | ☐ | ☐ | ☐ |
| Logout → login → dashboard | ☐ | ☐ | ☐ | ☐ |
| Deep link `/onboarding` | ☐ | ☐ | ☐ | ☐ |

---

## QA gate rule

**Minimum for store submit:** All **C1–C15** marked **Pass** on all four device classes (C5 N/A on Android counts as Pass if documented N/A).

**QA lead sign-off:** _________________________ Date: __________

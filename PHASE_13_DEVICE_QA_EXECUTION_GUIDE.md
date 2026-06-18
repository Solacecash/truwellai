# Phase 13 Device QA Execution Guide

**Date:** 2026-05-30  
**Build:** RC1 — Expo preview / dev client  
**Spec:** `TruWell_AI_Onboarding_Cursor_Prompt.md`  
**Expands:** `PHASE_12_DEVICE_QA_CHECKLIST.md`

---

## Test matrix

| Device class | Representative | OS versions to test |
| ------------ | -------------- | ------------------- |
| **iPhone SE** | iPhone SE (3rd gen) or simulator | iOS 17+ |
| **iPhone 15 Pro** | Physical or simulator | iOS 17+ |
| **Pixel** | Pixel 6/7/8 | Android 13+ |
| **Samsung** | Galaxy S22+ / A54 | Android 13+ One UI |

**Tester fields:** Device model · OS · Build ID · Date · Tester name

---

## Pre-flight (all devices)

| Step | Action | Pass (all) | Notes |
| ---- | ------ | ---------- | ----- |
| PF1 | Clear app data or fresh install | ☐ | |
| PF2 | Confirm network + Supabase reachable | ☐ | |
| PF3 | Confirm Google/Apple credentials in build | ☐ | |
| PF4 | Record cold-start landing route | ☐ | Document if `(auth)/welcome` vs `(onboarding)/welcome` |

---

## Screen 1 — Welcome (`/(onboarding)/welcome`)

**Entry:** Deep link or navigate after resume fix. Document if cold start uses legacy welcome.

| Device | Expected UI | Expected animation | Expected navigation | Expected persistence | Expected analytics | Pass/Fail | Notes |
| ------ | ----------- | ------------------ | ------------------- | ------------------ | ------------------ | --------- | ----- |
| iPhone SE | Navy bg, circuit texture, ShieldLogo 92px, h1 + gradient "had a voice?", 3 stat pills, FOMO glass card, footer CTA | Logo/content FadeInDown stagger 80ms; button spring from bottom | Primary CTA → role; Sign in → `/sign-in` | `conversionFlowStep` = 1 | `onboarding_started` | ☐ | |
| iPhone 15 Pro | Same; safe area respects Dynamic Island | Same | Same | Same | Same | ☐ | |
| Pixel | Same; DM Sans body if fonts loaded | Same | Same | Same | Same | ☐ | |
| Samsung | Same; no CTA overlap with gesture nav | Same | Same | Same | Same | ☐ | |

---

## Screen 2 — Role (`/(onboarding)/role`)

| Device | Expected UI | Expected animation | Expected navigation | Expected persistence | Expected analytics | Pass/Fail | Notes |
| ------ | ----------- | ------------------ | ------------------- | ------------------ | ------------------ | --------- | ----- |
| iPhone SE | Guardian (teal) + Professional (blue) cards; CTA disabled until selection | Card scale 1.02 + check badge spring on tap | Guardian → care-discovery; Pro → practice-profile | `selectedRole`, step 2 | `role_selected` (if wired) | ☐ | |
| iPhone 15 Pro | Same | Same | Same | Same | Same | ☐ | |
| Pixel | CTA opacity 0.4 when disabled | Same | Same | Same | Same | ☐ | |
| Samsung | Same | Same | Same | Same | Same | ☐ | |

---

## Screen 3G — Care Discovery (`/(onboarding)/guardian/care-discovery`)

| Device | Expected UI | Expected animation | Expected navigation | Expected persistence | Expected analytics | Pass/Fail | Notes |
| ------ | ----------- | ------------------ | ------------------- | ------------------ | ------------------ | --------- | ----- |
| iPhone SE | Teal theme; ProgressBar 25%; 2-col GoalCard grid; multi-select | GoalCard spring on toggle | CTA → ai-processing (may route via assessment per build) | `guardianGoals` / selectedGoals | — | ☐ | |
| iPhone 15 Pro | Same | Same | Same | Same | — | ☐ | |
| Pixel | Scroll if grid overflows on SE | Same | Same | Same | — | ☐ | |
| Samsung | Same | Same | Same | Same | — | ☐ | |

---

## Screen 4G — Guardian Assessment (`/(onboarding)/guardian/assessment`)

| Device | Expected UI | Expected animation | Expected navigation | Expected persistence | Expected analytics | Pass/Fail | Notes |
| ------ | ----------- | ------------------ | ------------------- | ------------------ | ------------------ | --------- | ----- |
| iPhone SE | ProgressBar 50%; adaptive chips (max 8 Q); ETA text | Chip select feedback | CTA → ai-processing | `assessmentAnswers` | — | ☐ | |
| iPhone 15 Pro | Same | Same | Same | Same | — | ☐ | |
| Pixel | Same | Same | Same | Same | — | ☐ | |
| Samsung | Same | Same | Same | Same | — | ☐ | |

---

## Screen 3P — Practice Profile (`/(onboarding)/professional/practice-profile`)

| Device | Expected UI | Expected animation | Expected navigation | Expected persistence | Expected analytics | Pass/Fail | Notes |
| ------ | ----------- | ------------------ | ------------------- | ------------------ | ------------------ | --------- | ----- |
| iPhone SE | Cyan theme; ProgressBar 25%; single-select chips (specialization, size, patients/week) | Chip highlight | CTA → workflow | assessment + pro fields | — | ☐ | |
| iPhone 15 Pro | Same | Same | Same | Same | — | ☐ | |
| Pixel | Same | Same | Same | Same | — | ☐ | |
| Samsung | Same | Same | Same | Same | — | ☐ | |

---

## Screen 4P — Workflow (`/(onboarding)/professional/workflow`)

| Device | Expected UI | Expected animation | Expected navigation | Expected persistence | Expected analytics | Pass/Fail | Notes |
| ------ | ----------- | ------------------ | ------------------- | ------------------ | ------------------ | --------- | ----- |
| iPhone SE | ProgressBar 50%; multi-select workflow drains | Chip toggle | CTA → ai-processing | proGoals / answers | — | ☐ | |
| iPhone 15 Pro | Same | Same | Same | Same | — | ☐ | |
| Pixel | Same | Same | Same | Same | — | ☐ | |
| Samsung | Same | Same | Same | Same | ☐ | |

---

## Screen 5 — AI Processing (`/(onboarding)/ai-processing`)

| Device | Expected UI | Expected animation | Expected navigation | Expected persistence | Expected analytics | Pass/Fail | Notes |
| ------ | ----------- | ------------------ | ------------------- | ------------------ | ------------------ | --------- | ----- |
| iPhone SE | No back button; PulseRings + ShieldLogo; 5 checklist items role-specific | Items complete ~900ms each; spinner→teal check spring | Auto → score-reveal ~3–4s | step 5 | — | ☐ | |
| iPhone 15 Pro | Same | Same | Same | Same | — | ☐ | |
| Pixel | Back gesture disabled | Same | Same | Same | — | ☐ | |
| Samsung | Same | Same | Same | Same | — | ☐ | |

---

## Screen 6 — Score Reveal (`/(onboarding)/score-reveal`)

| Device | Expected UI | Expected animation | Expected navigation | Expected persistence | Expected analytics | Pass/Fail | Notes |
| ------ | ----------- | ------------------ | ------------------- | ------------------ | ------------------ | --------- | ----- |
| iPhone SE | Guardian: score 45–85; Pro: 78 + hrs/week subtitle; 4 finding cards; share CTA | ScoreRing 1.2s arc; count-up; reward spring 1.0→1.05→1.0 | Continue → future-vision; Share opens sheet | `healthScore` clamped | — | ☐ | |
| iPhone 15 Pro | Same | Same | Same | Same | — | ☐ | |
| Pixel | expo-sharing or RN Share fallback | Same | Same | Same | — | ☐ | |
| Samsung | Same | Same | Same | Same | — | ☐ | |

---

## Screen 7 — Future Vision (`/(onboarding)/future-vision`)

| Device | Expected UI | Expected animation | Expected navigation | Expected persistence | Expected analytics | Pass/Fail | Notes |
| ------ | ----------- | ------------------ | ------------------- | ------------------ | ------------------ | --------- | ----- |
| iPhone SE | Without panel first; With TruWell panel slides up 0.4s delay; 4 bullets each | With-panel slide + opacity | CTA → ai-demo | step 7 | — | ☐ | |
| iPhone 15 Pro | Same | Same | Same | Same | — | ☐ | |
| Pixel | Teal vs cyan by role | Same | Same | Same | — | ☐ | |
| Samsung | Same | Same | Same | Same | — | ☐ | |

---

## Screen 8 — AI Demo (`/(onboarding)/ai-demo`)

| Device | Expected UI | Expected animation | Expected navigation | Expected persistence | Expected analytics | Pass/Fail | Notes |
| ------ | ----------- | ------------------ | ------------------- | ------------------ | ------------------ | --------- | ----- |
| iPhone SE | Static chat bubbles; typing indicator ~2.5s; locked premium card with spec copy | Typing then lock reveal | CTA → blueprint | step 8 | — | ☐ | |
| iPhone 15 Pro | Same | Same | Same | Same | — | ☐ | |
| Pixel | Same | Same | Same | Same | — | ☐ | |
| Samsung | Same | Same | Same | Same | — | ☐ | |

---

## Screen 9 — Blueprint (`/(onboarding)/blueprint`)

| Device | Expected UI | Expected animation | Expected navigation | Expected persistence | Expected analytics | Pass/Fail | Notes |
| ------ | ----------- | ------------------ | ------------------- | ------------------ | ------------------ | --------- | ----- |
| iPhone SE | BlueprintRow locked rows with blur/frost + premium tag; unlocked rows clear | Row stagger if present | CTA → subscription; Skip → subscription | `conversionBlueprintReady`, step 9 | `blueprint_viewed` | ☐ | |
| iPhone 15 Pro | Same | Same | Same | Same | Same | ☐ | |
| Pixel | Same | Same | Same | Same | Same | ☐ | |
| Samsung | Same | Same | Same | Same | Same | ☐ | |

---

## Screen 10 — Subscription (`/(onboarding)/subscription`)

| Device | Expected UI | Expected animation | Expected navigation | Expected persistence | Expected analytics | Pass/Fail | Notes |
| ------ | ----------- | ------------------ | ------------------- | ------------------ | ------------------ | --------- | ----- |
| iPhone SE | Role headline; $9.99/mo; 7-day trial; feature list; no Skip | FadeInDown stagger | Trial CTA → account; Continue free → `/enter` | step 10 | `paywall_viewed` | ☐ | |
| iPhone 15 Pro | Same | Same | Same | Same | Same | ☐ | |
| Pixel | Same | Same | Same | Same | Same | ☐ | |
| Samsung | Same | Same | Same | Same | Same | ☐ | |

---

## Screen 11 — Account (`/(onboarding)/account`)

| Device | Expected UI | Expected animation | Expected navigation | Expected persistence | Expected analytics | Pass/Fail | Notes |
| ------ | ----------- | ------------------ | ------------------- | ------------------ | ------------------ | --------- | ----- |
| iPhone SE | Apple (iOS), Google, email expand; terms checkbox | Fade entrance | Success → `/enter` or `/(expert)` | conversion complete flags | `registration_completed` | ☐ | |
| iPhone 15 Pro | Apple Sign-In native button | Same | Same | profile upsert | Same | ☐ | |
| Pixel | Google Sign-In; no Apple | Same | Same | Same | Same | ☐ | |
| Samsung | Google + Samsung browser quirks | Same | Same | Same | Same | ☐ | |

---

## Cross-cutting flows

### Resume (all devices)

| Test | Steps | Expected | Pass | Notes |
| ---- | ----- | -------- | ---- | ----- |
| R1 | Complete through score-reveal; kill app; reopen | Resume at score-reveal or next step | ☐ | |
| R2 | Complete through blueprint; kill app; reopen | Resume subscription or account | ☐ | |
| R3 | Kill at ai-processing | Resume ai-processing or score-reveal | ☐ | |

### Authentication (all devices)

| Test | Expected | Pass | Notes |
| ---- | -------- | ---- | ----- |
| Email signup E2E | Profile saved, dashboard reached | ☐ | |
| Google signup E2E | Same | ☐ | |
| Apple signup E2E (iOS) | Same | ☐ | |
| Professional + each provider | Routes to `/(expert)` if pro | ☐ | |

### Visual (all devices)

| Check | Expected | Pass | Notes |
| ----- | -------- | ---- | ----- |
| Circuit texture | ~7% opacity on all onboarding screens | ☐ | |
| Typography | Montserrat headlines, DM Sans body | ☐ | |
| ProgressBar | Steps 3–9 only; SegmentedIndicator elsewhere in app | ☐ | |
| Safe area SE | No clipped header/CTA | ☐ | |
| Safe area 15 Pro | Dynamic Island clear | ☐ | |

### Regression (all devices)

| Check | Expected | Pass | Notes |
| ----- | -------- | ---- | ----- |
| Post-onboarding scanner | Opens | ☐ | |
| Post-onboarding telehealth | Opens | ☐ | |
| Login returning user | `/login` works | ☐ | |
| Legacy `/onboarding/role` | Resolves without crash | ☐ | |

---

## Route collision tests

| Test | Expected | Pass | Notes |
| ---- | -------- | ---- | ----- |
| Cold start fresh install | Document actual route | ☐ | See `PHASE_13_ROUTE_COLLISION_REPORT.md` |
| Deep link `/onboarding` | Spec welcome | ☐ | |
| `(auth)/welcome` direct | Legacy slides | ☐ | |

---

## Sign-off

| Device | Tester | Date | Guardian path | Pro path | Resume | Auth | Overall |
| ------ | ------ | ---- | ------------- | -------- | ------ | ---- | ------- |
| iPhone SE | | | ☐ | ☐ | ☐ | ☐ | ☐ |
| iPhone 15 Pro | | | ☐ | ☐ | ☐ | ☐ | ☐ |
| Pixel | | | ☐ | ☐ | ☐ | ☐ | ☐ |
| Samsung | | | ☐ | ☐ | ☐ | ☐ | ☐ |

**RC1 QA gate:** All four device classes must pass guardian + pro happy paths before **GO** without conditions.

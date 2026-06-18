# Phase 12 Device QA Checklist

**Date:** 2026-05-30  
**Build target:** Expo dev client / preview build  
**Spec authority:** `TruWell_AI_Onboarding_Cursor_Prompt.md`

Use one physical iOS device and one physical Android device where possible. Record pass/fail and device OS version.

---

## Pre-flight

- [ ] Fresh install OR clear app data before cold-start tests
- [ ] Network available (Supabase, Google Sign-In, Apple Sign-In configured)
- [ ] Adapty sandbox / trial products configured
- [ ] Confirm entry URL: `/(onboarding)/welcome`

---

## Guardian Path

| Step | Action | Expected | Pass |
| ---- | ------ | -------- | ---- |
| G1 | Open app cold (logged out) | Lands on welcome or resumes saved step | |
| G2 | Tap "Get My Personalized Report" | → role screen | |
| G3 | Select Guardian card, tap CTA | → care-discovery; card scales, check visible | |
| G4 | Toggle 2+ care goals, continue | → ai-processing (or assessment if routed) | |
| G5 | Complete assessment (adaptive Q) | → ai-processing; progress ~50% | |
| G6 | Wait on ai-processing | 5 checklist items, pulse rings, auto → score-reveal ~3–4s | |
| G7 | Score reveal | Score 45–85, reward spring, 4 finding cards, share CTA | |
| G8 | Continue → future-vision | Without panel first, With TruWell slides up | |
| G9 | Continue → ai-demo | Static chat, typing 2.5s, locked premium card | |
| G10 | Continue → blueprint | Locked rows blurred/frosted, premium tags | |
| G11 | Continue → subscription | Guardian copy, trial CTA, continue free link | |
| G12 | Start trial → account | Apple / Google / email options | |
| G13 | Complete signup | Routes to main app (`/enter` or equivalent) | |

---

## Professional Path

| Step | Action | Expected | Pass |
| ---- | ------ | -------- | ---- |
| P1 | From welcome → role | Professional card blue/cyan theme | |
| P2 | Select Professional, continue | → practice-profile; progress 25% | |
| P3 | Select specialization, size, patients/week | → workflow | |
| P4 | Multi-select workflow drains | → ai-processing; progress 50% | |
| P5 | ai-processing | Pro checklist labels (5 items) | |
| P6 | score-reveal | Score 78, "8.4 hrs/week recoverable" subtitle | |
| P7 | Share invite | Share sheet opens (expo-sharing or fallback) | |
| P8 | future-vision → ai-demo → blueprint | Cyan/blue accent panels | |
| P9 | subscription | "Practice Smarter" headline | |
| P10 | Account + complete | Expert route if applicable | |

---

## Resume Validation

| Step | Action | Expected | Pass |
| ---- | ------ | -------- | ---- |
| R1 | Complete through score-reveal, kill app | — | |
| R2 | Cold start | Resumes at score-reveal or next saved step (not welcome) | |
| R3 | Complete through blueprint, kill app | — | |
| R4 | Cold start | Resumes at subscription or account per stored step | |
| R5 | Sign in mid-funnel (if applicable) | No duplicate account prompts | |

---

## Subscription Validation

| Step | Action | Expected | Pass |
| ---- | ------ | -------- | ---- |
| S1 | View subscription screen | 7-day trial copy, $9.99/month, feature list | |
| S2 | Tap primary trial CTA | → account (step 11) | |
| S3 | Restore purchases (if shown) | Adapty restore flow, no crash | |
| S4 | Continue free / limited | `completeConversionOnboarding` → main app without paywall block | |
| S5 | Skip not shown on subscription | `showSkip={false}` | |

---

## Authentication Validation

| Provider | Action | Expected | Pass |
| -------- | ------ | -------- | ---- |
| Email | Inline form: name, email, password, terms | Supabase signup, saveTruwellOnboarding, exit funnel | |
| Google | Tap Google button | OAuth completes, profile saved | |
| Apple | Tap Apple button (iOS) | identityToken sign-in, profile saved | |
| Sign in link (welcome) | "Already a member?" | → `/sign-in` → login | |

---

## Visual Validation

| Check | Expected | Pass |
| ----- | -------- | ---- |
| Typography | Montserrat headlines, DM Sans body on onboarding | |
| Progress bars | SegmentedIndicator / ProgressBar on steps 3–9 only; no legacy progress bars | |
| Animations | Reanimated stagger, score ring, checklist springs | |
| Circuit texture | Faint SVG pattern at ~7% opacity on all onboarding screens | |
| Blueprint blur | Locked rows show frost/blur overlay + premium tag | |
| Sharing | Score-reveal share opens native sheet | |
| Colors | OB.navy background, spec gold/teal/cyan accents | |
| Safe area | No notch overlap on header/CTA | |

---

## Completion Validation

| Exit | Trigger | Expected destination | Pass |
| ---- | ------- | -------------------- | ---- |
| Blueprint skip path | Skip from eligible steps | → subscription | |
| Trial + account | Full signup | Main guardian tabs | |
| Continue free | Subscription secondary | Main app limited mode | |
| Professional complete | Expert signup | `/(expert)` or spec post-onboarding | |

---

## Regression checks

- [ ] Main tabs unchanged after onboarding
- [ ] Scanner / telehealth reachable
- [ ] No crash on Android back gesture on ai-processing (gesture disabled)
- [ ] Legacy URL `/onboarding/role` still resolves (redirect or impl)

---

## Sign-off

| Role | Name | Date | Result |
| ---- | ---- | ---- | ------ |
| Dev | | | |
| QA | | | |
| Product | | | |

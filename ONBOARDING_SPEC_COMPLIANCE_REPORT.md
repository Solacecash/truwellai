# Onboarding Specification Compliance Report

**Source of truth:** `TruWell_AI_Onboarding_Cursor_Prompt.md`  
**Audit date:** 2026-05-30  
**Scope:** Current codebase vs specification only (no validation reports, prior summaries, or approved adjustments used as authority)

**Overall specification compliance: 44%**

---

## Section 1 — Feature-by-Feature Comparison

| Spec requirement | Current implementation | Status |
| ---------------- | ---------------------- | ------ |
| Routes under `app/(onboarding)/` | Routes under `app/onboarding/` | **Non-compliant** |
| 11 screens ending at `subscription.tsx` + `account.tsx` | 15 route files; funnel is 13 steps with `paywall-onboarding`, `notifications`, `celebration`; account is `/(auth)/register` | **Non-compliant** |
| Funnel order: blueprint → subscription → account | blueprint → register → paywall → notifications → celebration | **Non-compliant** |
| New `store/onboardingStore.ts` with spec interface (`role`, `selectedGoals`, `setAnswer`, etc.) | Extended existing `stores/onboardingStore.ts` (`selectedRole`, `guardianGoals`, `setAssessmentAnswer`, conversion flow fields) | **Non-compliant** |
| `constants/onboardingTheme.ts` with spec color tokens | `components/onboarding/tokens.ts` aliasing `theme/truwellBrand.ts` (different hex values) | **Non-compliant** |
| NativeWind v4 for all layout | StyleSheet used across all onboarding screens | **Non-compliant** |
| `ProgressBar.tsx` on screens 3–9 | `SegmentedIndicator` in `OnboardingShell` | **Non-compliant** |
| `ShieldLogo.tsx` with orbit rings | `TruWellShield.tsx` (float animation, no orbit rings) | **Partial** |
| Reanimated 3 for all animations | Reanimated 3 used on entrances, cards, score ring; some logic uses `setInterval` / `setTimeout` | **Partial** |
| Do not modify files outside onboarding + store | Modified `lib/*`, `app/(auth)/register.tsx`, `theme/truwellBrand.ts`, `app/index.tsx`, docs, migrations, tests | **Non-compliant** |
| Do not modify Supabase schema | Added migrations for profile onboarding fields + analytics events | **Non-compliant** |
| Preserve existing navigation to same post-onboarding destination | Celebration routes to `/enter` or `/(expert)` — aligns with app intent | **Partial** |
| Role fork Guardian vs Professional | Implemented via `selectedRole` and path-specific screens | **Compliant** |
| Dual-journey screens 5–9 shared | ai-processing, score-reveal, future-vision, ai-demo, blueprint shared | **Compliant** |
| AI processing checklist (5 items, 900ms, auto-advance, no back) | Implemented; checklist text matches spec; no background pulse rings | **Partial** |
| Score ring SVG + count-up + reward micro-animation | `ScoreRingSimple` SVG + interval count-up; no 1.0→1.05→1.0 reward spring | **Partial** |
| Blueprint 20% unlocked / 80% locked | 1/5 rows unlocked, 4 locked with opacity | **Compliant** |
| Subscription outcomes copy ($9.99, trial, “Care With Confidence”) | Adapty `SubscriptionScreenContent` onboarding variant; no spec headlines/pricing copy found | **Partial** |
| Account after subscription with Google/Apple/Email | Register at step 10 before paywall; uses existing Supabase auth | **Non-compliant order** |
| Montserrat + DM Sans fonts | Montserrat loaded; DM Sans not loaded; Clash Display / Cabinet Grotesk referenced instead | **Partial** |
| Circuit texture SVG at 7% opacity on all screens | Not implemented | **Missing** |
| CTA footer absolute bottom, 56px gradient button | Fixed footer in shell; gradient buttons present; layout differs from spec padding rules | **Partial** |
| Guardian score 45–85, never above 85 | Default 72; no clamp enforcement in UI | **Partial** |
| Adaptive assessment based on selectedGoals | Fixed 4 question sections; not goal-adaptive | **Partial** |
| Share via expo-sharing | Uses React Native `Share` API | **Partial** |
| AI demo typing 2.5s then locked card | ~2.5s typing simulation; locked card present | **Partial** |
| Zustand wired to all screens | Wired via extended conversion store | **Partial** |

---

## Section 2 — Every Missing Requirement

### Critical rules & architecture

1. `app/(onboarding)/` route group (spec lines 29, 35–67)
2. `welcome.tsx` filename (spec uses `welcome.tsx`; implementation uses `index.tsx`)
3. `subscription.tsx` inside onboarding route group (spec screen 10)
4. `account.tsx` inside onboarding route group (spec screen 11)
5. `constants/onboardingTheme.ts` with exact spec token values (spec lines 161–209)
6. `components/onboarding/ProgressBar.tsx` (spec lines 505–539)
7. `components/onboarding/ShieldLogo.tsx` (spec line 73)
8. NativeWind v4 layout system (spec lines 27, 553–567)
9. Standalone spec `store/onboardingStore.ts` interface (`role`, `selectedGoals`, `setAnswer`) (spec lines 89–159)
10. DM Sans font loading (spec lines 541–551)
11. Circuit texture SVG on all screens (spec line 565)
12. Background pulse rings on AI processing screen (spec line 305)
13. Score reveal reward micro-animation scale 1.0→1.05→1.0 (spec line 349)
14. Subscription screen spec copy: “Care With Confidence” / “Practice Smarter”, $9.99/month, “7-day free trial · No charge now”, guarantee row (spec lines 427–441)
15. Account screen spec copy: “Value is already yours. Account = your key to access it.” (spec line 457)
16. Role card CTA disabled state (opacity 0.4, pointerEvents none) until role selected (spec line 247)
17. Role card scale 1.02 + check badge on selection (spec line 245)
18. Progress bar at 25% (screen 3) and 50% (screen 4) with ETA (spec lines 257, 271, 281, 291)
19. Guardian assessment: max 8 questions, adaptive to `selectedGoals` (spec lines 281–282)
20. Locked blueprint rows: MaskedView blur overlay option (spec line 395)
21. AI demo upsell card exact copy strings (spec lines 377–378)
22. Secondary sign-in route `/(auth)/sign-in` or `/auth/sign-in` (spec line 229; implementation uses `/login`)
23. Free subscription CTA routes to post-onboarding with limited flag (spec line 447)
24. Trial CTA routes to account screen (spec line 445)
25. Compliance with “no files modified outside `app/(onboarding)/` and `store/onboardingStore.ts`” (spec line 622)

---

## Section 3 — Every Partially Implemented Requirement

| Requirement | What exists | Gap |
| ----------- | ----------- | --- |
| Welcome screen | Shield, stats, FOMO, CTA copy largely matches | Orbit rings missing; sign-in path differs; button spring from bottom not explicit |
| Role selection | Two cards, role stored, path fork works | CTA not disabled when unselected; card check badge on card not on selection badge pattern |
| Care discovery | 6 goals, 2-column grid, multi-select, GoalCard | Nav goes to assessment (correct logically; spec 3G CTA text says ai-processing); progress is segments not 25% bar |
| Practice profile | Single-select chips for specialization, size, volume | Progress bar % not spec; chip `mode` prop unused in calls |
| Guardian assessment | 4 chip sections, ETA text | Not adaptive to goals; 4 not up to 8 questions |
| Professional workflow | Multi-select drains, correct labels | “Follow-up coordination” vs spec “Follow-up” label drift |
| AI processing | Checklist sequence, auto-nav, no back | Plain ◌ spinner not Reanimated spinner→check spring per item; no pulse rings |
| Score reveal | Ring, findings, viral invite | Count-up via setInterval not `useDerivedValue`; Share not expo-sharing; no reward bounce |
| Future vision | Without then With panels, 4 bullets each | Slide-up +20px framing approximated with FadeInUp |
| AI demo | Static chat, typing, locked card | Typing duration ~2.5s OK; upsell copy paraphrased |
| Blueprint | Correct locked/unlocked rows per role | Opacity lock only, no blur overlay |
| Subscription | Adapty paywall via wrapper | Not spec screen file; copy/pricing/guarantee not matched |
| Account | Register with Google/Apple/Email | Wrong funnel position (before paywall); not `account.tsx` in onboarding group |
| Theme colors | Dark navy, gold, cyan/blue accents | Hex values differ from spec OB (e.g. navy `#0A1630` vs `#0A1628`, gold `#D4AF37` vs `#C9A84C`, teal `#35D6FF` vs `#00E5C8`) |
| Typography | Montserrat partial load | Spec Montserrat + DM Sans not fully applied to onboarding |
| Store persistence | assessmentAnswers, healthScore, completionPercent exist | Field names differ; `selectedGoals` is `guardianGoals`; professional goals separate |
| Post-onboarding routing | Celebration → enter/expert | Extra notifications + celebration not in spec |
| Reanimated entrances | FadeInDown stagger widely used | Not uniformly on all interactive moments per spec |
| Deliverable: 11 screens navigable | Core journey navigable | Wrong paths, extra screens, wrong order |

---

## Section 4 — Implementations NOT in the Specification

| Added artifact | Location | Notes |
| -------------- | -------- | ----- |
| `OnboardingShell.tsx` | `components/onboarding/` | Glassmorphism shell, back/skip, keyboard avoid |
| `SegmentedIndicator` progress | `components/ui/` + shell | Replaces spec ProgressBar |
| `notifications.tsx` | `app/onboarding/` | Step 12 — not in spec |
| `celebration.tsx` | `app/onboarding/` | Step 13 — not in spec |
| `paywall-onboarding.tsx` | `app/onboarding/` | Wrapper — spec expects `subscription.tsx` in onboarding group |
| `lib/onboardingService.ts` | 13-step routing, guest resume, migration | Not in spec |
| `lib/useOnboardingNavigation.ts` | Deterministic back/skip | Not in spec |
| `lib/onboardingProgress.ts` | Segment math | Not in spec |
| `lib/onboardingAnalytics.ts` | 6 funnel events | Not in spec |
| `lib/saveTruwellOnboarding.ts` | Profile upsert on signup | Not in spec (spec forbids schema changes) |
| `lib/professionalOnboardingGoals.ts` | Pro goals merge helper | Not in spec |
| Supabase migrations | `20260530120000_*`, `20260530130000_*` | Spec forbids schema modification |
| `theme/truwellBrand.ts` onboarding tokens | Approved brand system | Not spec theme file |
| `TruWellShield` | vs `ShieldLogo` | Different component name/behavior |
| `GlassCard`, `OnboardingTitle`, `OnboardingPrimaryButton` | Shell subcomponents | Not in spec |
| Conversion flow persistence | AsyncStorage v5 migration | Not in spec |
| Psych flow redirect | `psychFlow.ts`, s1-intro redirect | Not in spec |
| QA/docs scripts | `scripts/verify-*`, `docs/PRE_LAUNCH_*` | Not in spec |
| Unit tests | `professionalOnboardingGoals.test.ts` | Not in spec |
| Register instrumentation | Analytics in `register.tsx` | Not in spec |

---

## Section 5 — Screen-by-Screen Audit

### Screen 1 — Welcome (`welcome.tsx` spec / `index.tsx` impl)

| Item | Status |
| ---- | ------ |
| Universal welcome, no role check | **Compliant** |
| Animated shield + orbit rings | **Partial** — TruWellShield float only |
| Stat pills: 50K+ / 47 DB / 24/7 AI | **Partial** — copy close (“50k+ families”, etc.) |
| FOMO badge with animated dot | **Compliant** |
| CTA “Get My Personalized Report” | **Compliant** (arrow suffix added) |
| Secondary “Already a member? Sign in” → spec auth path | **Partial** — goes to `/login` |
| Stagger 80ms, button spring from bottom | **Partial** |
| **Required fixes** | Add orbit rings; match sign-in route; optional copy normalization |

### Screen 2 — Role (`role.tsx`)

| Item | Status |
| ---- | ------ |
| Guardian teal / Professional blue cards | **Compliant** (via TRUWELL brand) |
| setRole on tap | **Compliant** (`setRole` + local selected state) |
| Card scale + check badge | **Partial** — selection styling, not spec badge pattern |
| CTA disabled until role selected | **Non-compliant** — `disabled` prop only, not opacity 0.4 / pointerEvents |
| Navigate to correct path screens | **Compliant** |
| **Required fixes** | Disabled visual state; selection animation per spec |

### Screen 3G — Care discovery

| Item | Status |
| ---- | ------ |
| 6 goals, 2-column grid | **Compliant** |
| Multi-select GoalCard | **Compliant** |
| Teal selected state + gold check | **Compliant** |
| Progress 25% | **Non-compliant** — segments used |
| CTA active without selection | **Compliant** |
| Navigate to assessment (logical) | **Compliant** (spec 3G text says ai-processing — likely spec typo) |
| **Required fixes** | ProgressBar at 25%; confirm navigation target vs spec text |

### Screen 3P — Practice profile

| Item | Status |
| ---- | ------ |
| Specialization, practice size, patients/week chips | **Compliant** |
| Single-select chips | **Compliant** |
| Progress 25% | **Non-compliant** |
| → workflow | **Compliant** |
| **Required fixes** | ProgressBar; wire ChipSelector `mode="single"` explicitly |

### Screen 4G — Assessment

| Item | Status |
| ---- | ------ |
| Age, role, challenge, sleep chips | **Compliant** |
| Adaptive to selectedGoals | **Non-compliant** |
| Max 8 questions / 60 seconds | **Partial** — 4 sections only |
| Progress 50% | **Non-compliant** |
| → ai-processing | **Compliant** |
| **Required fixes** | Goal-adaptive questions; progress bar; question cap logic |

### Screen 4P — Workflow

| Item | Status |
| ---- | ------ |
| Multi-select workflow drains | **Compliant** |
| Progress 50% | **Non-compliant** |
| → ai-processing | **Compliant** |
| **Required fixes** | ProgressBar at 50% |

### Screen 5 — AI processing

| Item | Status |
| ---- | ------ |
| 5 checklist items, 900ms sequence | **Compliant** |
| No spinner-only UX | **Partial** — ◌ character spinner |
| Pulse rings around shield | **Missing** |
| Auto-advance to score-reveal | **Compliant** |
| No back button | **Compliant** |
| **Required fixes** | Reanimated check spring; background pulse rings |

### Screen 6 — Score reveal

| Item | Status |
| ---- | ------ |
| Guardian 45–85 / Pro 78 | **Partial** — defaults OK, no clamp |
| SVG ring 1.2s animation | **Partial** — Reanimated ring OK; count-up not derived |
| Reward micro-animation | **Missing** |
| 4 findings stagger | **Compliant** |
| Viral invite + share | **Partial** — Share API not expo-sharing |
| **Required fixes** | Score clamp; reward bounce; expo-sharing if required literally |

### Screen 7 — Future vision

| Item | Status |
| ---- | ------ |
| Without panel first | **Compliant** |
| With TruWell panel delayed ~0.4s | **Compliant** |
| 4 bullets each, role-colored With panel | **Compliant** |
| **Required fixes** | Minor — explicit +20px slide if strict |

### Screen 8 — AI demo

| Item | Status |
| ---- | ------ |
| Static chat exchange | **Compliant** |
| Typing then locked premium card | **Compliant** |
| ChatBubble gold user / teal AI | **Compliant** |
| Spec upsell copy | **Partial** |
| **Required fixes** | Match exact upsell strings |

### Screen 9 — Blueprint

| Item | Status |
| ---- | ------ |
| 1 unlocked score + 4 locked rows | **Compliant** |
| FOMO “Your plan is ready” gold dot | **Compliant** |
| Locked blur/opacity | **Partial** — opacity only |
| **Required fixes** | Blur overlay; CTA should go to subscription per spec (impl goes to register) |

### Screen 10 — Subscription (`subscription.tsx` spec)

| Item | Status |
| ---- | ------ |
| Outcome headlines per role | **Missing** in onboarding variant |
| $9.99 / 7-day trial copy | **Missing** |
| Primary trial CTA | **Partial** — Adapty plans differ |
| Continue Free always tappable | **Partial** — via onboarding callback |
| Trial → account navigation | **Non-compliant** — register already happened |
| **Required fixes** | Create spec `subscription.tsx` or align copy/flow; fix funnel order |

### Screen 11 — Account (`account.tsx` spec)

| Item | Status |
| ---- | ------ |
| Google / Apple / Email | **Partial** — in `register.tsx` |
| Existing Supabase auth | **Compliant** |
| After subscription only | **Non-compliant** — before paywall |
| Sub-copy | **Missing** |
| On success → main app | **Partial** — goes to paywall first |
| **Required fixes** | Move after subscription; dedicated account screen or spec-equivalent |

### Extra screens (not in spec)

| Screen | Status |
| ------ | ------ |
| `notifications.tsx` | **Not in spec** — remove or get spec approval |
| `celebration.tsx` | **Not in spec** — remove or get spec approval |

---

## Section 6 — Navigation Audit

| Flow | Spec | Implementation | Status |
| ---- | ---- | -------------- | ------ |
| **Entry** | Welcome → role | `/onboarding` → `/onboarding/role` | **Partial** — wrong route prefix |
| **Guardian** | 3G → 4G → 5 → … → 9 → 10 sub → 11 account | 3 → 4 → 5–9 → register → paywall → notifications → celebration | **Non-compliant** |
| **Professional** | 3P → 4P → shared 5–11 | Same as guardian with pro 3–4 | **Non-compliant** order after blueprint |
| **Resume** | Not specified | AsyncStorage hydrate + `app/index.tsx` step resume | **Extra** (not forbidden) |
| **Guest** | Not specified | Guest capped at step 9 pre-register | **Extra** |
| **Auth** | Account after subscription | Register at step 10 before paywall | **Non-compliant** |
| **Subscription** | Step 10 before account | Step 11 after register | **Non-compliant** |
| **Completion** | Account success → main app | Celebration → `/enter` or `/(expert)` | **Partial** — extra steps |

---

## Section 7 — Visual Audit

| Dimension | Spec | Implementation | Status |
| --------- | ---- | -------------- | ------ |
| **Colors** | OB navy `#0A1628`, gold `#C9A84C`, teal `#00E5C8`, cyan `#00B7FF` | TRUWELL brand `#0A1630`, `#D4AF37`, `#35D6FF`, `#00B7FF` | **Partial** |
| **Typography** | Montserrat + DM Sans | Montserrat + Clash/Cabinet fallbacks | **Partial** |
| **Layout** | NativeWind, 22px horizontal padding | StyleSheet, shell padding ~22px | **Non-compliant** |
| **Glassmorphism** | Glow blobs, circuit texture | Glass cards + gradient glows in shell | **Partial** — no circuit texture |
| **Progress** | Animated ProgressBar 3–9 | SegmentedIndicator 12 segments | **Non-compliant** |
| **Animations** | Reanimated 3 standard entrances | Reanimated 3 widely used | **Partial** |
| **CTA hierarchy** | Absolute footer, 56px gradient | Shell footer, gradient primary buttons | **Partial** |
| **Role accents** | Teal guardian / blue pro | Cyan guardian / electric blue pro | **Partial** — close brand intent |

---

## Compliance Summary

| Category | Weight | Score |
| -------- | ------ | ----- |
| Critical rules & file structure | 25% | 15% |
| Funnel navigation (11-screen order) | 20% | 25% |
| Store & theme per spec | 15% | 30% |
| Screen content & behavior | 25% | 58% |
| Visual system (NativeWind, ProgressBar, theme tokens) | 15% | 20% |
| **Weighted total** | 100% | **44%** |

**Specification compliance = 44% (not 100%)**

Commit gate per Phase 8D: **BLOCKED**

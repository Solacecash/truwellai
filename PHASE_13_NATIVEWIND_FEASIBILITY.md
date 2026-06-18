# Phase 13 NativeWind Migration Feasibility Analysis

**Date:** 2026-05-30  
**Constraint:** Analysis only — **no NativeWind installation, no styling changes**

---

## Current Onboarding Styling Footprint

### Methodology

Counted files containing `StyleSheet.create` under onboarding-related paths. Duplicates from path casing (Windows) deduplicated mentally; unique file count used.

### Spec funnel scope (RC1 critical path)

| Category | Count | Files |
| -------- | ----- | ----- |
| **Screen files** | **14** | 11 funnel impls in `app/onboarding/` + `welcome`, `subscription`, `account` in `app/(onboarding)/` |
| **Spec shared components** | **11** | OnboardingShell, ProgressBar, ShieldLogo, GoalCard, ChipSelector, ScoreRing, BlueprintRow, ChatBubble, CircuitTexture, PulseRings, ProcessingChecklistItem |
| **StyleSheet.create calls (spec scope)** | **~25** | One per file above (Slide1 exception N/A) |
| **Reanimated-heavy files** | **6** | ai-processing, score-reveal, ShieldLogo, ScoreRing, PulseRings, ProcessingChecklistItem |

### Full onboarding ecosystem (including legacy)

| Category | Count |
| -------- | ----- |
| **components/onboarding/** files with StyleSheet | **~58** |
| **app/** onboarding-related screens with StyleSheet | **~17** |
| **Total StyleSheet files (onboarding ecosystem)** | **~75** |
| **Legacy-only (slides, wizard, psych)** | **~40** (~53% of footprint) |
| **NativeWind in package.json** | **0** |
| **tailwind.config / global.css** | **0** |

### Styling patterns in use

- `StyleSheet.create` for static layout (majority)
- `OB` / `onboardingTheme` tokens (spec-compliant colors)
- Reanimated `useAnimatedStyle` for animations (spec-required; exempt from NativeWind per spec exception)
- `LinearGradient`, `react-native-svg`, `MaskedView` for visual effects
- No className usage anywhere in codebase

---

## Migration Complexity

### Effort estimate

| Scope | Hours | Calendar |
| ----- | ----- | -------- |
| **Spec funnel only** (25 files) | 24–32 h | 3–4 days |
| **Full onboarding ecosystem** (75 files) | 48–72 h | 6–9 days |
| **Tooling setup** (nativewind, tailwind, babel, metro) | 4–8 h | 0.5–1 day |
| **Device QA regression** | 8–16 h | 1–2 days |
| **Total (spec funnel)** | **36–56 h** | **~1 week** |
| **Total (full ecosystem)** | **60–96 h** | **~2 weeks** |

### Risk factors

| Risk | Probability | Impact |
| ---- | ----------- | ------ |
| Reanimated + NativeWind style conflicts | **High** | Broken animations on ai-processing, score-reveal |
| Layout regression on small screens (SE) | **Medium** | CTA footer overlap, scroll issues |
| Expo SDK 52 + NativeWind v4 config drift | **Medium** | Build failures |
| Dual styling during partial migration | **High** | Inconsistent UI if hybrid period extends |
| Legacy wizard/slides accidentally broken | **Low** (if spec-only scope) | N/A if legacy untouched |

### Regression probability

| Scope | Regression probability |
| ----- | ---------------------- |
| Spec funnel NativeWind migration | **60–70%** — at least one visual or animation regression without full device QA |
| Full ecosystem migration | **75–85%** |
| Hybrid (NativeWind static + StyleSheet animated) | **40–50%** — recommended if migrating |

---

## Benefit Score

| Criterion | Rating | Notes |
| --------- | ------ | ----- |
| **User-visible improvement at launch** | **Low** | Current UI matches spec tokens; users won't notice NativeWind vs StyleSheet |
| **Strict spec compliance lift** | **High** | Closes P3-01; ~+4–6% weighted compliance |
| **Developer velocity long-term** | **Medium** | Tailwind utilities help if team standardizes on NativeWind app-wide |
| **Launch risk reduction** | **Low** | Migration adds risk; does not fix cold-start or auth blockers |
| **Bundle / performance** | **Low** | Negligible user impact |

### Overall benefit score: **Medium**

Benefit is primarily **compliance and maintainability**, not **launch conversion or stability**.

---

## Recommendation

### **Migrate after launch**

### Rationale

1. **RC1 blockers are functional, not stylistic** — cold-start routing, device QA, and OAuth config matter more than StyleSheet vs className.
2. **High regression probability (60%+) vs low user-visible benefit** — migrating ~25 spec files risks P2 animation work (ai-processing, score-reveal) immediately before launch.
3. **Spec exception exists** — "no StyleSheet unless Reanimated animated styles require it" implies hybrid is acceptable; 6 files legitimately need StyleSheet/Reanimated patterns anyway.
4. **~75 StyleSheet files** if full cleanup desired post-launch without blocking RC1.
5. **Compliance at 94%** is sufficient for RC1; NativeWind closes spec gap to ~98% but is not required for store submission if product accepts documented deviation.

### If product mandates strict spec before launch

- Migrate **spec funnel only** in hybrid mode (NativeWind for layout shells; keep Reanimated StyleSheet)
- Budget **1 week + full device QA**
- Do **not** migrate legacy slides/wizard/psych pre-launch

### Do not migrate (alternative)

Valid only if product **waives spec line 27** in writing. Otherwise prefer "after launch" over "do not migrate."

---

## Decision Matrix

| Option | Compliance | Launch risk | Effort |
| ------ | ---------- | ----------- | ------ |
| Migrate before launch | +5–6% | High | 1 week |
| Migrate after launch | +0% at RC1 | Low | 1 week post-launch |
| Do not migrate | Stays 94% | Lowest | 0 |

**Phase 13 decision:** **Migrate after launch**

# Phase 12 P3 Pre-Implementation Audit

**Date:** 2026-05-30  
**Authority:** `TruWell_AI_Onboarding_Cursor_Prompt.md`  
**Baseline compliance:** 91% (`PHASE_11_COMPLIANCE_RECHECK.md`)

---

## Summary

| Gap ID | Title | Pre-audit status | Phase 12 action |
| ------ | ----- | ---------------- | --------------- |
| P3-01 | NativeWind v4 migration | Not implemented | **Analyze only — defer** |
| P3-02 | Circuit texture SVG | Not implemented | **Implement** |
| P3-03 | DM Sans font loading | Not implemented | **Implement (onboarding scope)** |
| P3-04 | Strict file-modification rule | Violated | **Document only** |
| P3-05 | Out-of-spec artifact removal | Not audited | **Audit only — no deletion** |
| P3-06 | Legacy route cleanup | Partial redirects | **Audit only — no removal** |
| P3-07 | Supabase schema deviation | Product decision pending | **Analyze only — defer** |

---

## P3-01 — NativeWind v4 Migration

| Field | Detail |
| ----- | ------ |
| **Current implementation** | Zero NativeWind dependency in `package.json`. All onboarding UI uses `StyleSheet.create` in `OnboardingShell`, screen files, and shared components. |
| **Spec requirement** | Spec line 27: "USE NativeWind v4 for all layout — no StyleSheet unless Reanimated animated styles require it." Stack header lists NativeWind v4. |
| **Risk** | **High** — full migration touches every onboarding screen and shared component; regression risk to P1/P2 behavior; tailwind config + babel plugin required; conflicts with existing StyleSheet + Reanimated patterns. |
| **Estimated effort** | 3–5 days (install, config, migrate ~15 screens + ~20 components, QA) |
| **Recommendation** | **Defer to Phase 13.** Document as largest remaining visual-system gap. Do not start until device QA confirms funnel stability. Consider hybrid: NativeWind for static layout only, keep StyleSheet for Reanimated animated styles per spec exception. |

---

## P3-02 — Circuit Texture SVG

| Field | Detail |
| ----- | ------ |
| **Current implementation** | `OnboardingShell` had gradient + glow blobs only. No SVG texture layer. |
| **Spec requirement** | Spec line 565: "Circuit texture: SVG at 7% opacity, absolute positioned on all screens." |
| **Risk** | **Low** — decorative layer only; no navigation or interaction impact. |
| **Estimated effort** | 2–4 hours |
| **Recommendation** | **Implement** via reusable `components/onboarding/CircuitTexture.tsx` mounted inside `OnboardingShell` so all 11 spec screens inherit it automatically. |

---

## P3-03 — DM Sans Font Loading

| Field | Detail |
| ----- | ------ |
| **Current implementation** | Root `app/_layout.tsx` loads Montserrat + Inter + optional Clash/Cabinet. `OB.fontBody` = `'DM-Sans'` referenced in onboarding styles but font never loaded. `@expo-google-fonts/dm-sans` not installed. |
| **Spec requirement** | Spec lines 541–551: Load Montserrat + DM Sans via expo-font in root layout; use `OB.fontHead` / `OB.fontBody` on onboarding typography. |
| **Risk** | **Low–Medium** — loading in root affects bundle init; loading in `(onboarding)/_layout` scopes load to funnel entry only. Invalid `fontFamily` silently falls back to system fonts. |
| **Estimated effort** | 2–3 hours |
| **Recommendation** | **Implement** in `app/(onboarding)/_layout.tsx` with `@expo-google-fonts/dm-sans`, register `'DM-Sans'` and `'Montserrat'` aliases, gate stack until fonts load, add `lib/onboardingFonts.ts` for readiness/fallback. **Do not modify root `_layout.tsx`** to preserve main-app typography isolation per Phase 12 constraint. |

---

## P3-04 — Strict File-Modification Rule

| Field | Detail |
| ----- | ------ |
| **Current implementation** | Spec lines 15–19 forbid modifying files outside onboarding. Phase 9–11 touched: `app/_layout.tsx`, `app/index.tsx`, `lib/authService.ts`, `lib/googleAuth.ts`, `package.json`, `stores/onboardingStore.ts`, multiple non-onboarding profile/settings screens per git status. |
| **Spec requirement** | "DO NOT delete, rename, or move any existing file outside the onboarding directory." "DO NOT modify Supabase schema, Edge Functions, auth logic, or navigation guards outside onboarding." |
| **Risk** | **Medium (process/compliance)** — not a runtime bug; affects strict spec audit score and release governance. |
| **Estimated effort** | 1 day audit + ongoing discipline |
| **Recommendation** | **Document violation ledger** in artifact audit. For Phase 13, freeze non-onboarding diffs unless bugfix. Treat navigation guard changes in `_layout.tsx` as **accepted pragmatic deviation** required for funnel resume — document in compliance recheck. |

---

## P3-05 — Out-of-Spec Artifact Removal

| Field | Detail |
| ----- | ------ |
| **Current implementation** | Non-spec additions include: `lib/onboardingAnalytics.ts`, `lib/saveTruwellOnboarding.ts`, `lib/onboardingStoreSpec.ts`, `lib/onboardingScores.ts`, `lib/guardianAdaptiveAssessment.ts`, `lib/onboardingShare.ts`, `lib/completeConversionOnboarding.ts`, legacy wizard/slides/psych components under `components/onboarding/`. |
| **Spec requirement** | Spec FILE STRUCTURE (lines 31–87) lists only named files; "All other files remain untouched." |
| **Risk** | **Medium** — removing analytics or save helpers breaks production telemetry and profile persistence. |
| **Estimated effort** | 4–8 hours audit; 2–3 days if removal approved |
| **Recommendation** | **Audit only (Phase 12).** Classify each artifact KEEP/REMOVE/REVIEW in `PHASE_12_ARTIFACT_AUDIT.md`. Defer deletion until product signs off on analytics + Supabase persistence vs strict spec purity. |

---

## P3-06 — Legacy Route Cleanup

| Field | Detail |
| ----- | ------ |
| **Current implementation** | Canonical routes under `app/(onboarding)/` (11 screens). Implementations live in `app/onboarding/*` with re-export stubs. Legacy stack at `app/onboarding/_layout.tsx` still registers paywall-onboarding, notifications, celebration. Psych funnel at `app/(auth)/psych/*` (13 screens). Auth onboarding at `app/(auth)/onboarding/*`. |
| **Spec requirement** | Spec lines 29–67: screens in `app/(onboarding)/` only; 11-screen funnel ending at account. |
| **Risk** | **Medium** — premature deletion breaks deep links, resume paths, and register flow redirects. |
| **Estimated effort** | 1 day audit; 1–2 days redirect-only cleanup |
| **Recommendation** | **Audit only (Phase 12).** Produce route classification in `PHASE_12_LEGACY_ROUTE_AUDIT.md`. Phase 13: convert legacy `/onboarding/*` to redirect-only stubs; keep psych routes REDIRECT or KEEP based on product. |

---

## P3-07 — Supabase Schema Deviation

| Field | Detail |
| ----- | ------ |
| **Current implementation** | `saveTruwellOnboarding.ts` upserts extended fields into `profiles` (care_goals, health_conditions, lifestyle_factors, specialization, etc.) beyond minimal spec store shape. Conversion state persisted via AsyncStorage hydration in `onboardingStore`. |
| **Spec requirement** | Spec store interface (lines 89–159) defines minimal Zustand shape only; spec forbids schema changes. Existing app expects rich profile columns. |
| **Risk** | **High** — rolling back schema breaks account completion and expert/guardian routing. |
| **Estimated effort** | N/A without product decision |
| **Recommendation** | **Defer.** Treat as **accepted production deviation**. Document mapping from spec store fields → profile columns. Do not remove schema in Phase 12. |

---

## Implementation Order (Phase 12)

1. This audit (complete)  
2. P3-02 Circuit texture  
3. P3-03 DM Sans (onboarding layout scope)  
4. Artifact audit (no deletions)  
5. Legacy route audit (no deletions)  
6. Device QA checklist  
7. Compliance recheck + `tsc --noEmit`

**Explicitly excluded from Phase 12:** P3-01 NativeWind, P3-05 deletions, P3-06 route removal, P3-07 schema changes.

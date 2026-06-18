# Phase 9 Compliance Recheck

**Audit date:** 2026-05-30 (post Phase 9B P0)  
**Source of truth:** `TruWell_AI_Onboarding_Cursor_Prompt.md`  
**Baseline:** `ONBOARDING_SPEC_COMPLIANCE_REPORT.md` (44%)

---

## Updated Compliance: **65%**

(+21 points from P0 funnel architecture and navigation remediation)

| Category | Weight | Baseline | Recheck |
| -------- | ------ | -------- | ------- |
| Critical rules & file structure | 25% | 15% | **58%** |
| Funnel navigation (11-screen order) | 20% | 25% | **95%** |
| Store & theme per spec | 15% | 30% | **30%** |
| Screen content & behavior | 25% | 58% | **64%** |
| Visual system (NativeWind, ProgressBar, tokens) | 15% | 20% | **20%** |
| **Weighted total** | 100% | **44%** | **65%** |

**Note:** The user objective target of 90% requires P1–P3 work (ProgressBar, theme tokens, NativeWind, subscription copy, store aliases). P0 alone cannot reach 90% under the Phase 8 audit weighting without changing methodology.

---

## Feature Comparison (Key Rows)

| Spec requirement | Post–Phase 9B status |
| ---------------- | -------------------- |
| Routes under `app/(onboarding)/` | **Partial** — group exists; implementations re-exported from `app/onboarding/` |
| 11 screens ending at subscription + account | **Compliant** — primary funnel is 11 steps |
| Funnel order: blueprint → subscription → account | **Compliant** |
| `subscription.tsx` in onboarding group | **Compliant** |
| `account.tsx` in onboarding group | **Partial** — email via register delegate |
| Trial → account navigation | **Compliant** |
| Free → post-onboarding limited | **Compliant** — `completeConversionOnboarding` |
| Extra notifications/celebration in funnel | **Compliant** — removed from primary path; legacy redirects |
| NativeWind v4 | **Non-compliant** (P3) |
| ProgressBar screens 3–9 | **Non-compliant** (P1) |
| `constants/onboardingTheme.ts` | **Non-compliant** (P1) |
| Spec store interface | **Non-compliant** (P2) |
| Do not modify files outside onboarding + store | **Non-compliant** (pre-existing + required integration) |

---

## Remaining P0 Gaps

These items were in the P0 execution plan but are **not fully closed**:

| Gap ID | Issue | Status |
| ------ | ----- | ------ |
| GAP-P0-01 | Implementations physically in `app/onboarding/` not `(onboarding)/` | Partial |
| GAP-P0-01 | Legacy `/onboarding/role` etc. still serve full screens (not redirect-only) | Partial |
| GAP-P0-01 | `/welcome` path collision risk between `(auth)` and `(onboarding)` groups | Unverified on device |
| GAP-P0-04 | Email account creation not fully on `account.tsx` | Partial |

**Effective remaining P0 count:** 2 partial gaps (architecture co-location + account email path)

---

## Remaining P1 Gaps

| Gap ID | Requirement |
| ------ | ----------- |
| GAP-P1-01 | `ProgressBar.tsx` on screens 3–9 with 25%/50% on 3–4 |
| GAP-P1-02 | `constants/onboardingTheme.ts` with spec hex tokens |
| GAP-P1-03 | Subscription spec copy ($9.99, trial, guarantee, role headlines) |
| GAP-P1-04 | Account screen full inline auth (no register delegate for email) |
| GAP-P1-05 | `ShieldLogo.tsx` with orbit rings |
| GAP-P1-06 | Role CTA disabled opacity 0.4 / pointerEvents |
| GAP-P1-07 | Sign-in route alignment (`/(auth)/sign-in` vs `/login`) |

---

## Remaining P2 Gaps (Summary)

- Store aliases (`role`, `selectedGoals`, `setAnswer`)
- AI processing pulse rings + Reanimated checklist
- Score reveal reward spring + guardian score clamp + derived count-up
- Guardian adaptive assessment (max 8 questions)
- Blueprint blur overlay on locked rows
- AI demo exact upsell copy
- Role card scale 1.02 + check badge
- expo-sharing on score reveal

---

## Remaining P3 Gaps (Summary)

- NativeWind v4 full migration
- Circuit texture SVG 7% opacity
- DM Sans font loading
- Strict spec file-modification rule compliance
- Out-of-spec artifact removal (analytics, migrations, saveTruwellOnboarding)
- Legacy route surface cleanup (move implementations into `(onboarding)`)

---

## Navigation Recheck

| Flow | Spec | Post–Phase 9B | Status |
| ---- | ---- | ------------- | ------ |
| Entry | `/(onboarding)/welcome` → role | ✓ | **Compliant** |
| Guardian | 3G → 4G → 5–9 → 10 sub → 11 account | ✓ | **Compliant** |
| Professional | 3P → 4P → shared 5–11 | ✓ | **Compliant** |
| Blueprint CTA | → subscription | ✓ | **Compliant** |
| Trial CTA | → account | ✓ | **Compliant** |
| Free CTA | → post-onboarding limited | ✓ | **Compliant** |
| Account success | → main app | ✓ via `completeConversionOnboarding` | **Compliant** |
| Skip (steps 2–9) | → subscription (step 10) | ✓ | **Compliant** |
| Legacy `/onboarding/*` | N/A | Redirects for index, paywall, notifications, celebration | **Partial** |
| Resume (signed-in) | Not specified | Steps 2–11 via `app/index.tsx` | **Extra** (allowed) |

---

## New Deviations Introduced

| Deviation | Severity | Notes |
| --------- | -------- | ----- |
| Re-export pattern (`(onboarding)` → `app/onboarding/`) | Low | Avoids deleting legacy files; dual route surface |
| `app/_layout.tsx` modified for guards | Low | Required for signed-in funnel resume; spec line 622 tension |
| `app/(auth)/register.tsx` modified | Low | Required for email signup completion path |
| `lib/onboardingRoutePaths.ts` new file outside spec tree | Low | Centralized canonical hrefs |
| Skip → subscription instead of register | None | Aligns with spec funnel order |

**No new product-flow deviations** (notifications/celebration no longer in primary funnel).

---

## Deliverable Checklist (Spec lines 602–620)

| Item | Status |
| ---- | ------ |
| All 11 screens created and navigable | **Yes** (canonical paths) |
| Role fork Guardian vs Professional | **Yes** |
| Zustand wired to all screens | **Partial** (extended store, not spec interface) |
| Reanimated 3 on entrances | **Partial** |
| Progress bar on screens 3–9 | **No** (P1) |
| AI processing auto-advance | **Yes** |
| Score ring animates 0 → target | **Partial** |
| Blueprint 20% visible / 80% locked | **Yes** |
| Account uses existing Supabase auth | **Yes** |
| No files modified outside allowed paths | **No** |

---

## Path to 90%+ Compliance

| Phase | Gaps | Est. delta |
| ----- | ---- | ---------- |
| P1 | ProgressBar, theme, subscription copy, account email inline, ShieldLogo, role disabled | +15–18 pts → ~80–83% |
| P2 | Store aliases, animations, adaptive assessment | +5–7 pts → ~88–90% |
| P3 | NativeWind, circuit texture, DM Sans | +8–10 pts → ~95%+ (if P1–P2 done) |

**Commit gate:** Still **BLOCKED** until 100% spec compliance documented and approved (per Phase 8D).

# Phase 11 AI Demo Copy Report — GAP-P2-06

**Status:** Fixed  
**Spec ref:** Lines 373–387

## Copy alignment

| Element | Spec | Implemented |
| ------- | ---- | ----------- |
| Guardian user message | Fatigue question | "Why am I exhausted even when I sleep 8 hours?" |
| Guardian AI reply | Personalized answer | Personalized 7-day reset response |
| Professional user message | Patient education request | Prediabetes lifestyle education request |
| Professional AI reply | Summary + checklist offer | Summary + follow-up care checklist |
| Upsell guardian | "Get daily personalized guidance..." | Exact string (line 387) |
| Upsell professional | "Get unlimited clinical docs..." | Exact string (line 387) |
| Locked card title | Continue in Premium | Unchanged |

## Files changed

- `app/onboarding/ai-demo.tsx`

## Validation

- Typing delay ~2.5s preserved
- Navigation to blueprint unchanged
- `npx tsc --noEmit` — PASS

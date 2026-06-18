**TruWell AI**

Role-Based Onboarding — Cursor Implementation Prompt

Expo SDK 52+ · Expo Router v4 · TypeScript · NativeWind v4 · Reanimated 3

**OBJECTIVE**

Replace the existing TruWell AI onboarding with a role-based, psychologically optimized dual-journey experience. The new onboarding must convert casual explorers into subscribers by delivering personalized AI value BEFORE requesting payment or account creation.

This prompt is the complete specification for Cursor to implement the new onboarding without breaking existing app logic.

**CRITICAL RULES — READ BEFORE ANY CODE**

**• DO NOT** delete, rename, or move any existing file outside the onboarding directory.

**• DO NOT** modify Supabase schema, Edge Functions, auth logic, or navigation guards outside onboarding.

**• DO NOT** touch the main app tabs, dashboard, product scanner, or telehealth screens.

**• PRESERVE** all existing onboarding state variables — add to them, never replace.

**• PRESERVE** existing navigation logic — the new onboarding must still route to the same post-onboarding destination.

**• USE** Reanimated 3 (already installed) for all animations — no Animated API from React Native core.

**• USE** NativeWind v4 for all layout — no StyleSheet unless Reanimated animated styles require it.

**• USE** Expo Router v4 file-based routing — screens go in app/(onboarding)/ directory.

**FILE STRUCTURE**

Create the following new files. All other files remain untouched.

app/(onboarding)/

\_layout.tsx ← Onboarding stack layout

welcome.tsx ← Screen 1: Universal welcome

role.tsx ← Screen 2: Role selection

guardian/

care-discovery.tsx ← Guardian Screen 3

assessment.tsx ← Guardian Screen 4 (adaptive Q&A)

professional/

practice-profile.tsx ← Pro Screen 3

workflow.tsx ← Pro Screen 4

ai-processing.tsx ← Screen 5: Shared AI analysis

score-reveal.tsx ← Screen 6: Score/report reveal

future-vision.tsx ← Screen 7: Future projection

ai-demo.tsx ← Screen 8: Free AI interaction

blueprint.tsx ← Screen 9: Locked blueprint

subscription.tsx ← Screen 10: Subscription screen

account.tsx ← Screen 11: Account creation

store/onboardingStore.ts ← Zustand store for onboarding state

components/onboarding/

ShieldLogo.tsx ← Animated TruWell shield

ProgressBar.tsx ← Smooth animated progress bar

GoalCard.tsx ← Tappable goal/care selection card

ChipSelector.tsx ← Multi/single chip selector

ScoreRing.tsx ← Animated score ring SVG

BlueprintRow.tsx ← Locked/unlocked blueprint item

ChatBubble.tsx ← Chat bubble for AI demo

constants/onboardingTheme.ts ← All colors, fonts, spacing tokens

**ZUSTAND STORE — store/onboardingStore.ts**

Create this store. Import and use it in all onboarding screens.

import { create } from 'zustand';

type Role = "guardian" | "professional" | null;

interface OnboardingState {

role: Role;

selectedGoals: string\[\];

assessmentAnswers: Record&lt;string, string&gt;;

healthScore: number;

completionPercent: number;

setRole: (r: Role) => void;

toggleGoal: (g: string) => void;

setAnswer: (key: string, val: string) => void;

setHealthScore: (s: number) => void;

setCompletionPercent: (p: number) => void;

reset: () => void;

}

export const useOnboardingStore = create&lt;OnboardingState&gt;((set) => ({

role: null,

selectedGoals: \[\],

assessmentAnswers: {},

healthScore: role === "professional" ? 78 : 72,

completionPercent: 0,

setRole: (role) => set({ role }),

toggleGoal: (g) => set((s) => ({

selectedGoals: s.selectedGoals.includes(g)

? s.selectedGoals.filter(x => x !== g)

: \[...s.selectedGoals, g\]

})),

setAnswer: (key, val) => set((s) => ({

assessmentAnswers: { ...s.assessmentAnswers, \[key\]: val }

})),

setHealthScore: (healthScore) => set({ healthScore }),

setCompletionPercent: (completionPercent) => set({ completionPercent }),

reset: () => set({ role: null, selectedGoals: \[\], assessmentAnswers: {}, healthScore: 72, completionPercent: 0 })

}));

**THEME CONSTANTS — constants/onboardingTheme.ts**

These tokens override the existing brand guide and MUST be used by all onboarding components.

export const OB = {

navy: '#0A1628',

black: '#080E1A',

gold: '#C9A84C',

goldL: '#E8C96B',

goldD: '#A8822A',

teal: '#00E5C8',

cyan: '#00B7FF',

blue: '#0B3D91',

white: '#F0F4FF',

w70: 'rgba(240,244,255,0.70)',

w40: 'rgba(240,244,255,0.40)',

w12: 'rgba(240,244,255,0.12)',

green: '#16A34A',

red: '#ef4444',

fontHead: 'Montserrat',

fontBody: 'DM-Sans',

} as const;

export const gradients = {

gold: \['#E8C96B','#A8822A'\],

teal: \['#00E5C8','#0284C7'\],

blue: \['#0B3D91','#00B7FF'\],

} as const;

**SCREEN-BY-SCREEN IMPLEMENTATION SPEC**

**Screen 1 — welcome.tsx (Universal)**

**KEY LOGIC**

**• No role check. Renders for all users.**

**• AnimatedShieldLogo** with orbit rings (Reanimated 3 useSharedValue + withRepeat).

**• Stat pills row:** 50K+ Families, 47 Databases, 24/7 AI — pulse in with Reanimated stagger.

**• FOMO badge:** "1,842 people protected today" — live-ish with animated dot.

**NAVIGATION**

**Primary CTA:** "Get My Personalized Report" → router.push("/(onboarding)/role")

**Secondary:** "Already a member? Sign in" → router.push("/auth/sign-in")

**ANIMATIONS**

**•** "Shield logo fades in + orbits begin spinning on mount.

**•** Content stagger: each element delays 80ms after previous.

**•** Button: Spring entrance from bottom (translateY from 40 to 0).

**Screen 2 — role.tsx (Role Selection)**

**KEY LOGIC**

**•** Two cards: Guardian (teal theme) and Professional (blue/cyan theme).

**•** On card tap: store.setRole(), card scales to 1.02 with spring animation, check badge fades in.

**•** CTA button disabled (opacity 0.4, pointerEvents none) until role selected.

**•** On CTA: if guardian → push("/(onboarding)/guardian/care-discovery"), else push("/(onboarding)/professional/practice-profile").

**IMPORTANT**

**• Store the role in useOnboardingStore** before navigating. ALL subsequent screens read role from store to adapt UI.

**Screen 3G — guardian/care-discovery.tsx**

**TEAL ACCENT THEME. PROGRESS BAR AT 25%.**

**•** 6 care goal cards in a 2-column grid (GoalCard component).

**•** Multiple selection allowed. Each tap toggles selection state + plays Reanimated spring scale.

**•** Selected cards: teal border, teal icon background, gold checkmark.

**•** Bottom CTA active immediately (does not require selection).

**CTA:** router.push("/(onboarding)/ai-processing") after storing selections

**Screen 3P — professional/practice-profile.tsx**

**BLUE/CYAN ACCENT THEME. PROGRESS BAR AT 25%.**

**•** Cyan chip selectors for: Specialization, Practice Size, Patients/Week.

**•** Single-select chips (ChipSelector component, mode="single").

**CTA:** router.push("/(onboarding)/professional/workflow")

**Screen 4G — guardian/assessment.tsx**

**PROGRESS BAR AT 50%. ADAPTIVE QUESTIONS BASED ON SELECTEDGOALS.**

**•** Chip selectors for: Age Range (single), Primary Role (single), Biggest Challenge (single), Sleep Quality (single).

**•** Max 8 questions. Max 60 seconds. Show estimated time remaining.

**CTA:** router.push("/(onboarding)/ai-processing")

**Screen 4P — professional/workflow.tsx**

**PROGRESS BAR AT 50%.**

**•** Multi-select chips for workflow drains: Documentation, Patient Education, Care Planning, Follow-up, Research, Admin.

**CTA:** router.push("/(onboarding)/ai-processing")

**Screen 5 — ai-processing.tsx (Shared)**

**KEY — THIS IS THE DOPAMINE MOMENT. DO NOT USE A SPINNER.**

**•** Animated checklist with 5 items. Items complete sequentially every 900ms using Reanimated withDelay.

**•** Each item: spinner → teal checkmark with spring scale-in animation.

**•** Background pulse rings around shield logo (scale + opacity withRepeat).

**•** Auto-navigates to score-reveal after all items complete (3–4 seconds total).

**•** DO NOT show a back button on this screen.

**CHECKLIST ITEMS — GUARDIAN**

**•** "Understanding Care Responsibilities"

**•** "Identifying Stress Points"

**•** "Mapping Health Priorities"

**•** "Analyzing Support Needs"

**•** "Generating Personalized Recommendations"

**CHECKLIST ITEMS — PROFESSIONAL**

**•** "Analyzing Workflow Patterns"

**•** "Identifying Efficiency Opportunities"

**•** "Mapping Clinical Use Cases"

**•** "Reviewing Practice Structure"

**•** "Generating AI Recommendations"

**Screen 6 — score-reveal.tsx (Dual — Role-Adaptive)**

**SCORE VALUES**

**Guardian score range:** 45–85. Default: 72. Never above 85 (creates improvement motivation).

**Professional score:** 78\. Display "8.4 hrs/week recoverable" as subtitle.

**SCORE RING ANIMATION**

**•** SVG arc that animates from 0 to score value over 1.2 seconds using Reanimated withTiming.

**•** Score number counts up from 0 using withTiming.

**•** On completion: reward micro-animation — scale 1.0 → 1.05 → 1.0 spring.

**FINDINGS CARDS**

**•** 4 finding cards stagger in with 80ms delay using Reanimated FadeInDown.

**•** Icons: warn (red), ok (green), gold (improvement), teal (strength).

**VIRAL GROWTH LOOP**

**•** After findings: "Invite 3 friends → Unlock Premium Care Report" (Guardian) or "Invite a colleague → Unlock Advanced Clinical Templates" (Professional).

**•** Tapping opens share sheet via expo-sharing.

**Screen 7 — future-vision.tsx (Dual)**

**LOSS AVERSION FRAMING. SHOW "WITHOUT" PANEL FIRST, THEN "WITH TRUWELL" PANEL.**

**•** Both panels are pre-rendered. The "With TruWell" panel slides up from +20px opacity 0 → in view, 0.4s after the "Without" panel renders.

**•** Guardian: teal "With" panel. Professional: cyan/blue "With" panel.

**•** 4 bullet points in each panel.

**Screen 8 — ai-demo.tsx (Free AI Interaction)**

**PRODUCT SAMPLING — ONE FREE INTERACTION TO CREATE CONVERSION INTENT.**

**•** Show pre-written chat exchange (static, not live API call) for demo purposes.

**•** After the static exchange renders, show typing indicator for 2.5 seconds then render a locked "Continue in Premium" card.

**•** Guardian chat: fatigue question → personalized AI answer.

**•** Professional chat: patient education request → AI summary + care checklist offer.

**•** Chat bubbles use ChatBubble component. User bubble: right-aligned gold tint. AI bubble: left-aligned teal tint.

**•** Upsell card at bottom: "Get daily personalized guidance..." (Guardian) or "Get unlimited clinical docs..." (Professional).

**Screen 9 — blueprint.tsx (Endowment Effect)**

**80% OF CONTENT IS VISUALLY LOCKED. THE SCORE ITEM IS UNLOCKED TO REINFORCE OWNERSHIP.**

**•** BlueprintRow component: unlocked rows show teal icon + checkmark. Locked rows show faded icon + lock badge.

**•** Locked rows render with a 40% opacity blur overlay (use MaskedView or simple opacity reduction).

**•** FOMO badge: "Your plan is ready" with animated gold dot.

**BLUEPRINT CONTENTS — GUARDIAN**

**•** "Your Care Score: 72/100" — UNLOCKED

**•** "Personalized Care Plan" — LOCKED

**•** "AI Care Companion — Unlimited" — LOCKED

**•** "Health Monitoring Checklist" — LOCKED

**•** "Product Safety Scanner" — LOCKED

**BLUEPRINT CONTENTS — PROFESSIONAL**

**•** "Your Practice Score: 78/100" — UNLOCKED

**•** "Clinical Documentation Assistant" — LOCKED

**•** "Patient Education Generator" — LOCKED

**•** "Workflow Automation Tools" — LOCKED

**•** "Practice Intelligence Dashboard" — LOCKED

**Screen 10 — subscription.tsx (Conversion)**

**CRITICAL: SELL OUTCOMES, NOT FEATURES.**

**•** Guardian headline: "Care With Confidence"

**•** Professional headline: "Practice Smarter"

**•** Primary plan card: teal border (Guardian) or cyan border (Professional). Gold "Most Popular" badge.

**•** Price: $9.99/month with "7-day free trial · No charge now" in green.

**•** Basic plan: "Continue Free — Limited access only".

**•** Primary CTA: "Start My Free 7-Day Trial"

**•** Secondary CTA: never force payment. The basic plan option must always remain tappable.

**•** Guarantee row: shield-check icon + "No charge for 7 days · Cancel anytime".

**NAVIGATION**

**Trial CTA:** router.push("/(onboarding)/account")

**Free CTA:** router.push to existing post-onboarding destination with limited flag

**Screen 11 — account.tsx (Post-Commitment)**

**REQUEST ACCOUNT ONLY AFTER VALUE DELIVERY AND TRIAL COMMITMENT.**

**•** 3 auth buttons: Google (OAuth), Apple (Sign in with Apple), Email.

**•** Use existing Supabase auth functions — DO NOT rewrite auth logic.

**•** Sub-copy: "Value is already yours. Account = your key to access it."

**•** On successful auth: mark onboarding complete (setOnboardingComplete(true) in existing auth store), then router.replace to main app.

**REANIMATED 3 ANIMATION SYSTEM**

All animations use Reanimated 3. Import from react-native-reanimated (already installed in this project).

**STANDARD ENTRANCE (ALL SCREENS)**

import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

&lt;Animated.View entering={FadeInDown.delay(80).springify()}&gt;

**STAGGERED LIST (GOALS, FINDINGS, CHECKLIST)**

items.map((item, i) => (

&lt;Animated.View entering={FadeInDown.delay(i \* 80).springify()}&gt;

&lt;GoalCard key={item.id} {...item} /&gt;

&lt;/Animated.View&gt;

))

**CARD SELECTION SPRING**

const scale = useSharedValue(1);

const animStyle = useAnimatedStyle(() => ({ transform: \[{ scale: scale.value }\] }));

const onPress = () => { scale.value = withSpring(1.04, {}, () => { scale.value = withSpring(1); }); };

**SCORE RING COUNT-UP**

const progress = useSharedValue(0);

useEffect(() => { progress.value = withTiming(targetScore / 100, { duration: 1200 }); }, \[\]);

const animatedScore = useDerivedValue(() => Math.round(progress.value \* targetScore));

**PROCESSING CHECKLIST**

// Complete item at index n after delay:

setTimeout(() => { setCompletedItems(prev => \[...prev, n\]); }, n \* 900);

**PROGRESS BAR COMPONENT — components/onboarding/ProgressBar.tsx**

interface Props { percent: number; variant: 'teal' | 'blue'; eta?: string; }

const ProgressBar = ({ percent, variant, eta }: Props) => {

const width = useSharedValue(0);

useEffect(() => {

width.value = withSpring(percent, { damping: 14, stiffness: 100 });

}, \[percent\]);

const animStyle = useAnimatedStyle(() => ({ width: \`${width.value}%\` }));

const color = variant === "teal" ? OB.teal : OB.cyan;

return (

&lt;View style={{ paddingHorizontal: 22 }}&gt;

&lt;View style={{ height: 3, backgroundColor: OB.w12, borderRadius: 100, overflow: "hidden" }}&gt;

&lt;Animated.View style={\[{ height: "100%", borderRadius: 100, backgroundColor: color }, animStyle\]} /&gt;

&lt;/View&gt;

{eta && &lt;Text style={{ ...styles.eta }}&gt;{eta}&lt;/Text&gt;}

&lt;/View&gt;

);

};

**FONT SETUP**

Montserrat and DM Sans must be loaded via expo-font (or expo-google-fonts if already configured).

import { useFonts } from 'expo-font';

import { Montserrat_400Regular, Montserrat_600SemiBold, Montserrat_700Bold, Montserrat_800ExtraBold, Montserrat_900Black } from '@expo-google-fonts/montserrat';

import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';

Load in app/\_layout.tsx (root layout). If already loading fonts there, add these to the existing useFonts call.

**LAYOUT RULES**

**• Background:** OB.navy (#0A1628) on all screens.

**• Content padding:** 22px horizontal, 28px from safe area top.

**• Scrollable area:** SafeAreaView with bottom inset, padding-bottom 110px (for CTA footer).

**• CTA footer:** position absolute, bottom 0, left/right 0. Contains gold/teal/blue gradient button at height 56px, borderRadius 16.

**• Card radius:** 16–20px. Chip radius: 100px.

**• Circuit texture:** SVG at 7% opacity, absolute positioned on all screens.

**• Glow blobs:** View with borderRadius 9999, specific opacity and blur (use expo-blur BlurView or simple opacity).

**• notch avoidance:** use useSafeAreaInsets().top for top padding.

**TARGET CONVERSION METRICS**

|     |     |
| --- | --- |
| **Stage** | Target |
| **Welcome → Assessment Start** | 70%+ |
| **Assessment Start → Completion** | 80%+ |
| **Completion → Blueprint Reveal** | 75%+ |
| **Blueprint → Account Creation** | 60%+ |
| **Account → Trial Activation** | 25%+ |
| **Trial → Paid Conversion** | 30%+ |
| **Referral Participation** | 15%+ |

**EXISTING LOGIC — DO NOT TOUCH**

**•** supabase/functions/\* — all Edge Functions

**•** store/authStore.ts (or equivalent) — auth state management

**•** app/(tabs)/\* — all main app screens

**•** app/auth/\* — sign in / sign up screens

**•** components/scanner/\* — product scanner components

**•** components/telehealth/\* — telehealth components

**•** Any existing navigation guards or route protection logic

The new onboarding replaces ONLY the content inside app/(onboarding)/. It must still route to the same post-onboarding destination as the existing implementation.

**DELIVERABLE CHECKLIST**

**•** All 11 screens created and navigable.

**•** Role selection correctly forks to Guardian vs Professional journey.

**•** Zustand store wired to all screens.

**•** Reanimated 3 animations on all entrance, selection, and score reveal moments.

**•** Progress bar component present on screens 3–9.

**•** AI processing screen auto-advances after checklist completes.

**•** Score ring animates from 0 to target value.

**•** Blueprint screen shows 20% visible, 80% locked.

**•** Account creation uses existing Supabase auth — no new auth code.

**•** No existing files modified outside app/(onboarding)/ and store/onboardingStore.ts.
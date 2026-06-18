# TruWell AI — Onboarding Flow Implementation Prompt
# For: Claude Code in Cursor Terminal
# Scope: Onboarding ONLY — do not touch any other existing feature
# Version: 1.0

---

## CRITICAL SCOPE RESTRICTION

You are implementing the onboarding flow ONLY. You must NOT modify, refactor, touch, or break:
- Any existing tab screen (home, scan, wellness, safecircle, profile)
- Any existing store (authStore, scanStore, wellnessStore, etc.)
- Any existing lib file unless adding a new export
- Any existing component outside the onboarding folder
- The existing navigation structure outside of auth group routing
- Any Supabase table, RLS policy, or edge function
- The existing theme system (only consume it, never modify it)
- The existing login.tsx file logic (only style it)

If any action would touch a file outside app/(auth)/ or components/onboarding/, STOP and ask before proceeding.

Read the entire prompt before writing a single line of code. Then execute each section in order.

---

## SECTION 1 — DESIGN TOKENS

These are the exact design tokens from the approved UI/UX specification. They map to your existing theme system as follows. Add these as onboarding-specific constants in a new file: components/onboarding/tokens.ts

```typescript
// components/onboarding/tokens.ts
// Onboarding design tokens — read-only, do not export to global theme
// These values come directly from the approved design specification

export const OB = {
  // Core backgrounds
  ink: '#03080F',
  navy: '#081422',
  navy2: '#0C1C30',

  // Gold palette
  gold: '#C9A84C',
  goldLight: '#E8C96B',
  goldDark: '#8A5C1A',
  goldGlow: 'rgba(201,168,76,0.4)',
  goldGlowBorder: 'rgba(201,168,76,0.25)',

  // Teal palette
  teal: '#00E5C8',
  tealDark: '#008F7D',
  tealGlow: 'rgba(0,229,200,0.3)',

  // Status
  red: '#FF4757',
  green: '#2ED573',
  sky: '#1E90FF',

  // Glass surfaces
  glass1: 'rgba(255,255,255,0.055)',
  glass2: 'rgba(255,255,255,0.09)',
  glassBorder: 'rgba(255,255,255,0.1)',

  // Text opacity layers
  t100: '#F0F4FF',
  t70: 'rgba(240,244,255,0.72)',
  t45: 'rgba(240,244,255,0.45)',
  t20: 'rgba(240,244,255,0.20)',
  t10: 'rgba(240,244,255,0.10)',

  // Border radii
  r12: 12,
  r16: 16,
  r20: 20,
  r24: 24,
  r99: 999,
} as const;

// AI typewriter prompts per wizard step
export const WIZARD_PROMPTS = {
  user: [
    "Let's build your <strong>Guardian Profile</strong>. What should I call you?",
    "Tell me about your <strong>health history</strong>. I'll personalise every scan around it.",
    "What does your body <strong>react to</strong>? I'll flag these on every scan automatically.",
    "Some ingredients interact with <strong>medications</strong>. Tell me what you're taking — even optionally.",
    "Choose your <strong>guardian plan</strong>. You can always upgrade later.",
  ],
  expert: [
    "Welcome, clinician. Let's set up your <strong>professional dashboard</strong>. What should I call you?",
    "Your specialty shapes your dashboard. Tell me about your <strong>clinical credentials</strong>.",
    "Help me understand your <strong>patient population</strong> so I can surface the right alerts.",
    "Which <strong>clinical tools</strong> do you want activated from day one?",
    "Choose your <strong>professional plan</strong>. The first 500 experts get lifetime access free.",
  ],
} as const;

// Live activity ticker data
export const TICKER_NAMES = ['Amara K.','James T.','Priya S.','Chen W.','Fatima A.','Lucas M.','Zara O.','Noah B.','Aisha D.','Ethan R.'];
export const TICKER_PRODUCTS = ['sunscreen','shampoo','protein powder','baby lotion','face wash','deodorant','cereal'];
export const TICKER_OUTCOMES = ['flagged 2 ingredients','found a safer choice','avoided a banned chemical','got an A rating'];
```

---

## SECTION 2 — FILE STRUCTURE

Create this exact structure. Create all files as empty shells first, then fill them in the order listed in Section 11.

```
app/
  (auth)/
    _layout.tsx              ← already exists, update routing only
    welcome.tsx              ← NEW: splash + 5 slides + wizard + aha screen

components/
  onboarding/
    tokens.ts                ← NEW: design tokens (Section 1)
    TruWellShield.tsx        ← NEW: reusable shield SVG component
    SplashScreen.tsx         ← NEW: splash screen
    OnboardingSlides.tsx     ← NEW: 5-slide carousel container
    slides/
      Slide1Revelation.tsx   ← NEW: "The Revelation"
      Slide2Proof.tsx        ← NEW: "The Proof"
      Slide3Personalise.tsx  ← NEW: "Personalisation"
      Slide4Community.tsx    ← NEW: "Social Proof"
      Slide5TypeSelect.tsx   ← NEW: "Type Selection"
    wizard/
      RegistrationWizard.tsx ← NEW: wizard container
      WizardHeader.tsx       ← NEW: step dots + back button
      ConvoPrompt.tsx        ← NEW: AI typewriter prompt bubble
      user/
        UserStep1.tsx        ← NEW: name/email/password
        UserStep2.tsx        ← NEW: age/sex/conditions
        UserStep3.tsx        ← NEW: allergies/life stage
        UserStep4.tsx        ← NEW: medications/referral
        UserStep5.tsx        ← NEW: plan selection
      expert/
        ExpertStep1.tsx      ← NEW: name/email/password
        ExpertStep2.tsx      ← NEW: specialty/license/practice
        ExpertStep3.tsx      ← NEW: patient population
        ExpertStep4.tsx      ← NEW: clinical tools
        ExpertStep5.tsx      ← NEW: plan selection
    AhaScreen.tsx            ← NEW: success celebration
    ui/
      FloatingChemTag.tsx    ← NEW: floating chemical label
      StatCard.tsx           ← NEW: 3-column stat card
      CtaButton.tsx          ← NEW: gold gradient CTA
      ActivityTicker.tsx     ← NEW: live activity pill
      ProgressBar.tsx        ← NEW: 5-segment progress bar
      TagCloud.tsx           ← NEW: multi-select tag grid
      ChoiceCard.tsx         ← NEW: radio-style choice card
      FormInput.tsx          ← NEW: styled text input
      FormSelect.tsx         ← NEW: styled select dropdown
      CheckboxItem.tsx       ← NEW: gold checkbox row
      BurstEffect.tsx        ← NEW: confetti particle burst
      PulseRing.tsx          ← NEW: animated pulse ring
      OrbitRing.tsx          ← NEW: rotating orbit ring

stores/
  onboardingStore.ts         ← NEW: Zustand store for onboarding state
```

---

## SECTION 3 — ONBOARDING ZUSTAND STORE

Create stores/onboardingStore.ts. This store is isolated and does not interact with any existing store.

```typescript
// stores/onboardingStore.ts
import { create } from 'zustand';

export type UserType = 'user' | 'expert' | null;
export type WizardStep = 1 | 2 | 3 | 4 | 5;

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  age: string;
  sex: string;
  conditions: string[];
  allergies: string[];
  lifeStage: string;
  medications: string;
  supplements: string;
  referralSource: string;
  selectedPlan: string;
}

interface ExpertFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  specialty: string;
  licenseNumber: string;
  yearsOfPractice: string;
  practiceType: string;
  institution: string;
  patientVolume: string;
  patientPopulations: string[];
  clinicalTools: string[];
  linkedIn: string;
  selectedPlan: string;
}

interface OnboardingState {
  // Splash
  splashComplete: boolean;
  setSplashComplete: (v: boolean) => void;

  // Slides
  currentSlide: number;
  setCurrentSlide: (n: number) => void;

  // Type selection
  selectedType: UserType;
  setSelectedType: (t: UserType) => void;

  // Wizard
  wizardOpen: boolean;
  setWizardOpen: (v: boolean) => void;
  wizardStep: WizardStep;
  setWizardStep: (s: WizardStep) => void;

  // Forms
  userForm: UserFormData;
  setUserField: (field: keyof UserFormData, value: string | string[]) => void;
  expertForm: ExpertFormData;
  setExpertField: (field: keyof ExpertFormData, value: string | string[]) => void;

  // Completion
  onboardingComplete: boolean;
  setOnboardingComplete: (v: boolean) => void;

  // Reset
  reset: () => void;
}

const defaultUserForm: UserFormData = {
  firstName: '', lastName: '', email: '', password: '',
  age: '', sex: '', conditions: [], allergies: [],
  lifeStage: '', medications: '', supplements: '',
  referralSource: '', selectedPlan: 'free',
};

const defaultExpertForm: ExpertFormData = {
  firstName: '', lastName: '', email: '', password: '',
  specialty: '', licenseNumber: '', yearsOfPractice: '',
  practiceType: '', institution: '', patientVolume: '',
  patientPopulations: [], clinicalTools: [], linkedIn: '',
  selectedPlan: 'trial',
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  splashComplete: false,
  setSplashComplete: (v) => set({ splashComplete: v }),
  currentSlide: 0,
  setCurrentSlide: (n) => set({ currentSlide: n }),
  selectedType: null,
  setSelectedType: (t) => set({ selectedType: t }),
  wizardOpen: false,
  setWizardOpen: (v) => set({ wizardOpen: v }),
  wizardStep: 1,
  setWizardStep: (s) => set({ wizardStep: s }),
  userForm: defaultUserForm,
  setUserField: (field, value) =>
    set((state) => ({ userForm: { ...state.userForm, [field]: value } })),
  expertForm: defaultExpertForm,
  setExpertField: (field, value) =>
    set((state) => ({ expertForm: { ...state.expertForm, [field]: value } })),
  onboardingComplete: false,
  setOnboardingComplete: (v) => set({ onboardingComplete: v }),
  reset: () => set({
    splashComplete: false, currentSlide: 0, selectedType: null,
    wizardOpen: false, wizardStep: 1,
    userForm: defaultUserForm, expertForm: defaultExpertForm,
    onboardingComplete: false,
  }),
}));
```

---

## SECTION 4 — SHARED UI PRIMITIVES

Build these components first. Every slide and wizard step depends on them.

### 4.1 TruWellShield SVG Component

Create components/onboarding/TruWellShield.tsx:

```typescript
// Exact SVG from design specification
// Props: size (number, default 120), animated (boolean, default false)
// When animated=true: apply float animation (translateY 0 → -9px → 0, 3.5s ease-in-out infinite)
// drop-shadow filters:
//   drop-shadow(0 0 28px rgba(201,168,76,0.7))
//   drop-shadow(0 0 56px rgba(201,168,76,0.35))
//   drop-shadow(0 0 100px rgba(0,229,200,0.2))

// SVG paths (exact, do not alter):
// Shield body: "M70 6 L122 26 L122 74 C122 102 100 122 70 132 C40 122 18 102 18 74 L18 26 Z"
//   fill: linearGradient SG (#E8C96B → #C9A84C → #8A5C1A), filter: GF (Gaussian blur)
// Shield inner plate: "M70 18 L112 35 L112 73 C112 97 94 115 70 124 C46 115 28 97 28 73 L28 35 Z"
//   fill: #081422
// Inner glow ellipse: cx=70 cy=76 rx=28 ry=30
//   fill: radialGradient CoreGlow (#00E5C8 30% opacity → transparent)
// Core circle: cx=70 cy=76 rx=24 ry=26
//   fill: linearGradient CB (#00E5C8 → #1E90FF), opacity 0.92
// Scan lines (3 horizontal):
//   x1=54 y1=67 x2=86 y2=67, stroke white, strokeWidth 2, opacity 0.6
//   x1=54 y1=76 x2=86 y2=76, stroke white, strokeWidth 2, opacity 0.9
//   x1=54 y1=85 x2=76 y2=85, stroke white, strokeWidth 2, opacity 0.6
// Scan dots (3 circles): cx=54 r=3, fill #00E5C8, at y=67, y=76, y=85
// Crown star: cx=70 cy=30 r=5, fill SG gradient, opacity 0.9
// Corner accents: x1=30 y1=42 x2=42 y2=42 and x1=98 y1=42 x2=110 y2=42
//   stroke #C9A84C, strokeWidth 1, opacity 0.35

// Checkmark variant (used in AHA screen):
// Replace scan lines and dots with: "M57 76l8 9 18-18"
//   stroke white, strokeWidth 4, strokeLinecap round, strokeLinejoin round
// Props: showCheckmark (boolean, default false) — renders checkmark variant
```

### 4.2 OrbitRing Component

Create components/onboarding/ui/OrbitRing.tsx:

```typescript
// Props: size (number), borderColor (string), duration (number, seconds),
//        direction ('cw' | 'ccw'), dotColor? (string), dotSize? (number)
// 
// Renders a circular ring with optional glowing dot at top
// position: absolute, top: 50%, left: 50%
// transform: translate(-50%, -50%) for centering
// borderRadius: 50%, border: 1px solid borderColor
// Animation: rotate 360deg (cw) or -360deg (ccw) over duration, linear infinite
// 
// Dot (if dotColor provided):
//   position: absolute, top: -dotSize/2, left: 50%, transform: translateX(-50%)
//   borderRadius: 50%, background: dotColor
//   boxShadow: multiple layers of glow at 16px, 32px, 64px using dotColor with opacity
```

### 4.3 PulseRing Component

Create components/onboarding/ui/PulseRing.tsx:

```typescript
// Props: size (number), color (string), delay (number, seconds)
// 
// Renders an expanding fade-out ring animation
// position: absolute, top: 55%, left: 50%
// Animation: scale 0.85 to 1.35, opacity 0.8 to 0, 3s ease-out infinite
// with animation-delay = delay prop
```

### 4.4 CtaButton Component

Create components/onboarding/ui/CtaButton.tsx:

```typescript
// Props: label (string), onPress (() => void), disabled? (boolean), style? (ViewStyle)
//
// Dimensions: width 100%, height 60px, borderRadius 20px
// Background: linearGradient 135deg from #E8C96B (0%) to #C9A84C (40%) to #8A5C1A (100%)
// Text: font Cabinet Grotesk, weight 800, size 16px, letterSpacing 0.15, color #03080F
// Shadows:
//   shadow 0 16px 40px rgba(201,168,76,0.45)
//   shadow 0 6px 16px rgba(0,0,0,0.4)
//   inset shadow 0 1px 0 rgba(255,255,255,0.3)
// Shimmer overlay: absolute positioned white gradient strip, skewX -20deg,
//   animates background-position 0% to 200%, 3s ease-in-out infinite
// Active state: scale 0.97, reduced shadow
// Disabled state: opacity 0.4, no pointer events
// Right arrow SVG icon (18x18): path "M4 9h10M10 5l4 4-4 4", stroke currentColor, strokeWidth 2
// Ripple effect on press: white circle expands from center point, fades out, 650ms
// expo-haptics ImpactFeedbackStyle.Medium on every press
```

### 4.5 StatCard Component

Create components/onboarding/ui/StatCard.tsx:

```typescript
// Props: value (string), label (string), valueColor? (string, default OB.gold)
//
// Container: flex 1, borderRadius OB.r16, padding 13px 8px, textAlign center
// Background: OB.glass1 with linearGradient overlay rgba(201,168,76,0.07) → transparent
// Border: 1px solid OB.glassBorder
// Before pseudo: absolute inset 0, borderRadius inherit, gradient overlay
// Value: font Clash Display, weight 700, size 21px, color valueColor
//   textShadow: 0 0 20px rgba(201,168,76,0.4)
// Label: size 8.5px, color OB.t20, marginTop 4px, lineHeight 1.4
// Used in a 3-column grid row with gap 7px
```

### 4.6 FloatingChemTag Component

Create components/onboarding/ui/FloatingChemTag.tsx:

```typescript
// Props: label (string), top? (string|number), bottom? (string|number),
//        left? (string|number), right? (string|number), rotation? (number, degrees),
//        delay? (number, seconds), variant? ('default'|'red')
//
// Container: position absolute at given top/left/bottom/right
//   background: rgba(8,20,34,0.7), backdropFilter blur(10px)
//   border: 1px solid glassBorder (default) or rgba(255,71,87,0.3) (red variant)
//   borderRadius: OB.r99, padding: 5px 10px
//   transform: rotate(rotation degrees)
//   animation: float 3s ease-in-out infinite, delay=delay prop
//     float: translateY 0 → -9px → 0
// Text: size 8.5px, weight 600, color OB.t70 (default) or #FF6B78 (red variant)
//
// float animation with CSS equivalent using Reanimated useSharedValue:
//   withRepeat(withSequence(withTiming(-9, 1500ms), withTiming(0, 1500ms)), -1, false)
//   apply as translateY to the container
```

### 4.7 ActivityTicker Component

Create components/onboarding/ui/ActivityTicker.tsx:

```typescript
// Shows live social proof pills that appear and disappear
//
// Container: position absolute, bottom aligned, right 0, maxWidth 260px, zIndex 60
//
// Each pill:
//   display flex, alignItems center, gap 8px
//   background rgba(8,20,34,0.88), backdropFilter blur(16px)
//   border 1px solid rgba(201,168,76,0.2), borderRadius OB.r99
//   padding 8px 14px, marginBottom 6px
//
//   Avatar: 24x24 circle, gold gradient background, initials in 10px 800 weight, color #03080F
//   Text: size 10.5px, color OB.t70, weight 500, lineHeight 1.35
//     Name portion in bold color OB.goldLight
//
// Entry animation: translateX 100% → 0, scale 0.96 → 1, opacity 0 → 1, 500ms spring
// Exit animation: translateX 0 → -100%, opacity 1 → 0, 400ms ease
//
// Logic:
//   Show first pill after 2000ms
//   Show new pill every 5000ms
//   Each pill auto-dismisses after 3500ms
//   Max 2 pills visible at once
//   Uses TICKER_NAMES, TICKER_PRODUCTS, TICKER_OUTCOMES from tokens.ts
```

### 4.8 ProgressBar Component

Create components/onboarding/ui/ProgressBar.tsx:

```typescript
// Props: totalSteps (number, 5), currentStep (number, 0-indexed)
//
// Container: display flex, gap 4px, marginBottom 10px
// Each segment: flex 1, height 2.5px, borderRadius 3px, overflow hidden
//   background: OB.t10 (unfilled track)
//   Inner fill div:
//     height 100%, borderRadius 3px
//     background: linearGradient 90deg from OB.goldDark to OB.gold
//
// Segment states:
//   done (index < currentStep): fill width 100%, no animation
//   active (index === currentStep): fill width animates 0% → 100% over 7s linear
//   future (index > currentStep): fill width 0%, no animation
//
// Use Reanimated useSharedValue for active segment width animation
```

### 4.9 TagCloud Component

Create components/onboarding/ui/TagCloud.tsx:

```typescript
// Props: tags (string[]), selected (string[]), onToggle ((tag: string) => void),
//        sectionLabel? (string)
//
// Container: display flex, flexWrap wrap, gap 8px
//
// Each tag pill:
//   default: background OB.glass1, border 1px solid OB.glassBorder,
//     borderRadius OB.r99, padding 8px 14px
//     text: size 11.5px, weight 600, color OB.t45
//   selected (on): background rgba(201,168,76,0.15), border rgba(201,168,76,0.4),
//     text color OB.gold
//
// On tap: toggle selected state, expo-haptics selectionAsync()
// Bounce animation on tap: scale 1.0 → 1.03 → 1.0, 220ms spring (damping 8, stiffness 200)
// Section label (if provided): 11px, weight 700, color OB.t20, uppercase, letterSpacing 1.5px,
//   marginBottom 10px, marginTop 4px
```

### 4.10 ChoiceCard Component

Create components/onboarding/ui/ChoiceCard.tsx:

```typescript
// Props: emoji (string), title (string), subtitle? (string),
//        selected (boolean), onSelect (() => void), groupName (string)
//
// Container: display flex, alignItems center, gap 12px
//   padding 14px 16px, borderRadius OB.r16
//   background OB.glass1, border 1px solid OB.glassBorder
//   marginBottom 8px
//
// Selected state: background rgba(201,168,76,0.1), border rgba(201,168,76,0.35)
//
// Emoji: 28px, marginRight 4px
// Text block: flex 1
//   Title: size 14px, weight 700, color OB.t100
//   Subtitle (if provided): size 12px, color OB.t45, marginTop 2px
//
// Radio indicator (right side): 22x22 circle
//   Unselected: border 1.5px solid OB.glassBorder, background transparent
//   Selected: background OB.gold, border OB.gold,
//     contains checkmark SVG: "M2 5l2.5 2.5L8 2", stroke #03080F, strokeWidth 2
//
// On tap: call onSelect, expo-haptics selectionAsync()
// Bounce animation: scale 1.0 → 1.02 → 1.0, 200ms spring
```

### 4.11 FormInput Component

Create components/onboarding/ui/FormInput.tsx:

```typescript
// Props: label (string), value (string), onChangeText ((t: string) => void),
//        placeholder? (string), keyboardType? (KeyboardTypeOptions),
//        secureTextEntry? (boolean), autoComplete? (string),
//        showPasswordToggle? (boolean)
//
// Label: size 11px, weight 700, color OB.t45, marginBottom 8px, letterSpacing 0.3px
//
// Input container: position relative
// TextInput:
//   background rgba(255,255,255,0.06), border 1px solid OB.glassBorder
//   borderRadius OB.r12, padding 15px 16px
//   color OB.t100, fontSize 15px, fontWeight 500
//   placeholderTextColor OB.t20
//   focused state: border 1px solid rgba(201,168,76,0.5)
//
// Password toggle (if showPasswordToggle):
//   Position absolute right 14px, vertically centered
//   Eye open SVG when hidden, eye closed SVG when visible
//   Tap toggles secureTextEntry
//
// Validation error display: text below input, size 11px, color OB.red, marginTop 4px
//
// Valid state indicator (after user types): border color rgba(46,213,115,0.4)
```

### 4.12 FormSelect Component

Create components/onboarding/ui/FormSelect.tsx:

```typescript
// Props: label (string), value (string), onValueChange ((v: string) => void),
//        options (Array<{label: string, value: string}>), placeholder? (string)
//
// Same visual styling as FormInput
// Use RN Picker or a custom modal-based picker
// On iOS: show a modal bottom sheet with options list
// On Android: use native Picker component styled to match
// When value is selected: border changes to rgba(201,168,76,0.4)
// Chevron down SVG icon on right side (16x16, color OB.t45)
```

### 4.13 CheckboxItem Component

Create components/onboarding/ui/CheckboxItem.tsx:

```typescript
// Props: label (string), checked (boolean), onToggle (() => void)
//
// Container: display flex, alignItems center, gap 12px, padding 14px 0,
//   borderBottom 1px solid OB.glass1
//
// Checkbox square: 22x22, borderRadius 6px
//   Unchecked: border 1.5px solid rgba(255,255,255,0.15), background transparent
//   Checked: background OB.gold, border OB.gold
//     Checkmark: "✓" text, size 13px, weight 800, color #03080F, centered
//
// Label: size 14px, weight 500, color OB.t70, flex 1
//
// On tap: toggle checked, expo-haptics selectionAsync()
```

### 4.14 BurstEffect Component

Create components/onboarding/ui/BurstEffect.tsx:

```typescript
// A utility component that renders particle burst animations
// using Reanimated and positioned absolutely in a portal/overlay layer
//
// Two modes:
// 1. burst(originX, originY) — 18 particles, radial fan pattern, distance 70-125px
// 2. megaBurst() — 44 particles, full spread, distance 90-290px, from screen center-top
//
// Particle colors: ['#C9A84C','#E8C96B','#00E5C8','#2ED573','#8A5C1A','#1E90FF','#FF4757','#fff']
// Each particle: circle, size 3-9px, position absolute at origin
// Animation: translate by (dx, dy) + scale 1 → 0 + opacity 1 → 0
//   Duration: 900ms-1700ms (random), delay 0-140ms (random)
//   Easing: cubic-bezier(0.4, 0, 0.2, 1)
// Particles self-destruct after animation completes
//
// Export as a ref-based imperative API:
//   const burstRef = useRef<BurstEffectRef>(null);
//   burstRef.current?.burst(x, y);
//   burstRef.current?.megaBurst();
```

---

## SECTION 5 — SPLASH SCREEN

Create components/onboarding/SplashScreen.tsx:

### Layout structure (absolute positioned layers, bottom to top):

```
Layer 0 (z:0): Mesh background gradient
Layer 1 (z:1): 4 concentric orbit rings (sp-r1 through sp-r4)
Layer 2 (z:10): Shield + wordmark group
Layer 3 (z:10): Loading bar area (bottom)
```

### Mesh background:
```
radial-gradient(ellipse 60% 40% at 30% 30%, rgba(201,168,76,0.08) 0%, transparent 70%),
radial-gradient(ellipse 50% 50% at 75% 70%, rgba(0,229,200,0.06) 0%, transparent 70%),
radial-gradient(ellipse 80% 60% at 50% 50%, rgba(8,20,34,0.9) 0%, transparent 100%)
```

### 4 Orbit rings (all using OrbitRing component):
```
Ring 1: size 380px, color rgba(201,168,76,0.07), duration 30s CW, dot: gold 8px
Ring 2: size 290px, color rgba(0,229,200,0.09), duration 22s CCW, dot: teal 6px
Ring 3: size 200px, color rgba(201,168,76,0.11), duration 16s CW, dot: goldLight 5px
Ring 4: size 130px, color rgba(0,229,200,0.14), duration 10s CCW, dot: teal 4px
```

### Shield + wordmark group:
```
TruWellShield component: size 120px, animated=true
Entry animation: popInSpring — scale 0.5 → 1, opacity 0 → 1
  duration 900ms, cubic-bezier(0.34, 1.56, 0.64, 1), delay 300ms
Float animation starts after entry: translateY 0 → -9px → 0, 3.5s ease-in-out infinite, delay 1.2s
```

### Wordmark (below shield, marginTop 26px):
```
Entry: slideUp — translateY 26px → 0, opacity 0 → 1, 700ms, cubic-bezier(0.4,0,0.2,1), delay 800ms

Brand name row:
  "Tru" portion: font Clash Display, weight 700, size 48px, letterSpacing -2px, color OB.t100
  "Well" portion: same font, but color transparent with gradient text:
    linearGradient 135deg from OB.goldLight → OB.gold → OB.goldDark
    Use react-native-linear-gradient with MaskedView or Text background approach
  "AI" suffix: same as "Tru" portion
  Display as: "TruWell AI" (single text element with styled spans)

Subtitle: "KNOW WHAT'S REALLY INSIDE"
  size 10px, weight 700, letterSpacing 5px, textTransform uppercase, color OB.teal, marginTop 8px

Tagline: "Your personal health guardian"
  size 14px, color OB.t45, marginTop 9px, weight 400
```

### Loading area (position absolute, bottom: safeAreaBottom + 52px):
```
Entry: slideUp 500ms, delay 1500ms

Bar track: width 140px, height 2px, background OB.t10, borderRadius 2px
Bar fill: height 100%, borderRadius 2px
  background: linearGradient 90deg from OB.goldDark → OB.gold → OB.goldLight
  Animation: width 0 → 100%, duration 2400ms, cubic-bezier(0.4,0,0.2,1), delay 1600ms

Label below bar: "INITIALISING GUARDIAN SHIELD"
  size 10px, color OB.t20, letterSpacing 2.5px, textTransform uppercase
```

### Splash exit + transition to onboarding:
```
After 3600ms total:
1. Splash exit animation: opacity 1 → 0, scale 1 → 1.06, duration 700ms, easing cubic-bezier(0.4,0,0.2,1)
2. After exit completes (700ms later): hide splash, show onboarding slides
3. Onboarding fades in: opacity 0 → 1, duration 600ms
4. Call enter(0) to activate slide 0 animations

Set splashComplete = true in onboardingStore after transition
```

---

## SECTION 6 — ONBOARDING SLIDES CONTAINER

Create components/onboarding/OnboardingSlides.tsx:

### Container architecture:
```
Outer: position absolute, inset 0, zIndex 100
  opacity: 0 by default, 1 when splashComplete = true (600ms transition)

Swiper container: width 100%, height 100%, overflow hidden

Track: display flex, width: (600/100 * numSlides)%, height 100%
  will-change: transform
  Transition on slide change: translateX, duration 700ms, cubic-bezier(0.83, 0, 0.17, 1)
  currentSlide translation: translateX(-currentSlide * (100/numSlides)%)

Each slide slot: width calc(100% / 6), height 100%, overflow hidden
  display flex, flexDirection column
```

### Gesture handling (Swipe):
```
Use react-native-gesture-handler PanGestureHandler or GestureDetector:
- Record startX, startY on touch start
- On touch end: calculate dx = endX - startX, dy = endY - startY
- If |dx| > |dy| AND |dx| > 55:
  - dx < 0 AND currentSlide < 4: advance to next slide
  - dx > 0 AND currentSlide > 0: go to previous slide
- Prevent vertical scroll interference
```

### Slide transition logic:
```
function goToSlide(index: number):
  setCurrentSlide(index)
  Update track translateX
  Remove 'in' class from all slides
  After 80ms delay: add 'in' class to slide at index (triggers content animations)
  Update progress bar segments

function next(): if currentSlide < 4, goToSlide(currentSlide + 1)
function skipAll(): goToSlide(4)
```

### Content animation trigger on slide enter:
```
When a slide receives 'in' state:
Each .au (animate up) child animates:
  translateY 26px → 0, opacity 0 → 1, 550ms, cubic-bezier(0.4,0,0.2,1)
  Staggered delays: child 1: 60ms, child 2: 130ms, child 3: 200ms, child 4: 280ms, child 5: 360ms
```

---

## SECTION 7 — THE 5 ONBOARDING SLIDES

### SLIDE 1 — "The Revelation" (Slide1Revelation.tsx)

Background: `radial-gradient(ellipse 100% 70% at 50% 0%, #0D1F35 0%, #03080F 65%)`

**Visual area (flex 0 0 51%, position relative):**
```
Mesh overlay: radial-gradient ellipse 80% 55% at 50% 0%, rgba(201,168,76,0.07), transparent

2 Orbit rings centered:
  Ring 1: 270px, rgba(201,168,76,0.09), 28s CW, gold dot
  Ring 2: 200px, rgba(0,229,200,0.12), 20s CCW, teal dot

3 Pulse rings at top:55% left:50% (using PulseRing component):
  Pulse 1: 100px, rgba(201,168,76,0.35), delay 0s
  Pulse 2: 100px, same color, delay 1s
  Pulse 3: 100px, same color, delay 2s
  Animation: scale 0.85→1.35, opacity 0.8→0, 3s ease-out infinite

Shield (position absolute, centered):
  TruWellShield size=88, animated=false

Floating chemical tags (FloatingChemTag component):
  "Parabens"              top:12% left:4%   rotation:-2deg  delay:0s    variant:red
  "Phthalates"            top:21% right:3%  rotation:3deg   delay:0.9s  variant:red
  "BPA"                   top:65% left:3%   rotation:-1deg  delay:1.5s
  "Nano TiO₂"             top:71% right:4%  rotation:2deg   delay:0.4s
  "Methylisothiazolinone" top:7% left:34%   rotation:0deg   delay:2s    fontSize:7.5px
  "Sulfates"              bottom:12% left:22% rotation:-2deg delay:1.2s
  "Retinoids"             bottom:8% right:18% rotation:1deg  delay:0.7s

ActivityTicker component (position absolute, bottom: safeAreaBottom + 110px, right: 0)

Fade overlay at bottom: linearGradient transparent → #0D1F35, height 60px, position absolute bottom
```

**Content area (flex 1, padding 16px 24px 0):**
```
Eyebrow text (.au): "⚠ The Truth"
  size 9.5px, weight 700, letterSpacing 3.5px, uppercase, color OB.teal

Headline (.au): "You absorb 126 chemicals before breakfast. Nobody warned you."
  font Clash Display, weight 700, size 28px, lineHeight 1.15, color OB.t100, letterSpacing -0.5px
  "126 chemicals" rendered in gold gradient text (same technique as wordmark)

Body text (.au): "The FDA hasn't banned a single cosmetic ingredient since 1989.
  The EU has banned over 1,300. The shampoo you used this morning is illegal in France."
  size 14px, lineHeight 1.75, color OB.t45
  "1,300" in weight 600, color OB.t70

Stats row (.au): 3-column grid using StatCard component:
  Card 1: value "1,300+", label "EU Banned Substances", color OB.gold
  Card 2: value "11", label "Banned in USA", color OB.teal
  Card 3: value "0", label "FDA bans since 1989", color OB.red
```

**Top bar:**
```
ProgressBar: totalSteps=5, currentStep=0 (active)
Chapter tag: "01 of 05" — teal pill, size 9px, weight 700, letterSpacing 3px, uppercase
Skip button: "Skip" — glass background, tap calls skipAll()
```

**CTA:**
```
CtaButton label: "Show Me What's Hiding" with arrow icon
onPress: next()
```

---

### SLIDE 2 — "The Proof" (Slide2Proof.tsx)

Background: `radial-gradient(ellipse 100% 60% at 40% 0%, #091E35 0%, #040B16 65%)`

**Visual area (flex 0 0 53%):**
```
Phone halo: absolute centered, 200x200, radial-gradient gold glow, borderRadius 50%
  filter blur(40px), background rgba(201,168,76,0.12)

Orbit around phone: 220px ring, rgba(201,168,76,0.15), rotating CW 18s
  with a single dot (4px, gold)

Phone mockup (centered, z:2):
  Outer shell: width 144px, height 260px, borderRadius 22px
    background linearGradient #0D1A2A → #081422
    border 2px solid rgba(255,255,255,0.08)
    shadow: 0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)

  Notch: 60x8px pill at top center, background #03080F

  Screen content (padding 8px, paddingTop 16px):
    Viewfinder area (background #081422, borderRadius 12px, padding 8px, marginBottom 6px):
      4 corner brackets (L-shaped lines):
        Each: 16px lines, 2px thick, color OB.teal
        Positions: top-left (line right + line down), top-right (line left + line down),
          bottom-left (line right + line up), bottom-right (line left + line up)
      Scan beam: position absolute left-right 6px, height 2px
        background linearGradient transparent → OB.teal → transparent
        Animation: top 6px → bottom 6px, 2s ease-in-out infinite, opacity 0→1→1→0
      Barcode bars: 14 vertical bars of varying widths (1-3.5px), height 32px
        color rgba(255,255,255,0.6), gap 2px, centered horizontally

    Result card (borderRadius 10px, background rgba(0,229,200,0.06),
      border 1px solid rgba(0,229,200,0.15), padding 8px):
      Top row: "SAFETY SCORE" label (6px, OB.t45) | Grade badge "F" (red circle 20px)
      Subtitle: "3 endocrine disruptors detected" (8px, OB.t45, marginTop 3px)
      Score bar track (4px height, borderRadius 2px, background rgba(255,255,255,0.08), marginTop 5px):
        Fill bar: width 18%, background linearGradient OB.red → #FF6B6B

    Alternative pill (borderRadius 8px, background rgba(46,213,115,0.08),
      border 1px solid rgba(46,213,115,0.2), padding 6px 10px, marginTop 6px):
      Green dot 5px + "SAFER CHOICE FOUND" (7px, OB.green, weight 700)
      Below: "2 aisles away · same price" (6px, rgba(255,255,255,0.3))

    Time badge (centered, marginTop 6px):
      "RESULT IN 5 SECONDS" (7px, OB.t20, letterSpacing 1.5px)
```

**Content area:**
```
Eyebrow (.au): "⚡ Instant Intelligence"
Headline (.au): "5 seconds from uncertainty to total clarity"
  "5 seconds" rendered in OB.teal color
  "total clarity" rendered in gold gradient
Body (.au): scan and database explanation text
Database badges row (.au): 8 pills in wrap-flex layout
  Each: background OB.glass1, border OB.glassBorder, borderRadius OB.r99, padding 4px 10px
  Text: size 9px, weight 700, color OB.t45
  Labels: FDA, WHO, EWG, EU Cosmetics, Prop 65, PubMed, NTP, IARC
```

**Top bar:** ProgressBar currentStep=1, chapter "02 of 05", Skip button

**CTA:** label "See My Personalised Shield", onPress: next()

---

### SLIDE 3 — "Personalisation" (Slide3Personalise.tsx)

Background: `radial-gradient(ellipse 100% 60% at 60% 0%, #0A1A28 0%, #040C18 65%)`
Top mesh: `radial-gradient(ellipse 70% 55% at 35% 0%, rgba(30,144,255,0.07), transparent)`

**Visual area (flex 0 0 49%):**
```
Aura (centered absolute): 200x200, borderRadius 50%
  background radial-gradient #1E90FF at 12% opacity, blur(50px)

Person SVG (70x88px, centered):
  Head circle: cx=35 cy=22 r=18, fill rgba(0,229,200,0.1), stroke rgba(0,229,200,0.35) 1.5px
  Body arc: path "M8 86 C8 66 62 66 62 86", fill rgba(0,229,200,0.1), stroke rgba(0,229,200,0.35) 1.5px
  Inner head: cx=35 cy=22 r=9, fill rgba(0,229,200,0.55)
  Breathe ring: cx=35 cy=22 r=14, stroke rgba(0,229,200,0.2), animate breathe 2.5s ease-in-out infinite
    breathe: scale 1.0 ↔ 1.18

Health tag pills floating around person (same pill style as database badges but selected):
  Eczema (teal selected), Gluten-Free, PCOS, Thyroid
  Each floating with random y-offset animation (same FloatingChemTag style but pill shaped)
  Position in a loose cluster around the SVG figure
```

**Content area:**
```
Eyebrow (.au): "🧬 Built For You"
Headline (.au): "Your guardian knows your body. Nobody else's."
  "knows your body" in gold gradient
Body (.au): personalization description
Feature pills row (.au): 4 teal pills: "Eczema Safe", "Hormone Aware", "Pregnancy Mode", "Child Safe"
  Each: background rgba(0,229,200,0.08), border rgba(0,229,200,0.18), borderRadius OB.r99
  padding 7px 13px, size 11px, weight 700, color OB.teal
```

**Top bar:** ProgressBar currentStep=2, chapter "03 of 05", Skip button

**CTA:** label "Build My Health Profile", onPress: next()

---

### SLIDE 4 — "Social Proof" (Slide4Community.tsx)

Background: `radial-gradient(ellipse 100% 70% at 50% 0%, #0C1E2E 0%, #040A14 65%)`

**Visual area (flex 0 0 50%):**
```
Two testimonial cards, stacked with overlap:

Card 1 (top card, position absolute top:8% left:5%, rotation: -2deg):
  width 210px, background OB.glass2, border OB.glassBorder, borderRadius OB.r20
  padding 14px, shadow 0 12px 32px rgba(0,0,0,0.5)
  Header row: 32px avatar circle (initials "SK", gradient bg) | "Sarah K." name | verified badge
  Quote text: size 12px, color OB.t70, lineHeight 1.6
    "I threw out half my pantry after TruWell flagged 6 products my doctor never mentioned."
  Stars: 5 gold star characters (⭐), size 12px

Card 2 (bottom card, position absolute bottom:8% right:5%, rotation: 1.5deg):
  Similar card with different avatar "JM", "James M."
  Quote: "My eczema improved in weeks once I started filtering by my profile. Wish I had this years ago."
  Stars: 5 gold stars

Animated count row (centered, below cards):
  3 stat items in a row:
    "1,247" (counting up animation on slide enter) "Expert Partners"
    "247K" (counting up) "Families Protected"
    "47" (counting up) "Databases"
  Count-up: 0 → target over 1800ms, cubic ease-out (1 - Math.pow(1-t, 3))
  Each number: font Clash Display, size 24px, weight 700, color OB.gold
  Labels: size 9px, color OB.t20
```

**Content area:**
```
Eyebrow (.au): "💬 Real Results"
Headline (.au): "Trusted by over 247,000 families. Here's what changed."
  "247,000 families" in gold gradient
Body (.au): description of community impact
```

**Top bar:** ProgressBar currentStep=3, chapter "04 of 05", Skip button

**CTA:** label "Join Our Community", onPress: next()

---

### SLIDE 5 — "Type Selection" (Slide5TypeSelect.tsx)

Background: `radial-gradient(ellipse 100% 60% at 50% 0%, #0A1824 0%, #030810 65%)`

**Visual area (flex 0 0 42%):**
```
Central counter element (centered):
  Animated countdown display showing "3,427 lifetime spots remaining"
  Background: rgba(255,71,87,0.08), border rgba(255,71,87,0.2), borderRadius OB.r20
  Red pulsing dot (7px) + counter text (size 12px, weight 700, color OB.red)
  Counter decrements by 1 randomly every ~6 seconds when slide is active

Background pulse rings (3 rings using PulseRing):
  80px, OB.red, delays 0s, 1s, 2s — centered behind counter
```

**Content area:**
```
Eyebrow (.au): "🚀 Begin Now"

Headline (.au): "Are you protecting your family, or still hoping nothing is wrong?"

Type selection cards (.au) — 2 cards, vertical stack:

USER CARD (id: tu):
  Icon area: 44x44 circle, background rgba(0,229,200,0.1), border rgba(0,229,200,0.2)
    Person SVG icon: circle cx=12 cy=8 r=4, path "M4 20c0-4 3.6-7 8-7s8 3 8 7"
    Stroke OB.teal, strokeWidth 1.8
  Text: title "Family Guardian" (14px, 700, OB.t100)
    subtitle "Protect everyone you love from hidden dangers in everyday products" (12px, OB.t45)
  Check circle (right): 22px circle, shows gold checkmark when selected

  Default state: background OB.glass1, border OB.glassBorder
  Selected state: background rgba(0,229,200,0.08), border rgba(0,229,200,0.35)
    + burst effect on selection

EXPERT CARD (id: te):
  Icon area: same size, background rgba(201,168,76,0.1), border rgba(201,168,76,0.2)
    Clipboard SVG icon in OB.gold
  Text: title "Healthcare Professional" (14px, 700, OB.t100)
    subtitle "Extend your clinical care into every patient's daily purchasing decisions" (12px, OB.t45)
  Check circle

  Default state: background OB.glass1, border OB.glassBorder
  Selected state: background rgba(201,168,76,0.08), border rgba(201,168,76,0.35)
    + burst effect on selection

FOMO bar below cards:
  display flex, alignItems center, gap 8px, padding 9px 12px
  background rgba(255,71,87,0.06), border rgba(255,71,87,0.15), borderRadius OB.r12
  Dot: 6px circle, background OB.red, animation pulseRing 2.2s infinite
  Text: "Every hour, 34 families discover TruWell AI. Don't be last."
    size 11px, weight 600, color rgba(255,107,118,0.9)
```

**Selection logic:**
```
On type selection:
  Store selectedType in onboardingStore
  Update card visual states
  Show burst effect from selected card origin
  Enable CTA button (was opacity 0.4, pointer-events none)
  Update CTA label:
    user selected: "Create My Free Account →"
    expert selected: "Claim My Clinical Dashboard →"
```

**Top bar:** ProgressBar currentStep=4, chapter "05 of 05" (no Skip button)

**CTA:** Initially disabled (opacity 0.4, no pointer events)
After selection: enabled, onPress: open RegistrationWizard

---

## SECTION 8 — REGISTRATION WIZARD

Create components/onboarding/wizard/RegistrationWizard.tsx:

### Container:
```
Position: absolute, inset 0, zIndex 200
Background: OB.navy (solid, opaque)
Entry animation: translateY: screenHeight → 0 (slide up from bottom)
  Duration 500ms, spring (damping 26, stiffness 300)
Exit animation: reverse

State: controlled by onboardingStore.wizardOpen + wizardStep
```

### WizardHeader Component (WizardHeader.tsx):
```
Container: padding 16px 20px, display flex, alignItems center, justifyContent space-between
  borderBottom 1px solid OB.glass1

Back button (left):
  Arrow left SVG (16x16) + "Back" text
  size 14px, weight 600, color OB.t45
  Tap: if wizardStep === 1, close wizard; else go to previous step

Progress dots (center):
  Display current step as dots: wizardStep of 5
  Done dots: 8px circle, background OB.gold
  Active dot: 8px circle, background OB.teal, scale 1.2
  Future dots: 8px circle, background OB.glass2

Step label (right):
  "Step N of 5", size 12px, color OB.t20
```

### ConvoPrompt Component (ConvoPrompt.tsx):
```
Container: padding 16px 20px
Bubble: display flex, alignItems flex-start, gap 10px
  background rgba(12,28,48,0.8), border OB.glassBorder, borderRadius OB.r16
  padding 12px 14px

Avatar: 32x32 circle, background rgba(201,168,76,0.15)
  Contains small TruWellShield SVG (16px)

Text area: flex 1
  Typewriter animation: render characters one by one at 18ms intervals
  After all chars rendered: replace with HTML version (bold tags rendered)
  Text: size 13px, lineHeight 1.6, color OB.t70
  Blinking cursor: 2px wide, 14px tall, background OB.teal,
    animation opacity 1 → 0 → 1, 700ms infinite step
    cursor disappears after typewriter completes
```

### Wizard scroll body:
```
Container: flex 1, ScrollView, showsVerticalScrollIndicator false
Padding: 0 20px, paddingBottom safeAreaBottom + 80px

Step containers:
  Each step: position absolute-like but using display show/hide
  Entry: slideUp 450ms + opacity 0→1 from right (translateX 40px → 0, scale 0.96 → 1)
  Exit: slide left (translateX 0 → -40px, scale 1 → 0.96, opacity 1→0, 450ms)
```

### Wizard footer:
```
Position: absolute, bottom 0, left 0, right 0
Padding: 10px 20px safeAreaBottom + 16px
Background: linearGradient to top OB.ink 60% → transparent

Continue button:
  Same as CtaButton component
  Label: "Continue →"
  onPress: wizardNext()
  When last step: onPress shows AHA screen
```

---

## SECTION 9 — WIZARD STEPS

### USER PATH (5 steps)

**UserStep1.tsx — Account Creation:**
```
FormInput: First Name, placeholder "e.g. Jane", autoComplete firstName
FormInput: Last Name, placeholder "e.g. Doe", autoComplete lastName
FormInput: Email, keyboardType email-address, placeholder "your@email.com"
FormInput: Password, secureTextEntry, showPasswordToggle true, placeholder "Minimum 8 characters"

Validation (checked on continue):
  All 4 fields required
  Email must match /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  Password minimum 8 characters
  Show inline errors below each invalid field in OB.red, size 11px

On valid continue: advance to step 2
```

**UserStep2.tsx — Health Profile:**
```
Row layout (2 columns):
  FormInput: Age, keyboardType numeric, placeholder "32"
  FormSelect: Sex, options: Female, Male, Prefer not to say

Section label: "Health Conditions"
TagCloud: all tags multi-select
  Tags: PCOS, Eczema, Migraines, Asthma, Diabetes, Thyroid, Rosacea, IBS,
        Kidney Disease, Endometriosis, Autoimmune, Heart Disease, None
  Store in userForm.conditions

Validation: none required (health conditions are optional)
```

**UserStep3.tsx — Allergies + Life Stage:**
```
Section label: "Known Allergies"
TagCloud: multi-select
  Tags: Gluten, Soy, Peanuts, Tree Nuts, Latex, Nickel, Fragrance, Sulfites, Dairy, Eggs, None
  Store in userForm.allergies

Section label: "Life Stage" (marginTop 20px)
4 ChoiceCard components (single select — radio group):
  Card 1: emoji 🤰, title "Currently Pregnant",
    subtitle "Trimester-specific safety alerts"
  Card 2: emoji 🍼, title "Breastfeeding",
    subtitle "Protects what you pass to your baby"
  Card 3: emoji 👨‍👩‍👧, title "Protecting Young Children",
    subtitle "Strictest child-safe filters activated"
  Card 4: emoji 🧬, title "None of the above",
    subtitle "Standard guardian protection"
  Store selected in userForm.lifeStage
```

**UserStep4.tsx — Medications + Referral:**
```
FormInput: "Current Medications (Optional)", placeholder "e.g. Levothyroxine, Metformin"
  Store in userForm.medications

FormInput: "Supplements (Optional)", placeholder "e.g. Omega-3, Vitamin D"
  Store in userForm.supplements

Section label: "How did you find TruWell AI?"
4 ChoiceCard components (single select):
  emoji 👨‍⚕️, "Doctor recommended it"
  emoji 📱, "Social media"
  emoji 👋, "Friend or family"
  emoji 🔍, "Searched for it myself"
  Store in userForm.referralSource
```

**UserStep5.tsx — Plan Selection:**
```
4 ChoiceCard components (single select, default first selected):
  Card 1 (default selected): emoji 🛡, title "Free Guardian"
    subtitle "10 scans/month · A-F grade · 1 profile"
    value "free"

  Card 2: emoji ⚡, title "Pro · $6.58/mo (yearly)"
    subtitle "Unlimited scans · Full breakdown · Offline"
    value "pro"

  Card 3: emoji 👨‍👩‍👧‍👦, title "Family · $16.58/mo (yearly)"
    subtitle "5 profiles · Priority telehealth"
    value "family"

  Card 4: emoji ♾, title "Lifetime · $249 once"
    subtitle "Everything forever · Founder status"
    value "lifetime"

  Store selected in userForm.selectedPlan

FOMO urgency bar (below cards):
  Gold pulsing dot (7px, OB.gold, pulseRing animation)
  Text: "3,427 lifetime spots left. They will not come back."
  size 11px, weight 700, color OB.gold
  Background rgba(201,168,76,0.07), border rgba(201,168,76,0.18), borderRadius OB.r14

On continue (last step): call submitUserRegistration() then show AHA screen
```

---

### EXPERT PATH (5 steps)

**ExpertStep1.tsx — Professional Account:**
```
Expert badge at top:
  Clipboard SVG icon + "Healthcare Professional Track"
  background rgba(201,168,76,0.08), border rgba(201,168,76,0.18)
  borderRadius OB.r99, padding 8px 14px, size 12px, weight 700, color OB.gold

FormInput: First Name, placeholder "Dr. Jane"
FormInput: Last Name, placeholder "Smith"
FormInput: Professional Email, keyboardType email-address, placeholder "dr.smith@clinic.com"
FormInput: Password, secureTextEntry, showPasswordToggle true

Same validation as UserStep1
```

**ExpertStep2.tsx — Credentials:**
```
FormSelect: "Specialty"
  Options: Endocrinologist, Dermatologist, Nutritionist / Dietitian, OB/GYN, Allergist,
  Functional Medicine, Naturopathic Doctor, Gastroenterologist, General Practitioner,
  Pediatrician, Oncologist, Other

FormInput: "License / Credential Number", placeholder "e.g. MD12345678"

Row (2 columns):
  FormSelect: "Years Practice", options: 1-3, 4-8, 9-15, 16-25, 25+
  FormSelect: "Practice Type", options: Private Practice, Hospital, Clinic, Telehealth Only, Academic

FormInput: "Practice or Institution", placeholder "e.g. Northside Medical Center"
```

**ExpertStep3.tsx — Patient Population:**
```
FormSelect: "Monthly Patient Volume"
  Options: Under 50, 50-150, 151-400, 400+

Section label: "Primary Patient Populations"
TagCloud: multi-select
  Tags: Hormonal Conditions, Skin Disorders, Pregnancy, Paediatric, Autoimmune,
        Chronic Disease, Dietary Disorders, Oncology, Fertility, Metabolic
  Store in expertForm.patientPopulations
```

**ExpertStep4.tsx — Clinical Tools:**
```
Section label: "Select Clinical Features" (size 12px, OB.t45, marginBottom 12px)

6 CheckboxItem components:
  "Patient recommendation portal" — checked by default
  "Patient scan history dashboard" — unchecked
  "Compliance gap alerts" — unchecked
  "White-labelled practice version" — unchecked
  "Insurance billing integration" — unchecked
  "Direct in-app patient messaging" — unchecked

Store selected in expertForm.clinicalTools (array of selected labels)

FormInput: "LinkedIn (Optional)", keyboardType url, placeholder "linkedin.com/in/dr-jane-smith"
  marginTop 16px
```

**ExpertStep5.tsx — Professional Plan:**
```
3 ChoiceCard components (single select, default first selected):
  Card 1 (default): emoji 🏥, title "Free 90-Day Clinical Trial"
    subtitle "Full dashboard · No card needed", value "trial"

  Card 2: emoji 🏆, title "Pro Dashboard · $49/mo"
    subtitle "Patient tracking · Compliance reports", value "pro"

  Card 3: emoji 🏢, title "Practice Partnership · Custom"
    subtitle "White-label · Multi-provider", value "enterprise"

Teal urgency bar:
  Teal dot (7px, OB.teal, pulseRing)
  Text: "253 complimentary dashboard spots remaining"
  size 11px, weight 700, color OB.teal
  Background rgba(0,229,200,0.07), border rgba(0,229,200,0.18)

On continue (last step): call submitExpertRegistration() then show AHA screen
```

---

## SECTION 10 — REGISTRATION SUBMISSION

Create lib/onboardingSubmit.ts (NEW file, do not modify any existing lib file):

```typescript
// lib/onboardingSubmit.ts
import { supabase } from './supabase';

export async function submitUserRegistration(
  form: UserFormData
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Supabase auth signup
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          first_name: form.firstName,
          last_name: form.lastName,
          user_type: 'user',
        },
      },
    });

    if (authError) return { success: false, error: authError.message };
    if (!authData.user) return { success: false, error: 'Account creation failed' };

    const userId = authData.user.id;

    // 2. Upsert profile
    await supabase.from('profiles').upsert({
      user_id: userId,
      name: `${form.firstName} ${form.lastName}`,
      email: form.email,
      subscription_tier: form.selectedPlan === 'free' ? 'free' : 'pro',
    });

    // 3. Upsert health profile
    await supabase.from('user_health_profiles').upsert({
      user_id: userId,
      age: form.age ? parseInt(form.age) : null,
      biological_sex: form.sex,
      conditions: form.conditions,
      allergens: form.allergies,
      activity_level: 'moderate',
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function submitExpertRegistration(
  form: ExpertFormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          first_name: form.firstName,
          last_name: form.lastName,
          user_type: 'expert',
        },
      },
    });

    if (authError) return { success: false, error: authError.message };
    if (!authData.user) return { success: false, error: 'Account creation failed' };

    // Insert to specialists table as pending
    await supabase.from('specialists').insert({
      name: `${form.firstName} ${form.lastName}`,
      title: form.specialty,
      specialties: form.patientPopulations,
      bio: '',
      price_per_session: 0,
      is_online_now: false,
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
```

### Error handling during submission:
```
While submitting: show full-screen overlay with TruWellShield animated + "Setting up your guardian..." text
On network error: Alert.alert with retry option
On auth error "User already registered": show "Account exists, signing you in..." then attempt signIn
```

---

## SECTION 11 — AHA SCREEN

Create components/onboarding/AhaScreen.tsx:

### Container:
```
Position: absolute, inset 0, zIndex 300
Background: OB.ink
Entry: opacity 0 → 1, scale 0.95 → 1, duration 600ms, spring (damping 20, stiffness 200)
Triggers megaBurst() on entry (300ms delay after screen appears)
```

### Layout (flexColumn, centered, padding 40px 28px):
```
Mesh overlay (same as splash): radial-gradient gold+teal at corners

Shield section (centered, marginBottom 32px):
  3 orbit pulse rings (using PulseRing):
    Ring 1: 140px, rgba(201,168,76,0.38), delay 0s
    Ring 2: 190px, rgba(0,229,200,0.22), delay 0.6s
    Ring 3: 240px, rgba(201,168,76,0.12), delay 1.2s
    Animation: pulseRing 3s ease-out infinite

  TruWellShield SVG (100px): showCheckmark=true, animated=true (float)

Headline (id: ahaH): "Your Guardian is Active"
  font Clash Display, weight 700, size 34px, lineHeight 1.12, color OB.t100, letterSpacing -0.5px
  "Active" in gold gradient text (or "Activated" for expert path)

Body text (id: ahaP): explanation text
  size 15px, lineHeight 1.8, color OB.t45, maxWidth 340px
  "strong" tags render as color OB.t70, weight 600

  User variant: "You now have 10 free scans ready. Walk into any store. Scan anything.
    Know exactly what you are about to put on or in your body — or give to the people you love.
    Your protection starts right now."

  Expert variant: "Your professional account is under review. Access arrives within 24 hours.
    Your 90-day free trial is live now. Recommend TruWell AI to your first patient today
    and watch what happens."

Stats grid (id: ahaStats): 3-column using StatCard
  User: 10 (gold, "Free scans ready"), 47 (teal, "Databases watching"), ∞ (green, "Products covered")
  Expert: 90 (teal, "Day free trial"), 1,247 (gold, "Expert partners"), ∞ (green, "Patients protected")

Launch button:
  Same as CtaButton but height 62px, fontSize 17px
  User label: "Open My Scanner Now →"
  Expert label: "Access My Dashboard →"
  onPress: megaBurst() + navigate to main app tabs
  Navigate using router.replace('/(tabs)') after 200ms delay

Legal text below button: "No credit card · Cancel anytime · Your data is always yours"
  size 11px, color OB.t20, marginTop 12px
```

---

## SECTION 12 — NAVIGATION INTEGRATION

Update app/(auth)/_layout.tsx — add the welcome screen route ONLY:

```typescript
// Add only this screen to the existing Stack, do not remove or modify any other screen:
<Stack.Screen name="welcome" options={{ headerShown: false, gestureEnabled: false }} />
```

Update app/(auth)/welcome.tsx to be the main container that orchestrates:
1. SplashScreen component
2. OnboardingSlides component (appears after splash)
3. RegistrationWizard overlay
4. AhaScreen overlay

The welcome.tsx screen coordinates these 4 components using the onboardingStore.

After onboarding completion:
```typescript
// Navigate to main app, replacing the auth stack:
router.replace('/(tabs)');
```

Check if onboarding was already completed using AsyncStorage:
```typescript
// Key: 'truwell_onboarding_complete'
// If true: skip directly to login or tabs
// If false: show full onboarding
// Store 'true' after AHA screen completes
```

---

## SECTION 13 — ANIMATION SPECIFICATIONS (EXACT TIMINGS)

All animations must use React Native Reanimated v3. No React Native core Animated API.

```
Splash entry (shield):     scale 0.5→1, opacity 0→1, 900ms, cubic-bezier(0.34,1.56,0.64,1), delay 300ms
Splash entry (wordmark):   translateY 26→0, opacity 0→1, 700ms, cubic-bezier(0.4,0,0.2,1), delay 800ms
Splash entry (loader):     translateY 26→0, opacity 0→1, 500ms, ease, delay 1500ms
Loading bar fill:          width 0→100%, 2400ms, cubic-bezier(0.4,0,0.2,1), delay 1600ms
Splash exit:               opacity 1→0, scale 1→1.06, 700ms, cubic-bezier(0.4,0,0.2,1)
Splash → slides fade-in:   opacity 0→1, 600ms transition

Slide transition:          translateX, 700ms, cubic-bezier(0.83,0,0.17,1) [aggressive ease]
Slide content entry:       translateY 26→0, opacity 0→1, 550ms, cubic-bezier(0.4,0,0.2,1)
  Child stagger: 60, 130, 200, 280, 360ms

Orbit ring spin:           rotate 360deg, linear infinite (see each ring's duration)
Float animation:           translateY 0→-9px→0, 3500ms ease-in-out infinite
Pulse ring:                scale 0.85→1.35, opacity 0.8→0, 3000ms ease-out infinite, repeat
Scan beam:                 translateY top→bottom, 2000ms ease-in-out infinite (with opacity fade in/out at edges)
Breathe (person):          scale 1.0↔1.18, 2500ms ease-in-out infinite

Float variation (chem tags): translateY 0→-9px→0, 3000ms ease-in-out infinite

Tag bounce on select:      scale 1.0→1.03→1.0, 220ms, spring damping 8 stiffness 200
Choice card bounce:        scale 1.0→1.02→1.0, 200ms, spring damping 10 stiffness 200
CTA press:                 scale 1.0→0.97, immediate; scale back 0.97→1.0, 220ms
Button ripple:             width 0→350px, height 0→350px, opacity 1→0, 650ms ease
Burst particle:            translate + scale 1→0 + opacity 1→0, 900-1700ms random per particle

Wizard entry:              translateY screenHeight→0, 500ms, spring damping 26 stiffness 300
Wizard step exit:          translateX 0→-40px, scale 1→0.96, opacity 1→0, 450ms ease
Wizard step enter:         translateX 40px→0, scale 0.96→1, opacity 0→1, 450ms ease

Typewriter:                character by character, 18ms per char
Cursor blink:              opacity 1→0→1, 700ms step infinite (stops after text completes)

AHA entry:                 opacity 0→1, scale 0.95→1, 600ms, spring damping 20 stiffness 200
Count-up animation:        0→target, 1800ms, cubic ease-out (1 - Math.pow(1-t, 3))
Mega burst:                44 particles, 90-290px spread, 1000-1700ms per particle
```

---

## SECTION 14 — HAPTIC FEEDBACK MAP

```
Splash to slides transition:    notificationAsync(Success)
Slide advance (CTA tap):        impactAsync(Medium)
Slide skip:                     impactAsync(Light)
Swipe between slides:           selectionAsync()
Type selection (User/Expert):   impactAsync(Medium) + burst
Tag cloud toggle:               selectionAsync()
Choice card select:             selectionAsync() + bounce
Checkbox toggle:                selectionAsync()
Continue button:                impactAsync(Medium)
Wizard step advance:            impactAsync(Light)
Form validation error:          notificationAsync(Error)
AHA screen appears:             notificationAsync(Success)
Launch button:                  impactAsync(Heavy)
```

---

## SECTION 15 — EDGE CASES AND ERROR HANDLING

```
1. Network offline during submission:
   - Detect with NetInfo or catch fetch error
   - Show: "No internet connection. Please check your connection and try again."
   - Retry button on error overlay

2. User already registered (email exists):
   - Catch Supabase "User already registered" error
   - Show: "An account with this email already exists. Sign in instead?"
   - Two buttons: "Sign In" navigates to login, "Try Different Email" goes back to step 1

3. Interrupted onboarding (app killed mid-flow):
   - onboardingStore data is lost (in-memory only, no persistence)
   - On re-open: check AsyncStorage for 'truwell_onboarding_complete'
   - If not complete: restart from splash
   - Design decision: do NOT persist partial form data for security

4. Splash animation on slow device:
   - If loading bar animation is still playing when 3600ms timer fires, still proceed
   - Do not wait for animation to complete before transitioning

5. Empty tag selection:
   - Health conditions, allergies: no minimum selection required
   - User can proceed with empty selections (all optional)

6. Password requirements not met:
   - Show inline error immediately when user taps Continue
   - Do not show error on every keystroke (only validate on submit)
   - Error: "Password must be at least 8 characters"

7. Swipe gesture conflicts with scrollable wizard steps:
   - Do NOT attach swipe handler to wizard steps
   - Only swipe handler on the onboarding slides container
   - Wizard steps are scrollable vertically

8. AHA screen back button:
   - Disable hardware back button on Android during AHA screen
   - There is no way to go back from AHA — only "Open My Scanner"

9. Plan selection on last wizard step:
   - If user does not tap any plan (default is pre-selected), proceed with default
   - Never show validation error on plan step

10. Expert path: license number format:
    - Accept any string (no format validation)
    - Note: "Credentials are verified by our team within 24 hours"
    - Show this note below the license input field
```

---

## SECTION 16 — ACCESSIBILITY

```
All interactive elements:
  - accessibilityRole: 'button' on all tappable elements
  - accessibilityLabel: descriptive text for screen readers
  - accessibilityHint: what happens on tap
  - accessibilityState: { selected: true/false } for choice cards and tags
  - minimumTouchTarget: 44x44px for all tappable items

Form inputs:
  - accessibilityLabel matches visible label text
  - accessibilityRequired: true for required fields
  - returnKeyType: 'next' except last field which uses 'done'
  - Tapping 'next' moves focus to next input

Text contrast ratios (all must meet WCAG AA):
  - OB.t100 on OB.ink: passes (19.5:1)
  - OB.t70 on OB.ink: passes (13.8:1)
  - OB.t45 on OB.ink: passes (8.7:1)
  - OB.gold on OB.ink: passes (7.2:1)
  - OB.teal on OB.ink: passes (8.4:1)
  - OB.t20 on OB.ink: borderline — do not use for important text
  - OB.t10 on OB.ink: decorative only, never meaningful text

Reduced motion:
  - Check useReducedMotion() from react-native-reanimated
  - If true: skip all decorative animations (float, orbit, pulse)
  - Keep transition animations but reduce to simple opacity changes
  - Never skip functional state changes

Screen size adaptations:
  - All pixel sizes are for 390px wide screen (iPhone 14)
  - Use percentage-based widths for slide visual areas
  - Font sizes: minimum 9px (already enforced by codebase rules)
  - Safe area insets: always respect top and bottom safe areas
```

---

## SECTION 17 — CODE QUALITY STANDARDS

```
1. TypeScript strict mode throughout — no 'any' types
2. All components must be React.memo wrapped
3. All callbacks must be useCallback wrapped
4. All expensive computations must be useMemo wrapped
5. No inline functions in JSX prop positions (extract to useCallback)
6. No hardcoded colors — always use OB.colorName from tokens.ts
7. No hardcoded spacing — use OB.r12, OB.r16, etc. for border radii; use multiples of 4 for padding
8. Component files: max 200 lines, split if larger
9. Naming: components PascalCase, hooks camelCase with 'use' prefix, constants UPPER_SNAKE
10. No console.log statements in production code
11. All async operations wrapped in try/catch
12. All Reanimated worklets must be pure functions (no closures over external state)
13. Clean up Reanimated shared values in useEffect return
14. FlatList (if used for tag clouds): keyExtractor, removeClippedSubviews, maxToRenderPerBatch: 10
```

---

## SECTION 18 — EXECUTION ORDER

Execute in this exact order. Complete and verify each step before proceeding:

```
Step 1:  Create components/onboarding/tokens.ts
Step 2:  Create stores/onboardingStore.ts
Step 3:  Create lib/onboardingSubmit.ts
Step 4:  Create all UI primitives in components/onboarding/ui/ (Section 4)
         Order: OrbitRing → PulseRing → TruWellShield → CtaButton → StatCard →
                FloatingChemTag → ActivityTicker → ProgressBar → TagCloud →
                ChoiceCard → FormInput → FormSelect → CheckboxItem → BurstEffect
Step 5:  Create components/onboarding/SplashScreen.tsx
Step 6:  Create the 5 slide components in components/onboarding/slides/
         Order: Slide1 → Slide2 → Slide3 → Slide4 → Slide5
Step 7:  Create components/onboarding/OnboardingSlides.tsx
Step 8:  Create wizard UI components:
         WizardHeader → ConvoPrompt → RegistrationWizard container
Step 9:  Create all user wizard steps (UserStep1 through UserStep5)
Step 10: Create all expert wizard steps (ExpertStep1 through ExpertStep5)
Step 11: Create components/onboarding/AhaScreen.tsx
Step 12: Update app/(auth)/_layout.tsx (add welcome route ONLY)
Step 13: Create app/(auth)/welcome.tsx (orchestration container)
Step 14: Run npx tsc --noEmit — fix all errors before continuing
Step 15: Run on Android emulator: npx expo run:android
Step 16: Test complete flow end-to-end
Step 17: Fix any runtime issues found
```

---

## SECTION 19 — VERIFICATION CHECKLIST

Before marking implementation complete, test every item:

```
SPLASH
[ ] Shield logo animates in with spring bounce (scale 0.5 → 1)
[ ] Orbit rings rotate continuously
[ ] Loading bar fills over 2.4 seconds
[ ] "INITIALISING GUARDIAN SHIELD" label appears
[ ] Splash exits smoothly after 3.6 seconds with scale fade
[ ] Onboarding slides fade in after splash exits

SLIDES
[ ] All 5 slides are navigable via CTA button
[ ] All 5 slides are swipeable left/right
[ ] Skip button jumps to slide 5
[ ] Progress bar segments advance correctly per slide
[ ] Content animates up with stagger on each slide enter
[ ] Chemical tags float on slide 1
[ ] Live activity ticker shows pills on slide 1
[ ] Phone mockup displays on slide 2 with scan animation
[ ] Person SVG breathes on slide 3
[ ] Count-up numbers animate on slide 4
[ ] FOMO counter decrements on slide 5
[ ] CTA button disabled until type selected on slide 5
[ ] Both user and expert card selection works with burst effect

WIZARD
[ ] Wizard slides up from bottom when CTA tapped
[ ] Back button works between steps
[ ] Step dots update correctly
[ ] AI typewriter effect plays on each step
[ ] Correct wizard path shown for user vs expert
[ ] All form inputs accept and validate input
[ ] Continue button advances steps
[ ] Step transition animation plays correctly
[ ] Form validation shows inline errors in red
[ ] Last step submits to Supabase
[ ] Loading state shown during submission

AHA SCREEN
[ ] Appears after successful submission
[ ] Mega burst confetti fires on entry
[ ] Correct content shown for user vs expert path
[ ] Stats display correctly
[ ] Launch button navigates to main app tabs
[ ] AsyncStorage key set to prevent re-showing onboarding

GENERAL
[ ] No crashes on any step
[ ] No TypeScript errors (npx tsc --noEmit passes)
[ ] No existing app features broken
[ ] Dark background throughout
[ ] All touch targets minimum 44x44px
[ ] Safe area respected top and bottom
[ ] Keyboard does not obscure form inputs (KeyboardAvoidingView)
[ ] Works on both small (5.4") and large (6.7") screen sizes
[ ] expo-haptics fires correctly at mapped points
[ ] No em dashes in any user-facing text
[ ] No hardcoded colors outside tokens.ts
```

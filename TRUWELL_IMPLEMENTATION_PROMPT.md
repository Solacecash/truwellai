# TruWell AI — Complete Production Implementation Prompt
# For: Claude Code in Cursor Terminal
# Platforms: iOS + Android (React Native + Expo)
# Version: 3.0

---

## MISSION

You are implementing a **production-ready update** to the existing TruWell AI mobile application. This is NOT a new project — it is a complete UI/UX overhaul and full-stack feature completion of the current codebase. Update every screen, component, animation, and feature to match the design system below **exactly**, while preserving all existing business logic, data models, and API connections. Nothing currently working must break. All front-end components must connect to real back-end data. The result must be publishable on the Google Play Store and Apple App Store without modification.

Read this entire file before writing a single line of code. Then execute section by section in the order listed.

---

## SECTION 1 — DESIGN SYSTEM

Create `/src/theme/index.ts` as the single source of truth for all design tokens. Every component must consume from this file. No hardcoded hex values anywhere in the codebase.

```typescript
// /src/theme/index.ts

export const darkTheme = {
  bg0: '#020A14',
  bg1: '#0B1929',
  bg2: '#0F2138',
  bg3: '#172A46',
  bg4: '#1E3560',
  border: '#1F3755',
  border2: '#264568',
  text1: '#F0F8FF',
  text2: '#B8D5F0',
  text3: '#5A7FA0',
  text4: '#1E3555',
  teal: '#00E5C8',
  tealDark: '#009A88',
  gold: '#C9A84C',
  goldLight: '#E8C870',
  red: '#FF4C2E',
  purple: '#8B6FFF',
  green: '#00C050',
  amber: '#FF7850',
  surface: '#030E1A',
};

export const lightTheme = {
  bg0: '#F4F8FC',
  bg1: '#FFFFFF',
  bg2: '#EDF3FA',
  bg3: '#DDE9F5',
  bg4: '#CCDDEf',
  border: '#C2D5EA',
  border2: '#AFC5DD',
  text1: '#08111E',
  text2: '#1A3050',
  text3: '#407090',
  text4: '#8AACC8',
  teal: '#006A5E',
  tealDark: '#004E46',
  gold: '#8A6010',
  goldLight: '#A07820',
  red: '#C02010',
  purple: '#5030BB',
  green: '#005A28',
  amber: '#B04010',
  surface: '#EAF1F9',
};

export type Theme = typeof darkTheme;

export const typography = {
  hero:       { fontSize: 32, fontWeight: '900' as const, letterSpacing: -1.5 },
  display:    { fontSize: 26, fontWeight: '900' as const, letterSpacing: -0.7 },
  title:      { fontSize: 22, fontWeight: '900' as const, letterSpacing: -0.5 },
  heading:    { fontSize: 17, fontWeight: '800' as const, letterSpacing: -0.3 },
  subheading: { fontSize: 15, fontWeight: '700' as const, letterSpacing: -0.2 },
  body:       { fontSize: 13, fontWeight: '400' as const, lineHeight: 20 },
  bodyMedium: { fontSize: 13, fontWeight: '600' as const, lineHeight: 20 },
  caption:    { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.2 },
  label:      { fontSize: 10, fontWeight: '800' as const, letterSpacing: 1.0 },
  micro:      { fontSize: 9,  fontWeight: '700' as const, letterSpacing: 0.6 },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };
export const radius  = { sm: 10, md: 14, lg: 18, xl: 22, pill: 50 };
```

Create `/src/theme/ThemeContext.tsx`:

```typescript
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { darkTheme, lightTheme, Theme } from './index';

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: darkTheme,
  isDark: true,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync('theme_preference').then(val => {
      if (val !== null) setIsDark(val === 'dark');
      else setIsDark(systemScheme === 'dark');
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      SecureStore.setItemAsync('theme_preference', next ? 'dark' : 'light');
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: isDark ? darkTheme : lightTheme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

---

## SECTION 2 — PACKAGE INSTALLATION

Run these commands in the terminal before writing any component code:

```bash
npx expo install react-native-reanimated moti react-native-gesture-handler
npx expo install expo-haptics expo-linear-gradient
npx expo install @supabase/supabase-js stripe-react-native
npx expo install expo-camera expo-barcode-scanner expo-image-picker
npx expo install @react-native-async-storage/async-storage
npx expo install react-native-svg
npx expo install expo-secure-store expo-notifications
npx expo install react-native-safe-area-context react-native-screens
npx expo install expo-image expo-sharing
npx expo install @tanstack/react-query
npx expo install zustand
npx expo install expo-in-app-purchases
```

---

## SECTION 3 — PROJECT FILE STRUCTURE

Create this exact directory and file structure. Create empty files first, then fill them in the order listed in Section 11:

```
app/
  _layout.tsx
  (auth)/
    _layout.tsx
    welcome.tsx
    login.tsx
    register.tsx
    onboarding/
      health-profile.tsx
      preferences.tsx
      notifications.tsx
  (tabs)/
    _layout.tsx
    home/
      index.tsx
    scan/
      index.tsx
      result.tsx
    wellness/
      index.tsx
    safecircle/
      index.tsx
    profile/
      index.tsx
  ai-chat/
    index.tsx
  telehealth/
    index.tsx
    [id].tsx
    history.tsx
  review/
    new.tsx
  ingredient/
    [id].tsx
    search.tsx
  settings/
    index.tsx
    health-profile.tsx
    notifications.tsx
    privacy.tsx
    subscription.tsx

src/
  theme/
    index.ts
    ThemeContext.tsx
  components/
    SegmentedIndicator.tsx
    RingChart.tsx
    GradeCard.tsx
    Card.tsx
    SpecialistCard.tsx
    ScanResultCard.tsx
    AIMessageBubble.tsx
    SpecialistRecommendationCard.tsx
    TypingIndicator.tsx
    IngredientRow.tsx
    WaterCupGrid.tsx
    BreathingCircle.tsx
    StarRating.tsx
    AlertBanner.tsx
    BackHeader.tsx
    TabBar.tsx
    SkeletonLoader.tsx
    BadgeCard.tsx
    ReviewCard.tsx
    FeedCard.tsx
  hooks/
    useAuth.ts
    useTheme.ts
    useWellness.ts
    useScanner.ts
    useAI.ts
    useSpecialists.ts
    useReviews.ts
  lib/
    supabase.ts
    stripe.ts
    anthropic.ts
    scoring.ts
    notifications.ts
  store/
    authStore.ts
    wellnessStore.ts
    scanStore.ts
    uiStore.ts
  types/
    index.ts

supabase/
  functions/
    ai-health-assistant/
      index.ts
    scan-ingredient-analysis/
      index.ts
    process-payment/
      index.ts
    award-guardian-points/
      index.ts
    send-notification/
      index.ts
    reset-daily-wellness/
      index.ts
```

---

## SECTION 4 — TYPE DEFINITIONS

Create `/src/types/index.ts` with all shared TypeScript types:

```typescript
export type Grade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
export type SubscriptionTier = 'free' | 'pro';
export type RiskLevel = 'safe' | 'moderate' | 'avoid';
export type BreathingPattern = 'box' | '4-7-8' | 'wim-hof';
export type BreathingPhase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'hold2';

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url?: string;
  member_since: string;
  subscription_tier: SubscriptionTier;
}

export interface UserHealthProfile {
  id: string;
  user_id: string;
  age?: number;
  biological_sex?: string;
  conditions: string[];
  allergens: string[];
  excluded_ingredients: string[];
  dietary_restrictions: string[];
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';
}

export interface Ingredient {
  id: string;
  name: string;
  aliases: string[];
  safety_rating: RiskLevel;
  ewg_score?: number;
  fda_status: string;
  eu_status: string;
  is_eu_banned: boolean;
  risk_category: string;
  description: string;
}

export interface Product {
  id: string;
  barcode: string;
  product_name: string;
  brand: string;
  category: string;
  ingredients_raw_text: string;
  ingredients: Ingredient[];
  image_url?: string;
}

export interface ScanResult {
  id: string;
  user_id: string;
  product: Product;
  overall_score: number;
  overall_grade: Grade;
  skin_safety_pct: number;
  ingredient_purity_pct: number;
  allergen_risk_pct: number;
  personalized_risk_flags: string[];
  scanned_at: string;
}

export interface UserScore {
  overall_score: number;
  overall_grade: Grade;
  skin_safety_pct: number;
  ingredient_purity_pct: number;
  allergen_risk_pct: number;
  score_delta_7d: number;
}

export interface Specialist {
  id: string;
  name: string;
  title: string;
  specialties: string[];
  rating: number;
  review_count: number;
  price_per_session: number;
  next_available: string;
  avatar_url?: string;
  bio: string;
  languages: string[];
  is_online_now: boolean;
  stripe_account_id: string;
}

export interface SpecialistSlot {
  id: string;
  specialist_id: string;
  slot_datetime: string;
  duration_minutes: number;
  is_booked: boolean;
}

export interface TelehealthBooking {
  id: string;
  user_id: string;
  specialist_id: string;
  slot_id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  payment_intent_id: string;
  amount_paid: number;
  platform_fee: number;
  created_at: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  specialist_recommendation?: SpecialistRecommendation;
  created_at: string;
}

export interface SpecialistRecommendation {
  specialist_id: string;
  name: string;
  title: string;
  reason: string;
}

export interface UserWellness {
  id: string;
  user_id: string;
  xp_total: number;
  xp_level: number;
  xp_to_next_level: number;
  daily_water_cups: number;
  water_goal: number;
  breathing_sessions_today: number;
  breathing_goal: number;
  calories_consumed: number;
  calorie_target: number;
  current_streak: number;
  last_active_date: string;
  xp_today: number;
}

export interface Meal {
  id: string;
  name: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  ingredient_ids: string[];
  cuisine_type: string;
  prep_time_mins: number;
  image_url?: string;
  is_ingredient_safe?: boolean;
}

export interface MealPlan {
  id: string;
  user_id: string;
  plan_date: string;
  breakfast?: Meal;
  lunch?: Meal;
  dinner?: Meal;
  logged_meals: string[];
}

export interface ProductReview {
  id: string;
  user_id: string;
  product_id: string;
  product?: Product;
  user?: UserProfile;
  rating: number;
  review_text: string;
  tags: string[];
  photo_urls: string[];
  helpful_count: number;
  created_at: string;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  user?: UserProfile;
  content: string;
  product_id?: string;
  product?: Product;
  post_type: 'review' | 'alert' | 'tip' | 'question';
  created_at: string;
}

export interface HarmWatchlistItem {
  id: string;
  product_id: string;
  product?: Product;
  report_type: string;
  report_count: number;
  first_reported_at: string;
  is_verified: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon_emoji: string;
  xp_required: number;
  criteria_type: string;
  earned?: boolean;
  earned_at?: string;
}

export interface GuardianPoints {
  total_points: number;
  rank_position: number;
  level_name: string;
}

export interface UserAlert {
  id: string;
  user_id: string;
  ingredient_id?: string;
  product_id?: string;
  alert_type: 'allergen' | 'eu_ban' | 'pfas' | 'carcinogen' | 'general';
  message: string;
  dismissed: boolean;
  created_at: string;
}
```

---

## SECTION 5 — SUPABASE DATABASE SCHEMA

Run this SQL in the Supabase SQL editor to create all required tables:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  email TEXT NOT NULL,
  member_since TIMESTAMPTZ DEFAULT NOW(),
  subscription_tier TEXT DEFAULT 'free'
);

-- User Health Profiles
CREATE TABLE IF NOT EXISTS user_health_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  age INTEGER,
  biological_sex TEXT,
  conditions TEXT[] DEFAULT '{}',
  allergens TEXT[] DEFAULT '{}',
  excluded_ingredients TEXT[] DEFAULT '{}',
  dietary_restrictions TEXT[] DEFAULT '{}',
  activity_level TEXT DEFAULT 'moderate'
);

-- Ingredients Database
CREATE TABLE IF NOT EXISTS ingredients_database (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}',
  safety_rating TEXT NOT NULL,
  ewg_score INTEGER,
  fda_status TEXT DEFAULT 'unknown',
  eu_status TEXT DEFAULT 'unknown',
  is_eu_banned BOOLEAN DEFAULT FALSE,
  risk_category TEXT,
  description TEXT,
  peer_reviewed_sources TEXT[] DEFAULT '{}'
);

-- Barcode Products
CREATE TABLE IF NOT EXISTS barcode_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barcode TEXT UNIQUE,
  product_name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  ingredients_raw_text TEXT,
  ingredients_parsed_ids UUID[] DEFAULT '{}',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Alternatives
CREATE TABLE IF NOT EXISTS product_alternatives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES barcode_products(id),
  alternative_product_id UUID REFERENCES barcode_products(id),
  reason TEXT,
  score_improvement INTEGER
);

-- Scan History
CREATE TABLE IF NOT EXISTS scan_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES barcode_products(id),
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  overall_score INTEGER,
  overall_grade TEXT,
  skin_safety_pct INTEGER,
  ingredient_purity_pct INTEGER,
  allergen_risk_pct INTEGER,
  personalized_risk_flags TEXT[] DEFAULT '{}'
);

-- User Scores
CREATE TABLE IF NOT EXISTS user_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  overall_score INTEGER DEFAULT 0,
  overall_grade TEXT DEFAULT 'B',
  skin_safety_pct INTEGER DEFAULT 0,
  ingredient_purity_pct INTEGER DEFAULT 0,
  allergen_risk_pct INTEGER DEFAULT 0,
  score_delta_7d INTEGER DEFAULT 0,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Alerts
CREATE TABLE IF NOT EXISTS user_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients_database(id),
  product_id UUID REFERENCES barcode_products(id),
  alert_type TEXT,
  message TEXT NOT NULL,
  dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Wellness
CREATE TABLE IF NOT EXISTS user_wellness (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  xp_total INTEGER DEFAULT 0,
  xp_level INTEGER DEFAULT 1,
  xp_to_next_level INTEGER DEFAULT 1750,
  daily_water_cups INTEGER DEFAULT 0,
  water_goal INTEGER DEFAULT 8,
  breathing_sessions_today INTEGER DEFAULT 0,
  breathing_goal INTEGER DEFAULT 3,
  calories_consumed INTEGER DEFAULT 0,
  calorie_target INTEGER DEFAULT 2200,
  current_streak INTEGER DEFAULT 0,
  last_active_date DATE,
  xp_today INTEGER DEFAULT 0
);

-- Breathing Sessions
CREATE TABLE IF NOT EXISTS breathing_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL,
  duration_seconds INTEGER,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meals
CREATE TABLE IF NOT EXISTS meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  calories INTEGER,
  ingredient_ids UUID[] DEFAULT '{}',
  cuisine_type TEXT,
  prep_time_mins INTEGER,
  image_url TEXT
);

-- Meal Plans
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  breakfast_meal_id UUID REFERENCES meals(id),
  lunch_meal_id UUID REFERENCES meals(id),
  dinner_meal_id UUID REFERENCES meals(id),
  logged_meals TEXT[] DEFAULT '{}',
  UNIQUE(user_id, plan_date)
);

-- Specialists
CREATE TABLE IF NOT EXISTS specialists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  specialties TEXT[] DEFAULT '{}',
  rating NUMERIC(3,2) DEFAULT 4.5,
  review_count INTEGER DEFAULT 0,
  price_per_session INTEGER NOT NULL,
  next_available TIMESTAMPTZ,
  avatar_url TEXT,
  bio TEXT,
  languages TEXT[] DEFAULT '{English}',
  is_online_now BOOLEAN DEFAULT FALSE,
  stripe_account_id TEXT
);

-- Specialist Availability
CREATE TABLE IF NOT EXISTS specialist_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  specialist_id UUID REFERENCES specialists(id),
  slot_datetime TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  is_booked BOOLEAN DEFAULT FALSE
);

-- Telehealth Bookings
CREATE TABLE IF NOT EXISTS telehealth_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  specialist_id UUID REFERENCES specialists(id),
  slot_id UUID REFERENCES specialist_availability(id),
  status TEXT DEFAULT 'pending',
  payment_intent_id TEXT,
  amount_paid INTEGER,
  platform_fee INTEGER,
  session_type TEXT DEFAULT 'video',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Reviews
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES barcode_products(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  photo_urls TEXT[] DEFAULT '{}',
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community Posts
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  product_id UUID REFERENCES barcode_products(id),
  post_type TEXT DEFAULT 'tip',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Harm Watchlist
CREATE TABLE IF NOT EXISTS harm_watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES barcode_products(id),
  report_type TEXT NOT NULL,
  report_count INTEGER DEFAULT 1,
  first_reported_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT FALSE
);

-- Guardian Points
CREATE TABLE IF NOT EXISTS guardian_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_points INTEGER DEFAULT 0,
  rank_position INTEGER
);

-- Badges
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon_emoji TEXT,
  xp_required INTEGER DEFAULT 0,
  criteria_type TEXT,
  criteria_value INTEGER
);

-- User Badges
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- AI Conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  tier TEXT DEFAULT 'free',
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  status TEXT DEFAULT 'active'
);

-- User Devices (push tokens)
CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  push_token TEXT NOT NULL,
  platform TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, push_token)
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_health_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wellness ENABLE ROW LEVEL SECURITY;
ALTER TABLE breathing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE telehealth_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES (user can only access their own data)
CREATE POLICY "users_own_profile" ON profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_health" ON user_health_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_scans" ON scan_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_scores" ON user_scores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_alerts" ON user_alerts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_wellness" ON user_wellness FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_breathing" ON breathing_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_meal_plans" ON meal_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_reviews" ON product_reviews FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_posts" ON community_posts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_points" ON guardian_points FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_badges" ON user_badges FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_conversations" ON ai_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_subscriptions" ON subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_bookings" ON telehealth_bookings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_devices" ON user_devices FOR ALL USING (auth.uid() = user_id);

-- PUBLIC READ POLICIES
CREATE POLICY "public_read_ingredients" ON ingredients_database FOR SELECT USING (true);
CREATE POLICY "public_read_products" ON barcode_products FOR SELECT USING (true);
CREATE POLICY "public_read_specialists" ON specialists FOR SELECT USING (true);
CREATE POLICY "public_read_badges" ON badges FOR SELECT USING (true);
CREATE POLICY "public_read_watchlist" ON harm_watchlist FOR SELECT USING (true);
CREATE POLICY "public_read_reviews" ON product_reviews FOR SELECT USING (true);
CREATE POLICY "public_read_posts" ON community_posts FOR SELECT USING (true);
CREATE POLICY "public_read_availability" ON specialist_availability FOR SELECT USING (true);
CREATE POLICY "public_read_meals" ON meals FOR SELECT USING (true);
```

---

## SECTION 6 — ENVIRONMENT VARIABLES

Create `.env` in the project root with this structure (fill in your real values):

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
EXPO_PUBLIC_APP_ENV=development
```

Add `.env` to `.gitignore` immediately.

---

## SECTION 7 — CORE LIBRARY FILES

### `/src/lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: { params: { eventsPerSecond: 10 } },
});
```

### `/src/lib/scoring.ts`
Implement the ingredient scoring algorithm:
- Input: `ingredients: Ingredient[]`, `userHealthProfile: UserHealthProfile`
- Output: `{ score: number, grade: Grade, skinSafetyPct: number, ingredientPurityPct: number, allergenRiskPct: number, riskFlags: string[] }`
- Score calculation:
  - Base score = 100
  - For each ingredient rated "avoid": subtract 15 points
  - For each ingredient rated "moderate": subtract 5 points
  - For each EU-banned ingredient: subtract 20 points
  - For each ingredient matching user allergens: subtract 25 points and add to riskFlags
  - Minimum score = 0
  - skinSafetyPct = (safe skin ingredients / total) * 100
  - ingredientPurityPct = (safe or moderate ingredients / total) * 100
  - allergenRiskPct = 100 - (allergen matches / total * 100), min 0
- Grade: A+=95-100, A=85-94, B=70-84, C=55-69, D=40-54, F=0-39

---

## SECTION 8 — SHARED COMPONENTS

### `/src/components/SegmentedIndicator.tsx`

Implement with these exact specifications:
- Props: `{ value: number; count?: number; color: string; height?: number; gap?: number; animated?: boolean; style?: ViewStyle }`
- Renders `count` (default 10) small rounded rectangles in a row
- Each segment: `flex: 1`, height = `height` prop (default 5), `borderRadius: 3`
- Filled count = `Math.round(value / 100 * count)`
- Filled background = `color` prop
- Empty background = `theme.bg3`
- Gap between segments: `gap` prop (default 2)
- Use Reanimated `useSharedValue` for each segment's `scaleX`, animated from 0 to 1 on mount with `withDelay(index * 40, withSpring(1, { damping: 14, stiffness: 200 }))`
- When `animated` is false: render immediately without animation
- Must expose a `triggerAnimation()` imperative ref method for parent screens to re-trigger on tab focus

### `/src/components/RingChart.tsx`

Implement with these exact specifications:
- Props: `{ value: number; size?: number; strokeWidth?: number; color?: string; backgroundStrokeColor?: string; children?: React.ReactNode }`
- Default size: 100, default strokeWidth: 10
- Uses `react-native-svg` `Svg`, `Circle`
- Circumference = `2 * Math.PI * radius` where radius = `(size - strokeWidth) / 2`
- strokeDasharray = circumference
- strokeDashoffset = circumference - (value / 100 * circumference)
- Background circle: `theme.bg3`, full stroke
- Progress circle: `color` prop (default `theme.teal`), strokeLinecap="round", transform rotate -90deg
- Animated on mount: Reanimated `useSharedValue` starting at circumference, animating to target offset over 2000ms with Easing.bezier(0.4, 0, 0.2, 1)
- Children rendered absolutely centered

### `/src/components/TabBar.tsx`

Implement the custom bottom tab bar:
- Receives `state`, `descriptors`, `navigation` from React Navigation
- Background: `theme.bg1`, `1px solid theme.border` top border
- Bottom padding: `insets.bottom + 8` using `useSafeAreaInsets()`
- 5 tabs equally spaced using flexbox
- Each tab item:
  - `TouchableOpacity` with Reanimated scale animation on press (0.90, spring)
  - `expo-haptics.impactAsync(ImpactFeedbackStyle.Light)` on every press
  - Vertical flex column: icon (22x22) above label (8px, 800 weight, uppercase, 0.6px tracking)
  - Active: pill background behind entire item (icon + label), `border-radius: 18`, `color-mix(teal 10%, transparent)` — implemented as `rgba` with 10% opacity of teal color, full-width of content
  - Active icon: stroke/fill = `theme.teal`
  - Active label: color = `theme.teal`
  - Inactive: transparent background, icon and label = `theme.text3`
- Tab icons (all implemented as inline `react-native-svg` SVG):
  - Home: house outline path (M3 12L12 3l9 9M5 10v9h4v-5h4v5h4v-9)
  - Scan: barcode grid (two 6x6 boxes top, one 6x6 box bottom-left, plus sign bottom-right)
  - Wellness: heart outline (M12 21C12 21 3 13.5 3 8a5 5 0 0110 0 5 5 0 0110 0c0 5.5-9 13-9 13z)
  - SafeCircle: people group (two overlapping person silhouettes)
  - Profile: single person silhouette (circle for head, arc for shoulders)

### `/src/components/BreathingCircle.tsx`

- Props: `{ pattern: BreathingPattern; onComplete: () => void }`
- 74x74 circle, `border-radius: 50%`
- Background: `color-mix(purple 10%, bg2)`, border: `2px solid color-mix(purple 28%, transparent)`
- Lung emoji centered (26px)
- Animation: Reanimated `useSharedValue` for scale
  - Box (4-4-4-4): inhale 4s (scale 1.0 to 1.28), hold 4s (scale 1.28), exhale 4s (scale 1.28 to 1.0), hold 4s (scale 1.0)
  - 4-7-8: inhale 4s, hold 7s, exhale 8s
  - Wim Hof: 30 quick inhales then exhale
- Phase label and countdown shown below circle
- Sessions logged to `breathing_sessions` table on complete
- +10 XP awarded via `award-guardian-points` Edge Function

### `/src/components/WaterCupGrid.tsx`

- 8 cups in a row using `FlatList` horizontal or flexbox wrap
- Each cup: height 24, `border-radius: 7`, transition background on press
- Filled: `theme.teal` background, `color-mix(teal 30%, border)` border
- Empty: `theme.bg2` background, `theme.border` border
- Tap: toggle filled state, `expo-haptics.selectionAsync()`, update Supabase `user_wellness.daily_water_cups`

### `/src/components/StarRating.tsx`

- 5 star characters rendered as `Text` components (or SVG stars)
- Size prop (default 36)
- Selected stars: `theme.gold`
- Unselected stars: `theme.border`
- On tap: update rating, spring scale animation (1.0 to 1.25 to 1.0), `expo-haptics.selectionAsync()`
- Readonly mode: no touch handler

### `/src/components/AIMessageBubble.tsx`

- Renders `Message` object
- User bubble: `theme.teal` background, `theme.bg0` text, border-radius `[18, 18, 5, 18]` (topLeft, topRight, bottomRight, bottomLeft)
- AI bubble: `theme.bg2` background, `theme.text2` text, `1px theme.border`, border-radius `[18, 18, 18, 5]`
- 30x30 avatar circle: user shows initials in teal; AI shows "AI" in purple
- When `message.specialist_recommendation` exists, render `SpecialistRecommendationCard` below bubble content

### `/src/components/SpecialistRecommendationCard.tsx`

- Rounded card inside AI message bubble
- Shows: avatar circle (42x42, specialist initials, color-tinted border), name, title, availability
- Bottom section separated by border: disclaimer text
- Disclaimer EXACT TEXT: "This is educational information only. Consult [Doctor Full Name] for medical advice."
- "[Doctor Full Name]" must be a `TouchableOpacity` that navigates to `telehealth/[specialist_id]`
- The navigation must use Expo Router `router.push('/telehealth/' + specialist.specialist_id)`

### `/src/components/TypingIndicator.tsx`

- Three dots (7x7 circles each, `theme.text3`)
- Gap: 6px between dots
- Each dot: Reanimated scale animation `withRepeat(withSequence(withTiming(0, 300ms), withTiming(1, 300ms)), -1)` with delays: 0ms, 200ms, 400ms

### `/src/components/BackHeader.tsx`

- Props: `{ title: string; onBack: () => void; rightContent?: React.ReactNode }`
- Height: 52px, horizontal padding 18px
- Left: back arrow SVG (20x20, `theme.teal`) + "Back" text (15px, 700, `theme.teal`) in a `TouchableOpacity`
- Center: title text (17px, 800, `theme.text1`)
- Right: `rightContent` or empty 70px spacer
- Bottom border: `1px theme.border`
- Background: `theme.bg0`

### `/src/components/SkeletonLoader.tsx`

- Props: `{ width: number | string; height: number; borderRadius?: number; style?: ViewStyle }`
- Animated shimmer effect using Reanimated `withRepeat(withTiming(1, 1200ms), -1, true)` interpolating background opacity between `theme.bg2` and `theme.bg3`

---

## SECTION 9 — SCREEN IMPLEMENTATIONS

### HOME SCREEN (`app/(tabs)/home/index.tsx`)

Data fetching (use `@tanstack/react-query` for all data):
1. `useQuery(['user-score', userId])` — fetch from `user_scores` where `user_id = auth.uid()`
2. `useQuery(['recent-scans', userId])` — fetch 3 from `scan_history` JOIN `barcode_products` ORDER BY `scanned_at DESC`
3. `useQuery(['user-alert', userId])` — fetch from `user_alerts` WHERE `dismissed = false AND user_id = auth.uid()` LIMIT 1
4. `useQuery(['specialists-preview'])` — fetch 4 from `specialists` ORDER BY `rating DESC`
5. `useQuery(['user-wellness', userId])` — fetch from `user_wellness` WHERE `user_id = auth.uid()`

Supabase Realtime: subscribe to `user_alerts` and `user_scores` channels for current user. On new row inserted: invalidate respective query cache.

Layout implementation (ScrollView, `showsVerticalScrollIndicator: false`):

```
1. Header row (logo + greeting)
2. Health Guard Score Card (RingChart + 3-column metrics grid)
3. Alert Banner (conditional, dismissable — tapping dismiss updates user_alerts.dismissed = true)
4. Quick Actions Grid (4 buttons: Scan, AI Chat, Telehealth, SafeCircle)
5. Telehealth Specialists horizontal FlatList
6. Streak Card (fire animation)
7. Recent Scans list (3 ScanResultCard items with Ask AI buttons)
```

Loading state: Show `SkeletonLoader` for score card, specialists row, and scan items while data loads.

Error state: Show inline error message with retry button.

Pull to refresh: `RefreshControl` invalidates all queries.

Greeting: Compute from `new Date().getHours()`: 5-11 = "Good morning", 12-16 = "Good afternoon", 17-20 = "Good evening", 21-4 = "Good night"

### SCAN SCREEN (`app/(tabs)/scan/index.tsx`)

Camera implementation:
- Request `expo-camera` permissions on screen focus
- Show permission request UI if not granted
- `expo-barcode-scanner` onBarcodeScanned callback:
  1. `expo-haptics.notificationAsync(NotificationFeedbackType.Success)`
  2. Pause scanning (prevent duplicate scans)
  3. Call `scanProduct(barcode)` function
  4. Navigate to `scan/result` with scan data

`scanProduct(barcode)` function:
1. Query Supabase `barcode_products` WHERE `barcode = barcode`
2. If not found: call Open Food Facts API `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
3. Parse ingredients from response
4. Call Supabase Edge Function `scan-ingredient-analysis` with ingredient names + user health profile
5. Save result to `scan_history`
6. Return complete `ScanResult` object

Upload flow: `expo-image-picker` opens photo library, selected image sent to Supabase Edge Function for OCR using Google Vision API, returns extracted ingredient text.

### SCAN RESULT SCREEN (`app/(tabs)/scan/result.tsx`)

Receives `ScanResult` via router params.

Layout:
1. BackHeader
2. Product hero card: large `GradeCard` (grade + score), product name, brand, category
3. `SegmentedIndicator` (12 segments) for overall score
4. Personalized Alert section (if `personalized_risk_flags.length > 0`)
5. Ingredient Breakdown: `FlatList` of `IngredientRow` (expandable accordion)
6. "Ask AI about these ingredients" purple pill button → `ai-chat/` with product context
7. Smart Alternatives horizontal `FlatList` from `product_alternatives`
8. Telehealth CTA card (if grade D or F) with `SpecialistRecommendationCard` (inline, not in AI bubble)
9. Action buttons: Add to Safe List / Add to Avoid List / Write Review / Share

### WELLNESS SCREEN (`app/(tabs)/wellness/index.tsx`)

Use `useFocusEffect` (from `@react-navigation/native`) to re-trigger all `SegmentedIndicator` animations every time the tab gains focus.

Data:
- `useQuery(['wellness', userId])` — `user_wellness` table
- `useQuery(['meal-plan', userId, today])` — `meal_plans` JOIN `meals` for today's date

Realtime: Subscribe to `user_wellness` channel. On UPDATE: refetch and re-animate segments.

XP level up: When `xp_total` crosses a level threshold:
- Show full-screen celebration overlay (Reanimated animated confetti using SVG circles and rectangles falling from top)
- `expo-haptics.notificationAsync(NotificationFeedbackType.Success)`
- Auto-dismiss after 3 seconds

Meal logging: "Check" button on each meal row → UPDATE `meal_plans.logged_meals` array → add meal to array → increment `user_wellness.calories_consumed` by meal calories → award +15 XP.

Water cups: Each cup tap → UPDATE `user_wellness.daily_water_cups` → if first time filling that cup position, award +5 XP.

Breathing session start: Show full-screen breathing mode with large animated circle, phase labels, countdown timer, and stop/complete controls.

### SAFECIRCLE SCREEN (`app/(tabs)/safecircle/index.tsx`)

Data:
- `useQuery(['guardian-points', userId])` — `guardian_points` table
- `useQuery(['user-badges', userId])` — `badges` LEFT JOIN `user_badges`
- `useQuery(['product-reviews'])` — `product_reviews` JOIN `profiles` JOIN `barcode_products` ORDER BY `created_at DESC` LIMIT 20
- `useQuery(['community-posts'])` — `community_posts` JOIN `profiles` JOIN `barcode_products` ORDER BY `created_at DESC` LIMIT 20
- `useQuery(['harm-watchlist'])` — `harm_watchlist` JOIN `barcode_products` WHERE `is_verified = true` ORDER BY `report_count DESC` LIMIT 5
- `useQuery(['new-watchlist-count', userId])` — count of items since user's last visit

Realtime: Subscribe to `community_posts` and `product_reviews` channels. On INSERT: prepend new item to list with fade-in animation.

Helpful button: `expo-haptics.selectionAsync()` + UPDATE `product_reviews.helpful_count = helpful_count + 1`.

### PROFILE SCREEN (`app/(tabs)/profile/index.tsx`)

Data:
- `useQuery(['profile', userId])` — `profiles` table
- `useQuery(['health-profile', userId])` — `user_health_profiles` table
- `useQuery(['subscription', userId])` — `subscriptions` table

Avatar: If `avatar_url` exists, load via `expo-image` with `contentFit: 'cover'`. If not, show initials in gold gradient circle.

Settings navigation items: Each row uses `router.push()` to navigate to the appropriate settings screen.

Smart Alerts toggle: `Switch` component (React Native built-in) styled to match design. On toggle: UPDATE a `user_preferences` table field `smart_alerts_enabled`.

### AI CHAT SCREEN (`app/ai-chat/index.tsx`)

System prompt for Claude API (sent as `system` role in Edge Function):
```
You are the TruWell AI Health Assistant. You provide clear, research-backed educational information about ingredient safety, product ratings, and general health and wellness topics. You are NOT a doctor and do NOT provide medical advice or diagnoses. Always clarify this clearly. When a user asks something that requires personalized medical guidance, recommend the most appropriate specialist from our telehealth network. When recommending a specialist, include this EXACT JSON at the end of your response: {"specialist_recommendation": {"specialist_id": "UUID", "name": "Full Name", "title": "Title", "reason": "Brief reason"}}. Keep responses under 400 words. Never recommend specific medications or treatments. Always end responses about health concerns with a disclaimer.
```

Message flow:
1. User types message, taps send
2. `expo-haptics.impactAsync(ImpactFeedbackStyle.Medium)`
3. Add user message to local state immediately (optimistic update)
4. Show `TypingIndicator`
5. Call Supabase Edge Function `ai-health-assistant` with full message history + user health profile
6. Parse JSON response: extract text content + optional `specialist_recommendation`
7. Remove `TypingIndicator`, add AI message bubble
8. If `specialist_recommendation` in response: render `SpecialistRecommendationCard` in bubble
9. Save updated conversation to `ai_conversations` table

Context pre-population: Check router params for `productName` and `ingredientName`. If present, send initial message automatically: `"Please explain the ingredient [ingredientName] found in [productName] and why it was flagged for my health profile."`

Rate limiting: Track request count in `uiStore`. Free tier: block after 20/hour with upgrade prompt. Pro: 100/hour.

### TELEHEALTH SCREEN (`app/telehealth/index.tsx`)

Data:
- `useQuery(['specialists', { category, search }])` — `specialists` table with optional filters
- Filter by `specialties @> [category]` when category selected
- Search: `name ILIKE '%search%' OR title ILIKE '%search%'`

Category pills: fetch from `specialist_categories` table or use static list: All, Dermatology, Nutrition, Allergy, General Practice, Cardiology, Mental Health.

Sort options: Bottom sheet modal with "Highest Rated", "Price: Low to High", "Price: High to Low", "Available Now".

### SPECIALIST PROFILE AND BOOKING SCREEN (`app/telehealth/[id].tsx`)

Data:
- `useQuery(['specialist', id])` — specialist by ID
- `useQuery(['specialist-slots', id])` — `specialist_availability` WHERE `specialist_id = id AND slot_datetime > NOW() AND is_booked = false` ORDER BY `slot_datetime`

Booking flow:
1. User selects time slot (state: `selectedSlotId`)
2. Taps "Book Session, $[price]"
3. Call Supabase Edge Function `process-payment` → returns Stripe `clientSecret`
4. Open Stripe `useStripe().presentPaymentSheet()` with client secret
5. On payment success:
   - INSERT to `telehealth_bookings` (status: 'confirmed')
   - UPDATE `specialist_availability.is_booked = true` for selected slot
   - Call `award-guardian-points` Edge Function (+50 points)
   - Send push notification via `send-notification` Edge Function
   - Navigate back to telehealth list with success toast
6. On payment failure: show error alert, allow retry

### WRITE REVIEW SCREEN (`app/review/new.tsx`)

Data:
- `useQuery(['user-scans', userId])` — recent 20 scans for product selector

Submission:
1. Validate: `starRating >= 1` AND `reviewText.length >= 20`
2. If photos selected: upload to Supabase Storage bucket `review-photos` via `supabase.storage.from('review-photos').upload(...)`
3. INSERT to `product_reviews` with all fields
4. Call `award-guardian-points` Edge Function (+25 points)
5. Show success animation (spring scale checkmark + "You earned 25 Guardian Points")
6. Auto-navigate back after 2.6 seconds

---

## SECTION 10 — SUPABASE EDGE FUNCTIONS

### `supabase/functions/ai-health-assistant/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Anthropic from 'npm:@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

serve(async (req) => {
  const { messages, user_health_profile, product_context } = await req.json();

  const systemPrompt = `You are the TruWell AI Health Assistant. You provide clear, research-backed educational information about ingredient safety, product ratings, and general health and wellness topics. You are NOT a doctor and do NOT provide medical advice or diagnoses. Always clarify this. When a user's question requires personalized medical guidance, recommend the most appropriate specialist. Include specialist recommendations in this exact JSON format at the end of your response: {"specialist_recommendation": {"specialist_id": "s1", "name": "Dr. Sarah Mitchell", "title": "Dermatologist", "reason": "brief reason"}}. User health profile: ${JSON.stringify(user_health_profile)}. ${product_context ? `Current product context: ${JSON.stringify(product_context)}` : ''} Keep responses under 400 words. Never recommend specific medications. End health concern responses with a disclaimer.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  let specialist_recommendation = null;
  const jsonMatch = text.match(/\{"specialist_recommendation":\s*\{[^}]+\}\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      specialist_recommendation = parsed.specialist_recommendation;
    } catch {}
  }

  const cleanText = text.replace(/\{"specialist_recommendation":\s*\{[^}]+\}\}/g, '').trim();

  return new Response(JSON.stringify({ text: cleanText, specialist_recommendation }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
});
```

### `supabase/functions/process-payment/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);

serve(async (req) => {
  const { specialist_id, slot_id, user_id, amount_cents } = await req.json();

  const platformFee = Math.round(amount_cents * 0.15);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount_cents,
    currency: 'usd',
    metadata: { specialist_id, slot_id, user_id, platform_fee: platformFee.toString() },
    application_fee_amount: platformFee,
  });

  return new Response(JSON.stringify({ clientSecret: paymentIntent.client_secret }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
});
```

### `supabase/functions/award-guardian-points/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js';

serve(async (req) => {
  const { user_id, points, reason } = await req.json();
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: existing } = await supabase.from('guardian_points').select('total_points').eq('user_id', user_id).single();
  const newTotal = (existing?.total_points ?? 0) + points;

  await supabase.from('guardian_points').upsert({ user_id, total_points: newTotal }, { onConflict: 'user_id' });
  await supabase.from('user_wellness').update({ xp_total: supabase.rpc('increment_xp', { row_id: user_id, amount: points }) }).eq('user_id', user_id);

  return new Response(JSON.stringify({ success: true, new_total: newTotal }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
});
```

### `supabase/functions/scan-ingredient-analysis/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js';

serve(async (req) => {
  const { ingredient_names, user_health_profile } = await req.json();
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: ingredients } = await supabase
    .from('ingredients_database')
    .select('*')
    .or(ingredient_names.map((n: string) => `name.ilike.${n},aliases.cs.{${n}}`).join(','));

  let score = 100;
  const riskFlags: string[] = [];
  let safeSkinCount = 0;
  let safeOrModerateCount = 0;
  let allergenMatchCount = 0;
  const total = ingredients?.length ?? 1;

  for (const ing of ingredients ?? []) {
    if (ing.safety_rating === 'avoid') score -= 15;
    else if (ing.safety_rating === 'moderate') score -= 5;
    if (ing.is_eu_banned) score -= 20;
    if (ing.safety_rating === 'safe') { safeSkinCount++; safeOrModerateCount++; }
    if (ing.safety_rating === 'moderate') safeOrModerateCount++;
    if (user_health_profile?.allergens?.some((a: string) => ing.aliases?.includes(a.toLowerCase()) || ing.name.toLowerCase().includes(a.toLowerCase()))) {
      score -= 25;
      allergenMatchCount++;
      riskFlags.push(`${ing.name} matches your allergen profile`);
    }
  }

  score = Math.max(0, score);
  const grade = score >= 95 ? 'A+' : score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F';

  return new Response(JSON.stringify({
    score,
    grade,
    skinSafetyPct: Math.round((safeSkinCount / total) * 100),
    ingredientPurityPct: Math.round((safeOrModerateCount / total) * 100),
    allergenRiskPct: Math.max(0, 100 - Math.round((allergenMatchCount / total) * 100)),
    riskFlags,
    ingredients,
  }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
});
```

---

## SECTION 11 — ANIMATION SPECIFICATIONS

Use React Native Reanimated v3 for ALL animations. Never use the React Native core `Animated` API.

Animation constants (create as a shared config):
```typescript
export const springs = {
  default: { damping: 18, stiffness: 200, mass: 0.8 },
  bounce:  { damping: 12, stiffness: 180, mass: 0.6 },
  gentle:  { damping: 25, stiffness: 150, mass: 1.0 },
};

export const timings = {
  fast:    280,
  normal:  400,
  slow:    600,
  ring:    2000,
  water:   2200,
};
```

Required animations per screen:

HOME:
- Score ring: `strokeDashoffset` from circumference to target, 2000ms, Easing.bezier(0.4, 0, 0.2, 1), triggers on screen focus
- SegmentedIndicators: cascade animation on screen focus
- Alert dot: opacity oscillates 0.7 to 1.0, 2s repeat
- Streak fire: rotation -2deg to 2deg, 1.6s repeat
- Card press: scale to 0.93 spring, scale back on release

SCAN:
- Scan line: `translateY` 0 to container height, 2.2s ease-in-out, infinite loop
- Outer ring: scale 1.0 to 1.06, 2.5s ease-in-out, infinite loop
- Screen entry: slide up from bottom, opacity 0 to 1

WELLNESS:
- XP segments: cascade on tab focus, gold colors
- Water fill: height 0% to target%, 2200ms, on tab focus
- Breathing circle: scale per phase timing using `withSequence` and `withTiming`
- XP level-up: confetti overlay using Reanimated `useSharedValue` arrays for Y position and rotation of SVG circles

SAFECIRCLE:
- Badges: scale from 0 to 1 with cascade delay (80ms per badge), spring bounce
- Feed items: fade-up on mount and when new items arrive via Realtime

AI CHAT:
- Messages slide in: translateX 20 + opacity 0 to 0 + 1 on each new bubble
- Typing dots: independent `withRepeat(withSequence(withTiming(0), withTiming(1)))` per dot with staggered delays
- Overlay screen: slide from right (translateX: screen width to 0)

TELEHEALTH:
- Specialist cards: fade-up staggered on list mount
- Specialist card hover: border color transition, scale 1.0 to 0.98

---

## SECTION 12 — HAPTIC FEEDBACK MAP

Apply `expo-haptics` at these exact points:

```typescript
// Tab press
ImpactFeedbackStyle.Light

// Primary button press (Book Session, Scan Barcode, Submit Review)
ImpactFeedbackStyle.Medium

// Scan barcode success
NotificationFeedbackType.Success

// Star rating tap
selectionAsync()

// Water cup tap
selectionAsync()

// Badge earned
NotificationFeedbackType.Success

// Review submitted
NotificationFeedbackType.Success

// Level up
NotificationFeedbackType.Success

// Alert dismiss
ImpactFeedbackStyle.Light

// Payment success
NotificationFeedbackType.Success

// AI message send
ImpactFeedbackStyle.Medium

// Error / validation fail
NotificationFeedbackType.Error
```

---

## SECTION 13 — PUSH NOTIFICATIONS

### Setup
```typescript
// /src/lib/notifications.ts
import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';

export async function registerForPushNotifications(userId: string) {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await supabase.from('user_devices').upsert({
    user_id: userId,
    push_token: token,
    platform: Platform.OS,
  }, { onConflict: 'user_id,push_token' });
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
```

### Notification Types (implement in `send-notification` Edge Function):
1. Booking confirmed: "Your session with Dr. [Name] is confirmed for [date/time]"
2. Streak at risk: "Do not break your [N]-day streak! Scan a product today." (daily 7pm if no scan)
3. Harm watchlist: "New alert: [Product] in your Safe List has been flagged"
4. Level up: "Congratulations! You reached Guardian Level [N]"
5. Ingredient alert: "A product you saved contains a newly flagged ingredient"

Deep link handlers: All notifications must deep-link to the relevant screen using Expo Router linking configuration.

---

## SECTION 14 — PRODUCTION APP CONFIGURATION

### `app.config.ts`
```typescript
export default {
  expo: {
    name: 'TruWell AI',
    slug: 'truwell-ai',
    version: '3.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: { image: './assets/splash.png', resizeMode: 'contain', backgroundColor: '#020A14' },
    updates: { fallbackToCacheTimeout: 0 },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.truwell.ai',
      buildNumber: '1',
      infoPlist: {
        NSCameraUsageDescription: 'TruWell AI uses your camera to scan product barcodes and ingredient labels.',
        NSPhotoLibraryUsageDescription: 'TruWell AI accesses your photo library to upload product images for ingredient analysis.',
        NSUserNotificationUsageDescription: 'TruWell AI sends you personalized health alerts and booking confirmations.',
      },
    },
    android: {
      package: 'com.truwell.ai',
      versionCode: 1,
      adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: '#020A14' },
      permissions: ['CAMERA', 'READ_EXTERNAL_STORAGE', 'RECEIVE_BOOT_COMPLETED'],
    },
    plugins: [
      'expo-router',
      'expo-camera',
      'expo-barcode-scanner',
      'expo-notifications',
      ['expo-image-picker', { photosPermission: 'TruWell AI accesses your photo library to upload product images.' }],
      ['stripe-react-native', { merchantIdentifier: 'merchant.com.truwell.ai', enableGooglePay: true }],
    ],
    extra: {
      eas: { projectId: '4e20596c-020b-4df8-a5bc-32b96aa42708' },
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
};
```

### `eas.json`
```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": { "EXPO_PUBLIC_APP_ENV": "development" }
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": false },
      "android": { "buildType": "apk" },
      "env": { "EXPO_PUBLIC_APP_ENV": "preview" }
    },
    "production": {
      "ios": { "buildConfiguration": "Release" },
      "android": { "buildType": "aab" },
      "env": { "EXPO_PUBLIC_APP_ENV": "production" }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "feelowie@gmail.com",
        "ascAppId": "your-app-store-connect-id"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

---

## SECTION 15 — CRITICAL RULES (ENFORCE THROUGHOUT ALL CODE)

1. No hardcoded color hex values outside `/src/theme/index.ts`. Every color uses `theme.colorName` from `useTheme()`.

2. No progress bars. No `View` with `width: '75%'` as a fill indicator. All progress visualization uses the `SegmentedIndicator` component.

3. No em dashes anywhere in user-facing text. Use commas, colons, "and", or "to" instead.

4. All icons are `react-native-svg` SVG paths. No emoji for navigation or functional icons.

5. Disclaimer text is non-negotiable: "This is educational information only. Consult [Doctor Full Name] for medical advice." The doctor name must be a tappable link.

6. Font sizes: minimum 9px. Font weights: only '400', '600', '700', '800', '900'.

7. All screens must use `useSafeAreaInsets()` for proper padding.

8. All screens with text inputs must use `KeyboardAvoidingView` with `behavior: Platform.OS === 'ios' ? 'padding' : 'height'`.

9. All Supabase subscriptions and timers must be cleaned up in `useEffect` return functions.

10. All user-entered text must be sanitized before database writes using a `sanitize(text: string)` utility that strips HTML and script tags.

11. Do not break any existing working features. Read existing files completely before modifying them.

12. No placeholder data in production. Use `SkeletonLoader` while data loads.

13. All `FlatList` components must include `keyExtractor`, `removeClippedSubviews={true}`, `maxToRenderPerBatch={10}`, `windowSize={5}`.

14. Images loaded via `expo-image` only (not `Image` from React Native core) with `cachePolicy: 'memory-disk'`.

---

## SECTION 16 — EXECUTION ORDER

Implement in this exact order:

```
1.  Install all packages (Section 2)
2.  Create .env file (Section 6)
3.  Run Supabase SQL schema (Section 5)
4.  Create /src/theme/index.ts and ThemeContext.tsx (Section 1)
5.  Create /src/types/index.ts (Section 4)
6.  Create /src/lib/supabase.ts, scoring.ts, notifications.ts (Section 7)
7.  Create /src/store/ files (Zustand stores for auth, wellness, scan, ui)
8.  Create all shared components in /src/components/ (Section 8)
9.  Create /src/hooks/ files
10. Create Supabase Edge Functions (Section 10)
11. Implement app/_layout.tsx (root layout with ThemeProvider and QueryClientProvider)
12. Implement auth screens (welcome, login, register, onboarding)
13. Implement custom TabBar component
14. Implement app/(tabs)/_layout.tsx with custom TabBar
15. Implement Home screen
16. Implement Scan screen and Result screen
17. Implement Wellness screen
18. Implement SafeCircle screen
19. Implement Profile screen
20. Implement AI Chat screen
21. Implement Telehealth screens (list + specialist profile + booking)
22. Implement Write Review screen
23. Implement Settings screens
24. Implement Ingredient detail screen
25. Add all animations per Section 11
26. Add all haptic feedback per Section 12
27. Add push notification setup per Section 13
28. Configure app.config.ts and eas.json (Section 14)
29. Run TypeScript check: npx tsc --noEmit
30. Fix all TypeScript errors
31. Run on iOS simulator: npx expo run:ios
32. Fix any runtime errors
33. Run on Android emulator: npx expo run:android
34. Fix any runtime errors
35. Run EAS production build: eas build --platform all --profile production
36. Verify both builds install and run correctly on physical devices
```

---

## QUALITY GATE CHECKLIST

Before marking implementation complete, verify every item:

- [ ] App launches without errors on iOS and Android
- [ ] Dark mode and light mode switch instantly across all screens and overlays
- [ ] All 5 tabs navigate correctly with correct active state (pill highlight)
- [ ] All tab icons are correct SVG paths matching the design
- [ ] SegmentedIndicators animate on every screen focus (no progress bars anywhere)
- [ ] Health score ring animates on Home tab focus
- [ ] Scan screen shows real camera preview
- [ ] Scanning a real barcode fetches product data and navigates to result screen
- [ ] AI chat sends messages, shows typing indicator, displays response
- [ ] AI response includes specialist recommendation card when appropriate
- [ ] Specialist name in disclaimer is tappable and navigates to booking screen
- [ ] Telehealth booking flow completes with Stripe payment sheet
- [ ] Push notification received after booking confirmation
- [ ] Water cups toggle and persist to Supabase across app restarts
- [ ] Breathing exercise timer runs correctly and awards XP on completion
- [ ] Star rating is interactive with haptic feedback
- [ ] Review submission inserts to Supabase and awards 25 guardian points
- [ ] SafeCircle feed updates in real time via Supabase Realtime
- [ ] Harm watchlist shows accurate report counts
- [ ] Badges show earned vs locked state correctly
- [ ] Profile shows real user data from Supabase
- [ ] Subscription screen shows correct plan tier
- [ ] All haptic feedback fires at correct moments
- [ ] No TypeScript errors (npx tsc --noEmit passes)
- [ ] No ESLint errors
- [ ] EAS production build succeeds for iOS (IPA)
- [ ] EAS production build succeeds for Android (AAB)
- [ ] Both builds pass App Store Connect and Play Console validation
- [ ] No em dashes in any user-facing text
- [ ] No hardcoded colors outside theme file
- [ ] No progress bars (only SegmentedIndicator)
- [ ] All disclaimers present with tappable doctor names

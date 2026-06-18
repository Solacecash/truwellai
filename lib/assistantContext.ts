import type { UserProfile } from '@/stores/userProfileStore';
import type { ScanResultPayload } from '@/stores/scanStore';
import { getRegulatoryContext } from './regulatoryContext';

// ── Extended profile shape (from user_health_profiles) ────────────────────────

export interface ExtendedHealthProfile {
  allergies?:          string[];
  allergens?:          string[];     // alternate field name from DB
  avoids?:             string[];
  conditions?:         string[];
  medications?:        string[];
  diet_preference?:    string;
  activity_level?:     string;
  skin_type?:          string;
  sun_exposure?:       string;
  city?:               string | null;
  country?:            string | null;
  lifestyle_habits?:   string[];
  is_pregnant_or_breastfeeding?: boolean;
}

export interface OnboardingProfile {
  userName?:        string;
  ageRange?:        string;
  gender?:          string;
  conditions?:      string[];
  allergies?:       string[];
  dietType?:        string;
  lifestyle?:       string;
  stressLevel?:     string;
  familyRole?:      string;
  productConcerns?: string[];
  guardianGoals?:   string[];
  healthScore?:     number;
}

export interface WellnessData {
  currentStreak?:      number;
  xpLevel?:            number;
  totalXp?:            number;
  avgDailyWater?:      number;   // cups (legacy; retained for compatibility)
  breathingThisWeek?:  number;   // session count

  // Rich wellness telemetry for personalized AI responses. Populated by the
  // assistant screen from the user's live wellness row + aggregate queries.
  hydrationTodayCups?:     number;
  hydrationGoalCups?:      number;
  hydrationWeekAvgCups?:   number;
  breathingTodaySessions?: number;
  breathingGoalSessions?:  number;
  breathingLastSessionAt?: string; // ISO timestamp of last completed session
}

export interface RecentScan {
  productName: string;
  grade?:      string;
  score?:      number;
  category?:   string;
  scannedAt?:  string;
}

// ── Context builder ────────────────────────────────────────────────────────────

export interface AssistantContextInput {
  profile?:        UserProfile | null;
  extendedProfile?: ExtendedHealthProfile | null;
  lastScan?:       ScanResultPayload | null;
  recentScans?:    RecentScan[];
  wellnessData?:   WellnessData | null;
  onboardingProfile?: OnboardingProfile | null;
}

/** Returns current season based on month and hemisphere. */
function getSeason(month: number, inNorthernHemisphere: boolean): string {
  const seasons = inNorthernHemisphere
    ? ['Winter','Winter','Spring','Spring','Spring','Summer','Summer','Summer','Fall','Fall','Fall','Winter']
    : ['Summer','Summer','Fall','Fall','Fall','Winter','Winter','Winter','Spring','Spring','Spring','Summer'];
  return seasons[month] ?? 'Unknown';
}

/** Returns time-of-day label for tone adjustment. */
function getTimeOfDay(hour: number): string {
  if (hour < 6)  return 'late night';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

/** Builds a comprehensive context string for the AI health assistant. */
export function buildAssistantContext(
  profile:    UserProfile | null,
  lastScan:   ScanResultPayload | null,
  options?: Partial<Omit<AssistantContextInput, 'profile' | 'lastScan'>>
): string | undefined {
  const {
    extendedProfile,
    recentScans,
    wellnessData,
    onboardingProfile,
  } = options ?? {};

  const parts: string[] = [];

  // ── User identity ──────────────────────────────────────────────────────────
  if (profile?.display_name) {
    parts.push(`User's name: ${profile.display_name}.`);
  }

  // ── Time context ──────────────────────────────────────────────────────────
  const now       = new Date();
  const hour      = now.getHours();
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
  const month     = now.getMonth();

  // Determine hemisphere from country (rough)
  const country    = extendedProfile?.country ?? null;
  const southernCountries = ['AU','ZA','NG','BR','AR','CL','PE','NZ'];
  const isNorthern = !country || !southernCountries.some((c) => country.toUpperCase().includes(c));
  const season     = getSeason(month, isNorthern);
  const timeOfDay  = getTimeOfDay(hour);

  parts.push(`Current time: ${timeOfDay}, ${dayOfWeek}, ${season} season.`);
  parts.push(`Adjust tone to be ${timeOfDay === 'morning' ? 'energizing and motivating' : timeOfDay === 'evening' || timeOfDay === 'night' ? 'calming and restorative' : 'balanced and informative'}.`);

  // ── Health profile ─────────────────────────────────────────────────────────
  const hp = profile?.health_profile;
  const ehp = extendedProfile;

  const allergens = ehp?.allergens ?? ehp?.allergies ?? hp?.allergies;
  if (allergens?.length) {
    parts.push(`Known allergens and sensitivities: ${allergens.join(', ')}.`);
  }
  if (hp?.avoids?.length || ehp?.avoids?.length) {
    const avoids = ehp?.avoids ?? hp?.avoids ?? [];
    parts.push(`Ingredients user avoids: ${avoids.join(', ')}.`);
  }
  if (ehp?.conditions?.length || hp?.conditions?.length) {
    const conds = ehp?.conditions ?? hp?.conditions ?? [];
    parts.push(`Health conditions (user-reported): ${conds.join(', ')}.`);
  }
  if (ehp?.medications?.length) {
    parts.push(`Medications: ${ehp.medications.join(', ')}.`);
  }
  if (ehp?.diet_preference || hp?.dietPreference) {
    parts.push(`Dietary preference: ${ehp?.diet_preference ?? hp?.dietPreference}.`);
  }
  if (ehp?.activity_level) {
    parts.push(`Activity level: ${ehp.activity_level}.`);
  }
  if (ehp?.skin_type) {
    parts.push(`Skin type: ${ehp.skin_type}.`);
  }
  if (ehp?.sun_exposure) {
    parts.push(`Sun exposure level: ${ehp.sun_exposure}.`);
  }
  if (ehp?.lifestyle_habits?.length) {
    parts.push(`Lifestyle habits: ${ehp.lifestyle_habits.join(', ')}.`);
  }
  if (ehp?.is_pregnant_or_breastfeeding) {
    parts.push(`User is pregnant or breastfeeding. Apply highest safety standards.`);
  }

  // ── Onboarding intelligence ─────────────────────────────────────────
  if (onboardingProfile) {
    const op = onboardingProfile;

    if (op.userName && !profile?.display_name) {
      parts.push(`User's name: ${op.userName}.`);
    }

    if (op.ageRange) {
      parts.push(`Age range: ${op.ageRange}.`);
    }

    if (op.gender) {
      parts.push(`Gender identity: ${op.gender}.`);
    }

    if (op.healthScore) {
      parts.push(
        `TruWell wellness baseline score: ${op.healthScore}/100. ` +
        `Reference this when discussing health progress or goal-setting.`
      );
    }

    const obConds = op.conditions?.filter((c) => c !== 'none') ?? [];
    if (obConds.length && !extendedProfile?.conditions?.length) {
      parts.push(
        `Health conditions (from onboarding): ${obConds.join(', ')}. ` +
        `Always cross-reference these when evaluating ingredients, foods, or products. ` +
        `Flag any conflicts immediately.`
      );
    }

    const obAllergies = op.allergies?.filter((a) => a !== 'none') ?? [];
    if (obAllergies.length && !extendedProfile?.allergies?.length) {
      parts.push(
        `Allergies and sensitivities (from onboarding): ${obAllergies.join(', ')}. ` +
        `These are hard stops — always flag matching ingredients as dangerous.`
      );
    }

    if (op.dietType) {
      parts.push(
        `Dietary preference: ${op.dietType}. ` +
        `Align all food recommendations and meal suggestions to this diet.`
      );
    }

    if (op.lifestyle) {
      parts.push(`Physical activity level: ${op.lifestyle}.`);
    }

    if (op.stressLevel) {
      parts.push(
        `Stress level (self-reported): ${op.stressLevel}. ` +
        `If stress is high or very high, factor this into wellness recommendations ` +
        `and be sensitive to mental load when suggesting lifestyle changes.`
      );
    }

    if (op.familyRole) {
      parts.push(
        `Life context: ${op.familyRole}. ` +
        `Tailor recommendations to this life stage — ` +
        `a parent's concerns differ from a student's.`
      );
    }

    const concerns = op.productConcerns ?? [];
    if (concerns.length) {
      parts.push(
        `Product ingredient concerns (user-flagged): ${concerns.join(', ')}. ` +
        `Proactively flag these in every product and ingredient discussion.`
      );
    }

    const goals = op.guardianGoals ?? [];
    if (goals.length) {
      parts.push(
        `Health goals: ${goals.slice(0, 5).join(', ')}. ` +
        `Orient recommendations toward these goals. ` +
        `Reference them when celebrating progress or suggesting next steps.`
      );
    }

    if (obConds.includes('pregnancy')) {
      parts.push(
        `PREGNANCY FLAG: User is pregnant or trying to conceive. ` +
        `Apply maximum ingredient safety scrutiny. ` +
        `Flag anything with restricted-in-pregnancy status immediately.`
      );
    }

    if (
      (op.stressLevel === 'high' || op.stressLevel === 'very_high') &&
      obConds.includes('mental')
    ) {
      parts.push(
        `MENTAL HEALTH NOTE: User reports high stress AND a mental health condition. ` +
        `Be especially gentle and supportive in tone. ` +
        `Avoid overwhelming lists of changes. Suggest one small actionable step at a time.`
      );
    }
  }

  // ── Location-based regulatory context ─────────────────────────────────────
  const regContext = getRegulatoryContext(country ?? profile?.locale ?? null);
  if (regContext) {
    parts.push(regContext);
  }

  // ── Recent scan history ────────────────────────────────────────────────────
  if (lastScan?.productName) {
    parts.push(
      `Most recent product scan: "${lastScan.productName}" (grade ${lastScan.grade ?? '?'}, score ${lastScan.score ?? '?'}).`
    );
  }
  if (recentScans?.length) {
    const recent = recentScans.slice(0, 5);
    const scanSummary = recent
      .map((s) => `"${s.productName}" (grade ${s.grade ?? '?'})`)
      .join(', ');
    parts.push(`Recent scan history (last ${recent.length}): ${scanSummary}.`);
    parts.push(`Reference these when relevant, e.g. "I noticed you recently scanned ${recent[0]?.productName}..."`);
  }

  // ── Wellness data ──────────────────────────────────────────────────────────
  if (wellnessData) {
    const w = wellnessData;
    if (w.currentStreak) {
      parts.push(`Current wellness streak: ${w.currentStreak} day${w.currentStreak !== 1 ? 's' : ''}.`);
    }
    if (w.xpLevel) {
      parts.push(`User XP level: ${w.xpLevel}${w.totalXp ? ` (${w.totalXp} total XP)` : ''}.`);
    }

    // ── Hydration telemetry (live) ─────────────────────────────────────────
    if (typeof w.hydrationTodayCups === 'number' && typeof w.hydrationGoalCups === 'number' && w.hydrationGoalCups > 0) {
      const ratio = w.hydrationTodayCups / w.hydrationGoalCups;
      const status =
        ratio >= 1       ? 'fully hydrated (met today\u2019s goal)' :
        ratio >= 0.75    ? 'well hydrated' :
        ratio >= 0.5     ? 'moderately hydrated' :
        ratio >= 0.25    ? 'under-hydrated' :
                           'severely under-hydrated';
      parts.push(
        `Hydration today: ${w.hydrationTodayCups} of ${w.hydrationGoalCups} cups (${Math.round(ratio * 100)}% — ${status}).`
      );
      if (ratio < 0.5) {
        parts.push(
          'HYDRATION HINT: The user is under their water goal today. If they mention headache, dizziness, ' +
          'fatigue, brain fog, dry mouth, dark urine, irritability, constipation, or poor focus, proactively ' +
          'raise hydration as a likely contributor and suggest they drink a cup of water now. Reference the exact ' +
          'cup count (e.g. "you\u2019ve only had 2 of 8 cups today") so the advice feels personal.'
        );
      }
    } else if (w.avgDailyWater) {
      // Legacy fallback when live cups aren't available.
      parts.push(`Average daily water intake: ${w.avgDailyWater} cups.`);
    }
    if (typeof w.hydrationWeekAvgCups === 'number') {
      parts.push(`7-day average water intake: ${w.hydrationWeekAvgCups.toFixed(1)} cups/day.`);
    }

    // ── Breathing telemetry (live) ─────────────────────────────────────────
    if (typeof w.breathingTodaySessions === 'number' && typeof w.breathingGoalSessions === 'number') {
      const doneRatio = w.breathingGoalSessions > 0
        ? w.breathingTodaySessions / w.breathingGoalSessions
        : 0;
      const status =
        doneRatio >= 1 ? 'already met today\u2019s breathing goal' :
        doneRatio > 0  ? 'started but not completed today\u2019s breathing goal' :
                         'has not done any breathing sessions today';
      parts.push(
        `Breathing today: ${w.breathingTodaySessions} of ${w.breathingGoalSessions} sessions (${status}).`
      );
      if (doneRatio < 1) {
        parts.push(
          'BREATHING HINT: If the user mentions anxiety, stress, racing thoughts, panic, trouble sleeping, ' +
          'tight chest, rapid heartbeat, overwhelm, irritability, or burnout, proactively suggest a short ' +
          'breathing exercise (they have one in-app). Reference their current progress explicitly.'
        );
      }
    }
    if (w.breathingThisWeek !== undefined) {
      parts.push(`Breathing sessions this week: ${w.breathingThisWeek}.`);
    }
    if (w.breathingLastSessionAt) {
      const hoursSince = (Date.now() - new Date(w.breathingLastSessionAt).getTime()) / (1000 * 60 * 60);
      if (!Number.isNaN(hoursSince)) {
        if (hoursSince < 1)       parts.push('User just finished a breathing session in the last hour.');
        else if (hoursSince < 24) parts.push(`User last completed a breathing session ~${Math.round(hoursSince)} hours ago.`);
        else if (hoursSince < 72) parts.push(`User last completed a breathing session ~${Math.round(hoursSince / 24)} days ago.`);
        else                       parts.push('User has not completed a breathing session in several days.');
      }
    }
  }

  // ── AI behavior instructions ───────────────────────────────────────────────
  parts.push(
    'Instructions: Reference the user by name when appropriate. ' +
    'Call out specific health conditions when evaluating ingredients. ' +
    'Give location-specific regulatory context when discussing ingredient safety. ' +
    'Use the live hydration and breathing telemetry above as personalized context — tie every lifestyle ' +
    'suggestion to the user\u2019s actual data (exact cups today, exact sessions today) so responses feel ' +
    'uniquely about them, not generic. Be empathetic and personalized, not generic.'
  );

  if (!parts.length) return undefined;
  return parts.join(' ');
}

import type {
  GuardianHealthStatus,
  GuardianLifestyleAnswers,
} from '@/lib/conversionOnboardingTypes';

export interface PlanItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  locked: boolean;
}

/** Snapshot of onboarding answers used for blueprint personalization. */
export type OnboardingPlanSnapshot = {
  selectedRole: string;
  userName: string;
  guardianGoals: string[];
  guardianHealthStatus: GuardianHealthStatus;
  guardianConversionPainPoints: string[];
  guardianDailyMinutes: number;
  guardianLifestyleAnswers: GuardianLifestyleAnswers;
  assessmentAnswers: Record<string, string>;
  userFormFirstName: string;
  userFormLastName: string;
};

export function resolveBlueprintDisplayName(store: OnboardingPlanSnapshot): string {
  if (store.userName.trim()) return store.userName.trim();
  const fromUser = [store.userFormFirstName, store.userFormLastName].filter(Boolean).join(' ').trim();
  return fromUser || store.assessmentAnswers.fullName?.trim() || '';
}

export function calculateBlueprintScore(_role: string, store: OnboardingPlanSnapshot): number {
  let score = 60;

  if (store.guardianGoals.length > 0) score += 5;
  if (store.guardianConversionPainPoints.length > 0) score += 5;
  if (store.guardianDailyMinutes > 0) score += 5;
  if (store.guardianLifestyleAnswers.biggestShiftDesired.trim()) score += 5;
  if (store.guardianHealthStatus.activityLevel.trim()) score += 5;
  if (Object.keys(store.assessmentAnswers).length > 0) score += 5;

  return Math.min(score, 89);
}

function guardianConditionLabel(store: OnboardingPlanSnapshot): string {
  const challenge = store.assessmentAnswers.challenge?.trim();
  if (challenge) return challenge;
  const pain = store.guardianConversionPainPoints[0]?.trim();
  if (pain) return pain;
  const goal = store.guardianGoals[0]?.trim();
  if (goal) return goal;
  return "your loved one's health";
}

function guardianRecipientLabel(store: OnboardingPlanSnapshot): string {
  const recipient = store.assessmentAnswers.careRecipient?.trim();
  if (recipient) return recipient;
  const lifeStage = store.assessmentAnswers.lifeStage?.trim();
  if (lifeStage) return lifeStage;
  return 'your loved one';
}

export function buildPlanItems(_role: string, store: OnboardingPlanSnapshot): PlanItem[] {
  const condition = guardianConditionLabel(store);
  const recipient = guardianRecipientLabel(store);
  const goals = store.guardianGoals;
  const answers = store.assessmentAnswers;
  const sleep = answers.sleep || '';
  const energy = answers.energy || '';
  const activity = answers.activity || '';
  const challenge = answers.challenge || '';

  const items: PlanItem[] = [];

  const aiGuideTitle = challenge
    ? `${challenge} AI Guide`
    : condition !== "your loved one's health"
      ? `${condition} AI Guide`
      : 'Personal Health AI Guide';

  const aiGuideDesc = challenge
    ? `Ask anything about ${challenge.toLowerCase()} and get a real answer in seconds. No jargon, no waiting room.`
    : `24/7 answers about ${condition.toLowerCase()} built around what you actually told us.`;

  items.push({
    id: 'ai-chat',
    title: aiGuideTitle,
    description: aiGuideDesc,
    icon: '\uD83D\uDCAC',
    locked: true,
  });

  const hasWeightGoal = goals.some(
    (g) =>
      g.toLowerCase().includes('weight') ||
      g.toLowerCase().includes('nutrition') ||
      challenge.toLowerCase().includes('weight') ||
      challenge.toLowerCase().includes('nutrition')
  );

  if (hasWeightGoal) {
    items.push({
      id: 'snap-food',
      title: 'Snap, Eat, Stay on Track',
      description:
        activity === 'Sedentary' || activity === 'Light'
          ? 'Photograph your meal. TruWell counts the calories and shows you the exact steps to burn it off. Eat what you love in the right portion.'
          : 'Photograph your meal. TruWell counts the calories and maps it to your activity. You eat the food you enjoy and stay on track.',
      icon: '\uD83D\uDCF8',
      locked: true,
    });
  } else {
    items.push({
      id: 'symptom',
      title: 'Symptom Pattern Tracker',
      description: `AI monitors ${recipient}'s patterns automatically. Catches what a busy day makes you miss.`,
      icon: '\uD83D\uDCDD',
      locked: true,
    });
  }

  if (sleep === 'Poor' || sleep === 'Very Poor') {
    items.push({
      id: 'sleep',
      title: 'Sleep Recovery Plan',
      description:
        'Your sleep pattern analysed and explained tonight. Tomorrow you wake up with a plan, not just a problem.',
      icon: '\uD83C\uDF19',
      locked: true,
    });
  } else {
    items.push({
      id: 'care-team',
      title: 'Safe Circle',
      description: `Coordinate ${recipient}'s care with your whole family. One plan, everyone aligned, no crossed wires.`,
      icon: '\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67',
      locked: true,
    });
  }

  if (energy === 'Exhausted' || energy === 'Low') {
    items.push({
      id: 'energy',
      title: 'Energy Restoration Plan',
      description:
        'TruWell maps where your energy drops during the day and exactly what is causing it. You stop guessing and start recovering.',
      icon: '\u26A1',
      locked: true,
    });
  } else {
    const goalTitle = goals[0]
      ? `${goals[0].charAt(0).toUpperCase()}${goals[0].slice(1)} Plan`
      : 'Care Action Plan';
    items.push({
      id: 'plan',
      title: goalTitle,
      description:
        'Daily goals built around exactly what you told us. Not a generic checklist. Yours.',
      icon: '\uD83C\uDFAF',
      locked: true,
    });
  }

  items.push({
    id: 'analytics',
    title: 'Weekly Progress Score',
    description:
      goals.length > 1
        ? `AI tracks your progress across all ${goals.length} of your priorities. You see exactly what is working.`
        : `Weekly AI insight on how your ${goals[0]?.toLowerCase() || 'health'} goal is progressing. No fluff, just signal.`,
    icon: '\uD83D\uDCC8',
    locked: true,
  });

  return items;
}

export function blueprintHeadline(_role: string, store: OnboardingPlanSnapshot): string {
  const name = store.userName.trim() || resolveBlueprintDisplayName(store);
  const topGoal = store.guardianGoals[0]?.trim() || '';
  const challenge = store.assessmentAnswers.challenge?.trim() || '';

  if (!name) {
    return topGoal
      ? `Your ${topGoal.toLowerCase()} plan is built and waiting`
      : 'Your personalised care plan is ready';
  }

  if (
    topGoal.toLowerCase().includes('weight') ||
    challenge.toLowerCase().includes('weight')
  ) {
    return `${name}, your weight management plan is ready`;
  }
  if (
    topGoal.toLowerCase().includes('sleep') ||
    store.assessmentAnswers.sleep === 'Poor' ||
    store.assessmentAnswers.sleep === 'Very Poor'
  ) {
    return `${name}, your sleep recovery plan is built`;
  }
  if (
    topGoal.toLowerCase().includes('energy') ||
    store.assessmentAnswers.energy === 'Exhausted'
  ) {
    return `${name}, your energy restoration plan is ready`;
  }
  if (
    topGoal.toLowerCase().includes('loved one') ||
    topGoal.toLowerCase().includes('supporting')
  ) {
    return `${name}, your family care plan is ready`;
  }
  if (
    topGoal.toLowerCase().includes('chronic') ||
    challenge.toLowerCase().includes('condition')
  ) {
    return `${name}, your condition management plan is built`;
  }

  return `${name}, your personalised plan is ready`;
}

export function blueprintSubtitle(_role: string, store?: OnboardingPlanSnapshot): string {
  if (!store) {
    return 'Built from your answers. Every recommendation is yours alone.';
  }

  const topGoal = store.guardianGoals[0]?.trim() || '';
  const sleep = store.assessmentAnswers.sleep || '';
  const energy = store.assessmentAnswers.energy || '';
  const challenge = store.assessmentAnswers.challenge || '';

  if (
    topGoal.toLowerCase().includes('weight') ||
    challenge.toLowerCase().includes('weight')
  ) {
    return 'Built around your food habits, activity level, and the weight goal you told us about. Not a template.';
  }
  if (sleep === 'Poor' || sleep === 'Very Poor') {
    return `Built around your ${sleep.toLowerCase()} sleep pattern and what it is costing you. We start here.`;
  }
  if (energy === 'Exhausted' || energy === 'Low') {
    return `Built around your ${energy.toLowerCase()} energy and the drain points you described. This plan attacks those directly.`;
  }
  if (store.guardianGoals.length >= 3) {
    return `Built from your ${store.guardianGoals.length} priorities. Every feature maps to something you told us matters.`;
  }
  if (topGoal) {
    return `Built around ${topGoal.toLowerCase()} and everything connected to it in your answers.`;
  }

  return 'Built from your answers. Every recommendation is yours alone.';
}

export function blueprintScoreLabel(
  _role: string,
  score: number,
  store?: OnboardingPlanSnapshot
): string {
  const name = store?.userName.trim();
  const sleep = store?.assessmentAnswers.sleep || '';
  const energy = store?.assessmentAnswers.energy || '';
  const goals = store?.guardianGoals || [];

  let context = '';
  if (score >= 75) {
    context = 'Strong foundation. Real gains ahead.';
  } else if (score >= 60) {
    context = 'Solid starting point. The plan closes the gap.';
  } else if (sleep === 'Poor' || sleep === 'Very Poor') {
    context = 'Sleep is pulling this down. Your plan fixes that first.';
  } else if (energy === 'Exhausted' || energy === 'Low') {
    context = 'Energy is the priority. Your plan starts there.';
  } else if (goals.length >= 3) {
    context = 'Lots to work with. Your plan is built for all of it.';
  } else {
    context = 'High upside. Your plan is designed for fast progress.';
  }

  if (name) {
    return `${name}'s Care Score: ${score}/100\n${context}`;
  }
  return `Your Care Score: ${score}/100\n${context}`;
}

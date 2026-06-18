/**
 * Guardian Screen 4G — adaptive questions from selectedGoals (spec lines 281–282).
 * Max 8 questions; base 4 always shown; up to 4 goal-driven follow-ups.
 */

export type GuardianAssessmentQuestion = {
  key: string;
  label: string;
  options: string[];
  /** Which care-discovery goal triggers this question (empty = always shown). */
  goalTrigger?: string;
};

const BASE_QUESTIONS: GuardianAssessmentQuestion[] = [
  {
    key: 'ageRange',
    label: 'Age range',
    options: ['18–29', '30–39', '40–49', '50–59', '60+'],
  },
  {
    key: 'primaryRole',
    label: 'Primary role',
    options: ['Parent', 'Caregiver', 'Self-care', 'Both parent and caregiver'],
  },
  {
    key: 'challenge',
    label: 'Biggest challenge',
    options: ['Fatigue', 'Stress', 'Nutrition confusion', 'Sleep', 'Time scarcity'],
  },
  {
    key: 'sleepQuality',
    label: 'Sleep quality',
    options: ['Poor', 'Fair', 'Good', 'Excellent'],
  },
];

const GOAL_ADAPTIVE: GuardianAssessmentQuestion[] = [
  {
    key: 'weightFocus',
    label: 'Weight management focus',
    options: ['Lose weight', 'Maintain weight', 'Gain healthy weight', 'Not sure yet'],
    goalTrigger: 'Lose weight and keep it off',
  },
  {
    key: 'energyPattern',
    label: 'When energy crashes most',
    options: ['Morning', 'Midday', 'Afternoon', 'Evening', 'All day'],
    goalTrigger: 'Have real energy again',
  },
  {
    key: 'sleepRoutine',
    label: 'Biggest sleep disruptor',
    options: ['Stress', 'Screen time', 'Pain', 'Caregiving duties', 'Unknown'],
    goalTrigger: 'Finally sleep properly',
  },
  {
    key: 'stressSource',
    label: 'Primary stress source',
    options: ['Work', 'Family care', 'Health worries', 'Finances', 'Multiple'],
    goalTrigger: 'Reduce stress and anxiety',
  },
  {
    key: 'fitnessLevel',
    label: 'Current activity level',
    options: ['Sedentary', 'Light walks', 'Moderate exercise', 'Very active'],
    goalTrigger: 'Build strength and fitness',
  },
  {
    key: 'metabolicFocus',
    label: 'Heart and metabolic priority',
    options: ['Blood pressure', 'Blood sugar', 'Cholesterol', 'General prevention'],
    goalTrigger: 'Improve heart and metabolic health',
  },
];

const MAX_QUESTIONS = 8;

/**
 * Question flow tree:
 * 1. Always: ageRange → primaryRole → challenge → sleepQuality
 * 2. For each selected goal (care-discovery order), append matching adaptive question if under cap
 * 3. No question hidden by prior answers — all visible questions remain answerable (no dead ends)
 */
export function buildGuardianAssessmentQuestions(selectedGoals: string[]): GuardianAssessmentQuestion[] {
  const result: GuardianAssessmentQuestion[] = [...BASE_QUESTIONS];
  const keys = new Set(result.map((q) => q.key));

  for (const goal of selectedGoals) {
    if (result.length >= MAX_QUESTIONS) break;
    const adaptive = GOAL_ADAPTIVE.find((q) => q.goalTrigger === goal);
    if (adaptive && !keys.has(adaptive.key)) {
      result.push(adaptive);
      keys.add(adaptive.key);
    }
  }

  return result.slice(0, MAX_QUESTIONS);
}

/** Final payload keys stored via setAnswer / assessmentAnswers. */
export function assessmentPayloadKeys(questions: GuardianAssessmentQuestion[]): string[] {
  return questions.map((q) => q.key);
}

/**
 * Builds a short personalised plan copy from psychological onboarding answers.
 */

export type BuildHealthPlanInput = {
  healthGoal: string;
  weightRange: string;
  painPoints: string[];
  activityLevel: string;
  dietStyle: string;
  dailyMinutes: number;
};

export function buildHealthPlan(input: BuildHealthPlanInput): string {
  const goal = input.healthGoal.trim() || 'your health goals';
  const weight = input.weightRange.trim() || 'your current body profile';
  const mins = Number.isFinite(input.dailyMinutes) ? Math.max(5, input.dailyMinutes) : 20;
  const pains =
    input.painPoints.length > 0
      ? input.painPoints.join(', ')
      : 'the friction points you shared';
  const move = input.activityLevel.trim() || 'your activity rhythm';
  const diet = input.dietStyle.trim() || 'your nutrition style';

  const lines = [
    `Your TruWell plan is built around ${goal}, starting from ${weight}.`,
    `We factor in ${pains}, ${move}, and ${diet}.`,
    `Daily commitment: about ${mins} minutes of focused habits so the app can keep up without overwhelming you.`,
    '',
    'Four moves we will guide you through:',
    '1. Scan products and labels so hidden ingredients surface before you buy.',
    '2. Use the AI assistant to decode results and get safer swaps in context.',
    '3. Track momentum in the app so patterns stay visible across weeks.',
    '',
    'Projected arc:',
    '· Roughly 3 weeks to feel a clear rhythm (energy, meal choices, fewer reactive slip-ups).',
    '· Around 60 days to see steadier confidence with scans and habits.',
  ];

  return lines.join('\n');
}

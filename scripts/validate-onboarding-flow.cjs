/**
 * Static funnel validation for conversion onboarding.
 * Usage: node scripts/validate-onboarding-flow.cjs
 */

const GUARDIAN_FORWARD = [
  '/onboarding',
  '/onboarding/role',
  '/onboarding/guardian/care-discovery',
  '/onboarding/guardian/assessment',
  '/onboarding/ai-processing',
  '/onboarding/score-reveal',
  '/onboarding/future-vision',
  '/onboarding/ai-demo',
  '/onboarding/blueprint',
  '/(auth)/register',
  '/onboarding/paywall-onboarding',
  '/onboarding/notifications',
  '/onboarding/celebration',
];

const PRO_FORWARD = [
  '/onboarding',
  '/onboarding/role',
  '/onboarding/professional/practice-profile',
  '/onboarding/professional/workflow',
  '/onboarding/ai-processing',
  '/onboarding/score-reveal',
  '/onboarding/future-vision',
  '/onboarding/ai-demo',
  '/onboarding/blueprint',
  '/(auth)/register',
  '/onboarding/paywall-onboarding',
  '/onboarding/notifications',
  '/onboarding/celebration',
];

const LEGACY = [
  'platform-intro',
  'role-selection',
  'guardian-goals',
  'wellness-plan-reveal',
  'first-action',
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function main() {
  assert(GUARDIAN_FORWARD.length === 13, 'Guardian funnel must have 13 steps');
  assert(PRO_FORWARD.length === 13, 'Professional funnel must have 13 steps');
  assert(GUARDIAN_FORWARD[9] === '/(auth)/register', 'Register must be step 10');
  assert(GUARDIAN_FORWARD[10] === '/onboarding/paywall-onboarding', 'Paywall must follow register');

  for (const legacy of LEGACY) {
    assert(!GUARDIAN_FORWARD.some((r) => r.includes(legacy)), `Legacy route leaked: ${legacy}`);
  }

  console.log('PASS: onboarding funnel route graph');
  console.log('  Guardian steps:', GUARDIAN_FORWARD.length);
  console.log('  Professional steps:', PRO_FORWARD.length);
}

main();

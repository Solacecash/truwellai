import type { ConversionRole } from '@/lib/conversionOnboardingTypes';

/**
 * Consistent Supabase auth user_metadata for onboarding account signup.
 */
export function buildOnboardingAuthMetadata(
  selectedRole: ConversionRole | '',
  provider?: 'apple' | 'google' | 'email'
): Record<string, string | null> {
  const isGuardian = selectedRole === 'guardian';

  return {
    user_type: 'user',
    role: isGuardian ? 'guardian' : 'user',
    onboarding_role_path: selectedRole || 'guardian',
    ...(provider === 'apple' ? { provider: 'apple' } : {}),
    ...(provider === 'google' ? { provider: 'google' } : {}),
    ...(provider === 'email' ? { provider: 'email' } : {}),
  };
}

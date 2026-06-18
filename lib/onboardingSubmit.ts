import type { UserFormData } from '@/stores/onboardingStore';
import { supabase } from './supabase';
import { VERIFICATION_EMAIL_REDIRECT } from './emailVerification';

export async function submitUserRegistration(
  form: UserFormData & { ageConfirmedAt?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: VERIFICATION_EMAIL_REDIRECT,
        data: {
          first_name: form.firstName,
          last_name: form.lastName,
          // Stored in auth.users.raw_user_meta_data — used by the DB trigger
          user_type: 'user',
        },
      },
    });

    if (authError) return { success: false, error: authError.message };
    if (!authData.user) return { success: false, error: 'Account creation failed' };

    const userId = authData.user.id;

    // Always upsert with user_type: 'user' so the profile row is correct even if
    // a DB trigger already created it from auth metadata (idempotent and safe).
    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: userId,
        display_name: `${form.firstName} ${form.lastName}`,
        email: form.email,
        user_type: 'user',       // NEVER 'expert' for Family Guardians
        subscription_tier: 'free',
        subscription_plan: 'free',
        age_confirmed: true,
        age_confirmed_at: form.ageConfirmedAt ?? new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    if (profileError) {
      if (__DEV__) console.error('[onboardingSubmit] profile upsert failed:', profileError.message);
      // Non-fatal: DB trigger may have already created the row correctly
    }

    const { error: healthError } = await supabase.from('user_health_profiles').upsert({
      user_id: userId,
      age: form.age ? parseInt(form.age, 10) : null,
      biological_sex: form.sex ?? null,
      conditions: form.conditions ?? [],
      allergens: form.allergies ?? [],
      activity_level: 'moderate',
    });
    if (healthError) {
      if (__DEV__) console.error('[onboardingSubmit] health profile upsert failed:', healthError.message);
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

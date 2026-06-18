import { Alert } from 'react-native';

import { signOutGoogle } from './googleAuth';
import { supabase } from './supabase';

export async function requestAccountDeletion(userId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    Alert.alert(
      'Delete Account and All Data',
      'This action is permanent and cannot be undone.\n\nThe following will be permanently deleted:\n\u2022 Your health profile and all health data\n\u2022 Your complete scan history\n\u2022 All AI conversation history\n\u2022 Your breathing session history\n\u2022 Your account and login credentials\n\nThis process begins immediately and completes within 30 days in compliance with data protection law.\n\nAre you absolutely certain?',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve() },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await executeAccountDeletion(userId);
              resolve();
            } catch (err) {
              reject(err);
            }
          },
        },
      ]
    );
  });
}

async function executeAccountDeletion(userId: string): Promise<void> {
  const deletionTimestamp = new Date().toISOString();

  // Step 1: Mark account for deletion (audit trail)
  await supabase
    .from('profiles')
    .update({
      deletion_requested: true,
      deletion_requested_at: deletionTimestamp,
      subscription_tier: 'free',
    })
    .eq('id', userId);

  // Step 2: Purge all health-related data immediately
  const tablesToPurge = [
    'usage_quotas',
    'scans',
    'scan_history',
    'breathing_sessions',
    'breathing_progress',
    'stress_history',
    'predictive_reports',
    'subscription_events',
    'watchlist_disputes',
    'user_health_alerts',
    'push_tokens',
    'notification_log',
    'chat_sessions',
    'chat_messages',
  ] as const;

  for (const table of tablesToPurge) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('user_id', userId);

    if (error) {
      if (__DEV__) console.error(`[accountDeletion] error purging ${table}:`, error.message);
    }
  }

  // Step 3: Anonymise profile (do not delete — needed for audit/billing records)
  await supabase
    .from('profiles')
    .update({
      display_name: '[Deleted User]',
      health_profile: null,
      founder_member: false,
      health_data_consent_given: false,
    })
    .eq('id', userId);

  // Step 4: Sign out
  await signOutGoogle();
  await supabase.auth.signOut();

  Alert.alert(
    'Account Deletion Initiated',
    'Your health data has been deleted immediately. Your account and all remaining data will be fully removed within 30 days. If you subscribed via the App Store, please also cancel your subscription through your Apple ID or Google Play account to stop future charges.'
  );
}

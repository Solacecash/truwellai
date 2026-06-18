import { applicationId } from 'expo-application';

import Constants, { ExecutionEnvironment } from 'expo-constants';

import { allowLocalSupabaseFromEnv, sanitizeSupabaseProjectUrl } from '@/lib/supabasePublicUrl';

/**
 * `Constants.expoConfig` runs `getManifest()`, which throws `ERR_CONSTANTS_MANIFEST_UNAVAILABLE` in
 * Expo Go if the manifest is not ready yet. That was crashing the whole bundle on import of `env`.
 */
function readExpoExtra(): Record<string, unknown> {
  try {
    const ec = Constants.expoConfig;
    return (ec?.extra as Record<string, unknown>) ?? {};
  } catch {
    return {};
  }
}

const extra = readExpoExtra();

/**
 * True when running inside the Expo Go host app (not a dev or store build).
 * `executionEnvironment` / `appOwnership` are sometimes wrong on Android; `applicationId` matches
 * the Expo Go package/bundle id reliably.
 */
export function isExpoGo(): boolean {
  const id = applicationId?.toLowerCase() ?? '';
  if (id === 'host.exp.exponent') return true;
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return true;
  return Constants.appOwnership === 'expo';
}

const allowLocalSupabase =
  (typeof __DEV__ !== 'undefined' && __DEV__) || allowLocalSupabaseFromEnv();

const rawSupabaseUrl =
  (typeof extra.supabaseUrl === 'string' && extra.supabaseUrl) ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  '';

export const env = {
  /**
   * HTTPS origin only (`https://projectref.supabase.co`), safe for native TLS/SNI.
   * Path suffixes like `/rest/v1` are stripped — they break Realtime/WebSocket host wiring on Android.
   */
  supabaseUrl: sanitizeSupabaseProjectUrl(rawSupabaseUrl, {
    allowLocalInsecure: allowLocalSupabase,
  }),

  supabaseAnonKey:
    (extra.supabaseAnonKey as string) || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
};

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { env, isExpoGo } from './env';

const SecureAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const AsyncStorageAdapter = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

/** Web + Expo Go: AsyncStorage. Standalone / dev builds: SecureStore. */
function authStorage() {
  if (Platform.OS === 'web') return AsyncStorageAdapter;
  if (isExpoGo()) return AsyncStorageAdapter;
  return SecureAdapter;
}

const rawUrl = env.supabaseUrl;
const rawKey = env.supabaseAnonKey;

if (!rawUrl || !rawKey) {
  if (__DEV__) console.error(
    'CRITICAL: Missing Supabase environment variables. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in EAS (Secrets or eas.json env) so app.config.ts can embed them in extra at build time.'
  );
}

/** Non-throwing fallbacks so the bundle loads; API calls fail until real keys are baked into the build. */
const supabaseUrl =
  rawUrl || 'https://placeholder.supabase.co';
const supabaseAnonKey =
  rawKey ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

/** Magic-link redirect (web login can forward to /verify). */
export const SUPABASE_AUTH_REDIRECT_TO =
  'https://truwellai.xyz/login?redirect=/verify';

type SupabaseClientOptions = NonNullable<Parameters<typeof createClient>[2]>;

const supabaseAuthConfig = {
  storage: authStorage(),
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: false,
  redirectTo: SUPABASE_AUTH_REDIRECT_TO,
} as SupabaseClientOptions['auth'] & { redirectTo: string };

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: supabaseAuthConfig as SupabaseClientOptions['auth'],
});

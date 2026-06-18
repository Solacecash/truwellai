import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

import { supabase } from '@/lib/supabase';

export const REFERRAL_STORAGE_KEY = 'truwell_pending_referral_code';
export const REFERRAL_WEB_JOIN_URL = 'https://truwellai.xyz/join';

/** Normalise user-entered or URL referral codes */
export function normalizeReferralCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function isValidReferralCode(code: string): boolean {
  const n = normalizeReferralCode(code);
  return n.length >= 4 && n.length <= 12;
}

/** Public web link — opens app via universal link or app store when configured */
export function buildReferralJoinUrl(code: string): string {
  const normalized = normalizeReferralCode(code);
  return `${REFERRAL_WEB_JOIN_URL}?ref=${encodeURIComponent(normalized)}`;
}

/** In-app deep link for TruWell scheme */
export function buildReferralAppUrl(code: string): string {
  const normalized = normalizeReferralCode(code);
  return Linking.createURL('/join', { queryParams: { ref: normalized } });
}

/** Short invite copy for Share sheet */
export function buildReferralShareMessage(code: string): string {
  const normalized = normalizeReferralCode(code);
  const url = buildReferralJoinUrl(normalized);
  return (
    `Join TruWell AI for health intelligence, safety alerts, and updates with health-minded people. ` +
    `Use code ${normalized} when you sign up: ${url}`
  );
}

export function parseReferralFromUrl(url: string): string | null {
  try {
    const parsed = Linking.parse(url);
    const raw = parsed.queryParams?.ref ?? parsed.queryParams?.referral;
    if (typeof raw === 'string' && raw.trim()) return normalizeReferralCode(raw);
    if (Array.isArray(raw) && raw[0]) return normalizeReferralCode(String(raw[0]));
  } catch {
    /* ignore malformed URLs */
  }
  return null;
}

export function parseReferralFromParams(
  params: Record<string, string | string[] | undefined>
): string | null {
  const raw = params.ref ?? params.referral;
  if (typeof raw === 'string' && raw.trim()) return normalizeReferralCode(raw);
  if (Array.isArray(raw) && raw[0]) return normalizeReferralCode(String(raw[0]));
  return null;
}

export async function persistReferralCode(code: string): Promise<string | null> {
  const normalized = normalizeReferralCode(code);
  if (!isValidReferralCode(normalized)) return null;
  await AsyncStorage.setItem(REFERRAL_STORAGE_KEY, normalized);
  return normalized;
}

export async function getPendingReferralCode(): Promise<string | null> {
  const stored = await AsyncStorage.getItem(REFERRAL_STORAGE_KEY);
  if (!stored) return null;
  const normalized = normalizeReferralCode(stored);
  return isValidReferralCode(normalized) ? normalized : null;
}

export async function clearPendingReferralCode(): Promise<void> {
  await AsyncStorage.removeItem(REFERRAL_STORAGE_KEY);
}

/** Resolve referral from URL params, then AsyncStorage */
export async function resolveIncomingReferralCode(
  params: Record<string, string | string[] | undefined>
): Promise<string | null> {
  const fromParams = parseReferralFromParams(params);
  if (fromParams && isValidReferralCode(fromParams)) {
    await persistReferralCode(fromParams);
    return fromParams;
  }
  return getPendingReferralCode();
}

/** Capture cold-start and warm deep links */
export async function captureReferralFromInitialUrl(): Promise<string | null> {
  try {
    const initial = await Linking.getInitialURL();
    if (initial) {
      const code = parseReferralFromUrl(initial);
      if (code && isValidReferralCode(code)) return persistReferralCode(code);
    }
  } catch {
    /* non-fatal */
  }
  return getPendingReferralCode();
}

/** Attach referrer to new user profile if not already set */
export async function applyReferralToUser(userId: string, code: string): Promise<void> {
  const normalized = normalizeReferralCode(code);
  if (!isValidReferralCode(normalized)) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('referral_code, referred_by')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) return;
  if (profile.referred_by) {
    await clearPendingReferralCode();
    return;
  }

  // Prevent self-referral
  if (profile.referral_code && normalizeReferralCode(profile.referral_code) === normalized) {
    await clearPendingReferralCode();
    return;
  }

  await supabase.from('profiles').update({ referred_by: normalized }).eq('id', userId);
  await supabase.auth.updateUser({ data: { referred_by: normalized } }).catch(() => {});
  await clearPendingReferralCode();
}

export async function applyPendingReferralIfNeeded(userId: string): Promise<void> {
  const pending = await getPendingReferralCode();
  if (pending) await applyReferralToUser(userId, pending);
}

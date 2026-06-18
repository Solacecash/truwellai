/**
 * Adapty in-app subscriptions — TruWell storefront layer.
 *
 * Mirrors the previous `revenueCat.ts` exports so callers can switch imports
 * to `@/lib/adapty` without UI changes.
 */

import type {
  ActivateParamsInput,
  AdaptyPaywallProduct,
  AdaptyProfile,
  AdaptyPurchaseResult,
} from 'react-native-adapty';

import { Platform } from 'react-native';

import { adapty } from 'react-native-adapty';

import { supabase } from './supabase';

// ── CONSTANTS ───────────────────────────────────────────────────────────────

export const ADAPTY_PUBLIC_KEY = 'public_live_ZaqbQVZs.2SX7OSpfi2Ly16H7zwyw';

/** Adapty access level identifier (dashboard → Access levels). */
export const ENTITLEMENT_ID = 'premium';

export const PLACEMENTS = {
  UPGRADE: 'truwell_upgrade_guardian',
} as const;

/** Store product identifiers (must match ASC / Play + Adapty products). */
export const PRODUCT_IDS = {
  monthly: 'truwell_pro_monthly',
  yearly: 'truwell_pro_yearly',
  family: 'truwell_family_monthly',
  lifetime: 'truwell_lifetime_founder',
} as const;

export const OFFERING_IDENTIFIER = PLACEMENTS.UPGRADE;

/** Minimal offerings shape compatible with hooks that previously used PurchasesOffering. */
export type TruWellPurchasesOffering = {
  identifier: string;
  availablePackages: AdaptyPaywallProduct[];
};

// ── IAP customer snapshot (RC-shaped for existing hooks/screens) ────────────

export type IapActiveEntitlement = {
  identifier: string;
  isActive: boolean;
  productIdentifier: string;
  expirationDate?: string | null;
};

export type IapCustomerInfo = {
  entitlements: {
    active: Record<string, IapActiveEntitlement>;
  };
  originalAppUserId?: string;
};

// ── STATE ───────────────────────────────────────────────────────────────────

/** False when native module missing or activation failed. */
let _nativeOk = true;

let _configured = false;

/** Set after a successful `adapty.identify`; cleared after logout or benign skip. */
let _identifiedAdaptyUserId: string | null = null;

function markConfigured() {
  _configured = true;
}

function isAdaptyUnidentifiedLogoutError(err: unknown): boolean {
  const msg = String((err as { message?: string })?.message ?? err).toLowerCase();
  const code = (err as { adaptyCode?: number; code?: number })?.adaptyCode
    ?? (err as { code?: number })?.code;
  return code === 3020 || msg.includes('3020') || msg.includes('unidentified');
}

function isMissingAdaptyNativeModule(err: unknown): boolean {
  const msg = String((err as { message?: string })?.message ?? err);
  return /NativeModule|not defined|not a function/i.test(msg);
}

/** Single activation lifecycle — awaited by identify / IAP calls to avoid races on cold start. */
const adaptyActivationPromise =
  Platform.OS === 'web'
    ? Promise.resolve().then(() => {
        _nativeOk = false;
      })
    : adapty
        .activate(ADAPTY_PUBLIC_KEY, {
          __ignoreActivationOnFastRefresh: __DEV__,
        } as ActivateParamsInput)
        .then(() => {
          markConfigured();
        })
        .catch((err) => {
          _nativeOk = false;
          if (isMissingAdaptyNativeModule(err)) {
            if (__DEV__) {
              console.debug(
                '[Adapty] Native module unavailable; use a dev build with prebuild (not expected in Expo Go).'
              );
            }
            return;
          }
          if (__DEV__) console.warn('[Adapty] Activation error:', err);
        });

export function isAdaptyReady(): boolean {
  return _configured && _nativeOk;
}

/** Legacy alias kept for imports that still reference `isRevenueCatReady`. */
export const isRevenueCatReady = isAdaptyReady;

/** no-op replacement for Purchases.configure */
export function configureRevenueCat(_userId?: string | null): void {
  /* Adapty activates at module load; optional user id handled by identifyUser. */
}

async function loadUpgradeProducts(): Promise<AdaptyPaywallProduct[]> {
  await adaptyActivationPromise;
  if (!isAdaptyReady()) {
    warnUnavailableOnce('loadUpgradeProducts');
    return [];
  }
  try {
    const paywall = await adapty.getPaywall(PLACEMENTS.UPGRADE);
    const products = await adapty.getPaywallProducts(paywall);
    return products ?? [];
  } catch (err) {
    if (__DEV__) console.warn('[Adapty] loadUpgradeProducts:', err);
    return [];
  }
}

export async function getOffering(): Promise<TruWellPurchasesOffering | null> {
  await adaptyActivationPromise;
  if (!isAdaptyReady()) {
    warnUnavailableOnce('getOffering');
    return null;
  }
  const availablePackages = await loadUpgradeProducts();
  return {
    identifier: OFFERING_IDENTIFIER,
    availablePackages,
  };
}

export async function getCurrentOffering(): Promise<TruWellPurchasesOffering | null> {
  return getOffering();
}

export async function getOfferingForPlacement(
  placementId: string
): Promise<TruWellPurchasesOffering | null> {
  if (placementId !== PLACEMENTS.UPGRADE && placementId !== OFFERING_IDENTIFIER) return null;
  return getOffering();
}

export async function getOfferingById(offeringId: string): Promise<TruWellPurchasesOffering | null> {
  if (
    offeringId !== 'default' &&
    offeringId !== OFFERING_IDENTIFIER &&
    offeringId !== PLACEMENTS.UPGRADE
  ) {
    return null;
  }
  return getOffering();
}

export function profileToCustomerInfo(profile: AdaptyProfile | null): IapCustomerInfo | null {
  if (!profile) return null;
  const active: Record<string, IapActiveEntitlement> = {};
  const levels = profile.accessLevels ?? {};
  for (const [id, level] of Object.entries(levels)) {
    if (level?.isActive) {
      active[id] = {
        identifier: id,
        isActive: true,
        productIdentifier: level.vendorProductId,
        expirationDate: level.expiresAt ? level.expiresAt.toISOString() : null,
      };
    }
  }
  return {
    entitlements: { active },
    originalAppUserId: profile.customerUserId ?? profile.profileId,
  };
}

export async function getCustomerInfo(): Promise<IapCustomerInfo | null> {
  await adaptyActivationPromise;
  if (!isAdaptyReady()) {
    warnUnavailableOnce('getCustomerInfo');
    return null;
  }
  try {
    const profile = await adapty.getProfile();
    return profileToCustomerInfo(profile);
  } catch (err) {
    if (__DEV__) console.error('[Adapty] getProfile error:', err);
    return null;
  }
}

export function checkEntitlement(
  info: IapCustomerInfo | null,
  entitlementId: string = ENTITLEMENT_ID
): boolean {
  if (!info) return false;
  return !!info.entitlements.active[entitlementId]?.isActive;
}

export async function checkEntitlementActive(): Promise<boolean> {
  const info = await getCustomerInfo();
  return checkEntitlement(info, ENTITLEMENT_ID);
}

/** @deprecated */
export async function hasGuardianPro(): Promise<boolean> {
  return checkEntitlementActive();
}

let warnedMissingNative = false;
function warnUnavailableOnce(context: string): void {
  if (warnedMissingNative) return;
  warnedMissingNative = true;
  if (__DEV__) console.warn(
    `[Adapty] ${context}: native IAP unavailable until Adapty activates in a native build (not Expo Go).`
  );
}

export async function initRevenueCat(userId: string): Promise<void> {
  await identifyUser(userId);
}

export async function identifyUser(userId: string): Promise<void> {
  try {
    await adaptyActivationPromise;
    if (!isAdaptyReady()) return;
    await adapty.identify(userId);
    _identifiedAdaptyUserId = userId;
    if (__DEV__) {
      if (__DEV__) console.log('[Adapty] Identified:', userId);
    }
  } catch (err) {
    if (__DEV__) console.warn('[Adapty] Identify failed:', (err as Error)?.message ?? err);
  }
}

export async function resetRevenueCat(): Promise<void> {
  await signOutAdapty();
}

export async function logOutUser(): Promise<void> {
  await resetRevenueCat();
}

/** Log out from Adapty (anonymous profile). */
export async function signOutAdapty(): Promise<void> {
  try {
    await adaptyActivationPromise;
    if (!isAdaptyReady()) return;
    if (!_identifiedAdaptyUserId) {
      if (__DEV__) console.log('[Adapty] No user to log out — skipping');
      return;
    }
    await adapty.logout();
    _identifiedAdaptyUserId = null;
  } catch (err) {
    if (isAdaptyUnidentifiedLogoutError(err)) {
      _identifiedAdaptyUserId = null;
      if (__DEV__) console.log('[Adapty] No user to log out — skipping');
      return;
    }
    if (__DEV__) console.warn('[Adapty] Logout error:', (err as Error)?.message ?? err);
  }
}

export async function getAvailablePackages(): Promise<AdaptyPaywallProduct[]> {
  return loadUpgradeProducts();
}

export type PurchaseFailureReason =
  | 'cancelled'
  | 'pending'
  | 'not_allowed'
  | 'payment_invalid'
  | 'product_unavailable'
  | 'network'
  | 'store_problem'
  | 'entitlement_not_granted'
  | 'unknown';

export interface PurchaseResult {
  success: boolean;
  customerInfo?: IapCustomerInfo | null;
  reason?: PurchaseFailureReason;
  error?: string;
}

function mapPurchaseResult(result: AdaptyPurchaseResult, requiredEntitlementId: string): PurchaseResult {
  if (result.type === 'user_cancelled') {
    return { success: false, reason: 'cancelled', error: 'cancelled' };
  }
  if (result.type === 'pending') {
    return { success: false, reason: 'pending', error: 'Purchase pending.' };
  }
  if (result.type !== 'success') {
    return { success: false, reason: 'unknown', error: 'Unexpected purchase result.' };
  }
  const profile = result.profile;
  const snapshot = profileToCustomerInfo(profile);
  if (!snapshot || !checkEntitlement(snapshot, requiredEntitlementId)) {
    return {
      success: false,
      reason: 'entitlement_not_granted',
      error: 'Entitlement missing after purchase — check Adapty dashboard (access level: premium).',
      customerInfo: snapshot ?? undefined,
    };
  }
  return { success: true, customerInfo: snapshot };
}

export async function syncRevenueCustomerToSupabase(
  customerInfo: IapCustomerInfo
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return;

  const ent = customerInfo.entitlements.active[ENTITLEMENT_ID];
  const isActive = !!ent?.isActive;
  let tier: 'free' | 'pro' | 'family' = 'free';
  if (isActive) {
    tier = ent?.productIdentifier === PRODUCT_IDS.family ? 'family' : 'pro';
  }
  const expiresAt = ent?.expirationDate ?? null;

  await supabase
    .from('profiles')
    .update({
      subscription_tier: tier,
      subscription_expires: expiresAt,
      subscription_updated: new Date().toISOString(),
      rc_customer_id: String(customerInfo.originalAppUserId ?? ''),
    })
    .eq('id', user.id);
}

export async function purchasePackage(
  pkg: AdaptyPaywallProduct
): Promise<{ success: boolean; customerInfo?: IapCustomerInfo; error?: string }> {
  const r = await purchaseMobileSubscription(pkg);
  if (r.success && r.customerInfo) {
    return { success: true, customerInfo: r.customerInfo };
  }
  if (r.reason === 'cancelled') {
    return { success: false, error: 'cancelled' };
  }
  return { success: false, error: r.error ?? 'Purchase failed.' };
}

export async function purchaseMobileSubscription(
  product: AdaptyPaywallProduct,
  requiredEntitlementId: string = ENTITLEMENT_ID
): Promise<PurchaseResult> {
  await adaptyActivationPromise;
  if (!isAdaptyReady()) {
    return { success: false, reason: 'store_problem', error: 'Native IAP unavailable.' };
  }
  try {
    const result = await adapty.makePurchase(product);
    const mapped = mapPurchaseResult(result, requiredEntitlementId);
    if (mapped.success && mapped.customerInfo) {
      await syncRevenueCustomerToSupabase(mapped.customerInfo);
    }
    return mapped;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Purchase failed';
    if (__DEV__) console.error('[Adapty] makePurchase:', err);
    const lower = msg.toLowerCase();
    if (lower.includes('cancel')) {
      return { success: false, reason: 'cancelled', error: 'cancelled' };
    }
    return { success: false, reason: 'unknown', error: msg };
  }
}

export async function restorePurchases(): Promise<PurchaseResult> {
  await adaptyActivationPromise;
  if (!isAdaptyReady()) {
    return { success: false, reason: 'store_problem', error: 'Restore unavailable.' };
  }
  try {
    const profile = await adapty.restorePurchases();
    const snapshot = profileToCustomerInfo(profile);
    const isActive = checkEntitlement(snapshot, ENTITLEMENT_ID);
    if (isActive && snapshot) await syncRevenueCustomerToSupabase(snapshot);
    return {
      success: true,
      customerInfo: snapshot ?? undefined,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Restore failed';
    if (__DEV__) console.error('[Adapty] restorePurchases:', err);
    return { success: false, reason: 'unknown', error: msg };
  }
}

export async function restorePurchasesState(): Promise<{
  success: boolean;
  isActive: boolean;
  error?: string;
}> {
  const r = await restorePurchases();
  const active = !!(r.customerInfo && checkEntitlement(r.customerInfo, ENTITLEMENT_ID));
  return {
    success: r.success,
    isActive: active,
    error: r.error,
  };
}

export async function getProfile(): Promise<{
  isActive: boolean;
  expiresAt: Date | null;
  productId: string | null;
}> {
  const info = await getCustomerInfo();
  const ent = info?.entitlements.active[ENTITLEMENT_ID];
  if (!ent?.isActive) return { isActive: false, expiresAt: null, productId: null };
  return {
    isActive: true,
    expiresAt: ent.expirationDate ? new Date(ent.expirationDate) : null,
    productId: ent.productIdentifier,
  };
}

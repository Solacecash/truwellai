/**
 * Reactive subscription state (premium access level via Adapty).
 * Implemented on top of useEntitlement — single listener + entitlement source.
 */

import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useEntitlement } from '@/hooks/useEntitlement';
import type { IapCustomerInfo } from '@/lib/adapty';

export interface RevenueCatState {
  isProActive: boolean;
  customerInfo: IapCustomerInfo | null;
  loading: boolean;
  error: Error | null;
}

export function useRevenueCat(): RevenueCatState {
  const { isActive, isChecking, customerInfo } = useEntitlement();
  return {
    isProActive: isActive,
    customerInfo,
    loading: isChecking,
    error: null,
  };
}

export function useIsPremium(): boolean {
  const { isProActive } = useRevenueCat();
  return isProActive;
}

export interface PremiumGateOptions {
  placement?: string;
  offering?: string;
  source?: string;
}

/** Navigate to full subscription checkout */
export function useRequirePremium(defaults: PremiumGateOptions = {}) {
  const router = useRouter();
  const { isProActive, loading } = useRevenueCat();

  return useCallback(
    (action: () => void, overrides: PremiumGateOptions = {}) => {
      if (loading) return;
      if (isProActive) {
        action();
        return;
      }
      const params = { ...defaults, ...overrides } as Record<string, string | undefined>;
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([, v]) => typeof v === 'string' && v.length > 0)
      ) as Record<string, string>;
      router.push({ pathname: '/settings/subscription', params: cleanParams } as never);
    },
    [router, isProActive, loading, defaults]
  );
}

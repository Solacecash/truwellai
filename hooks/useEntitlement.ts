import { useState, useEffect, useCallback } from 'react';
import type { EmitterSubscription } from 'react-native';
import { adapty } from 'react-native-adapty';

import {
  getCustomerInfo,
  ENTITLEMENT_ID,
  isRevenueCatReady,
  PRODUCT_IDS,
  type IapCustomerInfo,
} from '@/lib/adapty';

export interface EntitlementState {
  isActive: boolean;
  isChecking: boolean;
  tier: 'free' | 'pro' | 'family';
  customerInfo: IapCustomerInfo | null;
}

export function useEntitlement() {
  const [state, setState] = useState<EntitlementState>({
    isActive: false,
    isChecking: true,
    tier: 'free',
    customerInfo: null,
  });

  const check = useCallback(async () => {
    setState((prev) => ({ ...prev, isChecking: true }));
    if (!isRevenueCatReady()) {
      setState({
        isActive: false,
        isChecking: false,
        tier: 'free',
        customerInfo: null,
      });
      return;
    }
    try {
      const customerInfo = await getCustomerInfo();
      const activeMap = customerInfo?.entitlements.active ?? {};
      const ent = activeMap[ENTITLEMENT_ID];
      const isTruwellPro = !!ent?.isActive;
      let tier: 'free' | 'pro' | 'family' = 'free';
      if (isTruwellPro) {
        tier =
          ent?.productIdentifier === PRODUCT_IDS.family ? 'family' : 'pro';
      }
      setState({
        isActive: isTruwellPro,
        isChecking: false,
        tier,
        customerInfo: customerInfo ?? null,
      });
    } catch {
      setState((prev) => ({ ...prev, isChecking: false }));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (!cancelled) await check();
    })();

    if (!isRevenueCatReady()) return;

    const listener = () => {
      if (!cancelled) void check();
    };

    let subscription: EmitterSubscription | undefined;
    try {
      subscription = adapty.addEventListener('onLatestProfileLoad', listener);
    } catch {
      /* noop */
    }

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [check]);

  return { ...state, recheck: check };
}

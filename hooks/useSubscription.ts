import { useState, useEffect, useCallback } from 'react';
import type { AdaptyPaywallProduct } from 'react-native-adapty';
import {
  getOffering,
  getOfferingById,
  getOfferingForPlacement,
  purchasePackage,
  restorePurchasesState,
  getCustomerInfo,
  PRODUCT_IDS,
  ENTITLEMENT_ID,
  type TruWellPurchasesOffering,
} from '@/lib/adapty';

export interface OfferingParams {
  offeringId?: string;
  placementId?: string;
}

export type PlanId = 'monthly' | 'yearly' | 'family' | 'lifetime';

export interface SubscriptionState {
  isLoading: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  isActive: boolean;
  activePlanId: PlanId | null;
  expiresAt: Date | null;
  offering: TruWellPurchasesOffering | null;
  packages: AdaptyPaywallProduct[];
  error: string | null;
  selectedPlanId: PlanId;
}

export function useSubscription(rcParams?: OfferingParams) {
  const [state, setState] = useState<SubscriptionState>({
    isLoading: true,
    isPurchasing: false,
    isRestoring: false,
    isActive: false,
    activePlanId: null,
    expiresAt: null,
    offering: null,
    packages: [],
    error: null,
    selectedPlanId: 'yearly',
  });

  const loadOfferingData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      let offering: TruWellPurchasesOffering | null = null;
      if (rcParams?.offeringId) {
        offering = await getOfferingById(rcParams.offeringId);
      }
      if (!offering && rcParams?.placementId) {
        offering = await getOfferingForPlacement(rcParams.placementId);
      }
      if (!offering) {
        offering = await getOffering();
      }

      const [customerInfoResolved] = await Promise.all([
        getCustomerInfo(),
      ]);
      const customerInfo = customerInfoResolved ?? null;

      const entitlement = customerInfo?.entitlements.active[ENTITLEMENT_ID];
      const isActive = !!entitlement?.isActive;
      const expiresAt = entitlement?.expirationDate
        ? new Date(entitlement.expirationDate)
        : null;
      const pkgs = offering?.availablePackages ?? [];

      const activePlanId = entitlement?.productIdentifier
        ? detectPlanFromProductId(entitlement.productIdentifier)
        : null;

      setState((prev) => ({
        ...prev,
        isLoading: false,
        isActive,
        activePlanId,
        expiresAt,
        offering: offering ?? null,
        packages: pkgs,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load plans';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: msg,
      }));
    }
  }, [rcParams?.offeringId, rcParams?.placementId]);

  useEffect(() => {
    void loadOfferingData();
  }, [loadOfferingData]);

  const selectPlan = useCallback((planId: PlanId) => {
    setState((prev) => ({ ...prev, selectedPlanId: planId }));
  }, []);

  const subscribe = useCallback(
    async (planId?: PlanId): Promise<{ ok: boolean; message?: string }> => {
      const targetPlan = planId ?? state.selectedPlanId;
      const pkg = findPackageByPlanId(state.packages, targetPlan);

      if (!pkg) {
        const msg = 'Plan not available. Please try again.';
        setState((prev) => ({
          ...prev,
          error: msg,
        }));
        return { ok: false, message: msg };
      }

      setState((prev) => ({ ...prev, isPurchasing: true, error: null }));

      const result = await purchasePackage(pkg);

      if (result.error === 'cancelled') {
        setState((prev) => ({ ...prev, isPurchasing: false }));
        return { ok: false, message: 'cancelled' };
      }

      if (!result.success || !result.customerInfo) {
        const msg = result.error ?? 'Purchase failed. Please try again.';
        setState((prev) => ({
          ...prev,
          isPurchasing: false,
          error: msg,
        }));
        return { ok: false, message: msg };
      }

      const entitlement = result.customerInfo.entitlements.active[ENTITLEMENT_ID];
      setState((prev) => ({
        ...prev,
        isPurchasing: false,
        isActive: true,
        activePlanId: targetPlan,
        expiresAt: entitlement?.expirationDate
          ? new Date(entitlement.expirationDate)
          : null,
      }));
      return { ok: true };
    },
    [state.selectedPlanId, state.packages]
  );

  const restore = useCallback(
    async (): Promise<{ ok: boolean; restored: boolean; message?: string }> => {
      setState((prev) => ({ ...prev, isRestoring: true, error: null }));
      const result = await restorePurchasesState();

      if (!result.success) {
        const msg = result.error ?? 'Restore failed. Please try again.';
        setState((prev) => ({
          ...prev,
          isRestoring: false,
          error: msg,
        }));
        return { ok: false, restored: false, message: msg };
      }

      if (result.isActive) {
        await loadOfferingData();
        setState((prev) => ({
          ...prev,
          isRestoring: false,
          isActive: true,
        }));
        return { ok: true, restored: true };
      }

      setState((prev) => ({
        ...prev,
        isRestoring: false,
        isActive: false,
      }));
      return { ok: true, restored: false };
    },
    [loadOfferingData]
  );

  return {
    ...state,
    selectPlan,
    subscribe,
    restore,
    reload: loadOfferingData,
  };
}

export function findPackageByPlanId(
  packages: AdaptyPaywallProduct[],
  planId: PlanId
): AdaptyPaywallProduct | undefined {
  const targetId = PRODUCT_IDS[planId];
  return packages.find((pkg) => pkg.vendorProductId === targetId);
}

export function detectPlanFromProductId(productId: string): PlanId | null {
  for (const [key, val] of Object.entries(PRODUCT_IDS) as [PlanId, string][]) {
    if (val === productId) return key;
  }
  return null;
}

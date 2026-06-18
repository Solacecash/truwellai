import { supabase } from './supabase';
import { PlanId, isPro, getPlanById } from './subscriptionPlans';

export interface QuotaStatus {
  planId: PlanId;
  scansUsed: number;
  scansLimit: number | 'unlimited';
  scansRemaining: number | 'unlimited';
  percentScansUsed: number;
  reportsUsed: number;
  reportsLimit: number | 'unlimited';
  reportsRemaining: number | 'unlimited';
  percentReportsUsed: number;
  canScan: boolean;
  canGenerateReport: boolean;
  resetDate: string;
  isNearScanLimit: boolean;
  isAtScanLimit: boolean;
  isNearReportLimit: boolean;
  isAtReportLimit: boolean;
}

export async function getQuotaStatus(userId: string): Promise<QuotaStatus> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_plan')
    .eq('id', userId)
    .single();

  const planId = (profile?.subscription_plan ?? 'free') as PlanId;

  if (isPro(planId)) {
    return {
      planId,
      scansUsed: 0,
      scansLimit: 'unlimited',
      scansRemaining: 'unlimited',
      percentScansUsed: 0,
      reportsUsed: 0,
      reportsLimit: 'unlimited',
      reportsRemaining: 'unlimited',
      percentReportsUsed: 0,
      canScan: true,
      canGenerateReport: true,
      resetDate: '',
      isNearScanLimit: false,
      isAtScanLimit: false,
      isNearReportLimit: false,
      isAtReportLimit: false,
    };
  }

  const { data: quota } = await supabase
    .from('usage_quotas')
    .select('scans_used_this_month, predictive_reports_used_this_month, quota_reset_date')
    .eq('user_id', userId)
    .single();

  const plan = getPlanById(planId);
  const scanLimit = typeof plan.scanLimit === 'number' ? plan.scanLimit : 10;
  const reportLimit = typeof plan.predictiveReportLimit === 'number' ? plan.predictiveReportLimit : 5;

  const scansUsed = quota?.scans_used_this_month ?? 0;
  const reportsUsed = quota?.predictive_reports_used_this_month ?? 0;

  const resetDate = quota?.quota_reset_date
    ? new Date(quota.quota_reset_date).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric',
      })
    : 'end of month';

  return {
    planId,
    scansUsed,
    scansLimit: scanLimit,
    scansRemaining: Math.max(0, scanLimit - scansUsed),
    percentScansUsed: Math.min(100, (scansUsed / scanLimit) * 100),
    reportsUsed,
    reportsLimit: reportLimit,
    reportsRemaining: Math.max(0, reportLimit - reportsUsed),
    percentReportsUsed: Math.min(100, (reportsUsed / reportLimit) * 100),
    canScan: scansUsed < scanLimit,
    canGenerateReport: reportsUsed < reportLimit,
    resetDate,
    isNearScanLimit: scansUsed >= 7 && scansUsed < scanLimit,
    isAtScanLimit: scansUsed >= scanLimit,
    isNearReportLimit: reportsUsed >= 4 && reportsUsed < reportLimit,
    isAtReportLimit: reportsUsed >= reportLimit,
  };
}

export async function incrementScanCount(userId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_scan_quota', { uid: userId });
  if (__DEV__ && error) console.error('[quotaManager] increment scan error:', error.message);
}

export async function incrementReportCount(userId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_report_quota', { uid: userId });
  if (__DEV__ && error) console.error('[quotaManager] increment report error:', error.message);
}

export async function getFounderSlotsRemaining(): Promise<number> {
  const { data } = await supabase
    .from('founder_slots')
    .select('total_slots, claimed_slots')
    .single();
  if (!data) return 373;
  return data.total_slots - data.claimed_slots;
}

export async function claimFounderSlot(userId: string): Promise<void> {
  await supabase.rpc('increment_claimed_slots');
  await supabase
    .from('profiles')
    .update({ founder_member: true, subscription_plan: 'lifetime' })
    .eq('id', userId);
}

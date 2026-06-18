import { supabase } from '@/lib/supabase';

export interface FamilyMemberSummary {
  memberId: string;
  displayName: string | null;
  avatarUrl: string | null;
  scanCount: number;
  lastActive: string | null;
  status: 'active' | 'pending' | 'removed';
}

export interface FamilyGroupInfo {
  groupId: string;
  inviteCode: string;
  ownerName: string | null;
  memberCount: number;
  maxMembers: number;
  members: FamilyMemberSummary[];
}

/** Called after a successful family plan purchase to create the group */
export async function ensureFamilyGroup(
  ownerId: string
): Promise<{ groupId: string; inviteCode: string } | null> {
  const { data: existing } = await supabase
    .from('family_groups')
    .select('id, invite_code')
    .eq('owner_id', ownerId)
    .eq('active', true)
    .single();

  if (existing) {
    return { groupId: existing.id, inviteCode: existing.invite_code };
  }

  const { data, error } = await supabase.rpc('create_family_group', { p_owner_id: ownerId });
  if (error || !data) {
    if (__DEV__) console.error('[FamilyPlan] ensureFamilyGroup:', error);
    return null;
  }

  const { data: group } = await supabase
    .from('family_groups')
    .select('id, invite_code')
    .eq('id', data)
    .single();

  if (!group) return null;
  return { groupId: group.id, inviteCode: group.invite_code };
}

/** Join a family group using an invite code */
export async function joinFamilyGroup(
  inviteCode: string,
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('join_family_group', {
    p_invite_code: inviteCode.toUpperCase(),
    p_member_id: memberId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; error?: string };
  return result;
}

/** Get family group info for the owner */
export async function getFamilyGroupForOwner(ownerId: string): Promise<FamilyGroupInfo | null> {
  const { data: group, error: groupErr } = await supabase
    .from('family_groups')
    .select('id, invite_code, max_members')
    .eq('owner_id', ownerId)
    .eq('active', true)
    .single();

  if (groupErr || !group) return null;

  const { data: members } = await supabase
    .from('family_members')
    .select(`
      member_id,
      status,
      joined_at,
      profiles:member_id (
        display_name,
        avatar_url
      )
    `)
    .eq('group_id', group.id)
    .neq('status', 'removed');

  const memberIds = (members ?? []).map((m: { member_id: string }) => m.member_id);
  const scanCounts: Record<string, number> = {};

  if (memberIds.length > 0) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: scans } = await supabase
      .from('scan_history')
      .select('user_id')
      .in('user_id', memberIds)
      .gte('created_at', thirtyDaysAgo);

    (scans ?? []).forEach((s: { user_id: string }) => {
      scanCounts[s.user_id] = (scanCounts[s.user_id] ?? 0) + 1;
    });
  }

  const summaries: FamilyMemberSummary[] = (members ?? []).map((m) => {
    const rawProfile = m.profiles as
      | { display_name: string | null; avatar_url?: string | null }
      | { display_name: string | null; avatar_url?: string | null }[]
      | null;
    const profileRow = Array.isArray(rawProfile) ? (rawProfile[0] ?? null) : rawProfile;

    return {
      memberId: m.member_id as string,
      displayName: profileRow?.display_name ?? null,
      avatarUrl: profileRow?.avatar_url ?? null,
      scanCount: scanCounts[m.member_id as string] ?? 0,
      lastActive: m.joined_at as string,
      status: m.status as FamilyMemberSummary['status'],
    };
  });

  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', ownerId)
    .single();

  return {
    groupId: group.id,
    inviteCode: group.invite_code,
    ownerName: ownerProfile?.display_name ?? null,
    memberCount: summaries.filter((m) => m.status === 'active').length,
    maxMembers: group.max_members,
    members: summaries,
  };
}

/** Check if current user has family plan access (owner OR active member) */
export async function checkFamilyAccess(userId: string): Promise<{
  hasAccess: boolean;
  role: 'owner' | 'member' | null;
  groupId: string | null;
}> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('family_group_id, family_role, subscription_tier')
    .eq('id', userId)
    .single();

  if (!profile) return { hasAccess: false, role: null, groupId: null };

  if (profile.subscription_tier === 'family' && profile.family_role === 'owner') {
    return { hasAccess: true, role: 'owner', groupId: profile.family_group_id };
  }

  if (profile.family_role === 'member' && profile.family_group_id) {
    const { data: group } = await supabase
      .from('family_groups')
      .select('active')
      .eq('id', profile.family_group_id)
      .single();

    if (group?.active) {
      return { hasAccess: true, role: 'member', groupId: profile.family_group_id };
    }
  }

  return { hasAccess: false, role: null, groupId: null };
}

/** Remove a member from the family group (owner only) */
export async function removeFamilyMember(groupId: string, memberId: string): Promise<boolean> {
  const { error } = await supabase
    .from('family_members')
    .update({ status: 'removed' })
    .eq('group_id', groupId)
    .eq('member_id', memberId);

  if (!error) {
    await supabase
      .from('profiles')
      .update({ family_group_id: null, family_role: null })
      .eq('id', memberId);
  }

  return !error;
}

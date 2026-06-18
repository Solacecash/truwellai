import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getFamilyGroupForOwner,
  removeFamilyMember,
  type FamilyMemberSummary,
} from '@/lib/familyPlan';
import { useAuthStore } from '@/stores/authStore';
import { useFamilyStore } from '@/stores/familyStore';

const TEAL = '#00E5C8';
const GOLD = '#C9A84C';
const BG = '#080E1A';
const CARD = '#111D26';
const WHITE = '#F0F4FF';
const WHITE70 = 'rgba(240,244,255,0.70)';
const WHITE40 = 'rgba(240,244,255,0.40)';
const WHITE12 = 'rgba(240,244,255,0.12)';

function MemberSlot({
  member,
  onRemove,
  index,
}: {
  member: FamilyMemberSummary | null;
  onRemove?: (id: string) => void;
  index: number;
}) {
  if (!member) {
    return (
      <Animated.View entering={FadeInDown.delay(index * 80).springify()} style={slotStyles.empty}>
        <View style={slotStyles.emptyAvatar}>
          <Text style={slotStyles.emptyPlus}>+</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={slotStyles.emptyName}>Open slot</Text>
          <Text style={slotStyles.emptySub}>Share invite code to fill</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()} style={slotStyles.filled}>
      <View style={slotStyles.avatar}>
        <Text style={slotStyles.avatarLetter}>
          {(member.displayName ?? '?').charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={slotStyles.memberName}>{member.displayName ?? 'Member'}</Text>
        <Text style={slotStyles.memberStats}>
          {member.scanCount} scans this month
          {member.status === 'pending' ? '  •  Pending' : ''}
        </Text>
      </View>
      {onRemove ? (
        <Pressable
          onPress={() => {
            Alert.alert(
              'Remove member',
              `Remove ${member.displayName ?? 'this member'} from your family plan?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Remove',
                  style: 'destructive',
                  onPress: () => onRemove(member.memberId),
                },
              ]
            );
          }}
          hitSlop={8}
          style={slotStyles.removeBtn}
        >
          <Text style={slotStyles.removeIcon}>✕</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const slotStyles = StyleSheet.create({
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: WHITE12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginBottom: 8,
  },
  emptyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: WHITE40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPlus: { fontSize: 18, color: WHITE40 },
  emptyName: { fontFamily: 'Montserrat_600SemiBold', fontSize: 13, color: WHITE40 },
  emptySub: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: WHITE40, marginTop: 2 },
  filled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: 'rgba(0,229,200,0.15)',
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,229,200,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(0,229,200,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontFamily: 'Montserrat_700Bold', fontSize: 16, color: TEAL },
  memberName: { fontFamily: 'Montserrat_600SemiBold', fontSize: 13, color: WHITE },
  memberStats: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: WHITE40, marginTop: 2 },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIcon: { fontSize: 10, color: '#f87171', fontWeight: '700' },
});

export default function FamilyHubScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id;
  const { groupInfo, setGroupInfo, setLoading } = useFamilyStore();
  const [refreshing, setRefreshing] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const info = await getFamilyGroupForOwner(userId);
    setGroupInfo(info);
    setLoading(false);
  }, [userId, setGroupInfo, setLoading]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const copyCode = async () => {
    if (!groupInfo?.inviteCode) return;
    await Clipboard.setStringAsync(groupInfo.inviteCode);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const shareCode = async () => {
    if (!groupInfo?.inviteCode) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message:
          `You've been added to my TruWell AI Family Plan!\n\n` +
          `Use invite code: ${groupInfo.inviteCode}\n\n` +
          `Steps to join:\n` +
          `1. Download TruWell AI from https://truwellai.xyz\n` +
          `2. Create a free account\n` +
          `3. Go to Profile → Family Plan → Join a Family Plan\n` +
          `4. Enter code: ${groupInfo.inviteCode}\n\n` +
          `You'll get full Premium access on my plan immediately.`,
      });
    } catch {
      /* user dismissed */
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!groupInfo) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const ok = await removeFamilyMember(groupInfo.groupId, memberId);
    if (ok) await load();
    else Alert.alert('Error', 'Could not remove member. Please try again.');
  };

  const slots = Array.from({ length: groupInfo?.maxMembers ?? 5 }, (_, i) => {
    const activeMember = groupInfo?.members.filter((m) => m.status === 'active')[i] ?? null;
    return activeMember;
  });

  return (
    <SafeAreaView style={hubStyles.root} edges={['top']}>
      <ScrollView
        contentContainerStyle={hubStyles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TEAL} />
        }
      >
        <View style={hubStyles.header}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/profile' as never);
              }
            }}
            style={hubStyles.backBtn}
          >
            <Text style={hubStyles.backIcon}>{'\u2039'}</Text>
          </Pressable>
          <View>
            <Text style={hubStyles.eyebrow}>FAMILY PLAN</Text>
            <Text style={hubStyles.title}>Family Hub</Text>
          </View>
        </View>

        <Animated.View entering={FadeInDown.delay(80).springify()} style={hubStyles.statsRow}>
          <View style={hubStyles.statCard}>
            <Text style={hubStyles.statNum}>{groupInfo?.memberCount ?? 0}</Text>
            <Text style={hubStyles.statLabel}>Active{'\n'}Members</Text>
          </View>
          <View style={hubStyles.statCard}>
            <Text style={hubStyles.statNum}>
              {(groupInfo?.maxMembers ?? 5) - (groupInfo?.memberCount ?? 0)}
            </Text>
            <Text style={hubStyles.statLabel}>Open{'\n'}Slots</Text>
          </View>
          <View style={hubStyles.statCard}>
            <Text style={[hubStyles.statNum, { color: TEAL }]}>
              {groupInfo?.members.reduce((acc, m) => acc + m.scanCount, 0) ?? 0}
            </Text>
            <Text style={hubStyles.statLabel}>Total Scans{'\n'}This Month</Text>
          </View>
        </Animated.View>

        <Text style={hubLabelStyles.sectionNote}>
          Family invite code — for plan sharing only
        </Text>

        <Animated.View entering={FadeInDown.delay(140).springify()} style={hubStyles.inviteCard}>
          <Text style={hubStyles.inviteLabel}>YOUR INVITE CODE</Text>
          <Text style={hubStyles.inviteCode}>{groupInfo?.inviteCode ?? '------'}</Text>
          <Text style={hubStyles.inviteSub}>
            Share this code with the people you want on your Family Plan. When they enter it in
            TruWell AI, they get full Premium access included in your subscription — no separate
            payment needed. This is different from the referral programme which earns rewards for
            bringing new users to TruWell.
          </Text>
          <View style={hubStyles.inviteBtnRow}>
            <Pressable onPress={copyCode} style={[hubStyles.inviteBtn, hubStyles.inviteBtnCopy]}>
              <Text style={hubStyles.inviteBtnText}>
                {codeCopied ? '✓ Copied!' : '📋 Copy code'}
              </Text>
            </Pressable>
            <Pressable onPress={shareCode} style={[hubStyles.inviteBtn, hubStyles.inviteBtnShare]}>
              <Text style={[hubStyles.inviteBtnText, { color: '#020A14' }]}>Share invite</Text>
            </Pressable>
          </View>
        </Animated.View>

        <View style={hubStyles.privacyBanner}>
          <Text style={hubStyles.privacyIcon}>🔒</Text>
          <Text style={hubStyles.privacyText}>
            You can only see each member's scan count and last active date. Individual health
            data, scores, and reports are private to each member.
          </Text>
        </View>

        <Text style={hubStyles.sectionLabel}>FAMILY MEMBERS (5 MAX)</Text>
        {slots.map((member, i) => (
          <MemberSlot
            key={member?.memberId ?? `empty-${i}`}
            member={member}
            onRemove={member ? handleRemove : undefined}
            index={i}
          />
        ))}

        <View style={hubStyles.joinHint}>
          <Text style={hubStyles.joinHintText}>
            Family members join at:{' '}
            <Text style={{ color: TEAL }}>Settings → Join Family Plan</Text>
          </Text>
        </View>
      </ScrollView>
      <View style={hubStyles.dashboardBtnWrap}>
        <Pressable
          onPress={() => router.replace('/' as never)}
          style={hubStyles.dashboardBtn}
          accessibilityRole="button"
        >
          <Text style={hubStyles.dashboardBtnText}>
            {'Go to Dashboard \u2192'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const hubLabelStyles = StyleSheet.create({
  sectionNote: {
    fontSize: 11,
    color: WHITE40,
    marginBottom: 4,
    marginLeft: 4,
    fontStyle: 'italic',
    fontFamily: 'DMSans_400Regular',
  },
});

const hubStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
    paddingBottom: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: WHITE12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 24, color: WHITE, lineHeight: 28 },
  eyebrow: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 10,
    letterSpacing: 3,
    color: TEAL,
  },
  title: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 22,
    color: WHITE,
    letterSpacing: -0.3,
  },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  statCard: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: WHITE12,
  },
  statNum: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 26,
    color: GOLD,
    letterSpacing: -1,
  },
  statLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 10,
    color: WHITE40,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 14,
  },
  inviteCard: {
    backgroundColor: 'rgba(201,168,76,0.06)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.25)',
    marginBottom: 14,
  },
  inviteLabel: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 9,
    letterSpacing: 3,
    color: GOLD,
    marginBottom: 8,
  },
  inviteCode: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 36,
    color: GOLD,
    letterSpacing: 8,
    marginBottom: 8,
  },
  inviteSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: WHITE70,
    lineHeight: 17,
    marginBottom: 14,
  },
  inviteBtnRow: { flexDirection: 'row', gap: 10 },
  inviteBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteBtnCopy: { backgroundColor: WHITE12, borderWidth: 1, borderColor: WHITE12 },
  inviteBtnShare: { backgroundColor: TEAL },
  inviteBtnText: { fontFamily: 'Montserrat_600SemiBold', fontSize: 13, color: WHITE },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    backgroundColor: 'rgba(0,229,200,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,229,200,0.15)',
    marginBottom: 18,
  },
  privacyIcon: { fontSize: 16, marginTop: 1 },
  privacyText: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: WHITE70,
    lineHeight: 18,
  },
  sectionLabel: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 10,
    letterSpacing: 3,
    color: WHITE40,
    marginBottom: 12,
  },
  joinHint: { marginTop: 16, alignItems: 'center' },
  joinHintText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: WHITE40,
    textAlign: 'center',
  },
  dashboardBtnWrap: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
    backgroundColor: BG,
  },
  dashboardBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#020A14',
  },
});

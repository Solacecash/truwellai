import LegalDisclaimer from '@/components/legal/LegalDisclaimer';
import { BackHeader } from '@/components/ui/BackHeader';
import { SegmentedIndicator } from '@/components/ui/SegmentedIndicator';
import { BriefSectionsPreview } from '@/features/health-brief/BriefSectionsPreview';
import {
  buildBriefInputBundle,
  psychSnapshotFromOnboarding,
} from '@/lib/healthBrief/buildBriefInput';
import { invokeHealthBriefAssembler } from '@/lib/healthBrief/invokeAssembler';
import { hapticLight, hapticSuccess } from '@/lib/haptics';
import { LEGAL } from '@/lib/legalContent';
import { listChatSessions, loadChatMessages } from '@/lib/chatHistory';
import { sanitizePlainText } from '@/lib/sanitizePlainText';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useClinicalBriefUiStore } from '@/stores/clinicalBriefUiStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useTheme } from '@/theme/ThemeContext';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PatientHealthBriefScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user?.id);
  const profileEmail = useAuthStore((s) => s.session?.user?.email ?? null);

  const draftSections = useClinicalBriefUiStore((s) => s.draftSections);
  const setDraftSections = useClinicalBriefUiStore((s) => s.setDraftSections);
  const freeTextContext = useClinicalBriefUiStore((s) => s.freeTextContext);
  const setFreeTextContext = useClinicalBriefUiStore((s) => s.setFreeTextContext);

  const [assembledAtIso, setAssembledAtIso] = useState<string | null>(null);

  const onboardingSnap = useOnboardingStore((s) => ({
    healthGoal: s.healthGoal,
    weightRange: s.weightRange,
    painPoints: s.painPoints,
    activityLevel: s.activityLevel,
    dietStyle: s.dietStyle,
    dailyMinutes: s.dailyMinutes,
  }));

  const baseCtxQ = useQuery({
    queryKey: ['patient-brief-input-ctx', userId, profileEmail],
    enabled: !!userId,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const [prof, hp, sessions] = await Promise.all([
        supabase.from('profiles').select('display_name').eq('id', userId!).maybeSingle(),
        supabase
          .from('user_health_profiles')
          .select('age, biological_sex, conditions, allergens, activity_level')
          .eq('user_id', userId!)
          .maybeSingle(),
        listChatSessions(12),
      ]);
      const top = sessions.slice(0, 3);
      const messageLists = await Promise.all(top.map((t) => loadChatMessages(t.id)));
      const messages = messageLists.flat();
      const sessionTitles = sessions.map((se) => se.title);

      return {
        profile: {
          displayName: (prof.data?.display_name as string | null) ?? null,
          email: profileEmail ?? null,
        },
        healthProfile: {
          age: hp.data?.age != null ? Number(hp.data.age) : null,
          biologicalSex:
            hp.data?.biological_sex != null ? String(hp.data.biological_sex) : null,
          conditions: Array.isArray(hp.data?.conditions)
            ? (hp.data!.conditions as string[])
            : [],
          allergens: Array.isArray(hp.data?.allergens) ? (hp.data!.allergens as string[]) : [],
          activityLevel:
            hp.data?.activity_level != null ? String(hp.data.activity_level) : null,
        },
        messages,
        sessionTitles,
      };
    },
  });

  const segmentedValue = useMemo(() => {
    if (draftSections) return 67;
    if (baseCtxQ.isSuccess) return 34;
    return 10;
  }, [draftSections, baseCtxQ.isSuccess]);

  const assembleMutation = useMutation({
    mutationFn: async () => {
      const ctx = baseCtxQ.data;
      if (!ctx) throw new Error('Still loading your profile.');
      const safeNotes = sanitizePlainText(freeTextContext, 1200);
      const psych = psychSnapshotFromOnboarding(onboardingSnap);
      const bundle = buildBriefInputBundle({
        profile: ctx.profile,
        healthProfile: ctx.healthProfile,
        psych,
        messages: ctx.messages,
        sessionTitles: ctx.sessionTitles,
        userProvidedContext: safeNotes,
      });
      return invokeHealthBriefAssembler({
        bundle,
        useLlm: true,
      });
    },
    onSuccess: (res) => {
      const s = res.sections;
      const fixed = { ...s, briefVersion: 1 as const };
      setDraftSections(fixed);
      setAssembledAtIso(res.assembledAtIso);
      hapticSuccess();
    },
    onError: (e: unknown) => {
      Alert.alert('Brief preview failed', (e as Error).message ?? 'Unexpected error.');
    },
  });

  const baseLoading = baseCtxQ.isLoading;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg0 }]} edges={['top', 'bottom']}>
      <BackHeader title="Patient Health Brief" onBack={() => router.back()} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 72 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.lead, { color: theme.text2 }]}>
            Build a concise wellness outline from TruWell context you choose. Preview it here before
            you use it in conversations with your care team.
          </Text>

          <View style={styles.indicatorWrap}>
            <SegmentedIndicator value={segmentedValue} count={12} color={theme.teal} height={6} />
            <Text style={[styles.indicatorLabel, { color: theme.text3 }]}>
              Build context, then preview your brief
            </Text>
          </View>

          <LegalDisclaimer
            text={LEGAL.PATIENT_HEALTH_BRIEF_NOTICE}
            variant="card"
            expandable
            fullText={LEGAL.PATIENT_HEALTH_BRIEF_NOTICE}
          />

          <Text style={[styles.h, { color: theme.text1 }]}>Extras for this brief only</Text>
          <TextInput
            placeholder="Optional notes to include in this brief"
            placeholderTextColor={theme.text3}
            value={freeTextContext}
            onChangeText={(t) => {
              const safe = sanitizePlainText(t, 1200);
              setFreeTextContext(safe);
            }}
            style={[
              styles.input,
              { color: theme.text1, borderColor: theme.border, backgroundColor: theme.bg1 },
            ]}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              { backgroundColor: theme.teal },
              assembleMutation.isPending ? { opacity: 0.6 } : null,
            ]}
            onPress={() => {
              if (baseLoading) return;
              hapticLight();
              assembleMutation.mutate();
            }}
            disabled={assembleMutation.isPending || baseLoading || baseCtxQ.isError}
          >
            {assembleMutation.isPending ? (
              <ActivityIndicator color={theme.bg0} />
            ) : (
              <Text style={[styles.primaryBtnTxt, { color: theme.bg0 }]}>Generate preview</Text>
            )}
          </TouchableOpacity>

          {baseCtxQ.isError ? (
            <Text style={{ color: theme.red }}>
              Unable to load profile or chat excerpts. Pull to reopen Settings and try again.
            </Text>
          ) : null}

          {draftSections ? (
            <>
              <Text style={[styles.h, { color: theme.text1, marginTop: 8 }]}>Preview</Text>
              <BriefSectionsPreview sections={draftSections} />
            </>
          ) : (
            !assembleMutation.isPending &&
            baseCtxQ.isSuccess && (
              <Text style={[styles.helper, { color: theme.text3 }]}>
                Generate a preview to review every section.
              </Text>
            )
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 18, gap: 14, paddingBottom: 48 },
  lead: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },
  indicatorWrap: { gap: 6, marginVertical: 4 },
  indicatorLabel: { fontSize: 11, fontWeight: '800' },
  h: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
    marginBottom: -4,
  },
  helper: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  input: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    fontWeight: '600',
  },
  primaryBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnTxt: {
    fontSize: 15,
    fontWeight: '900',
  },
  recipients: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 8,
    gap: 8,
  },
  recipientRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  consentCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginVertical: 4,
  },
});

import { BackHeader } from '@/components/ui/BackHeader';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { AllergenSelector } from '@/components/profile/AllergenSelector';
import { hapticLight, hapticSuccess } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme/ThemeContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

// ── Constants ─────────────────────────────────────────────────────────────────

const CONDITIONS  = ['Eczema','Psoriasis','Asthma','Diabetes','PCOS','Autoimmune disorder','Cancer history','Heart condition','None','Other'] as const;
const SKIN_TYPES  = ['Normal','Dry','Oily','Combination','Sensitive','Acne-prone'] as const;
const SUN_OPTIONS = ['Low','Moderate','High'] as const;
const LIFESTYLE   = ['Smoker','Regular alcohol','High stress','Poor sleep','Sedentary job','Outdoor worker','Athlete'] as const;
const DIET_OPTIONS = ['None','Vegan','Vegetarian','Keto','Paleo','Gluten-Free','Halal','Kosher'] as const;
const ACTIVITY_OPTS = ['Sedentary','Light','Moderate','Active','Athlete'] as const;

type Theme = ReturnType<typeof useTheme>['theme'];

// ── Shared sub-components ──────────────────────────────────────────────────────

function SectionTitle({ label, theme }: { label: string; theme: Theme }) {
  return <Text style={[st.sectionTitle, { color: theme.text3 }]}>{label}</Text>;
}

function HelperNote({ text, theme }: { text: string; theme: Theme }) {
  return (
    <View style={st.helperRow}>
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={10} stroke={theme.text3} strokeWidth={1.5} />
        <Path d="M12 8v1M12 11v5" stroke={theme.text3} strokeWidth={1.8} strokeLinecap="round" />
      </Svg>
      <Text style={[st.helperText, { color: theme.text3 }]}>{text}</Text>
    </View>
  );
}

function PillGroup({ options, selected, onToggle, color, theme }: {
  options: readonly string[]; selected: string[]; onToggle: (v: string) => void; color?: string; theme: Theme;
}) {
  const c = color ?? theme.teal;
  return (
    <View style={st.pillWrap}>
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <TouchableOpacity key={opt} onPress={() => { hapticLight(); onToggle(opt); }}
            style={[st.pill, { backgroundColor: active ? `${c}18` : theme.bg2, borderColor: active ? c : theme.border }]}
          >
            <Text style={[st.pillText, { color: active ? c : theme.text3 }]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function HealthProfileSettingsScreen() {
  const router  = useRouter();
  const { theme } = useTheme();
  const qc      = useQueryClient();
  const session = useAuthStore((s) => s.session);
  const userId  = session?.user?.id;

  // form state
  const [allergies,    setAllergies]    = useState<string[]>([]);
  const [avoids,       setAvoids]       = useState('');
  const [conditions,   setConditions]   = useState<string[]>([]);
  const [medications,  setMedications]  = useState('');
  const [dietPref,     setDietPref]     = useState('None');
  const [activityLvl,  setActivityLvl]  = useState('');
  const [skinType,     setSkinType]     = useState('');
  const [sunExp,       setSunExp]       = useState('');
  const [city,         setCity]         = useState('');
  const [country,      setCountry]      = useState('');
  const [lifestyle,    setLifestyle]    = useState<string[]>([]);
  const [pregnant,     setPregnant]     = useState(false);
  const [avatarUrl,    setAvatarUrl]    = useState<string | null>(null);
  const [saving,       setSaving]       = useState(false);

  const hpQuery = useQuery({
    queryKey: ['user-health-profile', userId],
    enabled:  !!userId,
    staleTime: 10 * 60 * 1000,
    queryFn:  async () => {
      const { data } = await supabase
        .from('user_health_profiles')
        .select('allergies,avoids,conditions,medications,diet_preference,activity_level,skin_type,sun_exposure,city,country,lifestyle_habits,is_pregnant_or_breastfeeding')
        .eq('user_id', userId!)
        .maybeSingle();
      return data as Record<string, unknown> | null;
    },
  });

  const profileQuery = useQuery({
    queryKey: ['profile-avatar', userId],
    enabled:  !!userId,
    staleTime: 30 * 60 * 1000,
    queryFn:  async () => {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, display_name')
        .eq('id', userId!)
        .maybeSingle();
      return data as { avatar_url: string | null; display_name: string | null } | null;
    },
  });

  useEffect(() => {
    const d = hpQuery.data;
    if (!d) return;
    if (Array.isArray(d.allergies))  setAllergies(d.allergies as string[]);
    if (d.avoids)       setAvoids((d.avoids as string[]).join(', '));
    if (Array.isArray(d.conditions)) setConditions(d.conditions as string[]);
    if (d.medications)  setMedications((d.medications as string[]).join(', '));
    if (d.diet_preference) setDietPref(d.diet_preference as string);
    if (d.activity_level) setActivityLvl(d.activity_level as string);
    if (d.skin_type)    setSkinType(d.skin_type as string);
    if (d.sun_exposure) setSunExp(d.sun_exposure as string);
    if (d.city)         setCity(d.city as string);
    if (d.country)      setCountry(d.country as string);
    if (Array.isArray(d.lifestyle_habits)) setLifestyle(d.lifestyle_habits as string[]);
    if (typeof d.is_pregnant_or_breastfeeding === 'boolean') setPregnant(d.is_pregnant_or_breastfeeding);
  }, [hpQuery.data]);

  useEffect(() => {
    if (profileQuery.data?.avatar_url) setAvatarUrl(profileQuery.data.avatar_url);
  }, [profileQuery.data]);

  const split = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);

  const toggleMulti = (setter: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    setter((prev) => prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]);
  };

  const save = async () => {
    if (!userId) return;
    setSaving(true);
    hapticLight();
    const { error } = await supabase.from('user_health_profiles').upsert({
      user_id:                      userId,
      allergies,
      avoids:                       split(avoids),
      conditions,
      medications:                  split(medications),
      diet_preference:              dietPref === 'None' ? null : dietPref,
      activity_level:               activityLvl || null,
      skin_type:                    skinType    || null,
      sun_exposure:                 sunExp      || null,
      city:                         city.trim() || null,
      country:                      country.trim() || null,
      lifestyle_habits:             lifestyle,
      is_pregnant_or_breastfeeding: pregnant,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    setSaving(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      hapticSuccess();
      void qc.invalidateQueries({ queryKey: ['user-health-profile', userId] });
      router.back();
    }
  };

  const loading = hpQuery.isLoading;

  return (
    <SafeAreaView style={[st.safe, { backgroundColor: theme.bg0 }]} edges={['top']}>
      <BackHeader title="Health Profile" onBack={() => router.back()} />
      <KeyboardAvoidingView style={st.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
        <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {loading ? (
            <View style={st.skWrap}>
              {[0,1,2,3,4].map((i) => <SkeletonLoader key={i} width="100%" height={52} borderRadius={12} />)}
            </View>
          ) : (
            <>
              {/* Avatar */}
              {userId && (
                <AvatarUpload
                  userId={userId}
                  currentAvatarUrl={avatarUrl}
                  displayName={profileQuery.data?.display_name ?? undefined}
                  onUploadComplete={setAvatarUrl}
                />
              )}

              {/* Health Conditions */}
              <SectionTitle label="Health Conditions" theme={theme} />
              <HelperNote text="This helps us warn you about ingredients that may worsen your condition" theme={theme} />
              <PillGroup options={CONDITIONS} selected={conditions}
                onToggle={(v) => toggleMulti(setConditions, v)} theme={theme} />

              {/* Known Allergens */}
              <SectionTitle label="Known Allergens" theme={theme} />
              <HelperNote text="We will flag any product containing these before you use it" theme={theme} />
              <AllergenSelector selected={allergies} onToggle={(v) => toggleMulti(setAllergies, v)} />

              {/* Dietary Restrictions */}
              <SectionTitle label="Dietary Restrictions" theme={theme} />
              <HelperNote text="Your meal plans and product recommendations will respect these" theme={theme} />
              <PillGroup options={DIET_OPTIONS} selected={[dietPref]}
                onToggle={(v) => setDietPref(v === dietPref ? 'None' : v)} theme={theme} />

              {/* Activity level */}
              <SectionTitle label="Activity Level" theme={theme} />
              <HelperNote text="Used to calculate your daily calorie and hydration targets" theme={theme} />
              <PillGroup options={ACTIVITY_OPTS} selected={activityLvl ? [activityLvl] : []}
                onToggle={(v) => setActivityLvl(v === activityLvl ? '' : v)} theme={theme} color={theme.green} />

              {/* Skin type */}
              <SectionTitle label="Skin Type" theme={theme} />
              <PillGroup options={SKIN_TYPES} selected={skinType ? [skinType] : []}
                onToggle={(v) => setSkinType(v === skinType ? '' : v)} theme={theme} color={theme.purple} />

              {/* Sun exposure */}
              <SectionTitle label="Sun Exposure Level" theme={theme} />
              <PillGroup options={SUN_OPTIONS} selected={sunExp ? [sunExp] : []}
                onToggle={(v) => setSunExp(v === sunExp ? '' : v)} theme={theme} color={theme.gold} />

              {/* Ingredients to avoid */}
              <SectionTitle label="Ingredients to Avoid" theme={theme} />
              <TextInput
                style={[st.input, { backgroundColor: theme.bg2, borderColor: theme.border, color: theme.text1 }]}
                placeholder="e.g. artificial sweeteners, MSG" placeholderTextColor={theme.text3}
                value={avoids} onChangeText={setAvoids} multiline textAlignVertical="top"
              />

              {/* Medications */}
              <SectionTitle label="Medications" theme={theme} />
              <TextInput
                style={[st.input, { backgroundColor: theme.bg2, borderColor: theme.border, color: theme.text1 }]}
                placeholder="e.g. metformin, lisinopril" placeholderTextColor={theme.text3}
                value={medications} onChangeText={setMedications} multiline textAlignVertical="top"
              />

              {/* Location */}
              <SectionTitle label="Location (optional)" theme={theme} />
              <HelperNote text="Used for location-specific regulatory alerts" theme={theme} />
              <TextInput style={[st.input, { backgroundColor: theme.bg2, borderColor: theme.border, color: theme.text1, marginBottom: 8 }]}
                placeholder="City" placeholderTextColor={theme.text3} value={city} onChangeText={setCity} />
              <TextInput style={[st.input, { backgroundColor: theme.bg2, borderColor: theme.border, color: theme.text1 }]}
                placeholder="Country" placeholderTextColor={theme.text3} value={country} onChangeText={setCountry} />

              {/* Lifestyle habits */}
              <SectionTitle label="Lifestyle Habits" theme={theme} />
              <PillGroup options={LIFESTYLE} selected={lifestyle}
                onToggle={(v) => toggleMulti(setLifestyle, v)} theme={theme} color={theme.amber} />

              {/* Pregnant */}
              <View style={[st.switchRow, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[st.switchLabel, { color: theme.text1 }]}>Pregnant or Breastfeeding</Text>
                  <Text style={[st.switchSub,   { color: theme.text3 }]}>Adds extra safety checks</Text>
                </View>
                <Switch value={pregnant} onValueChange={(v) => { hapticLight(); setPregnant(v); }}
                  trackColor={{ false: theme.text4, true: theme.teal }} thumbColor={pregnant ? theme.bg0 : theme.text2} />
              </View>

              {/* Disclaimer */}
              <Text style={[st.disclaimer, { color: theme.text3 }]}>
                This information is used only to personalize your ingredient scans and wellness tips. It is never sold or shared with third parties.
              </Text>

              {/* Save */}
              <Pressable onPress={() => void save()} disabled={saving}
                style={[st.saveBtn, { backgroundColor: `${theme.teal}18`, borderColor: `${theme.teal}50` }, saving && { opacity: 0.6 }]}
              >
                <Text style={[st.saveText, { color: theme.teal }]}>{saving ? 'Saving...' : 'Save Health Profile'}</Text>
              </Pressable>
            </>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 48 },
  skWrap: { gap: 12 },

  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 20, marginBottom: 4 },
  helperRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 8 },
  helperText:   { flex: 1, fontSize: 11, fontStyle: 'italic', lineHeight: 16 },

  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, minHeight: 52, marginBottom: 4 },

  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  pill:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  pillText: { fontSize: 13, fontWeight: '600' },

  switchRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 16, marginBottom: 4 },
  switchLabel: { fontSize: 15, fontWeight: '700' },
  switchSub:   { fontSize: 12, marginTop: 2 },

  disclaimer: { fontSize: 11, lineHeight: 17, marginVertical: 16 },
  saveBtn:    { paddingVertical: 16, borderRadius: 18, borderWidth: 1, alignItems: 'center', marginTop: 8 },
  saveText:   { fontSize: 15, fontWeight: '800' },
});

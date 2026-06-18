import { hapticError, hapticSelection, hapticSuccess } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { SegmentedIndicator } from '@/components/ui/SegmentedIndicator';
import { useTheme } from '@/theme/ThemeContext';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { AllergenSelector } from '@/components/profile/AllergenSelector';

// ─── Constants ────────────────────────────────────────────────────────────────

const SEX_OPTIONS  = ['Male', 'Female', 'Prefer not to say'] as const;
const CONDITIONS   = ['Eczema','Psoriasis','Asthma','Diabetes','PCOS','Autoimmune disorder','Cancer history','Heart condition','None','Other'] as const;
const SKIN_TYPES   = ['Normal','Dry','Oily','Combination','Sensitive','Acne-prone'] as const;
const SUN_OPTIONS  = ['Low','Moderate','High'] as const;
const LIFESTYLE    = ['Smoker','Regular alcohol','High stress','Poor sleep','Sedentary job','Outdoor worker','Athlete'] as const;

type Theme = ReturnType<typeof useTheme>['theme'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ label, theme }: { label: string; theme: Theme }) {
  return <Text style={[s.sectionLabel, { color: theme.text3 }]}>{label}</Text>;
}

function HelperNote({ text, theme }: { text: string; theme: Theme }) {
  return (
    <View style={s.helperRow}>
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={10} stroke={theme.text3} strokeWidth={1.5} />
        <Path d="M12 8v1M12 11v5" stroke={theme.text3} strokeWidth={1.8} strokeLinecap="round" />
      </Svg>
      <Text style={[s.helperText, { color: theme.text3 }]}>{text}</Text>
    </View>
  );
}

function MultiPill({ options, selected, onToggle, theme }: { options: readonly string[]; selected: string[]; onToggle: (v: string) => void; theme: Theme }) {
  return (
    <View style={s.pillWrap}>
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <Pressable
            key={opt}
            onPress={() => { hapticSelection(); onToggle(opt); }}
            style={[s.pill, { backgroundColor: active ? theme.teal : theme.bg2, borderColor: active ? theme.teal : theme.border }]}
          >
            <Text style={[s.pillText, { color: active ? theme.bg0 : theme.text2 }]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HealthProfileScreen() {
  const { theme } = useTheme();
  const router    = useRouter();
  const session   = useAuthStore((s) => s.session);
  const userId    = session?.user?.id;

  const [loading,    setLoading]    = useState(false);
  const [age,        setAge]        = useState('');
  const [sex,        setSex]        = useState('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [allergens,  setAllergens]  = useState<string[]>([]);
  const [pregnant,   setPregnant]   = useState(false);
  const [ageError,   setAgeError]   = useState('');
  const [skinType,   setSkinType]   = useState('');
  const [sunExp,     setSunExp]     = useState('');
  const [city,       setCity]       = useState('');
  const [country,    setCountry]    = useState('');
  const [lifestyle,  setLifestyle]  = useState<string[]>([]);
  const [avatarUrl,  setAvatarUrl]  = useState<string | null>(null);

  const toggleMulti = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string, noneLabel = 'None') => {
    setter((prev) => {
      if (value === noneLabel) return prev.includes(noneLabel) ? [] : [noneLabel];
      const withoutNone = prev.filter((v) => v !== noneLabel);
      return withoutNone.includes(value) ? withoutNone.filter((v) => v !== value) : [...withoutNone, value];
    });
  };

  const handleNext = async () => {
    const parsed = parseInt(age, 10);
    if (!age || isNaN(parsed) || parsed < 1 || parsed > 120) {
      setAgeError('Please enter a valid age (1 to 120)'); hapticError(); return;
    }
    setAgeError('');
    if (!userId) { router.push('/(auth)/onboarding/preferences'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from('user_health_profiles').upsert({
        user_id:                      userId,
        age:                          parsed,
        biological_sex:               sex || null,
        conditions,
        allergens,
        is_pregnant_or_breastfeeding: pregnant,
        skin_type:                    skinType || null,
        sun_exposure:                 sunExp   || null,
        city:                         city.trim()    || null,
        country:                      country.trim() || null,
        lifestyle_habits:             lifestyle,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (error) throw error;
      hapticSuccess();
      router.push('/(auth)/onboarding/preferences');
    } catch { hapticError(); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg0 }]} edges={['top']}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <SegmentedIndicator value={33} count={3} color={theme.teal} height={6} style={s.segIndicator} />
          <Text style={[s.stepLabel, { color: theme.teal }]}>Step 1 of 3</Text>
          <Text style={[s.title,     { color: theme.text1 }]}>Tell us about your health</Text>
          <Text style={[s.subtitle,  { color: theme.text3 }]}>This makes every scan personal to you</Text>

          {/* Avatar */}
          {userId && (
            <AvatarUpload
              userId={userId}
              currentAvatarUrl={avatarUrl}
              displayName={session.user.email}
              onUploadComplete={setAvatarUrl}
            />
          )}

          {/* Age */}
          <SectionLabel label="Age" theme={theme} />
          <TextInput
            style={[s.textInput, { backgroundColor: theme.bg2, borderColor: ageError ? theme.red : theme.border, color: theme.text1 }]}
            value={age} onChangeText={setAge} placeholder="Your age" placeholderTextColor={theme.text4}
            keyboardType="numeric" maxLength={3} returnKeyType="done"
          />
          {ageError ? <Text style={[s.errorText, { color: theme.red }]}>{ageError}</Text> : null}

          {/* Biological sex */}
          <SectionLabel label="Biological Sex" theme={theme} />
          <View style={s.pillWrap}>
            {SEX_OPTIONS.map((opt) => {
              const active = sex === opt;
              return (
                <Pressable key={opt} onPress={() => { hapticSelection(); setSex(opt); }}
                  style={[s.pill, { backgroundColor: active ? theme.teal : theme.bg2, borderColor: active ? theme.teal : theme.border }]}
                >
                  <Text style={[s.pillText, { color: active ? theme.bg0 : theme.text2 }]}>{opt}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Health conditions */}
          <SectionLabel label="Health Conditions (select all that apply)" theme={theme} />
          <HelperNote text="This helps us warn you about ingredients that may worsen your condition" theme={theme} />
          <MultiPill options={CONDITIONS} selected={conditions} onToggle={(v) => toggleMulti(setConditions, v)} theme={theme} />

          {/* Allergens */}
          <SectionLabel label="Known Allergens (select all that apply)" theme={theme} />
          <HelperNote text="We will flag any product containing these before you use it" theme={theme} />
          <AllergenSelector selected={allergens} onToggle={(v) => toggleMulti(setAllergens, v, '')} />

          {/* Skin type */}
          <SectionLabel label="Skin Type" theme={theme} />
          <View style={s.pillWrap}>
            {SKIN_TYPES.map((opt) => {
              const active = skinType === opt;
              return (
                <Pressable key={opt} onPress={() => { hapticSelection(); setSkinType(active ? '' : opt); }}
                  style={[s.pill, { backgroundColor: active ? theme.teal : theme.bg2, borderColor: active ? theme.teal : theme.border }]}
                >
                  <Text style={[s.pillText, { color: active ? theme.bg0 : theme.text2 }]}>{opt}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Sun exposure */}
          <SectionLabel label="Sun Exposure Level" theme={theme} />
          <View style={s.pillWrap}>
            {SUN_OPTIONS.map((opt) => {
              const active = sunExp === opt;
              return (
                <Pressable key={opt} onPress={() => { hapticSelection(); setSunExp(active ? '' : opt); }}
                  style={[s.pill, { backgroundColor: active ? theme.gold : theme.bg2, borderColor: active ? theme.gold : theme.border }]}
                >
                  <Text style={[s.pillText, { color: active ? theme.bg0 : theme.text2 }]}>{opt}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Location */}
          <SectionLabel label="Location (optional)" theme={theme} />
          <HelperNote text="Used for location-specific regulatory alerts" theme={theme} />
          <TextInput
            style={[s.textInput, { backgroundColor: theme.bg2, borderColor: theme.border, color: theme.text1, marginBottom: 8 }]}
            value={city} onChangeText={setCity} placeholder="City" placeholderTextColor={theme.text4}
          />
          <TextInput
            style={[s.textInput, { backgroundColor: theme.bg2, borderColor: theme.border, color: theme.text1 }]}
            value={country} onChangeText={setCountry} placeholder="Country" placeholderTextColor={theme.text4}
          />

          {/* Lifestyle habits */}
          <SectionLabel label="Lifestyle Habits (select all that apply)" theme={theme} />
          <MultiPill options={LIFESTYLE} selected={lifestyle} onToggle={(v) => toggleMulti(setLifestyle, v, '')} theme={theme} />

          {/* Pregnant */}
          <View style={[s.switchRow, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
            <View style={s.switchInfo}>
              <Text style={[s.switchLabel, { color: theme.text1 }]}>Pregnant or Breastfeeding</Text>
              <Text style={[s.switchSub,   { color: theme.text3 }]}>Adds extra safety checks</Text>
            </View>
            <Switch value={pregnant} onValueChange={(v) => { hapticSelection(); setPregnant(v); }}
              trackColor={{ false: theme.text4, true: theme.teal }} thumbColor={pregnant ? theme.bg0 : theme.text2} />
          </View>

          {/* Next */}
          <Pressable style={[s.nextBtn, { backgroundColor: theme.teal }, loading && { opacity: 0.6 }]}
            onPress={() => void handleNext()} disabled={loading}>
            <Text style={[s.nextText, { color: theme.bg0 }]}>{loading ? 'Saving…' : 'Next →'}</Text>
          </Pressable>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1 },
  flex:   { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 16 },

  segIndicator: { marginBottom: 20 },

  stepLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  title:     { fontSize: 24, fontWeight: '900', letterSpacing: -0.5, marginBottom: 6 },
  subtitle:  { fontSize: 14, lineHeight: 20, marginBottom: 24 },

  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6, marginTop: 20 },

  helperRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 10 },
  helperText: { flex: 1, fontSize: 11, fontStyle: 'italic', lineHeight: 16 },

  textInput: { height: 52, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
  errorText: { fontSize: 12, marginBottom: 8 },

  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  pill:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, borderWidth: 1 },
  pillText: { fontSize: 13, fontWeight: '600' },

  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 20, marginBottom: 4 },
  switchInfo:  { flex: 1, marginRight: 12 },
  switchLabel: { fontSize: 15, fontWeight: '700' },
  switchSub:   { fontSize: 12, marginTop: 2 },

  nextBtn:  { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 28 },
  nextText: { fontSize: 16, fontWeight: '800' },
});

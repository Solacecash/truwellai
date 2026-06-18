import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { HomeRemedySection } from './HomeRemedySection';
import EmergencyNotice from '@/components/legal/EmergencyNotice';

// ---------------------------------------------------------------------------
// Emergency telephone
// ---------------------------------------------------------------------------

function emergencyTel(country?: string | null): string {
  const c = (country ?? 'US').toUpperCase();
  if (c === 'GB' || c === 'UK') return '999';
  if (c === 'NG') return '112';
  if (
    ['DE', 'FR', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'FI', 'PL', 'IE', 'EU'].includes(c)
  )
    return '112';
  return '911';
}

// ---------------------------------------------------------------------------
// First aid guides (expanded)
// ---------------------------------------------------------------------------

type Severity = 'critical' | 'urgent' | 'mild';

interface FirstAidGuide {
  id: string;
  title: string;
  icon: string;
  severity: Severity;
  steps: string[];
}

const FIRST_AID_GUIDES: FirstAidGuide[] = [
  {
    id: 'heart-attack',
    title: 'Heart Attack',
    icon: '\u2764\uFE0F',
    severity: 'critical',
    steps: [
      'Call emergency services immediately -- do not drive yourself',
      'Chew one adult aspirin (325mg) if not allergic and not contraindicated',
      'Loosen tight clothing around neck and chest',
      'Sit or lie in the position that is most comfortable',
      'Stay calm and stay still -- exertion worsens the attack',
      'If unconscious and not breathing: begin CPR',
    ],
  },
  {
    id: 'snake-bite',
    title: 'Snake Bite',
    icon: '\uD83D\uDC0D',
    severity: 'critical',
    steps: [
      'Call emergency services immediately -- all snake bites are emergencies',
      'Keep the bitten limb BELOW heart level at all times',
      'Keep the person as still as possible -- movement spreads venom faster',
      'Remove rings, watches, or tight clothing near the bite',
      'Mark the edge of swelling with a pen and note the time',
      'DO NOT: cut the wound, suck out venom, apply ice, apply a tourniquet, or give alcohol',
      'Try to remember the snake colour and pattern -- do NOT attempt to catch it',
      'If possible, photograph the snake from a safe distance for medical staff',
    ],
  },
  {
    id: 'scorpion-sting',
    title: 'Scorpion Sting',
    icon: '\uD83E\uDD82',
    severity: 'critical',
    steps: [
      'Call emergency services -- scorpion stings can be fatal especially in children',
      'Keep the person calm and still -- anxiety increases venom spread',
      'Clean the sting site with soap and water',
      'Apply a cool compress (not ice directly) to reduce pain',
      'Keep the stung area below heart level',
      'WARNING: difficulty breathing, muscle twitching, drooling, blurred vision -- these need immediate hospital care',
      'DO NOT: apply tourniquet, cut the wound, or give alcohol',
      'Note the time of the sting for medical staff',
    ],
  },
  {
    id: 'spider-bite',
    title: 'Spider Bite',
    icon: '\uD83D\uDD77\uFE0F',
    severity: 'urgent',
    steps: [
      'Wash the bite site thoroughly with soap and water',
      'Apply a cold compress to reduce swelling and pain',
      'Keep the bitten area elevated if possible',
      'Monitor for symptoms: spreading redness, blistering, nausea, muscle cramps',
      'If black widow or brown recluse suspected: go to emergency immediately',
      'For children, elderly, or anyone with severe symptoms: call emergency services',
      'Take a photo of the spider if possible -- do NOT handle it',
    ],
  },
  {
    id: 'bee-sting',
    title: 'Bee or Wasp Sting',
    icon: '\uD83D\uDC1D',
    severity: 'urgent',
    steps: [
      'Remove the stinger immediately by scraping it out sideways with a credit card -- do not squeeze',
      'Wash the area with soap and water',
      'Apply a cold compress for 10 minutes to reduce swelling',
      'Take an antihistamine to reduce itching if available',
      'WARNING: anaphylaxis signs: hives spreading beyond sting, throat tightening, difficulty breathing, dizziness',
      'If anaphylaxis signs appear: use EpiPen if available and call emergency immediately',
      'Keep the person lying flat with legs elevated unless having difficulty breathing',
    ],
  },
  {
    id: 'choking-adult',
    title: 'Choking -- Adult',
    icon: '\uD83E\uDEC1',
    severity: 'critical',
    steps: [
      'Ask loudly: Are you choking? If they cannot speak or cough effectively -- act now',
      'Give 5 firm back blows between shoulder blades with heel of hand',
      'Give 5 abdominal thrusts: stand behind, fist above navel, sharp inward and upward pull',
      'Alternate 5 back blows and 5 abdominal thrusts until object clears',
      'If person becomes unconscious: call emergency and begin CPR',
      'After successful removal: always seek medical attention -- internal injuries may occur',
    ],
  },
  {
    id: 'choking-child',
    title: 'Choking -- Child Under 1 Year',
    icon: '\uD83D\uDC76',
    severity: 'critical',
    steps: [
      'Call emergency services immediately',
      'Hold baby face-down on your forearm, head lower than chest',
      'Give 5 gentle back blows between shoulder blades with 2 fingers',
      'Turn face-up on your forearm, give 5 chest thrusts with 2 fingers on breastbone',
      'Look in mouth -- only remove object if clearly visible',
      'Alternate back blows and chest thrusts until object clears or emergency arrives',
      'DO NOT: do abdominal thrusts on infants under 1 year',
      'Begin infant CPR if baby becomes unresponsive',
    ],
  },
  {
    id: 'drowning',
    title: 'Drowning',
    icon: '\uD83C\uDF0A',
    severity: 'critical',
    steps: [
      'Call emergency services immediately',
      'Only enter water if you are a trained swimmer -- use a rope, pole, or floatation device instead',
      'Once out of water: check for breathing',
      'If not breathing: begin CPR immediately -- 30 chest compressions, 2 rescue breaths',
      'If breathing: place in recovery position on their side',
      'Keep them warm -- remove wet clothing, cover with blanket',
      'Even if they appear recovered: all drowning victims must go to hospital for evaluation',
      'Secondary drowning can occur hours later even after apparent recovery',
    ],
  },
  {
    id: 'severe-bleeding',
    title: 'Severe Bleeding',
    icon: '\uD83E\uDE78',
    severity: 'critical',
    steps: [
      'Call emergency services for severe uncontrolled bleeding',
      'Apply firm direct pressure with a clean cloth or bandage',
      'DO NOT: remove the cloth if it soaks through -- add more on top',
      'Elevate the injured area above heart level if possible',
      'For limb bleeding: apply a tourniquet 5-7cm above the wound if bleeding is life-threatening',
      'Note the time tourniquet was applied and tell medical staff',
      'Keep the person warm and lying still to prevent shock',
    ],
  },
  {
    id: 'burn',
    title: 'Burns',
    icon: '\uD83D\uDD25',
    severity: 'urgent',
    steps: [
      'Cool the burn with cool (not cold) running water for 20 full minutes',
      'Remove jewellery and clothing near the burn -- but not if stuck to skin',
      'Cover loosely with a clean non-fluffy material or cling film',
      'DO NOT: use ice, butter, toothpaste, or any cream',
      'DO NOT: burst blisters -- this increases infection risk',
      'For chemical burns: brush off dry chemical first, then rinse with water for 20 minutes',
      'Seek emergency care for: burns larger than palm size, burns on face/hands/genitals/joints, burns in children or elderly',
      'For electrical burns: always go to hospital -- internal damage may not be visible',
    ],
  },
  {
    id: 'seizure',
    title: 'Seizure',
    icon: '\u26A1',
    severity: 'urgent',
    steps: [
      'Stay calm -- most seizures end within 2 minutes',
      'Clear the area of hard or sharp objects',
      'DO NOT: restrain the person -- do not hold them down',
      'DO NOT: put anything in their mouth -- this is dangerous',
      'Time the seizure from start to finish',
      'Place something soft under their head',
      'After shaking stops: roll them onto their side (recovery position)',
      'Call emergency if: first seizure ever, lasts more than 5 minutes, person does not regain consciousness, injury occurred, pregnant, or diabetic',
    ],
  },
  {
    id: 'anaphylaxis',
    title: 'Severe Allergic Reaction',
    icon: '\u26A0\uFE0F',
    severity: 'critical',
    steps: [
      'Call emergency services immediately -- anaphylaxis is life-threatening',
      'Use an EpiPen or adrenaline auto-injector if available -- inject into outer thigh',
      'Lie the person flat -- raise their legs unless breathing is difficult',
      'If they have breathing difficulty: let them sit up',
      'A second EpiPen dose can be given after 5 minutes if no improvement',
      'Even if they improve: they MUST go to hospital -- symptoms can return hours later',
      'WARNING: widespread hives, throat tightening, difficulty breathing, rapid weak pulse, vomiting, loss of consciousness',
    ],
  },
  {
    id: 'fracture',
    title: 'Broken Bone',
    icon: '\uD83E\uDDB4',
    severity: 'urgent',
    steps: [
      'DO NOT: try to straighten or move the injured area',
      'Immobilise the area in the position found -- use rolled clothing or magazines as splint',
      'Apply ice wrapped in cloth to reduce swelling -- 20 minutes on, 20 minutes off',
      'Elevate the injured limb if possible',
      'For open fractures (bone visible): cover with clean cloth, do not push bone back in',
      'Go to emergency or call ambulance -- do not drive if arm fracture, do not walk on leg fracture',
      'For suspected spinal injury: do NOT move the person -- call emergency only',
    ],
  },
  {
    id: 'stroke',
    title: 'Stroke',
    icon: '\uD83E\uDDE0',
    severity: 'critical',
    steps: [
      'Use the FAST test every time you suspect stroke',
      'F -- Face: Ask them to smile. Is one side drooping?',
      'A -- Arms: Ask them to raise both arms. Does one drift down?',
      'S -- Speech: Ask them to repeat a simple phrase. Is it slurred or strange?',
      'T -- Time: If any of these are YES -- call emergency immediately',
      'Note the exact time symptoms started -- this determines treatment options',
      'Keep them comfortable and still -- do not give food or water',
      'DO NOT: give aspirin for stroke -- only a doctor can determine stroke type',
    ],
  },
  {
    id: 'poisoning',
    title: 'Poisoning',
    icon: '\u2620\uFE0F',
    severity: 'critical',
    steps: [
      'Call poison control or emergency services immediately',
      'DO NOT: induce vomiting unless specifically instructed by poison control',
      'Keep the container or packaging -- tell medical staff what was ingested',
      'DO NOT: give food, water, or milk unless instructed',
      'For skin contact: remove contaminated clothing and rinse skin with water for 15 minutes',
      'For eye contact: flush eye with water for 15 minutes',
      'If unconscious: place in recovery position and monitor breathing',
      'Note the time and estimated amount ingested',
    ],
  },
  {
    id: 'electric-shock',
    title: 'Electric Shock',
    icon: '\u26A1',
    severity: 'critical',
    steps: [
      'DO NOT: touch the person while they are still in contact with the electricity source',
      'Switch off the power at the mains if possible',
      'If you cannot switch off: use a dry non-conductive object (wooden broom handle) to move source away',
      'Call emergency services',
      'Check for breathing -- begin CPR if not breathing',
      'Treat any burns with cool water',
      'All electric shock victims must go to hospital -- internal injuries may not be visible',
      'For high voltage: keep 18 metres away and wait for emergency services',
    ],
  },
  {
    id: 'heat-stroke',
    title: 'Heat Stroke',
    icon: '\u2600\uFE0F',
    severity: 'critical',
    steps: [
      'Call emergency services -- heat stroke is a medical emergency',
      'Move to a cool shaded area immediately',
      'Remove excess clothing',
      'Cool rapidly: apply cold wet cloths to neck, armpits, and groin',
      'Fan the person while misting with cool water',
      'If conscious: give cool water to drink in small sips',
      'DO NOT: give water if unconscious or confused',
      'Monitor temperature -- keep cooling until emergency services arrive or temperature drops',
    ],
  },
  {
    id: 'diabetic-emergency',
    title: 'Diabetic Emergency',
    icon: '\uD83E\uDE7A',
    severity: 'urgent',
    steps: [
      'Low blood sugar signs: shaking, sweating, confusion, rapid heartbeat, pale skin',
      'If conscious and able to swallow: give 15-20g of fast sugar -- fruit juice, glucose tablets, or sugary drink',
      'Recheck in 15 minutes -- if no improvement, give another 15g sugar',
      'Once recovered: give a snack with slow-release carbohydrate',
      'If unconscious: DO NOT give anything by mouth -- call emergency immediately',
      'Place unconscious person in recovery position',
      'High blood sugar (hyperglycaemia) develops slowly -- always seek medical advice',
    ],
  },
  {
    id: 'child-fall',
    title: 'Child Fall and Head Injury',
    icon: '\uD83D\uDC66',
    severity: 'urgent',
    steps: [
      'Keep the child still and calm -- do not pick them up immediately',
      'Check for consciousness: do they respond to their name?',
      'Call emergency if: unconscious, vomiting more than once, seizure, unequal pupils, won\'t stop crying, severe headache',
      'For minor bumps: apply cold compress wrapped in cloth for 20 minutes',
      'Monitor for 24 hours: wake them every 2-3 hours at night to check responsiveness',
      'Seek medical attention if: increased sleepiness, confusion, repeated vomiting, or symptoms worsen',
      'DO NOT: give pain medication without medical advice for head injuries',
    ],
  },
  {
    id: 'child-swallowed',
    title: 'Child Swallowed Foreign Object',
    icon: '\uD83D\uDD35',
    severity: 'critical',
    steps: [
      'Call emergency services or poison control immediately',
      'DO NOT: induce vomiting',
      'DO NOT: try to remove with fingers -- you may push it deeper',
      'If choking with coughing or inability to breathe: treat as choking emergency',
      'If they swallowed a battery: this is an emergency -- go to hospital immediately, batteries can cause severe internal burns',
      'If they swallowed a magnet: go to hospital -- multiple magnets can attract through intestinal walls',
      'For smooth objects like coins: monitor for symptoms and follow medical advice',
      'Note what was swallowed and when',
    ],
  },
  {
    id: 'nosebleed',
    title: 'Nosebleed',
    icon: '\uD83D\uDC43',
    severity: 'mild',
    steps: [
      'Sit upright and lean slightly forward -- do NOT tilt head back',
      'Pinch the soft part of the nose firmly just below the bony bridge',
      'Breathe through the mouth',
      'Hold for 10-15 minutes without releasing pressure to check',
      'Apply a cold compress to the bridge of the nose',
      'DO NOT: stuff tissues deep into the nostril',
      'Seek medical help if: bleeding does not stop after 20-30 minutes, bleeding is heavy, caused by a head injury, or person is on blood thinners',
    ],
  },
  {
    id: 'eye-injury',
    title: 'Eye Injury',
    icon: '\uD83D\uDC41\uFE0F',
    severity: 'urgent',
    steps: [
      'DO NOT: rub the eye',
      'For chemical exposure: flush immediately with clean water for 15 minutes',
      'For foreign objects: try blinking rapidly to dislodge -- flush with water',
      'For embedded objects: DO NOT remove -- cover with a paper cup and go to hospital',
      'For blunt trauma (punch/hit): apply cold compress gently around (not on) the eye',
      'Seek emergency care if: vision is blurred or lost, eye is cut or bleeding, object is embedded, pupil appears irregular',
    ],
  },
];

const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, urgent: 1, mild: 2 };

const SEVERITY_CONFIG: Record<Severity, { label: string; bg: string; text: string }> = {
  critical: { label: 'CRITICAL -- Call Emergency', bg: '#FF4C2E', text: '#FFFFFF' },
  urgent: { label: 'URGENT', bg: '#FF7850', text: '#1A1A1A' },
  mild: { label: 'SELF-MANAGE', bg: '#00C050', text: '#1A1A1A' },
};

// ---------------------------------------------------------------------------
// Home remedies now live in lib/homeRemedies.ts and render via HomeRemedySection
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// XP Float for first-aid reading
// ---------------------------------------------------------------------------

function XpFloatSmall({ onDone }: { onDone: () => void }) {
  const { theme } = useTheme();
  const ty = useSharedValue(0);
  const op = useSharedValue(1);

  useEffect(() => {
    ty.value = withTiming(-30, { duration: 1000 });
    op.value = withTiming(0, { duration: 1000 });
    const t = setTimeout(onDone, 1050);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const anim = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
    opacity: op.value,
  }));

  return (
    <Animated.Text
      style={[{ position: 'absolute', top: -4, right: 12, fontSize: 12, fontWeight: '900', color: theme.gold, zIndex: 20 }, anim]}
    >
      +2 XP
    </Animated.Text>
  );
}

// ---------------------------------------------------------------------------
// First Aid Card (redesigned)
// ---------------------------------------------------------------------------

const FirstAidCard = React.memo(function FirstAidCard({
  guide,
  isExpanded,
  onExpand,
}: {
  guide: FirstAidGuide;
  isExpanded: boolean;
  onExpand: (id: string) => void;
}) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const progress = useSharedValue(0);
  const chevronRotate = useSharedValue(0);
  const [showXp, setShowXp] = useState(false);

  const sev = SEVERITY_CONFIG[guide.severity];
  const stripColor =
    guide.severity === 'critical' ? theme.red :
    guide.severity === 'urgent' ? theme.amber : theme.green;

  useEffect(() => {
    progress.value = withTiming(expanded ? 1 : 0, { duration: 350, easing: Easing.inOut(Easing.ease) });
    chevronRotate.value = withTiming(expanded ? 180 : 0, { duration: 300 });
  }, [expanded, progress, chevronRotate]);

  const bodyStyle = useAnimatedStyle(() => ({
    maxHeight: progress.value * 1200,
    opacity: progress.value,
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotate.value}deg` }],
  }));

  const toggleExpand = () => {
    const willExpand = !expanded;
    setExpanded(willExpand);
    if (willExpand && !isExpanded) {
      onExpand(guide.id);
      setShowXp(true);
    }
  };

  return (
    <View style={[faStyles.card, { borderColor: theme.border, backgroundColor: theme.bg2 }]}>
      {/* Severity strip */}
      <View style={[faStyles.strip, { backgroundColor: stripColor }]} />

      <View style={faStyles.cardContent}>
        {/* Header */}
        <Pressable onPress={toggleExpand} style={faStyles.cardHead}>
          <Text style={faStyles.icon}>{guide.icon}</Text>
          <View style={faStyles.headInfo}>
            <Text style={[faStyles.cardTitle, { color: theme.text1 }]}>{guide.title}</Text>
            <View style={[faStyles.badge, { backgroundColor: sev.bg }]}>
              <Text style={[faStyles.badgeText, { color: sev.text }]}>{sev.label}</Text>
            </View>
          </View>
          <Animated.View style={chevronStyle}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path d="M6 9l6 6 6-6" stroke={theme.text3} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Animated.View>
        </Pressable>

        {/* XP float */}
        {showXp && <XpFloatSmall onDone={() => setShowXp(false)} />}

        {/* Steps */}
        <Animated.View style={[faStyles.cardBody, bodyStyle]}>
          {guide.steps.map((step, i) => {
            const isDontStep = /^DO NOT/i.test(step);
            const isWarning = /^WARNING/i.test(step);
            const altBg = i % 2 === 1 ? `${theme.text3}08` : 'transparent';

            return (
              <View key={i} style={[faStyles.stepRow, { backgroundColor: altBg }]}>
                <View style={[faStyles.stepNum, { backgroundColor: theme.teal }]}>
                  <Text style={faStyles.stepNumText}>{i + 1}</Text>
                </View>
                <View style={faStyles.stepContent}>
                  {isDontStep && (
                    <View style={[faStyles.stepPill, { backgroundColor: `${theme.red}20` }]}>
                      <Text style={[faStyles.stepPillText, { color: theme.red }]}>{'\u26D4'} DO NOT</Text>
                    </View>
                  )}
                  {isWarning && !isDontStep && (
                    <View style={[faStyles.stepPill, { backgroundColor: `${theme.amber}20` }]}>
                      <Text style={[faStyles.stepPillText, { color: theme.amber }]}>{'\u26A0\uFE0F'} WARNING</Text>
                    </View>
                  )}
                  <Text style={[faStyles.stepText, { color: theme.text2 }]}>
                    {isDontStep ? step.replace(/^DO NOT:\s*/i, '') : isWarning ? step.replace(/^WARNING:\s*/i, '') : step}
                  </Text>
                </View>
              </View>
            );
          })}
        </Animated.View>
      </View>
    </View>
  );
}, (prev, next) =>
  prev.guide.id === next.guide.id &&
  prev.isExpanded === next.isExpanded
);

const faStyles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, marginBottom: 8, overflow: 'hidden', flexDirection: 'row' },
  strip: { width: 4 },
  cardContent: { flex: 1 },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  icon: { fontSize: 22 },
  headInfo: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 14, fontWeight: '800' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  cardBody: { overflow: 'hidden', paddingBottom: 4 },
  stepRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6, gap: 10, alignItems: 'flex-start' },
  stepNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  stepContent: { flex: 1, gap: 2 },
  stepPill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 2 },
  stepPillText: { fontSize: 10, fontWeight: '800' },
  stepText: { fontSize: 13, lineHeight: 20, fontWeight: '500' },
});

// ---------------------------------------------------------------------------
// Search bar
// ---------------------------------------------------------------------------

function SearchBar({ value, onChangeText, theme }: { value: string; onChangeText: (t: string) => void; theme: ReturnType<typeof useTheme>['theme'] }) {
  return (
    <View style={[searchStyles.wrap, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path d="M21 21l-5.2-5.2M11 19a8 8 0 100-16 8 8 0 000 16z" stroke={theme.text3} strokeWidth={2} strokeLinecap="round" />
      </Svg>
      <TextInput
        style={[searchStyles.input, { color: theme.text1 }]}
        placeholder="Search first aid guides..."
        placeholderTextColor={theme.text3}
        value={value}
        onChangeText={onChangeText}
        autoCorrect={false}
      />
    </View>
  );
}

const searchStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10 },
  input: { flex: 1, fontSize: 13, fontWeight: '500', padding: 0 },
});

// ---------------------------------------------------------------------------
// Main EmergencySheet
// ---------------------------------------------------------------------------

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function EmergencySheet({ visible, onClose }: Props) {
  const { theme } = useTheme();
  const uid = useAuthStore((s) => s.session?.user?.id);
  const [hospBusy, setHospBusy] = useState(false);
  const [faOpen, setFaOpen] = useState(true);
  const [hrOpen, setHrOpen] = useState(false);
  const [faSearch, setFaSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(faSearch), 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [faSearch]);

  const sortedGuides = useMemo(() =>
    [...FIRST_AID_GUIDES].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]),
  []);

  const filteredGuides = useMemo(() => {
    if (!debouncedSearch.trim()) return sortedGuides;
    const q = debouncedSearch.toLowerCase();
    return sortedGuides.filter((g) => g.title.toLowerCase().includes(q));
  }, [sortedGuides, debouncedSearch]);

  const countryQ = useQuery({
    queryKey: ['emergency-country', uid],
    enabled: visible && !!uid,
    queryFn: async () => {
      const { data } = await supabase
        .from('user_health_profiles')
        .select('country')
        .eq('user_id', uid!)
        .maybeSingle();
      return (data as { country?: string } | null)?.country ?? null;
    },
  });

  const tel = emergencyTel(countryQ.data);

  const callEmergency = useCallback(() => {
    void Linking.openURL(`tel:${tel}`);
  }, [tel]);

  const openHospitals = useCallback(async () => {
    setHospBusy(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        await Linking.openURL('https://www.google.com/maps/search/hospital+near+me');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = pos.coords;
      await Linking.openURL(
        `https://www.google.com/maps/search/hospital/@${latitude},${longitude},14z`
      );
    } catch {
      await Linking.openURL('https://www.google.com/maps/search/hospital+near+me');
    } finally {
      setHospBusy(false);
    }
  }, []);

  const handleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: theme.bg1, borderColor: theme.border }]} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <Text style={[styles.sheetTitle, { color: theme.text1 }]}>Emergency help</Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <Text style={[styles.disclaimerText, { color: theme.text3 }]}>
              For life-threatening emergencies, call your local emergency number immediately. This guide provides general information only and is not a substitute for professional medical care.
            </Text>
            <Text style={[styles.sectionLbl, { color: theme.text3 }]}>Emergency call</Text>
            <TouchableOpacity
              style={[styles.callBtn, { backgroundColor: theme.red }]}
              onPress={callEmergency}
              activeOpacity={0.85}
            >
              <Text style={[styles.callBtnTxt, { color: '#FFFFFF' }]}>Call Emergency Services ({tel})</Text>
            </TouchableOpacity>

            <Text style={[styles.sectionLbl, { color: theme.text3, marginTop: 18 }]}>Find nearest hospital</Text>
            <TouchableOpacity
              style={[styles.mapBtn, { borderColor: theme.teal, backgroundColor: `${theme.teal}12` }]}
              onPress={() => void openHospitals()}
              disabled={hospBusy}
            >
              <Text style={[styles.mapBtnTxt, { color: theme.teal }]}>
                {hospBusy ? 'Finding hospitals near you...' : 'Open maps: hospitals near me'}
              </Text>
            </TouchableOpacity>

            {/* First aid section */}
            <TouchableOpacity
              style={[styles.sectionToggle, { borderColor: theme.border }]}
              onPress={() => setFaOpen((v) => !v)}
            >
              <Text style={[styles.sectionToggleTxt, { color: theme.text1 }]}>First aid guides</Text>
              <Text style={{ color: theme.teal }}>{faOpen ? '\u25BC' : '\u25B6'}</Text>
            </TouchableOpacity>
            {faOpen && (
              <>
                <SearchBar value={faSearch} onChangeText={setFaSearch} theme={theme} />
                {filteredGuides.length === 0 ? (
                  <Text style={[styles.emptyText, { color: theme.text3 }]}>
                    No results for "{debouncedSearch}"
                  </Text>
                ) : (
                  filteredGuides.map((guide) => (
                    <FirstAidCard
                      key={guide.id}
                      guide={guide}
                      isExpanded={expandedIds.has(guide.id)}
                      onExpand={handleExpand}
                    />
                  ))
                )}
              </>
            )}

            {/* Remedies section */}
            <TouchableOpacity
              style={[styles.sectionToggle, { borderColor: theme.border, marginTop: 12 }]}
              onPress={() => setHrOpen((v) => !v)}
            >
              <Text style={[styles.sectionToggleTxt, { color: theme.text1 }]}>Home remedies</Text>
              <Text style={{ color: theme.teal }}>{hrOpen ? '\u25BC' : '\u25B6'}</Text>
            </TouchableOpacity>
            {hrOpen && <HomeRemedySection />}

            <EmergencyNotice />
          </ScrollView>

          <TouchableOpacity onPress={onClose} style={styles.closeFooter}>
            <Text style={{ color: theme.text3, fontWeight: '800' }}>Close</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    paddingBottom: 12,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  sheetTitle: { fontSize: 18, fontWeight: '900', textAlign: 'center', marginTop: 12, marginBottom: 8 },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  disclaimerText: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  sectionLbl: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 },
  callBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  callBtnTxt: { fontSize: 16, fontWeight: '900' },
  mapBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1 },
  mapBtnTxt: { fontSize: 14, fontWeight: '800', textAlign: 'center' },
  sectionToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  sectionToggleTxt: { fontSize: 15, fontWeight: '800' },
  closeFooter: { alignItems: 'center', paddingVertical: 14 },
  emptyText: { fontSize: 13, fontWeight: '500', textAlign: 'center', paddingVertical: 20 },
});

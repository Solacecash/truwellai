import { hapticMedium } from '@/lib/haptics';
import { useTheme } from '@/theme/ThemeContext';
import { useRouter } from 'expo-router';
import { Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Which feature triggered the paywall — affects copy. */
  feature: 'listen' | 'speak' | 'history';
}

function MicIcon({ color, size = 32 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={9} y={2} width={6} height={13} rx={3} stroke={color} strokeWidth={2} />
      <Path
        d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function SpeakerIcon({ color, size = 32 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9v6h4l5 4V5L7 9H3z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M15 9c1.5 1 2.5 2.5 2.5 3s-1 2-2.5 3M18 6c3 2 4.5 4 4.5 6s-1.5 4-4.5 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function SparkleIcon({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6zM19 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z"
        fill={color}
      />
    </Svg>
  );
}

function HistoryIcon({ color, size = 32 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 12a8 8 0 1 0 2.5-5.8M4 4v4h4M12 7v5l3 2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function VoicePaywallModal({ visible, onClose, feature }: Props) {
  const { theme } = useTheme();
  const router = useRouter();

  const isSpeak = feature === 'speak';
  const isHistory = feature === 'history';

  const title = isHistory
    ? 'Unlock chat history'
    : isSpeak
      ? 'Talk to TruWell'
      : 'Listen to replies';

  const lead = isHistory
    ? 'Keep every conversation with TruWell AI. Revisit past answers, continue threads, and pick up right where you left off on any device.'
    : isSpeak
      ? 'Speak to the assistant instead of typing. Hands-free, in your language.'
      : 'Hear every reply read aloud in your choice of six ultra-realistic human voices.';

  const benefits = isHistory
    ? [
        { label: 'Unlimited saved conversations, synced across your devices' },
        { label: 'Rename, search, and delete past chats' },
        { label: 'Continue any thread without losing context' },
        { label: 'Everything in Pro: voice chat, alerts, priority support' },
      ]
    : [
        { label: 'Ultra-realistic HD voices — male, female, and neutral' },
        { label: 'Your choice of tone: friendly, calm, articulate, or deep' },
        { label: 'Hands-free voice input with instant transcription' },
        { label: 'Everything in Pro: scan history, alerts, priority support' },
      ];

  const goUpgrade = () => {
    hapticMedium();
    onClose();
    router.push('/settings/subscription' as never);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.panel, { backgroundColor: theme.bg1, borderColor: `${theme.teal}30` }]}
          onPress={() => { /* swallow */ }}
        >
          {/* Grab handle */}
          <View style={[styles.handle, { backgroundColor: theme.border }]} />

          {/* Hero icon with teal glow ring */}
          <View style={[styles.heroRing, { backgroundColor: `${theme.teal}14`, borderColor: `${theme.teal}44` }]}>
            <View style={[styles.heroInner, { backgroundColor: `${theme.teal}24` }]}>
              {isHistory ? (
                <HistoryIcon color={theme.teal} size={32} />
              ) : isSpeak ? (
                <MicIcon color={theme.teal} size={32} />
              ) : (
                <SpeakerIcon color={theme.teal} size={32} />
              )}
            </View>
          </View>

          {/* Pro badge */}
          <View style={[styles.proBadge, { backgroundColor: `${theme.gold}1A`, borderColor: `${theme.gold}55` }]}>
            <SparkleIcon color={theme.gold} size={12} />
            <Text style={[styles.proBadgeTxt, { color: theme.gold }]}>PRO FEATURE</Text>
          </View>

          <Text style={[styles.title, { color: theme.text1 }]}>{title}</Text>
          <Text style={[styles.lead, { color: theme.text3 }]}>{lead}</Text>

          {/* Benefits */}
          <View style={styles.benefits}>
            {benefits.map((b, i) => (
              <View key={i} style={styles.benefitRow}>
                <View style={[styles.benefitBullet, { backgroundColor: theme.teal }]} />
                <Text style={[styles.benefitTxt, { color: theme.text2 }]}>{b.label}</Text>
              </View>
            ))}
          </View>

          {/* CTAs */}
          <TouchableOpacity
            style={[styles.cta, { backgroundColor: theme.teal, shadowColor: theme.teal }]}
            activeOpacity={0.85}
            onPress={goUpgrade}
          >
            <Text style={[styles.ctaTxt, { color: theme.bg0 }]}>Upgrade to unlock</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dismiss} onPress={onClose}>
            <Text style={[styles.dismissTxt, { color: theme.text3 }]}>Maybe later</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  panel: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: Platform.select({ ios: 38, android: 26, default: 26 }),
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    marginBottom: 18,
  },
  heroRing: {
    alignSelf: 'center',
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  proBadgeTxt: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },

  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.6,
    textAlign: 'center',
    marginBottom: 6,
  },
  lead: {
    fontSize: 13.5,
    fontWeight: '500',
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 6,
  },

  benefits: { gap: 10, marginBottom: 22 },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  benefitBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  benefitTxt: { fontSize: 13, fontWeight: '500', lineHeight: 19, flex: 1 },

  cta: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  ctaTxt: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },

  dismiss: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 2,
  },
  dismissTxt: { fontSize: 13, fontWeight: '600' },
});

import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

// Animated SVG primitives — reanimated v3 supports animating SVG element props
// through createAnimatedComponent + useAnimatedProps.
const ACircle = Animated.createAnimatedComponent(Circle);
const AEllipse = Animated.createAnimatedComponent(Ellipse);

// ---------------------------------------------------------------------------
// Size variants
// ---------------------------------------------------------------------------

export type AvatarSize = 'small' | 'large' | 'hero';

const SIZE_MAP: Record<AvatarSize, number> = {
  small: 44,
  large: 100,
  hero: 140,
};

// ---------------------------------------------------------------------------
// Shared colour palette (scoped per theme where needed)
// ---------------------------------------------------------------------------

interface Palette {
  accent: string; // teal brand
  gold: string;
  skin: string;
  skinShadow: string;
  hair: string;
  hairHighlight: string;
  coat: string;
  coatShadow: string;
  collar: string;
  steth: string;
  eyeWhite: string;
  iris: string;
  pupil: string;
  brow: string;
  lip: string;
  mouthDark: string;
  online: string;
  nose: string;
  bgStart: string;
  bgEnd: string;
  ring: string;
}

function makePalette(teal: string, gold: string): Palette {
  return {
    accent: teal,
    gold,
    skin: '#C8835A',
    skinShadow: '#9B5E3A',
    hair: '#1A0E08',
    hairHighlight: 'rgba(255,200,140,0.22)',
    coat: '#FFFFFF',
    coatShadow: 'rgba(14,30,56,0.10)',
    collar: '#EEF3FA',
    steth: '#9BAAB8',
    eyeWhite: '#FEFEFE',
    iris: '#3D7AB5',
    pupil: '#050E18',
    brow: '#150B05',
    lip: '#C26A5A',
    mouthDark: '#7A2E24',
    online: '#2ED573',
    nose: '#A06848',
    bgStart: 'rgba(0,229,200,0.13)',
    bgEnd: 'rgba(100,80,200,0.08)',
    ring: 'rgba(0,229,200,0.35)',
  };
}

// ---------------------------------------------------------------------------
// Main avatar component
// ---------------------------------------------------------------------------

interface Props {
  size?: AvatarSize;
  /** Brand teal colour — passed from theme. */
  teal?: string;
  /** Brand gold colour — passed from theme. */
  gold?: string;
  /** Show greeting wave on mount. Defaults true. */
  greetOnMount?: boolean;
  /** Play thinking animation (eye shift + thought bubble). */
  thinking?: boolean;
  /** Open mouth periodically to simulate speaking. */
  speaking?: boolean;
  /** Render a pulsing green "online" indicator. Defaults true for large/hero. */
  showOnlineIndicator?: boolean;
}

export function DrTruWellAvatar({
  size = 'large',
  teal = '#00E5C8',
  gold = '#C9A84C',
  greetOnMount = true,
  thinking = false,
  speaking = false,
  showOnlineIndicator,
}: Props) {
  const px = SIZE_MAP[size];
  const palette = makePalette(teal, gold);
  const showDot = showOnlineIndicator ?? (size !== 'small');

  // ── Idle breathing: container scale ──
  const breath = useSharedValue(1);
  useEffect(() => {
    breath.value = withRepeat(
      withSequence(
        withTiming(1.012, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
        withTiming(1.0, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [breath]);

  // ── Head micro-movement ──
  const headX = useSharedValue(0);
  useEffect(() => {
    headX.value = withRepeat(
      withSequence(
        withTiming(-1, { duration: 4000, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
  }, [headX]);

  // ── Head tilt (for thinking) ──
  const tilt = useSharedValue(0);
  useEffect(() => {
    tilt.value = withTiming(thinking ? 3 : 0, { duration: 400 });
  }, [thinking, tilt]);

  // ── Greeting wave rotation on mount ──
  const wave = useSharedValue(0);
  useEffect(() => {
    if (!greetOnMount) return;
    wave.value = withDelay(
      250,
      withSequence(
        withSpring(15, { damping: 10, stiffness: 180 }),
        withSpring(-5, { damping: 10, stiffness: 180 }),
        withSpring(10, { damping: 10, stiffness: 180 }),
        withSpring(0, { damping: 14, stiffness: 200 }),
      ),
    );
  }, [greetOnMount, wave]);

  // ── Blink animation ──
  const blink = useSharedValue(1); // scaleY for eye whites
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    function scheduleBlink() {
      if (cancelled) return;
      const delay = 2500 + Math.random() * 3500;
      const doDouble = Math.random() < 0.18;
      timer = setTimeout(() => {
        if (cancelled) return;
        if (doDouble) {
          blink.value = withSequence(
            withTiming(0, { duration: 120 }),
            withTiming(1, { duration: 140 }),
            withTiming(0, { duration: 120 }),
            withTiming(1, { duration: 140 }),
          );
        } else {
          blink.value = withSequence(
            withTiming(0, { duration: 120 }),
            withTiming(1, { duration: 140 }),
          );
        }
        scheduleBlink();
      }, delay);
    }

    scheduleBlink();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [blink]);

  // ── Iris shift (thinking) ──
  const irisShift = useSharedValue(0);
  useEffect(() => {
    irisShift.value = withTiming(thinking ? -1.2 : 0, { duration: 400 });
  }, [thinking, irisShift]);

  // ── Mouth open (speaking) ──
  const mouthOpen = useSharedValue(0);
  useEffect(() => {
    if (!speaking) {
      mouthOpen.value = withTiming(0, { duration: 180 });
      return;
    }
    mouthOpen.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) }),
        withTiming(0.15, { duration: 180, easing: Easing.in(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [speaking, mouthOpen]);

  // ── Online indicator pulse ──
  const onlineScale = useSharedValue(1);
  const onlineOpacity = useSharedValue(1);
  useEffect(() => {
    if (!showDot) return;
    onlineScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 750, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 750, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    onlineOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 750 }),
        withTiming(1, { duration: 750 }),
      ),
      -1,
      false,
    );
  }, [showDot, onlineScale, onlineOpacity]);

  // ── Thinking bubble pulse ──
  const bubble = useSharedValue(0);
  useEffect(() => {
    if (!thinking) {
      bubble.value = withTiming(0, { duration: 200 });
      return;
    }
    bubble.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.6, { duration: 600 }),
      ),
      -1,
      true,
    );
  }, [thinking, bubble]);

  // ── Styles ──
  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: breath.value },
      { translateX: headX.value },
      { rotate: `${tilt.value}deg` },
    ],
  }));

  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: 0 }, { rotate: `${wave.value}deg` }],
  }));

  // Eye props: scale via scaleY on ellipse ry
  const leftEyeWhiteProps = useAnimatedProps(() => ({
    ry: 2.8 * blink.value,
  }));
  const rightEyeWhiteProps = useAnimatedProps(() => ({
    ry: 2.8 * blink.value,
  }));

  // Iris: move slightly left when thinking
  const leftIrisProps = useAnimatedProps(() => ({
    cx: 22 + irisShift.value,
  }));
  const rightIrisProps = useAnimatedProps(() => ({
    cx: 34 + irisShift.value,
  }));
  const leftPupilProps = useAnimatedProps(() => ({
    cx: 22 + irisShift.value,
  }));
  const rightPupilProps = useAnimatedProps(() => ({
    cx: 34 + irisShift.value,
  }));

  // Mouth: rx/ry expand when speaking
  const mouthEllipseProps = useAnimatedProps(() => ({
    ry: 0.4 + mouthOpen.value * 1.5,
    rx: 3.6 + mouthOpen.value * 0.6,
  }));

  const onlineStyle = useAnimatedStyle(() => ({
    transform: [{ scale: onlineScale.value }],
    opacity: onlineOpacity.value,
  }));

  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: bubble.value,
    transform: [{ scale: 0.7 + bubble.value * 0.3 }],
  }));

  const onlineSize = size === 'small' ? 8 : size === 'large' ? 12 : 16;

  return (
    <View style={{ width: px, height: px }}>
      <Animated.View style={[{ width: px, height: px }, containerStyle]}>
        <Animated.View style={[StyleSheet.absoluteFill, waveStyle]}>
          <Svg width={px} height={px} viewBox="0 0 56 56">
            <Defs>
              <LinearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={palette.bgStart} />
                <Stop offset="1" stopColor={palette.bgEnd} />
              </LinearGradient>
              <LinearGradient id="coatGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={palette.coat} />
                <Stop offset="1" stopColor="#DDE6F2" />
              </LinearGradient>
              <LinearGradient id="hairGrad" x1="0" y1="0" x2="0.3" y2="1">
                <Stop offset="0" stopColor="#2E1A10" />
                <Stop offset="0.5" stopColor={palette.hair} />
                <Stop offset="1" stopColor="#0D0705" />
              </LinearGradient>
              <LinearGradient id="skinGrad" x1="0.1" y1="0" x2="0.9" y2="1">
                <Stop offset="0" stopColor="#DFA070" />
                <Stop offset="0.4" stopColor={palette.skin} />
                <Stop offset="1" stopColor="#A06040" />
              </LinearGradient>
              <LinearGradient id="neckGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={palette.skin} />
                <Stop offset="1" stopColor={palette.skinShadow} />
              </LinearGradient>
            </Defs>

            {/* Background */}
            <Circle cx={28} cy={28} r={27.5} fill="url(#bgGrad)" stroke={palette.ring} strokeWidth={1.4} />

            {/* Shoulders / lab coat */}
            <Path d="M 4 56 C 5 44 14 40 19 39.5 L 37 39.5 C 42 40 51 44 52 56 Z" fill="url(#coatGrad)" />
            <Path d="M 19 39.5 L 25 49 L 21 56 L 13 56 Z" fill={palette.coatShadow} />
            <Path d="M 37 39.5 L 31 49 L 35 56 L 43 56 Z" fill={palette.coatShadow} />
            {/* Collar */}
            <Path d="M 24 39.5 L 28 46.5 L 32 39.5" fill={palette.collar} stroke="rgba(14,30,56,0.08)" strokeWidth={0.5} />
            {/* Under-collar shading */}
            <Path d="M 26 39.5 L 28 43 L 30 39.5" fill="rgba(14,30,56,0.06)" />

            {/* Stethoscope */}
            <Path d="M 22 41 C 19.5 44.5 19.5 48 23.5 49" stroke={palette.steth} strokeWidth={1.2} fill="none" strokeLinecap="round" />
            <Path d="M 34 41 C 36.5 44.5 36.5 48 32.5 49" stroke={palette.steth} strokeWidth={1.2} fill="none" strokeLinecap="round" />
            <Circle cx={28} cy={50} r={1.8} fill={palette.steth} />
            <Circle cx={28} cy={50} r={0.8} fill="rgba(255,255,255,0.35)" />

            {/* Gold credential badge */}
            <Circle cx={38.5} cy={45.5} r={2} fill={palette.gold} />
            <Path d="M37.4 45.5 l0.8 0.9 l1.5-1.5" stroke="#FFF" strokeWidth={0.7} fill="none" strokeLinecap="round" strokeLinejoin="round" />

            {/* Neck */}
            <Rect x={25} y={35.5} width={6} height={5} fill="url(#neckGrad)" rx={1.5} />
            {/* Neck side shadows */}
            <Rect x={25} y={35.5} width={1.5} height={5} fill={palette.skinShadow} rx={0.8} opacity={0.3} />
            <Rect x={29.5} y={35.5} width={1.5} height={5} fill={palette.skinShadow} rx={0.8} opacity={0.3} />

            {/* Face base */}
            <Ellipse cx={28} cy={23.5} rx={11.5} ry={13} fill="url(#skinGrad)" />
            {/* Soft face-side shading */}
            <Ellipse cx={38.5} cy={24} rx={3} ry={7} fill={palette.skinShadow} opacity={0.12} />
            <Ellipse cx={17.5} cy={24} rx={3} ry={7} fill={palette.skinShadow} opacity={0.10} />
            {/* Jawline definition */}
            <Path d="M 23 32 C 22 34.5 24 37 28 37 C 32 37 34 34.5 33 32" fill={palette.skinShadow} opacity={0.14} />

            {/* Cheek blush */}
            <Ellipse cx={20} cy={27.5} rx={3.2} ry={2.2} fill="#E8826A" opacity={0.18} />
            <Ellipse cx={36} cy={27.5} rx={3.2} ry={2.2} fill="#E8826A" opacity={0.18} />

            {/* Ears */}
            <Ellipse cx={17} cy={24.5} rx={1.8} ry={2.8} fill={palette.skin} />
            <Ellipse cx={17} cy={24.5} rx={1} ry={1.8} fill={palette.skinShadow} opacity={0.3} />
            <Ellipse cx={39} cy={24.5} rx={1.8} ry={2.8} fill={palette.skin} />
            <Ellipse cx={39} cy={24.5} rx={1} ry={1.8} fill={palette.skinShadow} opacity={0.3} />

            {/* Hair — fuller volume, natural parting */}
            <Path
              d="M 16.5 21 C 15 11.5 21.5 7 28 7 C 34.5 7 41 11.5 39.5 21 C 39 17.5 37 14.5 33.5 13.5 C 33.2 15.5 31.5 17 28 17 C 24.5 17 22.8 15.5 22.5 13.5 C 19 14.5 17 17.5 16.5 21 Z"
              fill="url(#hairGrad)"
            />
            {/* Hair side volume */}
            <Path d="M 16.5 21 C 15 16 15.5 11 17 9 C 16 12 16 16 16.5 21 Z" fill={palette.hair} opacity={0.6} />
            <Path d="M 39.5 21 C 41 16 40.5 11 39 9 C 40 12 40 16 39.5 21 Z" fill={palette.hair} opacity={0.6} />
            {/* Hair highlight */}
            <Path d="M 21 12 C 23.5 10 27 9.5 29.5 10" stroke={palette.hairHighlight} strokeWidth={1.4} fill="none" strokeLinecap="round" />
            <Path d="M 23 10.5 C 25 9.5 27.5 9.2 29 9.5" stroke={palette.hairHighlight} strokeWidth={0.6} fill="none" strokeLinecap="round" opacity={0.6} />

            {/* Eyebrows — natural arch */}
            <Path d="M 18.5 19.5 C 20.2 18.4 22.2 18.3 24 19.5" stroke={palette.brow} strokeWidth={1.4} fill="none" strokeLinecap="round" />
            <Path d="M 32 19.5 C 33.8 18.3 35.8 18.4 37.5 19.5" stroke={palette.brow} strokeWidth={1.4} fill="none" strokeLinecap="round" />
            {/* Brow subtle fill */}
            <Path d="M 18.8 19.8 C 20.4 18.8 22 18.7 23.7 19.8" stroke={palette.brow} strokeWidth={0.5} fill="none" strokeLinecap="round" opacity={0.4} />
            <Path d="M 32.3 19.8 C 34 18.7 35.6 18.8 37.2 19.8" stroke={palette.brow} strokeWidth={0.5} fill="none" strokeLinecap="round" opacity={0.4} />

            {/* Upper eyelid crease */}
            <Path d="M 19.5 21.2 C 21 20.5 23 20.5 24.5 21.2" stroke={palette.skinShadow} strokeWidth={0.5} fill="none" strokeLinecap="round" opacity={0.4} />
            <Path d="M 31.5 21.2 C 33 20.5 35 20.5 36.5 21.2" stroke={palette.skinShadow} strokeWidth={0.5} fill="none" strokeLinecap="round" opacity={0.4} />

            {/* Eye whites */}
            <AEllipse cx={22} cy={23} rx={2.8} ry={2.8} fill={palette.eyeWhite} animatedProps={leftEyeWhiteProps} />
            <AEllipse cx={34} cy={23} rx={2.8} ry={2.8} fill={palette.eyeWhite} animatedProps={rightEyeWhiteProps} />

            {/* Irises with depth */}
            <ACircle cx={22} cy={23} r={1.8} fill={palette.iris} animatedProps={leftIrisProps} />
            <ACircle cx={34} cy={23} r={1.8} fill={palette.iris} animatedProps={rightIrisProps} />
            {/* Inner iris darker ring */}
            <ACircle cx={22} cy={23} r={1.0} fill="#1A5890" animatedProps={leftIrisProps} />
            <ACircle cx={34} cy={23} r={1.0} fill="#1A5890" animatedProps={rightIrisProps} />

            {/* Pupils */}
            <ACircle cx={22} cy={23} r={0.7} fill={palette.pupil} animatedProps={leftPupilProps} />
            <ACircle cx={34} cy={23} r={0.7} fill={palette.pupil} animatedProps={rightPupilProps} />

            {/* Eye highlights — two spots for realism */}
            <Circle cx={22.7} cy={22.3} r={0.45} fill="#FFFFFF" />
            <Circle cx={22.1} cy={23.5} r={0.2} fill="rgba(255,255,255,0.5)" />
            <Circle cx={34.7} cy={22.3} r={0.45} fill="#FFFFFF" />
            <Circle cx={34.1} cy={23.5} r={0.2} fill="rgba(255,255,255,0.5)" />

            {/* Upper eyelid (gives depth) */}
            <Path d="M 19.4 22.5 C 21 21.2 23 21.2 24.6 22.5" stroke={palette.brow} strokeWidth={0.9} fill="none" strokeLinecap="round" opacity={0.7} />
            <Path d="M 31.4 22.5 C 33 21.2 35 21.2 36.6 22.5" stroke={palette.brow} strokeWidth={0.9} fill="none" strokeLinecap="round" opacity={0.7} />

            {/* Eyelashes */}
            <Path d="M 19.6 22.2 L 19.2 21.5 M 21.5 21.5 L 21.5 20.8 M 23.5 21.5 L 23.8 20.9 M 24.4 22.2 L 24.8 21.6" stroke={palette.brow} strokeWidth={0.7} strokeLinecap="round" opacity={0.85} />
            <Path d="M 31.6 22.2 L 31.2 21.5 M 33.5 21.5 L 33.5 20.8 M 35.5 21.5 L 35.8 20.9 M 36.4 22.2 L 36.8 21.6" stroke={palette.brow} strokeWidth={0.7} strokeLinecap="round" opacity={0.85} />

            {/* Nose — soft, natural */}
            <Path d="M 28 25.5 C 27.4 27 27 29 27.2 30.2 C 27.6 30.6 28.4 30.6 28.8 30.2 C 29 29 28.6 27 28 25.5 Z" fill={palette.nose} opacity={0.22} />
            <Path d="M 26.5 30.2 C 27.2 31 28.8 31 29.5 30.2" stroke={palette.nose} strokeWidth={0.8} fill="none" strokeLinecap="round" opacity={0.7} />
            {/* Nose tip highlight */}
            <Circle cx={28} cy={29.5} r={0.6} fill="rgba(255,200,160,0.25)" />

            {/* Mouth — fuller, more natural */}
            {/* Upper lip */}
            <Path d="M 24.5 32.5 C 25.8 31.8 27 31.6 28 31.8 C 29 31.6 30.2 31.8 31.5 32.5" stroke={palette.lip} strokeWidth={0.9} fill="none" strokeLinecap="round" opacity={0.7} />
            {/* Smile curve */}
            <Path d="M 24.5 32.5 C 26.5 34.2 29.5 34.2 31.5 32.5" stroke={palette.lip} strokeWidth={1.3} fill="none" strokeLinecap="round" />
            {/* Lip fill */}
            <Path d="M 24.5 32.5 C 26.5 34 29.5 34 31.5 32.5 C 30 33.5 26 33.5 24.5 32.5 Z" fill={palette.lip} opacity={0.25} />
            {/* Mouth opening — grows when speaking */}
            <AEllipse cx={28} cy={33} rx={3.4} ry={0.5} fill={palette.mouthDark} animatedProps={mouthEllipseProps} />
            {/* Smile dimple hints */}
            <Circle cx={24.2} cy={32.8} r={0.5} fill={palette.skinShadow} opacity={0.2} />
            <Circle cx={31.8} cy={32.8} r={0.5} fill={palette.skinShadow} opacity={0.2} />
          </Svg>
        </Animated.View>
      </Animated.View>

      {/* Online indicator */}
      {showDot && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.onlineDot,
            {
              width: onlineSize,
              height: onlineSize,
              borderRadius: onlineSize / 2,
              backgroundColor: palette.online,
              right: size === 'small' ? -1 : 2,
              bottom: size === 'small' ? -1 : 2,
              borderWidth: size === 'small' ? 1.5 : 2,
              borderColor: '#FFFFFF',
            },
            onlineStyle,
          ]}
        />
      )}

      {/* Thinking bubble */}
      {thinking && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.thoughtBubble,
            {
              top: -10,
              right: -6,
              backgroundColor: '#FFFFFF',
              borderColor: 'rgba(0,0,0,0.08)',
            },
            bubbleStyle,
          ]}
        >
          <Text style={styles.thoughtText}>…</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  onlineDot: {
    position: 'absolute',
  },
  thoughtBubble: {
    position: 'absolute',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  thoughtText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0A0E16',
    letterSpacing: 1,
  },
});

export default DrTruWellAvatar;

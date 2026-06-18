import type { NIMTTSStatus } from '../types';
import { NIM_TTS_COLORS } from '../constants';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

export interface NIMTTSButtonProps {
  text: string;
  messageId: string;
  status: NIMTTSStatus;
  isActive: boolean;
  isNIMAvailable: boolean;
  onSpeak: (text: string, messageId: string) => void;
  onStop: () => void;
}

function SpeakerIcon({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9v6h4l5 4V5L7 9H3z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M15 9c1.5 1 2.5 2.5 2.5 3s-1 2-2.5 3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function StopIcon({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={6} y={6} width={12} height={12} rx={2} fill={color} />
    </Svg>
  );
}

function PlayIcon({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M8 6v12l10-6-10-6z" fill={color} />
    </Svg>
  );
}

function DotPulse({ delay, color }: { delay: number; color: string }) {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    const pulse = Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 550,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.2,
          duration: 550,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0.25,
          duration: 550,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 550,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]);
    const loop = Animated.loop(pulse);
    loop.start();
    return () => loop.stop();
  }, [delay, opacity, scale]);

  return (
    <Animated.View
      style={{
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: color,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

function LoadingDots({ color }: { color: string }) {
  return (
    <View style={dotStyles.wrap}>
      <DotPulse delay={0} color={color} />
      <DotPulse delay={180} color={color} />
      <DotPulse delay={360} color={color} />
    </View>
  );
}

const dotStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 5, alignItems: 'center', height: 12 },
});

export function NIMTTSButton(props: NIMTTSButtonProps) {
  const {
    text,
    messageId,
    status,
    isActive,
    isNIMAvailable,
    onSpeak,
    onStop,
  } = props;

  if (!isNIMAvailable) return null;

  const teal = NIM_TTS_COLORS.teal;
  const accentActive = NIM_TTS_COLORS.teal;

  let label = 'Listen';
  let icon: React.ReactNode = <SpeakerIcon color={teal} />;
  let onPressInner = () => onSpeak(text, messageId);

  if (isActive && status === 'loading') {
    label = 'Generating...';
    icon = <LoadingDots color={accentActive} />;
    onPressInner = () => {};
  } else if (isActive && status === 'playing') {
    label = 'Stop';
    icon = <StopIcon color={teal} />;
    onPressInner = () => onStop();
  } else if (isActive && status === 'paused') {
    label = 'Resume';
    icon = <PlayIcon color={teal} />;
    onPressInner = () => onSpeak(text, messageId);
  }

  const a11y =
    isActive && status === 'loading'
      ? 'Generating cloud voice'
      : isActive && status === 'playing'
        ? 'Stop cloud voice'
        : isActive && status === 'paused'
          ? 'Resume cloud voice'
          : 'Listen with cloud voice';

  return (
    <Pressable
      onPress={onPressInner}
      style={({ pressed }) => [
        styles.btn,
        {
          borderColor: isActive ? 'rgba(0,229,200,0.6)' : 'rgba(0,229,200,0.3)',
          backgroundColor: isActive ? 'rgba(0,229,200,0.16)' : 'rgba(0,229,200,0.08)',
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      accessibilityLabel={a11y}
      accessibilityRole="button"
    >
      {icon}
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: NIM_TTS_COLORS.teal,
  },
});

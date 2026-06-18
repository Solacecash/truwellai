import type { NIMTTSStatus } from '../types';
import { NIM_TTS_COLORS } from '../constants';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

export interface NIMTTSPlayerBarProps {
  status: NIMTTSStatus;
  voiceName: string;
  durationMs: number;
  progressMs: number;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

function voiceShortName(full: string): string {
  const parts = full.split('.');
  return parts[parts.length - 1]?.trim() || full;
}

function SpeakerCircle({ teal }: { teal: string }) {
  return (
    <View style={playerStyles.circleWrap}>
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
          d="M3 9v6h4l5 4V5L7 9H3z"
          stroke={teal}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

export function NIMTTSPlayerBar(props: NIMTTSPlayerBarProps) {
  const { status, voiceName, durationMs, progressMs, onPause, onResume, onStop } =
    props;
  const insets = useSafeAreaInsets();
  const bottomPad = typeof insets.bottom === 'number' ? insets.bottom : 34;
  const { width } = useWindowDimensions();
  const slide = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const visible = status === 'loading' || status === 'playing' || status === 'paused';
    if (visible && !hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
      slide.setValue(12);
      fade.setValue(0);
      Animated.parallel([
        Animated.spring(slide, {
          toValue: 0,
          friction: 7,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    }
    if (!visible) hasAnimatedRef.current = false;
  }, [status, slide, fade]);

  if (status === 'idle' || status === 'complete' || status === 'error') {
    return null;
  }

  const pct =
    durationMs > 0 ? Math.min(100, Math.max(0, (progressMs / durationMs) * 100)) : 0;
  const barW = Math.min(380, width - 48);
  const displayName =
    status === 'loading' ? 'Generating...' : voiceShortName(voiceName);

  const loading = status === 'loading';

  return (
    <Animated.View
      style={[
        playerStyles.sheet,
        {
          bottom: bottomPad + 86,
          width: barW,
          marginLeft: (width - barW) / 2,
          opacity: fade,
          transform: [{ translateY: slide }],
        },
      ]}
    >
      <SpeakerCircle teal={NIM_TTS_COLORS.teal} />
      <View style={playerStyles.mid}>
        <Text style={playerStyles.midLabel} numberOfLines={1}>
          {displayName}
        </Text>
        <View style={playerStyles.track}>
          <View style={[playerStyles.fill, { width: `${pct}%` }]} />
        </View>
      </View>
      <View style={playerStyles.controls}>
        <Pressable
          onPress={() => {
            if (loading) return;
            if (status === 'paused') {
              onResume();
            } else {
              onPause();
            }
          }}
          accessibilityLabel={status === 'paused' ? 'Resume' : 'Pause'}
          accessibilityRole="button"
          disabled={loading}
          style={[playerStyles.circleBtnPrimary, loading && playerStyles.circleBtnMuted]}
          hitSlop={6}
        >
          {loading ? (
            <Text style={playerStyles.pausedGlyph}>⋯</Text>
          ) : status === 'paused' ? (
            <Text style={{ color: NIM_TTS_COLORS.teal, fontSize: 14 }}>▶</Text>
          ) : (
            <View style={pauseBarsWrap}>
              <View style={[pauseBar, { marginRight: 3 }]} />
              <View style={pauseBar} />
            </View>
          )}
        </Pressable>
        <Pressable
          onPress={onStop}
          accessibilityLabel="Stop"
          accessibilityRole="button"
          style={[playerStyles.circleBtn]}
          hitSlop={6}
        >
          <Svg width={12} height={12} viewBox="0 0 24 24">
            <Path d="M6 6h12v12H6z" fill="rgba(255,255,255,0.5)" />
          </Svg>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const pauseBarsWrap = { flexDirection: 'row' as const, alignItems: 'center' as const };
const pauseBar = { width: 3, height: 12, borderRadius: 1, backgroundColor: NIM_TTS_COLORS.teal };

const playerStyles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    zIndex: 200,
    left: 0,
    backgroundColor: 'rgba(8,20,34,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,200,0.25)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  circleWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,229,200,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,200,0.40)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mid: { flex: 1 },
  midLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: NIM_TTS_COLORS.teal,
    marginBottom: 6,
  },
  track: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: NIM_TTS_COLORS.teal,
  },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  circleBtnPrimary: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,229,200,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,200,0.50)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBtnMuted: { opacity: 0.45 },
  circleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pausedGlyph: { color: NIM_TTS_COLORS.teal, fontSize: 16, marginTop: -2 },
});

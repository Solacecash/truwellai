import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

import { SofiaAvatar } from '@/components/ai/SofiaAvatar';
import { SofiaBadge } from '@/components/ai/SofiaBadge';
import { useTheme } from '@/theme/ThemeContext';

interface Props {
  disclaimerDismissed?: boolean;
  onDismissDisclaimer?: () => void;
  thinking?: boolean;
  speaking?: boolean;
  /** When true, the header smoothly collapses to zero height (e.g. while typing). */
  collapsed?: boolean;
}

export function AssistantHeroHeader({
  thinking = false,
  speaking = false,
  collapsed = false,
}: Props) {
  const { theme } = useTheme();

  const maxH = useSharedValue(collapsed ? 0 : 64);
  const opacity = useSharedValue(collapsed ? 0 : 1);

  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withSequence(
      withTiming(1.4, { duration: 700 }),
      withTiming(1.0, { duration: 700 }),
    );
    const interval = setInterval(() => {
      pulse.value = withSequence(
        withTiming(1.4, { duration: 700 }),
        withTiming(1.0, { duration: 700 }),
      );
    }, 1400);
    return () => clearInterval(interval);
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  useEffect(() => {
    maxH.value = withTiming(collapsed ? 0 : 64, { duration: 260 });
    opacity.value = withTiming(collapsed ? 0 : 1, { duration: 200 });
  }, [collapsed, maxH, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    maxHeight: maxH.value,
    opacity: opacity.value,
    overflow: 'hidden',
  }));

  return (
    <Animated.View style={animStyle}>
      <LinearGradient
        colors={[theme.bg1, `${theme.teal}08`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.wrapper, { borderBottomColor: theme.border }]}
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatarRing}>
            <SofiaAvatar
              size="small"
              teal={theme.teal}
              gold={theme.gold}
              purple={theme.purple}
              thinking={thinking}
              speaking={speaking}
              showStatusDot={false}
            />
            <View
              style={[
                styles.liveRing,
                { borderColor: speaking || thinking ? theme.gold : theme.green },
              ]}
            />
          </View>
        </View>

        <View style={styles.centerSection}>
          <SofiaBadge variant="compact" />
          <View style={styles.statusRow}>
            <Animated.View
              style={[
                styles.statusDot,
                {
                  backgroundColor: thinking
                    ? theme.gold
                    : speaking
                      ? theme.teal
                      : theme.green,
                },
                pulseStyle,
              ]}
            />
            <Text style={[styles.statusTxt, { color: theme.text3 }]}>
              {thinking
                ? 'Thinking...'
                : speaking
                  ? 'Speaking'
                  : 'Wellness intelligence · Available'}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.rightBadge,
            { backgroundColor: `${theme.teal}10`, borderColor: `${theme.teal}25` },
          ]}
        >
          <Text style={[styles.rightBadgeNum, { color: theme.teal }]}>47</Text>
          <Text style={[styles.rightBadgeSub, { color: theme.text3 }]}>DBs</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
    minHeight: 64,
  },
  avatarSection: {
    flexShrink: 0,
  },
  avatarRing: {
    position: 'relative',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveRing: {
    position: 'absolute',
    borderRadius: 24,
    borderWidth: 1.5,
    width: 50,
    height: 50,
    top: -3,
    left: -3,
  },
  centerSection: {
    flex: 1,
    gap: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusTxt: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  rightBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    flexShrink: 0,
  },
  rightBadgeNum: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  rightBadgeSub: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

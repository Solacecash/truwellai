import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeContext';

// ── Icons ─────────────────────────────────────────────────────────────────────

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12L12 3l9 9M5 10v9h4v-5h4v5h4v-9"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PatientsIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx={9} cy={7} r={3} stroke={color} strokeWidth={2} />
      <Path
        d="M3 19v-2a4 4 0 014-4h4a4 4 0 014 4v2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Circle cx={17} cy={9} r={2.5} stroke={color} strokeWidth={2} />
      <Path
        d="M21 19v-1a3 3 0 00-2-2.87"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ConsultIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={4} width={18} height={18} rx={3} stroke={color} strokeWidth={2} />
      <Path d="M3 10h18M8 2v4M16 2v4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function RxIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ProfileIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ── Tab config — exactly the 5 expert tabs, no extras ────────────────────────

type IconComp = React.ComponentType<{ color: string }>;

const TAB_CONFIG: Record<string, { icon: IconComp; label: string }> = {
  index:         { icon: HomeIcon,     label: 'HOME'     },
  patients:      { icon: PatientsIcon, label: 'PATIENTS' },
  consultations: { icon: ConsultIcon,  label: 'CONSULT'  },
  prescriptions: { icon: RxIcon,       label: 'NOTES'    },
  profile:       { icon: ProfileIcon,  label: 'PROFILE'  },
};

/** Full hrefs so Expo Router does not resolve tab names against the wrong navigator. */
const TAB_HREF: Record<string, string> = {
  index:         '/(expert)/(tabs)',
  patients:      '/(expert)/(tabs)/patients',
  consultations: '/(expert)/(tabs)/consultations',
  prescriptions: '/(expert)/(tabs)/prescriptions',
  profile:       '/(expert)/(tabs)/profile',
};

// ── Single animated tab item — hooks always called unconditionally ────────────

function TabItem({
  routeName,
  isActive,
  onPress,
  activeColor,
  inactiveColor,
  pillColor,
}: {
  routeName: string;
  isActive: boolean;
  onPress: () => void;
  activeColor: string;
  inactiveColor: string;
  pillColor: string;
}) {
  // All hooks called unconditionally at the top — rules of hooks compliant
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const config = TAB_CONFIG[routeName];

  const handlePress = useCallback(() => {
    scale.value = withSpring(0.88, { damping: 10, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 280 });
    });
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }, [onPress, scale]);

  // Guard after all hooks
  if (!config) return null;

  const { icon: Icon, label } = config;
  const color = isActive ? activeColor : inactiveColor;

  return (
    <Pressable
      onPress={handlePress}
      style={styles.tabTouchable}
      android_ripple={null}
    >
      <Animated.View
        style={[
          styles.tabContent,
          isActive && { backgroundColor: pillColor, borderRadius: 14 },
          animStyle,
        ]}
      >
        <Icon color={color} />
        <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────

export function ExpertTabBar({ state, navigation }: BottomTabBarProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const pillColor = `rgba(201, 168, 76, 0.13)`;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.bg1,
          borderTopColor: theme.border,
          paddingBottom: insets.bottom + 8,
          minHeight: 60 + insets.bottom,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        // Only render tabs that exist in our config — silently skip anything else
        if (!TAB_CONFIG[route.name]) return null;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            const href = TAB_HREF[route.name];
            if (href) router.navigate(href as never);
          }
        };

        return (
          <TabItem
            key={route.key}
            routeName={route.name}
            isActive={isFocused}
            onPress={onPress}
            activeColor={theme.gold}
            inactiveColor={theme.text3}
            pillColor={pillColor}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 6,
  },
  tabTouchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // Explicit minimum hit area
    minHeight: 48,
    minWidth: 44,
  },
  tabContent: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 3,
  },
  tabLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

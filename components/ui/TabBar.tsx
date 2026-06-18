import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TabActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

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

function ScanIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={3} width={6} height={6} rx={1} stroke={color} strokeWidth={2} />
      <Rect x={15} y={3} width={6} height={6} rx={1} stroke={color} strokeWidth={2} />
      <Rect x={3} y={15} width={6} height={6} rx={1} stroke={color} strokeWidth={2} />
      <Path d="M15 17h2m2 0h2M17 15v2m0 2v2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function WellnessIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21C12 21 3 13.5 3 8a5 5 0 0110 0 5 5 0 0110 0c0 5.5-9 13-9 13z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SafeCircleIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx={9} cy={7} r={3} stroke={color} strokeWidth={2} />
      <Circle cx={17} cy={8} r={2.5} stroke={color} strokeWidth={2} />
      <Path d="M3 20c0-4 2.7-6 6-6s6 2 6 6" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M17 14c2 0 4 1.2 4 4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function ProfileIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={2} />
      <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

const TAB_ICONS = [HomeIcon, ScanIcon, WellnessIcon, SafeCircleIcon, ProfileIcon];
const TAB_LABELS = ['Home', 'Scan', 'Wellness', 'SafeCircle', 'Profile'];

function TabItem({
  index,
  isActive,
  onPress,
  activeColor,
  inactiveColor,
  pillColor,
}: {
  index: number;
  isActive: boolean;
  onPress: () => void;
  activeColor: string;
  inactiveColor: string;
  pillColor: string;
}) {
  const scale = useSharedValue(1);
  const Icon = TAB_ICONS[index];
  const label = TAB_LABELS[index];
  const color = isActive ? activeColor : inactiveColor;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.9, { damping: 10, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 300 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.tabItem}
      activeOpacity={1}
    >
      <Animated.View
        style={[
          styles.tabContent,
          isActive && { backgroundColor: pillColor, borderRadius: 18 },
          animStyle,
        ]}
      >
        <Icon color={color} />
        <Text style={[styles.tabLabel, { color }]}>{label.toUpperCase()}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const pillColor = `rgba(0, 229, 200, 0.10)`;

  // Filter out hidden tabs (e.g. the 'enter' redirect tab) — they have no
  // corresponding TAB_LABELS entry and must not be rendered in the bar.
  // We also skip any route whose Expo Router href option is null.
  const visibleRoutes = state.routes.filter((route, index) => {
    if (index >= TAB_LABELS.length) return false;
    const opts = descriptors[route.key]?.options as { href?: null | string } | undefined;
    return opts?.href !== null;
  });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.bg1,
          borderTopColor: theme.border,
          paddingBottom: insets.bottom + 8,
        },
      ]}
    >
      {visibleRoutes.map((route) => {
        const index = state.routes.indexOf(route);
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.dispatch(TabActions.jumpTo(route.name));
          }
        };

        return (
          <TabItem
            key={route.key}
            index={index}
            isActive={isFocused}
            onPress={onPress}
            activeColor={theme.teal}
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
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabContent: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 3,
  },
  tabLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});

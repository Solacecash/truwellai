import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeContext';
import { useNotificationStore } from '@/stores/notificationStore';

interface Props {
  onPress: () => void;
}

export function NotificationBell({ onPress }: Props) {
  const { theme }    = useTheme();
  const unreadCount  = useNotificationStore((s) => s.unreadCount);
  const badgeLabel   = unreadCount <= 0 ? null : unreadCount <= 9 ? String(unreadCount) : '9+';

  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={10}
      activeOpacity={0.75}
      style={[styles.wrap, { backgroundColor: theme.bg2, borderColor: theme.border }]}
    >
      {/* Bell icon */}
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
          d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
          stroke={unreadCount > 0 ? theme.text1 : theme.text3}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M13.73 21a2 2 0 0 1-3.46 0"
          stroke={unreadCount > 0 ? theme.text1 : theme.text3}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>

      {/* Badge */}
      {badgeLabel !== null && (
        <View style={[styles.badge, { backgroundColor: theme.red }]}>
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width:          36,
    height:         36,
    borderRadius:   18,
    borderWidth:    1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  badge: {
    position:       'absolute',
    top:            2,
    right:          2,
    minWidth:       14,
    height:         14,
    borderRadius:   7,
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color:      '#fff',
    fontSize:   8,
    fontWeight: '900',
    lineHeight: 12,
  },
});

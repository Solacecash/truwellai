import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path, Polyline } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeContext';

interface Props {
  title: string;
  onBack: () => void;
  rightContent?: React.ReactNode;
}

export function BackHeader({ title, onBack, rightContent }: Props) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.bg0, borderBottomColor: theme.border },
      ]}
    >
      <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={8}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Polyline
            points="15,18 9,12 15,6"
            stroke={theme.teal}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
        <Text style={[styles.backText, { color: theme.teal }]}>Back</Text>
      </TouchableOpacity>

      <Text
        style={[styles.title, { color: theme.text1 }]}
        numberOfLines={1}
      >
        {title}
      </Text>

      <View style={styles.right}>
        {rightContent ?? null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 70,
  },
  backText: {
    fontSize: 15,
    fontWeight: '700',
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  right: {
    width: 70,
    alignItems: 'flex-end',
  },
});

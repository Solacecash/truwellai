import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

export type Grade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

interface Props {
  grade: Grade;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

function gradeColor(grade: Grade, theme: ReturnType<typeof useTheme>['theme']): string {
  switch (grade) {
    case 'A+': return theme.teal;
    case 'A':  return theme.green;
    case 'B':  return theme.gold;
    case 'C':  return theme.amber;
    case 'D':  return theme.red;
    case 'F':  return theme.red;
  }
}

const SIZE_MAP = {
  sm: { box: 36, grade: 18, score: 10 },
  md: { box: 52, grade: 26, score: 13 },
  lg: { box: 72, grade: 36, score: 16 },
};

export function GradeCard({ grade, score, size = 'md', style }: Props) {
  const { theme } = useTheme();
  const color = gradeColor(grade, theme);
  const { box, grade: gradeFontSize, score: scoreFontSize } = SIZE_MAP[size];

  return (
    <View
      style={[
        styles.container,
        {
          width: box,
          height: box,
          borderRadius: box * 0.22,
          backgroundColor: `${color}18`,
          borderColor: `${color}55`,
        },
        style,
      ]}
    >
      <Text style={[styles.gradeText, { fontSize: gradeFontSize, color }]}>{grade}</Text>
      {score !== undefined && (
        <Text style={[styles.scoreText, { fontSize: scoreFontSize, color }]}>{score}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeText: {
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  scoreText: {
    fontWeight: '700',
    marginTop: -2,
    opacity: 0.8,
  },
});

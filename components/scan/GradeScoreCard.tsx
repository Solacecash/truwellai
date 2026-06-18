import React, { useRef } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { GradeCard, Grade } from '@/components/ui/GradeCard';
import { SegmentedIndicator, SegmentedIndicatorRef } from '@/components/ui/SegmentedIndicator';
import { useTheme } from '@/theme/ThemeContext';

interface Props {
  grade: Grade;
  score: number;
  productName?: string;
  style?: ViewStyle;
}

export function GradeScoreCard({ grade, score, productName, style }: Props) {
  const { theme } = useTheme();
  const segRef = useRef<SegmentedIndicatorRef>(null);

  const gradeColor =
    grade === 'A+' || grade === 'A'
      ? theme.teal
      : grade === 'B'
      ? theme.gold
      : grade === 'C'
      ? theme.amber
      : theme.red;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.bg1, borderColor: theme.border },
        style,
      ]}
    >
      <View style={styles.row}>
        <GradeCard grade={grade} score={score} size="lg" />
        <View style={styles.info}>
          {productName ? (
            <Text style={[styles.productName, { color: theme.text1 }]} numberOfLines={2}>
              {productName}
            </Text>
          ) : null}
          <Text style={[styles.scoreLabel, { color: theme.text3 }]}>
            Overall Score
          </Text>
          <Text style={[styles.scoreValue, { color: gradeColor }]}>
            {score} / 100
          </Text>
        </View>
      </View>
      <SegmentedIndicator
        ref={segRef}
        value={score}
        count={12}
        color={gradeColor}
        height={6}
        gap={3}
        animated
        style={styles.segments}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  productName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  segments: {
    width: '100%',
  },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { HealthBriefSections } from '@/lib/healthBrief/types';
import { useTheme } from '@/theme/ThemeContext';

interface Props {
  sections: HealthBriefSections;
}

function SectionBlock({ title, body }: { title: string; body: string }) {
  const { theme } = useTheme();
  if (!body.trim()) return null;
  return (
    <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.bg1 }]}>
      <Text style={[styles.h, { color: theme.text1 }]}>{title}</Text>
      <Text style={[styles.p, { color: theme.text2 }]}>{body}</Text>
    </View>
  );
}

export function BriefSectionsPreview({ sections }: Props) {
  const { theme } = useTheme();
  return (
    <View style={styles.wrap}>
      <SectionBlock title="Patient overview" body={sections.patientOverview} />
      <SectionBlock title="Goals" body={sections.goals} />
      <SectionBlock title="Symptoms and concerns" body={sections.symptomsConcerns} />
      <SectionBlock title="Lifestyle summary" body={sections.lifestyleSummary} />
      <SectionBlock title="Key patterns observed" body={sections.keyPatternsObserved} />
      {sections.suggestedQuestionsForClinician.length > 0 ? (
        <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.bg1 }]}>
          <Text style={[styles.h, { color: theme.text1 }]}>Suggested questions for your clinician</Text>
          {sections.suggestedQuestionsForClinician.map((q, i) => (
            <Text key={`${i}-${q.slice(0, 24)}`} style={[styles.bullet, { color: theme.text2 }]}>
              {'\u2022 '}
              {q}
            </Text>
          ))}
        </View>
      ) : null}
      {sections.nonDiagnosticNotice.trim() ? (
        <Text style={[styles.notice, { color: theme.text3 }]}>{sections.nonDiagnosticNotice}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  h: {
    fontSize: 13,
    fontWeight: '800',
  },
  p: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  bullet: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
    marginTop: 2,
  },
  notice: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    fontStyle: 'italic',
  },
});

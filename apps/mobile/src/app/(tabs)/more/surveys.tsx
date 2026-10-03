import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from 'mobile-tokens';
import { useDemoStore } from 'mobile-data';
import { Header, Card, Badge, Button, BarChart, useToast } from 'mobile-ui';
import { spacing, typography } from 'mobile-tokens';

export default function SurveysScreen() {
  const { colors } = useTheme();
  const { state } = useDemoStore();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const router = useRouter();

  const selectedSurvey = state.surveys.find((s) => s.id === selectedId);
  const responses = state.responses.filter((r) => r.surveyId === selectedId);

  const getSatisfactionData = () => {
    if (!selectedSurvey) return [];
    const q1 = selectedSurvey.questions.find((q) => q.type === 'Satisfaction');
    if (!q1) return [];
    return responses
      .filter((r) => r.answers[q1.id] !== undefined && r.answers[q1.id] !== '')
      .map((r) => Number(r.answers[q1.id]));
  };

  const getNpsData = () => {
    if (!selectedSurvey) return { promoters: 0, passives: 0, detractors: 0 };
    const npsQ = selectedSurvey.questions.find((q) => q.type === 'NPS');
    if (!npsQ) return { promoters: 0, passives: 0, detractors: 0 };
    const values = responses
      .filter(
        (r) => r.answers[npsQ.id] !== undefined && r.answers[npsQ.id] !== '',
      )
      .map((r) => Number(r.answers[npsQ.id]));
    return {
      promoters: values.filter((v) => v >= 9).length,
      passives: values.filter((v) => v >= 7 && v <= 8).length,
      detractors: values.filter((v) => v <= 6).length,
    };
  };

  const npsData = getNpsData();
  const satisfactionData = getSatisfactionData();

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <Header title="Surveys" showBack />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
      >
        {state.surveys.map((survey) => (
          <TouchableOpacity
            key={survey.id}
            onPress={() =>
              setSelectedId(selectedId === survey.id ? null : survey.id)
            }
            accessibilityRole="button"
            accessibilityLabel={`Survey: ${survey.name}`}
            accessibilityState={{ expanded: selectedId === survey.id }}
          >
            <Card style={styles.card}>
              <View style={styles.surveyHeader}>
                <Text style={[styles.surveyName, { color: colors.ink }]}>
                  {survey.name}
                </Text>
                <Badge
                  label={survey.status}
                  tone={
                    survey.status === 'Active'
                      ? 'mint'
                      : survey.status === 'Paused'
                        ? 'warm'
                        : 'muted'
                  }
                />
              </View>
              <Text style={[styles.surveyInfo, { color: colors.muted }]}>
                {survey.questions.length} questions ·{' '}
                {state.responses.filter((r) => r.surveyId === survey.id).length}{' '}
                responses
              </Text>
            </Card>
          </TouchableOpacity>
        ))}

        {selectedSurvey && (
          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.ink }]}>
              {selectedSurvey.name} · Response summary
            </Text>
            <Button
              title="Edit survey"
              variant="secondary"
              onPress={() =>
                router.push({
                  pathname: '/survey-editor',
                  params: { id: selectedSurvey.id },
                })
              }
            />
            {responses.length === 0 && (
              <Text style={{ color: colors.muted, marginTop: 16 }}>
                No demo responses yet.
              </Text>
            )}
            {satisfactionData.length > 0 && (
              <>
                <Text style={[styles.chartLabel, { color: colors.muted }]}>
                  Satisfaction scores
                </Text>
                <BarChart
                  data={satisfactionData}
                  labels={responses.map((_, i) => `R${i + 1}`)}
                  color={colors.chartSage}
                  height={80}
                />
              </>
            )}
            <Text style={[styles.chartLabel, { color: colors.muted }]}>
              NPS breakdown
            </Text>
            <View style={styles.npsRow}>
              <View style={styles.npsItem}>
                <Text style={[styles.npsValue, { color: colors.positiveInk }]}>
                  {npsData.promoters}
                </Text>
                <Text style={[styles.npsLabel, { color: colors.muted }]}>
                  Promoters
                </Text>
              </View>
              <View style={styles.npsItem}>
                <Text style={[styles.npsValue, { color: colors.warmInk }]}>
                  {npsData.passives}
                </Text>
                <Text style={[styles.npsLabel, { color: colors.muted }]}>
                  Passives
                </Text>
              </View>
              <View style={styles.npsItem}>
                <Text style={[styles.npsValue, { color: colors.danger }]}>
                  {npsData.detractors}
                </Text>
                <Text style={[styles.npsLabel, { color: colors.muted }]}>
                  Detractors
                </Text>
              </View>
            </View>
          </Card>
        )}

        <View style={styles.actions}>
          <Button
            title="Create survey"
            variant="secondary"
            onPress={() => router.push('/survey-editor')}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  surveyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  surveyName: {
    fontSize: typography.label,
    fontWeight: '700',
    flex: 1,
  },
  surveyInfo: {
    fontSize: typography.caption,
  },
  sectionTitle: {
    fontSize: typography.label,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  chartLabel: {
    fontSize: typography.caption,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  npsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  npsItem: {
    alignItems: 'center',
  },
  npsValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  npsLabel: {
    fontSize: typography.caption,
    marginTop: 2,
  },
  actions: {
    paddingHorizontal: spacing.xl,
  },
});

import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from 'mobile-tokens';
import { competitorData } from 'mobile-data';
import { Header, Card, Stars } from 'mobile-ui';
import { spacing, typography } from 'mobile-tokens';

export default function CompetitorsScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <Header title="Competitor comparison" showBack />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
      >
        <Card style={styles.card}>
          <Text style={[styles.note, { color: colors.muted }]}>
            Fictional comparison data for demonstration only.
          </Text>
        </Card>

        {competitorData.map((comp) => (
          <Card
            key={comp.name}
            style={StyleSheet.flatten(
              comp.isYou
                ? [styles.card, { borderColor: colors.violet, borderWidth: 2 }]
                : styles.card,
            )}
          >
            <View style={styles.header}>
              <Text style={[styles.name, { color: colors.ink }]}>
                {comp.name}
              </Text>
              {comp.isYou && (
                <View
                  style={[
                    styles.youBadge,
                    { backgroundColor: colors.actionBg },
                  ]}
                >
                  <Text style={styles.youText}>You</Text>
                </View>
              )}
            </View>
            <View style={styles.metrics}>
              <View style={styles.metric}>
                <Stars rating={Math.round(comp.rating)} size={14} />
                <Text style={[styles.metricValue, { color: colors.ink }]}>
                  {comp.rating}
                </Text>
              </View>
              <View style={styles.metric}>
                <Text style={[styles.metricValue, { color: colors.ink }]}>
                  {comp.reviews}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.muted }]}>
                  Reviews
                </Text>
              </View>
              <View style={styles.metric}>
                <Text style={[styles.metricValue, { color: colors.ink }]}>
                  {comp.responseRate}%
                </Text>
                <Text style={[styles.metricLabel, { color: colors.muted }]}>
                  Response rate
                </Text>
              </View>
            </View>
          </Card>
        ))}
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
  note: {
    fontSize: typography.caption,
    fontStyle: 'italic',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  name: {
    fontSize: typography.heading,
    fontWeight: '700',
    flexShrink: 1,
  },
  youBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  youText: {
    color: '#ffffff',
    fontSize: typography.caption,
    fontWeight: '700',
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  metric: {
    flexGrow: 1,
    flexBasis: 80,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: typography.heading,
    fontWeight: '700',
    flexShrink: 1,
  },
  metricLabel: {
    fontSize: typography.caption,
    marginTop: 2,
  },
});

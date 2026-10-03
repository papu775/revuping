import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'mobile-tokens';
import { useDemoStore, reportRows } from 'mobile-data';
import { Header, Card, Select, BarChart, LineChart } from 'mobile-ui';
import { spacing, typography } from 'mobile-tokens';

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { state } = useDemoStore();
  const [location, setLocation] = useState('All locations');
  const [dateRange, setDateRange] = useState('Last 4 weeks');

  const locations = ['All locations', ...new Set(reportRows.map((r) => r.location))];

  const filtered = useMemo(() => {
    if (location === 'All locations') return reportRows;
    return reportRows.filter((r) => r.location === location);
  }, [location]);

  const totals = filtered.reduce(
    (acc, row) => ({
      requests: acc.requests + row.requests,
      clicks: acc.clicks + row.clicks,
      feedback: acc.feedback + row.feedback,
      reviews: acc.reviews + row.reviews,
    }),
    { requests: 0, clicks: 0, feedback: 0, reviews: 0 },
  );

  const trendData = filtered.map((r) => r.requests);
  const trendLabels = filtered.map((r) => r.date.slice(5));

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <Header title="Reports" showBack />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <Card style={styles.card}>
          <Select label="Location" value={location} options={locations} onChange={setLocation} />
          <Select label="Date range" value={dateRange} options={['Last 4 weeks', 'Last 8 weeks', 'Last 12 weeks']} onChange={setDateRange} />
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.ink }]}>{totals.requests}</Text>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>Requests</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.ink }]}>{totals.clicks}</Text>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>Clicks</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.ink }]}>{totals.feedback}</Text>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>Feedback</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.ink }]}>{totals.reviews}</Text>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>Reviews</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Request trend</Text>
          <LineChart data={trendData} labels={trendLabels} color={colors.violet} />
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Weekly comparison</Text>
          <BarChart data={filtered.map((r) => r.feedback)} labels={trendLabels} color={colors.chartSage} />
        </Card>
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
  sectionTitle: {
    fontSize: typography.label,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: typography.caption,
    marginTop: 2,
  },
});

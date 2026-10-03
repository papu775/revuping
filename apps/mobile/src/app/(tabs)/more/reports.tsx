import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from 'mobile-tokens';
import { reportRows, formatDate, countLabel } from 'mobile-data';
import { Header, Card, Select, BarChart, LineChart } from 'mobile-ui';
import { spacing, typography } from 'mobile-tokens';

export default function ReportsScreen() {
  const { colors } = useTheme();
  const [location, setLocation] = useState('All locations');
  const [dateRange, setDateRange] = useState('Last 30 days');

  const locations = [
    'All locations',
    ...new Set(reportRows.map((r) => r.location)),
  ];

  const filtered = useMemo(() => {
    const days = Number(dateRange.split(' ')[1]);
    const latest = Math.max(...reportRows.map((r) => Date.parse(r.date)));
    return reportRows.filter(
      (r) =>
        (location === 'All locations' || r.location === location) &&
        Date.parse(r.date) > latest - days * 86400000,
    );
  }, [location, dateRange]);
  const weekly = [...new Set(filtered.map((r) => r.date))]
    .sort()
    .map((date) => ({
      date,
      requests: filtered
        .filter((r) => r.date === date)
        .reduce((n, r) => n + r.requests, 0),
      feedback: filtered
        .filter((r) => r.date === date)
        .reduce((n, r) => n + r.feedback, 0),
    }));

  const totals = filtered.reduce(
    (acc, row) => ({
      requests: acc.requests + row.requests,
      clicks: acc.clicks + row.clicks,
      feedback: acc.feedback + row.feedback,
      reviews: acc.reviews + row.reviews,
    }),
    { requests: 0, clicks: 0, feedback: 0, reviews: 0 },
  );

  const trendData = weekly.map((r) => r.requests);
  const trendLabels = weekly.map((r) => formatDate(r.date, true));

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <Header title="Reports" showBack />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
      >
        <Card style={styles.card}>
          <Select
            label="Location"
            value={location}
            options={locations}
            onChange={setLocation}
          />
          <Select
            label="Date range"
            value={dateRange}
            options={['Last 7 days', 'Last 14 days', 'Last 30 days']}
            onChange={setDateRange}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>
            Summary · {dateRange.toLowerCase()}
          </Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.ink }]}>
                {totals.requests}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>
                Requests
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.ink }]}>
                {totals.clicks}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>
                Review-link clicks
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.ink }]}>
                {totals.feedback}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>
                Private feedback
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.ink }]}>
                {totals.reviews}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>
                Google reviews
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>
            Requests by week · count
          </Text>
          <LineChart
            data={trendData}
            labels={trendLabels}
            color={colors.violet}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>
            Private feedback by week · count
          </Text>
          <BarChart
            data={weekly.map((r) => r.feedback)}
            labels={trendLabels}
            color={colors.chartSage}
          />
        </Card>
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>
            Chart values
          </Text>
          {weekly.map((row) => (
            <Text
              key={row.date}
              style={{ color: colors.muted, marginBottom: 12 }}
            >
              {formatDate(row.date)}: {countLabel(row.requests, 'request')} ·{' '}
              {countLabel(row.feedback, 'feedback item')}
            </Text>
          ))}
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

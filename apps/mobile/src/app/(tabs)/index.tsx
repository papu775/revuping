import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'mobile-tokens';
import {
  useDemoStore,
  overviewMetrics,
  sampleTrend,
  countLabel,
  dashboardPeriod,
} from 'mobile-data';
import { Card, Badge, BarChart, Avatar, Stars } from 'mobile-ui';
import { spacing, typography } from 'mobile-tokens';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { state } = useDemoStore();

  const unresolved = state.feedback.filter((f) => !f.resolved);
  const pendingReplies = state.reviews.filter(
    (r) => !state.approvedReplies.includes(r.id),
  );
  const scheduledCampaigns = state.campaigns.filter(
    (c) => c.status === 'Scheduled',
  );

  const setupTasks = [
    {
      label: 'Complete business onboarding',
      done: state.business.onboarded,
      route: '/onboarding',
    },
    {
      label: 'Record customer consent',
      done: state.customers.some((c) => c.consent),
      route: '/(tabs)/customers',
    },
    {
      label: 'Inspect a request schedule',
      done: scheduledCampaigns.length > 0,
      route: '/(tabs)/campaigns',
    },
    {
      label: 'Preview a Google connection',
      done: state.connections.Google === 'Demo connected',
      route: '/(tabs)/more/integrations',
    },
  ];
  const completedCount = setupTasks.filter((t) => t.done).length;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.canvas, paddingTop: insets.top },
      ]}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View style={styles.header}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={[styles.greeting, { color: colors.muted }]}>
              Welcome back
            </Text>
            <Text style={[styles.businessName, { color: colors.ink }]}>
              {state.business.name}
            </Text>
          </View>
          <Badge label="Demo" tone="violet" />
        </View>

        {unresolved.length > 0 && (
          <TouchableOpacity
            style={[
              styles.alertBanner,
              { backgroundColor: colors.surfaceSelected },
            ]}
            onPress={() => router.push('/(tabs)/feedback')}
            accessibilityRole="button"
            accessibilityLabel={`${unresolved.length} feedback responses need attention`}
          >
            <Ionicons name="sparkles" size={20} color={colors.violet} />
            <Text style={[styles.alertText, { color: colors.ink }]}>
              {unresolved.length} feedback{' '}
              {unresolved.length === 1 ? 'response needs' : 'responses need'}{' '}
              attention
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.violet} />
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>
            Sample week
          </Text>
          <Text style={[styles.period, { color: colors.muted }]}>
            {dashboardPeriod.current}
          </Text>
          <View style={styles.metricGrid}>
            {overviewMetrics.map((metric) => (
              <Card key={metric.label} style={styles.metricCard}>
                <Text style={[styles.metricLabel, { color: colors.muted }]}>
                  {metric.label}
                </Text>
                <Text style={[styles.metricValue, { color: colors.ink }]}>
                  {metric.value}
                </Text>
                <Text style={[styles.metricChange, { color: colors.muted }]}>
                  {metric.label === 'Private feedback'
                    ? `${unresolved.length} need your attention`
                    : metric.change}
                </Text>
              </Card>
            ))}
          </View>
          <Text
            style={[
              styles.period,
              { color: colors.muted, marginTop: 12, marginBottom: 0 },
            ]}
          >
            Comparisons use the previous sample week: {dashboardPeriod.previous}
            .
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>
            Weekly trend
          </Text>
          <Card>
            <Text style={[styles.chartTitle, { color: colors.ink }]}>
              QR scans · {dashboardPeriod.current}
            </Text>
            <BarChart
              data={sampleTrend.scans}
              labels={sampleTrend.days}
              color={colors.violet}
            />
            <Text
              style={{
                color: colors.muted,
                fontSize: 13,
                lineHeight: 20,
                marginTop: 12,
              }}
            >
              {sampleTrend.days
                .map((day, i) => `${day}: ${sampleTrend.scans[i]}`)
                .join(' · ')}
              {'\n'}
              {countLabel(
                sampleTrend.scans.reduce((sum, n) => sum + n, 0),
                'scan',
              )}{' '}
              · Scans do not confirm reviews.
            </Text>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>
            Today's tasks
          </Text>
          <Card>
            {unresolved.slice(0, 3).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.taskRow, { borderBottomColor: colors.border }]}
                onPress={() => router.push(`/(tabs)/feedback/${item.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Follow up with ${item.name}`}
              >
                <Avatar initials={item.initials} tone="peach" size={36} />
                <View style={styles.taskText}>
                  <Text style={[styles.taskTitle, { color: colors.ink }]}>
                    Follow up with {item.name}
                  </Text>
                  <Text style={[styles.taskSubtitle, { color: colors.muted }]}>
                    {item.date} · {item.staff}
                  </Text>
                  <View style={{ marginTop: 6 }}>
                    <Stars rating={item.rating} size={14} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            {pendingReplies.length > 0 && (
              <TouchableOpacity
                style={[styles.taskRow, { borderBottomColor: colors.border }]}
                onPress={() => router.push('/(tabs)/more/reviews')}
                accessibilityRole="button"
                accessibilityLabel={`Approve ${pendingReplies[0].name}'s reply draft`}
              >
                <View
                  style={[
                    styles.taskIcon,
                    { backgroundColor: colors.surfaceSelected },
                  ]}
                >
                  <Ionicons name="chatbubble" size={18} color={colors.violet} />
                </View>
                <View style={styles.taskText}>
                  <Text style={[styles.taskTitle, { color: colors.ink }]}>
                    Approve {pendingReplies[0].name}'s reply draft
                  </Text>
                  <Text style={[styles.taskSubtitle, { color: colors.muted }]}>
                    {pendingReplies.length} awaiting approval
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>
            Setup progress
          </Text>
          <Card>
            <Text style={[styles.setupProgress, { color: colors.muted }]}>
              {completedCount} of {setupTasks.length} complete
            </Text>
            {setupTasks.map((task) => (
              <TouchableOpacity
                key={task.label}
                style={[styles.setupRow, { borderBottomColor: colors.border }]}
                onPress={() => router.push(task.route as Href)}
                accessibilityRole="button"
                accessibilityLabel={`${task.label}: ${task.done ? 'complete' : 'incomplete'}`}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: task.done ? colors.violet : colors.border,
                      backgroundColor: task.done
                        ? colors.actionBg
                        : 'transparent',
                    },
                  ]}
                >
                  {task.done && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.setupLabel, { color: colors.ink }]}>
                  {task.label}
                </Text>
              </TouchableOpacity>
            ))}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  greeting: {
    fontSize: typography.caption,
  },
  businessName: {
    fontSize: typography.title,
    fontWeight: '700',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
  },
  alertText: {
    flex: 1,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.heading,
    fontWeight: '700',
    flexShrink: 1,
    marginBottom: spacing.md,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  period: { fontSize: typography.caption, lineHeight: 20, marginBottom: 12 },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.md,
  },
  metricLabel: {
    fontSize: typography.caption,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    marginVertical: spacing.xs,
  },
  metricChange: {
    fontSize: typography.caption,
  },
  chartTitle: {
    fontSize: typography.label,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  taskIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskText: {
    flex: 1,
  },
  taskTitle: {
    fontSize: typography.label,
    fontWeight: '600',
  },
  taskSubtitle: {
    fontSize: typography.caption,
    marginTop: 2,
  },
  setupProgress: {
    fontSize: typography.caption,
    marginBottom: spacing.md,
  },
  setupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  setupLabel: {
    flex: 1,
    fontSize: typography.label,
  },
});

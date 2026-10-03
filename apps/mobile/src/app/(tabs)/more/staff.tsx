import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from 'mobile-tokens';
import { useDemoStore, staffMembers, countLabel } from 'mobile-data';
import {
  Header,
  Card,
  Avatar,
  Stars,
  Select,
  BarChart,
  EmptyState,
} from 'mobile-ui';
import { spacing, typography } from 'mobile-tokens';

export default function StaffScreen() {
  const { colors } = useTheme();
  const { state } = useDemoStore();
  const [staffFilter, setStaffFilter] = useState('All staff');
  const [serviceFilter, setServiceFilter] = useState('All services');

  const services = [
    'All services',
    ...new Set(staffMembers.map((s) => s.service)),
  ];

  const filtered = useMemo(() => {
    return staffMembers.filter(
      (m) =>
        (staffFilter === 'All staff' || m.name === staffFilter) &&
        (serviceFilter === 'All services' || m.service === serviceFilter),
    );
  }, [staffFilter, serviceFilter]);

  const staffInsights = filtered.map((member) => {
    const items = state.feedback.filter((f) => f.staff === member.name);
    const avg = items.length
      ? items.reduce((s, f) => s + f.rating, 0) / items.length
      : 0;
    return { ...member, avg, count: items.length };
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <Header title="Staff & services" showBack />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
      >
        <Card style={styles.card}>
          <Select
            label="Staff member"
            value={staffFilter}
            options={['All staff', ...staffMembers.map((s) => s.name)]}
            onChange={setStaffFilter}
          />
          <Select
            label="Service"
            value={serviceFilter}
            options={services}
            onChange={setServiceFilter}
          />
        </Card>

        {!staffInsights.length && (
          <EmptyState
            title="No matching staff"
            message="Try a different staff member or service."
          />
        )}
        {staffInsights.map((member) => (
          <Card key={member.name} style={styles.card}>
            <View style={styles.memberHeader}>
              <Avatar
                initials={member.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
                tone="lavender"
                size={48}
              />
              <View style={styles.memberInfo}>
                <Text style={[styles.memberName, { color: colors.ink }]}>
                  {member.name}
                </Text>
                <Text style={[styles.memberRole, { color: colors.muted }]}>
                  {member.role} · {member.service}
                </Text>
              </View>
              <View style={styles.ratingContainer}>
                <Stars rating={member.avg} size={14} />
                <Text style={[styles.ratingText, { color: colors.ink }]}>
                  {member.avg.toFixed(1)}
                </Text>
              </View>
            </View>
            <Text style={[styles.memberTheme, { color: colors.muted }]}>
              {member.theme}
            </Text>
            <View style={styles.feedbackRow}>
              <Text style={[styles.feedbackCount, { color: colors.violet }]}>
                {countLabel(member.count, 'feedback item')}
              </Text>
            </View>
          </Card>
        ))}

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>
            Private feedback by staff
          </Text>
          <BarChart
            data={staffInsights.map((m) => m.count)}
            labels={staffInsights.map((m) => m.name)}
            color={colors.violet}
          />
          {staffInsights.map((m) => (
            <Text key={m.name} style={{ color: colors.muted, marginTop: 8 }}>
              {m.name}: {countLabel(m.count, 'feedback item')} ·{' '}
              {m.count ? `${m.avg.toFixed(1)} / 5 average` : 'No ratings yet'}
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
  memberHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  memberInfo: {
    flex: 1,
    minWidth: 120,
  },
  memberName: {
    fontSize: typography.label,
    fontWeight: '700',
  },
  memberRole: {
    fontSize: typography.caption,
    marginTop: 2,
  },
  ratingContainer: {
    alignItems: 'center',
  },
  ratingText: {
    fontSize: typography.caption,
    fontWeight: '700',
    marginTop: 2,
  },
  memberTheme: {
    fontSize: typography.caption,
    fontStyle: 'italic',
  },
  feedbackRow: {
    marginTop: spacing.sm,
  },
  feedbackCount: {
    fontSize: typography.caption,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: typography.label,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
});

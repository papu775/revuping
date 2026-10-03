import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'mobile-tokens';
import { useDemoStore, formatDateTime, countLabel } from 'mobile-data';
import { FilterChips, Card, Badge, EmptyState, IconButton } from 'mobile-ui';
import { spacing, typography } from 'mobile-tokens';
import { Ionicons } from '@expo/vector-icons';

const filters = ['All', 'Review request', 'Reminder', 'Repeat visit'];

export default function CampaignsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { state } = useDemoStore();
  const [filter, setFilter] = useState('All');

  const filtered = useMemo(() => {
    if (filter === 'All') return state.campaigns;
    return state.campaigns.filter((c) => c.kind === filter);
  }, [state.campaigns, filter]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.canvas, paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.ink }]}>Campaigns</Text>
        <IconButton
          onPress={() => router.push('/(tabs)/campaigns/builder')}
          accessibilityLabel="Create campaign"
        >
          <Ionicons name="add" size={24} color={colors.violet} />
        </IconButton>
      </View>

      <FilterChips options={filters} value={filter} onChange={setFilter} />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="megaphone" size={40} color={colors.muted} />}
            title="No campaigns"
            message="Create your first campaign to start reaching customers."
            action={
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/campaigns/builder')}
                accessibilityRole="button"
              >
                <Text style={{ color: colors.violet, fontWeight: '600' }}>
                  Create campaign
                </Text>
              </TouchableOpacity>
            }
          />
        ) : (
          filtered.map((campaign) => (
            <Card key={campaign.id} style={styles.campaignCard}>
              <View style={styles.campaignHeader}>
                <Text style={[styles.campaignName, { color: colors.ink }]}>
                  {campaign.name}
                </Text>
                <Badge
                  label={campaign.status}
                  tone={
                    campaign.status === 'Scheduled'
                      ? 'violet'
                      : campaign.status === 'Completed'
                        ? 'mint'
                        : campaign.status === 'Paused'
                          ? 'warm'
                          : 'muted'
                  }
                />
              </View>
              <Text style={[styles.campaignKind, { color: colors.muted }]}>
                {campaign.kind} · {campaign.channel}
              </Text>
              <Text style={[styles.campaignAudience, { color: colors.muted }]}>
                {campaign.audience}
              </Text>
              <View style={styles.campaignFooter}>
                <Text style={[styles.campaignDate, { color: colors.muted }]}>
                  {campaign.scheduled
                    ? `Scheduled: ${formatDateTime(campaign.scheduled)}`
                    : 'Not scheduled'}
                </Text>
                <Text
                  style={[styles.campaignCustomers, { color: colors.violet }]}
                >
                  {countLabel(campaign.customerIds.length, 'customer')}
                </Text>
              </View>
            </Card>
          ))
        )}
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
  title: {
    fontSize: typography.title,
    fontWeight: '700',
  },
  filterRow: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
  },
  filterText: {
    fontSize: typography.caption,
    fontWeight: '600',
  },
  campaignCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  campaignHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  campaignName: {
    minWidth: 120,
    fontSize: typography.label,
    fontWeight: '700',
    flex: 1,
  },
  campaignKind: {
    fontSize: typography.caption,
    marginBottom: 2,
  },
  campaignAudience: {
    fontSize: typography.caption,
    marginBottom: spacing.sm,
  },
  campaignFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  campaignDate: {
    fontSize: typography.caption,
  },
  campaignCustomers: {
    fontSize: typography.caption,
    fontWeight: '600',
  },
});

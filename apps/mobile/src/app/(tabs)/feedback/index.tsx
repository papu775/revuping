import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'mobile-tokens';
import { useDemoStore } from 'mobile-data';
import { FilterChips, Card, Badge, Avatar, Stars, EmptyState } from 'mobile-ui';
import { spacing, typography } from 'mobile-tokens';
import { Ionicons } from '@expo/vector-icons';

const filters = ['All', 'Unresolved', 'Resolved', 'Needs care'];

export default function FeedbackScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { state } = useDemoStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');

  const filtered = useMemo(() => {
    let items = state.feedback;
    if (filter === 'Unresolved') items = items.filter((f) => !f.resolved);
    if (filter === 'Resolved') items = items.filter((f) => f.resolved);
    if (filter === 'Needs care')
      items = items.filter((f) => !f.resolved && f.rating <= 3);
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter(
        (f) =>
          f.name.toLowerCase().includes(q) || f.text.toLowerCase().includes(q),
      );
    }
    return items;
  }, [state.feedback, filter, query]);

  const unresolvedCount = state.feedback.filter((f) => !f.resolved).length;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.canvas, paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.ink }]}>
          Feedback inbox
        </Text>
        <Badge
          label={`${unresolvedCount} unresolved`}
          tone={unresolvedCount > 0 ? 'warm' : 'mint'}
        />
      </View>

      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: colors.surfaceInput,
              borderColor: colors.controlBorder,
            },
          ]}
        >
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search feedback..."
            placeholderTextColor={colors.disabledInk}
            style={[styles.searchInput, { color: colors.ink }]}
            accessibilityLabel="Search feedback"
          />
        </View>
      </View>

      <FilterChips options={filters} value={filter} onChange={setFilter} />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="chatbubble" size={40} color={colors.muted} />}
            title="No feedback found"
            message={
              query
                ? 'Try a different search term.'
                : 'No feedback matches this filter.'
            }
          />
        ) : (
          filtered.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => router.push(`/(tabs)/feedback/${item.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`Feedback from ${item.name}, ${item.rating} stars, ${item.resolved ? 'resolved' : 'unresolved'}`}
            >
              <Card style={styles.feedbackCard}>
                <View style={styles.feedbackHeader}>
                  <Avatar
                    initials={item.initials}
                    tone={
                      item.rating >= 4
                        ? 'sage'
                        : item.rating === 3
                          ? 'peach'
                          : 'rose'
                    }
                    size={40}
                  />
                  <View style={styles.feedbackInfo}>
                    <Text style={[styles.feedbackName, { color: colors.ink }]}>
                      {item.name}
                    </Text>
                    <Text
                      style={[styles.feedbackDate, { color: colors.muted }]}
                    >
                      {item.date} · {item.staff}
                    </Text>
                  </View>
                  <Stars rating={item.rating} size={14} />
                </View>
                <Text
                  style={[styles.feedbackText, { color: colors.muted }]}
                  numberOfLines={2}
                >
                  {item.text}
                </Text>
                <View style={styles.feedbackFooter}>
                  <Badge
                    label={
                      item.resolved
                        ? 'Resolved'
                        : item.rating <= 3
                          ? 'Needs care'
                          : 'New'
                    }
                    tone={
                      item.resolved
                        ? 'mint'
                        : item.rating <= 3
                          ? 'warm'
                          : 'violet'
                    }
                  />
                  {state.notes[item.id] ? (
                    <Text
                      style={[styles.noteIndicator, { color: colors.violet }]}
                    >
                      Note added
                    </Text>
                  ) : null}
                </View>
              </Card>
            </TouchableOpacity>
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
  searchContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.body,
    paddingVertical: spacing.sm,
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
  feedbackCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  feedbackInfo: {
    flex: 1,
  },
  feedbackName: {
    fontSize: typography.label,
    fontWeight: '600',
  },
  feedbackDate: {
    fontSize: typography.caption,
    marginTop: 2,
  },
  feedbackText: {
    fontSize: typography.caption,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  feedbackFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  noteIndicator: {
    fontSize: typography.caption,
    fontWeight: '600',
  },
});

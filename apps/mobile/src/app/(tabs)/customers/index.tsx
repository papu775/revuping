import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'mobile-tokens';
import { useDemoStore } from 'mobile-data';
import { Card, Badge, Avatar, EmptyState, IconButton } from 'mobile-ui';
import { spacing, typography } from 'mobile-tokens';
import { Ionicons } from '@expo/vector-icons';

const filters = ['All', 'Consented', 'No consent', 'Opted out'];

export default function CustomersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { state } = useDemoStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');

  const filtered = useMemo(() => {
    let items = state.customers;
    if (filter === 'Consented') items = items.filter((c) => c.consent && !c.optedOut);
    if (filter === 'No consent') items = items.filter((c) => !c.consent && !c.optedOut);
    if (filter === 'Opted out') items = items.filter((c) => c.optedOut);
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
    }
    return items;
  }, [state.customers, filter, query]);

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.ink }]}>Customers</Text>
        <IconButton onPress={() => router.push('/(tabs)/customers/add')} accessibilityLabel="Add customer">
          <Ionicons name="add" size={24} color={colors.violet} />
        </IconButton>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: colors.surfaceInput, borderColor: colors.controlBorder }]}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search customers..."
            placeholderTextColor={colors.disabledInk}
            style={[styles.searchInput, { color: colors.ink }]}
            accessibilityLabel="Search customers"
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.filterChip,
              {
                backgroundColor: filter === f ? colors.violet : colors.surface,
                borderColor: filter === f ? colors.violet : colors.border,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Filter: ${f}`}
          >
            <Text style={[styles.filterText, { color: filter === f ? '#ffffff' : colors.ink }]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="people" size={40} color={colors.muted} />}
            title="No customers found"
            message={query ? 'Try a different search term.' : 'No customers match this filter.'}
            action={
              <TouchableOpacity onPress={() => router.push('/(tabs)/customers/add')} accessibilityRole="button">
                <Text style={{ color: colors.violet, fontWeight: '600' }}>Add your first customer</Text>
              </TouchableOpacity>
            }
          />
        ) : (
          filtered.map((customer) => (
            <TouchableOpacity
              key={customer.id}
              onPress={() => router.push(`/(tabs)/customers/${customer.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`${customer.name}, ${customer.consent ? 'consented' : 'no consent'}`}
            >
              <Card style={styles.customerCard}>
                <View style={styles.customerRow}>
                  <Avatar initials={customer.name.split(' ').map((n) => n[0]).join('')} tone={customer.consent ? 'sage' : 'peach'} size={40} />
                  <View style={styles.customerInfo}>
                    <Text style={[styles.customerName, { color: colors.ink }]}>{customer.name}</Text>
                    <Text style={[styles.customerEmail, { color: colors.muted }]}>{customer.email}</Text>
                  </View>
                  <Badge
                    label={customer.optedOut ? 'Opted out' : customer.consent ? 'Consented' : 'No consent'}
                    tone={customer.optedOut ? 'danger' : customer.consent ? 'mint' : 'warm'}
                  />
                </View>
                {customer.tags.length > 0 && (
                  <View style={styles.tagRow}>
                    {customer.tags.map((tag) => (
                      <View key={tag} style={[styles.tag, { backgroundColor: colors.surfaceSection }]}>
                        <Text style={[styles.tagText, { color: colors.muted }]}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
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
    minHeight: 44,
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
  customerCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: typography.label,
    fontWeight: '600',
  },
  customerEmail: {
    fontSize: typography.caption,
    marginTop: 2,
  },
  tagRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: typography.caption,
    fontWeight: '600',
  },
});

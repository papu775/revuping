import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from 'mobile-tokens';
import { spacing, typography } from 'mobile-tokens';

export function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.muted }]} accessibilityRole="header">
        {title}
      </Text>
      <View style={[styles.content, { borderBottomColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

export function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.item}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.ink }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  content: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  label: {
    fontSize: typography.caption,
    flex: 1,
  },
  value: {
    fontSize: typography.label,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
});

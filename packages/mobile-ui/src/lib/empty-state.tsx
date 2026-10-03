import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from 'mobile-tokens';
import { spacing, typography } from 'mobile-tokens';

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.container} accessibilityLabel={`${title}: ${message}`}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.title, { color: colors.ink }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.muted }]}>{message}</Text>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

export function ErrorState({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.container} accessibilityLabel={`Error: ${title}. ${message}`}>
      <Text style={[styles.title, { color: colors.danger }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.muted }]}>{message}</Text>
      {onRetry ? (
        <Text style={[styles.retry, { color: colors.violet }]} onPress={onRetry}>
          Tap to retry
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  icon: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.heading,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    fontSize: typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  action: {
    marginTop: spacing.lg,
  },
  retry: {
    fontSize: typography.label,
    fontWeight: '600',
    marginTop: spacing.md,
  },
});

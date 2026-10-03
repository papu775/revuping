import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import { useTheme } from 'mobile-tokens';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography } from 'mobile-tokens';

export function Header({
  title,
  subtitle,
  showBack = true,
  right,
  fallbackHref = '/(tabs)/more',
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  right?: React.ReactNode;
  fallbackHref?: Href;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          paddingTop: insets.top + spacing.sm,
        },
      ]}
    >
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace(fallbackHref)
            }
            style={styles.backButton}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={24} color={colors.ink} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}
        <View style={styles.titleContainer}>
          <Text
            style={[styles.title, { color: colors.ink }]}

            accessibilityRole="header"
          >
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.right}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    minHeight: 48,
  },
  backButton: {
    width: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -spacing.sm,
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  title: {
    fontSize: typography.heading,
    fontWeight: '700',
    flexShrink: 1,
  },
  subtitle: {
    fontSize: typography.caption,
    marginTop: 2,
  },
  right: {
    minWidth: 0,
    alignItems: 'flex-end',
  },
});

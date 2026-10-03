import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from 'mobile-tokens';
import { radius, spacing } from 'mobile-tokens';

export function Card({
  children,
  style,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
  },
});

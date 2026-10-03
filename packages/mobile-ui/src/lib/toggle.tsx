import { View, Text, Switch, StyleSheet } from 'react-native';
import { useTheme } from 'mobile-tokens';
import { spacing, typography } from 'mobile-tokens';

export function Toggle({
  label,
  value,
  onValueChange,
  description,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  description?: string;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={[styles.label, { color: colors.ink }]}>{label}</Text>
        {description ? (
          <Text style={[styles.description, { color: colors.muted }]}>
            {description}
          </Text>
        ) : null}
      </View>
      <View style={{ alignItems: 'center', gap: 3 }}>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.controlBorder, true: colors.actionBg }}
          thumbColor="#ffffff"
          ios_backgroundColor={colors.controlBorder}
          accessibilityLabel={label}
        />
        <Text
          style={{
            fontSize: 12,
            color: value ? colors.violet : colors.muted,
            fontWeight: '600',
          }}
          accessible={false}
        >
          {value ? 'On' : 'Off'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  label: {
    fontSize: typography.label,
    fontWeight: '600',
  },
  description: {
    fontSize: typography.caption,
    marginTop: 2,
  },
});

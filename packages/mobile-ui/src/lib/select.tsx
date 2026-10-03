import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from 'mobile-tokens';
import { radius, spacing, typography } from 'mobile-tokens';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from './bottom-sheet.tsx';

export function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[
          styles.trigger,
          {
            backgroundColor: colors.surfaceInput,
            borderColor: colors.controlBorder,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
        accessibilityState={{ expanded: open }}
      >
        <Text style={[styles.value, { color: colors.ink }]}>{value}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.muted} />
      </TouchableOpacity>
      <BottomSheet visible={open} onClose={() => setOpen(false)} title={label}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            onPress={() => {
              onChange(option);
              setOpen(false);
            }}
            accessibilityState={{ selected: option === value }}
            style={[
              styles.option,
              {
                backgroundColor:
                  option === value ? colors.surfaceSelected : undefined,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={option}
          >
            <Text style={[styles.optionText, { color: colors.ink }]}>
              {option}
            </Text>
            {option === value && (
              <Ionicons name="checkmark" size={18} color={colors.violet} />
            )}
          </TouchableOpacity>
        ))}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.caption,
    fontWeight: '600',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  value: {
    fontSize: typography.body,
    flex: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    gap: spacing.sm,
    minHeight: 48,
  },
  optionText: {
    fontSize: typography.body,
    flex: 1,
  },
});

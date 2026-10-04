import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from 'mobile-tokens';
import { radius, spacing, typography } from 'mobile-tokens';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from './bottom-sheet.tsx';

export function Select({
  label,
  value,
  options,
  onChange,
  searchable = false,
  optionLabel = (option: string) => option,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  searchable?: boolean;
  optionLabel?: (option: string) => string;
}) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <TouchableOpacity
        onPress={() => {
          setQuery('');
          setOpen(true);
        }}
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
        <Text style={[styles.value, { color: colors.ink }]}>
          {optionLabel(value)}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.muted} />
      </TouchableOpacity>
      <BottomSheet visible={open} onClose={() => setOpen(false)} title={label}>
        {searchable && (
          <TextInput
            accessibilityLabel={`Search ${label}`}
            value={query}
            onChangeText={setQuery}
            placeholder="Search city or region"
            placeholderTextColor={colors.muted}
            style={[
              styles.trigger,
              {
                color: colors.ink,
                borderColor: colors.controlBorder,
                marginBottom: 12,
              },
            ]}
            autoCorrect={false}
          />
        )}
        {options
          .filter(
            (option) =>
              !searchable ||
              optionLabel(option).toLowerCase().includes(query.toLowerCase()),
          )
          .map((option) => (
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
              accessibilityLabel={optionLabel(option)}
            >
              <Text style={[styles.optionText, { color: colors.ink }]}>
                {optionLabel(option)}
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

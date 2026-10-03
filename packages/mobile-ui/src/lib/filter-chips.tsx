import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme, spacing } from 'mobile-tokens';

export function FilterChips({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <ScrollView
      horizontal
      style={styles.scroll}
      contentContainerStyle={styles.row}
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          accessibilityRole="button"
          accessibilityLabel={`Filter: ${option}`}
          accessibilityState={{ selected: option === value }}
          onPress={() => onChange(option)}
          style={[
            styles.chip,
            {
              backgroundColor:
                option === value ? colors.actionBg : colors.surface,
              borderColor: option === value ? colors.actionBg : colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.text,
              { color: option === value ? colors.onDark : colors.ink },
            ]}
          >
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  scroll: { flexGrow: 0, flexShrink: 0 },
  row: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  chip: {
    minHeight: 48,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  text: { fontSize: 13, fontWeight: '600' },
});

import { useEffect, useRef } from 'react';
import {
  Animated,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme, useReducedMotion, spacing } from 'mobile-tokens';

function Chip({
  option,
  selected,
  onPress,
}: {
  option: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    opacity.setValue(reduced ? 1 : 0.9);
    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: reduced ? 0 : 180,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [selected, reduced, opacity]);
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Filter: ${option}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.actionBg : colors.surface,
          borderColor: selected ? colors.actionBg : colors.border,
        },
      ]}
    >
      <Animated.Text
        style={[
          styles.text,
          { color: selected ? colors.onDark : colors.ink, opacity },
        ]}
      >
        {option}
      </Animated.Text>
    </TouchableOpacity>
  );
}

export function FilterChips({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      style={styles.scroll}
      contentContainerStyle={styles.row}
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {options.map((option) => (
        <Chip
          key={option}
          option={option}
          selected={option === value}
          onPress={() => onChange(option)}
        />
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

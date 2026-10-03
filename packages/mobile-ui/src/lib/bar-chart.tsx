import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from 'mobile-tokens';
import { spacing, typography } from 'mobile-tokens';

export function BarChart({
  data,
  labels,
  color,
  height = 120,
  accessibilityLabel,
}: {
  data: number[];
  labels: string[];
  color?: string;
  height?: number;
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  const barColor = color ?? colors.violet;
  const maxValue = Math.max(...data, 1);

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="image"
      accessibilityLabel={
        accessibilityLabel ??
        `Bar chart. ${data.map((v, i) => `${labels[i]}: ${v}`).join('. ')}`
      }
    >
      <View style={[styles.chart, { height }]}>
        {data.map((value, index) => (
          <View key={index} style={styles.barContainer}>
            <View
              style={[
                styles.bar,
                {
                  height: `${(value / maxValue) * 100}%`,
                  backgroundColor: barColor,
                  minHeight: value > 0 ? 4 : 0,
                },
              ]}
            />
          </View>
        ))}
      </View>
      <View style={styles.labels}>
        {labels.map((label, index) => (
          <View key={index} style={{ flex: 1, gap: 4 }}>
            <Text
              style={[styles.label, { color: colors.ink, fontWeight: '600' }]}
            >
              {data[index]}
            </Text>
            <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  barContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    height: '100%',
  },
  bar: {
    borderRadius: 4,
    minHeight: 4,
  },
  labels: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  label: {
    fontSize: typography.caption,
    textAlign: 'center',
  },
});

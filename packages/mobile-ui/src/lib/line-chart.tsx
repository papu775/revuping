
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { useTheme } from 'mobile-tokens';
import { spacing, typography } from 'mobile-tokens';

const SvgComponent: React.FC<any> = Svg as any;
const PolylineComponent: React.FC<any> = Polyline as any;
const CircleComponent: React.FC<any> = Circle as any;

export function LineChart({
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
  const lineColor = color ?? colors.violet;
  const maxValue = Math.max(...data, 1);
  const minValue = Math.min(...data, 0);
  const range = maxValue - minValue || 1;
  const width = 300;
  const padding = 8;

  const points = data
    .map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((value - minValue) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <View
      style={styles.container}
      accessibilityLabel={accessibilityLabel ?? `Line chart with ${data.length} data points`}
    >
      <SvgComponent width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <PolylineComponent
          points={points}
          fill="none"
          stroke={lineColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((value, index) => {
          const x = padding + (index / (data.length - 1)) * (width - padding * 2);
          const y = height - padding - ((value - minValue) / range) * (height - padding * 2);
          return (
            <CircleComponent
              key={index}
              cx={x}
              cy={y}
              r="4"
              fill={lineColor}
            />
          );
        })}
      </SvgComponent>
      <View style={styles.labels}>
        {labels.map((label, index) => (
          <Text key={index} style={[styles.label, { color: colors.muted }]}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  label: {
    fontSize: typography.caption,
    textAlign: 'center',
  },
});

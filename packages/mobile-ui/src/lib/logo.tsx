import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { useTheme } from 'mobile-tokens';

export function Logo() {
  const { colors } = useTheme();
  return (
    <View style={styles.row} accessible accessibilityLabel="RevuPing">
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Svg width={36} height={36} viewBox="0 0 36 36">
          <Rect width={36} height={36} rx={11} fill={colors.actionBg} />
          {[12, 20, 28, 16, 8].map((height, i) => (
            <Line
              key={i}
              x1={10 + i * 4}
              x2={10 + i * 4}
              y1={18 - height / 2}
              y2={18 + height / 2}
              stroke="#ffffff"
              strokeWidth={2}
              strokeLinecap="round"
            />
          ))}
        </Svg>
      </View>
      <Text style={[styles.text, { color: colors.ink }]}>
        revu<Text style={styles.last}>ping</Text>
        <Text style={{ color: colors.violet }}>.</Text>
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  text: { fontSize: 28, fontWeight: '700', letterSpacing: -1 },
  last: { fontWeight: '400' },
});

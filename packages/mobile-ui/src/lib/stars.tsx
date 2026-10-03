
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'mobile-tokens';

export function Stars({
  rating,
  size = 16,
  color,
}: {
  rating: number;
  size?: number;
  color?: string;
}) {
  const { colors } = useTheme();
  const starColor = color ?? colors.warmInk;

  return (
    <View style={styles.container} accessibilityLabel={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name="star"
          size={size}
          color={i <= rating ? starColor : colors.border}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 2,
  },
});

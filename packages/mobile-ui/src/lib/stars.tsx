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
    <View
      accessible
      accessibilityRole="image"
      style={styles.container}
      accessibilityLabel={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={
            rating >= i
              ? 'star'
              : rating >= i - 0.5
                ? 'star-half'
                : 'star-outline'
          }
          size={size}
          color={rating >= i - 0.5 ? starColor : colors.controlBorder}
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

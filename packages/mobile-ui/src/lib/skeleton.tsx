import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, type ViewStyle } from 'react-native';
import { useTheme, useReducedMotion } from 'mobile-tokens';
import { radius, spacing } from 'mobile-tokens';

export function Skeleton({
  width,
  height = 20,
  style,
}: {
  width: ViewStyle['width'];
  height?: number;
  style?: object;
}) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (reduced) {
      opacity.setValue(0.5);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity, reduced]);

  return (
    <Animated.View
      style={[
        {
          backgroundColor: colors.surfaceSelected,
          borderRadius: radius.sm,
          width,
          opacity,
          height,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <Skeleton width="60%" height={16} style={{ marginBottom: spacing.sm }} />
      <Skeleton width="100%" height={14} style={{ marginBottom: spacing.xs }} />
      <Skeleton width="80%" height={14} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
  },
});

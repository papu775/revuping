import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';

export function IconButton({
  children,
  onPress,
  accessibilityLabel,
  size = 48,
}: {
  children: React.ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        { width: Math.max(48, size), height: Math.max(48, size) },
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
});

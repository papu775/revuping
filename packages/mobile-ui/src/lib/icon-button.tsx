import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';

export function IconButton({
  children,
  onPress,
  accessibilityLabel,
  size = 48,
  disabled = false,
}: {
  children: React.ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityState={{ disabled }}
      activeOpacity={0.65}
      style={[
        styles.button,
        {
          width: Math.max(48, size),
          height: Math.max(48, size),
          opacity: disabled ? 0.35 : 1,
        },
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

import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTheme } from 'mobile-tokens';
import { radius, spacing, typography } from 'mobile-tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityLabel,
  style,
  textStyle,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}) {
  const { colors } = useTheme();

  const bgColor =
    variant === 'primary'
      ? colors.actionBg
      : variant === 'danger'
        ? colors.dangerSoft
        : 'transparent';
  const textColor =
    variant === 'primary'
      ? colors.onDark
      : variant === 'danger'
        ? colors.danger
        : variant === 'secondary'
          ? colors.ink
          : colors.violet;
  const borderColor =
    variant === 'secondary' ? colors.controlBorder : 'transparent';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={[
        styles.base,
        {
          backgroundColor: disabled ? colors.disabledBg : bgColor,
          borderColor: disabled
            ? colors.disabledLine
            : variant === 'danger'
              ? colors.danger
              : borderColor,
        },
        style,
      ]}
    >
      {loading && (
        <ActivityIndicator
          color={textColor}
          size="small"
          style={{ marginRight: 8 }}
        />
      )}
      {
        <Text
          style={[
            styles.text,
            { color: disabled ? colors.disabledInk : textColor },
            textStyle,
          ]}
        >
          {title}
        </Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    flexDirection: 'row',
    flexShrink: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  text: {
    fontSize: typography.label,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'center',
  },
});

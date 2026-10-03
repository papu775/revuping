import { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  type TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, radius, spacing, typography } from 'mobile-tokens';
import { IconButton } from './icon-button.tsx';

export function Field({
  label,
  value,
  onChangeText,
  error,
  style,
  secureTextEntry,
  onFocus,
  onBlur,
  autoCapitalize = 'none',
  accessibilityLabel,
  ...props
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
} & Omit<TextInputProps, 'value' | 'onChangeText'>) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const input = useRef<TextInput>(null);
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.ink }]}>{label}</Text>
      <View
        style={[
          styles.wrapper,
          {
            backgroundColor: colors.surfaceInput,
            borderColor: error
              ? colors.danger
              : focused
                ? colors.violet
                : colors.controlBorder,
          },
        ]}
      >
        <TextInput
          {...props}
          ref={input}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={colors.muted}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry && !revealed}
          accessibilityLabel={accessibilityLabel ?? label}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[
            styles.input,
            { color: colors.ink },
            props.multiline && styles.multiline,
            style,
          ]}
        />
        {secureTextEntry && (
          <IconButton
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            onPress={() => {
              setRevealed(!revealed);
              input.current?.focus();
            }}
          >
            <Ionicons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.muted}
            />
          </IconButton>
        )}
      </View>
      {error && (
        <Text
          style={[styles.error, { color: colors.danger }]}
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg, gap: 8 },
  label: { fontSize: typography.caption, fontWeight: '600' },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: radius.md,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: typography.body,
  },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  error: { fontSize: typography.caption, lineHeight: 20 },
});

import { useRef, useState, type RefObject } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  type TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, radius, spacing, typography } from 'mobile-tokens';
import { IconButton } from './icon-button.tsx';

export function Field({
  label,
  inputRef,
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
  inputRef?: RefObject<TextInput | null>;
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
            borderWidth: focused ? 2 : 1,
            // Keep the control and its text aligned as the focus ring changes.
            padding: focused ? 0 : 1,
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
          ref={inputRef ?? input}
          accessibilityHint={error || props.accessibilityHint}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={colors.muted}
          underlineColorAndroid="transparent"
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
            Platform.OS === 'web' && { outlineWidth: 0, outlineStyle: 'solid' },
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
              (inputRef ?? input).current?.focus();
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
    borderWidth: 1,
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

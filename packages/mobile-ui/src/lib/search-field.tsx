import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'mobile-tokens';
import { IconButton } from './icon-button.tsx';

export function SearchField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={{
        minHeight: 52,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 2,
        borderRadius: 12,
        borderColor: focused ? colors.violet : colors.controlBorder,
        backgroundColor: colors.surfaceInput,
        paddingLeft: 12,
        paddingRight: value ? 0 : 12,
      }}
    >
      <Ionicons name="search-outline" size={20} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        accessibilityLabel={label}
        placeholder={`${label}…`}
        placeholderTextColor={colors.muted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 48,
          color: colors.ink,
          fontSize: 15,
          paddingVertical: 12,
        }}
      />
      {!!value && (
        <IconButton
          accessibilityLabel={`Clear ${label.toLowerCase()}`}
          onPress={() => onChange('')}
        >
          <Ionicons
            name="close-circle-outline"
            size={20}
            color={colors.muted}
          />
        </IconButton>
      )}
    </View>
  );
}

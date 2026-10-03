import { useState } from 'react';
import { TextInput, View, Platform } from 'react-native';
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
        borderWidth: focused ? 2 : 1,
        borderRadius: 12,
        borderColor: focused ? colors.violet : colors.controlBorder,
        backgroundColor: colors.surfaceInput,
        paddingLeft: focused ? 12 : 13,
        paddingRight: (value ? 0 : 12) + (focused ? 0 : 1),
        paddingVertical: focused ? 0 : 1,
      }}
    >
      <Ionicons name="search-outline" size={20} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        accessibilityLabel={label}
        placeholder={`${label}…`}
        placeholderTextColor={colors.muted}
        underlineColorAndroid="transparent"
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
          outlineWidth: Platform.OS === 'web' ? 0 : undefined,
          outlineStyle: Platform.OS === 'web' ? 'solid' : undefined,
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

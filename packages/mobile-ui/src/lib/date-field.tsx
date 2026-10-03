import { useState } from 'react';
import { Keyboard, Platform, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'mobile-tokens';
import { Field } from './field.tsx';
import { BottomSheet } from './bottom-sheet.tsx';

export function DateField({
  label,
  value,
  onChange,
  mode = 'date',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  mode?: 'date' | 'time';
}) {
  const { colors, isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const input =
    mode === 'date' ? `${value}T12:00:00` : `2000-01-01T${value}:00`;
  const parsed = new Date(input);
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const apply = (_event: unknown, next: Date) => {
    const two = (n: number) => `${n}`.padStart(2, '0');
    onChange(
      mode === 'date'
        ? `${next.getFullYear()}-${two(next.getMonth() + 1)}-${two(next.getDate())}`
        : `${two(next.getHours())}:${two(next.getMinutes())}`,
    );
    setOpen(false);
  };
  // The preview has no system calendar; retain a labelled text fallback.
  if (Platform.OS === 'web')
    return (
      <Field
        label={label}
        value={value}
        onChangeText={onChange}
        placeholder={mode === 'date' ? 'YYYY-MM-DD' : 'HH:MM'}
      />
    );
  const display =
    mode === 'date'
      ? date.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : date.toLocaleTimeString('en-GB', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
  return (
    <View style={{ marginBottom: 16, gap: 6 }}>
      <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '600' }}>
        {label}
      </Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${display}`}
        onPress={() => {
          Keyboard.dismiss();
          if (Platform.OS === 'android')
            DateTimePickerAndroid.open({
              value: date,
              mode,
              onValueChange: apply,
            });
          else setOpen(true);
        }}
        style={{
          minHeight: 48,
          borderWidth: 1,
          borderColor: colors.controlBorder,
          backgroundColor: colors.surfaceInput,
          borderRadius: 12,
          padding: 12,
          gap: 12,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Text style={{ flex: 1, color: colors.ink, fontSize: 15 }}>
          {display}
        </Text>
        <Ionicons
          name={mode === 'date' ? 'calendar-outline' : 'time-outline'}
          size={20}
          color={colors.violet}
        />
      </TouchableOpacity>
      {Platform.OS === 'ios' && (
        <BottomSheet
          visible={open}
          onClose={() => setOpen(false)}
          title={label}
        >
          <DateTimePicker
            value={date}
            mode={mode}
            onValueChange={apply}
            themeVariant={isDark ? 'dark' : 'light'}
          />
        </BottomSheet>
      )}
    </View>
  );
}

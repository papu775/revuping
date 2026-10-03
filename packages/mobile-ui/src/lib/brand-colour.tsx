import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'mobile-tokens';
import { Field } from './field.tsx';
export const isBrandColour = (value: string) => /^#[0-9a-f]{6}$/i.test(value);
const presets = ['#6b52b9', '#253c39', '#243650', '#ad5e41'];
export function BrandColour({
  value,
  onChange,
  label = 'Brand colour',
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.swatch,
          {
            backgroundColor: isBrandColour(value) ? value : colors.surfaceInput,
            borderColor: colors.controlBorder,
          },
        ]}
      />
      <Field
        label={label}
        value={value}
        onChangeText={onChange}
        maxLength={7}
        autoCorrect={false}
        placeholder="#6250B5"
        error={
          !isBrandColour(value)
            ? 'Use a six-digit hex colour, such as #6250B5.'
            : undefined
        }
      />
      <View style={styles.presets}>
        {[
          ...new Set([
            ...presets,
            ...(isBrandColour(value) ? [value.toLowerCase()] : []),
          ]),
        ].map((colour) => (
          <TouchableOpacity
            key={colour}
            accessibilityRole="button"
            accessibilityLabel={`Select colour ${colour}`}
            accessibilityState={{ selected: value.toLowerCase() === colour }}
            onPress={() => onChange(colour)}
            style={[
              styles.preset,
              {
                backgroundColor: colour,
                borderColor:
                  value.toLowerCase() === colour ? colors.ink : colors.border,
              },
            ]}
          >
            {value.toLowerCase() === colour && (
              <Ionicons name="checkmark" size={22} color="#ffffff" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  preset: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

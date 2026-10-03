
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from 'mobile-tokens';
import { radius, spacing, typography } from 'mobile-tokens';

type BadgeTone = 'violet' | 'mint' | 'warm' | 'muted' | 'danger';

const toneColors: Record<BadgeTone, { bg: string; fg: string }> = {
  violet: { bg: 'surfaceSelected', fg: 'violet' },
  mint: { bg: 'mint', fg: 'positiveInk' },
  warm: { bg: 'warm', fg: 'warmInk' },
  muted: { bg: 'surfaceSection', fg: 'muted' },
  danger: { bg: 'dangerSoft', fg: 'danger' },
};

export function Badge({
  label,
  tone = 'muted',
}: {
  label: string;
  tone?: BadgeTone;
}) {
  const { colors } = useTheme();
  const toneColor = toneColors[tone];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors[toneColor.bg as keyof typeof colors] as string },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: colors[toneColor.fg as keyof typeof colors] as string },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  text: {
    fontSize: typography.caption,
    fontWeight: '600',
  },
});

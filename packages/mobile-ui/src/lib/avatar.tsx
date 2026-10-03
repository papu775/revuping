import { View, Text, StyleSheet } from 'react-native';
import { avatarTones, lightColors, type AvatarTone } from 'mobile-tokens';

export function Avatar({
  initials,
  tone = 'peach',
  size = 40,
}: {
  initials: string;
  tone?: AvatarTone;
  size?: number;
}) {
  const bgColor = avatarTones[tone];

  return (
    <View
      style={[
        styles.avatar,
        {
          backgroundColor: bgColor,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
      accessibilityLabel={`Avatar for ${initials}`}
    >
      <Text
        maxFontSizeMultiplier={1.3}
        style={[
          styles.initials,
          {
            color: lightColors.ink,
            fontSize: size * 0.35,
            includeFontPadding: false,
          },
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontWeight: '700',
  },
});

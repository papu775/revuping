
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, avatarTones, type AvatarTone } from 'mobile-tokens';


export function Avatar({
  initials,
  tone = 'peach',
  size = 40,
}: {
  initials: string;
  tone?: AvatarTone;
  size?: number;
}) {
  const { colors } = useTheme();
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
        style={[
          styles.initials,
          { color: colors.ink, fontSize: size * 0.35 },
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontWeight: '700',
  },
});

import { View, StyleSheet, useWindowDimensions } from 'react-native';
import QRCodeSvg from 'react-native-qrcode-svg';

import { radius, spacing } from 'mobile-tokens';

export function QRCode({
  value,
  size = 160,
  color,
  backgroundColor,
}: {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
}) {
  const { width } = useWindowDimensions();
  const renderSize = Math.min(
    size,
    Math.floor(
      (width - 2 * spacing.xl - 2 * spacing.lg - 2 * spacing.md - 2) /
        (1 + 8 / 21),
    ),
  );
  const candidate = color ?? '#20243c';
  const valid = /^#[0-9a-f]{6}$/i.test(candidate);
  const rgb = valid
    ? [1, 3, 5]
        .map((i) => parseInt(candidate.slice(i, i + 2), 16) / 255)
        .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    : [0, 0, 0];
  const contrast =
    1.05 / (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2] + 0.05);
  const ink = valid && contrast >= 4.5 ? candidate : '#20243c';
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: backgroundColor ?? '#ffffff',
          padding: spacing.md,
          borderRadius: radius.md,
        },
      ]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`QR code: ${value}`}
    >
      <QRCodeSvg
        value={value}
        size={renderSize}
        quietZone={Math.ceil((renderSize * 4) / 21)}
        color={ink}
        backgroundColor={backgroundColor ?? '#ffffff'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
  },
});

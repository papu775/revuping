
import { View, StyleSheet } from 'react-native';
import QRCodeSvg from 'react-native-qrcode-svg';

import { radius, spacing } from 'mobile-tokens';

const QRCodeComponent: React.FC<any> = QRCodeSvg as any;

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
      accessibilityLabel={`QR code: ${value}`}
    >
      <QRCodeComponent
        value={value}
        size={size}
        color={color ?? '#20243c'}
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

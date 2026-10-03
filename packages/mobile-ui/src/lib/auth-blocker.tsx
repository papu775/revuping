import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Keyboard,
  Modal,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { radius, useReducedMotion, useTheme } from 'mobile-tokens';

export function AuthBlocker({
  label,
  onCancel,
  children,
}: {
  label: string | null;
  onCancel: () => void;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [details, setDetails] = useState(false);
  const [height, setHeight] = useState(0);
  const [keyboardTop, setKeyboardTop] = useState<number | null>(
    Keyboard.metrics?.()?.screenY ?? null,
  );
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (event) =>
      setKeyboardTop(event.endCoordinates.screenY),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardTop(null),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  // Measured modal height avoids double-padding when Android has already resized.
  const keyboardOverlap =
    keyboardTop === null ? 0 : Math.max(0, height - keyboardTop);
  useEffect(() => {
    if (!label) return;
    const timer = setTimeout(() => {
      setDetails(true);
      if (Platform.OS !== 'web')
        AccessibilityInfo.announceForAccessibility(label);
    }, 120);
    return () => {
      clearTimeout(timer);
      setDetails(false);
    };
  }, [label]);
  return (
    <View style={styles.root}>
      <View
        style={styles.root}
        pointerEvents={label ? 'none' : 'auto'}
        accessibilityElementsHidden={!!label}
        importantForAccessibility={label ? 'no-hide-descendants' : 'auto'}
      >
        {children}
      </View>
      <Modal
        transparent
        visible={!!label}
        animationType="none"
        onRequestClose={onCancel}
        statusBarTranslucent
        navigationBarTranslucent
      >
        <View
          testID="auth-loading-backdrop"
          onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
          style={[
            styles.overlay,
            {
              backgroundColor: colors.overlay,
              paddingTop: insets.top + 24,
              paddingBottom: Math.max(insets.bottom, keyboardOverlap) + 24,
            },
          ]}
        >
          <View
            accessible
            accessibilityViewIsModal
            accessibilityRole="progressbar"
            accessibilityLabel={label ?? undefined}
            accessibilityState={{ busy: true }}
            style={[
              styles.panel,
              {
                opacity: details ? 1 : 0,
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            {reduced ? (
              <Ionicons name="sync-outline" size={34} color={colors.violet} />
            ) : (
              <ActivityIndicator size="large" color={colors.violet} />
            )}
            <Text style={[styles.label, { color: colors.ink }]}>{label}</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  panel: {
    alignItems: 'center',
    gap: 16,
    padding: 24,
    borderWidth: 1,
    borderRadius: radius.lg,
    maxWidth: 340,
    width: '100%',
  },
  label: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
});

import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Keyboard,
  Modal,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!label || reduced) {
      pulse.setValue(1);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.5,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [label, reduced, pulse]);
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
            <Animated.View
              accessibilityElementsHidden
              style={{
                opacity: pulse,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                height: 36,
              }}
            >
              {[12, 20, 28, 16, 8].map((height, i) => (
                <View
                  key={i}
                  style={{
                    width: 3,
                    height,
                    borderRadius: 2,
                    backgroundColor: colors.violet,
                  }}
                />
              ))}
            </Animated.View>
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
    alignSelf: 'center',
  },
  label: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
});

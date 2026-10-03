import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  Animated,
  Text,
  View,
  StyleSheet,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useTheme,
  useReducedMotion,
  radius,
  bottomNavigationHeight,
} from 'mobile-tokens';
import { Ionicons } from '@expo/vector-icons';
import { IconButton } from './icon-button.tsx';

interface ToastItem {
  message: string;
  type: 'success' | 'error';
}
const ToastContext = createContext<{
  showToast: (message: string, type?: 'success' | 'error') => void;
} | null>(null);
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const { fontScale } = useWindowDimensions();
  const [keyboardVisible, setKeyboardVisible] = useState(Keyboard.isVisible());
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!toast) return;
    opacity.setValue(0);
    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: reduced ? 0 : 160,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [toast, opacity, reduced]);
  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setToast(null);
  }, []);
  const showToast = useCallback(
    (message: string, type: 'success' | 'error' = 'success') => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, type });
      timer.current = setTimeout(() => setToast(null), 5000);
    },
    [],
  );
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <KeyboardAvoidingView
        pointerEvents="box-none"
        style={StyleSheet.absoluteFill}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={{ flex: 1 }} pointerEvents="box-none">
          {toast && (
            <Animated.View
              style={[
                styles.container,
                {
                  opacity,
                  bottom: keyboardVisible
                    ? 12
                    : Math.max(insets.bottom, 8) +
                      bottomNavigationHeight(fontScale) +
                      12,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              accessibilityLiveRegion="polite"
            >
              <Ionicons
                name={
                  toast.type === 'success' ? 'checkmark-circle' : 'alert-circle'
                }
                size={22}
                color={
                  toast.type === 'success' ? colors.positiveInk : colors.danger
                }
              />
              <Text style={[styles.text, { color: colors.ink }]}>
                {toast.message}
              </Text>
              <IconButton
                onPress={dismiss}
                accessibilityLabel="Dismiss notification"
              >
                <Ionicons name="close" size={20} color={colors.muted} />
              </IconButton>
            </Animated.View>
          )}
        </View>
      </KeyboardAvoidingView>
    </ToastContext.Provider>
  );
}
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    borderWidth: 1,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 8,
    elevation: 4,
  },
  text: { flex: 1, fontSize: 14, lineHeight: 21 },
});

import { useEffect, useRef } from 'react';

import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme, useReducedMotion } from 'mobile-tokens';
import { radius, spacing, typography } from 'mobile-tokens';

export function Dialog({
  visible,
  onClose,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  destructive = false,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  destructive?: boolean;
}) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const confirming = useRef(false);
  useEffect(() => {
    if (!visible) confirming.current = false;
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduced ? 'none' : 'fade'}
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <ScrollView
          accessibilityViewIsModal
          style={[styles.dialog, { backgroundColor: colors.surface }]}
          contentContainerStyle={{ padding: 24 }}
        >
          <Text
            style={[styles.title, { color: colors.ink }]}
            accessibilityRole="header"
          >
            {title}
          </Text>
          <Text style={[styles.message, { color: colors.muted }]}>
            {message}
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.button, { borderColor: colors.controlBorder }]}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
            >
              <Text style={[styles.buttonText, { color: colors.ink }]}>
                {cancelLabel}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (confirming.current) return;
                confirming.current = true;
                onConfirm();
                onClose();
              }}
              style={[
                styles.button,
                {
                  backgroundColor: destructive
                    ? colors.dangerSoft
                    : colors.actionBg,
                  borderColor: destructive ? colors.danger : colors.actionBg,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: destructive ? colors.danger : colors.onDark },
                ]}
              >
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: spacing.xl,
  },
  dialog: {
    width: '100%',
    borderRadius: radius.lg,
    maxHeight: '85%',
    flexGrow: 0,
  },
  title: {
    fontSize: typography.heading,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: typography.body,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  button: {
    flexGrow: 1,
    flexBasis: 120,
    minHeight: 48,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: typography.label,
    fontWeight: '600',
    textAlign: 'center',
  },
});

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useReducedMotion, useTheme } from 'mobile-tokens';

/** Keeps edits in the parent; hidden children leave the focus/accessibility tree. */
export function Accordion({
  title,
  summary,
  children,
  initiallyOpen = false,
  open: controlled,
  onToggle,
}: {
  title: string;
  summary?: string;
  children: ReactNode;
  initiallyOpen?: boolean;
  open?: boolean;
  onToggle?: (open: boolean) => void;
}) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const [localOpen, setOpen] = useState(initiallyOpen);
  const open = controlled ?? localOpen;
  const [mounted, setMounted] = useState(open);
  const [settled, setSettled] = useState(open);
  const [height, setHeight] = useState(0);
  const progress = useRef(new Animated.Value(open ? 1 : 0)).current;
  useEffect(() => {
    let active = true;
    progress.stopAnimation();
    setSettled(false);
    if (open) setMounted(true);
    else Keyboard.dismiss();
    const animation = Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: reduced ? 0 : 210,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      if (!active || !finished) return;
      setSettled(open);
      if (!open) setMounted(false);
    });
    return () => {
      active = false;
      animation.stop();
    };
  }, [open, progress, reduced]);
  return (
    <View>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: open }}
        activeOpacity={0.7}
        onPress={() => {
          setOpen(!open);
          onToggle?.(!open);
        }}
        style={{
          minHeight: 48,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 8,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.ink,
              fontSize: 17,
              fontWeight: '700',
              lineHeight: 24,
            }}
          >
            {title}
          </Text>
          {!!summary && (
            <Text
              style={{
                color: colors.muted,
                fontSize: 13,
                lineHeight: 20,
                marginTop: 4,
              }}
            >
              {summary}
            </Text>
          )}
        </View>
        <Animated.View
          style={{
            transform: [
              {
                rotate: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '180deg'],
                }),
              },
            ],
          }}
        >
          <Ionicons name="chevron-down" size={20} color={colors.violet} />
        </Animated.View>
      </TouchableOpacity>
      {mounted && (
        <Animated.View
          pointerEvents={open ? 'auto' : 'none'}
          accessibilityElementsHidden={!open}
          importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
          {...(Platform.OS === 'web' && !open ? { inert: true } : {})}
          style={{
            height:
              settled || (open && !height)
                ? undefined
                : progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, height],
                  }),
            overflow: settled ? 'visible' : 'hidden',
            opacity: reduced ? 1 : progress,
          }}
        >
          <View
            onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
            style={{ paddingTop: 12 }}
          >
            {children}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

import { useReducedMotion } from 'mobile-tokens';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from 'mobile-tokens';
import { DemoStoreProvider } from 'mobile-data';
import { ToastProvider } from 'mobile-ui';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';
import * as SystemUI from 'expo-system-ui';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default function RootLayout() {
  const reduced = useReducedMotion();
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <DemoStoreProvider>
            <ToastProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: reduced ? 'none' : 'slide_from_right',
                }}
              >
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
              </Stack>
              <ThemedStatusBar />
            </ToastProvider>
          </DemoStoreProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThemedStatusBar() {
  const { isDark, colors } = useTheme();
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.canvas).catch(() => undefined);
  }, [colors.canvas]);
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

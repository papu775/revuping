import { useReducedMotion } from 'mobile-tokens';
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../data-access/auth-context';
import { Screen, Button } from 'mobile-ui';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from 'mobile-tokens';
import { DemoStoreProvider } from 'mobile-data';
import { ToastProvider } from 'mobile-ui';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';
import * as SystemUI from 'expo-system-ui';
import { StyleSheet, Text, ActivityIndicator } from 'react-native';

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
              <AuthProvider>
                <SessionNavigation reduced={reduced} />
              </AuthProvider>
              <ThemedStatusBar />
            </ToastProvider>
          </DemoStoreProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function SessionNavigation({ reduced }: { reduced: boolean }) {
  const { ready, error, retry, session, demo, enterDemo } = useAuth();
  const { colors } = useTheme();
  if (!ready)
    return (
      <Screen>
        <ActivityIndicator
          accessibilityLabel="Restoring session"
          color={colors.violet}
        />
      </Screen>
    );
  if (error && !session && !demo)
    return (
      <Screen>
        <Text style={{ color: colors.ink }}>
          Your session is temporarily unavailable. {error}
        </Text>
        <Button title="Try again" onPress={retry} />
        <Button
          title="Explore the separate demo"
          variant="secondary"
          onPress={enterDemo}
        />
      </Screen>
    );
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: reduced ? 'none' : 'slide_from_right',
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="workspace" />
      </Stack.Protected>
      <Stack.Protected guard={demo}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="survey-editor" />
      </Stack.Protected>
    </Stack>
  );
}

function ThemedStatusBar() {
  const { isDark, colors } = useTheme();
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.canvas).catch(() => undefined);
  }, [colors.canvas]);
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

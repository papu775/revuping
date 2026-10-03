import { useReducedMotion } from 'mobile-tokens';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  const reduced = useReducedMotion();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: reduced ? 'none' : 'slide_from_right',
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}

import { useReducedMotion } from 'mobile-tokens';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  const reduced = useReducedMotion();
  return (
    <Stack
      initialRouteName="login"
      screenOptions={{
        headerShown: false,
        animation: reduced ? 'none' : 'fade',
        animationDuration: 180,
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}

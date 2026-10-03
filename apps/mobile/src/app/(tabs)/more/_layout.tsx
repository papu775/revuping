import { useReducedMotion } from 'mobile-tokens';
import { Stack } from 'expo-router';

export default function MoreLayout() {
  const reduced = useReducedMotion();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: reduced ? 'none' : 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="qr-studio" />
      <Stack.Screen name="reviews" />
      <Stack.Screen name="surveys" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="staff" />
      <Stack.Screen name="competitors" />
      <Stack.Screen name="widgets" />
      <Stack.Screen name="integrations" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="billing" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}

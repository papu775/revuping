import { useReducedMotion } from 'mobile-tokens';
import { Stack } from 'expo-router';

export default function FeedbackLayout() {
  const reduced = useReducedMotion();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: reduced ? 'none' : 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}

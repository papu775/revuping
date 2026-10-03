import { useReducedMotion } from 'mobile-tokens';
import { Stack } from 'expo-router';

export default function CampaignsLayout() {
  const reduced = useReducedMotion();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: reduced ? 'none' : 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="builder" />
    </Stack>
  );
}

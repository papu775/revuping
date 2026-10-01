'use client';
import { ThemeProvider as Provider, useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { SunMoon } from 'lucide-react';
import { Select } from './ui/select';
const subscribe = () => () => undefined;
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="revuping-theme"
      disableTransitionOnChange
    >
      {children}
    </Provider>
  );
}
export function ThemeControl() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return (
    <Select
      label="Color theme"
      value={mounted ? theme || 'system' : 'system'}
      onValueChange={setTheme}
      compact
      icon={<SunMoon size={19} />}
      options={[
        { value: 'light', label: 'Light', description: 'Warm cream surfaces' },
        { value: 'dark', label: 'Dark', description: 'Deep navy surfaces' },
        {
          value: 'system',
          label: 'System',
          description: 'Use device appearance',
        },
      ]}
    />
  );
}

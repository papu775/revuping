'use client';
import { ThemeProvider as Provider, useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { Sun, Moon, SunMoon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Select } from '@/components/ui/select';
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
  const reduced = useReducedMotion();
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
      icon={
        <motion.span
          key={mounted ? theme : 'system'}
          initial={false}
          animate={{ opacity: 1, rotate: 0 }}
          transition={{ duration: reduced ? 0 : 0.16 }}
        >
          {mounted && theme === 'light' ? (
            <Sun size={19} />
          ) : mounted && theme === 'dark' ? (
            <Moon size={19} />
          ) : (
            <SunMoon size={19} />
          )}
        </motion.span>
      }
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

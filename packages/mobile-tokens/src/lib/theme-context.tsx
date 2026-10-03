import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, type ThemeColors } from './tokens.js';

const THEME_KEY = 'revuping-mobile-theme-v1';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  colors: ThemeColors;
  themePreference: ThemePreference;
  isDark: boolean;
  setThemePreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePref] = useState<ThemePreference>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((raw: string | null) => {
        if (raw === 'light' || raw === 'dark' || raw === 'system') {
          setThemePref(raw);
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  const setThemePreference = useCallback((pref: ThemePreference) => {
    setThemePref(pref);
    AsyncStorage.setItem(THEME_KEY, pref).catch(() => {});
  }, []);

  const isDark =
    themePreference === 'dark' ||
    (themePreference === 'system' && systemScheme === 'dark');

  const value: ThemeContextValue = {
    colors: isDark ? darkColors : lightColors,
    themePreference,
    isDark,
    setThemePreference,
  };

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

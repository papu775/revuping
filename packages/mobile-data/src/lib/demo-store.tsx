import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
  useState,
} from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from 'mobile-tokens';
import AsyncStorage from '@react-native-async-storage/async-storage';

const storage = AsyncStorage;
import { initialDemoState } from './fixtures.ts';
import type { DemoState } from './types.ts';

const STORAGE_KEY = 'revuping-mobile-demo-v1';

import { demoReducer } from './demo-reducer.ts';
import type { Action } from './demo-reducer.ts';
export { demoReducer } from './demo-reducer.ts';
export type { Action } from './demo-reducer.ts';

interface DemoStoreValue {
  state: DemoState;
  dispatch: React.Dispatch<Action>;
  resetDemo: () => void;
  loaded: boolean;
}

const DemoStoreContext = createContext<DemoStoreValue | null>(null);

export function DemoStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(demoReducer, initialDemoState);
  const [loaded, setLoaded] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    storage
      .getItem(STORAGE_KEY)
      .then((raw: string | null) => {
        if (raw) {
          try {
            const saved = JSON.parse(raw, (key, value) =>
              key === 'type' && value === 'Optional text' ? 'Text' : value,
            ) as Partial<DemoState>;
            dispatch({ type: 'HYDRATE', payload: saved });
          } catch {
            // ignore parse errors
          }
        }
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    storage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [loaded, state]);

  const resetDemo = useCallback(() => {
    dispatch({ type: 'RESET_DEMO' });
    storage.removeItem(STORAGE_KEY).catch(() => undefined);
  }, []);

  if (!loaded)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.canvas,
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator
          color={colors.violet}
          accessibilityLabel="Loading demo workspace"
        />
      </View>
    );

  return (
    <DemoStoreContext.Provider value={{ state, dispatch, resetDemo, loaded }}>
      {children}
    </DemoStoreContext.Provider>
  );
}

export function useDemoStore(): DemoStoreValue {
  const ctx = useContext(DemoStoreContext);
  if (!ctx)
    throw new Error('useDemoStore must be used within DemoStoreProvider');
  return ctx;
}

import { createContext, useContext, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import {
  ApiRequestError,
  type SessionResponse,
  authErrorMessage,
} from 'api-contracts';
import { NativeAuthClient } from './native-auth-client';
import { secureCredentials } from './secure-credentials';

type AuthState = {
  client: NativeAuthClient;
  session: SessionResponse | null;
  ready: boolean;
  error: string;
  retry: () => void;
  demo: boolean;
  enterDemo: () => void;
  exitDemo: () => void;
};
const Context = createContext<AuthState | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [demo, setDemo] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [client] = useState(
    () =>
      new NativeAuthClient(
        secureNativeBase(
          process.env.EXPO_PUBLIC_API_URL ??
            (__DEV__
              ? 'http://10.0.2.2:3002/api/v1'
              : 'https://api-unconfigured.invalid/api/v1'),
        ),
        secureCredentials,
        setSession,
      ),
  );
  useEffect(() => {
    let alive = true;
    setReady(false);
    setError('');
    (Platform.OS === 'web' ? Promise.resolve() : client.restore())
      .catch((error) => {
        if (
          alive &&
          !(error instanceof ApiRequestError && error.status === 401)
        )
          setError(authErrorMessage(error));
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, [client, attempt]);
  useEffect(() => {
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active' && session)
        client
          .current()
          .then(setSession)
          .catch((error) => setError(authErrorMessage(error)));
    });
    return () => listener.remove();
  }, [client, session]);
  return (
    <Context.Provider
      value={{
        client,
        session,
        ready,
        error,
        retry: () => setAttempt((value) => value + 1),
        demo,
        enterDemo: () => setDemo(true),
        exitDemo: () => setDemo(false),
      }}
    >
      {children}
    </Context.Provider>
  );
}
function secureNativeBase(base: string): string {
  if (!__DEV__ && !base.startsWith('https://'))
    throw new Error('Native release authentication requires an HTTPS API URL.');
  return base;
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error('AuthProvider missing');
  return value;
}

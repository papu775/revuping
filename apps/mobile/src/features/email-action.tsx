import { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from 'mobile-tokens';
import {
  Screen,
  Header,
  Field,
  Button,
  AuthBlocker,
  useToast,
} from 'mobile-ui';
import { useAuthAction } from './use-auth-action';
import { authErrorMessage } from 'api-contracts';
import { useAuth } from '../data-access/auth-context';

export function EmailActionScreen({
  kind,
}: {
  kind: 'verify' | 'forgot' | 'reset';
}) {
  const { token: parameter } = useLocalSearchParams<{ token?: string }>();
  const { client, session } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState(session?.user.email ?? '');
  const [link, setLink] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const attempted = useRef('');
  const [verified, setVerified] = useState(false);
  const [notice, setNotice] = useState('');
  const { pending, label, run, cancel } = useAuthAction();
  const { showToast } = useToast();
  useEffect(() => {
    if (parameter) setLink(parameter);
  }, [parameter]);
  const submit = async () => {
    if (pending) return;
    setError('');
    setNotice('');
    const token = link.includes('#')
      ? (new URLSearchParams(link.split('#')[1]).get('token') ?? '')
      : link.trim();
    if (kind === 'reset' && (password.length < 12 || password.length > 128)) {
      setError('Use between 12 and 128 characters for your password.');
      return;
    }
    if ((kind === 'reset' || token) && !/^[A-Za-z0-9_-]{43}$/.test(token)) {
      setError(
        'Paste a valid email link. Request a new link if it has expired.',
      );
      return;
    }
    const action =
      kind === 'forgot'
        ? 'forgot-password'
        : kind === 'reset'
          ? 'reset-password'
          : token
            ? 'verify-email'
            : 'resend-verification';
    const input =
      kind === 'forgot' || (kind === 'verify' && !token)
        ? { email }
        : kind === 'reset'
          ? { token, password }
          : { token };
    if (
      (kind === 'forgot' || (kind === 'verify' && !token)) &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      setError('Enter a valid email address.');
      return;
    }
    await run(
      kind === 'reset'
        ? 'Resetting your password…'
        : kind === 'verify' && token
          ? 'Verifying your email…'
          : kind === 'forgot'
            ? 'Requesting reset link…'
            : 'Requesting verification email…',
      async (signal) => {
        try {
          await client.publicAction(action, input, signal);
        } catch (error) {
          if (kind !== 'verify' || !token || !session) throw error;
          const current = await client.current(signal).catch(() => null);
          if (!current?.user.emailVerified) throw error;
        }
        if (kind === 'verify' && token && session)
          await client.current(signal).catch(() => null);
      },
      () => {
        const message =
          kind === 'reset'
            ? 'Password reset. Log in with your new password.'
            : kind === 'verify' && token
              ? 'Email verified. You can now open your workspace.'
              : 'If your account is eligible, an email has been sent. Check your inbox and spam folder.';
        setNotice(message);
        showToast(message, token ? 'success' : 'info');
        setPassword('');
        setLink('');
        if (kind === 'verify' && token) {
          setVerified(true);
        }
      },
      (error) => {
        const message = authErrorMessage(error);
        setError(message);
        showToast(message, 'error');
      },
    );
  };
  useEffect(() => {
    if (
      kind === 'verify' &&
      parameter &&
      link === parameter &&
      attempted.current !== parameter
    ) {
      attempted.current = parameter;
      void submit();
    }
  }, [kind, parameter, link, submit]);
  if (kind === 'verify' && (verified || session?.user.emailVerified))
    return (
      <Screen>
        <Header title="Email verified" />
        <View style={{ padding: 24, gap: 20 }}>
          <Text style={{ color: colors.ink }}>
            Your email is confirmed. Business setup is next.
          </Text>
          <Button
            title={session ? 'Continue setup' : 'Log in'}
            onPress={() => router.replace(session ? '/workspace' : '/login')}
          />
        </View>
      </Screen>
    );
  return (
    <AuthBlocker label={label} onCancel={cancel}>
      <Screen>
        <Header
          title={
            kind === 'verify'
              ? 'Verify your email'
              : kind === 'forgot'
                ? 'Forgot password'
                : 'Reset password'
          }
        />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 24, gap: 20 }}
          >
            <View style={{ gap: 16 }}>
              <Text style={{ color: colors.muted }}>
                {kind === 'forgot'
                  ? 'We’ll email a link if your account is eligible.'
                  : 'Open the email link in your browser, or paste it here to continue in the app.'}
              </Text>
              {kind !== 'reset' && (
                <Field
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={254}
                />
              )}
              {kind !== 'forgot' && (
                <Field
                  label="Email link"
                  value={link}
                  onChangeText={setLink}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              )}
              {kind === 'reset' && (
                <Field
                  label="New password (12–128 characters)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              )}
              {!!error && (
                <Text
                  accessibilityRole="alert"
                  style={{ color: colors.danger }}
                >
                  {error}
                </Text>
              )}
              {!!notice && <Text style={{ color: colors.ink }}>{notice}</Text>}
              <Button
                title={
                  kind === 'forgot'
                    ? 'Request reset link'
                    : kind === 'reset'
                      ? 'Reset password'
                      : link
                        ? 'Verify email'
                        : 'Resend verification email'
                }
                disabled={pending || (kind === 'reset' && !link.trim())}
                onPress={() => void submit()}
              />
              <Button
                title={session ? 'Back to workspace' : 'Back to login'}
                variant="ghost"
                onPress={() =>
                  router.replace(session ? '/workspace' : '/login')
                }
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Screen>
    </AuthBlocker>
  );
}

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
import { Screen, Header, Field, Button } from 'mobile-ui';
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
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  useEffect(() => {
    if (parameter) setLink(parameter);
  }, [parameter]);
  const submit = async () => {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError('');
    setNotice('');
    try {
      const token = link.includes('#')
        ? (new URLSearchParams(link.split('#')[1]).get('token') ?? '')
        : link.trim();
      if (kind === 'reset' && (password.length < 12 || password.length > 128)) {
        setError('Use between 12 and 128 characters for your password.');
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
      setNotice((await client.publicAction(action, input)).message);
      setPassword('');
      setLink('');
      if (kind === 'verify' && token && session) await client.current();
    } catch (error) {
      setError(authErrorMessage(error));
    } finally {
      busy.current = false;
      setPending(false);
    }
  };
  return (
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
              <Text accessibilityRole="alert" style={{ color: colors.danger }}>
                {error}
              </Text>
            )}
            {!!notice && (
              <Text
                accessibilityLiveRegion="polite"
                style={{ color: colors.ink }}
              >
                {notice}
              </Text>
            )}
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
              disabled={kind === 'reset' && !link.trim()}
              loading={pending}
              onPress={() => void submit()}
            />
            <Button
              title={session ? 'Back to workspace' : 'Back to login'}
              variant="ghost"
              onPress={() => router.replace(session ? '/workspace' : '/login')}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

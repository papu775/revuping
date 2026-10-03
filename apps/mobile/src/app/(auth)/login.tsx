import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'mobile-tokens';
import {
  Screen,
  Button,
  Field,
  Logo,
  FeedbackPreview,
  AuthBlocker,
  useToast,
} from 'mobile-ui';
import { useState } from 'react';
import { useAuthAction } from '../../features/use-auth-action';
import { useAuth } from '../../data-access/auth-context';
import { authErrorMessage } from 'api-contracts';
import { spacing, typography } from 'mobile-tokens';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { pending, label, run, cancel } = useAuthAction();
  const { showToast } = useToast();
  const { client, exitDemo } = useAuth();

  const handleLogin = async () => {
    if (pending) return;
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setError('');
    await run(
      'Logging you in…',
      (signal) => client.login({ email: email.trim(), password }, signal),
      () => {
        exitDemo();
        setPassword('');
        showToast('You’re logged in.');
        router.replace('/workspace');
      },
      (error) => {
        const message =
          Platform.OS === 'web'
            ? 'Real authentication requires the native app. Use the RevuPing web app for browser login.'
            : authErrorMessage(error);
        setError(message);
        showToast(message, 'error');
      },
    );
  };

  return (
    <AuthBlocker label={label} onCancel={cancel}>
      <Screen edges={[]} style={{ paddingTop: insets.top }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={[
              styles.container,
              { paddingBottom: insets.bottom + 24 },
            ]}
          >
            <View style={styles.header}>
              <Logo />
              <Text style={[styles.title, { color: colors.ink }]}>Log in</Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                Open your RevuPing account. Demo access stays separate.
              </Text>
            </View>
            <FeedbackPreview compact />
            <View style={styles.form}>
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={error && !email.trim() ? 'Email is required' : undefined}
              />
              <Field
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                error={
                  error && !password.trim() ? 'Password is required' : undefined
                }
              />
              <Button
                title="Log in"
                onPress={() => void handleLogin()}
                disabled={pending}
              />
            </View>
            {!!error && (
              <Text accessibilityRole="alert" style={{ color: colors.danger }}>
                {error}
              </Text>
            )}
            <Button
              title="Forgot password?"
              variant="ghost"
              onPress={() => router.push('/forgot-password')}
            />
            <View style={[styles.footer]}>
              <Button
                title="New to RevuPing? Create an account"
                variant="ghost"
                onPress={() => router.push('/signup')}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Screen>
    </AuthBlocker>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 16,
    justifyContent: 'flex-start',
  },
  header: {
    paddingVertical: 0,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  logo: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 22,
  },
  form: {
    gap: spacing.sm,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.caption,
    flexShrink: 1,
  },
});

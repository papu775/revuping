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
import { Screen, Button, Field, Logo, FeedbackPreview } from 'mobile-ui';
import { useRef, useState } from 'react';
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
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const { client, exitDemo } = useAuth();

  const handleLogin = async () => {
    if (busy.current) return;
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    busy.current = true;
    setPending(true);
    setError('');
    try {
      await client.login({ email: email.trim(), password });
      exitDemo();
      setPassword('');
      router.replace('/workspace');
    } catch (error) {
      setError(
        Platform.OS === 'web'
          ? 'Real authentication requires the native app. Use the RevuPing web app for browser login.'
          : authErrorMessage(error),
      );
    } finally {
      busy.current = false;
      setPending(false);
    }
  };

  return (
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
              loading={pending}
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

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
import {
  authErrorMessage,
  registrationSuccessMessage,
  registrationUnconfirmedMessage,
  registrationVerificationUnavailable,
  registrationVerificationUnavailableMessage,
} from 'api-contracts';
import { spacing, typography } from 'mobile-tokens';

export default function SignupScreen() {
  const router = useRouter();
  const { client } = useAuth();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const { pending, label, run, cancel } = useAuthAction();
  const { showToast } = useToast();
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleSignup = async () => {
    if (pending || registeredEmail) return;
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 12 || password.length > 128) {
      setError('Use 12–128 characters for your password.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setError('');
    setNotice('');
    await run(
      'Creating your account…',
      (signal) =>
        client.register(
          {
            displayName: name.trim(),
            email: email.trim(),
            password,
          },
          signal,
        ),
      () => {
        setPassword('');
        setRegisteredEmail(email.trim());
        setNotice(registrationSuccessMessage);
        showToast(registrationSuccessMessage);
      },
      (error) => {
        if (registrationVerificationUnavailable(error)) {
          setRegisteredEmail(email.trim());
          setPassword('');
          setNotice(registrationVerificationUnavailableMessage);
          showToast(registrationVerificationUnavailableMessage, 'info');
        } else {
          const message =
            !(
              typeof error === 'object' &&
              error !== null &&
              'status' in error
            ) || Number(error.status) >= 500
              ? registrationUnconfirmedMessage
              : authErrorMessage(error);
          setError(message);
          showToast(message, 'error');
        }
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
              <Text style={[styles.title, { color: colors.ink }]}>
                Create your account
              </Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                Verify your email, then create your workspace. No sample records
                are added.
              </Text>
            </View>
            <FeedbackPreview compact />
            <View style={styles.form}>
              <Field
                label="Your name"
                editable={!registeredEmail}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                maxLength={100}
                autoCapitalize="words"
                error={
                  error && !name.trim() ? 'Your name is required' : undefined
                }
              />
              <Field
                label="Email"
                editable={!registeredEmail}
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
                editable={!registeredEmail}
                value={password}
                onChangeText={setPassword}
                placeholder="12–128 characters"
                error={
                  error && !password.trim() ? 'Password is required' : undefined
                }
              />
              <Button
                title="Create account"
                onPress={() => void handleSignup()}
                disabled={pending || !!registeredEmail}
              />
            </View>
            {!!error && (
              <Text accessibilityRole="alert" style={{ color: colors.danger }}>
                {error}
              </Text>
            )}
            {!!notice && <Text style={{ color: colors.ink }}>{notice}</Text>}
            {!!registeredEmail && (
              <View style={{ gap: 12 }}>
                <Text style={{ color: colors.muted }}>
                  Check your inbox and spam folder. Verify your email before
                  opening a workspace.
                </Text>
                <Button
                  title="Resend verification email"
                  variant="secondary"
                  disabled={pending}
                  onPress={() =>
                    void run(
                      'Requesting verification email…',
                      (signal) =>
                        client.publicAction(
                          'resend-verification',
                          { email: registeredEmail },
                          signal,
                        ),
                      () => {
                        const message =
                          'If your account is eligible, a verification email has been sent. Check your inbox and spam folder.';
                        setNotice(message);
                        showToast(message, 'info');
                      },
                      (error) => {
                        const message = authErrorMessage(error);
                        setError(message);
                        showToast(message, 'error');
                      },
                    )
                  }
                />
                <Button
                  title="Open verification"
                  variant="ghost"
                  onPress={() => router.push('/verify-email')}
                />
              </View>
            )}
            {!!error && !registeredEmail && (
              <Button
                title="Request verification email"
                variant="ghost"
                onPress={() => router.push('/verify-email')}
              />
            )}
            <View style={[styles.footer]}>
              <Button
                title="Already have an account? Log in"
                variant="ghost"
                onPress={() => router.push('/login')}
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

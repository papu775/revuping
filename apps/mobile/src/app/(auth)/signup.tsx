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
  const [pending, setPending] = useState(false);
  const busy = useRef(false);

  const handleSignup = async () => {
    if (busy.current) return;
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 12 || password.length > 128) {
      setError('Use 12–128 characters for your password.');
      return;
    }
    busy.current = true;
    setPending(true);
    setError('');
    setNotice('');
    try {
      const result = await client.register({
        displayName: name.trim(),
        email: email.trim(),
        password,
      });
      setPassword('');
      setNotice(result.message);
    } catch (error) {
      setError(authErrorMessage(error));
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
              placeholder="12–128 characters"
              error={
                error && !password.trim() ? 'Password is required' : undefined
              }
            />
            <Button
              title="Create account"
              onPress={() => void handleSignup()}
              loading={pending}
            />
          </View>
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

import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'mobile-tokens';
import { Screen, Button, Field } from 'mobile-ui';
import { useState } from 'react';
import { spacing, typography } from 'mobile-tokens';

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignup = () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    router.push('/onboarding');
  };

  return (
    <Screen style={{ paddingTop: insets.top }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={[styles.logo, { color: colors.violet }]}>RevuPing</Text>
            <Text style={[styles.title, { color: colors.ink }]}>Create your account</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Start managing your business reputation today.
            </Text>
          </View>
          <View style={styles.form}>
            <Field
              label="Business name"
              value={name}
              onChangeText={setName}
              placeholder="Bloom & Co."
              autoCapitalize="words"
              error={error && !name.trim() ? 'Business name is required' : undefined}
            />
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              error={error && !email.trim() ? 'Email is required' : undefined}
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              error={error && !password.trim() ? 'Password is required' : undefined}
            />
            <Button
              title="Create account"
              onPress={handleSignup}
              accessibilityLabel="Create RevuPing account"
            />
          </View>
          <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
            <Text style={[styles.footerText, { color: colors.muted }]}>
              Already have an account?{' '}
              <Text
                style={{ color: colors.violet, fontWeight: '600' }}
                onPress={() => router.push('/login')}
              >
                Log in
              </Text>
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: {
    flex: 1,
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
  },
});

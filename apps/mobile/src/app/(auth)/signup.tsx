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
import { useState } from 'react';
import { useDemoStore } from 'mobile-data';
import { spacing, typography } from 'mobile-tokens';

export default function SignupScreen() {
  const router = useRouter();
  const { dispatch } = useDemoStore();
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
    dispatch({ type: 'SET_BUSINESS', business: { name: name.trim() } });
    router.push('/onboarding');
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
              Demo setup
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Set up a fictional demo workspace. No account is created or
              credentials saved.
            </Text>
          </View>
          <FeedbackPreview compact />
          <View style={styles.form}>
            <Field
              label="Business name"
              value={name}
              onChangeText={setName}
              placeholder="Bloom & Co."
              autoCapitalize="words"
              error={
                error && !name.trim() ? 'Business name is required' : undefined
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
              placeholder="Sample password"
              error={
                error && !password.trim() ? 'Password is required' : undefined
              }
            />
            <Button
              title="Continue demo setup"
              onPress={handleSignup}
              accessibilityLabel="Continue demo setup"
            />
          </View>
          <View style={[styles.footer]}>
            <Button
              title="Already have a demo? Log in"
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
    paddingTop: 32,
    gap: 24,
    justifyContent: 'flex-start',
  },
  header: {
    paddingVertical: 8,
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

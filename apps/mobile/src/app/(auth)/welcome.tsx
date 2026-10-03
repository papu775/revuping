import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'mobile-tokens';
import { Button, Screen, Logo, FeedbackPreview } from 'mobile-ui';
import { useAuth } from '../../data-access/auth-context';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { enterDemo, session } = useAuth();

  return (
    <Screen
      edges={[]}
      style={StyleSheet.flatten([
        styles.container,
        { backgroundColor: colors.canvas, paddingTop: insets.top },
      ])}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          gap: 24,
          paddingHorizontal: 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Logo />
          <Text style={[styles.tagline, { color: colors.ink }]}>
            The work behind a good review
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Requests, private feedback and thoughtful replies. One place to take
            the next step.
          </Text>
        </View>
        <FeedbackPreview />
        <View style={[styles.actions, { paddingBottom: insets.bottom + 24 }]}>
          <Button
            title={session ? 'Open your workspace' : 'Create an account'}
            onPress={() => router.push(session ? '/workspace' : '/signup')}
          />
          <Button
            title="Open demo workspace"
            variant="secondary"
            onPress={() => {
              enterDemo();
              router.replace('/(tabs)');
            }}
            accessibilityLabel="Open demo workspace"
          />
          {!session && (
            <Button
              title="Log in"
              variant="ghost"
              onPress={() => router.push('/login')}
            />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  hero: {
    flexGrow: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingTop: 48,
    paddingBottom: 12,
  },
  logo: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 28,
    lineHeight: 35,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 0,
  },
  actions: {
    gap: 12,
    paddingTop: 24,
  },
});

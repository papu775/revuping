import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'mobile-tokens';
import { Button, Screen, Logo } from 'mobile-ui';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <Screen
      style={StyleSheet.flatten([
        styles.container,
        { backgroundColor: colors.canvas, paddingTop: insets.top },
      ])}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, gap: 24 }}
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
        <View style={[styles.actions, { paddingBottom: insets.bottom + 24 }]}>
          <Button
            title="Set up demo"
            onPress={() => router.push('/signup')}
            accessibilityLabel="Get started with RevuPing"
          />
          <Button
            title="Open demo workspace"
            variant="secondary"
            onPress={() => router.replace('/(tabs)')}
            accessibilityLabel="Log in to existing account"
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 40,
  },
  logo: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  actions: {
    gap: 12,
    paddingTop: 24,
  },
});

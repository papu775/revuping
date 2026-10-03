import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'mobile-tokens';
import { useDemoStore, integrationProviders } from 'mobile-data';
import { Header, Card, Badge, Button, useToast } from 'mobile-ui';
import { spacing, typography } from 'mobile-tokens';

export default function IntegrationsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { state, dispatch } = useDemoStore();
  const toast = useToast();

  const handleToggle = (provider: string) => {
    const current = state.connections[provider];
    const next = current === 'Disconnected' ? 'Demo connected' : 'Disconnected';
    dispatch({ type: 'SET_CONNECTION', provider, status: next });
    toast.showToast(`${provider}: ${next} (demo)`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <Header title="Integrations" showBack />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <Card style={styles.card}>
          <Text style={[styles.note, { color: colors.muted }]}>
            Simulated connections. No real accounts are linked.
          </Text>
        </Card>

        {integrationProviders.map((provider) => {
          const status = state.connections[provider.name] ?? 'Disconnected';
          const isConnected = status === 'Demo connected';
          return (
            <Card key={provider.name} style={styles.card}>
              <View style={styles.header}>
                <Text style={[styles.name, { color: colors.ink }]}>{provider.name}</Text>
                <Badge label={status} tone={isConnected ? 'mint' : 'muted'} />
              </View>
              <Text style={[styles.description, { color: colors.muted }]}>{provider.description}</Text>
              <View style={styles.actions}>
                <Button
                  title={isConnected ? 'Disconnect' : 'Connect'}
                  variant={isConnected ? 'secondary' : 'primary'}
                  onPress={() => handleToggle(provider.name)}
                />
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  note: {
    fontSize: typography.caption,
    fontStyle: 'italic',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  name: {
    fontSize: typography.heading,
    fontWeight: '700',
  },
  description: {
    fontSize: typography.caption,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
  },
});

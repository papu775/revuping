import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from 'mobile-tokens';
import { useDemoStore, integrationProviders } from 'mobile-data';
import { Header, Card, Badge, Button, useToast } from 'mobile-ui';
import { spacing, typography } from 'mobile-tokens';

export default function IntegrationsScreen() {
  const { colors, isDark } = useTheme();
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
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
      >
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
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceSection,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
                accessible={false}
              >
                {provider.name === 'Google' ? (
                  <Text
                    style={{
                      color: isDark ? '#8ab4f8' : '#4285f4',
                      fontSize: 28,
                      fontWeight: '700',
                    }}
                  >
                    G
                  </Text>
                ) : (
                  <Ionicons
                    name={
                      provider.name === 'WhatsApp'
                        ? 'logo-whatsapp'
                        : provider.name === 'SMS'
                          ? 'phone-portrait-outline'
                          : 'mail-outline'
                    }
                    size={26}
                    color={
                      provider.name === 'WhatsApp'
                        ? colors.positiveInk
                        : colors.ink
                    }
                  />
                )}
              </View>
              <View style={styles.header}>
                <Text style={[styles.name, { color: colors.ink }]}>
                  {provider.name}
                </Text>
                <Badge label={status} tone={isConnected ? 'mint' : 'muted'} />
              </View>
              <Text style={[styles.description, { color: colors.muted }]}>
                {provider.description}
              </Text>
              <View style={styles.actions}>
                <Button
                  title={
                    isConnected ? 'Disconnect demo' : 'Simulate connection'
                  }
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
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  name: {
    fontSize: typography.heading,
    fontWeight: '700',
    flexShrink: 1,
  },
  description: {
    fontSize: typography.caption,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'column',
  },
});

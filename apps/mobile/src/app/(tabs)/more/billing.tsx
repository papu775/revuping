import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from 'mobile-tokens';
import { useDemoStore, demoPlans } from 'mobile-data';
import { Header, Card, Badge, Button, useToast } from 'mobile-ui';
import { spacing, typography } from 'mobile-tokens';
import { Ionicons } from '@expo/vector-icons';

export default function BillingScreen() {
  const { colors } = useTheme();
  const { state, dispatch } = useDemoStore();
  const toast = useToast();

  const handleSelectPlan = (planName: string) => {
    dispatch({ type: 'SET_PLAN', plan: planName });
    toast.showToast(`Plan selected: ${planName} (demo)`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <Header title="Billing" showBack />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
      >
        <Card style={styles.card}>
          <Text style={[styles.note, { color: colors.muted }]}>
            Pricing is not yet approved. All plans show TBD. Selections are demo
            previews; no subscription or payment is created.
          </Text>
        </Card>

        {demoPlans.map((plan) => {
          const isSelected = state.selectedPlan === plan.name;
          return (
            <Card
              key={plan.name}
              style={StyleSheet.flatten(
                plan.featured || isSelected
                  ? [
                      styles.card,
                      {
                        borderColor: colors.violet,
                        borderWidth: 2,
                        backgroundColor: isSelected
                          ? colors.surfaceSelected
                          : colors.surface,
                      },
                    ]
                  : styles.card,
              )}
            >
              <View style={styles.planHeader}>
                <Text style={[styles.planName, { color: colors.ink }]}>
                  {plan.name}
                </Text>
                {isSelected ? (
                  <Badge label="Selected · demo" tone="mint" />
                ) : null}
              </View>
              <Text style={[styles.planPrice, { color: colors.violet }]}>
                {plan.price}
              </Text>
              <Text style={[styles.planDesc, { color: colors.muted }]}>
                {plan.desc}
              </Text>
              <View style={styles.featureList}>
                {plan.features.map((feature) => (
                  <View key={feature} style={styles.featureRow}>
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={colors.positiveInk}
                    />
                    <Text style={[styles.featureText, { color: colors.ink }]}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
              <Button
                title={isSelected ? 'Selected · demo' : 'Select plan'}
                variant={isSelected ? 'secondary' : 'primary'}
                onPress={() => handleSelectPlan(plan.name)}
                disabled={isSelected}
              />
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
  planHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  planName: {
    fontSize: typography.heading,
    fontWeight: '700',
    flexShrink: 1,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  planDesc: {
    fontSize: typography.caption,
    marginBottom: spacing.md,
  },
  featureList: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    fontSize: typography.caption,
    flexShrink: 1,
  },
});

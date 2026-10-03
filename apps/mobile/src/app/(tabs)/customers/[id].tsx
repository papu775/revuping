import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'mobile-tokens';
import { useDemoStore, formatDate } from 'mobile-data';
import {
  Header,
  Card,
  Badge,
  Avatar,
  Button,
  DetailSection,
  DetailItem,
  Dialog,
  BottomSheet,
  useToast,
} from 'mobile-ui';
import { spacing, typography } from 'mobile-tokens';

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { state, dispatch } = useDemoStore();
  const toast = useToast();
  const [showOptOutDialog, setShowOptOutDialog] = useState(false);

  const [showRequest, setShowRequest] = useState(false);

  const customer = state.customers.find((c) => c.id === Number(id));

  if (!customer) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.canvas, paddingTop: insets.top },
        ]}
      >
        <Header title="Customer" fallbackHref="/(tabs)/customers" showBack />
        <View style={styles.center}>
          <Text style={{ color: colors.muted }}>Customer not found.</Text>
        </View>
      </View>
    );
  }

  const initials = customer.name
    .split(' ')
    .map((n) => n[0])
    .join('');

  const handleToggleConsent = () => {
    dispatch({ type: 'TOGGLE_CONSENT', customerId: customer.id });
    toast.showToast(customer.consent ? 'Consent removed' : 'Consent recorded');
  };

  const handleToggleOptOut = () => {
    dispatch({ type: 'TOGGLE_OPT_OUT', customerId: customer.id });
    setShowOptOutDialog(false);
    toast.showToast(
      customer.optedOut ? 'Opt-out reversed' : 'Customer opted out',
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <Header title="Customer" fallbackHref="/(tabs)/customers" showBack />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 24 + insets.bottom,
        }}
      >
        <Card style={styles.card}>
          <View style={styles.profileHeader}>
            <Avatar
              initials={initials}
              tone={customer.consent ? 'sage' : 'peach'}
              size={56}
            />
            <View style={styles.profileInfo}>
              <Text style={[styles.name, { color: colors.ink }]}>
                {customer.name}
              </Text>
              <Text style={[styles.email, { color: colors.muted }]}>
                {customer.email}
              </Text>
            </View>
          </View>
          <View style={styles.badgeRow}>
            <Badge
              label={
                customer.optedOut
                  ? 'Opted out'
                  : customer.consent
                    ? 'Consented'
                    : 'No consent'
              }
              tone={
                customer.optedOut
                  ? 'danger'
                  : customer.consent
                    ? 'mint'
                    : 'warm'
              }
            />
          </View>
        </Card>

        <DetailSection title="Details">
          <DetailItem label="Customer source" value={customer.source} />
          {!['No consent', 'Opted out'].includes(customer.status) && (
            <DetailItem
              label="Request activity"
              value={`${customer.status} · demo`}
            />
          )}
          <DetailItem
            label="Consent source"
            value={customer.consent ? 'Recorded in demo' : 'Not recorded'}
          />
          <DetailItem
            label="Consent date"
            value={
              customer.consent
                ? formatDate(customer.consentDate)
                : 'Not recorded'
            }
          />
          <DetailItem
            label="Last visit"
            value={formatDate(customer.lastVisit)}
          />
          <DetailItem label="Preferred staff" value={customer.staff} />
          <DetailItem label="Service" value={customer.service} />
        </DetailSection>

        <DetailSection title="Tags">
          <View style={styles.tagRow}>
            {customer.tags.map((tag) => (
              <View
                key={tag}
                style={[styles.tag, { backgroundColor: colors.surfaceSection }]}
              >
                <Text style={[styles.tagText, { color: colors.muted }]}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        </DetailSection>

        <DetailSection title="Timeline">
          <View style={styles.timelineItem}>
            <View
              style={[styles.timelineDot, { backgroundColor: colors.violet }]}
            />
            <Text style={[styles.timelineText, { color: colors.muted }]}>
              Feedback received · fictional activity
            </Text>
          </View>
          {customer.consent && (
            <View style={styles.timelineItem}>
              <View
                style={[
                  styles.timelineDot,
                  { backgroundColor: colors.positiveInk },
                ]}
              />
              <Text style={[styles.timelineText, { color: colors.muted }]}>
                Consent recorded · {formatDate(customer.consentDate)}
              </Text>
            </View>
          )}
          <View style={styles.timelineItem}>
            <View
              style={[styles.timelineDot, { backgroundColor: colors.border }]}
            />
            <Text style={[styles.timelineText, { color: colors.muted }]}>
              Last visit · {formatDate(customer.lastVisit)}
            </Text>
          </View>
        </DetailSection>

        <View style={styles.actions}>
          <Button
            title="Preview review request"
            variant="secondary"
            onPress={() => setShowRequest(true)}
            style={{ marginBottom: 12 }}
          />
          <Button
            title={customer.consent ? 'Remove consent' : 'Record consent'}
            variant={customer.consent ? 'secondary' : 'primary'}
            onPress={handleToggleConsent}
          />
          <Button
            title={customer.optedOut ? 'Reverse opt-out' : 'Opt out'}
            variant="danger"
            onPress={() => setShowOptOutDialog(true)}
            style={{ marginTop: spacing.md }}
          />
        </View>
      </ScrollView>

      <BottomSheet
        visible={showRequest}
        onClose={() => setShowRequest(false)}
        title="Review request preview"
      >
        <View
          style={{
            backgroundColor: colors.surfaceSection,
            borderRadius: 16,
            padding: 16,
            gap: 12,
          }}
        >
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            To {customer.name} · Preview
          </Text>
          <Text
            selectable
            style={{ color: colors.ink, fontSize: 16, lineHeight: 25 }}
          >
            {state.templates.request
              .replaceAll('{name}', customer.name)
              .replaceAll('{link}', 'revuping://review/demo')}
          </Text>
        </View>
        <Text style={{ color: colors.muted, marginTop: 16, lineHeight: 22 }}>
          {customer.optedOut
            ? 'Customer opted out. No request can be sent.'
            : !customer.consent
              ? 'Consent is required before sending requests.'
              : 'Eligible for demo requests. This preview sends no message.'}
        </Text>
      </BottomSheet>
      <Dialog
        visible={showOptOutDialog}
        onClose={() => setShowOptOutDialog(false)}
        title={customer.optedOut ? 'Reverse opt-out?' : 'Opt out customer?'}
        message={
          customer.optedOut
            ? customer.consent
              ? 'This customer will become eligible for demo requests again.'
              : 'Consent is still required before this customer is eligible for demo requests.'
            : 'This customer will no longer be eligible for review requests or campaigns.'
        }
        confirmLabel={customer.optedOut ? 'Reverse' : 'Opt out'}
        onConfirm={handleToggleOptOut}
        destructive={!customer.optedOut}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: typography.heading,
    fontWeight: '700',
    flexShrink: 1,
  },
  email: {
    fontSize: typography.caption,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: typography.caption,
    fontWeight: '600',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineText: {
    flex: 1,
    fontSize: typography.caption,
  },
  actions: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
});

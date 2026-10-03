import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'mobile-tokens';
import { useDemoStore, countLabel } from 'mobile-data';
import {
  Header,
  Button,
  Field,
  DateField,
  Card,
  Select,
  useToast,
} from 'mobile-ui';
import { spacing, typography } from 'mobile-tokens';
import type { Campaign } from 'mobile-data';

import { campaignAudience, validSchedule } from '../../../features/campaigns';

const steps = ['Type', 'Audience', 'Message', 'Schedule'];

export default function CampaignBuilderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { state, dispatch } = useDemoStore();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<Campaign['kind']>('Review request');
  const [audience, setAudience] = useState('All eligible customers');
  const [channel, setChannel] = useState('Email');
  const [message, setMessage] = useState(state.templates.request);
  const [scheduled, setScheduled] = useState('2026-10-03T10:00');
  const [reminderDays, setReminderDays] = useState('3');
  const [name, setName] = useState('');
  const saving = useRef(false);
  const [error, setError] = useState('');
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web') return undefined;
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          if (step === 0) return false;
          setStep((s) => s - 1);
          return true;
        },
      );
      return () => subscription.remove();
    }, [step]),
  );

  const canProceed = () => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1)
      return campaignAudience(state.customers, audience).length > 0;
    if (step === 2) return message.trim().length > 0;
    return validSchedule(scheduled, reminderDays);
  };

  const handleSave = () => {
    if (saving.current) return;
    if (
      !name.trim() ||
      !message.trim() ||
      !validSchedule(scheduled, reminderDays)
    ) {
      setError('Enter a valid date and time, and reminder days from 0 to 30.');
      return;
    }
    saving.current = true;
    const newCampaign: Campaign = {
      id: Math.max(...state.campaigns.map((c) => c.id), 0) + 1,
      name: name.trim(),
      kind,
      status: 'Scheduled',
      audience,
      channel,
      message,
      scheduled,
      reminderDays: Number(reminderDays) || 0,
      stop: 'Opt-out or owner confirms completion',
      customerIds: campaignAudience(state.customers, audience).map((c) => c.id),
      created: '2026-10-02',
    };
    dispatch({ type: 'ADD_CAMPAIGN', campaign: newCampaign });
    toast.showToast(
      'Demo campaign saved. No messages are sent or scheduled with a provider.',
    );
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/campaigns');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <Header title="New campaign" fallbackHref="/(tabs)/campaigns" showBack />
      <View style={styles.progress}>
        {steps.map((s, i) => (
          <View
            key={s}
            style={[
              styles.progressDot,
              { backgroundColor: i <= step ? colors.violet : colors.border },
            ]}
          />
        ))}
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
        >
          <Text style={[styles.stepTitle, { color: colors.ink }]}>
            Step {step + 1} of 4 · {steps[step]}
          </Text>

          {step === 0 && (
            <Card style={styles.card}>
              <Field
                label="Campaign name"
                value={name}
                onChangeText={setName}
                placeholder="October visit follow-up"
                autoCapitalize="words"
              />
              <Select
                label="Campaign type"
                value={kind}
                options={['Review request', 'Reminder', 'Repeat visit']}
                onChange={(v) => {
                  setKind(v as Campaign['kind']);
                  setMessage(
                    v === 'Review request'
                      ? state.templates.request
                      : state.templates.rebooking,
                  );
                }}
              />
            </Card>
          )}

          {step === 1 && (
            <Card style={styles.card}>
              <Select
                label="Audience"
                value={audience}
                options={[
                  'All eligible customers',
                  'Regular customers',
                  'New customers',
                  'Last visit over 30 days',
                ]}
                onChange={setAudience}
              />
              <Text style={{ color: colors.muted, marginBottom: 16 }}>
                {countLabel(
                  campaignAudience(state.customers, audience).length,
                  'eligible demo customer',
                )}
              </Text>
              <Select
                label="Channel"
                value={channel}
                options={['Email', 'SMS', 'WhatsApp']}
                onChange={setChannel}
              />
            </Card>
          )}

          {step === 2 && (
            <Card style={styles.card}>
              <Field
                label="Message"
                value={message}
                onChangeText={setMessage}
                placeholder="Hi {name}, ..."
                multiline
              />
              <Text style={[styles.helpText, { color: colors.muted }]}>
                Use {'{name}'} for the customer's name and {'{link}'} for the
                review link.
              </Text>
            </Card>
          )}

          {step === 3 && (
            <Card style={styles.card}>
              <DateField
                label="Schedule date"
                value={scheduled.split('T')[0]}
                onChange={(date) =>
                  setScheduled(`${date}T${scheduled.split('T')[1] || '10:00'}`)
                }
              />
              <DateField
                label="Schedule time"
                mode="time"
                value={scheduled.split('T')[1] || '10:00'}
                onChange={(time) =>
                  setScheduled(`${scheduled.split('T')[0]}T${time}`)
                }
              />
              <Field
                label="Reminder days (0 for none)"
                value={reminderDays}
                onChangeText={setReminderDays}
                placeholder="3"
                keyboardType="numeric"
              />
            </Card>
          )}
        </ScrollView>

        {!!error && (
          <Text
            style={{ color: colors.danger, paddingHorizontal: 24 }}
            accessibilityLiveRegion="polite"
          >
            {error}
          </Text>
        )}
        <View
          style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}
        >
          {step > 0 && (
            <Button
              title="Back"
              variant="secondary"
              onPress={() => setStep(step - 1)}
              style={{ marginBottom: spacing.sm }}
            />
          )}
          <Button
            title={
              step === steps.length - 1 ? 'Save demo campaign' : 'Continue'
            }
            onPress={
              step === steps.length - 1 ? handleSave : () => setStep(step + 1)
            }
            disabled={!canProceed()}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progress: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  stepTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  card: {
    marginHorizontal: spacing.xl,
  },
  helpText: {
    fontSize: typography.caption,
    marginTop: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
});

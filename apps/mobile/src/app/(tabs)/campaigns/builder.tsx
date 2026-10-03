import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'mobile-tokens';
import { useDemoStore } from 'mobile-data';
import { Header, Button, Field, Card, Select, useToast } from 'mobile-ui';
import { spacing, typography } from 'mobile-tokens';
import type { Campaign } from 'mobile-data';

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

  const canProceed = () => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) return audience.trim().length > 0;
    if (step === 2) return message.trim().length > 0;
    return true;
  };

  const handleSave = () => {
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
      customerIds: state.customers.filter((c) => c.consent && !c.optedOut).map((c) => c.id),
      created: '2026-10-02',
    };
    dispatch({ type: 'ADD_CAMPAIGN', campaign: newCampaign });
    toast.showToast('Campaign created');
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <Header title="New campaign" showBack />
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
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
          <Text style={[styles.stepTitle, { color: colors.ink }]}>{steps[step]}</Text>

          {step === 0 && (
            <Card style={styles.card}>
              <Field label="Campaign name" value={name} onChangeText={setName} placeholder="October visit follow-up" autoCapitalize="words" />
              <Select label="Campaign type" value={kind} options={['Review request', 'Reminder', 'Repeat visit']} onChange={(v) => setKind(v as Campaign['kind'])} />
            </Card>
          )}

          {step === 1 && (
            <Card style={styles.card}>
              <Select label="Audience" value={audience} options={['All eligible customers', 'Regular customers', 'New customers', 'Last visit over 30 days']} onChange={setAudience} />
              <Select label="Channel" value={channel} options={['Email', 'SMS', 'WhatsApp']} onChange={setChannel} />
            </Card>
          )}

          {step === 2 && (
            <Card style={styles.card}>
              <Field label="Message" value={message} onChangeText={setMessage} placeholder="Hi {name}, ..." multiline />
              <Text style={[styles.helpText, { color: colors.muted }]}>
                Use {'{name}'} for the customer's name and {'{link}'} for the review link.
              </Text>
            </Card>
          )}

          {step === 3 && (
            <Card style={styles.card}>
              <Field label="Schedule date & time" value={scheduled} onChangeText={setScheduled} placeholder="2026-10-03T10:00" />
              <Field label="Reminder days (0 for none)" value={reminderDays} onChangeText={setReminderDays} placeholder="3" keyboardType="numeric" />
            </Card>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
          {step > 0 && (
            <Button title="Back" variant="secondary" onPress={() => setStep(step - 1)} style={{ marginBottom: spacing.sm }} />
          )}
          <Button
            title={step === steps.length - 1 ? 'Create campaign' : 'Continue'}
            onPress={step === steps.length - 1 ? handleSave : () => setStep(step + 1)}
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

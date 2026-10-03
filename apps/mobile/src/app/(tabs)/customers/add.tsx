import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'mobile-tokens';
import { useDemoStore } from 'mobile-data';
import { Header, Button, Field, Card, useToast } from 'mobile-ui';
import { spacing } from 'mobile-tokens';
import type { Customer } from 'mobile-data';

export default function AddCustomerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { state, dispatch } = useDemoStore();
  const toast = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [tags, setTags] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      setError('Customer name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }

    const newCustomer: Customer = {
      id: Math.max(...state.customers.map((c) => c.id), 0) + 1,
      name: name.trim(),
      email: email.trim(),
      consent,
      status: consent ? 'Ready to send' : 'No consent',
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      source: 'Manual entry · fictional',
      consentDate: consent ? '2026-10-02' : '',
      lastVisit: '2026-10-02',
      staff: 'Sophie',
      service: 'Colour',
      optedOut: false,
    };

    dispatch({ type: 'ADD_CUSTOMER', customer: newCustomer });
    toast.showToast('Customer added');
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <Header title="Add customer" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
          <Card style={styles.card}>
            <Field
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Customer name"
              autoCapitalize="words"
              error={error && !name.trim() ? 'Name is required' : undefined}
            />
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="customer@example.com"
              keyboardType="email-address"
              error={error && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? 'Enter a valid email' : undefined}
            />
            <Field
              label="Tags (comma separated)"
              value={tags}
              onChangeText={setTags}
              placeholder="Regular, Colour"
            />
          </Card>

          <Card style={styles.card}>
            <View style={styles.consentRow}>
              <View style={styles.consentText}>
                <View style={[styles.consentDot, { backgroundColor: consent ? colors.positiveInk : colors.border }]} />
                <View>
<View style={styles.consentLabelRow}>
  <Text style={styles.consentLabel}>Consent recorded</Text>
</View>
                  <View style={styles.consentDesc}>
                    Customer has agreed to receive review requests.
                  </View>
                </View>
              </View>
              <Button
                title={consent ? 'Remove' : 'Record'}
                variant={consent ? 'secondary' : 'primary'}
                onPress={() => setConsent(!consent)}
              />
            </View>
          </Card>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Button title="Save customer" onPress={handleSave} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  consentText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  consentDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  consentLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  consentLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  consentDesc: {
    fontSize: 13,
    color: '#535768',
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
});

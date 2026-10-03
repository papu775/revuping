import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDemoStore } from 'mobile-data';
import { useTheme } from 'mobile-tokens';
import {
  Header,
  Card,
  Field,
  Accordion,
  Button,
  Badge,
  BottomSheet,
  useToast,
} from 'mobile-ui';
export default function Referrals() {
  const { state, dispatch } = useDemoStore();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [form, setForm] = useState(state.referral);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(false);
  const save = () => {
    if (
      !form.name.trim() ||
      form.message.trim().length < 10 ||
      !form.terms.trim() ||
      !form.eligibility.trim()
    ) {
      setError('Complete the name, message, terms and eligibility.');
      return;
    }
    dispatch({ type: 'SET_REFERRAL', referral: form });
    setError('');
    toast.showToast('Referral programme saved in this demo');
  };
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header title="Referral campaigns" showBack />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{
            padding: 24,
            paddingBottom: 24 + insets.bottom,
            gap: 16,
          }}
        >
          <Text style={{ color: colors.muted }}>
            An invitation, without review incentives. No rewards, tracking
            services or messages are live.
          </Text>
          <Card>
            <Field
              label="Programme name"
              value={form.name}
              onChangeText={(name) => setForm({ ...form, name })}
            />
            <Field
              label="Share message"
              value={form.message}
              onChangeText={(message) => setForm({ ...form, message })}
              multiline
            />
            <Accordion
              title="Terms & eligibility"
              summary="Clear invitation rules, independent of reviews"
            >
              <Field
                label="Terms"
                value={form.terms}
                onChangeText={(terms) => setForm({ ...form, terms })}
                multiline
              />
              <Field
                label="Eligibility"
                value={form.eligibility}
                onChangeText={(eligibility) =>
                  setForm({ ...form, eligibility })
                }
                multiline
              />
            </Accordion>
            {!!error && (
              <Text
                style={{ color: colors.danger, marginBottom: 16 }}
                accessibilityLiveRegion="polite"
              >
                {error}
              </Text>
            )}
            <Button
              title="Save referral programme"
              onPress={save}
              style={{ marginTop: 16 }}
            />
          </Card>
          <Card>
            <Badge
              label={state.referral.paused ? 'Paused · demo' : 'Active · demo'}
              tone={state.referral.paused ? 'warm' : 'mint'}
            />
            <View style={{ gap: 12, marginTop: 16 }}>
              <Button
                title="Preview invitation"
                variant="secondary"
                onPress={() => setPreview(true)}
              />
              <Button
                title={
                  state.referral.paused ? 'Resume programme' : 'Pause programme'
                }
                variant="secondary"
                onPress={() => {
                  const next = {
                    ...state.referral,
                    paused: !state.referral.paused,
                  };
                  dispatch({ type: 'SET_REFERRAL', referral: next });
                  setForm((f) => ({ ...f, paused: next.paused }));
                  toast.showToast(
                    next.paused
                      ? 'Demo programme paused'
                      : 'Demo programme resumed',
                  );
                }}
              />
            </View>
          </Card>
          <Card>
            <Text
              style={{ color: colors.ink, fontSize: 18, fontWeight: '600' }}
            >
              Fictional activity
            </Text>
            <Text style={{ color: colors.muted, marginTop: 12 }}>
              Sample friend A · Visit interest recorded · 1 Oct 2026
            </Text>
            <Text style={{ color: colors.muted, marginTop: 12 }}>
              Sample friend B · Link opened · 29 Sep 2026
            </Text>
            <Text style={{ color: colors.muted, marginTop: 12 }}>
              A link opened is not a booking. No reward depends on a review.
            </Text>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
      <BottomSheet
        visible={preview}
        onClose={() => setPreview(false)}
        title="Invitation preview"
      >
        <Text style={{ color: colors.ink, fontSize: 20, fontWeight: '600' }}>
          {form.name}
        </Text>
        <Text style={{ color: colors.muted, marginTop: 16, lineHeight: 23 }}>
          {form.message.replaceAll('{link}', 'revuping://referral/demo')}
        </Text>
        <Text style={{ color: colors.muted, marginTop: 16, lineHeight: 23 }}>
          {form.eligibility}
        </Text>
        <Text style={{ color: colors.muted, marginTop: 16, lineHeight: 23 }}>
          {form.terms}
        </Text>
        <Text style={{ color: colors.muted, marginTop: 16, lineHeight: 23 }}>
          Preview only. No invitation is sent.
        </Text>
      </BottomSheet>
    </View>
  );
}

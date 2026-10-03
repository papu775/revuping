import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from 'mobile-tokens';
import { useDemoStore } from 'mobile-data';
import {
  Header,
  Card,
  Button,
  QRCode,
  Field,
  Accordion,
  BottomSheet,
  Badge,
  BrandColour,
  isBrandColour,
  useToast,
} from 'mobile-ui';
import { spacing, typography } from 'mobile-tokens';

export default function QRStudioScreen() {
  const { colors } = useTheme();
  const { state, dispatch } = useDemoStore();
  const toast = useToast();
  const [color, setColor] = useState(state.business.branding);
  const [showPreview, setShowPreview] = useState(false);
  const [choice, setChoice] = useState<'public' | 'private' | null>(null);
  const [comment, setComment] = useState('');

  const qrValue = `https://revuping.demo/r/${state.business.name.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <Header title="QR studio" showBack />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
      >
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>
            Branded QR code
          </Text>
          <View style={styles.qrContainer}>
            <QRCode value={qrValue} size={180} color={color} />
          </View>
          <Text style={[styles.qrUrl, { color: colors.muted }]}>{qrValue}</Text>
        </Card>

        <Card style={styles.card}>
          <BrandColour value={color} onChange={setColor} />
        </Card>

        <Card style={styles.card}>
          <Accordion
            title="Customer page preview"
            summary="Two equal choices, at every rating"
            open={showPreview}
            onToggle={setShowPreview}
          >
            <View
              style={[
                styles.previewBox,
                {
                  backgroundColor: colors.surfaceSection,
                  borderColor: colors.border,
                },
              ]}
            >
              <Badge label="Customer preview" tone="violet" />
              <Text style={[styles.previewTitle, { color: colors.ink }]}>
                {state.business.name}
              </Text>
              <Text
                style={[
                  styles.previewText,
                  { color: colors.muted, lineHeight: 22, textAlign: 'center' },
                ]}
              >
                How was your visit? Share your honest experience in whichever
                way you prefer.
              </Text>
              <View style={{ alignSelf: 'stretch', gap: 12, marginTop: 12 }}>
                <Button
                  title="Write a Google review"
                  variant="secondary"
                  onPress={() => setChoice('public')}
                />
                <Button
                  title="Share private feedback"
                  variant="secondary"
                  onPress={() => setChoice('private')}
                />
              </View>
              <Text
                style={{
                  color: colors.muted,
                  fontSize: 13,
                  lineHeight: 20,
                  textAlign: 'center',
                }}
              >
                Both choices remain available to everyone.
              </Text>
            </View>
          </Accordion>
        </Card>

        <View style={styles.actions}>
          <Button
            title="Save QR style"
            disabled={!isBrandColour(color)}
            onPress={() => {
              dispatch({ type: 'SET_BUSINESS', business: { branding: color } });
              toast.showToast('QR style saved');
            }}
          />
          <Text style={[styles.note, { color: colors.muted }]}>
            Preview only — no file is downloaded or shared.
          </Text>
        </View>
      </ScrollView>
      <BottomSheet
        visible={choice !== null}
        onClose={() => setChoice(null)}
        title={
          choice === 'private'
            ? 'Private feedback preview'
            : 'Google review preview'
        }
      >
        {choice === 'private' ? (
          <>
            <Field
              label="Your feedback"
              value={comment}
              onChangeText={setComment}
              multiline
              placeholder="Tell us about your visit…"
            />
            <Button
              title="Preview feedback submission"
              disabled={!comment.trim()}
              onPress={() => {
                setChoice(null);
                setComment('');
                toast.showToast('Preview complete. No feedback was sent.');
              }}
            />
          </>
        ) : (
          <Text style={{ color: colors.ink, fontSize: 16, lineHeight: 25 }}>
            This choice opens the business’s Google review page in a live setup.
            This demo does not open Google or publish a review.
          </Text>
        )}
      </BottomSheet>
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
  sectionTitle: {
    fontSize: typography.label,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  qrUrl: {
    fontSize: typography.caption,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  colorRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
  },
  previewToggle: {
    fontSize: typography.label,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  previewBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  previewTitle: {
    fontSize: typography.heading,
    fontWeight: '700',
    flexShrink: 1,
  },
  previewText: {
    fontSize: typography.caption,
  },
  actions: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  note: {
    fontSize: typography.caption,
    textAlign: 'center',
  },
});

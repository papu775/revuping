import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'mobile-tokens';
import { useDemoStore } from 'mobile-data';
import { Header, Card, Button, QRCode, Field, useToast } from 'mobile-ui';
import { spacing, typography } from 'mobile-tokens';

const presetColors = ['#6b52b9', '#20243c', '#3e644e', '#816334', '#a43743'];

export default function QRStudioScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { state, dispatch } = useDemoStore();
  const toast = useToast();
  const [color, setColor] = useState(state.business.branding);
  const [showPreview, setShowPreview] = useState(false);

  const qrValue = `https://revuping.demo/r/${state.business.name.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <Header title="QR studio" showBack />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Branded QR code</Text>
          <View style={styles.qrContainer}>
            <QRCode value={qrValue} size={180} color={color} />
          </View>
          <Text style={[styles.qrUrl, { color: colors.muted }]}>{qrValue}</Text>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Brand color</Text>
          <View style={styles.colorRow}>
            {presetColors.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c, borderColor: color === c ? colors.ink : 'transparent' },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Color ${c}`}
              />
            ))}
          </View>
          <Field label="Custom hex" value={color} onChangeText={setColor} placeholder="#6b52b9" />
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Customer page preview</Text>
          <TouchableOpacity onPress={() => setShowPreview(!showPreview)} accessibilityRole="button">
            <Text style={[styles.previewToggle, { color: colors.violet }]}>
              {showPreview ? 'Hide preview' : 'Show preview'}
            </Text>
          </TouchableOpacity>
          {showPreview && (
            <View style={[styles.previewBox, { backgroundColor: colors.surfaceSection, borderColor: colors.border }]}>
              <Text style={[styles.previewTitle, { color: colors.ink }]}>{state.business.name}</Text>
              <Text style={[styles.previewText, { color: colors.muted }]}>
                Scan to share your experience
              </Text>
              <QRCode value={qrValue} size={100} color={color} />
            </View>
          )}
        </Card>

        <View style={styles.actions}>
          <Button
            title="Save QR style"
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

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'mobile-tokens';
import { useDemoStore } from 'mobile-data';
import { Header, Card, Select, Button, Stars, useToast } from 'mobile-ui';
import { spacing, typography } from 'mobile-tokens';

const layouts = ['Compact badge', 'Review cards', 'Carousel', 'Review wall'];
const themes = ['Light', 'Dark'];

export default function WidgetsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { state, dispatch } = useDemoStore();
  const toast = useToast();

  const selectedReviews = state.reviews.filter((r) => state.widget.reviewIds.includes(r.id));

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <Header title="Widgets" showBack />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <Card style={styles.card}>
          <Select label="Layout" value={state.widget.layout} options={layouts} onChange={(v) => dispatch({ type: 'SET_WIDGET', widget: { layout: v } })} />
          <Select label="Theme" value={state.widget.theme} options={themes} onChange={(v) => dispatch({ type: 'SET_WIDGET', widget: { theme: v } })} />
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Preview</Text>
          <View
            style={[
              styles.previewBox,
              {
                backgroundColor: state.widget.theme === 'Dark' ? '#121521' : '#faf8f3',
                borderColor: colors.border,
              },
            ]}
          >
            {selectedReviews.map((review) => (
              <View
                key={review.id}
                style={[
                  styles.reviewCard,
                  {
                    backgroundColor: state.widget.theme === 'Dark' ? '#222739' : '#ffffff',
                    borderTopColor: state.widget.colour,
                  },
                ]}
              >
                <Text style={[styles.reviewName, { color: state.widget.theme === 'Dark' ? '#f0edf6' : '#20243c' }]}>
                  {review.name}
                </Text>
                <Stars rating={review.rating} size={14} color={state.widget.colour} />
                <Text style={[styles.reviewText, { color: state.widget.theme === 'Dark' ? '#c0c3d2' : '#535768' }]}>
                  {review.text}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Embed code</Text>
          <View style={[styles.codeBox, { backgroundColor: colors.surfaceInput, borderColor: colors.border }]}>
            <Text style={[styles.codeText, { color: colors.ink }]}>
              {`<div id="revuping-widget" data-layout="${state.widget.layout}" data-theme="${state.widget.theme}"></div>`}
            </Text>
          </View>
        </Card>

        <View style={styles.actions}>
          <Button title="Copy embed code" variant="secondary" onPress={() => toast.showToast('Embed code copied (demo)')} />
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
  previewBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
  },
  reviewCard: {
    borderTopWidth: 3,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  reviewName: {
    fontSize: typography.label,
    fontWeight: '700',
  },
  reviewText: {
    fontSize: typography.caption,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  codeBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
  },
  codeText: {
    fontSize: typography.caption,
    fontFamily: 'monospace',
  },
  actions: {
    paddingHorizontal: spacing.xl,
  },
});

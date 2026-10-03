import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from 'mobile-tokens';
import { useDemoStore, countLabel } from 'mobile-data';
import {
  Header,
  Card,
  Select,
  Button,
  BrandColour,
  isBrandColour,
  Toggle,
  Stars,
  BottomSheet,
} from 'mobile-ui';
import { spacing, typography } from 'mobile-tokens';

const layouts = ['Compact badge', 'Review cards', 'Carousel', 'Review wall'];
const themes = ['Light', 'Dark'];

export default function WidgetsScreen() {
  const { colors } = useTheme();
  const { state, dispatch } = useDemoStore();
  const [snippet, setSnippet] = useState(false);
  const [colour, setColour] = useState(state.widget.colour);

  const selectedReviews = state.reviews.filter((r) =>
    state.widget.reviewIds.includes(r.id),
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <Header title="Widgets" showBack />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
      >
        <Card style={styles.card}>
          <BrandColour
            value={colour}
            onChange={(colour) => {
              setColour(colour);
              if (isBrandColour(colour))
                dispatch({ type: 'SET_WIDGET', widget: { colour } });
            }}
          />
          <Select
            label="Layout"
            value={state.widget.layout}
            options={layouts}
            onChange={(v) =>
              dispatch({ type: 'SET_WIDGET', widget: { layout: v } })
            }
          />
          {state.reviews.map((review) => (
            <Toggle
              key={review.id}
              label={`Include ${review.name}`}
              value={state.widget.reviewIds.includes(review.id)}
              onValueChange={(include) =>
                dispatch({
                  type: 'SET_WIDGET',
                  widget: {
                    reviewIds: include
                      ? [...new Set([...state.widget.reviewIds, review.id])]
                      : state.widget.reviewIds.filter((id) => id !== review.id),
                  },
                })
              }
            />
          ))}
          <Select
            label="Preview theme"
            value={state.widget.theme}
            options={themes}
            onChange={(v) =>
              dispatch({ type: 'SET_WIDGET', widget: { theme: v } })
            }
          />
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>
            Preview
          </Text>
          <View
            style={[
              styles.previewBox,
              {
                backgroundColor:
                  state.widget.theme === 'Dark' ? '#121521' : '#faf8f3',
                borderColor: colors.border,
              },
            ]}
          >
            {selectedReviews.length === 0 && (
              <Text
                style={{
                  color: state.widget.theme === 'Dark' ? '#c0c3d2' : '#535768',
                }}
              >
                Select reviews above to preview this widget.
              </Text>
            )}
            {state.widget.layout === 'Compact badge' ? (
              <Text
                style={{
                  color: state.widget.theme === 'Dark' ? '#f0edf6' : '#20243c',
                  fontSize: 18,
                  fontWeight: '600',
                }}
              >
                {state.business.name} ·{' '}
                {countLabel(selectedReviews.length, 'featured review')}
              </Text>
            ) : (
              <ScrollView
                horizontal={state.widget.layout === 'Carousel'}
                showsHorizontalScrollIndicator
                contentContainerStyle={{ gap: 12 }}
                style={{ flexGrow: 0 }}
              >
                {selectedReviews.map((review) => (
                  <View
                    key={review.id}
                    style={[
                      styles.reviewCard,
                      state.widget.layout === 'Carousel' && { width: 240 },
                      {
                        backgroundColor:
                          state.widget.theme === 'Dark' ? '#222739' : '#ffffff',
                        borderTopColor: state.widget.colour,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.reviewName,
                        {
                          color:
                            state.widget.theme === 'Dark'
                              ? '#f0edf6'
                              : '#20243c',
                        },
                      ]}
                    >
                      {review.name}
                    </Text>
                    <Stars
                      rating={review.rating}
                      size={14}
                      color={
                        state.widget.theme === 'Dark' ? '#e5bd79' : '#816334'
                      }
                    />
                    <Text
                      style={[
                        styles.reviewText,
                        {
                          color:
                            state.widget.theme === 'Dark'
                              ? '#c0c3d2'
                              : '#535768',
                        },
                      ]}
                    >
                      {review.text}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
            {state.widget.layout === 'Review wall' && (
              <Text
                style={{
                  color: state.widget.theme === 'Dark' ? '#c0c3d2' : '#535768',
                }}
              >
                Reviews stack vertically for a readable phone layout.
              </Text>
            )}
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>
            Embed code
          </Text>
          <View
            style={[
              styles.codeBox,
              {
                backgroundColor: colors.surfaceInput,
                borderColor: colors.border,
              },
            ]}
          >
            <Text selectable style={[styles.codeText, { color: colors.ink }]}>
              {`<div id="revuping-widget" data-layout="${state.widget.layout}" data-theme="${state.widget.theme}"></div>`}
            </Text>
          </View>
        </Card>

        <View style={styles.actions}>
          <Button
            title="Preview embed code"
            variant="secondary"
            onPress={() => setSnippet(true)}
          />
        </View>
      </ScrollView>
      <BottomSheet
        visible={snippet}
        onClose={() => setSnippet(false)}
        title="Demo embed snippet"
      >
        <Text
          selectable
          style={{ color: colors.ink, fontFamily: 'monospace' }}
        >{`<div id="revuping-widget" data-layout="${state.widget.layout}" data-theme="${state.widget.theme}"></div>`}</Text>
        <Text style={{ color: colors.muted, marginTop: 16 }}>
          Long press to select and copy this example. No live widget is
          installed.
        </Text>
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

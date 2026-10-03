import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'mobile-tokens';
import { useDemoStore } from 'mobile-data';
import { Header, Card, Badge, Stars, Button, Avatar, useToast } from 'mobile-ui';
import { spacing, typography } from 'mobile-tokens';

export default function ReviewsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { state, dispatch } = useDemoStore();
  const toast = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState('');

  const startEdit = (id: number) => {
    setEditingId(id);
    setDraft(state.replyDrafts[id] ?? '');
  };

  const saveDraft = () => {
    if (editingId !== null) {
      dispatch({ type: 'SET_REPLY_DRAFT', reviewId: editingId, draft });
      toast.showToast('Reply draft saved');
    }
    setEditingId(null);
  };

  const approveReply = (id: number) => {
    dispatch({ type: 'APPROVE_REPLY', reviewId: id });
    toast.showToast('Reply approved (demo)');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <Header title="Google reviews" showBack />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {state.reviews.map((review) => {
          const isApproved = state.approvedReplies.includes(review.id);
          const isEditing = editingId === review.id;
          return (
            <Card key={review.id} style={styles.card}>
              <View style={styles.header}>
                <Avatar initials={review.name.split(' ').map((n) => n[0]).join('')} tone={review.rating >= 4 ? 'sage' : review.rating === 3 ? 'peach' : 'rose'} size={40} />
                <View style={styles.headerInfo}>
                  <Text style={[styles.name, { color: colors.ink }]}>{review.name}</Text>
                  <Text style={[styles.date, { color: colors.muted }]}>{review.date}</Text>
                </View>
                <Stars rating={review.rating} size={14} />
              </View>
              <Text style={[styles.reviewText, { color: colors.muted }]}>{review.text}</Text>

              <View style={styles.draftSection}>
                <View style={styles.draftHeader}>
                  <Text style={[styles.draftLabel, { color: colors.muted }]}>Owner reply draft</Text>
                  {isApproved && <Badge label="Approved" tone="mint" />}
                </View>
                {isEditing ? (
                  <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <TextInput
                      value={draft}
                      onChangeText={setDraft}
                      multiline
                      style={[styles.draftInput, { color: colors.ink, backgroundColor: colors.surfaceInput, borderColor: colors.controlBorder }]}
                      accessibilityLabel="Edit reply draft"
                    />
                    <View style={styles.editActions}>
                      <Button title="Cancel" variant="ghost" onPress={() => setEditingId(null)} />
                      <Button title="Save" onPress={saveDraft} />
                    </View>
                  </KeyboardAvoidingView>
                ) : (
                  <>
                    <Text style={[styles.draftText, { color: colors.ink }]}>
                      {state.replyDrafts[review.id] || review.draft}
                    </Text>
                    <View style={styles.actions}>
                      <Button title="Edit draft" variant="secondary" onPress={() => startEdit(review.id)} />
                      {!isApproved && (
                        <Button title="Approve reply" onPress={() => approveReply(review.id)} />
                      )}
                    </View>
                  </>
                )}
              </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: typography.label,
    fontWeight: '600',
  },
  date: {
    fontSize: typography.caption,
    marginTop: 2,
  },
  reviewText: {
    fontSize: typography.body,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  draftSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#dddcd6',
    paddingTop: spacing.md,
  },
  draftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  draftLabel: {
    fontSize: typography.caption,
    fontWeight: '600',
  },
  draftText: {
    fontSize: typography.caption,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  draftInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: typography.body,
    marginBottom: spacing.md,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});

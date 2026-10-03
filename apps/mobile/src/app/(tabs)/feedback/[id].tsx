import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'mobile-tokens';
import { useDemoStore } from 'mobile-data';
import { Header, Card, Badge, Avatar, Stars, Button, BottomSheet, useToast } from 'mobile-ui';
import { spacing, typography } from 'mobile-tokens';
import { followUpFor } from 'mobile-data';

export default function FeedbackDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { state, dispatch } = useDemoStore();
  const toast = useToast();

  const feedback = state.feedback.find((f) => f.id === Number(id));
  const [note, setNote] = useState(state.notes[Number(id)] ?? '');
  const [showAssign, setShowAssign] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);

  if (!feedback) {
    return (
      <View style={[styles.container, { backgroundColor: colors.canvas, paddingTop: insets.top }]}>
        <Header title="Feedback" showBack />
        <View style={styles.center}>
          <Text style={{ color: colors.muted }}>Feedback not found.</Text>
        </View>
      </View>
    );
  }

  const followUp = state.followUps[feedback.id] || followUpFor(feedback.id, feedback.resolved);

  const handleResolve = () => {
    dispatch({ type: 'SET_FEEDBACK_RESOLVED', feedbackId: feedback.id, resolved: !feedback.resolved });
    toast.showToast(feedback.resolved ? 'Feedback marked as unresolved' : 'Feedback resolved');
  };

  const handleSaveNote = () => {
    dispatch({ type: 'SET_NOTE', feedbackId: feedback.id, note });
    toast.showToast('Note saved');
  };

  const handleAssign = (staff: string) => {
    dispatch({
      type: 'SET_FOLLOW_UP',
      feedbackId: feedback.id,
      followUp: { ...followUp, assignee: staff },
    });
    setShowAssign(false);
    toast.showToast(`Assigned to ${staff}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <Header title="Feedback" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
          <Card style={styles.card}>
            <View style={styles.header}>
              <Avatar initials={feedback.initials} tone={feedback.rating >= 4 ? 'sage' : feedback.rating === 3 ? 'peach' : 'rose'} size={48} />
              <View style={styles.headerInfo}>
                <Text style={[styles.name, { color: colors.ink }]}>{feedback.name}</Text>
                <Text style={[styles.date, { color: colors.muted }]}>{feedback.date} · {feedback.staff}</Text>
              </View>
              <Stars rating={feedback.rating} size={16} />
            </View>
            <Text style={[styles.feedbackText, { color: colors.muted }]}>{feedback.text}</Text>
            <View style={styles.badgeRow}>
              <Badge
                label={feedback.resolved ? 'Resolved' : feedback.rating <= 3 ? 'Needs care' : 'New'}
                tone={feedback.resolved ? 'mint' : feedback.rating <= 3 ? 'warm' : 'violet'}
              />
            </View>
          </Card>

          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.ink }]}>Notes</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Add a private note..."
              placeholderTextColor={colors.disabledInk}
              multiline
              style={[styles.noteInput, { color: colors.ink, backgroundColor: colors.surfaceInput, borderColor: colors.controlBorder }]}
              accessibilityLabel="Private note"
            />
            <Button title="Save note" variant="secondary" onPress={handleSaveNote} style={{ marginTop: spacing.md }} />
          </Card>

          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.ink }]}>Follow-up plan</Text>
            <View style={styles.followUpRow}>
              <Text style={[styles.followUpLabel, { color: colors.muted }]}>Assigned to</Text>
              <TouchableOpacity onPress={() => setShowAssign(true)} accessibilityRole="button" accessibilityLabel={`Assign to ${followUp.assignee}`}>
                <Text style={[styles.followUpValue, { color: colors.violet }]}>{followUp.assignee}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.followUpRow}>
              <Text style={[styles.followUpLabel, { color: colors.muted }]}>Priority</Text>
              <Text style={[styles.followUpValue, { color: colors.ink }]}>{followUp.priority}</Text>
            </View>
            <View style={styles.followUpRow}>
              <Text style={[styles.followUpLabel, { color: colors.muted }]}>Due</Text>
              <Text style={[styles.followUpValue, { color: colors.ink }]}>{followUp.due}</Text>
            </View>
            <View style={styles.followUpRow}>
              <Text style={[styles.followUpLabel, { color: colors.muted }]}>Status</Text>
              <Badge label={followUp.status} tone={followUp.status === 'Resolved' ? 'mint' : followUp.status === 'In progress' ? 'warm' : 'violet'} />
            </View>
          </Card>

          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.ink }]}>History</Text>
            {followUp.history.map((entry, i) => (
              <View key={i} style={[styles.historyRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.historyDot, { backgroundColor: colors.violet }]} />
                <Text style={[styles.historyText, { color: colors.muted }]}>{entry}</Text>
              </View>
            ))}
          </Card>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Button
            title={feedback.resolved ? 'Mark unresolved' : 'Resolve feedback'}
            onPress={handleResolve}
            variant={feedback.resolved ? 'secondary' : 'primary'}
          />
        </View>
      </KeyboardAvoidingView>

      <BottomSheet visible={showAssign} onClose={() => setShowAssign(false)} title="Assign to staff">
        {['Unassigned', 'Alex', 'Mia', 'Sophie'].map((staff) => (
          <TouchableOpacity
            key={staff}
            onPress={() => handleAssign(staff)}
            style={styles.assignOption}
            accessibilityRole="button"
            accessibilityLabel={`Assign to ${staff}`}
          >
            <Text style={[styles.assignText, { color: colors.ink }]}>{staff}</Text>
          </TouchableOpacity>
        ))}
      </BottomSheet>
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
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: typography.heading,
    fontWeight: '700',
  },
  date: {
    fontSize: typography.caption,
    marginTop: 2,
  },
  feedbackText: {
    fontSize: typography.body,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  sectionTitle: {
    fontSize: typography.label,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: typography.body,
  },
  followUpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  followUpLabel: {
    fontSize: typography.caption,
  },
  followUpValue: {
    fontSize: typography.label,
    fontWeight: '600',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  historyText: {
    flex: 1,
    fontSize: typography.caption,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  assignOption: {
    paddingVertical: spacing.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  assignText: {
    fontSize: typography.body,
  },
});

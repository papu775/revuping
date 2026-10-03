import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from 'mobile-tokens';
import { useDemoStore } from 'mobile-data';
import {
  Header,
  Card,
  Button,
  Field,
  BrandColour,
  isBrandColour,
  Toggle,
  Avatar,
  useToast,
} from 'mobile-ui';
import { spacing, typography } from 'mobile-tokens';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { state, dispatch } = useDemoStore();
  const toast = useToast();

  const [businessName, setBusinessName] = useState(state.business.name);
  const [branding, setBranding] = useState(state.business.branding);
  const [category, setCategory] = useState(state.business.category);
  const [hours, setHours] = useState(state.business.hours);
  const [locations, setLocations] = useState(state.business.locations);
  const [requestTemplate, setRequestTemplate] = useState(
    state.templates.request,
  );
  const [rebookingTemplate, setRebookingTemplate] = useState(
    state.templates.rebooking,
  );
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const inviting = useRef(false);
  useEffect(() => {
    inviting.current = false;
  }, [inviteName, inviteEmail]);

  const handleSaveProfile = () => {
    if (
      !businessName.trim() ||
      !hours.trim() ||
      !locations.trim() ||
      !isBrandColour(branding)
    ) {
      toast.showToast(
        'Complete the profile and a valid brand colour.',
        'error',
      );
      return;
    }
    dispatch({
      type: 'SET_BUSINESS',
      business: {
        name: businessName.trim(),
        category,
        hours,
        locations,
        branding,
      },
    });
    toast.showToast('Business profile saved');
  };

  const handleSaveTemplates = () => {
    if (!requestTemplate.trim() || !rebookingTemplate.trim()) {
      toast.showToast('Enter both message templates.', 'error');
      return;
    }
    dispatch({ type: 'SET_TEMPLATE', key: 'request', value: requestTemplate });
    dispatch({
      type: 'SET_TEMPLATE',
      key: 'rebooking',
      value: rebookingTemplate,
    });
    toast.showToast('Templates saved');
  };

  const handleInvite = () => {
    if (inviting.current) return;
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.trim()) ||
      state.team.some(
        (member) =>
          member.email.toLowerCase() === inviteEmail.trim().toLowerCase(),
      )
    ) {
      toast.showToast(
        'Enter a valid email that is not already on the demo team.',
        'error',
      );
      return;
    }
    if (!inviteName.trim() || !inviteEmail.trim()) {
      toast.showToast('Enter name and email', 'error');
      return;
    }
    inviting.current = true;
    dispatch({
      type: 'ADD_TEAM_MEMBER',
      member: {
        id: Math.max(...state.team.map((t) => t.id), 0) + 1,
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: 'Staff',
        status: 'Invited · demo',
      },
    });
    setInviteName('');
    setInviteEmail('');
    toast.showToast('Demo invitation recorded. No email is sent.');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <Header title="Settings" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
        >
          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.ink }]}>
              Business profile
            </Text>
            <Field
              label="Business name"
              value={businessName}
              onChangeText={setBusinessName}
              autoCapitalize="words"
            />
            <Field
              label="Category"
              value={category}
              onChangeText={setCategory}
              autoCapitalize="words"
            />
            <Field
              label="Opening hours"
              value={hours}
              onChangeText={setHours}
            />
            <Field
              label="Locations"
              value={locations}
              onChangeText={setLocations}
              autoCapitalize="words"
            />
            <BrandColour value={branding} onChange={setBranding} />
            <Button title="Save profile" onPress={handleSaveProfile} />
          </Card>

          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.ink }]}>
              Team
            </Text>
            {state.team.map((member) => (
              <View
                key={member.id}
                style={[styles.teamRow, { borderBottomColor: colors.border }]}
              >
                <Avatar
                  initials={member.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                  tone="lavender"
                  size={36}
                />
                <View style={styles.teamInfo}>
                  <Text style={[styles.teamName, { color: colors.ink }]}>
                    {member.name}
                  </Text>
                  <Text style={[styles.teamRole, { color: colors.muted }]}>
                    {member.role} · {member.status}
                  </Text>
                </View>
                {member.role !== 'Owner' && (
                  <TouchableOpacity
                    onPress={() => {
                      dispatch({
                        type: 'REMOVE_TEAM_MEMBER',
                        memberId: member.id,
                      });
                      toast.showToast('Team member removed');
                    }}
                    style={{
                      minWidth: 48,
                      minHeight: 48,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${member.name}`}
                  >
                    <Ionicons name="trash" size={18} color={colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <View
              style={[styles.inviteSection, { borderTopColor: colors.border }]}
            >
              <Field
                label="Invite name"
                value={inviteName}
                onChangeText={setInviteName}
                placeholder="Team member name"
                autoCapitalize="words"
              />
              <Field
                label="Invite email"
                value={inviteEmail}
                onChangeText={setInviteEmail}
                placeholder="teammate@example.com"
                keyboardType="email-address"
              />
              <Button
                title="Invite member"
                variant="secondary"
                onPress={handleInvite}
              />
            </View>
          </Card>

          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.ink }]}>
              Notifications
            </Text>
            <Toggle
              label="Weekly summary"
              value={state.notifications.weekly}
              onValueChange={(v) =>
                dispatch({ type: 'SET_NOTIFICATION', key: 'weekly', value: v })
              }
            />
            <Toggle
              label="New feedback alerts"
              value={state.notifications.feedback}
              onValueChange={(v) =>
                dispatch({
                  type: 'SET_NOTIFICATION',
                  key: 'feedback',
                  value: v,
                })
              }
            />
            <Toggle
              label="Campaign reminders"
              value={state.notifications.reminders}
              onValueChange={(v) =>
                dispatch({
                  type: 'SET_NOTIFICATION',
                  key: 'reminders',
                  value: v,
                })
              }
            />
          </Card>

          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.ink }]}>
              Message templates
            </Text>
            <Field
              label="Review request"
              value={requestTemplate}
              onChangeText={setRequestTemplate}
              multiline
            />
            <Field
              label="Rebooking"
              value={rebookingTemplate}
              onChangeText={setRebookingTemplate}
              multiline
            />
            <Button title="Save templates" onPress={handleSaveTemplates} />
          </Card>
        </ScrollView>
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
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.label,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: typography.label,
    fontWeight: '600',
  },
  teamRole: {
    fontSize: typography.caption,
    marginTop: 2,
  },
  inviteSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#dddcd6',
  },
});

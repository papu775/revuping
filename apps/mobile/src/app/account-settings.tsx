import { InvitationAccept } from '../features/team-invitation';
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  Avatar,
  BottomSheet,
  BrandColour,
  Button,
  Card,
  Field,
  Header,
  Screen,
  Select,
  Toggle,
  useToast,
} from 'mobile-ui';
import { useTheme } from 'mobile-tokens';
import {
  accountDestination,
  initialOnboarding,
  locationInputSchema,
  onboardingDraftSchema,
  settingsErrorMessage,
  settingsInputSchema,
  supportedTimezones,
  timezoneLabel,
  type BusinessLocation,
  type InvitationPage,
  type OnboardingResponse,
  type TeamPage,
  type WorkspaceResponse,
  type WorkspaceSettings,
} from 'api-contracts';
import { useAuth } from '../data-access/auth-context';
import { createRequestKey } from '../data-access/request-key';
import { BusinessHours } from '../features/business-hours';
import { CategorySelect } from '../features/business-editors';
export default function AccountSettings() {
  const { client, session } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ workspace?: string }>();
  const [data, setData] = useState<{
    workspace: WorkspaceResponse;
    onboarding: OnboardingResponse;
    settings: WorkspaceSettings;
    team: TeamPage;
    invitations: InvitationPage | null;
    locations: BusinessLocation[];
  } | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      setData(null);
      setError('');
      (async () => {
        const current = await client.current();
        if (!current.user.emailVerified) {
          if (alive) router.replace('/verify-email');
          return;
        }
        const workspace = (await client.workspaces()).find(
          (v) => v.id === params.workspace,
        );
        if (!workspace) throw new Error('Unauthorized workspace');
        const onboarding = await client.onboarding(workspace.id);
        if (
          accountDestination(current, workspace, onboarding.completedAt) !==
          'dashboard'
        ) {
          if (alive)
            router.replace({
              pathname: '/workspace',
              params: { workspace: workspace.id },
            });
          return;
        }
        const settings = await client.settings(workspace.id);
        const team = await client.team(workspace.id);
        const locations = await client.businessLocations(workspace.id);
        const invitations =
          workspace.role === 'OWNER'
            ? await client.invitations(workspace.id)
            : null;
        if (alive)
          setData({
            workspace,
            onboarding,
            settings,
            team,
            invitations,
            locations,
          });
      })().catch((e) => {
        if (alive) setError(settingsErrorMessage(e));
      });
      return () => {
        alive = false;
      };
    }, [client, params.workspace, router, attempt]),
  );
  if (!session) return null;
  return (
    <Screen>
      <Header title="Business & team" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 24, gap: 20 }}
        >
          <Button
            title="Dashboard"
            variant="ghost"
            onPress={() =>
              router.push({
                pathname: '/account-dashboard',
                params: { workspace: params.workspace },
              })
            }
          />
          {!!error && (
            <Text accessibilityRole="alert" style={{ color: colors.danger }}>
              {error}
            </Text>
          )}
          {data ? (
            <SettingsBody
              key={data.workspace.id}
              initial={data}
              userId={session.user.id}
            />
          ) : (
            <>
              <Text style={{ color: colors.muted }}>
                {error ? 'Settings unavailable.' : 'Loading your workspace…'}
              </Text>
              {!!error && (
                <Button
                  title="Try again"
                  onPress={() => setAttempt((v) => v + 1)}
                />
              )}
            </>
          )}
          <Card>
            <Text style={{ color: colors.ink, fontSize: 20 }}>
              Accept a team invitation
            </Text>
            <Text style={{ color: colors.muted }}>
              After verifying the invited email, paste the token or full link
              from the latest invitation email.
            </Text>
            <InvitationAccept />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
function SettingsBody({
  initial,
  userId,
}: {
  initial: {
    workspace: WorkspaceResponse;
    onboarding: OnboardingResponse;
    settings: WorkspaceSettings;
    team: TeamPage;
    invitations: InvitationPage | null;
    locations: BusinessLocation[];
  };
  userId: string;
}) {
  const { client } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const id = initial.workspace.id;
  const owner = initial.workspace.role === 'OWNER';
  const [business, setBusiness] = useState(initial.onboarding);
  const [draft, setDraft] = useState(initial.onboarding.draft);
  const [settings, setSettings] = useState(initial.settings);
  const [prefs, setPrefs] = useState({
    weekly: initial.settings.weekly,
    feedback: initial.settings.feedback,
    reminders: initial.settings.reminders,
  });
  const [templates, setTemplates] = useState({
    requestTemplate: initial.settings.requestTemplate,
    rebookingTemplate: initial.settings.rebookingTemplate,
  });
  const [team, setTeam] = useState(initial.team);
  const [invitations, setInvitations] = useState(initial.invitations);
  const [locations, setLocations] = useState(initial.locations);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [hoursOpen, setHoursOpen] = useState(false);
  const [logo, setLogo] = useState<Awaited<
    ReturnType<typeof client.logoSource>
  > | null>(null);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('STAFF');
  const [inviteKey, setInviteKey] = useState(createRequestKey);
  const [locationOpen, setLocationOpen] = useState(false);
  const [location, setLocation] = useState<BusinessLocation | null>(null);
  const [locationDraft, setLocationDraft] = useState(initialOnboarding(''));
  const [archived, setArchived] = useState(false);
  const [locationKey, setLocationKey] = useState('');
  useEffect(() => {
    let alive = true;
    if (!business.hasLogo) {
      setLogo(null);
      return;
    }
    client
      .logoSource(id, business.revision)
      .then((value) => {
        if (alive) setLogo(value);
      })
      .catch((e) => {
        if (alive) setError(settingsErrorMessage(e));
      });
    return () => {
      alive = false;
    };
  }, [client, id, business]);
  async function run(scope: string, action: () => Promise<void>) {
    if (busy) return;
    setBusy(scope);
    setError('');
    try {
      await action();
    } catch (e) {
      setError(settingsErrorMessage(e));
    } finally {
      setBusy('');
    }
  }
  const title = (text: string) => (
    <Text style={{ color: colors.ink, fontSize: 20, fontWeight: '600' }}>
      {text}
    </Text>
  );
  async function refreshTeam(page = team.page) {
    setTeam(await client.team(id, page));
    if (owner)
      setInvitations(await client.invitations(id, invitations?.page || 1));
  }
  function changeMember(
    member: TeamPage['items'][number],
    role: 'OWNER' | 'STAFF' | 'REMOVE',
  ) {
    Alert.alert(
      'Change workspace access?',
      `${member.name}: ${role === 'REMOVE' ? 'Remove access and clear feedback assignments. The account and feedback remain.' : role === 'OWNER' ? 'Owner can manage this business and its team.' : 'Staff can manage feedback but not business settings.'}`,
      [
        { text: 'Keep access', style: 'cancel' },
        {
          text: 'Confirm change',
          onPress: () =>
            void run('team', async () => {
              await client.changeMember(id, member.id, {
                revision: member.revision,
                ...(role === 'REMOVE' ? { remove: true } : { role }),
              });
              if (member.id === userId)
                router.replace({
                  pathname: '/workspace',
                  params: role === 'REMOVE' ? {} : { workspace: id },
                });
              else await refreshTeam();
              toast.showToast('Workspace permissions updated.');
            }),
        },
      ],
    );
  }
  function openLocation(value?: BusinessLocation) {
    setLocation(value || null);
    setLocationDraft(
      value
        ? {
            ...initialOnboarding(value.name),
            locationName: value.name,
            address: value.address,
            timezone: value.timezone,
            hours: value.hours,
            closedDays: value.closedDays,
          }
        : {
            ...initialOnboarding(''),
            locationName: '',
            timezone: draft.timezone,
          },
    );
    setArchived(value?.archived || false);
    setLocationKey(createRequestKey());
    setLocationOpen(true);
  }
  return (
    <>
      {!owner && (
        <Text style={{ color: colors.muted }}>
          Staff access is read-only for business and team settings.
        </Text>
      )}
      {!!error && (
        <Text accessibilityRole="alert" style={{ color: colors.danger }}>
          {error}
        </Text>
      )}
      <Card>
        <View style={{ gap: 16 }}>
          {title('Business profile')}
          {owner ? (
            <>
              <Field
                label="Business name"
                value={draft.name}
                maxLength={100}
                editable={!busy}
                onChangeText={(name) => setDraft({ ...draft, name })}
              />
              <CategorySelect
                value={draft.category}
                onChange={(category) => {
                  if (!busy) setDraft({ ...draft, category });
                }}
              />
              <Field
                label="Primary location name"
                value={draft.locationName}
                maxLength={100}
                editable={!busy}
                onChangeText={(locationName) =>
                  setDraft({ ...draft, locationName })
                }
              />
              <Field
                label="Location address"
                value={draft.address}
                maxLength={500}
                editable={!busy}
                onChangeText={(address) => setDraft({ ...draft, address })}
              />
              <Select
                label="Timezone"
                value={draft.timezone}
                options={supportedTimezones(draft.timezone)}
                optionLabel={timezoneLabel}
                searchable
                onChange={(timezone) => {
                  if (!busy) setDraft({ ...draft, timezone });
                }}
              />
              <BrandColour
                value={draft.brandColor}
                onChange={(brandColor) => {
                  if (!busy) setDraft({ ...draft, brandColor });
                }}
              />
              <Button
                title={hoursOpen ? 'Hide opening hours' : 'Edit opening hours'}
                variant="secondary"
                disabled={!!busy}
                onPress={() => setHoursOpen((v) => !v)}
              />
              {hoursOpen && (
                <BusinessHours
                  draft={draft}
                  owner={!busy}
                  update={(patch) => {
                    if (!busy) setDraft({ ...draft, ...patch });
                  }}
                />
              )}
              <Button
                title={busy === 'profile' ? 'Saving…' : 'Save business profile'}
                disabled={!!busy}
                onPress={() => {
                  if (
                    !onboardingDraftSchema.safeParse(draft).success ||
                    !draft.category.trim() ||
                    !draft.locationName.trim()
                  ) {
                    setError(
                      'Complete business details and check opening hours.',
                    );
                    return;
                  }
                  void run('profile', async () => {
                    const saved = await client.saveOnboarding(id, {
                      revision: business.revision,
                      draft,
                      complete: false,
                    });
                    setBusiness(saved);
                    setDraft(saved.draft);
                    setLocations(await client.businessLocations(id));
                    toast.showToast('Business profile saved.');
                  });
                }}
              />
              <Button
                title={business.hasLogo ? 'Load saved logo' : 'No logo yet'}
                variant="ghost"
                disabled={!!busy || !business.hasLogo}
                onPress={() =>
                  void run('logo', async () =>
                    setLogo(await client.logoSource(id, business.revision)),
                  )
                }
              />
              {logo && (
                <Image
                  source={logo}
                  style={{ width: 100, height: 64 }}
                  resizeMode="contain"
                  accessibilityLabel="Your business logo"
                />
              )}
              <Button
                title={business.hasLogo ? 'Replace logo' : 'Upload logo'}
                variant="secondary"
                disabled={!!busy}
                onPress={() =>
                  void run('logo', async () => {
                    const image = await ImagePicker.launchImageLibraryAsync({
                      mediaTypes: ['images'],
                      allowsMultipleSelection: false,
                      quality: 1,
                    });
                    if (image.canceled) return;
                    const file = image.assets[0];
                    if ((file.fileSize || 0) > 2 * 1024 * 1024) {
                      setError('Choose a logo under 2 MB.');
                      return;
                    }
                    const saved = await client.uploadLogo(
                      id,
                      business.revision,
                      {
                        uri: file.uri,
                        name: file.fileName || 'business-logo',
                        type: file.mimeType || 'application/octet-stream',
                      },
                    );
                    setBusiness(saved);
                    setLogo(await client.logoSource(id, saved.revision));
                    toast.showToast('Business logo saved.');
                  })
                }
              />
              {business.hasLogo && (
                <Button
                  title="Remove logo"
                  variant="ghost"
                  disabled={!!busy}
                  onPress={() =>
                    void run('logo', async () => {
                      setBusiness(
                        await client.removeLogo(id, business.revision),
                      );
                      setLogo(null);
                      toast.showToast('Logo removed.');
                    })
                  }
                />
              )}
            </>
          ) : (
            <>
              <Text style={{ color: colors.ink }}>
                {business.draft.name} · {business.draft.category}
              </Text>
              <Text style={{ color: colors.muted }}>
                {business.draft.locationName} · {business.draft.address} ·{' '}
                {business.draft.timezone}
              </Text>
            </>
          )}
        </View>
      </Card>
      <Card>
        <View style={{ gap: 16 }}>
          {title('Business locations')}
          {locations.map((v) => (
            <View key={v.id} style={{ gap: 8 }}>
              <Text style={{ color: colors.ink }}>
                {v.name} ·{' '}
                {v.archived ? 'Archived' : v.primary ? 'Primary' : 'Active'}
              </Text>
              <Text style={{ color: colors.muted }}>
                {v.address || 'No address'} · {v.timezone}
              </Text>
              {owner && !v.primary && (
                <Button
                  title={`Edit ${v.name}`}
                  variant="ghost"
                  disabled={!!busy}
                  onPress={() => openLocation(v)}
                />
              )}
            </View>
          ))}
          {owner && (
            <Button
              title="Add location"
              disabled={!!busy}
              onPress={() => openLocation()}
            />
          )}
        </View>
      </Card>
      <Card>
        <View style={{ gap: 16 }}>
          {title('Team & roles')}
          <Text style={{ color: colors.muted }}>
            At least one owner must remain.
          </Text>
          {team.items.map((v) => (
            <View key={v.id} style={{ gap: 8 }}>
              <View
                style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}
              >
                <Avatar
                  initials={v.name
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join('')}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.ink }}>{v.name}</Text>
                  {v.email && (
                    <Text style={{ color: colors.muted }}>{v.email}</Text>
                  )}
                </View>
              </View>
              {owner ? (
                <>
                  <Select
                    label={`Role for ${v.name}`}
                    value={v.role}
                    options={['OWNER', 'STAFF']}
                    onChange={(role) => {
                      if (!busy && role !== v.role)
                        changeMember(v, role as 'OWNER' | 'STAFF');
                    }}
                  />
                  <Button
                    title={`Remove ${v.name} access`}
                    variant="ghost"
                    disabled={!!busy}
                    onPress={() => changeMember(v, 'REMOVE')}
                  />
                </>
              ) : (
                <Text style={{ color: colors.muted }}>{v.role}</Text>
              )}
            </View>
          ))}
          <Text style={{ color: colors.muted }}>
            {team.total} members · page {team.page}
          </Text>
          <Button
            title="Previous team page"
            variant="ghost"
            disabled={team.page === 1 || !!busy}
            onPress={() => void run('team', () => refreshTeam(team.page - 1))}
          />
          <Button
            title="Next team page"
            variant="ghost"
            disabled={team.page * 25 >= team.total || !!busy}
            onPress={() => void run('team', () => refreshTeam(team.page + 1))}
          />
          {owner && (
            <>
              <Field
                label="Invite name"
                value={inviteName}
                maxLength={100}
                editable={!busy}
                onChangeText={setInviteName}
              />
              <Field
                label="Invite email"
                value={inviteEmail}
                maxLength={254}
                keyboardType="email-address"
                editable={!busy}
                onChangeText={setInviteEmail}
              />
              <Select
                label="Invitation role"
                value={inviteRole}
                options={['STAFF', 'OWNER']}
                onChange={(role) => {
                  if (!busy) setInviteRole(role);
                }}
              />
              <Button
                title={
                  busy === 'invite' ? 'Creating invitation…' : 'Invite member'
                }
                disabled={!!busy}
                onPress={() =>
                  void run('invite', async () => {
                    const value = await client.invite(id, {
                      key: inviteKey,
                      name: inviteName,
                      email: inviteEmail,
                      role: inviteRole,
                    });
                    setInvitations(await client.invitations(id));
                    setInviteName('');
                    setInviteEmail('');
                    setInviteKey(createRequestKey());
                    toast.showToast(
                      value.delivery === 'FAILED'
                        ? 'Invitation saved; email failed. Use Resend.'
                        : value.delivery === 'PENDING'
                          ? 'Invitation email pending.'
                          : 'Invitation email accepted by mail server.',
                    );
                  })
                }
              />
              {invitations?.items.map((v) => (
                <View key={v.id} style={{ gap: 8 }}>
                  <Text style={{ color: colors.ink }}>
                    {v.name} · {v.email}
                  </Text>
                  <Text style={{ color: colors.muted }}>
                    {v.acceptedAt
                      ? 'Accepted'
                      : v.revokedAt
                        ? 'Revoked'
                        : new Date(v.expiresAt) <= new Date()
                          ? 'Expired'
                          : v.delivery === 'FAILED'
                            ? 'Email failed — resend available'
                            : v.delivery === 'SENT'
                              ? 'Email accepted by mail server'
                              : 'Email pending'}
                  </Text>
                  {!v.acceptedAt &&
                    !v.revokedAt &&
                    ['resend', 'revoke'].map((action) => (
                      <Button
                        key={action}
                        title={
                          action === 'resend'
                            ? 'Resend invitation'
                            : 'Revoke invitation'
                        }
                        variant="ghost"
                        disabled={!!busy}
                        onPress={() =>
                          void run('invitations', async () => {
                            const value = await client.invitationAction(
                              id,
                              v.id,
                              { revision: v.revision, action },
                            );
                            setInvitations(
                              await client.invitations(id, invitations.page),
                            );
                            toast.showToast(
                              value.delivery === 'FAILED' && action === 'resend'
                                ? 'Email failed; invitation remains saved.'
                                : action === 'resend'
                                  ? 'Invitation email accepted by mail server.'
                                  : 'Invitation revoked.',
                            );
                          })
                        }
                      />
                    ))}
                </View>
              ))}
              {invitations && (
                <>
                  <Button
                    title="Newer invitations"
                    variant="ghost"
                    disabled={invitations.page === 1 || !!busy}
                    onPress={() =>
                      void run('invitations', async () =>
                        setInvitations(
                          await client.invitations(id, invitations.page - 1),
                        ),
                      )
                    }
                  />
                  <Button
                    title="Older invitations"
                    variant="ghost"
                    disabled={
                      invitations.page * 25 >= invitations.total || !!busy
                    }
                    onPress={() =>
                      void run('invitations', async () =>
                        setInvitations(
                          await client.invitations(id, invitations.page + 1),
                        ),
                      )
                    }
                  />
                </>
              )}
            </>
          )}
        </View>
      </Card>
      <Card>
        <View style={{ gap: 16 }}>
          {title('Notifications')}
          {(['weekly', 'feedback', 'reminders'] as const).map((key) =>
            owner ? (
              <Toggle
                key={key}
                label={
                  {
                    weekly: 'Weekly summary',
                    feedback: 'New feedback alerts',
                    reminders: 'Campaign reminders',
                  }[key]
                }
                value={prefs[key]}
                description="Saved preference. Delivery requires the notification worker and configured provider."
                onValueChange={(value) => {
                  if (!busy) setPrefs({ ...prefs, [key]: value });
                }}
              />
            ) : (
              <Text key={key} style={{ color: colors.muted }}>
                {key}: {settings[key] ? 'Enabled preference' : 'Disabled'}
              </Text>
            ),
          )}
          {owner && (
            <Button
              title="Save notification preferences"
              disabled={!!busy}
              onPress={() =>
                void run('preferences', async () => {
                  setSettings(
                    await client.saveSettings(id, {
                      kind: 'notifications',
                      revision: settings.revision,
                      ...prefs,
                    }),
                  );
                  toast.showToast('Notification preferences saved.');
                })
              }
            />
          )}
          <Text style={{ color: colors.muted }}>
            Google reviews, WhatsApp, SMS and customer email: not configured.
            Account and team security email uses server SMTP.
          </Text>
        </View>
      </Card>
      <Card>
        <View style={{ gap: 16 }}>
          {title('Message templates')}
          <Field
            label="Review request"
            multiline
            value={templates.requestTemplate}
            maxLength={2000}
            editable={owner && !busy}
            onChangeText={(requestTemplate) =>
              setTemplates({ ...templates, requestTemplate })
            }
          />
          <Field
            label="Rebooking"
            multiline
            value={templates.rebookingTemplate}
            maxLength={2000}
            editable={owner && !busy}
            onChangeText={(rebookingTemplate) =>
              setTemplates({ ...templates, rebookingTemplate })
            }
          />
          <Text style={{ color: colors.muted }}>
            Use {'{name}'} and {'{link}'}. Saving does not send a message.
          </Text>
          {owner && (
            <Button
              title="Save templates"
              disabled={!!busy}
              onPress={() => {
                const value = {
                  kind: 'templates' as const,
                  revision: settings.revision,
                  ...templates,
                };
                if (!settingsInputSchema.safeParse(value).success) {
                  setError(
                    'Enter both templates with {link}; use only {name} and {link}.',
                  );
                  return;
                }
                void run('templates', async () => {
                  setSettings(await client.saveSettings(id, value));
                  toast.showToast('Message templates saved.');
                });
              }}
            />
          )}
        </View>
      </Card>
      <BottomSheet
        visible={locationOpen}
        title={location ? 'Edit location' : 'Add business location'}
        onClose={() => {
          if (!busy) setLocationOpen(false);
        }}
      >
        <Field
          label="Location name"
          value={locationDraft.locationName}
          maxLength={100}
          editable={!busy}
          onChangeText={(locationName) =>
            setLocationDraft({ ...locationDraft, locationName })
          }
        />
        <Field
          label="Location address"
          value={locationDraft.address}
          maxLength={500}
          editable={!busy}
          onChangeText={(address) =>
            setLocationDraft({ ...locationDraft, address })
          }
        />
        <Select
          label="Location timezone"
          value={locationDraft.timezone}
          options={supportedTimezones(locationDraft.timezone)}
          optionLabel={timezoneLabel}
          searchable
          onChange={(timezone) => {
            if (!busy) setLocationDraft({ ...locationDraft, timezone });
          }}
        />
        <BusinessHours
          draft={locationDraft}
          owner={!busy}
          update={(patch) => {
            if (!busy) setLocationDraft({ ...locationDraft, ...patch });
          }}
        />
        {location && (
          <Toggle
            label="Archive location"
            value={archived}
            description="Restored customer pages stay disabled until enabled in QR Studio."
            onValueChange={(value) => {
              if (!busy) setArchived(value);
            }}
          />
        )}
        {!!error && (
          <Text accessibilityRole="alert" style={{ color: colors.danger }}>
            {error}
          </Text>
        )}
        <Button
          title={busy === 'location' ? 'Saving…' : 'Save location'}
          disabled={!!busy}
          onPress={() => {
            const value = {
              revision: location?.revision || 0,
              name: locationDraft.locationName,
              address: locationDraft.address,
              timezone: locationDraft.timezone,
              hours: locationDraft.hours,
              closedDays: locationDraft.closedDays,
              archived,
              ...(!location ? { key: locationKey } : {}),
            };
            if (!locationInputSchema.safeParse(value).success) {
              setError('Enter a location name and check opening hours.');
              return;
            }
            void run('location', async () => {
              await client.saveBusinessLocation(
                id,
                location?.id || null,
                value,
              );
              setLocations(await client.businessLocations(id));
              setLocationOpen(false);
              toast.showToast('Location saved.');
            });
          }}
        />
      </BottomSheet>
    </>
  );
}

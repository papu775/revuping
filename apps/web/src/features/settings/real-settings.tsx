'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import {
  initialOnboarding,
  locationInputSchema,
  onboardingDraftSchema,
  settingsErrorMessage,
  settingsInputSchema,
  type BusinessLocation,
  type InvitationPage,
  type OnboardingResponse,
  type TeamPage,
  type WorkspaceSettings,
} from 'api-contracts';
import { refreshAccountRoutes } from '@/app/account-actions';
import { authRequest } from '@/data-access/auth-client';
import { uploadLogo } from '@/data-access/logo-client';
import { BrandColour } from '@/components/ui/brand-colour';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toaster';
import { HoursEditor, LogoPicker } from '@/features/auth/business-controls';
import { TimezoneSelect } from '@/features/auth/timezone-select';
import {
  Badge,
  Button,
  Field,
  PageHeading,
  Panel,
  SampleTable,
  Select,
} from '@/features/product/common';
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
function hoursLabel(value: OnboardingResponse['draft']) {
  return (
    value.hours
      .map((day, i) =>
        day.length
          ? `${days[i]} ${day.map((v) => `${v.open}–${v.close}`).join(', ')}`
          : value.closedDays[i]
            ? `${days[i]} closed`
            : '',
      )
      .filter(Boolean)
      .join(' · ') || 'Not provided'
  );
}
export function RealSettings({
  workspaceId,
  userId,
  owner,
  onboarding,
  initial,
  team: initialTeam,
  invitations: initialInvitations,
  locations: initialLocations,
}: {
  workspaceId: string;
  userId: string;
  owner: boolean;
  onboarding: OnboardingResponse;
  initial: WorkspaceSettings;
  team: TeamPage;
  invitations: InvitationPage | null;
  locations: BusinessLocation[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [business, setBusiness] = useState(onboarding);
  const [draft, setDraft] = useState(onboarding.draft);
  const [settings, setSettings] = useState(initial);
  const [prefs, setPrefs] = useState({
    weekly: initial.weekly,
    feedback: initial.feedback,
    reminders: initial.reminders,
  });
  const [templates, setTemplates] = useState({
    requestTemplate: initial.requestTemplate,
    rebookingTemplate: initial.rebookingTemplate,
  });
  const [team, setTeam] = useState(initialTeam);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [locations, setLocations] = useState(initialLocations);
  const [logoProgress, setLogoProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [scope, setScope] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('STAFF');
  const [inviteKey, setInviteKey] = useState('');
  const [change, setChange] = useState<{
    member: TeamPage['items'][number];
    role: 'OWNER' | 'STAFF' | 'REMOVE';
  } | null>(null);
  const [locationOpen, setLocationOpen] = useState(false);
  const [editingLocation, setEditingLocation] =
    useState<BusinessLocation | null>(null);
  const [locationDraft, setLocationDraft] = useState(initialOnboarding(''));
  const [locationArchived, setLocationArchived] = useState(false);
  const [locationKey, setLocationKey] = useState('');
  async function run(area: string, action: () => Promise<void>) {
    setBusy(area);
    setScope(area);
    setError('');
    try {
      await action();
    } catch (e) {
      setError(settingsErrorMessage(e));
    } finally {
      setBusy('');
    }
  }
  const notice = (area: string) =>
    scope === area && error ? (
      <p className="error-text" role="alert">
        {error}
      </p>
    ) : null;
  async function reloadTeam(page = team.page) {
    setTeam(
      await authRequest(
        `workspaces/${workspaceId}/team?page=${page}`,
        'teamPage',
      ),
    );
  }
  async function reloadInvites(page = invitations?.page || 1) {
    setInvitations(
      await authRequest(
        `workspaces/${workspaceId}/invitations?page=${page}`,
        'invitations',
      ),
    );
  }
  function openLocation(location?: BusinessLocation) {
    setEditingLocation(location || null);
    setLocationDraft(
      location
        ? {
            ...initialOnboarding(location.name),
            locationName: location.name,
            address: location.address,
            timezone: location.timezone,
            hours: location.hours,
            closedDays: location.closedDays,
          }
        : {
            ...initialOnboarding(''),
            locationName: '',
            timezone: draft.timezone,
          },
    );
    setLocationArchived(location?.archived || false);
    setLocationKey(crypto.randomUUID());
    setScope('location');
    setError('');
    setLocationOpen(true);
  }
  return (
    <>
      <PageHeading
        eyebrow="Your workspace, thoughtfully organised"
        title="Business & team settings"
        text="Manage your business, authorized team, preferences and message templates."
      />
      {!owner && (
        <p className="info-banner">
          Your staff access is read-only here. Owners manage business details
          and team permissions.
        </p>
      )}
      <div className="product-split">
        <Panel>
          <h2>Business profile & branding</h2>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (
                !onboardingDraftSchema.safeParse(draft).success ||
                !draft.category.trim() ||
                !draft.locationName.trim()
              ) {
                setScope('profile');
                setError(
                  'Complete the business name, category and primary location; check your hours.',
                );
                return;
              }
              void run('profile', async () => {
                const saved = await authRequest(
                  `workspaces/${workspaceId}/onboarding`,
                  'onboarding',
                  { revision: business.revision, draft, complete: false },
                  'PUT',
                );
                setBusiness(saved);
                setDraft(saved.draft);
                setLocations(
                  await authRequest(
                    `workspaces/${workspaceId}/business-locations`,
                    'businessLocations',
                  ),
                );
                await refreshAccountRoutes();
                router.refresh();
                toast('Business profile saved');
              });
            }}
          >
            <fieldset
              disabled={!owner || !!busy}
              className="min-w-0 border-0 p-0"
            >
              <div className="grid gap-x-5 sm:grid-cols-2">
                <Field>
                  Business name
                  <input
                    value={draft.name}
                    maxLength={100}
                    onChange={(e) =>
                      setDraft({ ...draft, name: e.target.value })
                    }
                  />
                </Field>
                <Field as="div">
                  <span>Business category</span>
                  <Select
                    label="Business category"
                    value={draft.category}
                    options={[
                      ...new Set([
                        draft.category,
                        'Salon & beauty',
                        'Wellness',
                        'Local services',
                        'Hospitality',
                        'Retail',
                        'Other',
                      ]),
                    ]
                      .filter(Boolean)
                      .map((value) => ({ value, label: value }))}
                    onValueChange={(v) => setDraft({ ...draft, category: v })}
                  />
                </Field>
                <Field>
                  Opening hours
                  <input readOnly value={hoursLabel(draft)} />
                </Field>
                <Field>
                  Locations
                  <input
                    readOnly
                    value={locations
                      .filter((v) => !v.archived)
                      .map((v) => v.name)
                      .join(', ')}
                  />
                </Field>
                <Field>
                  Primary location name
                  <input
                    value={draft.locationName}
                    maxLength={100}
                    onChange={(e) =>
                      setDraft({ ...draft, locationName: e.target.value })
                    }
                  />
                </Field>
                <Field>
                  Location address
                  <input
                    value={draft.address}
                    maxLength={500}
                    onChange={(e) =>
                      setDraft({ ...draft, address: e.target.value })
                    }
                  />
                </Field>
                <Field as="div">
                  <span>Timezone</span>
                  <TimezoneSelect
                    value={draft.timezone}
                    onChange={(v) => setDraft({ ...draft, timezone: v })}
                  />
                </Field>
                <BrandColour
                  label="Brand accent"
                  value={draft.brandColor}
                  onChange={(v) => setDraft({ ...draft, brandColor: v })}
                />
              </div>
              <details className="data-alternative">
                <summary>Edit opening hours</summary>
                <HoursEditor
                  draft={draft}
                  invalidDays={[]}
                  update={(patch) => setDraft({ ...draft, ...patch })}
                />
              </details>
              {notice('profile')}
              <Button type="submit" aria-busy={busy === 'profile'}>
                {busy === 'profile' ? 'Saving…' : 'Save business profile'}
              </Button>
            </fieldset>
          </form>
          <LogoPicker
            logo={
              business.hasLogo
                ? `/api/backend/workspaces/${workspaceId}/logo?v=${business.revision}`
                : null
            }
            progress={logoProgress}
            error={scope === 'logo' ? error : ''}
            disabled={!owner || !!busy}
            onUpload={(file) => {
              void run('logo', async () => {
                setLogoProgress(0);
                let saved: OnboardingResponse;
                try {
                  saved = await uploadLogo(
                    workspaceId,
                    business.revision,
                    file,
                    setLogoProgress,
                    AbortSignal.timeout(15000),
                  );
                } finally {
                  setLogoProgress(null);
                }
                setBusiness(saved);
                await refreshAccountRoutes();
                router.refresh();
                toast('Business logo saved');
              });
            }}
            onRemove={() => {
              void run('logo', async () => {
                const saved = await authRequest(
                  `workspaces/${workspaceId}/logo`,
                  'onboarding',
                  { revision: business.revision },
                  'DELETE',
                );
                setBusiness(saved);
                await refreshAccountRoutes();
                router.refresh();
                toast('Business logo removed');
              });
            }}
          />
        </Panel>
        <Panel className="product-detail">
          <h2>Notification preferences</h2>
          <fieldset
            disabled={!owner || !!busy}
            className="min-w-0 border-0 p-0"
          >
            {(['weekly', 'feedback', 'reminders'] as const).map((key) => (
              <label className="consent-checkbox" key={key}>
                <input
                  type="checkbox"
                  checked={prefs[key]}
                  onChange={(e) =>
                    setPrefs({ ...prefs, [key]: e.target.checked })
                  }
                />
                <span>
                  {
                    {
                      weekly: 'Weekly owner summary',
                      feedback: 'New private feedback',
                      reminders: 'Scheduled reminders',
                    }[key]
                  }
                  <small>
                    Saved preference. Delivery requires the notification worker
                    and configured provider.
                  </small>
                </span>
              </label>
            ))}
            {notice('preferences')}
            <Button
              variant="secondary"
              aria-busy={busy === 'preferences'}
              onClick={() => {
                void run('preferences', async () => {
                  setSettings(
                    await authRequest(
                      `workspaces/${workspaceId}/settings`,
                      'settings',
                      {
                        kind: 'notifications',
                        revision: settings.revision,
                        ...prefs,
                      },
                      'PATCH',
                    ),
                  );
                  toast('Notification preferences saved');
                });
              }}
            >
              Save notification preferences
            </Button>
          </fieldset>
          <h3>Integration status</h3>
          {['Google reviews', 'WhatsApp', 'SMS', 'Customer email'].map(
            (name) => (
              <div className="settings-status" key={name}>
                <span>{name}</span>
                <Badge>Not configured</Badge>
              </div>
            ),
          )}
          <p className="field-help">
            Account and team security email uses the server’s SMTP
            configuration. Customer messaging and review integrations are
            configured separately.
          </p>
        </Panel>
      </div>
      <Panel>
        <div className="product-panel-heading">
          <div>
            <h2>Business locations</h2>
            <p>
              Manage individual locations while preserving customer links and
              feedback history.
            </p>
          </div>
          {owner && (
            <Button onClick={() => openLocation()} disabled={!!busy}>
              <Plus size={17} />
              Add location
            </Button>
          )}
        </div>
        <SampleTable
          caption="Your business locations"
          headers={['Location', 'Address', 'Timezone', 'Status', 'Actions']}
          rows={locations.map((v) => [
            v.name,
            v.address || 'Not provided',
            v.timezone,
            <Badge key="status" mint={!v.archived}>
              {v.archived ? 'Archived' : v.primary ? 'Primary' : 'Active'}
            </Badge>,
            owner ? (
              v.primary ? (
                <Link
                  href={`/workspace?workspace=${workspaceId}&edit=business`}
                  className="text-accent"
                >
                  Edit primary location
                </Link>
              ) : (
                <Button
                  key="edit"
                  variant="ghost"
                  disabled={!!busy}
                  onClick={() => openLocation(v)}
                >
                  Edit location
                </Button>
              )
            ) : (
              'Read-only'
            ),
          ])}
        />
      </Panel>
      <Panel>
        <div className="product-panel-heading">
          <div>
            <h2>Team & roles</h2>
            <p>
              Owner and staff permissions are enforced by the API. At least one
              owner must remain.
            </p>
          </div>
          {owner && (
            <Button
              disabled={!!busy}
              onClick={() => {
                setInviteName('');
                setInviteEmail('');
                setInviteRole('STAFF');
                setInviteKey(crypto.randomUUID());
                setScope('invite');
                setError('');
                setInviteOpen(true);
              }}
            >
              <Plus size={17} />
              Invite teammate
            </Button>
          )}
        </div>
        <SampleTable
          caption="Authorized workspace members"
          headers={['Teammate', 'Contact', 'Role', 'Status', 'Actions']}
          rows={team.items.map((v) => [
            v.name,
            v.email || 'Visible to owners',
            owner ? (
              <Select
                key="role"
                label={`Role for ${v.name}`}
                value={v.role}
                disabled={!!busy}
                options={[
                  { value: 'OWNER', label: 'Owner' },
                  { value: 'STAFF', label: 'Staff' },
                ]}
                onValueChange={(role) => {
                  if (role !== v.role) {
                    setError('');
                    setScope('member');
                    setChange({ member: v, role: role as 'OWNER' | 'STAFF' });
                  }
                }}
              />
            ) : v.role === 'OWNER' ? (
              'Owner'
            ) : (
              'Staff'
            ),
            'Active',
            owner ? (
              <Button
                key="remove"
                variant="ghost"
                disabled={!!busy}
                onClick={() => {
                  setError('');
                  setScope('member');
                  setChange({ member: v, role: 'REMOVE' });
                }}
              >
                Remove access
              </Button>
            ) : (
              'Read-only'
            ),
          ])}
        />
        {notice('team')}
        <div className="detail-actions">
          <Button
            variant="secondary"
            disabled={team.page === 1 || !!busy}
            onClick={() => {
              void run('team', () => reloadTeam(team.page - 1));
            }}
          >
            Previous team page
          </Button>
          <span>
            {team.total} members · page {team.page}
          </span>
          <Button
            variant="secondary"
            disabled={team.page * 25 >= team.total || !!busy}
            onClick={() => {
              void run('team', () => reloadTeam(team.page + 1));
            }}
          >
            Next team page
          </Button>
          <Button
            variant="ghost"
            disabled={!!busy}
            onClick={() => {
              void run('team', () => reloadTeam());
            }}
          >
            Refresh team
          </Button>
        </div>
        {owner && invitations && (
          <>
            <h3>Invitations</h3>
            <SampleTable
              caption="Workspace invitations"
              headers={['Teammate', 'Contact', 'Role', 'Status', 'Actions']}
              rows={invitations.items.map((v) => [
                v.name,
                v.email,
                v.role === 'OWNER' ? 'Owner' : 'Staff',
                v.acceptedAt
                  ? 'Accepted'
                  : v.revokedAt
                    ? 'Revoked'
                    : new Date(v.expiresAt) <= new Date()
                      ? 'Expired'
                      : v.delivery === 'SENT'
                        ? 'Email accepted by mail server'
                        : v.delivery === 'FAILED'
                          ? 'Email failed — resend available'
                          : 'Email pending',
                !v.acceptedAt && !v.revokedAt ? (
                  <div key="actions" className="flex flex-wrap gap-2">
                    {['resend', 'revoke'].map((action) => (
                      <Button
                        key={action}
                        variant="ghost"
                        disabled={!!busy}
                        onClick={() => {
                          void run('invitations', async () => {
                            const value = await authRequest(
                              `workspaces/${workspaceId}/invitations/${v.id}`,
                              'invitation',
                              { revision: v.revision, action },
                              'PATCH',
                            );
                            await reloadInvites();
                            toast(
                              value.delivery === 'FAILED' && action === 'resend'
                                ? 'Invitation saved; email failed. You can resend.'
                                : action === 'revoke'
                                  ? 'Invitation revoked'
                                  : 'Invitation email accepted by mail server',
                              value.delivery === 'FAILED' ? 'info' : 'success',
                            );
                          });
                        }}
                      >
                        {action === 'resend'
                          ? 'Resend invitation'
                          : 'Revoke invitation'}
                      </Button>
                    ))}
                  </div>
                ) : (
                  'No pending action'
                ),
              ])}
            />
            {!invitations.total && <p>No pending invitations.</p>}
            {notice('invitations')}
            <div className="detail-actions">
              <Button
                variant="ghost"
                disabled={invitations.page === 1 || !!busy}
                onClick={() => {
                  void run('invitations', () =>
                    reloadInvites(invitations.page - 1),
                  );
                }}
              >
                Newer invitations
              </Button>
              <Button
                variant="ghost"
                disabled={invitations.page * 25 >= invitations.total || !!busy}
                onClick={() => {
                  void run('invitations', () =>
                    reloadInvites(invitations.page + 1),
                  );
                }}
              >
                Older invitations
              </Button>
            </div>
          </>
        )}
      </Panel>
      <Panel>
        <h2>Message templates</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const value = {
              kind: 'templates' as const,
              revision: settings.revision,
              ...templates,
            };
            if (!settingsInputSchema.safeParse(value).success) {
              setScope('templates');
              setError(
                'Enter both templates, include {link}, and use only {name} and {link} placeholders.',
              );
              return;
            }
            void run('templates', async () => {
              setSettings(
                await authRequest(
                  `workspaces/${workspaceId}/settings`,
                  'settings',
                  value,
                  'PATCH',
                ),
              );
              toast('Message templates saved');
            });
          }}
        >
          <fieldset
            disabled={!owner || !!busy}
            className="min-w-0 border-0 p-0"
          >
            <Field>
              Review request template
              <textarea
                aria-label="Review request template"
                rows={3}
                maxLength={2000}
                value={templates.requestTemplate}
                onChange={(e) =>
                  setTemplates({
                    ...templates,
                    requestTemplate: e.target.value,
                  })
                }
              />
            </Field>
            <Field>
              Rebooking template
              <textarea
                aria-label="Rebooking template"
                rows={3}
                maxLength={2000}
                value={templates.rebookingTemplate}
                onChange={(e) =>
                  setTemplates({
                    ...templates,
                    rebookingTemplate: e.target.value,
                  })
                }
              />
            </Field>
            <p className="field-help">
              Use {'{name}'} and {'{link}'}. Saving does not send a message.
              Customer messaging must be configured.
            </p>
            {notice('templates')}
            <Button type="submit" aria-busy={busy === 'templates'}>
              Save message templates
            </Button>
          </fieldset>
        </form>
      </Panel>
      <Dialog
        open={inviteOpen}
        onOpenChange={(open) => {
          if (!busy) setInviteOpen(open);
        }}
        title="Invite a teammate"
        description="A secure email invitation. The invited account must verify the matching email before joining."
      >
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void run('invite', async () => {
              const value = await authRequest(
                `workspaces/${workspaceId}/invitations`,
                'invitation',
                {
                  key: inviteKey,
                  name: inviteName,
                  email: inviteEmail,
                  role: inviteRole,
                },
              );
              await reloadInvites(1);
              setInviteOpen(false);
              toast(
                value.delivery === 'FAILED'
                  ? 'Invitation saved; email failed. Use Resend invitation.'
                  : value.delivery === 'PENDING'
                    ? 'Invitation saved; email is pending.'
                    : 'Invitation email accepted by mail server',
                value.delivery !== 'SENT' ? 'info' : 'success',
              );
            });
          }}
        >
          <fieldset disabled={!!busy} className="min-w-0 border-0 p-0">
            <Field>
              Teammate name
              <input
                maxLength={100}
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
              />
            </Field>
            <Field>
              Teammate email
              <input
                type="email"
                maxLength={254}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </Field>
            <Field as="div">
              <span>Invitation role</span>
              <Select
                label="Invitation role"
                value={inviteRole}
                options={[
                  { value: 'STAFF', label: 'Staff' },
                  {
                    value: 'OWNER',
                    label: 'Owner — can manage business and access',
                  },
                ]}
                onValueChange={setInviteRole}
              />
            </Field>
            {notice('invite')}
            <Button type="submit" aria-busy={busy === 'invite'}>
              {busy === 'invite' ? 'Creating invitation…' : 'Send invitation'}
            </Button>
          </fieldset>
        </form>
      </Dialog>
      <Dialog
        open={!!change}
        onOpenChange={(open) => {
          if (!open && !busy) setChange(null);
        }}
        title={
          change?.role === 'REMOVE'
            ? 'Remove workspace access?'
            : 'Change workspace permissions?'
        }
        description={
          change
            ? `${change.member.name}: ${change.role === 'REMOVE' ? 'Access will be removed and open feedback assignments cleared. The account and feedback remain.' : change.role === 'OWNER' ? 'Owner access can manage this business and all team permissions.' : 'Staff access can manage private feedback, but cannot edit business settings.'}`
            : ''
        }
      >
        {notice('member')}
        <Button
          variant="secondary"
          disabled={!!busy}
          onClick={() => setChange(null)}
        >
          Keep current access
        </Button>
        <Button
          disabled={!!busy}
          onClick={() => {
            if (!change) return;
            void run('member', async () => {
              await authRequest(
                `workspaces/${workspaceId}/team/${change.member.id}`,
                'message',
                {
                  revision: change.member.revision,
                  ...(change.role === 'REMOVE'
                    ? { remove: true }
                    : { role: change.role }),
                },
                'PATCH',
              );
              const self = change.member.id === userId;
              setChange(null);
              if (self) {
                await refreshAccountRoutes();
                router.replace(
                  `/workspace${change.role === 'REMOVE' ? '' : `?workspace=${workspaceId}`}`,
                );
              } else {
                await reloadTeam();
                await reloadInvites();
              }
              toast('Workspace permissions updated');
            });
          }}
        >
          Confirm access change
        </Button>
      </Dialog>
      <Dialog
        open={locationOpen}
        wide
        onOpenChange={(open) => {
          if (!busy) setLocationOpen(open);
        }}
        title={editingLocation ? 'Edit location' : 'Add a business location'}
        description="Locations keep stable customer links. Archiving disables the public page without deleting feedback."
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const value = {
              revision: editingLocation?.revision || 0,
              name: locationDraft.locationName,
              address: locationDraft.address,
              timezone: locationDraft.timezone,
              hours: locationDraft.hours,
              closedDays: locationDraft.closedDays,
              archived: locationArchived,
              ...(!editingLocation ? { key: locationKey } : {}),
            };
            if (!locationInputSchema.safeParse(value).success) {
              setScope('location');
              setError(
                'Enter the location name and check the address, timezone and opening hours.',
              );
              return;
            }
            void run('location', async () => {
              await authRequest(
                `workspaces/${workspaceId}/business-locations${editingLocation ? `/${editingLocation.id}` : ''}`,
                'businessLocation',
                value,
                editingLocation ? 'PUT' : 'POST',
              );
              setLocations(
                await authRequest(
                  `workspaces/${workspaceId}/business-locations`,
                  'businessLocations',
                ),
              );
              setLocationOpen(false);
              toast('Location saved');
            });
          }}
        >
          <fieldset disabled={!!busy} className="min-w-0 border-0 p-0">
            <div className="product-form-grid">
              <Field>
                Location name
                <input
                  value={locationDraft.locationName}
                  maxLength={100}
                  onChange={(e) =>
                    setLocationDraft({
                      ...locationDraft,
                      locationName: e.target.value,
                    })
                  }
                />
              </Field>
              <Field>
                Location address
                <input
                  value={locationDraft.address}
                  maxLength={500}
                  onChange={(e) =>
                    setLocationDraft({
                      ...locationDraft,
                      address: e.target.value,
                    })
                  }
                />
              </Field>
            </div>
            <TimezoneSelect
              value={locationDraft.timezone}
              onChange={(v) =>
                setLocationDraft({ ...locationDraft, timezone: v })
              }
            />
            <HoursEditor
              draft={locationDraft}
              invalidDays={[]}
              update={(patch) =>
                setLocationDraft({ ...locationDraft, ...patch })
              }
            />
            {editingLocation && (
              <label className="consent-checkbox">
                <input
                  type="checkbox"
                  checked={locationArchived}
                  onChange={(e) => setLocationArchived(e.target.checked)}
                />
                <span>
                  Archive this location
                  <small>
                    Restored customer pages remain disabled until you enable
                    them in QR Studio.
                  </small>
                </span>
              </label>
            )}
            {notice('location')}
            <Button type="submit" aria-busy={busy === 'location'}>
              {busy === 'location' ? 'Saving…' : 'Save location'}
            </Button>
          </fieldset>
        </form>
      </Dialog>
    </>
  );
}

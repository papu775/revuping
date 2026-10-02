'use client';
import { useState, useRef } from 'react';
import { Plus, CheckCircle2, Plug, RotateCcw } from 'lucide-react';
import { useDemoWorkspace } from '@/data-access/demo-workspace';
import { useToast } from '@/components/ui/toaster';
import { Dialog } from '@/components/ui/dialog';
import { fictionalEmail } from '@/features/product/customers';
import { reviews } from '@/data-access/mock-data';
import { initialProduct } from '@/data-access/product-data';
import {
  Panel,
  Badge,
  Field,
  Button,
  PageHeading,
  Picker,
  SampleTable,
  DemoBanner,
  ErrorText,
  MetricCards,
  ActionLink,
  ExportButton,
} from '@/features/product/common';
export function BusinessSettings({
  onboarding = false,
}: {
  onboarding?: boolean;
}) {
  const { product, updateProduct, resetDemo } = useDemoWorkspace();
  const toast = useToast();
  const [business, setBusiness] = useState(product.business);
  const [templates, setTemplates] = useState(product.templates);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [errorScope, setErrorScope] = useState<
    'profile' | 'templates' | 'invite'
  >('profile');
  const [invite, setInvite] = useState(false);
  const inviteLock = useRef(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [role, setRole] = useState('Staff');
  const [reset, setReset] = useState(false);
  const profile = (
    <>
      <Field>
        Business name
        <input
          value={business.name}
          maxLength={60}
          onChange={(event) =>
            setBusiness({ ...business, name: event.target.value })
          }
        />
      </Field>
      <Picker
        label="Business category"
        value={business.category}
        onChange={(category) => setBusiness({ ...business, category })}
        options={['Salon & beauty', 'Wellness', 'Local services']}
      />
      <Field>
        Opening hours
        <input
          value={business.hours}
          maxLength={120}
          onChange={(event) =>
            setBusiness({ ...business, hours: event.target.value })
          }
        />
      </Field>
      <Field>
        Locations, separated by commas
        <input
          value={business.locations}
          maxLength={160}
          onChange={(event) =>
            setBusiness({ ...business, locations: event.target.value })
          }
        />
      </Field>
      <Field>
        Brand accent
        <input
          type="color"
          value={business.branding}
          onChange={(event) =>
            setBusiness({ ...business, branding: event.target.value })
          }
        />
      </Field>
    </>
  );
  function saveBusiness() {
    setErrorScope('profile');
    if (
      !business.name.trim() ||
      !business.hours.trim() ||
      !business.locations.trim()
    ) {
      setError('Complete the business name, opening hours and locations.');
      return false;
    }
    updateProduct({
      business: {
        ...business,
        name: business.name.trim(),
        onboarded: onboarding ? true : business.onboarded,
      },
    });
    setError('');
    toast(
      onboarding
        ? 'Demo business onboarding completed'
        : 'Business profile saved in this demo',
    );
    return true;
  }
  return (
    <>
      <PageHeading
        eyebrow={
          onboarding
            ? 'Set up a fictional business'
            : 'Your workspace, thoughtfully organised'
        }
        title={onboarding ? 'Business onboarding' : 'Business & team settings'}
        text={
          onboarding
            ? 'A short local setup preview. No account is created and no external service is connected.'
            : 'Manage a sample business, team roles, notification preferences and message templates.'
        }
      />
      <DemoBanner>
        Customer contacts and free-text data remain in memory. Only safe
        interface preferences are retained locally. Reset demo data restores the
        sample workspace.
      </DemoBanner>
      {onboarding ? (
        <Panel>
          <div className="builder-progress">
            {['Business', 'Connection preview', 'Finish'].map(
              (label, index) => (
                <span
                  className={step === index + 1 ? 'current' : ''}
                  key={label}
                >
                  {index + 1}. {label}
                </span>
              ),
            )}
          </div>
          {step === 1 ? (
            profile
          ) : step === 2 ? (
            <>
              <h2>Connect when you are ready</h2>
              <p>
                Google, WhatsApp, SMS and email will need real integration work
                later. Explore their setup previews now or continue without a
                connection.
              </p>
              <ActionLink href="/dashboard/integrations">
                Inspect integration setup previews
              </ActionLink>
              <div className="info-note">
                <p>
                  No credentials, tokens or real account access are requested.
                </p>
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 size={32} />
              <h2>{business.name}</h2>
              <p>
                {business.category} · {business.locations}
              </p>
              <p>{business.hours}</p>
              <p>
                You can explore every module using fictional data. Completion
                changes the overview setup checklist.
              </p>
            </>
          )}
          {error && errorScope === 'profile' && <ErrorText>{error}</ErrorText>}
          <div className="product-actions">
            {step > 1 && (
              <Button variant="secondary" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button
                onClick={() => {
                  if (
                    step === 1 &&
                    (!business.name.trim() ||
                      !business.hours.trim() ||
                      !business.locations.trim())
                  )
                    setError(
                      'Complete the business name, opening hours and locations.',
                    );
                  else {
                    setError('');
                    setStep(step + 1);
                  }
                }}
              >
                Continue setup
              </Button>
            ) : (
              <Button
                onClick={() => {
                  if (saveBusiness()) setStep(4);
                }}
                disabled={step === 4}
              >
                Finish demo setup
              </Button>
            )}
          </div>
          {step === 4 && (
            <ActionLink href="/dashboard">Open your demo overview</ActionLink>
          )}
        </Panel>
      ) : (
        <>
          <div className="product-split">
            <Panel>
              <h2>Business profile & branding</h2>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  saveBusiness();
                }}
              >
                {profile}
                {error && errorScope === 'profile' && (
                  <ErrorText>{error}</ErrorText>
                )}
                <Button type="submit">Save business profile</Button>
              </form>
            </Panel>
            <Panel className="product-detail">
              <h2>Notification preferences</h2>
              {(['weekly', 'feedback', 'reminders'] as const).map((key) => (
                <label key={key} className="consent-checkbox">
                  <input
                    type="checkbox"
                    checked={product.notifications[key]}
                    onChange={(event) => {
                      updateProduct({
                        notifications: {
                          ...product.notifications,
                          [key]: event.target.checked,
                        },
                      });
                      toast('Demo notification preference updated', 'info');
                    }}
                  />
                  <span>
                    {
                      {
                        weekly: 'Weekly owner summary',
                        feedback: 'New private feedback',
                        reminders: 'Scheduled reminder previews',
                      }[key]
                    }
                    <small>
                      Preference only. No notifications are delivered.
                    </small>
                  </span>
                </label>
              ))}
              <h3>Integration status</h3>
              {Object.entries(product.connections).map(([name, status]) => (
                <div className="settings-status" key={name}>
                  <span>{name}</span>
                  <Badge mint={status === 'Demo-connected'}>
                    {status} · demo
                  </Badge>
                </div>
              ))}
              <ActionLink href="/dashboard/integrations">
                Manage connection previews
              </ActionLink>
              <h3>Reset demo data</h3>
              <p>
                Restore fictional customers, campaigns, responses and settings.
                This does not change the theme or any files.
              </p>
              <Button variant="secondary" onClick={() => setReset(true)}>
                <RotateCcw size={17} />
                Reset demo data
              </Button>
            </Panel>
          </div>
          <Panel>
            <div className="product-panel-heading">
              <div>
                <h2>Team & roles</h2>
                <p>
                  Invitations and permissions are illustrative; there is no
                  authentication backend.
                </p>
              </div>
              <Button
                onClick={() => {
                  inviteLock.current = false;
                  setInviteName('');
                  setInviteEmail('');
                  setError('');
                  setInvite(true);
                }}
              >
                <Plus size={17} />
                Invite demo teammate
              </Button>
            </div>
            <SampleTable
              caption="Fictional team members"
              headers={['Teammate', 'Contact', 'Role', 'Status']}
              rows={product.team.map((member) => [
                member.name,
                member.email,
                member.role === 'Owner' ? (
                  'Owner'
                ) : (
                  <Picker
                    key="role"
                    label={`Role for ${member.name}`}
                    value={member.role}
                    onChange={(role) => {
                      updateProduct({
                        team: product.team.map((item) =>
                          item.id === member.id ? { ...item, role } : item,
                        ),
                      });
                      toast('Demo role updated');
                    }}
                    options={['Admin', 'Manager', 'Staff', 'Viewer']}
                  />
                ),
                member.status,
              ])}
            />
          </Panel>
          <Panel>
            <h2>Message templates</h2>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setErrorScope('templates');
                if (!templates.request.trim() || !templates.rebooking.trim()) {
                  setError('Both templates need a message.');
                  return;
                }
                updateProduct({ templates });
                setError('');
                toast('Demo message templates saved');
              }}
            >
              <Field>
                Review request template
                <textarea
                  rows={3}
                  value={templates.request}
                  onChange={(event) =>
                    setTemplates({ ...templates, request: event.target.value })
                  }
                />
              </Field>
              <Field>
                Rebooking template
                <textarea
                  rows={3}
                  value={templates.rebooking}
                  onChange={(event) =>
                    setTemplates({
                      ...templates,
                      rebooking: event.target.value,
                    })
                  }
                />
              </Field>
              <p className="field-help">
                Use {'{name}'} and {'{link}'}. Rebooking messages stay separate
                from review requests.
              </p>
              {error && errorScope === 'templates' && (
                <ErrorText>{error}</ErrorText>
              )}
              <Button type="submit">Save message templates</Button>
            </form>
          </Panel>
        </>
      )}
      <Dialog
        open={invite}
        onOpenChange={setInvite}
        title="Invite a demo teammate"
        description="A local invitation record only. No email or real account will be created."
      >
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (inviteLock.current) return;
            setErrorScope('invite');
            if (!inviteName.trim() || !fictionalEmail(inviteEmail)) {
              setError(
                'Enter a fictional name and an example-domain email address.',
              );
              return;
            }
            if (
              product.team.some(
                (member) =>
                  member.email.toLowerCase() === inviteEmail.toLowerCase(),
              )
            ) {
              setError('This fictional email is already on the team.');
              return;
            }
            inviteLock.current = true;
            updateProduct({
              team: [
                ...product.team,
                {
                  id: Date.now(),
                  name: inviteName.trim(),
                  email: inviteEmail.trim(),
                  role,
                  status: 'Invited · demo only',
                },
              ],
            });
            setInvite(false);
            toast('Demo invitation created. No email was sent.');
          }}
        >
          <Field>
            Teammate name
            <input
              value={inviteName}
              onChange={(event) => setInviteName(event.target.value)}
              maxLength={60}
            />
          </Field>
          <Field>
            Teammate email
            <input
              type="email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="sample@example.com"
            />
          </Field>
          <Picker
            label="Invitation role"
            value={role}
            onChange={setRole}
            options={['Admin', 'Manager', 'Staff', 'Viewer']}
          />
          {error && errorScope === 'invite' && <ErrorText>{error}</ErrorText>}
          <Button type="submit">Create demo invitation</Button>
        </form>
      </Dialog>
      <Dialog
        open={reset}
        onOpenChange={setReset}
        title="Reset the demo workspace?"
        description="Restore all fictional data and local interface preferences. Theme preference and project files are preserved."
      >
        <Button variant="secondary" onClick={() => setReset(false)}>
          Keep current demo data
        </Button>
        <Button
          onClick={() => {
            resetDemo();
            setBusiness(initialProduct.business);
            setTemplates(initialProduct.templates);
            setError('');
            setStep(1);
            setReset(false);
            toast('Demo data reset');
          }}
        >
          Confirm reset demo data
        </Button>
      </Dialog>
    </>
  );
}
export function Integrations() {
  const { product, updateProduct } = useDemoWorkspace();
  const toast = useToast();
  const [active, setActive] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [confirmed, setConfirmed] = useState(false);
  function update(name: string, status: string) {
    updateProduct({ connections: { ...product.connections, [name]: status } });
  }
  return (
    <>
      <PageHeading
        eyebrow="Clearly labelled connection previews"
        title="Integrations"
        text="Explore setup and failure states without connecting an account, sending a message or entering credentials."
      />
      <DemoBanner>
        Every connection state here is a demo state. No provider APIs are
        called; real integrations are planned for later implementation.
      </DemoBanner>
      <div className="product-card-grid">
        {['Google', 'WhatsApp', 'SMS', 'Email'].map((name) => (
          <Panel key={name}>
            <Plug size={26} />
            <h2>{name}</h2>
            <Badge mint={product.connections[name] === 'Demo-connected'}>
              {product.connections[name]} · demo
            </Badge>
            <p>
              {name === 'Google'
                ? 'Preview business review access, response permissions and location selection.'
                : `Preview sender identity, recorded permission and ${name.toLowerCase()} message setup.`}
            </p>
            {product.connections[name] === 'Error' && (
              <div role="alert" className="product-message">
                <p>Simulated setup failure. No account was contacted.</p>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setActive(name);
                    setStep(1);
                    setConfirmed(false);
                    update(name, 'Setup preview');
                  }}
                >
                  Retry setup preview
                </Button>
              </div>
            )}
            <div className="product-actions">
              <Button
                variant="secondary"
                onClick={() => {
                  setActive(name);
                  setStep(1);
                  setConfirmed(false);
                  update(name, 'Setup preview');
                }}
              >
                Open {name} setup preview
              </Button>
              {product.connections[name] === 'Demo-connected' && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    update(name, 'Disconnected');
                    toast(`${name} disconnected in this demo`, 'info');
                  }}
                >
                  Disconnect demo
                </Button>
              )}
            </div>
          </Panel>
        ))}
      </div>
      <Dialog
        open={!!active}
        onOpenChange={(open) => {
          if (!open && active) {
            if (product.connections[active] === 'Setup preview')
              update(active, 'Disconnected');
            setActive(null);
          }
        }}
        title={`${active} setup preview`}
        description="No OAuth, API keys, phone numbers or real provider account details are used."
      >
        {step === 1 ? (
          <>
            <h3>1. Review the intended permissions</h3>
            <p>
              {active === 'Google'
                ? 'A future integration would request permission to read business reviews and manage replies for selected locations.'
                : 'A future integration would require a verified sender, consent records and a delivery provider.'}
            </p>
            <label className="consent-checkbox">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
              />
              <span>I understand this is a fictional connection preview.</span>
            </label>
            <Button disabled={!confirmed} onClick={() => setStep(2)}>
              Continue connection preview
            </Button>
          </>
        ) : (
          <>
            <h3>2. Select a mock outcome</h3>
            <p>
              Demo-connected enables previews only. It does not allow real
              publishing or messaging.
            </p>
            <div className="product-actions">
              <Button
                onClick={() => {
                  if (!active) return;
                  update(active, 'Demo-connected');
                  setActive(null);
                  toast('Demo connection recorded. No provider was contacted.');
                }}
              >
                Record demo connection
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  if (!active) return;
                  update(active, 'Error');
                  setActive(null);
                  toast('Simulated connection failure', 'error');
                }}
              >
                Simulate setup error
              </Button>
            </div>
          </>
        )}
      </Dialog>
    </>
  );
}
export function Billing() {
  const { product, updateProduct, customerItems, approved } =
    useDemoWorkspace();
  const toast = useToast();
  const [plan, setPlan] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<string | null>(null);
  return (
    <>
      <PageHeading
        eyebrow="A design preview, without checkout"
        title="Billing & plans"
        text="Compare intended plan groupings and inspect sample usage. All pricing is unapproved."
      />
      <DemoBanner>
        No subscription, charge, invoice payment or checkout is real. Payment
        details are never requested.
      </DemoBanner>
      <MetricCards
        items={[
          {
            label: 'Workspace status',
            value: product.selectedPlan,
            detail: 'Local design selection only',
          },
          {
            label: 'Customer records',
            value: customerItems.length,
            detail: 'Fictional records this session',
          },
          {
            label: 'Campaign previews',
            value: product.campaigns.length,
            detail: 'No billable messages',
          },
          {
            label: 'Reply approvals',
            value: approved.length,
            detail: `${reviews.length} sample reviews`,
          },
        ]}
      />
      <div className="product-card-grid">
        {[
          {
            name: 'Essentials',
            features: [
              'Customer directory',
              'QR pages & feedback',
              'Review request previews',
            ],
          },
          {
            name: 'Growth',
            features: [
              'Campaign and survey builders',
              'Referral and repeat-visit previews',
              'Reports & staff insights',
            ],
          },
          {
            name: 'Multiple locations',
            features: [
              'Location-based report previews',
              'Team role management',
              'Connection setup previews',
            ],
          },
        ].map((item) => (
          <Panel key={item.name}>
            <span className="eyebrow">PLANNED PLAN GROUPING</span>
            <h2>{item.name}</h2>
            <strong className="pricing-placeholder">Pricing coming soon</strong>
            <p>
              Features and limits shown here are placeholders, not approved
              entitlements.
            </p>
            <ul>
              {item.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <Button variant="secondary" onClick={() => setPlan(item.name)}>
              Preview {item.name} plan
            </Button>
          </Panel>
        ))}
      </div>
      <Panel>
        <h2>Invoice-list design</h2>
        <p>Fictional invoice documents. No amount is approved or payable.</p>
        <SampleTable
          caption="Sample invoice layout"
          headers={['Invoice', 'Period', 'Amount', 'Status', 'Details']}
          rows={['DEMO-2026-09', 'DEMO-2026-08'].map((id) => [
            id,
            id.endsWith('09') ? 'September 2026' : 'August 2026',
            'Pricing not approved',
            <Badge key="status">Sample only</Badge>,
            <Button
              key="view"
              variant="secondary"
              size="small"
              onClick={() => setInvoice(id)}
            >
              View sample invoice
            </Button>,
          ])}
        />
      </Panel>
      <Dialog
        open={!!plan}
        onOpenChange={(open) => {
          if (!open) setPlan(null);
        }}
        title={`${plan} plan preview`}
        description="This only updates the local demo selection. No subscription, payment or checkout is created."
      >
        <h3>Pricing coming soon</h3>
        <p>Plan limits and entitlements are placeholders awaiting approval.</p>
        <Button
          onClick={() => {
            if (!plan) return;
            updateProduct({ selectedPlan: `${plan} · design preview` });
            setPlan(null);
            toast('Demo plan selection updated. No subscription was created.');
          }}
        >
          Select this demo plan
        </Button>
      </Dialog>
      <Dialog
        open={!!invoice}
        onOpenChange={(open) => {
          if (!open) setInvoice(null);
        }}
        title="Sample invoice detail"
        description="A genuine downloadable sample document, with no approved price or amount due."
      >
        <h3>{invoice}</h3>
        <p>{product.business.name} · Fictional business</p>
        <SampleTable
          caption="Sample invoice line items"
          headers={['Description', 'Amount']}
          rows={[
            [product.selectedPlan, 'Pricing not approved'],
            ['Total / amount due', 'Not payable · sample only'],
          ]}
        />
        <ExportButton
          filename={`${invoice || 'invoice'}-sample.txt`}
          type="text/plain;charset=utf-8"
          content={() =>
            `REVUPING FICTIONAL INVOICE\n${invoice}\n${product.business.name}\n${product.selectedPlan}\nPricing not approved. No amount due. No payment requested.\nThis is a frontend design sample.`
          }
        />
      </Dialog>
    </>
  );
}

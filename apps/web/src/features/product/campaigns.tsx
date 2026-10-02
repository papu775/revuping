'use client';
import { focusWorkspacePanel } from '@/lib/workspace-focus';
import { useState, useRef } from 'react';
import { CalendarDays, Plus, Pause, Play } from 'lucide-react';
import { useDemoWorkspace } from '@/data-access/demo-workspace';
import { useToast } from '@/components/ui/toaster';
import { Dialog } from '@/components/ui/dialog';
import {
  demoDate,
  profileFor,
  type Campaign,
} from '@/data-access/product-data';
import {
  Panel,
  Badge,
  Field,
  Button,
  PageHeading,
  Picker,
  SearchBox,
  SampleTable,
  DemoBanner,
  ErrorText,
  Link,
  MetricCards,
  Empty,
} from '@/features/product/common';
export function Campaigns({
  kind = 'Review request',
  selectedId,
}: {
  kind?: Campaign['kind'];
  selectedId?: number;
}) {
  const { customerItems, product, updateProduct } = useDemoWorkspace();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All statuses');
  const [selected, setSelected] = useState(
    selectedId ||
      product.campaigns.find((campaign) => campaign.kind === kind)?.id,
  );
  const [builder, setBuilder] = useState(false);
  const createLock = useRef(false);
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [audience, setAudience] = useState(
    kind === 'Repeat visit'
      ? 'Last visit over 30 days'
      : 'All eligible customers',
  );
  const [channel, setChannel] = useState('Email');
  const [message, setMessage] = useState(
    kind === 'Repeat visit'
      ? product.templates.rebooking
      : product.templates.request,
  );
  const [scheduled, setScheduled] = useState('2026-10-03T10:00');
  const [reminder, setReminder] = useState(
    kind === 'Review request' ? '3' : '0',
  );
  const [stop, setStop] = useState(
    kind === 'Repeat visit'
      ? 'Opt-out or rebooking recorded'
      : 'Opt-out or owner confirms completion',
  );
  const [error, setError] = useState('');
  const profiles = (id: number) => product.profiles[id] || profileFor(id);
  const audienceCustomers = customerItems.filter((customer) =>
    audience === 'Regular customers'
      ? profiles(customer.id).tags.includes('Regular')
      : audience === 'Last visit over 30 days'
        ? profiles(customer.id).lastVisit < '2026-09-02'
        : audience === 'Last visit over 60 days'
          ? profiles(customer.id).lastVisit < '2026-08-03'
          : true,
  );
  const eligible = audienceCustomers.filter(
    (customer) => customer.consent && !profiles(customer.id).optedOut,
  );
  const visible = product.campaigns.filter(
    (campaign) =>
      campaign.kind === kind &&
      campaign.name.toLowerCase().includes(query.toLowerCase()) &&
      (status === 'All statuses' || status === campaign.status),
  );
  const active =
    product.campaigns.find(
      (campaign) => campaign.id === selected && campaign.kind === kind,
    ) || visible[0];
  const title =
    kind === 'Repeat visit'
      ? 'Repeat-visit campaigns'
      : kind === 'Reminder'
        ? 'Reminder campaigns'
        : 'Request campaigns';
  const [statusError, setStatusError] = useState('');
  function statusChange(campaign: Campaign, next: Campaign['status']) {
    const customerIds = campaign.customerIds.filter((id) =>
      customerItems.some(
        (customer) =>
          customer.id === id && customer.consent && !profiles(id).optedOut,
      ),
    );
    if ((next === 'Scheduled' || next === 'Completed') && !customerIds.length) {
      setStatusError(
        'No eligible contacts remain. Record consent or create a new audience before retrying.',
      );
      return;
    }
    setStatusError('');
    updateProduct((state) => ({
      ...state,
      campaigns: state.campaigns.map((item) =>
        item.id === campaign.id
          ? {
              ...item,
              status: next,
              customerIds:
                next === 'Scheduled' || next === 'Completed'
                  ? customerIds
                  : item.customerIds,
            }
          : item,
      ),
    }));
    toast(
      `${next === 'Paused' ? 'Campaign paused' : next === 'Completed' ? 'Demo campaign completed' : 'Campaign scheduled in the demo'}. No message was sent.`,
    );
  }
  function validate() {
    if (!name.trim()) return 'Enter a campaign name.';
    if (message.trim().length < 10)
      return 'Write a message with at least 10 characters.';
    if (!eligible.length)
      return 'This audience has no eligible contacts. Choose another audience or record consent.';
    if (!scheduled || scheduled.slice(0, 10) < demoDate)
      return 'Choose a date on or after 2 October 2026 in the demo timeline.';
    return '';
  }
  function create(state: Campaign['status']) {
    if (createLock.current) return;
    const failure = validate();
    if (failure) {
      setError(failure);
      return;
    }
    createLock.current = true;
    const id = Date.now();
    updateProduct((product) => ({
      ...product,
      campaigns: [
        ...product.campaigns,
        {
          id,
          name: name.trim(),
          kind,
          status: state,
          audience,
          channel,
          message: message.trim(),
          scheduled,
          reminderDays: Number(reminder),
          stop,
          customerIds: eligible.map((customer) => customer.id),
          created: demoDate,
        },
      ],
    }));
    setSelected(id);
    setBuilder(false);
    toast('Demo campaign created. No message was sent.');
  }
  return (
    <>
      <PageHeading
        eyebrow={
          kind === 'Repeat visit'
            ? 'Customer retention'
            : 'Consent-based campaigns'
        }
        title={title}
        text={
          kind === 'Repeat visit'
            ? 'A separate space for rebooking conversations, without asking for a review.'
            : 'Build a request or reminder preview for customers with recorded permission.'
        }
      >
        <Button
          onClick={() => {
            createLock.current = false;
            setStep(1);
            setName('');
            setError('');
            setBuilder(true);
          }}
        >
          <Plus size={17} />
          Create{' '}
          {kind === 'Repeat visit'
            ? 'rebooking'
            : kind === 'Reminder'
              ? 'reminder'
              : 'request'}{' '}
          campaign
        </Button>
      </PageHeading>
      <DemoBanner>
        Schedules and results are local previews. Nothing runs in the background
        or sends a WhatsApp, SMS or email message. Demo timeline: 2 October
        2026.
      </DemoBanner>
      <MetricCards
        items={[
          {
            label: 'Campaigns',
            value: product.campaigns.filter(
              (campaign) => campaign.kind === kind,
            ).length,
            detail: 'Created in this demo',
          },
          {
            label: 'Eligible contacts',
            value: customerItems.filter(
              (customer) => customer.consent && !profiles(customer.id).optedOut,
            ).length,
            detail: 'Permission recorded; opt-outs excluded',
          },
          {
            label: 'Scheduled previews',
            value: product.campaigns.filter(
              (campaign) =>
                campaign.kind === kind && campaign.status === 'Scheduled',
            ).length,
            detail: 'No automatic execution',
          },
        ]}
      />
      {kind === 'Repeat visit' && (
        <Panel>
          <h2>Customers due for a visit</h2>
          <Picker
            label="Last-visit audience"
            value={audience}
            onChange={setAudience}
            options={[
              'Last visit over 30 days',
              'Last visit over 60 days',
              'All eligible customers',
            ]}
          />
          <SampleTable
            caption="Fictional rebooking audience"
            headers={['Customer', 'Last visit', 'Service', 'Eligibility']}
            rows={audienceCustomers.map((customer) => [
              customer.name,
              profiles(customer.id).lastVisit,
              profiles(customer.id).service,
              customer.consent && !profiles(customer.id).optedOut
                ? 'Eligible'
                : 'No messaging permission',
            ])}
          />
        </Panel>
      )}
      <div className="product-filter-row">
        <SearchBox label="Search campaigns" value={query} onChange={setQuery} />
        <Picker
          label="Campaign status"
          value={status}
          onChange={setStatus}
          options={[
            'All statuses',
            'Draft',
            'Scheduled',
            'Paused',
            'Completed',
          ]}
        />
      </div>
      <div className="product-split">
        <Panel>
          <h2>Your campaigns</h2>
          <SampleTable
            caption={`${title} · fictional data`}
            headers={['Campaign', 'Channel', 'Status', 'Open']}
            rows={visible.map((campaign) => [
              <div key="name">
                <strong>{campaign.name}</strong>
                <small>
                  {campaign.customerIds.length} selected contacts ·{' '}
                  {campaign.scheduled.replace('T', ' ')}
                </small>
              </div>,
              campaign.channel,
              <Badge key="status" mint={campaign.status === 'Scheduled'}>
                {campaign.status}
              </Badge>,
              <Button
                key="open"
                variant="secondary"
                size="small"
                onClick={() => {
                  setSelected(campaign.id);
                  setStatusError('');
                  focusWorkspacePanel('campaigns-detail');
                }}
              >
                View campaign
              </Button>,
            ])}
          />
        </Panel>
        <Panel
          className="product-detail"
          id="campaigns-detail"
          tabIndex={-1}
          aria-label="Campaign details"
        >
          {active ? (
            <>
              <span className="eyebrow">CAMPAIGN PREVIEW</span>
              {statusError && <ErrorText>{statusError}</ErrorText>}
              <h2>{active.name}</h2>
              <Badge mint={active.status === 'Scheduled'}>
                {active.status}
              </Badge>
              <dl className="product-facts">
                <div>
                  <dt>Channel</dt>
                  <dd>{active.channel} · demo only</dd>
                </div>
                <div>
                  <dt>Scheduled for</dt>
                  <dd>{active.scheduled.replace('T', ' ')}</dd>
                </div>
                <div>
                  <dt>Audience</dt>
                  <dd>{active.audience}</dd>
                </div>
                <div>
                  <dt>Reminder interval</dt>
                  <dd>
                    {active.reminderDays
                      ? `${active.reminderDays} days`
                      : 'No automatic reminder'}
                  </dd>
                </div>
                <div>
                  <dt>Stop condition</dt>
                  <dd>{active.stop}</dd>
                </div>
              </dl>
              <div className="product-message">
                <strong>Customer message preview</strong>
                <p>
                  {active.message
                    .replaceAll(
                      '{name}',
                      customerItems
                        .find((customer) =>
                          active.customerIds.includes(customer.id),
                        )
                        ?.name.split(' ')[0] || 'Sample customer',
                    )
                    .replaceAll(
                      '{link}',
                      kind === 'Repeat visit'
                        ? '[sample booking destination]'
                        : '/r/demo-salon',
                    )}
                </p>
                <small>
                  No message was sent. A click never confirms a Google review.
                </small>
              </div>
              <div className="product-actions">
                {active.status !== 'Completed' && (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      statusChange(
                        active,
                        active.status === 'Paused' || active.status === 'Draft'
                          ? 'Scheduled'
                          : 'Paused',
                      )
                    }
                  >
                    {active.status === 'Paused' || active.status === 'Draft' ? (
                      <Play size={16} />
                    ) : (
                      <Pause size={16} />
                    )}
                    {active.status === 'Paused'
                      ? 'Resume demo campaign'
                      : active.status === 'Draft'
                        ? 'Schedule demo draft'
                        : 'Pause campaign'}
                  </Button>
                )}
                {active.status === 'Scheduled' && (
                  <Button
                    variant="ghost"
                    onClick={() => statusChange(active, 'Completed')}
                  >
                    Complete local preview
                  </Button>
                )}
              </div>
              <h3>Illustrative results</h3>
              <p className="field-help">
                Fixed sample results for a completed preview, not measured
                customer activity.
              </p>
              <MetricCards
                items={
                  kind === 'Repeat visit'
                    ? [
                        {
                          label: 'Rebooking invitations',
                          value:
                            active.status === 'Completed'
                              ? active.customerIds.length
                              : 0,
                        },
                        {
                          label: 'Sample booking interest',
                          value:
                            active.status === 'Completed'
                              ? Math.floor(active.customerIds.length / 2)
                              : 0,
                        },
                      ]
                    : [
                        {
                          label: 'Request previews',
                          value:
                            active.status === 'Completed'
                              ? active.customerIds.length
                              : 0,
                        },
                        {
                          label: 'Sample link clicks',
                          value:
                            active.status === 'Completed'
                              ? Math.floor(active.customerIds.length / 2)
                              : 0,
                        },
                        {
                          label: 'Confirmed review data',
                          value: 'Not connected',
                          detail: 'Requires a future real integration',
                        },
                      ]
                }
              />
            </>
          ) : (
            <Empty title="No campaign selected">
              Create a campaign or choose another filter.
            </Empty>
          )}
        </Panel>
      </div>
      <Dialog
        open={builder}
        onOpenChange={setBuilder}
        title={`${kind} campaign builder`}
        description="Create a local demo schedule. No messages will be sent."
      >
        <div className="builder-progress" aria-label={`Step ${step} of 3`}>
          {['Audience', 'Message & schedule', 'Confirm'].map((label, index) => (
            <span className={step === index + 1 ? 'current' : ''} key={label}>
              {index + 1}. {label}
            </span>
          ))}
        </div>
        {step === 1 && (
          <>
            <Field>
              Campaign name
              <input
                value={name}
                maxLength={80}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <Picker
              label="Campaign audience"
              value={audience}
              onChange={setAudience}
              options={
                kind === 'Repeat visit'
                  ? [
                      'Last visit over 30 days',
                      'Last visit over 60 days',
                      'All eligible customers',
                    ]
                  : ['All eligible customers', 'Regular customers']
              }
            />
            <Picker
              label="Message channel"
              value={channel}
              onChange={setChannel}
              options={['WhatsApp', 'SMS', 'Email']}
            />
            <div className="info-note">
              <p>
                {eligible.length} eligible of {audienceCustomers.length}{' '}
                selected contacts. {audienceCustomers.length - eligible.length}{' '}
                excluded for missing consent or opt-out.
              </p>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <Field>
              Message template
              <textarea
                rows={5}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </Field>
            <p className="field-help">
              Use {'{name}'} and {'{link}'} placeholders.{' '}
              {kind === 'Repeat visit'
                ? 'This template is for booking a visit, not requesting a review.'
                : 'Customers can choose an honest Google review or private feedback at any rating.'}
            </p>
            <div className="product-message">
              <strong>For {eligible[0]?.name || 'a sample customer'}</strong>
              <p>
                {message
                  .replaceAll(
                    '{name}',
                    eligible[0]?.name.split(' ')[0] || 'Customer',
                  )
                  .replaceAll(
                    '{link}',
                    kind === 'Repeat visit'
                      ? '[sample booking destination]'
                      : '/r/demo-salon',
                  )}
              </p>
            </div>
            <Field>
              Schedule preview
              <input
                type="datetime-local"
                value={scheduled}
                min="2026-10-02T00:00"
                onChange={(event) => setScheduled(event.target.value)}
              />
            </Field>
            <Picker
              label="Reminder interval"
              value={reminder}
              onChange={setReminder}
              options={['0', '3', '7']}
            />
            <Picker
              label="Stop reminders when"
              value={stop}
              onChange={setStop}
              options={
                kind === 'Repeat visit'
                  ? [
                      'Opt-out or rebooking recorded',
                      'Opt-out or owner stops campaign',
                    ]
                  : [
                      'Opt-out or owner confirms completion',
                      'Opt-out or owner stops campaign',
                    ]
              }
            />
            <p className="field-help">
              Review-link clicks are not proof that a review was submitted.
            </p>
          </>
        )}
        {step === 3 && (
          <>
            <h3>{name}</h3>
            <p>
              {eligible.length} eligible customers · {channel} ·{' '}
              {scheduled.replace('T', ' ')}
            </p>
            <div className="product-message">
              <p>{message}</p>
            </div>
            <p>
              This creates a fictional schedule only. No message will be sent
              and no reminder will run automatically.
            </p>
          </>
        )}
        {error && <ErrorText>{error}</ErrorText>}
        <div className="product-actions">
          {step > 1 && (
            <Button
              variant="secondary"
              onClick={() => {
                setStep(step - 1);
                setError('');
              }}
            >
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button
              onClick={() => {
                const failure =
                  step === 1
                    ? !name.trim()
                      ? 'Enter a campaign name.'
                      : !eligible.length
                        ? 'No eligible contacts in this audience.'
                        : ''
                    : validate();
                if (failure) setError(failure);
                else {
                  setError('');
                  setStep(step + 1);
                }
              }}
            >
              Continue
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => create('Draft')}>
                Save local draft
              </Button>
              <Button onClick={() => create('Scheduled')}>
                <CalendarDays size={17} />
                Confirm demo schedule
              </Button>
            </>
          )}
        </div>
      </Dialog>
    </>
  );
}
export function Referrals() {
  const { product, updateProduct } = useDemoWorkspace();
  const toast = useToast();
  const [form, setForm] = useState(product.referral);
  const [error, setError] = useState('');
  return (
    <>
      <PageHeading
        eyebrow="An invitation, without review incentives"
        title="Referral campaigns"
        text="Preview a programme that lets customers invite a friend. Participation never depends on a rating or review."
      />
      <DemoBanner>
        Sample links open a local referral landing page. No rewards, tracking
        services or messages are live.
      </DemoBanner>
      <div className="product-split">
        <Panel>
          <h2>Programme setup</h2>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (
                !form.name.trim() ||
                !form.terms.trim() ||
                !form.eligibility.trim() ||
                form.message.trim().length < 10
              ) {
                setError(
                  'Complete the programme name, share message, terms and eligibility.',
                );
                return;
              }
              updateProduct({ referral: form });
              setError('');
              toast('Referral programme saved in this demo');
            }}
          >
            <Field>
              Programme name
              <input
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                maxLength={80}
              />
            </Field>
            <Field>
              Share message
              <textarea
                rows={4}
                value={form.message}
                onChange={(event) =>
                  setForm({ ...form, message: event.target.value })
                }
              />
            </Field>
            <Field>
              Terms
              <textarea
                rows={3}
                value={form.terms}
                onChange={(event) =>
                  setForm({ ...form, terms: event.target.value })
                }
              />
            </Field>
            <Field>
              Eligibility
              <textarea
                rows={3}
                value={form.eligibility}
                onChange={(event) =>
                  setForm({ ...form, eligibility: event.target.value })
                }
              />
            </Field>
            {error && <ErrorText>{error}</ErrorText>}
            <Button type="submit">Save referral programme</Button>
          </form>
        </Panel>
        <Panel className="product-detail">
          <h2>Referral link preview</h2>
          <Badge mint={!product.referral.paused}>
            {product.referral.paused ? 'Paused · demo' : 'Active · demo'}
          </Badge>
          <div className="product-message">
            <strong>{form.name}</strong>
            <p>{form.message.replaceAll('{link}', '/refer/demo-salon')}</p>
            <code>/refer/demo-salon</code>
          </div>
          <div className="product-actions">
            <Button asChild variant="secondary">
              <Link href="/refer/demo-salon">Open public referral preview</Link>
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                const paused = !product.referral.paused;
                updateProduct({ referral: { ...product.referral, paused } });
                setForm({ ...form, paused });
                toast(
                  paused
                    ? 'Demo referral programme paused'
                    : 'Demo referral programme resumed',
                );
              }}
            >
              {product.referral.paused ? 'Resume programme' : 'Pause programme'}
            </Button>
          </div>
          <h3>Sample referral activity</h3>
          <SampleTable
            caption="Fictional activity, not tracked events"
            headers={['Visitor', 'Activity', 'Date']}
            rows={product.referralActivity.map((item) => [
              item.name,
              item.status,
              item.date,
            ])}
          />
          <p className="field-help">
            A link opened is not a booking. No referral reward is associated
            with Google reviews.
          </p>
        </Panel>
      </div>
    </>
  );
}

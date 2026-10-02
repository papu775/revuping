'use client';
import { focusWorkspacePanel } from '../../lib/workspace-focus';
import { useState, useRef } from 'react';
import { withDeadline } from '../../lib/async-actions';
import { InlineSpinner } from '../ui/loading';
import { Plus, Upload, Pencil, UserRound } from 'lucide-react';
import { useDemoWorkspace } from '../demo-workspace';
import { useToast } from '../ui/toaster';
import { Dialog } from '../ui/dialog';
import { Avatar } from '../ui/avatar';
import { type Customer } from '../../lib/mock-data';
import {
  profileFor,
  demoDate,
  type CustomerProfile,
} from '../../lib/product-data';
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
  ActionLink,
} from './common';
const blankProfile: CustomerProfile = {
  tags: [],
  source: 'In-salon permission · fictional',
  consentDate: demoDate,
  lastVisit: demoDate,
  staff: 'Sophie',
  service: 'Colour',
  optedOut: false,
};
export const fictionalEmail = (email: string) =>
  /^[^\s@]+@example\.(com|org|net)$/i.test(email.trim());
function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = '',
    quote = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (char === '"') {
      if (quote && text[index + 1] === '"') {
        cell += '"';
        index++;
      } else quote = !quote;
    } else if ((char === ',' || char === '\n') && !quote) {
      row.push(cell.trim());
      cell = '';
      if (char === '\n') {
        if (row.some(Boolean)) rows.push(row);
        row = [];
      }
    } else if (char !== '\r') cell += char;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  if (quote) throw new Error('A quoted field was not closed.');
  return rows;
}
export function CustomerDirectory({ selectedId }: { selectedId?: number }) {
  const {
    customerItems,
    setCustomerItems,
    feedbackItems,
    product,
    updateProduct,
  } = useDemoWorkspace();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All customers');
  const [tag, setTag] = useState('All tags');
  const [selected, setSelected] = useState(selectedId || customerItems[0]?.id);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [dialog, setDialog] = useState(false);
  const saveLock = useRef(false);
  const importLock = useRef(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [consent, setConsent] = useState(false);
  const [profile, setProfile] = useState<CustomerProfile>(blankProfile);
  const [error, setError] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [csv, setCsv] = useState(
    'name,email,consent,tags\nSample Taylor,taylor@example.com,yes,New customer\nSample Avery,not-an-email,no,New customer',
  );
  const [importError, setImportError] = useState('');
  const [preview, setPreview] = useState<
    {
      name: string;
      email: string;
      consent: boolean;
      tags: string[];
      error: string;
    }[]
  >([]);
  const [reading, setReading] = useState(false);
  const getProfile = (id: number) => product.profiles[id] || profileFor(id);
  const visible = customerItems.filter((customer) => {
    const p = getProfile(customer.id);
    return (
      `${customer.name} ${customer.email} ${p.tags.join(' ')}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === 'All customers' ||
        (filter === 'Eligible'
          ? customer.consent && !p.optedOut
          : filter === 'Opted out'
            ? p.optedOut
            : !customer.consent)) &&
      (tag === 'All tags' || p.tags.includes(tag))
    );
  });
  const active =
    visible.find((customer) => customer.id === selected) || visible[0];
  function edit(customer?: Customer) {
    saveLock.current = false;
    setEditing(customer || null);
    setName(customer?.name || '');
    setEmail(customer?.email || '');
    setConsent(customer?.consent || false);
    setTagsText(customer ? getProfile(customer.id).tags.join(', ') : '');
    setProfile(customer ? getProfile(customer.id) : { ...blankProfile });
    setError('');
    setDialog(true);
  }
  function previewImport() {
    try {
      const rows = parseCsv(csv.replace(/^\uFEFF/, ''));
      const headers = rows.shift()?.map((value) => value.toLowerCase()) || [];
      if (
        !['name', 'email', 'consent'].every((column) =>
          headers.includes(column),
        )
      )
        throw new Error(
          'Required columns: name, email, consent. Optional: tags.',
        );
      if (!rows.length) throw new Error('Add at least one fictional customer.');
      if (rows.length > 100)
        throw new Error('The demo accepts at most 100 rows per preview.');
      const emails = new Set(
        customerItems.map((customer) => customer.email.toLowerCase()),
      );
      setPreview(
        rows.map((row) => {
          const value = (key: string) => row[headers.indexOf(key)] || '';
          const name = value('name'),
            email = value('email').toLowerCase(),
            consent = value('consent').toLowerCase();
          let error = !name.trim()
            ? 'Name is required'
            : !fictionalEmail(email)
              ? 'Use an @example.com, .org or .net contact'
              : !['yes', 'no'].includes(consent)
                ? 'Consent must be yes or no'
                : emails.has(email)
                  ? 'Duplicate email'
                  : '';
          emails.add(email);
          if (name.length > 60) error = 'Name must be 60 characters or fewer';
          return {
            name,
            email,
            consent: consent === 'yes',
            tags: value('tags')
              .split(';')
              .map((tag) => tag.trim())
              .filter(Boolean),
            error,
          };
        }),
      );
      setImportError('');
    } catch (error) {
      setPreview([]);
      setImportError(
        error instanceof Error
          ? error.message
          : 'CSV could not be read. Try the sample CSV.',
      );
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="Customers & consent"
        title="Customer directory"
        text="Keep fictional visits, preferences and consent in one place."
      >
        <Button onClick={() => edit()}>
          <Plus size={17} />
          Add customer
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            importLock.current = false;
            setImportOpen(true);
          }}
        >
          <Upload size={17} />
          Import CSV preview
        </Button>
      </PageHeading>
      <DemoBanner>
        Use fictional example-domain contacts only. Customer changes are shared
        with request and campaign screens in this session.
      </DemoBanner>
      <div className="product-filter-row">
        <SearchBox label="Search customers" value={query} onChange={setQuery} />
        <Picker
          label="Consent filter"
          value={filter}
          onChange={setFilter}
          options={['All customers', 'Eligible', 'No consent', 'Opted out']}
        />
        <Picker
          label="Customer tag"
          value={tag}
          onChange={setTag}
          options={[
            'All tags',
            ...new Set(
              customerItems.flatMap((customer) => getProfile(customer.id).tags),
            ),
          ]}
        />
      </div>
      <div className="product-split">
        <Panel>
          <h2>
            Customers <span className="muted">({visible.length})</span>
          </h2>
          <SampleTable
            caption="Fictional customer directory"
            headers={['Customer', 'Consent', 'Last visit', 'Details']}
            rows={visible.map((customer) => {
              const p = getProfile(customer.id);
              return [
                <div key="name" className="product-person">
                  <Avatar initials={customer.name.slice(0, 2).toUpperCase()} />
                  <div>
                    <strong>{customer.name}</strong>
                    <small>{customer.email}</small>
                    <span className="tag-list">
                      {p.tags.map((tag) => (
                        <Badge key={tag}>{tag}</Badge>
                      ))}
                    </span>
                  </div>
                </div>,
                <Badge key="consent" mint={customer.consent && !p.optedOut}>
                  {p.optedOut
                    ? 'Opted out'
                    : customer.consent
                      ? 'Recorded'
                      : 'Not recorded'}
                </Badge>,
                p.lastVisit,
                <Button
                  key="open"
                  size="small"
                  variant="secondary"
                  aria-pressed={active?.id === customer.id}
                  onClick={() => { setSelected(customer.id); focusWorkspacePanel('customers-detail'); }}
                >
                  View {customer.name.split(' ')[0]}
                </Button>,
              ];
            })}
          />
        </Panel>
        <Panel className="product-detail" id="customers-detail" tabIndex={-1} aria-label="Customer details">
          {active ? (
            (() => {
              const p = getProfile(active.id);
              return (
                <>
                  <div className="product-panel-heading">
                    <div>
                      <span className="eyebrow">CUSTOMER DETAILS</span>
                      <h2>{active.name}</h2>
                      <Badge mint={active.consent && !p.optedOut}>
                        {p.optedOut
                          ? 'Opted out'
                          : active.consent
                            ? 'Consent recorded'
                            : 'No consent recorded'}
                      </Badge>
                      <p>{active.email}</p>
                    </div>
                    <UserRound size={25} />
                  </div>
                  <dl className="product-facts">
                    <div>
                      <dt>Last visit</dt>
                      <dd>{p.lastVisit}</dd>
                    </div>
                    <div>
                      <dt>Staff / service</dt>
                      <dd>
                        {p.staff} · {p.service}
                      </dd>
                    </div>
                    <div>
                      <dt>Consent source</dt>
                      <dd>
                        {active.consent ? p.source : 'No consent recorded'}
                      </dd>
                    </div>
                    <div>
                      <dt>Recorded date</dt>
                      <dd>
                        {active.consent
                          ? p.consentDate || 'Not specified'
                          : '—'}
                      </dd>
                    </div>
                  </dl>
                  <div className="product-actions">
                    <Button variant="secondary" onClick={() => edit(active)}>
                      <Pencil size={16} />
                      Edit customer
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        const next = !p.optedOut;
                        updateProduct((state) => ({
                          ...state,
                          profiles: {
                            ...state.profiles,
                            [active.id]: { ...p, optedOut: next },
                          },
                        }));
                        setCustomerItems((items) =>
                          items.map((customer) =>
                            customer.id === active.id
                              ? {
                                  ...customer,
                                  consent: next ? false : customer.consent,
                                  status: next ? 'Opted out' : 'No consent',
                                }
                              : customer,
                          ),
                        );
                        toast(
                          next
                            ? 'Customer opted out in this demo'
                            : 'Opt-out cleared. Consent must be recorded again.',
                          'info',
                        );
                      }}
                    >
                      {p.optedOut ? 'Clear opt-out' : 'Record opt-out'}
                    </Button>
                  </div>
                  <h3>Customer timeline</h3>
                  <ol className="product-timeline">
                    <li>
                      <strong>Visit · {p.lastVisit}</strong>
                      <p>
                        {p.service} with {p.staff} · fictional
                      </p>
                    </li>
                    {feedbackItems
                      .filter((feedback) => feedback.name === active.name)
                      .map((feedback) => (
                        <li key={feedback.id}>
                          <strong>Private feedback · {feedback.date}</strong>
                          <p>{feedback.text}</p>
                          <ActionLink
                            href={`/dashboard/feedback?item=${feedback.id}`}
                          >
                            Open feedback
                          </ActionLink>
                        </li>
                      ))}
                    {product.campaigns
                      .filter((campaign) =>
                        campaign.customerIds.includes(active.id),
                      )
                      .map((campaign) => (
                        <li key={campaign.id}>
                          <strong>{campaign.name}</strong>
                          <p>
                            {campaign.status} · {campaign.channel} · no message
                            sent
                          </p>
                          <ActionLink
                            href={`/dashboard/${campaign.kind === 'Repeat visit' ? 'repeat-visits' : campaign.kind === 'Reminder' ? 'reminders' : 'campaigns'}?item=${campaign.id}`}
                          >
                            Open campaign
                          </ActionLink>
                        </li>
                      ))}
                    {active.status.includes('demo') && (
                      <li>
                        <strong>Mock request activity</strong>
                        <p>{active.status} · no message was sent.</p>
                      </li>
                    )}
                  </ol>
                </>
              );
            })()
          ) : (
            <p>Select a customer to view visits and activity.</p>
          )}
        </Panel>
      </div>
      <Dialog
        open={dialog}
        onOpenChange={setDialog}
        title={editing ? 'Edit demo customer' : 'Add demo customer'}
        description="Use fictional example-domain contact information. No data is transmitted."
      >
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (saveLock.current) return;
            if (!name.trim() || name.length > 60 || !fictionalEmail(email)) {
              setError(
                !name.trim()
                  ? 'Enter a name.'
                  : name.length > 60
                    ? 'Use at most 60 characters.'
                    : 'Use a fictional email ending in @example.com, @example.org or @example.net.',
              );
              return;
            }
            if (consent && (!profile.source.trim() || !profile.consentDate)) {
              setError('Record the consent source and date.');
              return;
            }
            if (
              customerItems.some(
                (item) =>
                  item.id !== editing?.id &&
                  item.email.toLowerCase() === email.trim().toLowerCase(),
              )
            ) {
              setError('This fictional email is already in the directory.');
              return;
            }
            if (
              profile.lastVisit > demoDate ||
              (consent && profile.consentDate > demoDate)
            ) {
              setError(
                'Choose a visit and consent date on or before the demo date, 2 October 2026.',
              );
              return;
            }
            saveLock.current = true;
            const id = editing?.id || Date.now();
            const customer = {
              id,
              name: name.trim(),
              email: email.trim(),
              consent: consent && !profile.optedOut,
              status: profile.optedOut
                ? 'Opted out'
                : editing?.status || (consent ? 'Ready to send' : 'No consent'),
            };
            setCustomerItems((items) =>
              editing
                ? items.map((item) => (item.id === id ? customer : item))
                : [...items, customer],
            );
            updateProduct((state) => ({
              ...state,
              profiles: {
                ...state.profiles,
                [id]: {
                  ...profile,
                  tags: tagsText
                    .split(',')
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                },
              },
            }));
            setSelected(id);
            setDialog(false);
            toast(editing ? 'Demo customer updated' : 'Demo customer added');
          }}
        >
          <Field>
            Full name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={60}
              required
            />
          </Field>
          <Field>
            Email address
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="sample@example.com"
              required
              aria-invalid={!!error && !fictionalEmail(email)}
            />
          </Field>
          {error && <ErrorText>{error}</ErrorText>}
          <Field>
            Tags, separated by commas
            <input
              value={tagsText}
              maxLength={120}
              onChange={(event) => setTagsText(event.target.value)}
            />
          </Field>
          <div className="product-form-grid">
            <Picker
              label="Associated staff"
              value={profile.staff}
              onChange={(staff) => setProfile({ ...profile, staff })}
              options={['Alex', 'Mia', 'Sophie']}
            />
            <Picker
              label="Service"
              value={profile.service}
              onChange={(service) => setProfile({ ...profile, service })}
              options={['Colour', 'Cut & finish', 'Treatments']}
            />
            <Field>
              Last visit
              <input
                type="date"
                value={profile.lastVisit}
                onChange={(event) =>
                  setProfile({ ...profile, lastVisit: event.target.value })
                }
                max={demoDate}
              />
            </Field>
            <Field>
              Consent recorded date
              <input
                type="date"
                value={profile.consentDate}
                onChange={(event) =>
                  setProfile({ ...profile, consentDate: event.target.value })
                }
                max={demoDate}
              />
            </Field>
          </div>
          <Field>
            Consent source
            <input
              value={profile.source}
              onChange={(event) =>
                setProfile({ ...profile, source: event.target.value })
              }
            />
          </Field>
          <label className="consent-checkbox">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => {
                setConsent(event.target.checked);
                if (event.target.checked)
                  setProfile({ ...profile, optedOut: false });
              }}
            />
            <span>
              Permission to receive messages is recorded for this fictional
              contact.
            </span>
          </label>
          <Button type="submit">Save demo customer</Button>
        </form>
      </Dialog>
      <Dialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="CSV import preview"
        description="Local parsing only. Required columns: name, email, consent. Consent values: yes or no."
      >
        <Field>
          Choose a local CSV file
          <input
            type="file"
            accept=".csv,text/csv"
            aria-busy={reading}
            disabled={reading}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (file.size > 100000) {
                setImportError('Choose a CSV smaller than 100 KB.');
                return;
              }
              setReading(true);
              try {
                setCsv(await withDeadline(file.text()));
                setPreview([]);
                setImportError('');
              } catch {
                setImportError(
                  'The file could not be read. Choose it again or edit the sample below.',
                );
              } finally {
                setReading(false);
              }
            }}
          />
        </Field>
        {reading && (
          <p role="status" aria-busy="true" className="flex items-center gap-2">
            <InlineSpinner />
            Reading local CSV…
          </p>
        )}
        <Field>
          CSV content
          <textarea
            rows={5}
            value={csv}
            onChange={(event) => {
              setCsv(event.target.value);
              setPreview([]);
            }}
          />
        </Field>
        {importError && <ErrorText>{importError}</ErrorText>}
        <Button variant="secondary" onClick={previewImport} disabled={reading}>
          Validate CSV preview
        </Button>
        {!!preview.length && (
          <>
            <SampleTable
              caption="CSV validation results · local demo only"
              headers={['Name', 'Email', 'Validation']}
              rows={preview.map((row) => [
                row.name,
                row.email,
                row.error || 'Ready to import',
              ])}
            />
            <Button
              disabled={preview.some((row) => !!row.error)}
              onClick={() => {
                if (importLock.current) return;
                importLock.current = true;
                const start = Date.now();
                setCustomerItems((items) => [
                  ...items,
                  ...preview.map((row, index) => ({
                    id: start + index,
                    name: row.name,
                    email: row.email,
                    consent: row.consent,
                    status: row.consent ? 'Ready to send' : 'No consent',
                  })),
                ]);
                updateProduct((state) => ({
                  ...state,
                  profiles: {
                    ...state.profiles,
                    ...Object.fromEntries(
                      preview.map((row, index) => [
                        start + index,
                        {
                          ...blankProfile,
                          tags: row.tags,
                          source: 'CSV permission declaration · demo',
                          consentDate: row.consent ? demoDate : '',
                        },
                      ]),
                    ),
                  },
                }));
                setImportOpen(false);
                setPreview([]);
                toast('Fictional CSV customers imported locally');
              }}
            >
              Import validated demo rows
            </Button>
          </>
        )}
      </Dialog>
    </>
  );
}

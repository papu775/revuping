'use client';
import Link from 'next/link';
import { useState, useCallback } from 'react';
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Check,
  QrCode as QrIcon,
  MessageSquare,
  Send,
  Star,
  Download,
  Search,
  Sparkles,
  Leaf,
  CheckCircle2,
  Users,
  Clock3,
  SlidersHorizontal,
} from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import { Button } from './ui/button';
import { Dialog } from './ui/dialog';
import { Badge, Stars, TextLink } from './shared';
import { QrCode } from './qr-code';
import { focusWorkspacePanel } from '../lib/workspace-focus';
import {
  feedback as initialFeedback,
  customers as initialCustomers,
  reviews,
  type Customer,
  overviewMetrics,
  sampleTrend,
  sampleRequestText,
} from '../lib/mock-data';
export function PageHeading({
  eyebrow,
  title,
  text,
  children,
}: {
  eyebrow: string;
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      {children}
    </div>
  );
}
export function Overview() {
  const [checks, setChecks] = useState([true, true, false, false]);
  return (
    <>
      <PageHeading
        eyebrow="BLOOM & CO. · DEMO WORKSPACE"
        title="Business overview"
        text="Track customer activity, follow up on feedback, and manage review requests."
      >
        <Button asChild>
          <Link href="/dashboard/requests">
            <Plus size={17} /> Send a request
          </Link>
        </Button>
      </PageHeading>
      <div className="overview-welcome">
        <div>
          <span className="welcome-icon">
            <Sparkles size={23} />
          </span>
          <div>
            <strong>3 feedback responses need attention</strong>
            <p>Review recent comments and decide what to follow up on.</p>
          </div>
        </div>
        <TextLink href="/dashboard/feedback">Open your inbox</TextLink>
      </div>
      <div className="metric-grid">
        {overviewMetrics.map((m) => (
          <div className="metric" key={m.label}>
            <div>
              {m.label}
              {(() => {
                const Icon = { QrIcon, ArrowUpRight, MessageSquare, Star }[
                  m.icon
                ];
                return <Icon size={18} />;
              })()}
            </div>
            <strong>{m.value}</strong>
            <span>{m.change}</span>
            <small>{m.desc}</small>
          </div>
        ))}
      </div>
      <div className="dashboard-two-col">
        <section className="panel trend-panel">
          <div className="panel-heading">
            <div>
              <h2>Customer activity</h2>
              <p>Customer activity · sample last 7 days</p>
            </div>
            <Badge>This week</Badge>
          </div>
          <div className="chart-legend">
            <span>
              <i className="violet-dot" /> QR scans
            </span>
            <span>
              <i className="mint-dot" /> Private feedback
            </span>
          </div>
          <div
            className="trend-chart"
            role="img"
            aria-label="Sample QR scans from Saturday to Friday: 18, 22, 15, 28, 32, 27, 42. Feedback: 3, 5, 2, 6, 8, 5, 9."
          >
            <div className="chart-axis">
              <span>50</span>
              <span>25</span>
              <span>0</span>
            </div>
            <div className="chart-bars">
              {sampleTrend.scans.map((n, i) => (
                <div key={i} className="bar-group">
                  <div className="bar-pair">
                    <i style={{ height: `${n * 2}%` }} />
                    <i style={{ height: `${sampleTrend.feedback[i] * 2}%` }} />
                  </div>
                  <span>{sampleTrend.days[i]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-note">
            <ArrowUpRight size={15} /> A scan is a visit. A click is interest.
            Neither confirms a review.
          </div>
        </section>
        <section className="panel setup-panel">
          <div className="panel-heading">
            <div>
              <h2>Complete your setup</h2>
              <p>Your salon setup checklist</p>
            </div>
            <span className="setup-fraction">
              {checks.filter(Boolean).length}/4
            </span>
          </div>
          <div className="progress-track">
            <span style={{ width: `${checks.filter(Boolean).length * 25}%` }} />
          </div>
          {[
            'Add your business details',
            'Choose your QR style',
            'Add a consenting customer',
            'Preview your first request',
          ].map((label, i) => (
            <label className="checklist-item" key={label}>
              <input
                type="checkbox"
                checked={checks[i]}
                onChange={() =>
                  setChecks(checks.map((v, n) => (n === i ? !v : v)))
                }
              />
              <span>{label}</span>
            </label>
          ))}
          <TextLink href="/dashboard/qr">Visit your QR studio</TextLink>
        </section>
      </div>
      <div className="dashboard-two-col">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Recent private feedback</h2>
              <p>Recent private feedback</p>
            </div>
            <TextLink href="/dashboard/feedback">View all</TextLink>
          </div>
          {initialFeedback.slice(0, 3).map((f) => (
            <Link
              className="activity-item"
              href="/dashboard/feedback"
              key={f.id}
            >
              <span className="avatar lavender">{f.initials}</span>
              <div>
                <div className="activity-title">
                  <strong>{f.name}</strong>
                  <Stars rating={f.rating} />
                </div>
                <p>{f.text}</p>
                <small>
                  {f.date} · {f.staff}
                </small>
              </div>
              <ArrowUpRight size={16} />
            </Link>
          ))}
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Quick actions</h2>
              <p>A few useful shortcuts</p>
            </div>
          </div>
          {[
            {
              title: 'Create a branded QR',
              desc: 'Customise and download a QR card',
              href: '/dashboard/qr',
              icon: QrIcon,
            },
            {
              title: 'Add a customer',
              desc: 'Record consent before sending requests',
              href: '/dashboard/requests?add=true',
              icon: Users,
            },
            {
              title: 'Prepare a reply',
              desc: 'Review and edit a sample reply draft',
              href: '/dashboard/reviews',
              icon: Sparkles,
            },
          ].map((a) => (
            <Link className="shortcut" href={a.href} key={a.title}>
              <span className="float-icon violet">
                <a.icon size={21} />
              </span>
              <div>
                <strong>{a.title}</strong>
                <p>{a.desc}</p>
              </div>
              <ArrowRight size={17} />
            </Link>
          ))}
        </section>
      </div>
    </>
  );
}
export function QrStudio() {
  const [name, setName] = useState('Bloom & Co.');
  const [text, setText] = useState('How was your visit?');
  const [color, setColor] = useState('#6250b5');
  const [template, setTemplate] = useState('Counter card');
  const [svg, setSvg] = useState('');
  const [preview, setPreview] = useState(false);
  const [message, setMessage] = useState('');
  const ready = useCallback((s: string) => setSvg(s), []);
  function download() {
    if (!svg) return;
    const safe = (v: string) =>
      v.replace(
        /[<>&"']/g,
        (c) =>
          ({
            '<': '&lt;',
            '>': '&gt;',
            '&': '&amp;',
            '"': '&quot;',
            "'": '&apos;',
          })[c] || c,
      );
    const qrViewBox = svg.match(/viewBox="([^"]+)"/)?.[1] || '0 0 33 33';
    const file = `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="560" viewBox="0 0 420 560"><rect width="420" height="560" rx="24" fill="#faf8f2"/><text x="210" y="75" text-anchor="middle" font-family="Georgia" font-size="32" fill="${color}">${safe(name)}</text><svg x="90" y="120" width="240" height="240" viewBox="${qrViewBox}">${svg.replace(/^.*?<svg[^>]*>/s, '').replace(/<\/svg>\s*$/, '')}</svg><text x="210" y="410" text-anchor="middle" font-family="Arial" font-size="20" fill="#22213e">${safe(text)}</text><text x="210" y="450" text-anchor="middle" font-family="Arial" font-size="14" fill="#666">Scan to share your honest experience.</text><text x="210" y="515" text-anchor="middle" font-family="Arial" font-size="11" fill="#666">RevuPing demo · /r/demo-salon</text></svg>`;
    const url = URL.createObjectURL(
      new Blob([file], { type: 'image/svg+xml' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'revuping-salon-qr.svg';
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Your QR card SVG has been downloaded.');
  }
  const card = (
    <div
      className={`qr-print-card ${template === 'Minimal poster' ? 'poster' : ''}`}
      style={{ borderTopColor: color }}
    >
      <Leaf size={33} style={{ color }} />
      <h2 style={{ color }}>{name || 'Your salon'}</h2>
      <span className="salon-sub">A LITTLE TIME FOR YOU</span>
      <QrCode color={color} onReady={ready} />
      <h3>{text || 'Share your experience'}</h3>
      <p>
        Scan to share an honest review
        <br />
        or send us private feedback.
      </p>
      <span className="powered-by">a little ping, powered by RevuPing</span>
    </div>
  );
  return (
    <>
      <PageHeading
        eyebrow="BRANDED CUSTOMER EXPERIENCE"
        title="QR code studio"
        text="Customise your salon’s QR card and download a print-ready SVG."
      />
      <div className="qr-editor">
        <section className="panel qr-controls">
          <h2>Customise your QR card</h2>
          <p className="muted">Changes appear instantly in the live preview.</p>
          <label className="field">
            Business name
            <input
              value={name}
              maxLength={30}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="field">
            Display text
            <input
              value={text}
              maxLength={40}
              onChange={(e) => setText(e.target.value)}
            />
          </label>
          <div className="field">
            Brand colour
            <div className="color-options">
              {['#6250b5', '#253c39', '#243650', '#ad5e41'].map((c) => (
                <button
                  key={c}
                  style={{ background: c }}
                  aria-label={`Select colour ${c}`}
                  aria-pressed={c === color}
                  onClick={() => setColor(c)}
                >
                  {c === color && <Check size={19} />}
                </button>
              ))}
              <input
                aria-label="Custom brand colour"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            Choose a layout
            <Tabs.Root value={template} onValueChange={setTemplate}>
              <Tabs.List className="template-tabs" aria-label="QR card layout">
                {['Counter card', 'Minimal poster'].map((t) => (
                  <Tabs.Trigger
                    key={t}
                    value={t}
                    id={`qr-template-${t === 'Counter card' ? 'card' : 'poster'}-tab`}
                    aria-controls={`qr-template-${t === 'Counter card' ? 'card' : 'poster'}-panel`}
                  >
                    <QrIcon size={21} />
                    {t}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
              <Tabs.Content
                value="Counter card"
                id="qr-template-card-panel"
                aria-labelledby="qr-template-card-tab"
                className="field-help"
              >
                Rounded card with a branded border, designed for your counter.
              </Tabs.Content>
              <Tabs.Content
                value="Minimal poster"
                id="qr-template-poster-panel"
                aria-labelledby="qr-template-poster-tab"
                className="field-help"
              >
                A clean, straight-edged layout for display on a wall or mirror.
              </Tabs.Content>
            </Tabs.Root>
          </div>
          <div className="form-divider" />
          <div className="info-note">
            <CheckCircle2 size={18} />
            <p>
              This is a real QR code. It opens the customer page at this app’s
              current address.
            </p>
          </div>
          <Button
            onClick={download}
            disabled={!svg || !name.trim() || !text.trim()}
          >
            <Download size={17} /> Download SVG card
          </Button>
          <Button variant="secondary" onClick={() => setPreview(true)}>
            Preview customer experience <ArrowUpRight size={16} />
          </Button>
          {message && (
            <p className="success-note" role="status">
              {message}
            </p>
          )}
        </section>
        <section className="qr-canvas">
          <div className="canvas-label">
            <span>LIVE PREVIEW</span>
            <span>{template}</span>
          </div>
          {card}
          <span className="canvas-footnote">
            SVG download · Links to your demo customer page
          </span>
        </section>
      </div>
      <Dialog
        open={preview}
        onOpenChange={setPreview}
        title="Preview the customer experience"
        description="Customers can always choose a Google review or private feedback, regardless of their rating."
      >
        <div className="preview-customer">
          <Leaf size={30} />
          <h3>{name}</h3>
          <p>How was your visit?</p>
          <Button asChild>
            <Link href="/r/demo-salon">
              Open the customer demo <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
      </Dialog>
    </>
  );
}
export function FeedbackInbox() {
  const [items, setItems] = useState(initialFeedback);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All feedback');
  const [selected, setSelected] = useState(1);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const visible = items.filter(
    (f) =>
      (filter === 'All feedback' ||
        (filter === 'Needs attention' && !f.resolved) ||
        (filter === 'Resolved' && f.resolved)) &&
      `${f.name} ${f.text} ${f.staff}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const detail = visible.find((f) => f.id === selected) || visible[0];
  function refresh() {
    setLoading(true);
    setTimeout(() => setLoading(false), 600);
  }
  return (
    <>
      <PageHeading
        eyebrow="PRIVATE CUSTOMER FEEDBACK"
        title="Feedback inbox"
        text="Search customer feedback, add internal notes, and track resolution."
      >
        <Button variant="secondary" onClick={refresh}>
          <Clock3 size={16} /> Refresh demo
        </Button>
      </PageHeading>
      <div className="inbox-toolbar">
        <label className="search-field">
          <Search size={18} />
          <input
            aria-label="Search feedback"
            placeholder="Search names, feedback or team members…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="filter-select">
          <SlidersHorizontal size={16} />
          <select
            aria-label="Feedback status"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {['All feedback', 'Needs attention', 'Resolved'].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="inbox-layout">
        <section className="panel inbox-list" aria-label="Feedback list">
          {loading ? (
            <div className="loading-state" role="status">
              <span className="spinner" />
              Refreshing sample feedback…
            </div>
          ) : visible.length ? (
            visible.map((f) => (
              <button
                className={`feedback-row ${detail?.id === f.id ? 'selected' : ''}`}
                key={f.id}
                onClick={() => {
                  setSelected(f.id);
                  setSaved(false);
                  focusWorkspacePanel('feedback-detail');
                }}
              >
                <div className="feedback-row-top">
                  <span className="avatar lavender">{f.initials}</span>
                  <div>
                    <strong>{f.name}</strong>
                    <small>{f.date}</small>
                  </div>
                  <span
                    className={`status-dot ${f.resolved ? 'resolved' : ''}`}
                  />
                </div>
                <Stars rating={f.rating} />
                <p>{f.text}</p>
                <div className="feedback-row-bottom">
                  <span>{f.staff}</span>
                  <Badge mint={f.resolved}>
                    {f.resolved ? 'Resolved' : 'Needs attention'}
                  </Badge>
                </div>
              </button>
            ))
          ) : (
            <div className="empty-state">
              <MessageSquare size={35} />
              <h3>No matching feedback</h3>
              <p>
                No feedback matches your search. Try a different name or filter.
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery('');
                  setFilter('All feedback');
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </section>
        <section
          className="panel feedback-detail"
          id="feedback-detail"
          tabIndex={-1}
          aria-label="Selected feedback details"
        >
          {detail && !loading ? (
            <>
              <div className="detail-top">
                <Badge>PRIVATE FEEDBACK</Badge>
                <span>{detail.date}</span>
              </div>
              <div className="detail-person">
                <span className="avatar peach large">{detail.initials}</span>
                <div>
                  <h2>{detail.name}</h2>
                  <span>Visited with {detail.staff}</span>
                </div>
              </div>
              <Stars rating={detail.rating} />
              <blockquote>“{detail.text}”</blockquote>
              <div className="detail-meta">
                <span>
                  Team member <strong>{detail.staff}</strong>
                </span>
                <span>
                  Status{' '}
                  <strong>
                    {detail.resolved ? 'Resolved' : 'Needs attention'}
                  </strong>
                </span>
              </div>
              <label className="field">
                A note for your team
                <textarea
                  placeholder="What would you like to remember or follow up on?"
                  rows={4}
                  value={notes[detail.id] || ''}
                  onChange={(e) => {
                    setNotes({ ...notes, [detail.id]: e.target.value });
                    setSaved(false);
                  }}
                />
              </label>
              <p className="field-help">
                Internal demo note. Not sent to the customer.
              </p>
              <div className="detail-actions">
                <Button
                  onClick={() => {
                    setItems(
                      items.map((f) =>
                        f.id === detail.id
                          ? { ...f, resolved: !f.resolved }
                          : f,
                      ),
                    );
                  }}
                >
                  <Check size={16} />
                  {detail.resolved ? 'Reopen feedback' : 'Mark as resolved'}
                </Button>
                <Button variant="secondary" onClick={() => setSaved(true)}>
                  Save note
                </Button>
              </div>
              {saved && (
                <p className="success-note" role="status">
                  Note saved in this demo session.
                </p>
              )}
            </>
          ) : (
            <div className="empty-state">
              <MessageSquare size={35} />
              <p>
                {loading
                  ? 'Loading sample feedback…'
                  : 'Select a feedback response to view details.'}
              </p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
export function Requests({ initialAdd = false }: { initialAdd?: boolean }) {
  const [items, setItems] = useState(initialCustomers);
  const [add, setAdd] = useState(initialAdd);
  const [target, setTarget] = useState<Customer | null>(null);
  const [sent, setSent] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState('');
  const [requestText, setRequestText] = useState(sampleRequestText);
  return (
    <>
      <PageHeading
        eyebrow="CONSENT-BASED CUSTOMER OUTREACH"
        title="Review requests"
        text="Add customers, confirm consent, and preview requests or reminders."
      >
        <Button onClick={() => setAdd(true)}>
          <Plus size={17} /> Add customer
        </Button>
      </PageHeading>
      <div className="info-banner">
        <CheckCircle2 size={19} />
        <p>
          <strong>Permission comes first.</strong> Requests are only available
          for customers with recorded consent. This demo never sends real
          messages.
        </p>
      </div>
      <div className="request-stats">
        <div>
          <strong>{items.length}</strong>
          <span>Sample customers</span>
        </div>
        <div>
          <strong>{items.filter((c) => c.consent).length}</strong>
          <span>Consent recorded</span>
        </div>
        <div>
          <strong>
            {items.filter((c) => c.status === 'Request sent (demo)').length}
          </strong>
          <span>Requests simulated this session</span>
        </div>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Customers and request status</h2>
            <p>Fictional contacts · no live messaging</p>
          </div>
          <Badge>Demo data</Badge>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Consent</th>
                <th>Request status</th>
                <th>Next step</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <td data-label="Customer">
                    <div className="table-person">
                      <span className="avatar lavender">
                        {c.name
                          .split(' ')
                          .map((s) => s[0])
                          .join('')
                          .slice(0, 2)}
                      </span>
                      <div>
                        <strong>{c.name}</strong>
                        <small>{c.email}</small>
                      </div>
                    </div>
                  </td>
                  <td data-label="Consent">
                    <span className={c.consent ? 'consent-yes' : 'muted'}>
                      {c.consent ? (
                        <>
                          <Check size={14} /> Recorded
                        </>
                      ) : (
                        'Not recorded'
                      )}
                    </span>
                  </td>
                  <td data-label="Request status">
                    <Badge
                      mint={
                        c.status.startsWith('Request sent') ||
                        c.status === 'Link clicked'
                      }
                    >
                      {c.status}
                    </Badge>
                  </td>
                  <td data-label="Next step">
                    <Button
                      variant="secondary"
                      size="small"
                      disabled={!c.consent}
                      onClick={() => {
                        setTarget(c);
                        setSent(false);
                      }}
                    >
                      {c.status.startsWith('Request sent')
                        ? 'Preview reminder'
                        : 'Preview request'}
                      <ArrowRight size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="request-bottom-note">
        <Leaf size={18} />
        <p>
          A click tells you someone opened a link. It does not confirm they left
          a review.
        </p>
      </div>
      {message && (
        <p className="success-note" role="status">
          {message}
        </p>
      )}
      <Dialog
        open={add}
        onOpenChange={setAdd}
        title="Add a demo customer"
        description="Add a fictional customer to this session. No contact details are sent anywhere."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setItems([
              ...items,
              {
                id: Date.now(),
                name,
                email,
                consent,
                status: consent ? 'Ready to send' : 'No consent',
              },
            ]);
            setAdd(false);
            setName('');
            setEmail('');
            setConsent(false);
            setMessage('Sample customer added to this demo session.');
          }}
        >
          <label className="field">
            Full name
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
            />
          </label>
          <label className="field">
            Email address
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
            />
          </label>
          <label className="consent-checkbox">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              This sample customer has agreed to receive review requests.
            </span>
          </label>
          <Button type="submit">
            Add demo customer <Plus size={16} />
          </Button>
        </form>
      </Dialog>
      <Dialog
        open={!!target}
        onOpenChange={(v) => {
          if (!v) setTarget(null);
        }}
        title={
          sent
            ? 'Request simulated'
            : target?.status.includes('sent')
              ? 'Preview reminder'
              : 'Preview request'
        }
        description="Demo interaction only. No email or text message will be sent."
      >
        {sent ? (
          <div className="empty-state">
            <CheckCircle2 className="success-icon" size={42} />
            <h3>Demo request complete</h3>
            <p>
              The status has been updated. Nothing was sent to {target?.name}.
            </p>
            <Button onClick={() => setTarget(null)}>Back to customers</Button>
          </div>
        ) : (
          <>
            <label className="field">
              To
              <input readOnly value={target?.email || ''} />
            </label>
            <label className="field">
              Your message
              <textarea
                rows={5}
                value={requestText}
                onChange={(e) => setRequestText(e.target.value)}
              />
            </label>
            <p className="message-preview">
              {requestText
                .replace('{name}', target?.name.split(' ')[0] || '')
                .replace('{review link}', '/r/demo-salon')}
            </p>
            <Button
              disabled={!requestText.trim()}
              onClick={() => {
                setItems(
                  items.map((c) =>
                    c.id === target?.id
                      ? { ...c, status: 'Request sent (demo)' }
                      : c,
                  ),
                );
                setSent(true);
              }}
            >
              <Send size={16} /> Simulate{' '}
              {target?.status.includes('sent') ? 'reminder' : 'send'}
            </Button>
          </>
        )}
      </Dialog>
    </>
  );
}
export function Reviews() {
  const [rating, setRating] = useState('All ratings');
  const [selected, setSelected] = useState(1);
  const [drafts, setDrafts] = useState<Record<number, string>>(
    Object.fromEntries(reviews.map((r) => [r.id, r.draft])),
  );
  const [approved, setApproved] = useState<number[]>([]);
  const visible = reviews.filter(
    (r) => rating === 'All ratings' || r.rating === Number(rating),
  );
  const active = visible.find((r) => r.id === selected) || visible[0];
  return (
    <>
      <PageHeading
        eyebrow="SIMULATED GOOGLE CONNECTION"
        title="Google reviews & replies"
        text="Read sample Google reviews and edit a reply draft before approving."
      />
      <div className="info-banner violet-banner">
        <Sparkles size={19} />
        <p>
          <strong>Google connection is simulated.</strong> These are fictional
          review samples and prewritten reply drafts. Approving does not publish
          to Google.
        </p>
      </div>
      <div className="reviews-toolbar">
        <span>
          <Star size={21} fill="currentColor" /> <strong>4.8</strong> Sample
          overall rating
        </span>
        <select
          aria-label="Filter reviews by rating"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
        >
          {['All ratings', '5', '4', '3', '2', '1'].map((v) => (
            <option key={v} value={v}>
              {v === 'All ratings' ? v : `${v} stars`}
            </option>
          ))}
        </select>
      </div>
      <div className="dashboard-two-col">
        <section className="review-list">
          {visible.length ? (
            visible.map((r) => (
              <button
                className={`panel review-card ${active?.id === r.id ? 'selected' : ''}`}
                key={r.id}
                onClick={() => {
                  setSelected(r.id);
                  focusWorkspacePanel('reply-editor');
                }}
              >
                <div>
                  <span className="avatar sage">{r.name[0]}</span>
                  <div>
                    <strong>{r.name}</strong>
                    <small>{r.date} · Simulated Google review</small>
                  </div>
                </div>
                <Stars rating={r.rating} />
                <p>{r.text}</p>
                <span className="text-link">
                  {approved.includes(r.id)
                    ? 'Approved in demo'
                    : 'Prepare a reply'}
                  <ArrowRight size={15} />
                </span>
              </button>
            ))
          ) : (
            <div className="panel empty-state">
              <Star size={32} />
              <h3>No matching sample reviews</h3>
              <p>Choose another rating to see a review.</p>
              <Button
                variant="secondary"
                onClick={() => setRating('All ratings')}
              >
                Show all ratings
              </Button>
            </div>
          )}
        </section>
        <section
          className="panel reply-editor"
          id="reply-editor"
          tabIndex={-1}
          aria-label="Selected review reply editor"
        >
          {active ? (
            <>
              <div className="panel-heading">
                <div>
                  <h2>
                    <Sparkles size={19} /> Edit reply draft
                  </h2>
                  <p>Sample AI-assisted reply to {active.name}</p>
                </div>
              </div>
              <label className="field">
                Your reply draft
                <textarea
                  rows={6}
                  value={drafts[active.id]}
                  onChange={(e) => {
                    setDrafts({ ...drafts, [active.id]: e.target.value });
                    setApproved(approved.filter((id) => id !== active.id));
                  }}
                />
              </label>
              <p className="field-help">
                A prewritten sample, not a live AI response. Please review
                before approving.
              </p>
              <Button
                disabled={
                  !drafts[active.id].trim() || approved.includes(active.id)
                }
                onClick={() => setApproved([...approved, active.id])}
              >
                <Check size={16} />
                {approved.includes(active.id)
                  ? 'Approved in demo'
                  : 'Approve demo draft'}
              </Button>
              {approved.includes(active.id) && (
                <p className="success-note" role="status">
                  Draft approved for this session. It has not been published to
                  Google.
                </p>
              )}
              <Button
                variant="ghost"
                onClick={() => {
                  setDrafts({ ...drafts, [active.id]: active.draft });
                  setApproved(approved.filter((id) => id !== active.id));
                }}
              >
                Reset sample draft
              </Button>
            </>
          ) : (
            <div className="empty-state">
              <Sparkles size={32} />
              <p>Select a sample review to prepare a reply.</p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

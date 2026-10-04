'use client';
import { useEffect, useRef, useState } from 'react';
import { Clock3, MessageSquare, Search, SlidersHorizontal } from 'lucide-react';
import {
  inboxErrorMessage,
  inboxPlanSchema,
  type InboxHistory,
  type InboxItem,
  type InboxMember,
  type InboxPage,
  type InboxPlan,
} from 'api-contracts';
import { focusWorkspacePanel } from '@/lib/workspace-focus';
import { authRequest } from '@/data-access/auth-client';
import { Avatar } from '@/components/ui/avatar';
import { Badge, Field, Panel, Stars } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { PageHeading } from '@/components/ui/page-heading';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toaster';
const statuses = {
  UNRESOLVED: 'Open',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
};
const filters = {
  ALL: 'All feedback',
  UNRESOLVED: 'Needs attention',
  IN_PROGRESS: 'In progress',
  OVERDUE: 'Overdue',
  RESOLVED: 'Resolved',
};
const initials = (name: string | null) =>
  (name || 'Anonymous customer')
    .split(/\s+/)
    .slice(0, 2)
    .map((v) => v[0])
    .join('')
    .toUpperCase();
const date = (v: string, timeZone = 'UTC') =>
  new Date(v).toLocaleDateString('en-US', {
    timeZone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
export function RealFeedback({
  workspaceId,
  initial,
  members,
  memberTotal,
  timeZone,
}: {
  workspaceId: string;
  initial: InboxPage;
  members: InboxMember[];
  memberTotal: number;
  timeZone: string;
}) {
  const [roster, setRoster] = useState(members);
  const [memberPage, setMemberPage] = useState(1);
  const [memberBusy, setMemberBusy] = useState(false);
  const [data, setData] = useState(initial);
  const [selected, setSelected] = useState<string | null>(
    initial.items[0]?.id || null,
  );
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const first = useRef(true);
  const generation = useRef(0);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const controller = new AbortController();
    const current = ++generation.current;
    const timer = setTimeout(
      () => {
        setLoading(true);
        setError('');
        authRequest(
          `workspaces/${workspaceId}/feedback?${new URLSearchParams({ query, status, page: String(page) })}`,
          'inboxPage',
          undefined,
          'GET',
          controller.signal,
        )
          .then((value) => {
            if (current !== generation.current) return;
            setData(value);
            setSelected((id) =>
              value.items.some((v) => v.id === id)
                ? id
                : value.items[0]?.id || null,
            );
          })
          .catch((e) => {
            if (!controller.signal.aborted) setError(inboxErrorMessage(e));
          })
          .finally(() => {
            if (current === generation.current) setLoading(false);
          });
      },
      query ? 200 : 0,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [workspaceId, query, status, page, attempt]);
  const detail = data.items.find((v) => v.id === selected);
  const [dirty, setDirty] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<string | null>(null);
  const focus = () => focusWorkspacePanel('feedback-detail');
  return (
    <>
      <PageHeading
        eyebrow="Private customer feedback"
        title="Feedback inbox"
        text="Search customer feedback, add internal notes, and track resolution."
      >
        <Button
          variant="secondary"
          onClick={() => setAttempt((v) => v + 1)}
          disabled={loading || dirty}
          aria-busy={loading}
        >
          <Clock3 size={16} />
          {loading ? 'Refreshing…' : 'Refresh'}
        </Button>
      </PageHeading>
      <div className="inbox-toolbar">
        <label className="search-field">
          <Search size={18} />
          <input
            aria-label="Search feedback"
            placeholder="Search names, feedback or team members…"
            maxLength={100}
            value={query}
            disabled={dirty}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <Select
          label="Feedback status"
          value={status}
          disabled={dirty}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          icon={<SlidersHorizontal size={16} />}
          options={Object.entries(filters).map(([value, label]) => ({
            value,
            label,
          }))}
        />
      </div>
      {error && (
        <div className="error-banner" role="alert">
          {error}
          <Button variant="secondary" onClick={() => setAttempt((v) => v + 1)}>
            Try again
          </Button>
        </div>
      )}
      {dirty && (
        <p className="field-help">
          Save or discard your changes before changing filters or pages.
        </p>
      )}
      {pendingSelection && (
        <div className="info-banner">
          <p>
            You have unsaved changes. Discard them to select another response?
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setDirty(false);
              setSelected(pendingSelection);
              setPendingSelection(null);
              focus();
            }}
          >
            Discard changes
          </Button>
          <Button variant="ghost" onClick={() => setPendingSelection(null)}>
            Keep editing
          </Button>
        </div>
      )}
      <div className="inbox-layout" aria-busy={loading}>
        <Panel className="inbox-list" aria-label="Feedback list">
          {data.items.length ? (
            data.items.map((item) => (
              <button
                className={`feedback-row ${selected === item.id ? 'selected' : ''}`}
                key={item.id}
                aria-pressed={selected === item.id}
                onClick={() => {
                  if (dirty && selected !== item.id)
                    setPendingSelection(item.id);
                  else {
                    setSelected(item.id);
                    focus();
                  }
                }}
              >
                <div className="feedback-row-top">
                  <Avatar initials={initials(item.name)} tone="lavender" />
                  <div>
                    <strong>{item.name || 'Anonymous customer'}</strong>
                    <small>{date(item.createdAt, timeZone)}</small>
                  </div>
                  <span
                    aria-hidden="true"
                    className={`status-dot ${item.status === 'RESOLVED' ? 'resolved' : ''}`}
                  />
                </div>
                <Stars rating={item.rating} />
                <p className="[overflow-wrap:anywhere]">{item.message}</p>
                <div className="feedback-row-bottom">
                  <span>{item.assigneeName || 'Unassigned'}</span>
                  <Badge mint={item.status === 'RESOLVED'}>
                    {item.status === 'UNRESOLVED'
                      ? 'Needs attention'
                      : statuses[item.status]}
                  </Badge>
                </div>
              </button>
            ))
          ) : (
            <div className="empty-state">
              <MessageSquare size={35} />
              <h3>
                {query || status !== 'ALL'
                  ? 'No matching feedback'
                  : 'No feedback yet'}
              </h3>
              <p>
                {query || status !== 'ALL'
                  ? 'Try a different name or filter.'
                  : 'Share your location’s QR card to invite private customer feedback.'}
              </p>
              {(query || status !== 'ALL') && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery('');
                    setStatus('ALL');
                    setPage(1);
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </Panel>
        <Panel
          className="feedback-detail"
          id="feedback-detail"
          tabIndex={-1}
          aria-label="Selected feedback details"
        >
          {detail ? (
            <FeedbackDetail
              key={detail.id}
              workspaceId={workspaceId}
              item={detail}
              timeZone={timeZone}
              members={roster}
              moreMembers={roster.length < memberTotal}
              memberBusy={memberBusy}
              onMoreMembers={async () => {
                setMemberBusy(true);
                try {
                  const next = await authRequest(
                    `workspaces/${workspaceId}/feedback/members?page=${memberPage + 1}`,
                    'inboxMembers',
                  );
                  setRoster((v) => [...v, ...next.items]);
                  setMemberPage(next.page);
                } catch (e) {
                  setError(inboxErrorMessage(e));
                } finally {
                  setMemberBusy(false);
                }
              }}
              onDirty={setDirty}
              onSaved={(v) => {
                setData((current) => ({
                  ...current,
                  items: current.items.map((old) =>
                    old.id === v.id ? v : old,
                  ),
                }));
              }}
            />
          ) : (
            <div className="empty-state">
              <MessageSquare size={35} />
              <p>Select a feedback response to view details.</p>
            </div>
          )}
        </Panel>
      </div>
      <div className="detail-actions">
        <Button
          variant="secondary"
          disabled={page <= 1 || loading || dirty}
          onClick={() => setPage((v) => v - 1)}
        >
          Previous
        </Button>
        <span aria-live="polite">
          Page {data.page} · {data.total} responses
        </span>
        <Button
          variant="secondary"
          disabled={page * 25 >= data.total || loading || dirty}
          onClick={() => setPage((v) => v + 1)}
        >
          Next
        </Button>
      </div>
    </>
  );
}
function FeedbackDetail({
  workspaceId,
  item,
  members,
  timeZone,
  moreMembers,
  memberBusy,
  onMoreMembers,
  onDirty,
  onSaved,
}: {
  workspaceId: string;
  item: InboxItem;
  members: InboxMember[];
  timeZone: string;
  moreMembers: boolean;
  memberBusy: boolean;
  onMoreMembers: () => void;
  onDirty: (v: boolean) => void;
  onSaved: (v: InboxItem) => void;
}) {
  const plan = (v: InboxItem): InboxPlan => ({
    revision: v.revision,
    assigneeId: v.assigneeId,
    priority: v.priority,
    status: v.status,
    dueDate: v.dueDate,
    tags: v.tags,
    resolutionSummary: v.resolutionSummary,
  });
  const [draft, setDraft] = useState(() => plan(item));
  const [baseline, setBaseline] = useState(() => plan(item));
  const [note, setNote] = useState('');
  const noteKey = useRef<string | null>(null);
  const noteBody = useRef('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [history, setHistory] = useState<InboxHistory | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyAttempt, setHistoryAttempt] = useState(0);
  const [historyError, setHistoryError] = useState('');
  const toast = useToast();
  const dirty =
    JSON.stringify(draft) !== JSON.stringify(baseline) || !!note.trim();
  useEffect(() => {
    // A clean refresh must reconcile another member's revision, while preserving an edited draft.
    if (!dirty) {
      setDraft(plan(item));
      setBaseline(plan(item));
    }
  }, [item, dirty]);
  useEffect(() => {
    onDirty(dirty);
    const listener = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener('beforeunload', listener);
    return () => window.removeEventListener('beforeunload', listener);
  }, [dirty, onDirty]);
  useEffect(() => {
    const controller = new AbortController();
    setHistoryError('');
    authRequest(
      `workspaces/${workspaceId}/feedback/${item.id}/history?page=${historyPage}`,
      'inboxHistory',
      undefined,
      'GET',
      controller.signal,
    )
      .then(setHistory)
      .catch((e) => {
        if (!controller.signal.aborted) setHistoryError(inboxErrorMessage(e));
      });
    return () => controller.abort();
  }, [workspaceId, item.id, historyPage, historyAttempt]);
  async function save(value: InboxPlan) {
    if (!inboxPlanSchema.safeParse(value).success) {
      setError('Add a resolution summary and check the follow-up date.');
      return;
    }
    setBusy('plan');
    setError('');
    try {
      const saved = await authRequest(
        `workspaces/${workspaceId}/feedback/${item.id}`,
        'inboxItem',
        value,
        'PUT',
      );
      setDraft(plan(saved));
      setBaseline(plan(saved));
      onSaved(saved);
      setHistoryPage(1);
      setHistoryAttempt((v) => v + 1);
      toast('Follow-up plan saved');
    } catch (e) {
      setError(inboxErrorMessage(e));
    } finally {
      setBusy('');
    }
  }
  return (
    <>
      <div className="detail-top">
        <Badge>PRIVATE FEEDBACK</Badge>
        <span>{date(item.createdAt, timeZone)}</span>
      </div>
      <div className="detail-person">
        <Avatar initials={initials(item.name)} tone="peach" size="large" />
        <div>
          <h2>{item.name || 'Anonymous customer'}</h2>
          <span>{item.locationName}</span>
        </div>
      </div>
      <Stars rating={item.rating} />
      <blockquote className="[overflow-wrap:anywhere]">
        “{item.message}”
      </blockquote>
      <div className="detail-meta">
        <span>
          Assigned staff <strong>{item.assigneeName || 'Unassigned'}</strong>
        </span>
        <span>
          Status <strong>{statuses[item.status]}</strong>
        </span>
      </div>
      {item.email && (
        <p className="field-help [overflow-wrap:anywhere]">
          Contact supplied with this response: {item.email}. This does not
          establish marketing consent.
        </p>
      )}
      <Field>
        A note for your team
        <textarea
          placeholder="What would you like to remember or follow up on?"
          rows={4}
          maxLength={2000}
          value={note}
          disabled={!!busy}
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>
      <p className="field-help">
        Private internal note. Not sent to the customer.
      </p>
      <section className="follow-up-editor">
        <h3>Follow-up plan</h3>
        <p className="field-help">
          Calendar due dates use your primary location’s timezone: {timeZone}.
        </p>
        <div className="product-form-grid">
          <Field as="div">
            <span>Assigned staff</span>
            <Select
              label="Assigned staff"
              value={draft.assigneeId || 'unassigned'}
              disabled={!!busy}
              options={[
                { value: 'unassigned', label: 'Unassigned' },
                ...members.map((v) => ({ value: v.id, label: v.name })),
                ...(draft.assigneeId &&
                !members.some((v) => v.id === draft.assigneeId)
                  ? [
                      {
                        value: draft.assigneeId,
                        label: item.assigneeName || 'Assigned member',
                      },
                    ]
                  : []),
              ]}
              onValueChange={(v) =>
                setDraft({
                  ...draft,
                  assigneeId: v === 'unassigned' ? null : v,
                })
              }
            />
            {moreMembers && (
              <Button
                variant="ghost"
                disabled={memberBusy || !!busy}
                onClick={onMoreMembers}
              >
                {memberBusy ? 'Loading staff…' : 'Load more staff'}
              </Button>
            )}
          </Field>
          <Field as="div">
            <span>Follow-up priority</span>
            <Select
              label="Follow-up priority"
              value={draft.priority}
              disabled={!!busy}
              options={['LOW', 'NORMAL', 'HIGH'].map((value) => ({
                value,
                label: value[0] + value.slice(1).toLowerCase(),
              }))}
              onValueChange={(v) =>
                setDraft({ ...draft, priority: v as InboxPlan['priority'] })
              }
            />
          </Field>
          <Field as="div">
            <span>Follow-up state</span>
            <Select
              label="Follow-up state"
              value={draft.status}
              disabled={!!busy}
              options={Object.entries(statuses).map(([value, label]) => ({
                value,
                label,
              }))}
              onValueChange={(v) =>
                setDraft({ ...draft, status: v as InboxPlan['status'] })
              }
            />
          </Field>
          <Field>
            Follow-up due date
            <input
              type="date"
              value={draft.dueDate}
              disabled={!!busy}
              onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
            />
          </Field>
        </div>
        <Field>
          Feedback tags
          <input
            value={draft.tags}
            maxLength={100}
            disabled={!!busy}
            onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
          />
        </Field>
        <Field>
          Resolution summary
          <textarea
            rows={3}
            maxLength={2000}
            value={draft.resolutionSummary}
            disabled={!!busy}
            onChange={(e) =>
              setDraft({ ...draft, resolutionSummary: e.target.value })
            }
            placeholder="What was discussed and how was the problem addressed?"
          />
        </Field>
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
        <Button
          variant="secondary"
          disabled={!!busy}
          aria-busy={busy === 'plan'}
          onClick={() => save(draft)}
        >
          {busy === 'plan' ? 'Saving…' : 'Save follow-up plan'}
        </Button>
        <details className="data-alternative">
          <summary>Follow-up activity history</summary>
          {historyError ? (
            <p role="alert">
              {historyError}
              <Button
                variant="secondary"
                onClick={() => setHistoryAttempt((v) => v + 1)}
              >
                Retry history
              </Button>
            </p>
          ) : !history ? (
            <p>Loading activity…</p>
          ) : (
            <>
              <ol className="product-timeline">
                {history.items.map((v) => (
                  <li key={v.id}>
                    <strong>{v.actorName}</strong> ·{' '}
                    {date(v.createdAt, timeZone)}
                    <p className="[overflow-wrap:anywhere]">{v.body}</p>
                  </li>
                ))}
              </ol>
              {!history.total && <p>No internal activity yet.</p>}
              <div className="detail-actions">
                <Button
                  variant="ghost"
                  disabled={historyPage === 1}
                  onClick={() => setHistoryPage((v) => v - 1)}
                >
                  Newer activity
                </Button>
                <Button
                  variant="ghost"
                  disabled={historyPage * 25 >= history.total}
                  onClick={() => setHistoryPage((v) => v + 1)}
                >
                  Older activity
                </Button>
              </div>
            </>
          )}
        </details>
      </section>
      <div className="detail-actions">
        <Button
          disabled={!!busy}
          onClick={() =>
            save({
              ...draft,
              status: item.status === 'RESOLVED' ? 'UNRESOLVED' : 'RESOLVED',
            })
          }
        >
          {item.status === 'RESOLVED' ? 'Reopen feedback' : 'Mark as resolved'}
        </Button>
        <Button
          variant="secondary"
          disabled={!note.trim() || !!busy}
          aria-busy={busy === 'note'}
          onClick={async () => {
            if (!noteKey.current || noteBody.current !== note.trim()) {
              noteKey.current = crypto.randomUUID();
              noteBody.current = note.trim();
            }
            setBusy('note');
            setError('');
            try {
              await authRequest(
                `workspaces/${workspaceId}/feedback/${item.id}/notes`,
                'message',
                { key: noteKey.current, body: noteBody.current },
              );
              setNote('');
              noteKey.current = null;
              setHistoryPage(1);
              setHistoryAttempt((v) => v + 1);
              toast('Note saved');
            } catch (e) {
              setError(inboxErrorMessage(e));
            } finally {
              setBusy('');
            }
          }}
        >
          {busy === 'note' ? 'Saving note…' : 'Save note'}
        </Button>
        {dirty && (
          <Button
            variant="ghost"
            disabled={!!busy}
            onClick={() => {
              setDraft(baseline);
              setNote('');
              setError('');
            }}
          >
            Discard changes
          </Button>
        )}
      </div>
    </>
  );
}

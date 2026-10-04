import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Avatar,
  Badge,
  Button,
  Card,
  DateField,
  Field,
  FilterChips,
  Header,
  Screen,
  SearchField,
  Select,
  Stars,
} from 'mobile-ui';
import { useTheme } from 'mobile-tokens';
import {
  accountDestination,
  inboxErrorMessage,
  inboxPlanSchema,
  type InboxHistory,
  type InboxItem,
  type InboxMember,
  type InboxPage,
  type InboxPlan,
} from 'api-contracts';
import { useAuth } from '../data-access/auth-context';
// This identifier only deduplicates a private note; it is never a credential.
const noteIdentifier = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (v) => {
    const n = Math.floor(Math.random() * 16);
    return (v === 'x' ? n : (n & 3) | 8).toString(16);
  });
const filters = [
  'All',
  'Needs attention',
  'In progress',
  'Overdue',
  'Resolved',
];
const filterValues = [
  'ALL',
  'UNRESOLVED',
  'IN_PROGRESS',
  'OVERDUE',
  'RESOLVED',
];
const states = ['UNRESOLVED', 'IN_PROGRESS', 'RESOLVED'];
const stateLabels = ['Open', 'In progress', 'Resolved'];
const initials = (value: string | null) =>
  (value || 'Anonymous customer')
    .split(/\s+/)
    .slice(0, 2)
    .map((v) => v[0])
    .join('')
    .toUpperCase();
export default function AccountFeedback() {
  const { client, session } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ workspace?: string }>();
  const [authorized, setAuthorized] = useState(false);
  const [data, setData] = useState<InboxPage | null>(null);
  const [members, setMembers] = useState<InboxMember[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<InboxItem | null>(null);
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      setAuthorized(false);
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
        if (!workspace) throw new Error('Select an authorized workspace.');
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
        const team = await client.inboxMembers(workspace.id);
        if (alive) {
          setMembers(team);
          setAuthorized(true);
        }
      })().catch((e) => {
        if (alive) setError(inboxErrorMessage(e));
      });
      return () => {
        alive = false;
      };
    }, [client, params.workspace, router, attempt]),
  );
  useEffect(() => {
    if (!authorized || !params.workspace) return;
    let alive = true;
    setError('');
    const timer = setTimeout(
      () =>
        client
          .inbox(
            params.workspace!,
            new URLSearchParams({
              query,
              status: filterValues[filters.indexOf(filter)],
              page: String(page),
            }).toString(),
          )
          .then((v) => {
            if (alive) setData(v);
          })
          .catch((e) => {
            if (alive) setError(inboxErrorMessage(e));
          }),
      query ? 200 : 0,
    );
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [client, authorized, params.workspace, query, filter, page]);
  if (!session) return null;
  return (
    <Screen>
      <Header title="Feedback inbox" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 24, gap: 16 }}
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
          {!authorized ? (
            <>
              <Text style={{ color: colors.muted }}>
                {error ? 'Feedback is unavailable.' : 'Loading your workspace…'}
              </Text>
              <Button
                title="Try again"
                onPress={() => setAttempt((v) => v + 1)}
              />
            </>
          ) : selected ? (
            <NativeDetail
              key={selected.id}
              workspaceId={params.workspace!}
              item={selected}
              members={members}
              onClose={() => {
                setSelected(null);
                setAttempt((v) => v + 1);
              }}
            />
          ) : (
            <>
              <SearchField
                label="Search feedback"
                value={query}
                onChange={(v) => {
                  setQuery(v.slice(0, 100));
                  setPage(1);
                }}
              />
              <FilterChips
                options={filters}
                value={filter}
                onChange={(v) => {
                  setFilter(v);
                  setPage(1);
                }}
              />
              {!data ? (
                <Text style={{ color: colors.muted }}>Loading feedback…</Text>
              ) : !data.items.length ? (
                <Card>
                  <Text style={{ color: colors.ink, fontSize: 20 }}>
                    No feedback found
                  </Text>
                  <Text style={{ color: colors.muted }}>
                    Share your QR card or try a different filter.
                  </Text>
                </Card>
              ) : (
                data.items.map((v) => (
                  <TouchableOpacity
                    key={v.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Feedback from ${v.name || 'Anonymous customer'}, ${v.rating} stars`}
                    onPress={() => setSelected(v)}
                  >
                    <Card>
                      <View style={{ gap: 12 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            gap: 12,
                            alignItems: 'center',
                          }}
                        >
                          <Avatar initials={initials(v.name)} tone="lavender" />
                          <Text
                            style={{ color: colors.ink, fontSize: 18, flex: 1 }}
                          >
                            {v.name || 'Anonymous customer'}
                          </Text>
                        </View>
                        <Stars rating={v.rating} />
                        <Text style={{ color: colors.ink }}>{v.message}</Text>
                        <Text style={{ color: colors.muted }}>
                          {v.locationName} · {v.assigneeName || 'Unassigned'}
                        </Text>
                        <Badge
                          label={stateLabels[states.indexOf(v.status)]}
                          tone={v.status === 'RESOLVED' ? 'mint' : 'warm'}
                        />
                      </View>
                    </Card>
                  </TouchableOpacity>
                ))
              )}
              <Text style={{ color: colors.muted }}>
                Page {page} · {data?.total || 0} responses
              </Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Button
                  title="Previous"
                  disabled={page <= 1}
                  variant="secondary"
                  onPress={() => setPage((v) => v - 1)}
                />
                <Button
                  title="Next"
                  disabled={!data || page * 25 >= data.total}
                  variant="secondary"
                  onPress={() => setPage((v) => v + 1)}
                />
              </View>
              <Button
                title="Refresh"
                variant="secondary"
                onPress={() => setAttempt((v) => v + 1)}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
function NativeDetail({
  workspaceId,
  item,
  members,
  onClose,
}: {
  workspaceId: string;
  item: InboxItem;
  members: InboxMember[];
  onClose: () => void;
}) {
  const { client } = useAuth();
  const { colors } = useTheme();
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
  const [history, setHistory] = useState<InboxHistory | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [success, setSuccess] = useState('');
  const key = useRef({ value: '', body: '' });
  const dirty =
    JSON.stringify(draft) !== JSON.stringify(baseline) || !!note.trim();
  useEffect(() => {
    let alive = true;
    client
      .inboxHistory(workspaceId, item.id, historyPage)
      .then((v) => {
        if (alive) setHistory(v);
      })
      .catch((e) => {
        if (alive) setError(inboxErrorMessage(e));
      });
    return () => {
      alive = false;
    };
  }, [client, workspaceId, item.id, historyPage, attempt]);
  const assigneeOptions = [
    'Unassigned',
    ...members.map((v, i) => `${v.name} · ${i + 1}`),
  ];
  return (
    <>
      <Button
        title="Back to inbox"
        variant="ghost"
        disabled={busy}
        onPress={() => (dirty ? setDiscard(true) : onClose())}
      />
      {discard && (
        <Card>
          <Text style={{ color: colors.ink }}>Discard unsaved changes?</Text>
          <Button title="Discard changes" onPress={onClose} />
          <Button
            title="Keep editing"
            variant="secondary"
            onPress={() => setDiscard(false)}
          />
        </Card>
      )}
      <Card>
        <View style={{ gap: 16 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Avatar initials={initials(item.name)} size={48} />
            <Text style={{ color: colors.ink, fontSize: 22, flex: 1 }}>
              {item.name || 'Anonymous customer'}
            </Text>
          </View>
          <Stars rating={item.rating} />
          <Text style={{ color: colors.ink }}>{item.message}</Text>
          <Text style={{ color: colors.muted }}>
            {item.locationName} ·{' '}
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          {item.email && (
            <Text style={{ color: colors.muted }}>
              Contact: {item.email}. Marketing consent is not established.
            </Text>
          )}
          <Field
            label="A note for your team"
            multiline
            value={note}
            maxLength={2000}
            editable={!busy}
            onChangeText={setNote}
          />
          <Text style={{ color: colors.muted }}>
            Private internal note. Not sent to the customer.
          </Text>
          <Select
            label="Assigned staff"
            value={
              draft.assigneeId
                ? assigneeOptions[
                    members.findIndex((v) => v.id === draft.assigneeId) + 1
                  ] || 'Unassigned'
                : 'Unassigned'
            }
            options={assigneeOptions}
            onChange={(v) => {
              if (!busy)
                setDraft({
                  ...draft,
                  assigneeId:
                    members[assigneeOptions.indexOf(v) - 1]?.id || null,
                });
            }}
          />
          <Select
            label="Follow-up priority"
            value={draft.priority}
            options={['LOW', 'NORMAL', 'HIGH']}
            onChange={(v) => {
              if (!busy)
                setDraft({ ...draft, priority: v as InboxPlan['priority'] });
            }}
          />
          <Select
            label="Follow-up state"
            value={stateLabels[states.indexOf(draft.status)]}
            options={stateLabels}
            onChange={(v) => {
              if (!busy)
                setDraft({
                  ...draft,
                  status: states[stateLabels.indexOf(v)] as InboxPlan['status'],
                });
            }}
          />
          <DateField
            label="Follow-up due date"
            value={draft.dueDate}
            onChange={(v) => {
              if (!busy) setDraft({ ...draft, dueDate: v });
            }}
          />
          <Button
            title="Clear due date"
            variant="ghost"
            disabled={busy}
            onPress={() => setDraft({ ...draft, dueDate: '' })}
          />
          <Field
            label="Feedback tags"
            value={draft.tags}
            maxLength={100}
            editable={!busy}
            onChangeText={(v) => setDraft({ ...draft, tags: v })}
          />
          <Field
            label="Resolution summary"
            multiline
            value={draft.resolutionSummary}
            maxLength={2000}
            editable={!busy}
            onChangeText={(v) => setDraft({ ...draft, resolutionSummary: v })}
          />
          {!!error && (
            <Text accessibilityRole="alert" style={{ color: colors.danger }}>
              {error}
            </Text>
          )}
          {!!success && (
            <Text accessibilityRole="alert" style={{ color: colors.muted }}>
              {success}
            </Text>
          )}
          <Button
            title={busy ? 'Saving…' : 'Save follow-up plan'}
            disabled={busy}
            onPress={async () => {
              if (!inboxPlanSchema.safeParse(draft).success) {
                setError('Add a resolution summary and check the due date.');
                return;
              }
              setBusy(true);
              setError('');
              setSuccess('');
              try {
                const saved = await client.saveInboxPlan(
                  workspaceId,
                  item.id,
                  draft,
                );
                setDraft(plan(saved));
                setBaseline(plan(saved));
                setHistoryPage(1);
                setAttempt((v) => v + 1);
                setSuccess('Follow-up plan saved.');
              } catch (e) {
                setError(inboxErrorMessage(e));
              } finally {
                setBusy(false);
              }
            }}
          />
          <Button
            title="Save note"
            variant="secondary"
            disabled={busy || !note.trim()}
            onPress={async () => {
              if (!key.current.value || key.current.body !== note.trim())
                key.current = { value: noteIdentifier(), body: note.trim() };
              setBusy(true);
              setError('');
              setSuccess('');
              try {
                await client.saveInboxNote(
                  workspaceId,
                  item.id,
                  key.current.value,
                  key.current.body,
                );
                setNote('');
                key.current = { value: '', body: '' };
                setHistoryPage(1);
                setAttempt((v) => v + 1);
                setSuccess('Note saved.');
              } catch (e) {
                setError(inboxErrorMessage(e));
              } finally {
                setBusy(false);
              }
            }}
          />
        </View>
      </Card>
      <Card>
        <View style={{ gap: 12 }}>
          <Text style={{ color: colors.ink, fontSize: 20 }}>
            Follow-up activity history
          </Text>
          {history?.items.map((v) => (
            <View key={v.id}>
              <Text style={{ color: colors.ink }}>
                {v.actorName} · {new Date(v.createdAt).toLocaleDateString()}
              </Text>
              <Text style={{ color: colors.muted }}>{v.body}</Text>
            </View>
          ))}
          {!history?.total && (
            <Text style={{ color: colors.muted }}>No activity yet.</Text>
          )}
          <Button
            title="Newer activity"
            variant="ghost"
            disabled={historyPage === 1}
            onPress={() => setHistoryPage((v) => v - 1)}
          />
          <Button
            title="Older activity"
            variant="ghost"
            disabled={!history || historyPage * 25 >= history.total}
            onPress={() => setHistoryPage((v) => v + 1)}
          />
          <Button
            title="Retry history"
            variant="ghost"
            onPress={() => setAttempt((v) => v + 1)}
          />
        </View>
      </Card>
    </>
  );
}

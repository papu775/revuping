'use client';
import { useState } from 'react';
import { useDemoWorkspace } from '../demo-workspace';
import { useToast } from '../ui/toaster';
import { followUpFor, type FollowUp } from '../../lib/product-data';
import { Field, Button, Picker, ErrorText } from './common';
export function FollowUpEditor({
  id,
  resolved,
}: {
  id: number;
  resolved: boolean;
}) {
  const { product, updateProduct, setFeedbackItems } = useDemoWorkspace();
  const toast = useToast();
  const current = product.followUps[id] || followUpFor(id, resolved);
  const [draft, setDraft] = useState<FollowUp>(current);
  const [error, setError] = useState('');
  return (
    <section className="follow-up-editor">
      <h3>Follow-up plan</h3>
      <div className="product-form-grid">
        <Picker
          label="Assigned staff"
          value={draft.assignee}
          onChange={(assignee) => setDraft({ ...draft, assignee })}
          options={['Unassigned', 'Alex', 'Mia', 'Sophie']}
        />
        <Picker
          label="Follow-up priority"
          value={draft.priority}
          onChange={(priority) => setDraft({ ...draft, priority })}
          options={['Low', 'Normal', 'High']}
        />
        <Picker
          label="Follow-up state"
          value={draft.status}
          onChange={(status) =>
            setDraft({ ...draft, status: status as FollowUp['status'] })
          }
          options={['Open', 'In progress', 'Resolved']}
        />
        <Field>
          Follow-up due date
          <input
            type="date"
            value={draft.due}
            onChange={(event) =>
              setDraft({ ...draft, due: event.target.value })
            }
          />
        </Field>
      </div>
      <Field>
        Feedback tags
        <input
          value={draft.tags}
          onChange={(event) => setDraft({ ...draft, tags: event.target.value })}
          maxLength={100}
        />
      </Field>
      <Field>
        Resolution summary
        <textarea
          rows={3}
          value={draft.summary}
          onChange={(event) =>
            setDraft({ ...draft, summary: event.target.value })
          }
          placeholder="What was discussed and how was the problem addressed?"
        />
      </Field>
      {error && <ErrorText>{error}</ErrorText>}
      <Button
        variant="secondary"
        onClick={() => {
          if (draft.status === 'Resolved' && !draft.summary.trim()) {
            setError(
              'Add a resolution summary before marking the follow-up resolved.',
            );
            return;
          }
          const next = {
            ...draft,
            history: [
              ...current.history,
              `${draft.status} · assigned to ${draft.assignee} · due ${draft.due || 'not set'} · saved in this demo`,
            ],
          };
          updateProduct((state) => ({
            ...state,
            followUps: { ...state.followUps, [id]: next },
          }));
          setFeedbackItems((items) =>
            items.map((item) =>
              item.id === id
                ? { ...item, resolved: next.status === 'Resolved' }
                : item,
            ),
          );
          setError('');
          toast('Follow-up plan saved in this demo');
        }}
      >
        Save follow-up plan
      </Button>
      <details className="data-alternative">
        <summary>Follow-up activity history</summary>
        <ol className="product-timeline">
          {current.history.map((activity, index) => (
            <li key={index}>{activity}</li>
          ))}
        </ol>
        {current.summary && <p>Resolution: {current.summary}</p>}
      </details>
    </section>
  );
}

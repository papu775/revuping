'use client';
import { useDemoWorkspace } from '@/data-access/demo-workspace';
import { reviews } from '@/data-access/mock-data';
import { demoDate, followUpFor } from '@/data-access/product-data';
import { Panel, Badge, ActionLink } from '@/features/product/common';
export function OwnerTasks() {
  const { product, feedbackItems, approved } = useDemoWorkspace();
  const open = feedbackItems.filter((feedback) => !feedback.resolved);
  const pending = reviews.filter((review) => !approved.includes(review.id));
  const scheduled = product.campaigns.filter(
    (campaign) => campaign.status === 'Scheduled',
  );
  const overdue = open.filter((feedback) => {
    const due = (product.followUps[feedback.id] || followUpFor(feedback.id))
      .due;
    return !!due && due < demoDate;
  });
  return (
    <div className="owner-task-grid">
      <Panel>
        <div className="product-panel-heading">
          <h2>Today’s tasks</h2>
          <Badge>Demo · 2 Oct</Badge>
        </div>
        {overdue.length > 0 && (
          <ActionLink href="/dashboard/feedback?status=overdue">
            {overdue.length} overdue follow-up{overdue.length === 1 ? '' : 's'}
          </ActionLink>
        )}
        {open.slice(0, 2).map((feedback) => (
          <ActionLink
            key={feedback.id}
            href={`/dashboard/feedback?item=${feedback.id}`}
          >
            Follow up with {feedback.name}
          </ActionLink>
        ))}
        {pending[0] && (
          <ActionLink href={`/dashboard/reviews?item=${pending[0].id}`}>
            Approve {pending[0].name}’s reply draft · {pending.length} awaiting
            approval
          </ActionLink>
        )}
        {!open.length && !pending.length && (
          <p>All current feedback and reply tasks are complete in this demo.</p>
        )}
      </Panel>
      <Panel>
        <h2>Scheduled previews</h2>
        {scheduled.slice(0, 2).map((campaign) => (
          <ActionLink
            key={campaign.id}
            href={`/dashboard/${campaign.kind === 'Repeat visit' ? 'repeat-visits' : campaign.kind === 'Reminder' ? 'reminders' : 'campaigns'}?item=${campaign.id}`}
          >
            {campaign.name}
            <small>
              {campaign.scheduled.replace('T', ' ')} · no messages will be sent
            </small>
          </ActionLink>
        ))}
        {!scheduled.length && <p>No scheduled previews.</p>}
        <h3>Workspace setup</h3>
        <ActionLink href="/dashboard/onboarding">
          {product.business.onboarded
            ? 'Business setup complete · review details'
            : 'Finish business onboarding'}
        </ActionLink>
        <ActionLink href="/dashboard/integrations">
          {
            Object.values(product.connections).filter(
              (value) => value === 'Demo-connected',
            ).length
          }{' '}
          demo connections · inspect setup
        </ActionLink>
      </Panel>
    </div>
  );
}

import 'server-only';
import { redirect } from 'next/navigation';
import { inboxMembersSchema, inboxPageSchema } from 'api-contracts';
import { workspaceRoute } from '@/server/workspace-route';
import { serverApi } from '@/server/auth-api';
import { DashboardShell } from '@/components/dashboard-shell';
import { RealFeedback } from '@/features/feedback/real-feedback';
export const dynamic = 'force-dynamic';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ workspace?: string }>;
}) {
  const state = await workspaceRoute((await searchParams).workspace);
  if (
    state.destination !== 'dashboard' ||
    !state.workspace ||
    !state.onboarding
  )
    redirect('/workspace');
  const data = await serverApi(`workspaces/${state.workspace.id}/feedback`);
  const members = await serverApi(
    `workspaces/${state.workspace.id}/feedback/members`,
  );
  if (!data.ok || !members.ok) throw new Error('Feedback unavailable');
  const roster = inboxMembersSchema.parse(await members.json());
  return (
    <DashboardShell
      real={{
        workspace: state.workspace,
        onboarding: state.onboarding,
        workspaces: state.workspaces,
        userId: state.session.user.id,
      }}
    >
      <RealFeedback
        key={state.workspace.id}
        workspaceId={state.workspace.id}
        initial={inboxPageSchema.parse(await data.json())}
        members={roster.items}
        memberTotal={roster.total}
        timeZone={state.onboarding.draft.timezone}
      />
    </DashboardShell>
  );
}

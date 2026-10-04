import 'server-only';
import { redirect } from 'next/navigation';
import {
  businessLocationsSchema,
  invitationPageSchema,
  teamPageSchema,
  workspaceSettingsSchema,
} from 'api-contracts';
import { workspaceRoute } from '@/server/workspace-route';
import { serverApi } from '@/server/auth-api';
import { DashboardShell } from '@/components/dashboard-shell';
import { RealSettings } from '@/features/settings/real-settings';
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
  const id = state.workspace.id;
  const settings = await serverApi(`workspaces/${id}/settings`);
  const team = await serverApi(`workspaces/${id}/team`);
  const locations = await serverApi(`workspaces/${id}/business-locations`);
  const invitations =
    state.workspace.role === 'OWNER'
      ? await serverApi(`workspaces/${id}/invitations`)
      : null;
  if (
    !settings.ok ||
    !team.ok ||
    !locations.ok ||
    (invitations && !invitations.ok)
  )
    throw new Error('Workspace settings unavailable');
  return (
    <DashboardShell
      real={{
        workspace: state.workspace,
        onboarding: state.onboarding,
        workspaces: state.workspaces,
        userId: state.session.user.id,
      }}
    >
      <RealSettings
        key={id}
        workspaceId={id}
        userId={state.session.user.id}
        owner={state.workspace.role === 'OWNER'}
        onboarding={state.onboarding}
        initial={workspaceSettingsSchema.parse(await settings.json())}
        team={teamPageSchema.parse(await team.json())}
        locations={businessLocationsSchema.parse(await locations.json())}
        invitations={
          invitations
            ? invitationPageSchema.parse(await invitations.json())
            : null
        }
      />
    </DashboardShell>
  );
}

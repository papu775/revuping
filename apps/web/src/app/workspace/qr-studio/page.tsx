import 'server-only';
import { redirect } from 'next/navigation';
import { qrLocationsSchema } from 'api-contracts';
import { workspaceRoute } from '@/server/workspace-route';
import { serverApi } from '@/server/auth-api';
import { DashboardShell } from '@/components/dashboard-shell';
import { RealQrStudio } from '@/features/qr/real-qr-studio';
export const dynamic = 'force-dynamic';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ workspace?: string }>;
}) {
  const query = await searchParams;
  const state = await workspaceRoute(query.workspace);
  if (
    state.destination !== 'dashboard' ||
    !state.workspace ||
    !state.onboarding
  )
    redirect('/workspace');
  const response = await serverApi(
    `workspaces/${state.workspace.id}/locations`,
  );
  if (!response.ok) throw new Error('QR settings unavailable');
  const locations = qrLocationsSchema.parse(await response.json());
  return (
    <DashboardShell
      real={{
        workspace: state.workspace,
        onboarding: state.onboarding,
        workspaces: state.workspaces,
        userId: state.session.user.id,
      }}
    >
      <RealQrStudio
        key={state.workspace.id}
        workspaceId={state.workspace.id}
        owner={state.workspace.role === 'OWNER'}
        locations={locations}
      />
    </DashboardShell>
  );
}

import 'server-only';
import { redirect } from 'next/navigation';
import { Workspace } from '@/features/auth/workspace';
import { workspaceRoute } from '@/server/workspace-route';
export const dynamic = 'force-dynamic';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ workspace?: string; edit?: string }>;
}) {
  const query = await searchParams;
  const state = await workspaceRoute(
    query.workspace,
    query.edit === 'business',
  );
  if (
    state.workspace &&
    state.destination === 'dashboard' &&
    query.edit !== 'business'
  )
    redirect(`/workspace/dashboard?workspace=${state.workspace.id}`);
  return (
    <Workspace key={state.session.user.id} initialSession={state.session} />
  );
}

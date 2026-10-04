import 'server-only';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import {
  accountDestination,
  workspacesSchema,
  onboardingSchema,
} from 'api-contracts';
import { serverApi, serverSession } from './auth-api';

export async function workspaceRoute(requested?: string, edit = false) {
  const session = await serverSession();
  if (!session) redirect('/login');
  if (!session.user.emailVerified) redirect('/verify-email');
  const response = await serverApi('workspaces');
  if (!response.ok) throw new Error('Workspaces unavailable');
  const workspaces = workspacesSchema.parse(await response.json());
  const remembered = (await cookies()).get(
    `rp_workspace_${session.user.id}`,
  )?.value;
  const workspace = requested
    ? workspaces.find((item) => item.id === requested)
    : (workspaces.find((item) => item.id === remembered) ?? workspaces[0]);
  if (requested && !workspace) notFound();
  if (edit && workspace?.role !== 'OWNER') notFound();
  let onboarding = null;
  if (workspace) {
    const result = await serverApi(`workspaces/${workspace.id}/onboarding`);
    if (result.status === 403 || result.status === 404) notFound();
    if (!result.ok) throw new Error('Business setup unavailable');
    onboarding = onboardingSchema.parse(await result.json());
  }
  return {
    session,
    workspaces,
    workspace,
    onboarding,
    destination: accountDestination(
      session,
      workspace,
      onboarding?.completedAt ?? null,
    ),
  };
}

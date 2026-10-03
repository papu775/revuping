import { redirect } from 'next/navigation';
import { serverSession } from '@/server/auth-api';
import { Workspace } from '@/features/auth/workspace';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const session = await serverSession();
  if (!session) redirect('/login');
  return <Workspace key={session.user.id} initialSession={session} />;
}
import 'server-only';

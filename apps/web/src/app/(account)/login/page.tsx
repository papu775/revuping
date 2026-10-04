import 'server-only';
import { redirect } from 'next/navigation';
import { serverSession } from '@/server/auth-api';
import { Auth } from '@/features/auth/auth';
export default async function Page() {
  const session = await serverSession();
  if (session)
    redirect(session.user.emailVerified ? '/workspace' : '/verify-email');
  return <Auth />;
}

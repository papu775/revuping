import 'server-only';
import { redirect } from 'next/navigation';
import { serverSession } from '@/server/auth-api';
import { AccountHeader } from '@/components/account-header';
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await serverSession())) redirect('/login');
  return (
    <>
      <AccountHeader />
      {children}
    </>
  );
}

'use client';
import { refreshAccountRoutes } from '@/app/account-actions';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Logo } from './shared';
import { ThemeControl } from './theme';
import { Button } from './ui/button';
import { authRequest } from '@/data-access/auth-client';
export function AccountHeader() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  return (
    <header className="account-header dashboard-topbar sticky top-0 z-50 flex min-h-[77px] items-center justify-between gap-3 border-b border-line bg-canvas px-6 py-3 max-[600px]:px-4">
      <Logo />
      <div className="topbar-right !gap-2">
        {error && (
          <span role="alert" className="text-sm text-danger">
            {error}
          </span>
        )}
        <ThemeControl />
        <Button
          variant="secondary"
          disabled={pending}
          onClick={async () => {
            setPending(true);
            setError('');
            try {
              await authRequest('auth/logout', 'message', {}, 'POST');
              await refreshAccountRoutes();
              router.replace('/login');
            } catch {
              setPending(false);
              setError('Unable to log out. Please retry.');
            }
          }}
        >
          Log out
        </Button>
      </div>
    </header>
  );
}

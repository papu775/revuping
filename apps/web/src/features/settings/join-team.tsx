'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  acceptInvitationSchema,
  settingsErrorMessage,
  type SessionResponse,
} from 'api-contracts';
import { refreshAccountRoutes } from '@/app/account-actions';
import { authRequest } from '@/data-access/auth-client';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/shared';
export function JoinTeam() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get(
      'token',
    );
    if (value && acceptInvitationSchema.safeParse({ token: value }).success) {
      setToken(value);
      window.history.replaceState(
        window.history.state,
        '',
        window.location.pathname,
      );
    }
    let alive = true;
    authRequest('auth/session', 'session')
      .then((v) => {
        if (alive) setSession(v);
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setChecking(false);
      });
    return () => {
      alive = false;
    };
  }, []);
  return (
    <section className="auth-form-side">
      <div className="auth-form">
        <span className="eyebrow">Your team invitation</span>
        <h1>Join a workspace</h1>
        <p>
          Accept only an invitation you expected. Log in with the invited email
          address and verify it first.
        </p>
        {checking ? (
          <p role="status">Checking your session…</p>
        ) : !session ? (
          <>
            <p>
              After login or verification, reopen the latest link from your
              invitation email. No access is granted until you confirm
              acceptance.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/signup">Create account</Link>
              </Button>
            </div>
          </>
        ) : !session.user.emailVerified ? (
          <Button asChild>
            <Link href="/verify-email">Verify your email</Link>
          </Button>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!acceptInvitationSchema.safeParse({ token }).success) {
                setError(
                  'Open the latest invitation email or paste its token.',
                );
                return;
              }
              setBusy(true);
              setError('');
              authRequest('team-invitations/accept', 'workspace', { token })
                .then(async (workspace) => {
                  await refreshAccountRoutes();
                  router.replace(`/workspace?workspace=${workspace.id}`);
                })
                .catch((e) => {
                  setError(settingsErrorMessage(e));
                  setBusy(false);
                });
            }}
          >
            <p>Signed in as {session.user.email}.</p>
            <Field>
              Invitation token
              <input
                type="password"
                autoComplete="off"
                value={token}
                maxLength={43}
                disabled={busy}
                onChange={(e) => setToken(e.target.value)}
              />
            </Field>
            {error && (
              <p role="alert" className="error-text">
                {error}
              </p>
            )}
            <Button type="submit" disabled={busy} aria-busy={busy}>
              {busy ? 'Joining…' : 'Accept invitation'}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}

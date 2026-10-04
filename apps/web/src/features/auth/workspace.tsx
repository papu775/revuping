'use client';
import { refreshAccountRoutes } from '@/app/account-actions';
import { BrandScene } from '@/components/brand-scene';
import { BusinessSetup } from './business-setup';
import { Select } from '@/components/ui/select';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ApiRequestError,
  authErrorMessage,
  type SessionResponse,
  type WorkspaceResponse,
} from 'api-contracts';
import { authRequest } from '@/data-access/auth-client';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/shared';
import { PageHeading } from '@/components/ui/page-heading';
import { useAuthAction } from './use-auth-action';
import { AuthBlocker } from './auth-blocker';
import { useToast } from '@/components/ui/toaster';

export function Workspace({
  initialSession,
}: {
  initialSession: SessionResponse;
}) {
  const router = useRouter();
  const requestedWorkspace = useSearchParams().get('workspace');
  const authAction = useAuthAction();
  const toast = useToast();
  const [session, setSession] = useState(initialSession);
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [selected, setSelected] = useState('');
  const [name, setName] = useState('');
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const busy = useRef(false);
  const generation = useRef(0);
  const account = useRef(initialSession.user.id);
  const fail = useCallback(
    (error: unknown) => {
      if (error instanceof ApiRequestError && error.status === 401) {
        generation.current++;
        setWorkspaces([]);
        setSelected('');
        router.replace('/login');
      } else setError(authErrorMessage(error));
    },
    [router],
  );
  const load = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true);
    try {
      const restored = await authRequest('auth/session', 'session');
      if (current !== generation.current) return;
      if (account.current !== restored.user.id) {
        account.current = restored.user.id;
        setWorkspaces([]);
        setSelected('');
        setName('');
        setNotice('');
      }
      setSession(restored);
      if (!restored.user.emailVerified) {
        router.replace('/verify-email');
        return;
      }
      const list = restored.user.emailVerified
        ? await authRequest('workspaces', 'workspaces')
        : [];
      if (current !== generation.current) return;
      setSession(restored);
      setWorkspaces(list);
      const requested = requestedWorkspace;
      if (requested && !list.some((item) => item.id === requested)) {
        setError('This workspace is unavailable.');
        setSelected('');
        return;
      }
      const chosen =
        list.find((item) => item.id === requested) ??
        list.find((item) =>
          document.cookie
            .split('; ')
            .includes(`rp_workspace_${restored.user.id}=${item.id}`),
        ) ??
        list[0];
      if (chosen)
        document.cookie = `rp_workspace_${restored.user.id}=${chosen.id}; Path=/; SameSite=Lax; Max-Age=31536000${location.protocol === 'https:' ? '; Secure' : ''}`;

      setSelected((id) =>
        requested && list.some((item) => item.id === requested)
          ? requested
          : list.some((item) => item.id === id)
            ? id
            : (list.find(
                (item) =>
                  item.id ===
                  new URLSearchParams(window.location.search).get('workspace'),
              )?.id ??
              chosen?.id ??
              ''),
      );
      setError('');
    } catch (error) {
      if (current === generation.current) fail(error);
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [fail, requestedWorkspace]);
  useEffect(() => {
    void load();
    const onFocus = () => {
      void load();
    };
    window.addEventListener('focus', onFocus);
    const timer = setInterval(onFocus, 60000);
    return () => {
      generation.current++;
      window.removeEventListener('focus', onFocus);
      clearInterval(timer);
    };
  }, [load]);
  const run = async (action: () => Promise<void>) => {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError('');
    setNotice('');
    try {
      await action();
    } catch (error) {
      fail(error);
    } finally {
      busy.current = false;
      setPending(false);
    }
  };
  const workspace = workspaces.find((item) => item.id === selected);
  useEffect(() => {
    setName(workspace?.name ?? '');
  }, [workspace?.id, workspace?.name]);
  return (
    <AuthBlocker label={authAction.label}>
      <div className="dashboard-shell visual-shell min-h-screen bg-canvas">
        <BrandScene backdrop />
        <main className="setup-shell break-words">
          <PageHeading
            eyebrow="Your account"
            title={
              session.user.displayName
                ? `Welcome, ${session.user.displayName}`
                : 'Your workspace'
            }
            text={session.user.email}
          />
          {error && (
            <p className="error-note" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="info-banner" role="status">
              {notice}
            </p>
          )}
          {!session.user.emailVerified ? (
            <section className="auth-form !py-4">
              <h2 className="!text-2xl !leading-tight">Verify your email</h2>
              <p>Check your inbox before opening a workspace.</p>
              <Button
                disabled={pending}
                onClick={() =>
                  void authAction.run(
                    'Requesting verification email…',
                    (signal) =>
                      authRequest(
                        'auth/resend-verification',
                        'message',
                        { email: session.user.email },
                        'POST',
                        signal,
                      ),
                    () => {
                      const message =
                        'If your account is eligible, a verification email has been sent. Check your inbox and spam folder.';
                      setNotice(message);
                      toast(message, 'info');
                    },
                    (error) => {
                      fail(error);
                      toast(authErrorMessage(error), 'error');
                    },
                  )
                }
              >
                Resend verification email
              </Button>
              <Button
                variant="secondary"
                disabled={pending}
                onClick={() => void load()}
              >
                I’ve verified my email
              </Button>
            </section>
          ) : (requestedWorkspace && workspace?.id !== requestedWorkspace) ||
            (loading && !workspace) ? (
            <p role="status">Loading your workspaces…</p>
          ) : (
            <>
              {workspaces.length > 1 && (
                <div className="mb-6">
                  <Select
                    label="Workspace"
                    value={selected}
                    onValueChange={async (id) => {
                      await refreshAccountRoutes();
                      document.cookie = `rp_workspace_${session.user.id}=${id}; Path=/; SameSite=Lax; Max-Age=31536000${location.protocol === 'https:' ? '; Secure' : ''}`;
                      router.replace(`/workspace?workspace=${id}`);
                    }}
                    options={workspaces.map((item) => ({
                      value: item.id,
                      label: `${item.name} · ${item.role}`,
                    }))}
                  />
                </div>
              )}
              {workspace ? (
                <BusinessSetup
                  key={workspace.id}
                  id={workspace.id}
                  owner={workspace.role === 'OWNER'}
                />
              ) : (
                <section className="setup-card initial-setup">
                  <div>
                    <h2>Let’s set up your business</h2>
                    <Button asChild variant="secondary">
                      <Link href="/join-team">Join an invited workspace</Link>
                    </Button>
                    <p>
                      Start with your business name. We’ll use it for your
                      workspace too.
                    </p>
                    <form
                      className="setup-fields"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void run(async () => {
                          const created = await authRequest(
                            'workspaces',
                            'workspace',
                            { name, key: 'initial-workspace' },
                          );
                          await refreshAccountRoutes();
                          setSelected(created.id);
                          await load();
                          toast('Workspace created.');
                        });
                      }}
                    >
                      <Field>
                        Business name
                        <input
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          required
                          maxLength={100}
                        />
                      </Field>
                      <Button type="submit" disabled={pending || !name.trim()}>
                        Continue setup
                      </Button>
                    </form>
                  </div>
                  <aside className="initial-guidance">
                    <BrandScene />
                    <h3>A familiar face for your business</h3>
                    <p>
                      Add your logo, location and hours. Review everything
                      before finishing.
                    </p>
                  </aside>
                </section>
              )}
            </>
          )}
          <footer className="setup-account-footer">
            <Button asChild variant="ghost" size="small">
              <Link href="/dashboard">Explore the separate fictional demo</Link>
            </Button>
            <details>
              <summary>Account actions</summary>
              <Button
                variant="ghost"
                disabled={pending}
                onClick={() =>
                  void authAction.run(
                    'Logging out all sessions…',
                    async (signal) => {
                      const result = await authRequest(
                        'auth/logout-all',
                        'message',
                        {},
                        'POST',
                        signal,
                      );
                      await refreshAccountRoutes();
                      return result;
                    },
                    () => {
                      generation.current++;
                      setWorkspaces([]);
                      router.replace('/login');

                      toast('All sessions logged out.');
                    },
                    (error) => {
                      fail(error);
                      toast(authErrorMessage(error), 'error');
                    },
                  )
                }
              >
                Log out all sessions
              </Button>
            </details>
          </footer>
        </main>
      </div>
    </AuthBlocker>
  );
}

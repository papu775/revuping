'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PasswordField } from '@/components/ui/password-field';
import { Field, Logo } from '@/components/shared';
import { authRequest } from '@/data-access/auth-client';
import { authErrorMessage } from 'api-contracts';
import { useToast } from '@/components/ui/toaster';
import { useAuthAction } from './use-auth-action';
import { AuthBlocker } from './auth-blocker';
export function EmailAction({ kind }: { kind: 'verify' | 'forgot' | 'reset' }) {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const passwordError =
    passwordTouched && (password.length < 12 || password.length > 128)
      ? 'Use 12–128 characters.'
      : '';
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState<
    'checking' | 'waiting' | 'verified' | 'invalid' | 'failure'
  >(kind === 'verify' ? 'checking' : 'waiting');
  const [authenticated, setAuthenticated] = useState(false);
  const { pending, label, run } = useAuthAction();
  const toast = useToast();
  const attempted = useRef(false);
  useEffect(() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get(
      'token',
    );
    if (value) {
      setToken(value);
      window.history.replaceState(null, '', window.location.pathname);
    }
    if (kind !== 'verify') return;
    let alive = true;
    const check = async () => {
      try {
        const session = await authRequest('auth/session', 'session');
        if (alive) {
          setAuthenticated(true);
          if (session.user.emailVerified) setStatus('verified');
          else if (!value) setStatus('waiting');
        }
      } catch {
        if (alive) {
          setAuthenticated(false);
          if (!value) setStatus('waiting');
        }
      }
    };
    void check();
    window.addEventListener('focus', check);
    return () => {
      alive = false;
      window.removeEventListener('focus', check);
    };
  }, [kind]);
  useEffect(() => {
    if (kind !== 'verify' || !token || attempted.current) return;
    attempted.current = true;
    void run(
      'Verifying your email…',
      async (signal) => {
        try {
          await authRequest(
            'auth/verify-email',
            'message',
            { token },
            'POST',
            signal,
          );
        } catch (error) {
          const current = await authRequest(
            'auth/session',
            'session',
            undefined,
            'GET',
            signal,
          ).catch(() => null);
          if (current?.user.emailVerified) return current;
          throw error;
        }
        // Verification success is authoritative, session refresh only chooses the CTA.
        return authRequest(
          'auth/session',
          'session',
          undefined,
          'GET',
          signal,
        ).catch(() => null);
      },
      (session) => {
        setStatus('verified');
        setAuthenticated(!!session);
        setToken('');
        toast('Email verified.');
      },
      (error) => {
        const invalid = (error as { status?: number }).status === 400;
        setStatus(invalid ? 'invalid' : 'failure');
        setError(
          invalid
            ? 'This verification link is expired, invalid or already used. Request a fresh link.'
            : authErrorMessage(error),
        );
      },
    );
  }, [kind, token, run, toast]);
  const success = kind === 'verify' && status === 'verified';
  const title = success
    ? 'Email verified'
    : kind === 'verify'
      ? 'Verify your email'
      : kind === 'forgot'
        ? 'Forgot your password?'
        : 'Choose a new password';
  return (
    <AuthBlocker label={label}>
      <main className="auth-page">
        <section className="auth-story">
          <Logo light />
          <div className="auth-story-copy">
            <h2>A fresh start.</h2>
            <p>Keep your account secure and your workspace yours.</p>
          </div>
        </section>
        <section className="auth-form-side">
          <div className="auth-form">
            <Logo />
            {success && <CheckCircle2 size={40} className="text-accent mb-5" />}
            <h1>{title}</h1>
            {success ? (
              <>
                <p>Your email is confirmed. Business setup is the next step.</p>
                <Button asChild className="mt-6">
                  <Link href={authenticated ? '/workspace' : '/login'}>
                    {authenticated ? 'Continue setup' : 'Log in'}
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <p>
                  {kind === 'verify'
                    ? status === 'checking'
                      ? 'Checking your verification link…'
                      : 'Open the link in your email, or request another verification email.'
                    : kind === 'forgot'
                      ? 'We’ll email a reset link if your account is eligible.'
                      : 'Use 12–128 characters. Resetting signs out all your sessions.'}
                </p>
                <form
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (pending) return;
                    const form = new FormData(event.currentTarget);
                    if (
                      kind === 'reset' &&
                      (password.length < 12 || password.length > 128)
                    ) {
                      setPasswordTouched(true);
                      const element = event.currentTarget;
                      requestAnimationFrame(() =>
                        element
                          .querySelector<HTMLInputElement>('input')
                          ?.focus(),
                      );
                      return;
                    }
                    setError('');
                    setNotice('');
                    const path =
                      kind === 'reset'
                        ? 'reset-password'
                        : kind === 'forgot'
                          ? 'forgot-password'
                          : 'resend-verification';
                    const body =
                      kind === 'reset'
                        ? { token, password }
                        : { email: String(form.get('email')) };
                    await run(
                      kind === 'reset'
                        ? 'Resetting your password…'
                        : kind === 'forgot'
                          ? 'Requesting reset link…'
                          : 'Requesting verification email…',
                      (signal) =>
                        authRequest(
                          `auth/${path}`,
                          'message',
                          body,
                          'POST',
                          signal,
                        ),
                      () => {
                        const message =
                          kind === 'reset'
                            ? 'Password reset. Log in with your new password.'
                            : 'If your account is eligible, an email has been sent. Check your inbox and spam folder.';
                        setNotice(message);
                        toast(message, kind === 'reset' ? 'success' : 'info');
                        setPassword('');
                        if (kind === 'reset') {
                          setToken('');
                          setPasswordTouched(false);
                        }
                      },
                      (error) => setError(authErrorMessage(error)),
                    );
                  }}
                >
                  {(kind === 'forgot' ||
                    (kind === 'verify' && status !== 'checking')) && (
                    <Field>
                      Email address
                      <input
                        name="email"
                        type="email"
                        required
                        maxLength={254}
                        autoComplete="email"
                      />
                    </Field>
                  )}
                  {kind === 'reset' && (
                    <Field>
                      New password
                      <PasswordField
                        aria-label="New password"
                        onBlur={() => setPasswordTouched(true)}
                        aria-invalid={!!passwordError}
                        aria-describedby={
                          passwordError ? 'reset-password-error' : undefined
                        }
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        minLength={12}
                        autoComplete="new-password"
                      />
                      {passwordError && (
                        <span
                          className="field-error"
                          id="reset-password-error"
                          role="alert"
                        >
                          {passwordError}
                        </span>
                      )}
                    </Field>
                  )}
                  {kind === 'reset' && !token && !notice && (
                    <p role="alert">
                      Open a valid reset link from your email.{' '}
                      <Link href="/forgot-password">Request another link</Link>
                    </p>
                  )}
                  {error && (
                    <p className="error-note" role="alert">
                      {error}
                    </p>
                  )}
                  {notice && <p className="info-banner">{notice}</p>}
                  {(kind !== 'verify' || status !== 'checking') && (
                    <Button
                      type="submit"
                      disabled={pending || (kind === 'reset' && !token)}
                    >
                      {kind === 'reset'
                        ? 'Reset password'
                        : kind === 'forgot'
                          ? 'Request reset link'
                          : 'Resend verification email'}
                    </Button>
                  )}
                </form>
                <p className="auth-switch">
                  <Link href="/login">Back to login</Link> ·{' '}
                  <Link href="/workspace">Open workspace</Link>
                </p>
              </>
            )}
          </div>
        </section>
      </main>
    </AuthBlocker>
  );
}

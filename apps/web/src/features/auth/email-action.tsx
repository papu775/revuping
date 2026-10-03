'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PasswordField } from '@/components/ui/password-field';
import { Field, Logo } from '@/components/shared';
import { authRequest } from '@/data-access/auth-client';
import { authErrorMessage } from 'api-contracts';

export function EmailAction({ kind }: { kind: 'verify' | 'forgot' | 'reset' }) {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  useEffect(() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get(
      'token',
    );
    if (value) {
      setToken(value);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);
  const title =
    kind === 'verify'
      ? 'Verify your email'
      : kind === 'forgot'
        ? 'Forgot your password?'
        : 'Choose a new password';
  return (
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
          <h1>{title}</h1>
          <p>
            {kind === 'verify'
              ? 'Open the link in your email, or request another verification email.'
              : kind === 'forgot'
                ? 'We’ll email a reset link if your account is eligible.'
                : 'Use 12–128 characters. Resetting signs out all your sessions.'}
          </p>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              if (submitting.current) return;
              const form = new FormData(event.currentTarget);
              submitting.current = true;
              setPending(true);
              setError('');
              setNotice('');
              try {
                const path =
                  kind === 'reset'
                    ? 'reset-password'
                    : kind === 'forgot'
                      ? 'forgot-password'
                      : token
                        ? 'verify-email'
                        : 'resend-verification';
                const body =
                  kind === 'reset'
                    ? { token, password }
                    : kind === 'verify' && token
                      ? { token }
                      : { email: String(form.get('email')) };
                const result = await authRequest(
                  `auth/${path}`,
                  'message',
                  body,
                );
                setNotice(result.message);
                setPassword('');
                if (token) setToken('');
              } catch (error) {
                setError(authErrorMessage(error));
              } finally {
                submitting.current = false;
                setPending(false);
              }
            }}
          >
            {(kind === 'forgot' || (kind === 'verify' && !token)) && (
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
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={12}
                  autoComplete="new-password"
                />
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
            {notice && (
              <p className="info-banner" role="status">
                {notice}
              </p>
            )}
            <Button
              type="submit"
              disabled={pending || (kind === 'reset' && !token)}
              aria-busy={pending}
            >
              {pending
                ? 'Please wait…'
                : kind === 'reset'
                  ? 'Reset password'
                  : kind === 'forgot'
                    ? 'Request reset link'
                    : token
                      ? 'Verify email'
                      : 'Resend verification email'}
            </Button>
          </form>
          <p className="auth-switch">
            <Link href="/login">Back to login</Link> ·{' '}
            <Link href="/workspace">Open workspace</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

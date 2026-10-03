'use client';
import { PasswordField } from '@/components/ui/password-field';
import { ConversationCurves } from '@/components/conversation-curves';
import { FloatingSample } from '@/components/template-motion';
import { Avatar } from '@/components/ui/avatar';
import { Field } from '@/components/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authRequest } from '@/data-access/auth-client';
import {
  authErrorMessage,
  registrationSuccessMessage,
  registrationUnconfirmedMessage,
  registrationVerificationUnavailable,
  registrationVerificationUnavailableMessage,
} from 'api-contracts';
import { useToast } from '@/components/ui/toaster';
import { useAuthAction } from './use-auth-action';
import { AuthBlocker } from './auth-blocker';
import { ArrowRight, Send, MessageSquare, Check } from 'lucide-react';
import { Logo, Stars } from '@/components/shared';
import { Button } from '@/components/ui/button';
export function Auth({ signup = false }: { signup?: boolean }) {
  const router = useRouter();
  const { pending, label, run } = useAuthAction();
  const toast = useToast();
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  return (
    <AuthBlocker label={label}>
      <main className="auth-page">
        <section className="auth-story">
          <ConversationCurves
            variant="auth"
            className="-right-16 top-5 h-[420px] w-[380px]"
          />
          <Logo light />
          <div className="auth-story-copy mx-auto w-full max-w-[520px]">
            <span className="eyebrow">The work behind a good review</span>
            <h2>
              Less chasing.
              <br />
              <em>More listening.</em>
            </h2>
            <p>
              Requests, private feedback and thoughtful replies. One place to
              take the next step.
            </p>
            <div
              className="auth-product-composition grid gap-6 py-2"
              aria-hidden="true"
            >
              <FloatingSample
                className="auth-product-card mr-7 -rotate-1"
                amplitude={5}
                duration={7}
              >
                <span className="auth-card-label">
                  <MessageSquare size={17} /> PRIVATE FEEDBACK · DEMO
                </span>
                <div className="auth-card-person">
                  <Avatar initials={'JW'} tone="peach" />
                  <div>
                    <strong>James Wilson</strong>
                    <small>Today, 9:18 am · Alex</small>
                  </div>
                  <Stars rating={3} />
                </div>
                <p>
                  “Happy with the haircut, but a little heads-up about the wait
                  would have helped.”
                </p>
                <div className="auth-card-note">
                  <Check size={17} /> Next step: follow up with James
                </div>
              </FloatingSample>
              <FloatingSample
                className="auth-product-card auth-request-card ml-7 rotate-1"
                amplitude={4}
                duration={8.5}
              >
                <span className="auth-card-label">
                  <Send size={17} /> REQUEST PREVIEW
                </span>
                <strong>Thanks for visiting, Olivia.</strong>
                <p>Have a moment to tell us how it went?</p>
                <span className="auth-card-note">
                  <Check size={17} /> Consent recorded · Nothing sent
                </span>
              </FloatingSample>
            </div>
          </div>
          <span className="auth-story-foot">
            Fictional salon. Real workflows to explore.
          </span>
        </section>
        <section className="auth-form-side">
          <div className="auth-mobile-logo max-[800px]:!block">
            <Logo />
          </div>
          <Link
            href="/"
            className="auth-back max-[800px]:absolute max-[800px]:right-6 max-[800px]:top-9"
          >
            ← Back to RevuPing
          </Link>
          <div className="auth-form">
            <span className="eyebrow">
              {signup ? 'Your next chapter' : 'Welcome to RevuPing'}
            </span>
            <h1>{signup ? 'Create your account' : 'Log in'}</h1>
            <p>
              {signup
                ? 'Verify your email, then create your workspace.'
                : 'Open your RevuPing workspace.'}
            </p>
            <div className="auth-demo-note">
              <Check size={16} />
              <span>
                Want to explore first? Demo access uses fictional data and needs
                no account.
              </span>
            </div>
            <Button asChild className="auth-demo-entry">
              <Link href="/dashboard">
                Continue with demo access <ArrowRight size={17} />
              </Link>
            </Button>
            <div className="auth-divider">
              <span>
                or {signup ? 'create a real account' : 'log in to your account'}
              </span>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (pending || registeredEmail) return;
                if (signup && (password.length < 12 || password.length > 128)) {
                  setError(
                    'Use between 12 and 128 characters for your password.',
                  );
                  return;
                }
                const form = new FormData(e.currentTarget);
                setError('');
                setNotice('');
                const input = { email: String(form.get('email')), password };
                await run<unknown>(
                  signup ? 'Creating your account…' : 'Logging you in…',
                  (signal) =>
                    signup
                      ? authRequest(
                          'auth/register',
                          'message',
                          {
                            ...input,
                            displayName: String(form.get('displayName')),
                          },
                          'POST',
                          signal,
                        )
                      : authRequest(
                          'auth/login',
                          'session',
                          input,
                          'POST',
                          signal,
                        ),
                  () => {
                    setPassword('');
                    if (signup) {
                      setRegisteredEmail(input.email);
                      setNotice(registrationSuccessMessage);
                      toast(registrationSuccessMessage);
                    } else {
                      toast('You’re logged in.');
                      router.replace('/workspace');
                      router.refresh();
                    }
                  },
                  (error) => {
                    if (signup && registrationVerificationUnavailable(error)) {
                      setRegisteredEmail(input.email);
                      setPassword('');
                      setNotice(registrationVerificationUnavailableMessage);
                      toast(registrationVerificationUnavailableMessage, 'info');
                    } else {
                      const message =
                        signup &&
                        (!(
                          typeof error === 'object' &&
                          error !== null &&
                          'status' in error
                        ) ||
                          Number(error.status) >= 500)
                          ? registrationUnconfirmedMessage
                          : authErrorMessage(error);
                      setError(message);
                      toast(message, 'error');
                    }
                  },
                );
              }}
            >
              {signup && (
                <Field>
                  Your name
                  <input
                    name="displayName"
                    readOnly={!!registeredEmail}
                    required
                    maxLength={100}
                    autoComplete="name"
                    placeholder="Your name"
                  />
                </Field>
              )}
              <Field>
                Email address
                <input
                  type="email"
                  name="email"
                  readOnly={!!registeredEmail}
                  required
                  maxLength={254}
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </Field>
              <Field>
                Password
                <PasswordField
                  readOnly={!!registeredEmail}
                  required
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError('');
                  }}
                  autoComplete={signup ? 'new-password' : 'current-password'}
                  placeholder={signup ? '12–128 characters' : 'Your password'}
                  aria-invalid={!!error}
                  aria-describedby={error ? 'auth-error' : undefined}
                />
              </Field>
              {error && (
                <p className="error-note" role="alert" id="auth-error">
                  {error}
                </p>
              )}
              {notice && (
                <p className="info-banner auth-verification-guidance">
                  {notice} <Link href="/login">Log in</Link>{' '}
                  <Link href="/verify-email">Open verification</Link>
                </p>
              )}
              <Button
                type="submit"
                variant="secondary"
                disabled={pending || !!registeredEmail}
                aria-busy={pending}
              >
                <span className="action-label">
                  <span className="reserved-label" aria-hidden="true">
                    {signup ? 'Create account' : 'Log in'}
                  </span>
                  <span>
                    {pending
                      ? 'Please wait…'
                      : signup
                        ? 'Create account'
                        : 'Log in'}
                  </span>
                </span>
                <ArrowRight size={17} />
              </Button>
            </form>
            {!!registeredEmail && (
              <div className="mt-4 grid gap-3">
                <p>
                  Check your inbox and spam folder. Verify your email before
                  opening a workspace.
                </p>
                <Button
                  variant="secondary"
                  disabled={pending}
                  onClick={() =>
                    void run(
                      'Requesting verification email…',
                      (signal) =>
                        authRequest(
                          'auth/resend-verification',
                          'message',
                          { email: registeredEmail },
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
                        const message = authErrorMessage(error);
                        setError(message);
                        toast(message, 'error');
                      },
                    )
                  }
                >
                  Resend verification email
                </Button>
              </div>
            )}
            <p className="auth-switch">
              {signup ? 'Already have an account?' : 'New to RevuPing?'}{' '}
              <Link href={signup ? '/login' : '/signup'}>
                {signup ? 'Log in' : 'Create an account'}
              </Link>
            </p>
            <p className="auth-switch">
              <Link href="/forgot-password">Forgot your password?</Link> ·{' '}
              <Link href="/verify-email">Verify your email</Link>
            </p>
            <p className="auth-disclaimer">
              Your account and the fictional demo workspace stay separate.
            </p>
          </div>
        </section>
      </main>
    </AuthBlocker>
  );
}

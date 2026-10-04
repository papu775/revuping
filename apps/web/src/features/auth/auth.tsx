'use client';
import { refreshAccountRoutes } from '@/app/account-actions';
import { PasswordField } from '@/components/ui/password-field';
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
import { ArrowRight, Check } from 'lucide-react';
import { Logo } from '@/components/shared';
import { Button } from '@/components/ui/button';
export function Auth({ signup = false }: { signup?: boolean }) {
  const router = useRouter();
  const { pending, label, run } = useAuthAction();
  const toast = useToast();
  const [navigating, setNavigating] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const validate = (name: string, value: string) =>
    name === 'password'
      ? !value
        ? 'Enter your password.'
        : signup && (value.length < 12 || value.length > 128)
          ? 'Use 12–128 characters.'
          : ''
      : name === 'email'
        ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
          ? 'Enter a valid email address.'
          : ''
        : !value.trim()
          ? 'Enter your name.'
          : '';
  const checkField = (name: string, value: string) =>
    setFieldErrors((current) => ({
      ...current,
      [name]: validate(name, value),
    }));
  return (
    <AuthBlocker label={navigating ? 'Opening your workspace…' : label}>
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
          <h1>
            {registeredEmail
              ? 'Check your email'
              : signup
                ? 'Create your account'
                : 'Log in'}
          </h1>
          <p>
            {registeredEmail
              ? `We’ve created your account for ${registeredEmail}.`
              : signup
                ? 'Verify your email, then create your workspace.'
                : 'Open your RevuPing workspace.'}
          </p>
          {!registeredEmail && (
            <>
              <div className="auth-demo-note">
                <Check size={16} />
                <span>
                  Want to explore first? Demo access uses fictional data and
                  needs no account.
                </span>
              </div>
              <Button asChild className="auth-demo-entry">
                <Link href="/dashboard">
                  Continue with demo access <ArrowRight size={17} />
                </Link>
              </Button>
              <div className="auth-divider">
                <span>
                  or{' '}
                  {signup ? 'create a real account' : 'log in to your account'}
                </span>
              </div>
              <form
                noValidate
                onBlur={(event) => {
                  if (
                    event.relatedTarget instanceof HTMLButtonElement &&
                    event.relatedTarget.type === 'submit'
                  )
                    return;
                  const input = event.target;
                  if (input instanceof HTMLInputElement && input.name)
                    checkField(input.name, input.value);
                }}
                onChange={(event) => {
                  const input = event.target;
                  if (
                    input instanceof HTMLInputElement &&
                    fieldErrors[input.name]
                  )
                    checkField(input.name, input.value);
                }}
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (pending || registeredEmail) return;
                  const form = new FormData(e.currentTarget);
                  const names = signup
                    ? ['displayName', 'email', 'password']
                    : ['email', 'password'];
                  const errors = Object.fromEntries(
                    names.map((name) => [
                      name,
                      validate(
                        name,
                        name === 'password'
                          ? password
                          : String(form.get(name) ?? ''),
                      ),
                    ]),
                  );
                  setFieldErrors(errors);
                  const first = names.find((name) => errors[name]);
                  if (first) {
                    const element = e.currentTarget;
                    requestAnimationFrame(() =>
                      element
                        .querySelector<HTMLInputElement>(
                          `input[name="${first}"]`,
                        )
                        ?.focus(),
                    );
                    return;
                  }
                  setError('');
                  setNotice('');
                  const input = { email: String(form.get('email')), password };
                  await run<unknown>(
                    signup ? 'Creating your account…' : 'Logging you in…',
                    async (signal) => {
                      const result = signup
                        ? await authRequest(
                            'auth/register',
                            'message',
                            {
                              ...input,
                              displayName: String(form.get('displayName')),
                            },
                            'POST',
                            signal,
                          )
                        : await authRequest(
                            'auth/login',
                            'session',
                            input,
                            'POST',
                            signal,
                          );
                      if (!signup) await refreshAccountRoutes();
                      return result;
                    },
                    () => {
                      setPassword('');
                      if (signup) {
                        setRegisteredEmail(input.email);
                        setNotice(registrationSuccessMessage);
                        toast(registrationSuccessMessage);
                      } else {
                        setNavigating(true);
                        toast('You’re logged in.');
                        router.replace('/workspace');
                      }
                    },
                    (error) => {
                      if (
                        signup &&
                        registrationVerificationUnavailable(error)
                      ) {
                        setRegisteredEmail(input.email);
                        setPassword('');
                        setNotice(registrationVerificationUnavailableMessage);
                        toast(
                          registrationVerificationUnavailableMessage,
                          'info',
                        );
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
                      aria-label="Your name"
                      aria-invalid={!!fieldErrors.displayName}
                      aria-describedby={
                        fieldErrors.displayName ? 'name-error' : undefined
                      }
                      readOnly={!!registeredEmail}
                      required
                      maxLength={100}
                      autoComplete="name"
                      placeholder="Your name"
                    />
                    {fieldErrors.displayName && (
                      <span
                        className="field-error"
                        id="name-error"
                        role="alert"
                      >
                        {fieldErrors.displayName}
                      </span>
                    )}
                  </Field>
                )}
                <Field>
                  Email address
                  <input
                    type="email"
                    name="email"
                    aria-label="Email address"
                    aria-invalid={!!fieldErrors.email}
                    aria-describedby={
                      fieldErrors.email ? 'email-error' : undefined
                    }
                    readOnly={!!registeredEmail}
                    required
                    maxLength={254}
                    autoComplete="email"
                    placeholder="you@example.com"
                  />
                  {fieldErrors.email && (
                    <span className="field-error" id="email-error" role="alert">
                      {fieldErrors.email}
                    </span>
                  )}
                </Field>
                <Field>
                  Password
                  <PasswordField
                    name="password"
                    readOnly={!!registeredEmail}
                    required
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError('');
                    }}
                    autoComplete={signup ? 'new-password' : 'current-password'}
                    placeholder={signup ? '12–128 characters' : 'Your password'}
                    aria-invalid={!!fieldErrors.password}
                    aria-describedby={
                      fieldErrors.password
                        ? 'password-error password-help'
                        : signup
                          ? 'password-help'
                          : undefined
                    }
                  />
                  {signup && (
                    <span className="field-helper" id="password-help">
                      12–128 characters. Choose a password unique to this
                      account.
                    </span>
                  )}
                  {fieldErrors.password && (
                    <span
                      className="field-error"
                      id="password-error"
                      role="alert"
                    >
                      {fieldErrors.password}
                    </span>
                  )}
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
            </>
          )}
          {!!registeredEmail && (
            <div className="mt-6 grid gap-5" role="status">
              <p className="info-banner">{notice}</p>
              {error && (
                <p className="error-note" role="alert">
                  {error}
                </p>
              )}
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
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                <Link href="/verify-email">Open verification</Link>
                <Link href="/login">Continue to log in</Link>
              </div>
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
    </AuthBlocker>
  );
}

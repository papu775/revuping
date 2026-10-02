'use client';
import { PasswordField } from '@/components/ui/password-field';
import { HeroStatic } from '@/components/hero/hero-static';
import { ConversationCurves } from '@/components/conversation-curves';
import { FloatingSample } from '@/components/template-motion';
import { Avatar } from '@/components/ui/avatar';
import { Field } from '@/components/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { InlineSpinner } from '@/components/ui/loading';
import { useTransition, useState } from 'react';
import { ArrowRight, Send, MessageSquare, Check } from 'lucide-react';
import { Logo, Stars } from '@/components/shared';
import { Button } from '@/components/ui/button';
export function Auth({ signup = false }: { signup?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  return (
    <main className="auth-page">
      <section className="auth-story">
        <HeroStatic className="pointer-events-none absolute -right-16 bottom-0 w-[330px] opacity-[0.14]" />
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
            Requests, private feedback and thoughtful replies. One place to take
            the next step.
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
        <div className="auth-mobile-logo">
          <Logo />
        </div>
        <Link href="/" className="auth-back">
          ← Back to RevuPing
        </Link>
        <div className="auth-form">
          <span className="eyebrow">
            {signup ? 'Explore the product' : 'Welcome to RevuPing'}
          </span>
          <h1>{signup ? 'Demo signup' : 'Demo login'}</h1>
          <p>
            {signup
              ? 'Try a fictional workspace. No real credentials needed.'
              : 'Explore your business workspace with fictional data.'}
          </p>
          <div className="auth-demo-note">
            <Check size={16} />
            <span>
              No credentials needed for demo access. Use sample details in the
              form.
            </span>
          </div>
          <Button asChild className="auth-demo-entry">
            <Link href="/dashboard">
              Continue with demo access <ArrowRight size={17} />
            </Link>
          </Button>
          <div className="auth-divider">
            <span>or test the mock {signup ? 'signup' : 'login'} form</span>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (pending) return;
              if (password.length < 8) {
                setError('Use at least 8 characters for this demo password.');
                return;
              }
              startTransition(() => router.push('/dashboard'));
            }}
          >
            {signup && (
              <Field>
                Your name
                <input required autoComplete="off" placeholder="Sample owner" />
              </Field>
            )}
            <Field>
              Email address
              <input
                type="email"
                required
                autoComplete="off"
                placeholder="demo@example.com"
              />
            </Field>
            <Field>
              Password
              <PasswordField
                required
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError('');
                }}
                autoComplete="off"
                placeholder="At least 8 characters"
                aria-invalid={!!error}
                aria-describedby={error ? 'auth-error' : undefined}
              />
            </Field>
            {error && (
              <p className="error-note" role="alert" id="auth-error">
                {error}
              </p>
            )}
            <Button
              type="submit"
              variant="secondary"
              disabled={pending}
              aria-busy={pending}
            >
              <span className="action-label">
                <span className="reserved-label" aria-hidden="true">
                  {signup ? 'Create demo workspace' : 'Enter demo workspace'}
                </span>
                <span>
                  {pending
                    ? 'Opening workspace…'
                    : signup
                      ? 'Create demo workspace'
                      : 'Enter demo workspace'}
                </span>
              </span>
              {pending ? <InlineSpinner /> : <ArrowRight size={17} />}
            </Button>
          </form>
          <p className="auth-switch">
            {signup ? 'Already looking around?' : 'New to RevuPing?'}{' '}
            <Link href={signup ? '/login' : '/signup'}>
              {signup ? 'Log in to the demo' : 'Explore signup'}
            </Link>
          </p>
          {signup && (
            <p className="auth-switch">
              <Link href="/dashboard/onboarding">
                Preview business onboarding →
              </Link>
            </p>
          )}
          <p className="auth-disclaimer">
            This is a frontend prototype. Form values are not transmitted or
            stored, and no real authentication takes place.
          </p>
        </div>
      </section>
    </main>
  );
}

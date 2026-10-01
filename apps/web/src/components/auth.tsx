'use client';
import { Field } from './shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowRight,
  Send,
  MessageSquare,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Logo, Stars } from './shared';
import { Button } from './ui/button';
export function Auth({ signup = false }: { signup?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);
  const [password, setPassword] = useState('');
  return (
    <main className="auth-page">
      <section className="auth-story">
        <Logo light />
        <div className="auth-story-copy">
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
          <div className="auth-product-composition">
            <div className="auth-product-card">
              <span className="auth-card-label">
                <MessageSquare size={17} /> PRIVATE FEEDBACK · DEMO
              </span>
              <div className="auth-card-person">
                <span className="avatar peach">JW</span>
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
            </div>
            <div className="auth-product-card auth-request-card">
              <span className="auth-card-label">
                <Send size={17} /> REQUEST PREVIEW
              </span>
              <strong>Thanks for visiting, Olivia.</strong>
              <p>Have a moment to tell us how it went?</p>
              <span className="auth-card-note">
                <Check size={17} /> Consent recorded · Nothing sent
              </span>
            </div>
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
          <h1>{signup ? 'Explore demo signup.' : 'Explore your workspace.'}</h1>
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
              if (password.length < 8) {
                setError('Use at least 8 characters for this demo password.');
                return;
              }
              router.push('/dashboard');
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
              <div className="password-field">
                <input
                  aria-label="Password"
                  type={show ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  autoComplete="off"
                  placeholder="At least 8 characters"
                  aria-invalid={!!error}
                  aria-describedby={error ? 'auth-error' : undefined}
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={show ? 'Hide password' : 'Show password'}
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>
            {error && (
              <p className="error-note" role="alert" id="auth-error">
                {error}
              </p>
            )}
            <Button type="submit" variant="secondary">
              {signup ? 'Create demo workspace' : 'Enter demo workspace'}
              <ArrowRight size={17} />
            </Button>
          </form>
          <p className="auth-switch">
            {signup ? 'Already looking around?' : 'New to RevuPing?'}{' '}
            <Link href={signup ? '/login' : '/signup'}>
              {signup ? 'Log in to the demo' : 'Explore signup'}
            </Link>
          </p>
          <p className="auth-disclaimer">
            This is a frontend prototype. Form values are not transmitted or
            stored, and no real authentication takes place.
          </p>
        </div>
      </section>
    </main>
  );
}

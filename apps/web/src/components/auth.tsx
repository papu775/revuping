'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Leaf, Check, Eye, EyeOff } from 'lucide-react';
import { Logo } from './shared';
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
          <span className="eyebrow">A LITTLE CLOSER TO YOUR CUSTOMERS</span>
          <h2>
            Your craft.
            <br />
            Their stories.
            <br />
            <em>A little connection.</em>
          </h2>
          <p>
            Make room for the conversations that help your business feel more
            human.
          </p>
          <div className="auth-quote">
            <Leaf size={31} />
            <span>
              Made for the people
              <br />
              behind local businesses.
            </span>
          </div>
        </div>
        <span className="auth-story-foot">
          Less admin. More of what you love.
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
            {signup ? 'YOUR NEXT CHAPTER STARTS HERE' : 'GOOD TO HAVE YOU HERE'}
          </span>
          <h1>{signup ? 'Let’s make a little room.' : 'Welcome back.'}</h1>
          <p>
            {signup
              ? 'Explore a calmer way to care for your customers.'
              : 'A little less admin is just around the corner.'}
          </p>
          <div className="auth-demo-note">
            <Check size={16} />
            <span>Demo access only. No real account is created.</span>
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
              <label className="field">
                Your name
                <input
                  required
                  autoComplete="name"
                  placeholder="Jamie Carter"
                />
              </label>
            )}
            <label className="field">
              Email address
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@yourbusiness.com"
              />
            </label>
            <label className="field">
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
                  autoComplete={signup ? 'new-password' : 'current-password'}
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
            </label>
            {error && (
              <p className="error-note" role="alert" id="auth-error">
                {error}
              </p>
            )}
            <Button type="submit">
              {signup ? 'Create demo workspace' : 'Enter demo workspace'}
              <ArrowRight size={17} />
            </Button>
          </form>
          <div className="auth-divider">
            <span>or take a little look around</span>
          </div>
          <Button variant="secondary" asChild>
            <Link href="/dashboard">
              Continue with demo access <ArrowRight size={16} />
            </Link>
          </Button>
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

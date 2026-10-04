'use client';
import { useEffect, useRef, useState } from 'react';
import {
  publicCustomerSchema,
  feedbackInputSchema,
  feedbackReceiptSchema,
  businessBrand,
  type PublicCustomer,
} from 'api-contracts';
import { Button } from '@/components/ui/button';
import { ThemeControl } from '@/components/theme';
export function PublicCustomerPage({ publicId }: { publicId: string }) {
  const [customer, setCustomer] = useState<PublicCustomer | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [form, setForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const lock = useRef(false);
  const submission = useRef<{ payload: string; key: string } | null>(null);
  const status = useRef<HTMLDivElement>(null);
  const formHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (form) formHeading.current?.focus();
  }, [form]);
  useEffect(() => {
    if (done) status.current?.focus();
  }, [done]);
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    setError('');
    setUnavailable(false);
    fetch(`/api/backend/public/locations/${publicId}`, {
      cache: 'no-store',
      credentials: 'omit',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 404 || response.status === 400) {
          setUnavailable(true);
          return;
        }
        if (!response.ok)
          throw new Error(
            'Customer page is temporarily unavailable. Please try again.',
          );
        const data = publicCustomerSchema.parse(await response.json());
        if (!controller.signal.aborted) setCustomer(data);
      })
      .catch(() => {
        if (!alive) return;
        if (!controller.signal.aborted)
          setError(
            'Customer page is temporarily unavailable. Please try again.',
          );
        else if (timer) setError('The page could not load. Please try again.');
      })
      .finally(() => clearTimeout(timer));
    return () => {
      alive = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [publicId, attempt]);
  const brand = businessBrand(customer?.brandColor ?? '#7253bf');
  return (
    <main
      className="customer-page real-customer-page"
      style={
        {
          '--business-accent': brand.accent,
          '--business-on-accent': brand.foreground,
          '--business-focus-light': brand.lightFocus,
          '--business-focus-dark': brand.darkFocus,
        } as React.CSSProperties
      }
    >
      <div className="customer-toolbar">
        <span>Customer experience</span>
        <ThemeControl />
      </div>
      <div className="customer-card">
        {!customer ? (
          <section className="customer-loading" aria-live="polite">
            <h1>
              {unavailable
                ? 'This customer page is unavailable'
                : error
                  ? 'Unable to open this page'
                  : 'Welcome'}
            </h1>
            <p>
              {unavailable
                ? 'The link may be unavailable or the business may have disabled its page.'
                : error || 'Loading the business customer page…'}
            </p>
            {error && !unavailable && (
              <Button
                variant="secondary"
                onClick={() => setAttempt((v) => v + 1)}
              >
                Try again
              </Button>
            )}
          </section>
        ) : (
          <>
            <div className="customer-brand">
              {customer.hasLogo && !logoFailed && (
                <img
                  src={`/api/backend/public/locations/${publicId}/logo`}
                  width={120}
                  height={72}
                  alt={`${customer.name} logo`}
                  onError={() => setLogoFailed(true)}
                />
              )}
              <h1>{customer.name}</h1>
              <p>{customer.locationName}</p>
            </div>
            <h2 className="customer-welcome">{customer.displayText}</h2>
            <p className="muted">
              Your experience matters. Choose how you’d like to share it.
            </p>
            {logoFailed && (
              <p role="status" className="field-help">
                The business logo could not load. You can still share your
                experience.
              </p>
            )}
            <div className="customer-choices">
              {customer.googleReviewUrl ? (
                <Button asChild variant="secondary">
                  <a
                    href={customer.googleReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Write a Google review
                  </a>
                </Button>
              ) : (
                <Button variant="secondary" disabled>
                  Write a Google review
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => {
                  setForm(true);
                  if (done) {
                    setDone(false);
                    submission.current = null;
                    setMessage('');
                    setRating(0);
                    setName('');
                    setEmail('');
                  }
                }}
              >
                Share private feedback
              </Button>
            </div>
            {!customer.googleReviewUrl && (
              <p className="field-help">
                Google reviews are unavailable here because the business has not
                added a review link. Private feedback is available.
              </p>
            )}
            {done && (
              <div
                role="status"
                tabIndex={-1}
                ref={status}
                className="customer-success"
              >
                <h2>Thank you for your feedback.</h2>
                <p>
                  Your private feedback has been saved for {customer.name}. It
                  has not been published or sent to Google.
                </p>
              </div>
            )}
            {form && !done && (
              <form
                className="public-feedback-form"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (lock.current) return;
                  const payload = JSON.stringify({
                    rating,
                    message: message.trim(),
                    name: name.trim(),
                    email: email.trim(),
                  });
                  if (submission.current?.payload !== payload)
                    submission.current = { payload, key: crypto.randomUUID() };
                  const input = {
                    key: submission.current.key,
                    rating,
                    message,
                    name,
                    email,
                  };
                  if (!feedbackInputSchema.safeParse(input).success) {
                    setError(
                      'Choose a rating from 1 to 5 and enter a message. Check your optional email address.',
                    );
                    return;
                  }
                  lock.current = true;
                  setPending(true);
                  setError('');
                  try {
                    const response = await fetch(
                      `/api/backend/public/locations/${publicId}/feedback`,
                      {
                        method: 'POST',
                        credentials: 'omit',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(input),
                        signal: AbortSignal.timeout(15000),
                      },
                    );
                    if (!response.ok)
                      throw new Error(
                        response.status === 429
                          ? 'Too many submissions. Please wait before retrying.'
                          : response.status === 409
                            ? 'This submission key already has different feedback. Your values are preserved; change the message to start a new submission.'
                            : 'Feedback could not be saved. Your values are preserved. Please try again.',
                      );
                    feedbackReceiptSchema.parse(await response.json());
                    setDone(true);
                  } catch (e) {
                    setError(
                      e instanceof Error && !/abort|timeout/i.test(e.message)
                        ? e.message
                        : 'The response was interrupted. Your values are preserved; retry the same submission safely.',
                    );
                  } finally {
                    lock.current = false;
                    setPending(false);
                  }
                }}
              >
                <h2 ref={formHeading} tabIndex={-1}>
                  Share private feedback
                </h2>
                <p>
                  This is private feedback for the team at {customer.name}.
                  Optional contact details are only for follow-up about your
                  feedback, not marketing consent. No email or SMS is sent
                  automatically.
                </p>
                <fieldset disabled={pending}>
                  <legend>Your rating (required)</legend>
                  <div className="feedback-ratings">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <label key={n}>
                        <input
                          type="radio"
                          name="rating"
                          value={n}
                          checked={rating === n}
                          onChange={() => setRating(n)}
                          required
                          aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`}
                        />
                        <span>{n} ★</span>
                      </label>
                    ))}
                  </div>
                  <label className="field">
                    Your message (required)
                    <textarea
                      required
                      value={message}
                      maxLength={2000}
                      rows={5}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </label>
                  <label className="field">
                    Name (optional)
                    <input
                      value={name}
                      maxLength={100}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                    />
                  </label>
                  <label className="field">
                    Email (optional)
                    <input
                      type="email"
                      value={email}
                      maxLength={254}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </label>
                  {!!error && (
                    <p className="error-note" role="alert">
                      {error}
                    </p>
                  )}
                  <Button type="submit" aria-busy={pending} disabled={pending}>
                    {pending ? 'Saving feedback…' : 'Send private feedback'}
                  </Button>
                </fieldset>
              </form>
            )}
          </>
        )}
        <p className="customer-attribution">
          a little ping, powered by RevuPing
        </p>
      </div>
    </main>
  );
}

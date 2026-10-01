'use client';
import { Field } from '../../../components/shared';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import {
  Leaf,
  ArrowUpRight,
  MessageSquare,
  Star,
  ArrowLeft,
  CheckCircle2,
  Heart,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Dialog } from '../../../components/ui/dialog';
export default function CustomerPage() {
  const [form, setForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [staff, setStaff] = useState('');
  const [done, setDone] = useState(false);
  const [google, setGoogle] = useState(false);
  const reduced = useReducedMotion();
  const [textError, setTextError] = useState('');
  const textRef = useRef<HTMLTextAreaElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (done) successRef.current?.focus();
  }, [done]);
  return (
    <main className="customer-page">
      <div className="customer-demo">
        Customer experience · Interactive demo
      </div>
      <div className="customer-card">
        <div className="customer-brand">
          <span>
            <Leaf size={31} />
          </span>
          <h1>bloom & co.</h1>
          <p>Salon & beauty</p>
        </div>
        {done ? (
          <motion.div
            initial={false}
            animate={{
              opacity: reduced ? 1 : [0.7, 1],
              y: reduced ? 0 : [5, 0],
            }}
            transition={{ duration: reduced ? 0 : 0.22 }}
            className="customer-success"
            role="status"
            tabIndex={-1}
            ref={successRef}
          >
            <CheckCircle2 size={48} />
            <h2>Thank you for your feedback.</h2>
            <p>
              Your feedback has been recorded in this demo only. Nothing has
              been sent to the salon.
            </p>
            <Button
              variant="secondary"
              className="w-full flex-nowrap gap-2 px-3"
              onClick={() => setGoogle(true)}
            >
              <Star size={17} /> Leave an honest Google review{' '}
              <ArrowUpRight size={16} />
            </Button>
            <button
              className="text-link"
              onClick={() => {
                setDone(false);
                setForm(false);
                setRating(0);
                setText('');
                setTextError('');
                setStaff('');
              }}
            >
              Back to your options <ArrowLeft size={15} />
            </button>
          </motion.div>
        ) : (
          <>
            <span className="customer-greeting">Thank you for visiting</span>
            <h2>How was your visit?</h2>
            <p className="customer-intro">
              Your honest experience matters.
              <br />
              Choose the way you’d like to share it.
            </p>
            <div className="customer-options">
              <button onClick={() => setGoogle(true)}>
                <span className="option-icon">
                  <Star size={22} />
                </span>
                <span>
                  <strong>Leave a Google review</strong>
                  <small>Share your honest experience publicly.</small>
                </span>
                <ArrowUpRight size={19} />
              </button>
              <button
                className={form ? 'chosen' : ''}
                onClick={() => setForm(!form)}
                aria-expanded={form}
              >
                <span className="option-icon">
                  <MessageSquare size={22} />
                </span>
                <span>
                  <strong>Send private feedback</strong>
                  <small>Share your experience with our team.</small>
                </span>
                <ArrowUpRight size={19} />
              </button>
            </div>
            {form && (
              <form
                className="customer-form"
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!rating) return;
                  if (text.trim().length < 3) {
                    setTextError(
                      'Please describe your visit using at least 3 characters.',
                    );
                    textRef.current?.focus();
                    return;
                  }
                  setDone(true);
                }}
              >
                <fieldset>
                  <legend>Rate your visit</legend>
                  <div
                    className="rating-input"
                    aria-describedby="rating-status"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        aria-label={`${n} star${n > 1 ? 's' : ''}`}
                        aria-pressed={rating === n}
                        onClick={() => setRating(n)}
                      >
                        <Star
                          size={30}
                          fill={n <= rating ? 'currentColor' : 'none'}
                        />
                      </button>
                    ))}
                  </div>
                  <p id="rating-status" className="rating-status" role="status">
                    {rating
                      ? `${rating} out of 5 selected`
                      : 'Select a rating from 1 to 5.'}
                  </p>
                </fieldset>
                <Field>
                  Anything you’d like to share?
                  <textarea
                    ref={textRef}
                    required
                    minLength={3}
                    aria-invalid={!!textError}
                    aria-describedby={
                      textError ? 'feedback-error' : 'feedback-help'
                    }
                    rows={4}
                    placeholder="Tell us what went well or what we could improve…"
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      if (textError) setTextError('');
                    }}
                  />
                </Field>
                {textError && (
                  <p id="feedback-error" className="error-note" role="alert">
                    {textError}
                  </p>
                )}
                <Field>
                  Who looked after you?{' '}
                  <span className="optional">(optional)</span>
                  <select
                    value={staff}
                    onChange={(e) => setStaff(e.target.value)}
                  >
                    <option value="">Choose a team member</option>
                    {['Sophie', 'Alex', 'Mia'].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </Field>
                <Button type="submit" disabled={!rating}>
                  Share private feedback <Heart size={16} />
                </Button>
                <p className="field-help" id="feedback-help">
                  {!rating
                    ? 'Choose a rating to continue.'
                    : 'Your feedback stays private. No account needed.'}
                </p>
              </form>
            )}
            <p className="customer-policy">
              All experiences are welcome. The Google review option is always
              available, whatever your rating.
            </p>
          </>
        )}
        <div className="customer-powered">
          Powered by <Link href="/">revuping.</Link>
        </div>
      </div>
      <Link className="customer-back" href="/dashboard">
        ← Back to the business demo
      </Link>
      <Dialog
        open={google}
        onOpenChange={setGoogle}
        title="Your honest review is welcome."
        description="This salon is fictional, so there is no real Google review listing to open."
      >
        <div className="empty-state">
          <Star size={36} />
          <p>
            In the real product, this option would open your salon’s Google
            review page. It remains available to every customer, regardless of
            rating.
          </p>
          <Button onClick={() => setGoogle(false)}>Got it</Button>
        </div>
      </Dialog>
    </main>
  );
}

'use client';
import { useState } from 'react';
import Link from 'next/link';
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
  return (
    <main className="customer-page">
      <div className="customer-demo">
        CUSTOMER EXPERIENCE · INTERACTIVE DEMO
      </div>
      <div className="customer-card">
        <div className="customer-brand">
          <span>
            <Leaf size={31} />
          </span>
          <h1>bloom & co.</h1>
          <p>HAIR • BEAUTY • A LITTLE YOU TIME</p>
        </div>
        {done ? (
          <div className="customer-success">
            <CheckCircle2 size={48} />
            <h2>
              A little feedback.
              <br />A lot of appreciation.
            </h2>
            <p>
              Thank you for taking a moment to share. Your feedback has been
              recorded in this demo only.
            </p>
            <Button variant="secondary" onClick={() => setGoogle(true)}>
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
              }}
            >
              Back to your options <ArrowLeft size={15} />
            </button>
          </div>
        ) : (
          <>
            <span className="customer-greeting">IT WAS LOVELY HAVING YOU.</span>
            <h2>
              How was your
              <br />
              little time with us?
            </h2>
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
                  <small>A conversation just with our team.</small>
                </span>
                <ArrowUpRight size={19} />
              </button>
            </div>
            {form && (
              <form
                className="customer-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  setDone(true);
                }}
              >
                <fieldset>
                  <legend>How did your visit feel?</legend>
                  <div className="rating-input">
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
                </fieldset>
                <label className="field">
                  Anything you’d like to share?
                  <textarea
                    required
                    minLength={3}
                    rows={4}
                    placeholder="The lovely things, the little things, or what we could do better…"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                </label>
                <label className="field">
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
                </label>
                <Button type="submit" disabled={!rating}>
                  Share private feedback <Heart size={16} />
                </Button>
                <p className="field-help">
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
          A little closer, with <Link href="/">revuping.</Link>
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

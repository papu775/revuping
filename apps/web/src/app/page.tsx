'use client';
import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  MessageSquare,
  Send,
  Sparkles,
  QrCode as QrIcon,
  Menu,
  X,
  Leaf,
  ChevronDown,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Button } from '../components/ui/button';
import { Logo, Stars, Reveal, Badge, SectionTitle } from '../components/shared';
import { QrCode } from '../components/qr-code';
import { ProductShowcase } from '../components/product-showcase';
export default function Landing() {
  const [menu, setMenu] = useState(false);
  const reduce = useReducedMotion();
  return (
    <>
      <header className="site-header wrap">
        <Logo />
        <nav className={menu ? 'site-nav open' : 'site-nav'}>
          <a href="#features" onClick={() => setMenu(false)}>
            Features
          </a>
          <a href="#how-it-works" onClick={() => setMenu(false)}>
            How it works
          </a>
          <a href="#pricing" onClick={() => setMenu(false)}>
            Pricing
          </a>
        </nav>
        <div className="nav-actions">
          <Link href="/login" className="login-link">
            Log in
          </Link>
          <Button asChild size="small">
            <Link href="/dashboard">
              Try the demo <ArrowUpRight size={15} />
            </Link>
          </Button>
          <button
            className="icon-button mobile-toggle"
            onClick={() => setMenu(!menu)}
            aria-label="Toggle navigation"
            aria-expanded={menu}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main>
        <section className="hero wrap">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="small-line" /> REVIEW REQUESTS & CUSTOMER
              FEEDBACK
            </span>
            <h1>
              Reviews &amp; feedback.
              <br />
              Less busywork.
              <br />
              <span>More connection.</span>
            </h1>
            <p>
              Send review requests, collect private feedback, and prepare
              thoughtful replies in one organised workspace. Built for salons
              and the local businesses people love.
            </p>
            <div className="hero-actions">
              <Button asChild>
                <Link href="/dashboard">
                  Try the demo <ArrowRight size={18} />
                </Link>
              </Button>
              <a href="#how-it-works" className="how-link">
                <span className="play-circle">▶</span> See how it works
              </a>
            </div>
            <div className="hero-footnote">
              <Check size={14} /> No credit card <span>·</span> No setup needed{' '}
              <span>·</span> Interactive demo
            </div>
          </div>
          <div className="hero-composition">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <span className="composition-label">
              YOUR CUSTOMER EXPERIENCE, CONNECTED
            </span>
            <div className="salon-qr">
              <div className="salon-emblem">
                <Leaf size={27} />
              </div>
              <span className="salon-wordmark">bloom & co.</span>
              <span className="salon-sub">
                HAIR • BEAUTY • A LITTLE YOU TIME
              </span>
              <div className="hero-qr">
                <QrCode />
              </div>
              <h3>How was your visit?</h3>
              <p>We’d love to hear about it.</p>
              <div className="qr-card-footer">
                SCAN. SHARE. MAKE OUR DAY. <ArrowUpRight size={13} />
              </div>
            </div>
            <motion.div
              className="floating-card feedback-float"
              initial={{ opacity: 1, y: 0 }}
              animate={
                reduce
                  ? { opacity: 1, y: 0 }
                  : { opacity: [0.85, 1], y: [18, 0] }
              }
              transition={{
                delay: reduce ? 0 : 0.15,
                duration: reduce ? 0 : 0.45,
              }}
            >
              <span className="float-icon mint">
                <MessageSquare size={18} />
              </span>
              <div>
                <small>NEW PRIVATE FEEDBACK</small>
                <Stars />
                <p>“Sophie made my day. Love my new colour!”</p>
                <span className="muted">
                  Olivia M. <span>·</span> Just now
                </span>
              </div>
              <span className="live-dot" />
            </motion.div>
            <motion.div
              className="floating-card request-float"
              initial={{ y: 0 }}
              animate={{ y: reduce ? 0 : [12, 0] }}
              transition={{
                delay: reduce ? 0 : 0.25,
                duration: reduce ? 0 : 0.35,
              }}
            >
              <span className="float-icon violet">
                <Send size={17} />
              </span>
              <div>
                <strong>Review request ready</strong>
                <p>Your review request is ready.</p>
                <Badge mint>
                  <Check size={11} /> Consent confirmed
                </Badge>
              </div>
            </motion.div>
            <motion.div
              className="floating-card reply-float"
              initial={{ y: 0 }}
              animate={{ y: reduce ? 0 : [12, 0] }}
              transition={{
                delay: reduce ? 0 : 0.35,
                duration: reduce ? 0 : 0.35,
              }}
            >
              <div className="reply-heading">
                <Sparkles size={16} />
                <strong>Editable reply draft</strong>
              </div>
              <p>“Thank you, Olivia! We’re so happy you love your new look…”</p>
              <div className="reply-bottom">
                <span>Review before approving</span>
                <Check size={14} />
              </div>
            </motion.div>
            <span className="composition-star ping-mark" aria-hidden="true" />
            <div
              className="mini-journey"
              aria-label="Product journey: scan, share feedback, prepare reply"
            >
              {['Scan', 'Share', 'Reply'].map((step, index) => (
                <motion.span
                  key={step}
                  initial={{ y: 0 }}
                  animate={{ y: reduce ? 0 : [8, 0] }}
                  transition={{
                    delay: reduce ? 0 : 0.3 + index * 0.2,
                    duration: reduce ? 0 : 0.3,
                  }}
                >
                  <i>{index + 1}</i>
                  {step}
                  {index < 2 && <ArrowRight size={12} />}
                </motion.span>
              ))}
            </div>
          </div>
        </section>
        <section className="value-strip" aria-label="Product capabilities">
          <div className="wrap">
            <div>
              <QrIcon size={22} />
              <span>
                Branded QR pages
                <small>A choice of public or private feedback</small>
              </span>
            </div>
            <div>
              <Send size={22} />
              <span>
                Consent-based requests
                <small>Preview requests and reminders</small>
              </span>
            </div>
            <div>
              <MessageSquare size={22} />
              <span>
                Feedback follow-up
                <small>Notes and resolution in one inbox</small>
              </span>
            </div>
            <div>
              <Sparkles size={22} />
              <span>
                Editable reply drafts
                <small>Review every response before approval</small>
              </span>
            </div>
          </div>
        </section>
        <ProductShowcase />
        <section id="how-it-works" className="section wrap">
          <Reveal>
            <SectionTitle
              eyebrow="A SIMPLE WORKFLOW"
              title="From a visit to a useful conversation."
              text="No complicated workflows. Just three simple ways to stay close to your customers."
            />
          </Reveal>
          <div className="steps">
            <Reveal>
              <span className="step-number">01</span>
              <div className="step-visual mini-qr">
                <QrIcon size={36} />
                <span>
                  One scan.
                  <br />
                  An open conversation.
                </span>
              </div>
              <h3>Create your review QR code</h3>
              <p>
                Put your branded QR at the counter, on a mirror, or wherever a
                good visit ends.
              </p>
            </Reveal>
            <Reveal>
              <span className="step-number">02</span>
              <div className="step-visual mini-message">
                <Send size={25} />
                <span>
                  Hi Olivia, thanks for visiting!
                  <br />
                  <b>Care to share your experience?</b>
                </span>
              </div>
              <h3>Request reviews with consent</h3>
              <p>
                Send a friendly request to customers who have opted in, with a
                thoughtful reminder.
              </p>
            </Reveal>
            <Reveal>
              <span className="step-number">03</span>
              <div className="step-visual workflow-complete">
                <span className="ping-mark" aria-hidden="true" />
                <Check size={24} />
                <span>
                  Feedback resolved.
                  <br />
                  <b>Reply ready for review.</b>
                </span>
              </div>
              <h3>Manage feedback and replies</h3>
              <p>
                Bring feedback and review drafts together. Spot patterns and
                make your next visit even better.
              </p>
            </Reveal>
          </div>
        </section>
        <section className="google-companion">
          <div className="wrap companion-layout">
            <div>
              <span className="eyebrow">
                ALONGSIDE GOOGLE. AROUND YOUR CUSTOMERS.
              </span>
              <h2>
                Google holds the reviews.
                <br />
                <em>You hold the conversation.</em>
              </h2>
              <p>
                RevuPing brings the work around a review together: asking with
                permission, following up privately, and preparing a response in
                your own voice.
              </p>
              <Button asChild variant="secondary">
                <Link href="/dashboard/reviews">
                  Explore reply drafts <ArrowRight size={17} />
                </Link>
              </Button>
            </div>
            <ol className="companion-workflow">
              <li>
                <span className="ping-mark" aria-hidden="true" />
                <div>
                  <strong>Ask, with permission.</strong>
                  <p>
                    Preview a request or reminder for a customer with recorded
                    consent.
                  </p>
                </div>
              </li>
              <li>
                <MessageSquare size={22} />
                <div>
                  <strong>Listen in the right place.</strong>
                  <p>
                    Google review or private feedback — the customer always
                    chooses.
                  </p>
                </div>
              </li>
              <li>
                <Check size={22} />
                <div>
                  <strong>Follow up with context.</strong>
                  <p>
                    Keep internal notes, resolve feedback, and edit a reply
                    draft before approving.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>
        <section id="pricing" className="section wrap pricing-coming">
          <div className="pricing-intro">
            <span className="eyebrow">PLANS ARE STILL TAKING SHAPE</span>
            <h2>Pricing coming soon.</h2>
            <p>
              Start by exploring the experience. Prices, plan features and
              limits are not approved, and this demo has no subscriptions or
              payments.
            </p>
            <Button asChild>
              <Link href="/dashboard">
                Explore the free demo <ArrowRight size={17} />
              </Link>
            </Button>
          </div>
          <div className="pricing-outline">
            <span className="eyebrow">WHAT YOU CAN EXPLORE TODAY</span>
            <h3>One connected workflow.</h3>
            <ul>
              <li>
                <QrIcon size={20} />
                Customise and download a branded QR card
              </li>
              <li>
                <Send size={20} />
                Preview consent-based requests and reminders
              </li>
              <li>
                <MessageSquare size={20} />
                Save notes and resolve private feedback
              </li>
              <li>
                <Sparkles size={20} />
                Edit and approve fictional reply drafts
              </li>
            </ul>
            <p>Frontend demo · No purchase available</p>
          </div>
        </section>
        <section className="faq-section wrap">
          <div>
            <span className="eyebrow">A FEW THINGS YOU MIGHT BE WONDERING</span>
            <h2>
              Questions?
              <br />
              Here are the details.
            </h2>
            <p>What to expect from this frontend demo.</p>
          </div>
          <div className="faq-list">
            {[
              [
                'Is this a working product or a demo?',
                'This is an interactive frontend prototype with fictional data. No messages are sent, no Google account is connected, and no payments are collected.',
              ],
              [
                'Can every customer leave a Google review?',
                'Yes. The Google review option stays equally available to everyone, regardless of the rating or feedback they choose to share.',
              ],
              [
                'Will this improve my Google ranking?',
                'We don’t promise ranking improvements. RevuPing helps you ask for honest feedback, organise conversations, and prepare thoughtful responses.',
              ],
              [
                'Do customers need an account?',
                'No. Customers can scan your QR and share feedback without logging in.',
              ],
              [
                'Can I customise the QR and messages?',
                'Yes. Explore the QR studio to change your business name, colour, and message, then download a real SVG QR card.',
              ],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <ChevronDown size={18} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="final-cta wrap">
          <span className="cta-spark ping-mark" aria-hidden="true" />
          <div>
            <span className="eyebrow">GOOD CONVERSATIONS START HERE</span>
            <h2>See how RevuPing fits your business.</h2>
            <p>
              Explore the dashboard, customise a QR card, and try the customer
              feedback flow.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard">
              Try the demo <ArrowUpRight size={18} />
            </Link>
          </Button>
        </section>
      </main>
      <footer className="site-footer wrap">
        <div>
          <Logo />
          <p>Review requests, feedback and replies.</p>
        </div>
        <div>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing coming soon</a>
          <Link href="/r/demo-salon">
            Customer experience <ArrowUpRight size={13} />
          </Link>
        </div>
        <div className="footer-bottom">
          <span>© 2026 RevuPing. Built for local businesses.</span>
          <span>Frontend prototype · All product data is illustrative.</span>
        </div>
      </footer>
    </>
  );
}

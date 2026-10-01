'use client';
import Link from 'next/link';
import { demoPlans } from '../lib/mock-data';
import { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  MessageSquare,
  Send,
  Sparkles,
  QrCode as QrIcon,
  Clock3,
  Menu,
  X,
  Leaf,
  ChevronDown,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Button } from '../components/ui/button';
import {
  Logo,
  Stars,
  Reveal,
  Badge,
  SectionTitle,
  CheckItem,
  TextLink,
} from '../components/shared';
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
            <div className="floating-card request-float">
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
            </div>
            <div className="floating-card reply-float">
              <div className="reply-heading">
                <Sparkles size={16} />
                <strong>Editable reply draft</strong>
              </div>
              <p>“Thank you, Olivia! We’re so happy you love your new look…”</p>
              <div className="reply-bottom">
                <span>Review before approving</span>
                <Check size={14} />
              </div>
            </div>
            <span className="composition-star">✧</span>
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
        <section className="value-strip">
          <div className="wrap">
            <span>
              Made for businesses
              <br />
              <strong>built on people.</strong>
            </span>
            <div>
              <Leaf size={19} /> Salons & beauty
            </div>
            <div>
              <MessageSquare size={19} /> Everyday conversations
            </div>
            <div>
              <Clock3 size={19} /> A little more time back
            </div>
            <span className="strip-note">
              Your craft. Our kind of business.
            </span>
          </div>
        </section>
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
              <div className="step-visual mini-insight">
                <span className="mini-bars">
                  {[30, 48, 37, 65, 55, 82, 96].map((h, i) => (
                    <i key={i} style={{ height: h + '%' }} />
                  ))}
                </span>
                <span>Listen. Learn. Grow.</span>
              </div>
              <h3>Manage feedback and replies</h3>
              <p>
                Bring feedback and review drafts together. Spot patterns and
                make your next visit even better.
              </p>
            </Reveal>
          </div>
        </section>
        <ProductShowcase />
        <section className="section wrap feature-row reverse">
          <Reveal className="request-preview">
            <div className="request-preview-top">
              <Send size={22} />
              <span>REVIEW REQUEST PREVIEW · DEMO</span>
            </div>
            <div className="message-paper">
              <span>To Olivia Martin</span>
              <h3>
                A little thank you
                <br />
                from Bloom & Co.
              </h3>
              <p>
                Hi Olivia,
                <br />
                <br />
                It was lovely having you in the salon. If you have a moment,
                we’d love to hear about your visit.
              </p>
              <div className="mock-message-link">
                Share your experience <ArrowUpRight size={15} />
              </div>
              <p className="signature">
                With love,
                <br />
                The Bloom & Co. team
              </p>
            </div>
            <div className="request-caption">
              <Check size={16} /> Sample request · Consent required before
              sending
            </div>
          </Reveal>
          <Reveal className="feature-copy">
            <span className="eyebrow">THOUGHTFUL, NEVER PUSHY</span>
            <h2>
              Make each request personal.
              <br />
              Keep the process simple.
            </h2>
            <p>
              A friendly request, a considerate reminder, a helpful reply draft.
              Keep your voice in every conversation, without starting from
              scratch.
            </p>
            <CheckItem>Only contact customers who have consented</CheckItem>
            <CheckItem>Preview each request before it goes out</CheckItem>
            <CheckItem>Edit every reply draft before approving</CheckItem>
            <TextLink href="/dashboard/requests">
              Explore review requests
            </TextLink>
          </Reveal>
        </section>
        <section className="beyond-section wrap">
          <span className="eyebrow">
            MORE THAN ANOTHER PLACE TO CHECK REVIEWS
          </span>
          <h2>
            Don’t just watch the stars.
            <br />
            Understand the experience.
          </h2>
          <div className="beyond-grid">
            <div>
              <MessageSquare />
              <h3>Hear the quieter voices.</h3>
              <p>
                A private place to share details that might never make it to a
                public review.
              </p>
            </div>
            <div>
              <Clock3 />
              <h3>Follow up while it matters.</h3>
              <p>
                See unresolved feedback and give every conversation the
                attention it deserves.
              </p>
            </div>
            <div>
              <Sparkles />
              <h3>Turn patterns into progress.</h3>
              <p>
                Notice repeat themes, recognise your team, and make informed
                improvements.
              </p>
            </div>
          </div>
        </section>
        <section id="pricing" className="section wrap">
          <SectionTitle
            eyebrow="PLACEHOLDER PLANS · NOT AVAILABLE TO PURCHASE"
            title="A preview of how plans could work."
            text="Plan names and features are illustrative. Prices and limits have not been approved; no subscriptions or payments are available."
          />
          <div className="pricing-grid">
            {demoPlans.map((plan) => (
              <Reveal
                className={`pricing-card ${plan.featured ? 'featured' : ''}`}
                key={plan.name}
              >
                {plan.featured && (
                  <span className="plan-label">EXAMPLE TEAM PLAN</span>
                )}
                <span className="eyebrow">{plan.name}</span>
                <div className="price">
                  {plan.price}
                  <span>pricing to be confirmed</span>
                </div>
                <p>{plan.desc}</p>
                <Button
                  variant={plan.featured ? 'default' : 'secondary'}
                  asChild
                >
                  <Link href="/signup">
                    Explore the demo <ArrowRight size={16} />
                  </Link>
                </Button>
                <div className="plan-features">
                  {plan.features.map((f) => (
                    <CheckItem key={f}>{f}</CheckItem>
                  ))}
                </div>
                <small>Placeholder plan · Price and limits not approved</small>
              </Reveal>
            ))}
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
          <span className="cta-spark">✳</span>
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
          <p>A little closer to your customers.</p>
        </div>
        <div>
          <a href="#features">Features</a>
          <a href="#pricing">Demo pricing</a>
          <Link href="/r/demo-salon">
            Customer experience <ArrowUpRight size={13} />
          </Link>
        </div>
        <div className="footer-bottom">
          <span>© 2026 RevuPing. Made for meaningful connections.</span>
          <span>Frontend prototype · All product data is illustrative.</span>
        </div>
      </footer>
    </>
  );
}

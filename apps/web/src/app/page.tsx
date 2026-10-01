'use client';
import Link from 'next/link';
import { demoPlans, previewFeedback } from '../lib/mock-data';
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
              <span className="small-line" /> LESS ADMIN. MORE CONNECTION.
            </span>
            <h1>
              Good experiences
              <br />
              deserve to be
              <br />
              <span>heard.</span>
              <span className="hero-spark">✳</span>
            </h1>
            <p>
              A thoughtful way to collect feedback, ask for reviews, and keep
              customer conversations moving. All while you get back to what you
              do best.
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
              <span>·</span> Just a little look around
            </div>
          </div>
          <div className="hero-composition">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <span className="composition-label">
              A LITTLE PING. A BIG DIFFERENCE.
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
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
            >
              <span className="float-icon mint">
                <MessageSquare size={18} />
              </span>
              <div>
                <small>A LITTLE FEEDBACK JUST ARRIVED</small>
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
                <strong>A kind nudge, right on time.</strong>
                <p>Your review request is ready.</p>
                <Badge mint>
                  <Check size={11} /> Consent confirmed
                </Badge>
              </div>
            </div>
            <div className="floating-card reply-float">
              <div className="reply-heading">
                <Sparkles size={16} />
                <strong>The right words, a little easier.</strong>
              </div>
              <p>“Thank you, Olivia! We’re so happy you love your new look…”</p>
              <div className="reply-bottom">
                <span>Reply draft · ready for your touch</span>
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
                  initial={reduce ? false : { y: 8 }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.3 + index * 0.3 }}
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
              eyebrow="SMALL STEPS. MEANINGFUL CONNECTIONS."
              title="From a happy visit to a little ping."
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
              <h3>Give feedback a place to land.</h3>
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
              <h3>Ask with a little care.</h3>
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
              <h3>See what’s really being said.</h3>
              <p>
                Bring feedback and review drafts together. Spot patterns and
                make your next visit even better.
              </p>
            </Reveal>
          </div>
        </section>
        <section id="features" className="feature-section">
          <div className="wrap feature-row">
            <Reveal className="feature-copy">
              <span className="eyebrow">EVERY VOICE, A LITTLE CLOSER</span>
              <h2>
                Less checking.
                <br />
                More understanding.
              </h2>
              <p>
                A star rating is only the start of a conversation. Make room for
                the details that help you care for your customers.
              </p>
              <CheckItem>
                Private feedback, organised in one calm inbox
              </CheckItem>
              <CheckItem>Honest Google reviews, always accessible</CheckItem>
              <CheckItem>
                Useful trends without a spreadsheet in sight
              </CheckItem>
              <TextLink href="/dashboard/feedback">
                Take a look at the inbox
              </TextLink>
            </Reveal>
            <Reveal className="feature-preview">
              <div className="preview-toolbar">
                <span>
                  <span className="mini-logo">r.</span> Your feedback inbox
                </span>
                <Badge mint>Demo preview</Badge>
              </div>
              <div className="preview-heading">
                <h3>The little things matter.</h3>
                <p>Listen to what’s going well. Notice what could be better.</p>
              </div>
              {previewFeedback.map((f) => (
                <div className="preview-feedback" key={f.name}>
                  <span className={`avatar ${f.color}`}>{f.initials}</span>
                  <div>
                    <strong>{f.name}</strong>
                    <Stars rating={f.rating} />
                    <p>{f.text}</p>
                  </div>
                  <span className="preview-status">{f.status}</span>
                </div>
              ))}
              <Link href="/dashboard/feedback" className="preview-bottom">
                Every conversation has a next step. <ArrowRight size={16} />
              </Link>
            </Reveal>
          </div>
        </section>
        <section className="section wrap feature-row reverse">
          <Reveal className="request-preview">
            <div className="request-preview-top">
              <Send size={22} />
              <span>A REQUEST THAT SOUNDS LIKE YOU</span>
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
              <Check size={16} /> Sent with permission. Written with care.
            </div>
          </Reveal>
          <Reveal className="feature-copy">
            <span className="eyebrow">THOUGHTFUL, NEVER PUSHY</span>
            <h2>
              Your personal touch.
              <br />A little less effort.
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
            eyebrow="SIMPLE PLANS. ROOM TO GROW."
            title="A little investment in better connections."
            text="Proposed pricing for this prototype. No payments, subscriptions, or commitments."
          />
          <div className="pricing-grid">
            {demoPlans.map((plan) => (
              <Reveal
                className={`pricing-card ${plan.featured ? 'featured' : ''}`}
                key={plan.name}
              >
                {plan.featured && (
                  <span className="plan-label">A GOOD PLACE TO GROW</span>
                )}
                <span className="eyebrow">{plan.name}</span>
                <div className="price">
                  ${plan.price}
                  <span>/ month</span>
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
                <small>Sample plan · USD · not available for purchase</small>
              </Reveal>
            ))}
          </div>
        </section>
        <section className="faq-section wrap">
          <div>
            <span className="eyebrow">A FEW THINGS YOU MIGHT BE WONDERING</span>
            <h2>
              Good questions.
              <br />
              Straight answers.
            </h2>
            <p>A little clarity before your first ping.</p>
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
            <h2>Make room for your next little ping.</h2>
            <p>
              Take a look around. See what a calmer customer experience could
              feel like.
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

'use client';
import { SectionLink } from '../components/ui/section-link';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  MessageSquare,
  Send,
  Sparkles,
  QrCode as QrIcon,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Logo, Reveal, SectionTitle } from '../components/shared';
import { MarketingHeader } from '../components/marketing-header';
import { HeroIntro, FaqItem } from '../components/template-motion';
import { HeroArtwork } from '../components/hero/hero-artwork';
import { ConversationCurves } from '../components/conversation-curves';
import { ProductShowcase } from '../components/product-showcase';
export default function Landing() {
  return (
    <>
      <MarketingHeader />
      <main>
        <section className="hero wrap relative isolate">
          <HeroIntro>
            <span className="eyebrow">
              <span className="small-line" /> Reviews, feedback & replies
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
              <SectionLink href="#features" className="how-link">
                Explore the product <ArrowRight size={17} />
              </SectionLink>
            </div>
            <div className="hero-footnote">
              <Check size={14} /> No credit card <span>·</span> No setup needed{' '}
              <span>·</span> Interactive demo
            </div>
          </HeroIntro>
          <HeroArtwork />
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
        <section className="section wrap">
          <Reveal>
            <SectionTitle
              eyebrow="Explore the working demo"
              title="A clearer picture of every customer conversation."
              text="Try connected sample workflows, from permission-based outreach to follow-up and reporting. Everything here uses fictional data."
            />
          </Reveal>
          <div className="product-journey">
            {[
              {
                icon: <Send size={28} />,
                title: 'Plan thoughtful outreach',
                text: 'Select eligible customers, preview a request and set reminder rules. Repeat-visit messages have their own workflow.',
                href: '/dashboard/campaigns',
                action: 'Build a demo campaign',
              },
              {
                icon: <MessageSquare size={28} />,
                title: 'Listen, then follow through',
                text: 'Explore customer surveys, assign private feedback and keep notes and resolution history together.',
                href: '/dashboard/surveys',
                action: 'Explore demo surveys',
              },
              {
                icon: <Sparkles size={28} />,
                title: 'See the context behind counts',
                text: 'Filter sample reports by date and location. Link clicks and confirmed review fixtures are shown separately.',
                href: '/dashboard/reports',
                action: 'View sample reports',
              },
            ].map((item) => (
              <article key={item.href}>
                <span className="eyebrow">INTERACTIVE DEMO</span>
                <div className="mt-5 text-[var(--violet)]">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <Link className="product-action-link" href={item.href}>
                  <span>{item.action}</span>
                  <ArrowRight size={17} />
                </Link>
              </article>
            ))}
          </div>
          <p className="field-help mt-6">
            Live messaging, Google connections, production widgets and billing
            are planned integrations. Demo actions stay in this frontend.
          </p>
        </section>
        <section
          id="how-it-works"
          className="section wrap relative isolate overflow-hidden"
        >
          <ConversationCurves
            variant="workflow"
            className="-left-24 top-4 h-[180px] w-[280px] max-sm:w-[160px]"
          />
          <Reveal className="w-full">
            <SectionTitle
              className="mx-auto w-full max-w-[800px]"
              eyebrow="A simple workflow"
              title="From a visit to a useful conversation."
              text="Create your QR, request with consent, and follow up from one workspace."
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
                Save internal notes, resolve private feedback, and prepare a
                considered response to each review.
              </p>
            </Reveal>
          </div>
        </section>
        <section className="google-companion">
          <div className="wrap companion-layout">
            <div>
              <span className="eyebrow">
                Alongside Google. Around your customers.
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
            <span className="eyebrow">Plans are still taking shape</span>
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
            <span className="eyebrow">What you can explore today</span>
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
        <section className="faq-section wrap !max-w-[960px] !grid-cols-1 !gap-7 !py-16 max-md:!py-12">
          <div>
            <span className="eyebrow">Common questions</span>
            <h2>Before you explore.</h2>
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
            ].map(([q, a], index) => (
              <FaqItem key={q} question={q} answer={a} index={index} />
            ))}
          </div>
        </section>
        <section className="final-cta wrap relative isolate overflow-hidden [&>div]:relative [&>a]:relative">
          <ConversationCurves
            variant="closing"
            className="-right-12 -top-20 h-[300px] w-[300px] max-sm:hidden"
          />
          <div>
            <span className="eyebrow">Good conversations start here</span>
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
          <SectionLink href="#features">Features</SectionLink>
          <SectionLink href="#pricing">Pricing coming soon</SectionLink>
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

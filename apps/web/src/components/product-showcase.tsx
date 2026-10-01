'use client';
import { Field } from './shared';
import { AnimatedHeight } from './template-motion';
import Link from 'next/link';
import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import * as Tabs from '@radix-ui/react-tabs';
import {
  ArrowRight,
  LayoutDashboard,
  MessageSquare,
  Send,
  Sparkles,
  Check,
  Leaf,
  QrCode,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge, Stars, Reveal } from './shared';
import { customers, reviews } from '../lib/mock-data';
import { usePreviewDemo } from '../lib/use-preview-demo';

const views = [
  {
    id: 'feedback',
    label: 'Feedback inbox',
    icon: MessageSquare,
    href: '/dashboard/feedback',
  },
  {
    id: 'requests',
    label: 'Review requests',
    icon: Send,
    href: '/dashboard/requests',
  },
  {
    id: 'replies',
    label: 'Reply drafts',
    icon: Sparkles,
    href: '/dashboard/reviews',
  },
] as const;

export function ProductShowcase() {
  const [view, setView] = useState('feedback');
  const demo = usePreviewDemo();
  const reduced = useReducedMotion();
  const active = views.find((item) => item.id === view) || views[0];
  return (
    <section id="features" className="product-showcase">
      <div className="wrap">
        <Reveal className="showcase-intro">
          <div>
            <span className="eyebrow">One workspace. A clear next step.</span>
            <h2>
              Know what customers think.
              <br />
              Know what to do next.
            </h2>
          </div>
          <p>
            From the first QR scan to a considered reply, keep the details
            together and give every conversation the right attention.
          </p>
        </Reveal>
        <Tabs.Root
          value={view}
          onValueChange={setView}
          className="showcase-tabs"
        >
          <Tabs.List
            className="showcase-tab-list"
            aria-label="Explore RevuPing features"
          >
            {views.map((item) => (
              <Tabs.Trigger
                value={item.id}
                key={item.id}
                id={`showcase-${item.id}-tab`}
                aria-controls={`showcase-${item.id}-panel`}
              >
                {view === item.id && (
                  <motion.span
                    className="showcase-tab-indicator"
                    layoutId="showcase-tab-indicator"
                    transition={{ duration: reduced ? 0 : 0.22 }}
                  />
                )}
                <item.icon size={18} />
                {item.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <div className="showcase-frame">
            <aside
              className="showcase-rail"
              aria-label="Illustrative workspace navigation"
            >
              <span className="showcase-wordmark">
                revu<span>ping.</span>
              </span>
              <div className="showcase-business">
                <Leaf size={20} />
                <div>
                  Bloom & Co.<small>Demo salon</small>
                </div>
              </div>
              <span className="showcase-rail-label">
                <LayoutDashboard size={17} />
                Overview
              </span>
              <span className="showcase-rail-label">
                <QrCode size={17} />
                QR code studio
              </span>
              {views.map((item) => (
                <button
                  key={item.id}
                  className={view === item.id ? 'active' : ''}
                  aria-pressed={view === item.id}
                  onClick={() => setView(item.id)}
                >
                  <item.icon size={17} />
                  {item.label}
                </button>
              ))}
              <span className="showcase-demo-label">
                INTERACTIVE PRODUCT PREVIEW
                <br />
                All data is fictional.
              </span>
            </aside>
            <div className="showcase-body">
              <div className="showcase-topline">
                <span>
                  Bloom & Co. <span>/</span> {active.label}
                </span>
                <Badge>Demo data</Badge>
              </div>
              <AnimatedHeight className="showcase-panels">
                <Tabs.Content
                  value="feedback"
                  id="showcase-feedback-panel"
                  aria-labelledby="showcase-feedback-tab"
                  className="showcase-screen"
                  asChild
                >
                  <motion.div
                    initial={{ opacity: 1, y: 0 }}
                    animate={{
                      opacity: reduced ? 1 : [0.7, 1],
                      y: reduced ? 0 : [5, 0],
                    }}
                    transition={{ duration: reduced ? 0 : 0.2 }}
                  >
                    <div className="showcase-screen-heading">
                      <div>
                        <h3>Feedback inbox</h3>
                        <p>
                          Recent experiences, with a clear follow-up status.
                        </p>
                      </div>
                      <span className="showcase-count">
                        {demo.items.filter((item) => !item.resolved).length}{' '}
                        need attention
                      </span>
                    </div>
                    <div className="showcase-feedback-layout">
                      <div className="showcase-feedback-list">
                        {demo.items.map((f) => (
                          <button
                            className={`showcase-feedback-row ${demo.selected.id === f.id ? 'selected' : ''}`}
                            key={f.id}
                            aria-pressed={demo.selected.id === f.id}
                            onClick={() => demo.select(f.id)}
                          >
                            <span
                              className={`avatar ${f.id === 1 ? 'peach' : 'lavender'}`}
                            >
                              {f.initials}
                            </span>
                            <div>
                              <div className="showcase-person-heading">
                                <strong>{f.name}</strong>
                                <Stars rating={f.rating} />
                              </div>
                              <p>{f.text}</p>
                              <div className="showcase-row-meta">
                                <span>
                                  {f.staff} · {f.date.split(',')[0]}
                                </span>
                                <Badge mint={f.resolved}>
                                  {f.resolved ? 'Resolved' : 'Needs attention'}
                                </Badge>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="showcase-detail">
                        <span className="eyebrow">Selected feedback</span>
                        <h4>{demo.selected.name}</h4>
                        <Stars rating={demo.selected.rating} />
                        <p>“{demo.selected.text}”</p>
                        <div className="showcase-note">
                          <span>INTERNAL NOTE · SAMPLE</span>
                          <p>
                            Follow up with the customer and review the
                            appointment with the team.
                          </p>
                        </div>
                        <Button
                          onClick={demo.toggleResolved}
                          variant={
                            demo.selected.resolved ? 'secondary' : 'default'
                          }
                        >
                          <Check size={16} />
                          {demo.selected.resolved
                            ? 'Reopen preview feedback'
                            : 'Resolve preview feedback'}
                        </Button>
                        <p className="preview-state" role="status">
                          {demo.selected.resolved
                            ? 'Resolved in this preview.'
                            : 'Needs attention · Demo only'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </Tabs.Content>
                <Tabs.Content
                  value="requests"
                  id="showcase-requests-panel"
                  aria-labelledby="showcase-requests-tab"
                  className="showcase-screen"
                  asChild
                >
                  <motion.div
                    initial={{ opacity: 1, y: 0 }}
                    animate={{
                      opacity: reduced ? 1 : [0.7, 1],
                      y: reduced ? 0 : [5, 0],
                    }}
                    transition={{ duration: reduced ? 0 : 0.2 }}
                  >
                    <div className="showcase-screen-heading">
                      <div>
                        <h3>Review requests</h3>
                        <p>A personal message, sent only with permission.</p>
                      </div>
                      <Badge mint>
                        <Check size={14} /> Consent first
                      </Badge>
                    </div>
                    <div className="showcase-request-layout">
                      <div>
                        <div className="showcase-table-heading">
                          <span>Customer</span>
                          <span>Consent</span>
                        </div>
                        {customers.map((c) => (
                          <button
                            className={`showcase-customer-row ${demo.customer.id === c.id ? 'selected' : ''}`}
                            key={c.id}
                            aria-pressed={demo.customer.id === c.id}
                            onClick={() => demo.selectCustomer(c.id)}
                          >
                            <span className="avatar lavender">{c.name[0]}</span>
                            <div>
                              <strong>{c.name}</strong>
                              <small>{c.status}</small>
                            </div>
                            <span>
                              {c.consent && <Check size={14} />}
                              {c.consent ? 'Recorded' : 'No consent'}
                            </span>
                          </button>
                        ))}
                        <p className="showcase-inline-note">
                          Preview requests and reminders before simulating a
                          send.
                        </p>
                      </div>
                      <div className="showcase-message [&_small]:mt-3 [&_small]:block [&_.button]:mt-4">
                        <span className="eyebrow">REQUEST PREVIEW · DEMO</span>
                        <h4>
                          Thanks for visiting,
                          <br />
                          {demo.customer.name.split(' ')[0]}.
                        </h4>
                        <p>
                          It was lovely having you at Bloom & Co. If you have a
                          moment, we’d love to hear about your visit.
                        </p>
                        <Button
                          disabled={!demo.customer.consent || demo.sent}
                          onClick={demo.simulateSend}
                        >
                          <Send size={16} />
                          {demo.sent
                            ? 'Request simulated'
                            : 'Simulate preview request'}
                        </Button>
                        <small role="status">
                          {!demo.customer.consent
                            ? 'Consent is required before a request.'
                            : demo.sent
                              ? 'Complete in this preview. No message was sent.'
                              : 'Fictional message · Nothing is sent'}
                        </small>
                      </div>
                    </div>
                  </motion.div>
                </Tabs.Content>
                <Tabs.Content
                  value="replies"
                  id="showcase-replies-panel"
                  aria-labelledby="showcase-replies-tab"
                  className="showcase-screen"
                  asChild
                >
                  <motion.div
                    initial={{ opacity: 1, y: 0 }}
                    animate={{
                      opacity: reduced ? 1 : [0.7, 1],
                      y: reduced ? 0 : [5, 0],
                    }}
                    transition={{ duration: reduced ? 0 : 0.2 }}
                  >
                    <div className="showcase-screen-heading">
                      <div>
                        <h3>Google reviews & replies</h3>
                        <p>
                          Read the review. Edit the draft. Approve with
                          confidence.
                        </p>
                      </div>
                      <Badge>Simulated connection</Badge>
                    </div>
                    <div className="showcase-reply-layout">
                      <div className="showcase-review">
                        <div>
                          <span className="avatar sage">A</span>
                          <div>
                            <strong>{reviews[0].name}</strong>
                            <small>Simulated Google review</small>
                          </div>
                        </div>
                        <Stars rating={reviews[0].rating} />
                        <blockquote>“{reviews[0].text}”</blockquote>
                        <p>
                          Every customer can access the Google review option,
                          regardless of their feedback or rating.
                        </p>
                      </div>
                      <div className="showcase-draft [&_small]:mt-3 [&_small]:block">
                        <span className="eyebrow">
                          <Sparkles size={14} /> SAMPLE REPLY DRAFT
                        </span>
                        <Field>
                          Edit this reply
                          <textarea
                            rows={5}
                            value={demo.draft}
                            onChange={(e) => demo.editDraft(e.target.value)}
                          />
                        </Field>
                        <Button
                          disabled={!demo.draft.trim() || demo.approved}
                          onClick={demo.approve}
                        >
                          <Check size={16} />
                          {demo.approved
                            ? 'Approved in preview'
                            : 'Approve preview draft'}
                        </Button>
                        {demo.approved && (
                          <p className="preview-state" role="status">
                            Approved for this preview. Nothing is published to
                            Google.
                          </p>
                        )}
                        <small>
                          No live AI call. Nothing is published to Google.
                        </small>
                      </div>
                    </div>
                  </motion.div>
                </Tabs.Content>
              </AnimatedHeight>
              <div className="showcase-bottom">
                <p>Explore the full frontend demo. No live integrations.</p>
                <Button asChild variant="secondary">
                  <Link href={active.href}>
                    Open{' '}
                    {active.id === 'feedback'
                      ? 'feedback inbox'
                      : active.id === 'requests'
                        ? 'review requests'
                        : 'review replies'}
                    <ArrowRight size={16} />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Tabs.Root>
      </div>
    </section>
  );
}

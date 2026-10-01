'use client';
import Link from 'next/link';
import { useState } from 'react';
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
import { feedback, customers, reviews } from '../lib/mock-data';

const views = [
  {
    id: 'feedback',
    label: 'Private feedback',
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
    label: 'Review replies',
    icon: Sparkles,
    href: '/dashboard/reviews',
  },
] as const;

export function ProductShowcase() {
  const [view, setView] = useState('feedback');
  const active = views.find((item) => item.id === view) || views[0];
  return (
    <section id="features" className="product-showcase">
      <div className="wrap">
        <Reveal className="showcase-intro">
          <div>
            <span className="eyebrow">ONE WORKSPACE. A CLEAR NEXT STEP.</span>
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
              <Tabs.Content
                value="feedback"
                id="showcase-feedback-panel"
                aria-labelledby="showcase-feedback-tab"
                className="showcase-screen"
              >
                <div className="showcase-screen-heading">
                  <div>
                    <h3>Feedback inbox</h3>
                    <p>Recent experiences, with a clear follow-up status.</p>
                  </div>
                  <span className="showcase-count">3 need attention</span>
                </div>
                <div className="showcase-feedback-layout">
                  <div className="showcase-feedback-list">
                    {feedback.slice(0, 3).map((f) => (
                      <div className="showcase-feedback-row" key={f.id}>
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
                      </div>
                    ))}
                  </div>
                  <div className="showcase-detail">
                    <span className="eyebrow">A CLEAR FOLLOW-UP</span>
                    <h4>
                      Keep the context.
                      <br /> Close the loop.
                    </h4>
                    <p>
                      “I waited about 25 minutes past my appointment. A little
                      heads-up would have helped.”
                    </p>
                    <div className="showcase-note">
                      <span>INTERNAL NOTE · SAMPLE</span>
                      <p>
                        Review appointment timings with the team before the next
                        visit.
                      </p>
                    </div>
                    <span className="showcase-demo-action">
                      <Check size={15} /> Track resolution in your inbox
                    </span>
                  </div>
                </div>
              </Tabs.Content>
              <Tabs.Content
                value="requests"
                id="showcase-requests-panel"
                aria-labelledby="showcase-requests-tab"
                className="showcase-screen"
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
                    {customers.slice(0, 3).map((c) => (
                      <div className="showcase-customer-row" key={c.id}>
                        <span className="avatar lavender">{c.name[0]}</span>
                        <div>
                          <strong>{c.name}</strong>
                          <small>{c.status}</small>
                        </div>
                        <span>
                          <Check size={14} />
                          Recorded
                        </span>
                      </div>
                    ))}
                    <p className="showcase-inline-note">
                      Preview requests and reminders before simulating a send.
                    </p>
                  </div>
                  <div className="showcase-message">
                    <span className="eyebrow">REQUEST PREVIEW · DEMO</span>
                    <h4>
                      Thanks for visiting,
                      <br />
                      Olivia.
                    </h4>
                    <p>
                      It was lovely having you at Bloom & Co. If you have a
                      moment, we’d love to hear about your visit.
                    </p>
                    <div>
                      Share your experience <ArrowRight size={16} />
                    </div>
                    <small>Fictional message · Nothing is sent</small>
                  </div>
                </div>
              </Tabs.Content>
              <Tabs.Content
                value="replies"
                id="showcase-replies-panel"
                aria-labelledby="showcase-replies-tab"
                className="showcase-screen"
              >
                <div className="showcase-screen-heading">
                  <div>
                    <h3>Google reviews & replies</h3>
                    <p>
                      Read the review. Edit the draft. Approve with confidence.
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
                  <div className="showcase-draft">
                    <span className="eyebrow">
                      <Sparkles size={14} /> SAMPLE REPLY DRAFT
                    </span>
                    <p>{reviews[0].draft}</p>
                    <div>
                      <Check size={16} /> Yours to edit and approve.
                    </div>
                    <small>
                      No live AI call. Nothing is published to Google.
                    </small>
                  </div>
                </div>
              </Tabs.Content>
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

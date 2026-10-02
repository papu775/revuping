'use client';
import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Leaf,
  MessageSquare,
  Send,
  Sparkles,
} from 'lucide-react';
import { Stars, Badge } from '../shared';
import { QrCode } from '../qr-code';
import { ConversationCurves } from '../conversation-curves';
/** Recovered from the pre-WebGL landing composition in commit 9a59e5c. */
export function HeroArtwork() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.15 });
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  return (
    <figure className="hero-feedback-art m-0 min-w-0 self-center">
      <div
        ref={ref}
        className="hero-composition feedback-composition"
        data-floating={!reduced && inView && visible ? 'running' : 'paused'}
        aria-label="Illustrative customer feedback, review request and reply previews"
      >
        <ConversationCurves variant="hero" className="inset-0 size-full" />

        <span className="composition-label">
          An illustrative customer journey
        </span>
        <div className="salon-qr">
          <div className="salon-emblem">
            <Leaf size={27} />
          </div>
          <span className="salon-wordmark">bloom & co.</span>
          <span className="salon-sub">Salon & beauty</span>
          <div className="hero-qr">
            <QrCode decorative />
          </div>
          <h3>How was your visit?</h3>
          <p>We’d love to hear about it.</p>
          <div className="qr-card-footer">
            Illustrative card · Demo preview <ArrowUpRight size={13} />
          </div>
        </div>
        <div className="floating-card feedback-float">
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
        </div>
        <div className="floating-card request-float">
          <span className="float-icon violet">
            <Send size={17} />
          </span>
          <div>
            <strong>Review request ready</strong>
            <p>Olivia Martin · Sample request</p>
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
        <span className="composition-star ping-mark" aria-hidden="true" />
        <div
          className="mini-journey"
          aria-label="Product journey: scan, share feedback, prepare reply"
        >
          {['Scan', 'Share', 'Reply'].map((step, index) => (
            <span key={step}>
              <i>{index + 1}</i>
              {step}
              {index < 2 && <ArrowRight size={12} />}
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}

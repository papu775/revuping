'use client';
import { BrandScene } from '@/components/brand-scene';
import { DemoFeedbackPreview } from '@/components/demo-feedback-preview';
import { Logo } from '@/components/shared';
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-page visual-shell">
      <BrandScene backdrop />
      <section className="auth-story">
        <Logo light />
        <div className="auth-story-copy mx-auto w-full max-w-[520px]">
          <span className="eyebrow">The work behind a good review</span>
          <h2>
            Less chasing.
            <br />
            <em>More listening.</em>
          </h2>
          <p>
            Requests, private feedback and thoughtful replies. One place to take
            the next step.
          </p>
          <div className="auth-photo-composition">
            <figure className="auth-photograph photo-frame">
              <img
                src="/images/customer-service.webp"
                width={1200}
                height={800}
                alt="Illustrative photograph of a barista listening to a customer at a neighborhood café"
                fetchPriority="high"
              />
            </figure>
            <DemoFeedbackPreview compact />
          </div>
        </div>
        <span className="auth-story-foot">
          Generated scene · Fictional feedback preview
        </span>
      </section>
      {children}
    </main>
  );
}

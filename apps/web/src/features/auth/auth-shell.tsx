'use client';
import { BrandScene } from '@/components/brand-scene';
import { Avatar } from '@/components/ui/avatar';
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
          <figure className="auth-photograph">
            <img
              src="/images/customer-service.webp"
              width={1200}
              height={800}
              alt="Illustrative photograph of a barista listening to a customer at a neighborhood café"
              fetchPriority="high"
            />
            <figcaption>
              Good service starts with listening. Original illustrative imagery.
            </figcaption>
          </figure>
          <div className="auth-photo-demo">
            <Avatar name="James Wilson" demoPortrait />
            <div>
              <strong>James · fictional demo customer</strong>
              <p>Explore the feedback workflow in the separate demo.</p>
            </div>
          </div>
        </div>
        <span className="auth-story-foot">
          Fictional salon. Real workflows to explore.
        </span>
      </section>
      {children}
    </main>
  );
}

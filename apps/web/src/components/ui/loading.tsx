'use client';
import { usePathname } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
export function InlineSpinner() {
  return (
    <LoaderCircle
      aria-hidden="true"
      className="animate-spin motion-reduce:animate-none"
      size={17}
    />
  );
}
function Lines({
  count = 4,
  height = 54,
}: {
  count?: number;
  height?: number;
}) {
  return (
    <>
      {Array.from({ length: count }, (_, id) => (
        <div key={id} className="loading-skeleton" style={{ height }} />
      ))}
    </>
  );
}
export function DashboardSkeleton({ detail = false }: { detail?: boolean }) {
  const section = usePathname().split('/').pop() || 'dashboard';
  const overview = !detail && section === 'dashboard';
  const cards = ['staff', 'integrations', 'billing'].includes(section);
  const single = ['requests', 'onboarding'].includes(section);
  const metricCount = [
    'requests',
    'campaigns',
    'reminders',
    'repeat-visits',
  ].includes(section)
    ? 3
    : ['reports', 'billing', 'dashboard'].includes(section)
      ? 4
      : 0;
  return (
    <div
      className="dashboard-skeleton"
      aria-busy="true"
      role="status"
      aria-label="Loading dashboard"
    >
      <div className="loading-skeleton" style={{ width: '60%', height: 44 }} />
      <div className="loading-skeleton" style={{ width: '75%', height: 24 }} />
      {overview && (
        <>
          <div className="skeleton-card">
            <Lines count={1} height={50} />
          </div>
          <div className="owner-task-grid">
            {[1, 2].map((id) => (
              <div className="skeleton-card" key={id}>
                <Lines count={4} height={40} />
              </div>
            ))}
          </div>
        </>
      )}
      {!!metricCount && (
        <div
          className="skeleton-cards"
          style={{
            gridTemplateColumns: `repeat(${metricCount}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: metricCount }, (_, id) => (
            <div key={id} className="skeleton-card">
              <Lines count={1} height={18} />
              <div
                className="loading-skeleton"
                style={{ width: '50%', height: 40 }}
              />
              <Lines count={1} height={18} />
            </div>
          ))}
        </div>
      )}
      {cards ? (
        <div className="product-card-grid">
          {[1, 2, 3].map((id) => (
            <div key={id} className="skeleton-card">
              <Lines count={1} height={44} />
              <Lines count={2} height={100} />
              <Lines count={1} height={48} />
            </div>
          ))}
        </div>
      ) : single ? (
        <div className="skeleton-card">
          <Lines
            count={section === 'onboarding' ? 6 : 4}
            height={section === 'onboarding' ? 54 : 84}
          />
        </div>
      ) : (
        <div className="skeleton-panels">
          <div className="skeleton-card">
            <Lines count={4} height={84} />
          </div>
          <div className="skeleton-card">
            <div
              className="loading-skeleton"
              style={{ width: '50%', height: 48 }}
            />
            <Lines count={2} height={120} />
            <div
              className="loading-skeleton"
              style={{ width: '65%', height: 48 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

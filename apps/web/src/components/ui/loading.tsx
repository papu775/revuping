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
export function DashboardSkeleton({ detail = false }: { detail?: boolean }) {
  const requests = usePathname().endsWith('/requests');
  return (
    <div
      className="dashboard-skeleton"
      aria-busy="true"
      role="status"
      aria-label="Loading dashboard"
    >
      <div className="loading-skeleton" style={{ width: '60%', height: 44 }} />
      {(!detail || requests) && (
        <div
          className="skeleton-cards"
          style={
            requests
              ? { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }
              : undefined
          }
        >
          {(requests ? [1, 2, 3] : [1, 2, 3, 4]).map((i) => (
            <div key={i} className="skeleton-card">
              <div className="loading-skeleton" />
              <div
                className="loading-skeleton"
                style={{ width: '50%', height: 40 }}
              />
              <div className="loading-skeleton" />
            </div>
          ))}
        </div>
      )}
      {requests ? (
        <div className="skeleton-card">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="loading-skeleton" style={{ height: 84 }} />
          ))}
        </div>
      ) : (
        <div className="skeleton-panels">
          <div className="skeleton-card">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="loading-skeleton"
                style={{ height: 108 }}
              />
            ))}
          </div>
          <div className="skeleton-card">
            <div
              className="loading-skeleton"
              style={{ width: '50%', height: 48 }}
            />
            <div className="loading-skeleton" style={{ height: 180 }} />
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

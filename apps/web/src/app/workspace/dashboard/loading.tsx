export default function Loading() {
  return (
    <div
      className="dashboard-shell real-dashboard flex min-h-screen bg-canvas"
      aria-busy="true"
      role="status"
      aria-label="Loading your workspace"
    >
      <aside className="sidebar max-[600px]:hidden" aria-hidden="true">
        <div className="loading-skeleton m-6 h-12" />
      </aside>
      <div className="dashboard-main min-w-0 flex-1 ml-[248px] max-[1100px]:ml-[226px] max-[800px]:ml-[208px] max-[600px]:ml-0">
        <div
          className="dashboard-topbar flex h-[77px] items-center justify-between gap-4 border-b border-line px-8 max-[800px]:h-[72px] max-[600px]:px-4"
          aria-hidden="true"
        >
          <div className="loading-skeleton h-6 w-28" />
          <div className="loading-skeleton h-12 w-[210px] max-[600px]:w-[140px]" />
        </div>
        <main className="dashboard-content p-8 max-[1100px]:px-6 max-[800px]:px-5 max-[600px]:px-[18px]">
          <div className="loading-skeleton mb-8 h-28" />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="loading-skeleton h-64" />
            <div className="loading-skeleton h-64" />
            <div className="loading-skeleton h-36 lg:col-span-2" />
          </div>
        </main>
      </div>
    </div>
  );
}

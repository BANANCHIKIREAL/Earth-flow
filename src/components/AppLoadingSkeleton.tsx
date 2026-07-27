function SkeletonLine({ width = "100%" }: { width?: string }) {
  return <span className="app-skeleton-block h-2.5 rounded-full" style={{ width }} />;
}

export function AppLoadingSkeleton() {
  return (
    <div className="dark app-loading-skeleton" role="status" aria-label="Loading Earth Flow">
      <div className="app-loading-glow app-loading-glow-a" aria-hidden="true" />
      <div className="app-loading-glow app-loading-glow-b" aria-hidden="true" />

      <header className="app-loading-header" aria-hidden="true">
        <div className="flex items-center gap-2.5">
          <span className="app-skeleton-block h-2.5 w-2.5 rounded-full" />
          <span className="app-skeleton-block h-3 w-24 rounded-full" />
        </div>
        <span className="app-skeleton-block h-9 w-9 rounded-full" />
      </header>

      <main className="app-loading-grid" aria-hidden="true">
        <aside className="app-loading-card app-loading-sidebar">
          <SkeletonLine width="34%" />
          <div className="app-loading-nav-stack">
            {[0, 1, 2].map((item) => (
              <div key={item} className="app-loading-nav-item">
                <span className="app-skeleton-block h-7 w-7 rounded-lg" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <SkeletonLine width={item === 1 ? "58%" : "72%"} />
                  <SkeletonLine width={item === 2 ? "38%" : "46%"} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-auto flex items-center gap-3">
            <span className="app-skeleton-block h-9 w-9 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <SkeletonLine width="70%" />
              <SkeletonLine width="42%" />
            </div>
          </div>
        </aside>

        <section className="app-loading-card app-loading-focus">
          <div className="flex items-center justify-between">
            <SkeletonLine width="18%" />
            <span className="app-skeleton-block h-7 w-20 rounded-full" />
          </div>
          <div className="app-loading-timer">
            <div className="app-loading-timer-inner">
              <SkeletonLine width="52%" />
              <SkeletonLine width="32%" />
            </div>
          </div>
          <div className="app-loading-controls">
            <span className="app-skeleton-block h-10 w-10 rounded-full" />
            <span className="app-skeleton-block h-12 w-28 rounded-full" />
            <span className="app-skeleton-block h-10 w-10 rounded-full" />
          </div>
          <div className="app-loading-task-list">
            {[0, 1, 2].map((item) => (
              <div key={item} className="app-loading-task">
                <span className="app-skeleton-block h-4 w-4 rounded-full" />
                <SkeletonLine width={item === 0 ? "76%" : item === 1 ? "62%" : "70%"} />
              </div>
            ))}
          </div>
        </section>

        <aside className="app-loading-card app-loading-mixer">
          <div className="flex items-center justify-between">
            <SkeletonLine width="38%" />
            <span className="app-skeleton-block h-7 w-7 rounded-full" />
          </div>
          <div className="app-loading-sound-grid">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="app-loading-sound">
                <span className="app-skeleton-block h-9 w-9 rounded-xl" />
                <div className="flex flex-1 flex-col gap-2">
                  <SkeletonLine width={item % 2 ? "58%" : "72%"} />
                  <SkeletonLine width="100%" />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </main>

      <span className="sr-only">Loading Earth Flow</span>
    </div>
  );
}

export default function HistoryLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 skeleton w-40" />
        <div className="h-4 skeleton w-64" />
      </div>

      {/* Survey cards skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-5 skeleton w-48" />
                <div className="h-3 skeleton w-64" />
                <div className="flex gap-4">
                  <div className="h-3 skeleton w-20" />
                  <div className="h-3 skeleton w-16" />
                  <div className="h-3 skeleton w-28" />
                </div>
              </div>
              <div className="h-6 skeleton w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

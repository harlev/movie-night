import { StatCardSkeleton, MovieCardSkeleton } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-3 skeleton w-24" />
        <div className="h-7 skeleton w-64" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Live survey skeleton */}
      <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]/50 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-6 skeleton w-12" />
          <div className="h-6 skeleton w-48" />
        </div>
        <div className="h-4 skeleton w-64" />
        <div className="flex items-center justify-between">
          <div className="h-4 skeleton w-40" />
          <div className="h-10 skeleton w-28 rounded-xl" />
        </div>
      </div>

      {/* Recent movies skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 skeleton w-40" />
          <div className="h-4 skeleton w-24" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton ${className}`} />;
}

export function MovieCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)]/50">
      <div className="w-full aspect-[2/3] skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-4 skeleton w-3/4" />
        <div className="h-3 skeleton w-1/2" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]/50 p-6 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full skeleton" />
        <div className="h-3 skeleton w-24" />
      </div>
      <div className="h-8 skeleton w-16" />
    </div>
  );
}

import { MovieCardSkeleton } from '@/components/ui/Skeleton';

export default function MoviesLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 skeleton w-32" />
          <div className="h-4 skeleton w-40" />
        </div>
        <div className="h-10 skeleton w-32 rounded-xl" />
      </div>

      {/* Filters skeleton */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 h-11 skeleton rounded-xl" />
        <div className="h-11 skeleton w-40 rounded-xl" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

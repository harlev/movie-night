export default function MovieDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="h-5 skeleton w-32" />

      <div className="bg-[var(--color-surface)] rounded-xl overflow-hidden border border-[var(--color-border)]/50 shadow-lg shadow-black/20">
        <div className="md:flex">
          <div className="md:w-1/3">
            <div className="skeleton w-full aspect-[2/3]" />
          </div>
          <div className="p-6 md:flex-1 space-y-4">
            <div className="h-9 skeleton w-1/3" />
            <div className="h-6 skeleton w-1/2" />
            <div className="h-6 skeleton w-2/3" />
            <div className="space-y-2">
              <div className="h-5 skeleton w-full" />
              <div className="h-5 skeleton w-full" />
              <div className="h-5 skeleton w-4/5" />
            </div>
            <div className="flex gap-3 pt-2">
              <div className="h-10 skeleton w-36 rounded-xl" />
              <div className="h-10 skeleton w-28 rounded-xl" />
              <div className="h-10 skeleton w-28 rounded-xl" />
            </div>
            <div className="pt-4 border-t border-[var(--color-border)]/50">
              <div className="h-5 skeleton w-2/3" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-border)]/50 shadow-lg shadow-black/20 space-y-4">
        <div className="h-7 skeleton w-40" />
        <div className="h-24 skeleton w-full rounded-xl" />
        <div className="h-24 skeleton w-full rounded-xl" />
      </div>
    </div>
  );
}

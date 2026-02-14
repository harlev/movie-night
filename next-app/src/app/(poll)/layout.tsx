export default function PollLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-background)] overflow-x-hidden">
      <main className="max-w-4xl mx-auto px-2 sm:px-6 py-4 sm:py-8">
        {children}
      </main>
    </div>
  );
}

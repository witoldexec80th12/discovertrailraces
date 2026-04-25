export default function RaceLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <div className="h-14 bg-white border-b border-neutral-200 animate-pulse" />

      <div className="relative w-full h-64 sm:h-80 bg-neutral-300 animate-pulse">
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="mx-auto max-w-4xl space-y-2">
            <div className="h-4 w-32 bg-white/30 rounded" />
            <div className="h-8 w-2/3 bg-white/30 rounded" />
            <div className="h-4 w-1/3 bg-white/30 rounded" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-neutral-200 bg-white p-4 animate-pulse space-y-2">
              <div className="h-3 w-16 bg-neutral-100 rounded" />
              <div className="h-5 w-20 bg-neutral-200 rounded" />
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6 animate-pulse space-y-3">
          <div className="h-4 w-full bg-neutral-100 rounded" />
          <div className="h-4 w-5/6 bg-neutral-100 rounded" />
          <div className="h-4 w-4/6 bg-neutral-100 rounded" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-neutral-200 bg-white p-4 animate-pulse space-y-2">
              <div className="h-3 w-16 bg-neutral-100 rounded" />
              <div className="h-4 w-24 bg-neutral-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

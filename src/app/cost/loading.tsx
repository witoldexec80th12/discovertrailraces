export default function CostLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <div className="h-14 bg-white border-b border-neutral-200 animate-pulse" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-12 pb-4">
        <div className="h-8 w-48 bg-neutral-200 rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-72 bg-neutral-100 rounded animate-pulse" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-12 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 rounded-xl border border-neutral-200 bg-white p-4 animate-pulse"
          >
            <div className="hidden sm:block w-28 h-20 rounded-lg bg-neutral-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-2/3 bg-neutral-200 rounded" />
              <div className="h-3 w-1/3 bg-neutral-100 rounded" />
              <div className="h-3 w-full bg-neutral-100 rounded" />
              <div className="h-3 w-4/5 bg-neutral-100 rounded" />
            </div>
            <div className="hidden md:flex flex-col gap-2 items-end w-28 shrink-0">
              <div className="h-6 w-16 bg-neutral-200 rounded" />
              <div className="h-3 w-20 bg-neutral-100 rounded" />
              <div className="h-3 w-20 bg-neutral-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

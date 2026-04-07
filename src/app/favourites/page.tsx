"use client";

import Link from "next/link";
import { useFavourites } from "@/lib/favouritesContext";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00Z");
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function FavouritesPage() {
  const { favourites, removeFavourite, clearAll } = useFavourites();

  if (favourites.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-8 flex items-center gap-4">
            <Link
              href="/cost"
              className="text-sm font-semibold text-neutral-500 hover:text-neutral-800 transition-colors"
            >
              ← Cost Index
            </Link>
          </div>
          <div className="text-center py-24 rounded-2xl border border-dashed border-neutral-200 bg-white">
            <div className="text-6xl mb-5 select-none">♡</div>
            <h1 className="text-2xl font-bold text-neutral-800 mb-2">No saved races yet</h1>
            <p className="text-neutral-400 text-sm mb-8 max-w-xs mx-auto">
              Heart any race on its detail page to add it to your comparison tray.
            </p>
            <Link
              href="/cost"
              className="inline-block bg-neutral-900 text-white px-7 py-3 rounded-full text-sm font-semibold hover:bg-neutral-700 transition-colors"
            >
              Browse races
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-white pb-32">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <Link
              href="/cost"
              className="text-sm font-semibold text-neutral-500 hover:text-neutral-800 transition-colors"
            >
              ← Cost Index
            </Link>
            <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">
              Your saved races
            </h1>
            <p className="mt-1.5 text-sm text-neutral-500">
              {favourites.length} {favourites.length === 1 ? "race" : "races"} · ordered by race date
            </p>
          </div>
          <button
            onClick={clearAll}
            className="shrink-0 mt-1 text-xs font-semibold text-neutral-400 hover:text-red-500 underline underline-offset-2 transition-colors"
          >
            Clear all
          </button>
        </div>

        {/* Race cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {favourites.map((f) => (
            <div key={f.entryFeeId} className="relative group">
              <Link
                href={`/races/${f.slug}`}
                className="block bg-white rounded-2xl border border-neutral-200 overflow-hidden hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:border-neutral-300 transition-all duration-200"
              >
                {/* Image */}
                <div className="relative h-40 bg-neutral-100">
                  {f.imageUrl ? (
                    <img
                      src={f.imageUrl}
                      alt={f.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-200" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                  {f.country && (
                    <p className="absolute bottom-3 left-4 text-[10px] uppercase tracking-[0.15em] text-white/80">
                      {f.country}
                    </p>
                  )}
                </div>

                {/* Details */}
                <div className="p-4 sm:p-5">
                  <h2 className="font-bold text-neutral-900 text-base leading-snug tracking-tight group-hover:underline">
                    {f.name}
                  </h2>
                  {f.startDate && (
                    <p className="mt-1 text-xs text-neutral-400">{formatDate(f.startDate)}</p>
                  )}

                  <div className="mt-4 flex items-end gap-5">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-neutral-400">€ / km</p>
                      <p className="mt-0.5 text-2xl font-bold tabular-nums text-neutral-900">
                        {f.eurPerKm != null ? `€${f.eurPerKm.toFixed(2)}` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-neutral-400">Distance</p>
                      <p className="mt-0.5 text-base font-semibold tabular-nums text-neutral-700">
                        {f.distanceKm != null ? `${f.distanceKm} km` : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Remove button */}
              <button
                onClick={() => removeFavourite(f.entryFeeId)}
                aria-label="Remove from saved races"
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/90 text-neutral-400 hover:text-red-500 hover:bg-red-50 border border-neutral-200 flex items-center justify-center text-sm transition-colors shadow-sm"
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

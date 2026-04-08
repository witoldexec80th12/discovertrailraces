"use client";

import Link from "next/link";
import { useFavourites } from "@/lib/favouritesContext";

function parseDate(iso: string | null): { day: string; month: string; year: string } | null {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00Z");
  if (isNaN(d.getTime())) return null;
  return {
    day: d.toLocaleDateString("en-US", { day: "numeric", timeZone: "UTC" }),
    month: d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase(),
    year: d.toLocaleDateString("en-US", { year: "numeric", timeZone: "UTC" }),
  };
}

export default function FavouritesPage() {
  const { favourites, removeFavourite } = useFavourites();

  if (favourites.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-8">
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
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
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

        <div className="flex flex-col gap-3">
          {favourites.map((f) => {
            const date = parseDate(f.startDate);
            const hasLogistics = f.logistics || f.primaryAirport;

            return (
              <div key={f.entryFeeId} className="relative group">
                <Link
                  href={`/races/${f.slug}`}
                  className="block bg-white rounded-xl border border-neutral-200 hover:border-neutral-300 hover:shadow-[0_2px_12px_rgba(0,0,0,0.07)] transition-all duration-200 overflow-hidden"
                >
                  <div className="flex items-start gap-0">
                    <div className="shrink-0 w-20 sm:w-24 flex flex-col items-center justify-center py-5 px-2 bg-[#1a2e4a] text-white text-center self-stretch">
                      {date ? (
                        <>
                          <span className="text-[11px] font-bold tracking-widest uppercase opacity-75">
                            {date.month}
                          </span>
                          <span className="text-3xl sm:text-4xl font-bold leading-none mt-0.5">
                            {date.day}
                          </span>
                          <span className="text-[11px] opacity-60 mt-1">
                            {date.year}
                          </span>
                        </>
                      ) : (
                        <span className="text-xl opacity-40">—</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 py-4 px-4 sm:px-5">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-neutral-400 mb-0.5">
                        {[f.country].filter(Boolean).join(" · ")}
                      </p>
                      <h2 className="text-base sm:text-lg font-bold text-neutral-900 leading-snug tracking-tight group-hover:underline">
                        {f.name}
                      </h2>

                      {f.terrain && <p className="mt-1 text-xs text-neutral-400">{f.terrain}</p>}

                      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5">
                        {f.eurPerKm != null && (
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-neutral-400 block">€ / km</span>
                            <span className="text-lg font-bold tabular-nums text-neutral-900">
                              €{f.eurPerKm.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {f.distanceKm != null && (
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-neutral-400 block">Distance</span>
                            <span className="text-base font-semibold tabular-nums text-neutral-700">
                              {f.distanceKm} km
                            </span>
                          </div>
                        )}
                        {f.elevationM != null && (
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-neutral-400 block">Elevation</span>
                            <span className="text-base font-semibold tabular-nums text-neutral-700">
                              {Math.round(f.elevationM).toLocaleString()} m
                            </span>
                          </div>
                        )}
                        {f.percentIncrease != null && (
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-neutral-400 block">Grade</span>
                            <span className="text-base font-semibold tabular-nums text-neutral-700">
                              {Math.round(f.percentIncrease)}%
                            </span>
                          </div>
                        )}
                      </div>

                      {(hasLogistics || f.logistics) && (
                        <div className="mt-3 pt-3 border-t border-neutral-100 flex flex-wrap gap-x-4 gap-y-1">
                          {f.primaryAirport && (
                            <span className="text-xs text-neutral-500">
                              <span className="text-neutral-300 mr-1">✈</span>
                              <span className="font-medium text-neutral-600">Closest Airport:</span>{" "}
                              {f.primaryAirport}
                            </span>
                          )}
                          {f.logistics && (
                            <span className="text-xs text-neutral-500 leading-snug">
                              {f.logistics}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>

                <button
                  onClick={() => removeFavourite(f.entryFeeId)}
                  aria-label="Remove from saved races"
                  className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-white text-neutral-300 hover:text-red-500 hover:bg-red-50 border border-neutral-200 flex items-center justify-center text-xs transition-colors shadow-sm"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

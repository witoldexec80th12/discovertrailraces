"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type AirtableAttachment = { url: string };

type SearchRecord = {
  id: string;
  fields: {
    ID?: string;
    LKP_country?: string | string[];
    "AUTO €/km"?: number;
    "Distance (km)"?: string | number | (string | number)[];
    "Race Slug"?: string[];
    LKP_featured_image?: AirtableAttachment[];
    temporary_image?: AirtableAttachment[];
    "AUTO Price Bands"?: string;
    "Distance Start Date"?: string;
  };
};

function asText(v: unknown): string {
  if (Array.isArray(v)) return v.filter(Boolean).join(", ");
  if (v === null || v === undefined) return "";
  return String(v);
}

function pickFirstUrl(a?: AirtableAttachment[]): string | null {
  const url = a?.[0]?.url;
  return typeof url === "string" && url.length ? url : null;
}

function extractName(idField: string): string {
  const parts = idField.split(/\s[–—-]\s/);
  return parts.length > 1 ? parts.slice(0, -1).join(" – ") : idField;
}

function extractDistance(idField: string): string {
  const parts = idField.split(/\s[–—-]\s/);
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`,
        );
        const data = await res.json();
        setResults(data.records ?? []);
        setSearched(true);
      } catch {
        setResults([]);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/cost"
            className="text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            ← Cost Index
          </Link>
          <h1 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
            Search Races
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Type a race name to find it in the database
          </p>
        </div>

        {/* Search input */}
        <div className="relative mb-6">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            placeholder="e.g. UTMB, Lavaredo, Madeira…"
            className="w-full border border-neutral-300 rounded-xl pl-9 pr-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400 shadow-sm"
          />
          {loading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs animate-pulse">
              Searching…
            </span>
          )}
        </div>

        {/* Results */}
        {!searched && !loading && (
          <p className="text-center text-sm text-neutral-400 mt-16">
            Start typing to search races
          </p>
        )}

        {searched && results.length === 0 && !loading && (
          <p className="text-center text-sm text-neutral-500 mt-16">
            No races found for &ldquo;{query}&rdquo;
          </p>
        )}

        {results.length > 0 && (
          <ul className="space-y-3">
            {results.map((r) => {
              const idText = asText(r.fields.ID);
              const name = extractName(idText);
              const dist = extractDistance(idText);
              const slug = r.fields["Race Slug"]?.[0] ?? "";
              const country = asText(r.fields.LKP_country);
              const epk = r.fields["AUTO €/km"];
              const imgUrl =
                pickFirstUrl(r.fields.LKP_featured_image) ??
                pickFirstUrl(r.fields.temporary_image);

              if (!slug) return null;

              return (
                <li key={r.id}>
                  <Link
                    href={`/races/${slug}?from=/search&title=Search`}
                    className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-3 hover:shadow-md transition-shadow group"
                  >
                    {/* Thumbnail */}
                    <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-neutral-100">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={name}
                          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-200" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 leading-snug line-clamp-2">
                        {name}
                      </p>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        {[dist, country].filter(Boolean).join(" · ")}
                      </p>
                    </div>

                    {/* €/km */}
                    {epk != null && (
                      <div className="shrink-0 text-right">
                        <p className="text-base font-bold text-neutral-900">
                          €{epk.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-neutral-400">/&thinsp;km</p>
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

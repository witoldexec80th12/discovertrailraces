import { airtableFetch } from "@/lib/airtable";
import { AIRTABLE } from "@/lib/airtableConfig";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import HeartButton from "@/components/HeartButton";

export const revalidate = 3600;

type AirtableAttachment = {
  id: string;
  url: string;
  filename: string;
  width?: number;
  height?: number;
  thumbnails?: Record<string, { url: string; width: number; height: number }>;
};

type EntryFeeFields = {
  ID?: string | number;
  "Race Event"?: string | string[];
  LKP_country?: string | string[];
  LKP_region?: string | string[];
  "Distance (km)"?: string | string[];
  Currency?: string;
  "AUTO Fee used"?: number;
  "AUTO €/km"?: number;
  "Last Checked "?: string;
  LKP_featured_image?: AirtableAttachment[];
  temporary_image?: AirtableAttachment[];
  "Featured Blurb"?: string | string[];
  FINAL_blurb?: string | string[];
  "Race Slug"?: string[];
  "Distance Start Date"?: string;
  "Is Primary Distance (from Distance)"?: boolean | boolean[];
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

function formatMoney(amount: number | null, currency?: string): string {
  if (amount === null || !Number.isFinite(amount)) return "—";
  return `${Math.round(amount).toLocaleString("en")} ${currency ?? ""}`.trim();
}

function formatEurPerKm(epk: number | null): string {
  if (epk === null || !Number.isFinite(epk)) return "—";
  return `€${epk.toFixed(2)}`;
}

function extractEventName(idField: string): { eventName: string; distance: string } {
  const parts = idField.split(/\s[–—-]\s/);
  if (parts.length > 1) {
    return {
      eventName: parts.slice(0, -1).join(" – "),
      distance: parts[parts.length - 1],
    };
  }
  return { eventName: idField, distance: "" };
}

function isPrimary(row: { fields: EntryFeeFields }): boolean {
  const val = row.fields["Is Primary Distance (from Distance)"];
  if (Array.isArray(val)) return val.some(Boolean);
  return !!val;
}

async function fetchRowsForSlug(slug: string) {
  const filterByFormula = `FIND("${slug}", ARRAYJOIN({Race Slug}))`;
  // No view filter — fetch all distances, including those not in the public view
  return airtableFetch<EntryFeeFields>(AIRTABLE.TABLES.ENTRY_FEES, {
    filterByFormula,
    pageSize: 50,
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const rows = await fetchRowsForSlug(slug);
  if (!rows.length) return { title: "Race Event | Discover Trail Races" };

  const primary = rows.find(isPrimary) ?? rows[0];
  const { eventName } = extractEventName(asText(primary.fields.ID));
  const country = asText(primary.fields.LKP_country);

  return {
    title: `${eventName}${country ? ` · ${country}` : ""} | Discover Trail Races`,
    description: `Race details for ${eventName}: distances, entry fees, and cost per km.`,
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const rows = await fetchRowsForSlug(slug);

  if (!rows.length) notFound();

  // Single distance → redirect to the full race detail page
  if (rows.length === 1) {
    redirect(`/races/${slug}`);
  }

  // Multiple distances — sort: primary first, then by distance km ascending
  const sorted = [...rows].sort((a, b) => {
    const aP = isPrimary(a) ? 0 : 1;
    const bP = isPrimary(b) ? 0 : 1;
    if (aP !== bP) return aP - bP;
    const aKm = Number(Array.isArray(a.fields["Distance (km)"]) ? a.fields["Distance (km)"][0] : a.fields["Distance (km)"]) || 0;
    const bKm = Number(Array.isArray(b.fields["Distance (km)"]) ? b.fields["Distance (km)"][0] : b.fields["Distance (km)"]) || 0;
    return bKm - aKm; // longer distance first within non-primary
  });

  const primary = sorted.find(isPrimary) ?? sorted[0];
  const pf = primary.fields;

  const { eventName } = extractEventName(asText(pf.ID));
  const country = asText(pf.LKP_country);
  const region = asText(pf.LKP_region);
  const location = [country, region].filter(Boolean).join(" · ");
  const imageUrl = pickFirstUrl(pf.LKP_featured_image) ?? pickFirstUrl(pf.temporary_image);
  const blurb = asText(pf.FINAL_blurb) || asText(pf["Featured Blurb"]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">

        {/* Nav */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/cost"
            className="text-sm font-semibold text-neutral-700 hover:text-neutral-900"
          >
            ← Back to Cost Index
          </Link>
          <Link
            href="/temphome"
            className="text-sm font-semibold text-neutral-700 hover:text-neutral-900"
          >
            Home
          </Link>
        </div>

        {/* Hero */}
        <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
          <div className="relative h-[200px] sm:h-[280px]">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={eventName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-neutral-100" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
              {location && (
                <p className="text-[11px] uppercase tracking-[0.15em] text-white/75">
                  {location}
                </p>
              )}
              <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {eventName}
              </h1>
              <p className="mt-1 text-sm text-white/80">
                {sorted.length} distances available
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            {blurb && (
              <p className="text-sm sm:text-base leading-relaxed text-neutral-700 mb-8">
                {blurb}
              </p>
            )}

            {/* Distance cards */}
            <h2 className="text-[10px] uppercase tracking-wider text-neutral-400 mb-5">
              Race Distances
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {sorted.map((row) => {
                const f = row.fields;
                const isP = isPrimary(row);
                const { distance } = extractEventName(asText(f.ID));
                const distKm = Array.isArray(f["Distance (km)"])
                  ? f["Distance (km)"][0]
                  : f["Distance (km)"];
                const distLabel = distance || (distKm ? `${distKm} km` : "—");
                const fee = typeof f["AUTO Fee used"] === "number" && f["AUTO Fee used"] > 0
                  ? f["AUTO Fee used"]
                  : null;
                const epk = typeof f["AUTO €/km"] === "number" && f["AUTO €/km"] > 0
                  ? f["AUTO €/km"]
                  : null;
                const rowSlug = f["Race Slug"]?.[0];
                const href = isP && rowSlug ? `/races/${rowSlug}` : null;

                const distKmNum = Array.isArray(distKm)
                  ? parseFloat(String(distKm)) || null
                  : distKm != null ? parseFloat(String(distKm)) || null : null;

                const heartEntry = isP && rowSlug ? {
                  entryFeeId: row.id,
                  slug: rowSlug,
                  name: eventName,
                  imageUrl: imageUrl ?? null,
                  eurPerKm: epk,
                  distanceKm: distKmNum,
                  startDate: f["Distance Start Date"] ?? null,
                  country: asText(pf.LKP_country) || null,
                } : null;

                const cardInner = (
                  <div
                    className={`h-full rounded-2xl flex flex-col gap-6 transition-all duration-200 ${
                      isP
                        ? "border-2 border-neutral-900 bg-white p-7 sm:p-9 shadow-lg hover:shadow-xl"
                        : "border border-neutral-200 bg-neutral-50 p-7 sm:p-9"
                    }`}
                  >
                    {/* Top: badge + distance */}
                    <div>
                      {isP ? (
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 fill-neutral-900 text-neutral-900" />
                            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-900">
                              Main Event
                            </span>
                          </div>
                          {heartEntry && (
                            <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                              <HeartButton entry={heartEntry} size="sm" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mb-3 h-5" />
                      )}
                      <span
                        className={`block tracking-tight leading-none ${
                          isP
                            ? "text-5xl sm:text-6xl font-extrabold text-neutral-900"
                            : "text-4xl sm:text-5xl font-bold text-neutral-500"
                        }`}
                      >
                        {distLabel}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                          Entry Fee
                        </p>
                        <p className={`text-2xl sm:text-3xl tabular-nums ${isP ? "font-extrabold text-neutral-900" : "font-bold text-neutral-500"}`}>
                          {formatMoney(fee, f.Currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                          Price per KM
                        </p>
                        <p className={`text-2xl sm:text-3xl tabular-nums ${isP ? "font-extrabold text-neutral-900" : "font-bold text-neutral-500"}`}>
                          {formatEurPerKm(epk)}
                        </p>
                      </div>
                    </div>

                    {/* Footer message */}
                    <div className="mt-auto pt-4 border-t border-neutral-100">
                      {isP ? (
                        <p className="text-sm font-semibold text-neutral-900 group-hover:underline">
                          View full race details →
                        </p>
                      ) : (
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          Click on the Main Event for more information regarding the race.
                        </p>
                      )}
                    </div>
                  </div>
                );

                return href ? (
                  <Link key={row.id} href={href} className="group block">
                    {cardInner}
                  </Link>
                ) : (
                  <div key={row.id}>{cardInner}</div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-8 text-xs text-neutral-400">
              Last checked:{" "}
              {(() => {
                const lc = pf["Last Checked "];
                if (!lc) return "—";
                const d = new Date(lc);
                if (isNaN(d.getTime())) return lc;
                return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
              })()}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

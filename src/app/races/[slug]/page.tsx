// src/app/races/[slug]/page.tsx
import { airtableFetch } from "@/lib/airtable";
import { AIRTABLE } from "@/lib/airtableConfig";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 3600; // 1 hour ISR (safe MVP default)

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
  Distance?: string | string[];
  "Distance (km)"?: string | string[];
  Currency?: string;
  "AUTO Fee used"?: number;
  "AUTO €/km"?: number;
  "AUTO Price Bands"?: string;
  "Last Checked "?: string;
  voices_name?: string;
  voices_main_description?: string;
  voices_surprise?: string;
  voices_technicality?: string;
  voices_shoes_poles_pack?: string;
  voices_logistics?: string;
  voices_tip?: string;
  voices_full_transcript_url?: string;
  voices_year_ran?: string | number;
  voices_itra_index?: string | number;
  voices_finish_time?: string;
  voices_aid_stations?: string;
  voices_views_and_vibes?: string;
  

  // images + blurbs
  LKP_featured_image?: AirtableAttachment[];
  temporary_image?: AirtableAttachment[];
  "Featured Blurb"?: string | string[];
  FINAL_blurb?: string | string[];

  // routing
  "Race Slug"?: string[];

  // date
  "Distance Start Date"?: string;

  // optional (based on your screenshot / newer LKP fields)
  "Is Primary Distance (from Distance)"?: boolean;

  LKP_terrain?: string | string[];
  LKP_elevation?: number | string;
  "LKP_%increase"?: number | string;
  LKP_utmb?: boolean;
  "UTMB_series?"?: string | string[];
  "WSER?"?: string | string[];
  "Tor?"?: string | string[];
  LKP_logistics?: string | string[];
  LKP_primaryairport?: string | string[];
  LKP_airportcode?: string | string[];
  LKP_lessthan30?: boolean;
  LKP_cartransfertime?: string | number;
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
  const cur = currency || "";
  // keep it simple for MVP (avoid Intl currency mismatch issues across EUR/BGN/etc)
  return `${Math.round(amount).toLocaleString("en")} ${cur}`.trim();
}

function formatEurPerKm(epk: number | null): string {
  if (epk === null || !Number.isFinite(epk)) return "—";
  return `€${epk.toFixed(2)}`;
}

function formatDateShort(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function extractNameAndDistance(idField: string): {
  name: string;
  distance: string;
} {
  // matches: "Beara Way Ultra (IMRA) – 161 km"
  const parts = idField.split(/\s[–—-]\s/);
  if (parts.length > 1) {
    return {
      name: parts.slice(0, -1).join(" – "),
      distance: parts[parts.length - 1],
    };
  }
  return { name: idField, distance: "" };
}

async function fetchEntryFeeRowsForSlug(slug: string) {
  // We fetch from Entry Fees and filter by formula (works even without a dedicated view)
  // "Race Slug" is an array field in your schema; Airtable stores it as text in formula context.
  // We use FIND() to be tolerant.
  const filterByFormula = `FIND("${slug}", ARRAYJOIN({Race Slug}))`;

  const rows = await airtableFetch<EntryFeeFields>(AIRTABLE.TABLES.ENTRY_FEES, {
    view: AIRTABLE.VIEWS.ENTRY_FEES_PUBLIC, // ok to keep public view
    filterByFormula,
    pageSize: 50,
  });

  return rows;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const rows = await fetchEntryFeeRowsForSlug(slug);

  const primary =
    rows.find((r) => r.fields["Is Primary Distance (from Distance)"]) ??
    rows[0];
  if (!primary) return { title: "Race | Discover Trail Races" };

  const idText =
    asText(primary.fields.ID) || asText(primary.fields["Race Event"]);
  const { name } = extractNameAndDistance(idText);

  return {
    title: `${name} | Discover Trail Races`,
    description: `Key details for ${name}: date, distance, entry fee, and cost per km.`,
  };
}

export default async function RacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const rows = await fetchEntryFeeRowsForSlug(slug);
  if (!rows.length) notFound();

  // Prefer primary distance row; otherwise first
  const row =
    rows.find((r) => r.fields["Is Primary Distance (from Distance)"]) ??
    rows[0];
  const f = row.fields;

  const idText = asText(f.ID) || asText(f["Race Event"]);
  const { name, distance } = extractNameAndDistance(idText);

  const country = asText(f.LKP_country);
  const region = asText(f.LKP_region);
  const location = [country, region].filter(Boolean).join(" · ");

  const dateLabel = formatDateShort(f["Distance Start Date"]);
  const fee =
    typeof f["AUTO Fee used"] === "number" && f["AUTO Fee used"] > 0
      ? f["AUTO Fee used"]
      : null;
  const epk =
    typeof f["AUTO €/km"] === "number" && f["AUTO €/km"] > 0
      ? f["AUTO €/km"]
      : null;

  const imageUrl =
    pickFirstUrl(f.LKP_featured_image) ?? pickFirstUrl(f.temporary_image);
  const blurb = asText(f.FINAL_blurb) || asText(f["Featured Blurb"]);

  const terrain = asText(f.LKP_terrain);
  const elevation = f.LKP_elevation ?? "";
  const pctIncreaseRaw = f["LKP_%increase"];
  const pctIncrease =
    pctIncreaseRaw !== undefined && pctIncreaseRaw !== ""
      ? typeof pctIncreaseRaw === "number"
        ? parseFloat(pctIncreaseRaw.toFixed(2))
        : parseFloat(parseFloat(String(pctIncreaseRaw)).toFixed(2)) ||
          pctIncreaseRaw
      : "";
  const utmbSeries = asText(f["UTMB_series?"]);
  const isUtmb = utmbSeries.toLowerCase().includes("utmb");
  const wserSeries = asText(f["WSER?"]);
  const torSeries = asText(f["Tor?"]);

  const logistics = asText(f.LKP_logistics);
  const airport = asText(f.LKP_primaryairport);
  const airportCode = asText(f.LKP_airportcode);

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Simple top nav */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/cost"
            className="text-sm font-semibold text-neutral-700 hover:text-neutral-900"
          >
            ← Back to Cost Index
          </Link>
          <Link
            href="/"
            className="text-sm font-semibold text-neutral-700 hover:text-neutral-900"
          >
            Home
          </Link>
        </div>

        {/* Hero */}
        <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
          <div className="relative h-[240px] sm:h-[320px]">
            {imageUrl ? (
              // NOTE: using <img> avoids Next remote image config for MVP
              <img
                src={imageUrl}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-neutral-100" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
              <p className="text-[11px] uppercase tracking-[0.15em] text-white/75">
                {location || "—"}
              </p>
              <h1 className="mt-1 text-2xl sm:text-4xl font-bold tracking-tight text-white">
                {name}
              </h1>
              {distance && (
                <p className="mt-1 text-sm text-white/85">{distance}</p>
              )}
            </div>
          </div>

          {/* Key stats */}
          <div className="p-5 sm:p-7">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-neutral-400">
                  Date
                </p>
                <p className="mt-1 text-sm font-semibold text-neutral-900">
                  {dateLabel || "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-neutral-400">
                  Entry fee
                </p>
                <p className="mt-1 text-sm font-semibold text-neutral-900">
                  {formatMoney(fee, f.Currency)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-neutral-400">
                  € / km
                </p>
                <p className="mt-1 text-sm font-semibold text-neutral-900">
                  {formatEurPerKm(epk)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-neutral-400">
                  Series
                </p>
                <div className="mt-1 flex flex-col gap-0.5">
                  {isUtmb && (
                    <p className="text-sm font-semibold text-neutral-900">
                      {utmbSeries}
                    </p>
                  )}
                  {wserSeries && (
                    <p className="text-sm font-semibold text-neutral-900">
                      {wserSeries}
                    </p>
                  )}
                  {torSeries && (
                    <p className="text-sm font-semibold text-neutral-900">
                      {torSeries}
                    </p>
                  )}
                  {!isUtmb && !wserSeries && !torSeries && (
                    <p className="text-sm font-semibold text-neutral-900">—</p>
                  )}
                </div>
              </div>
            </div>

            {blurb && (
              <div className="mt-6">
                <p className="text-sm leading-relaxed text-neutral-700">
                  {blurb}
                </p>
              </div>
            )}

            {/* Planning facts */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-neutral-200 p-4 bg-neutral-50">
                <p className="text-[10px] uppercase tracking-wider text-neutral-500">
                  Terrain
                </p>
                <p className="mt-1 text-sm font-semibold text-neutral-900">
                  {terrain || "—"}
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 p-4 bg-neutral-50">
                <p className="text-[10px] uppercase tracking-wider text-neutral-500">
                  Elevation Data
                </p>
                <div className="mt-1 space-y-1">
                  {elevation ? (
                    <p className="text-sm font-semibold text-neutral-900">
                      {elevation} Meters Total
                    </p>
                  ) : null}
                  {pctIncrease ? (
                    <p className="text-sm font-semibold text-neutral-900">
                      {pctIncrease} Predicted Elevation per KM
                    </p>
                  ) : null}
                  {!elevation && !pctIncrease && (
                    <p className="text-sm font-semibold text-neutral-900">—</p>
                  )}
                </div>
                {pctIncrease && (
                  <p className="mt-3 text-xs leading-relaxed text-neutral-500">
                    In a circular course, on your average climb, you'll be going
                    up {pctIncrease} meters per KM. For context, the Tor des
                    Géants 330 loop averages{" "}
                    <span className="font-bold underline">145 meters</span> per
                    km of climbing.
                  </p>
                )}
              </div>
            </div>

            {/* Logistics */}
            {(logistics || airport || airportCode) && (
              <div className="mt-8">
                <h2 className="text-sm font-bold tracking-tight text-neutral-900">
                  Logistics
                </h2>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-neutral-200 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-400">
                      Nearest airport
                    </p>
                    <p className="mt-1 text-sm font-semibold text-neutral-900">
                      {[airport, airportCode ? `(${airportCode})` : ""]
                        .filter(Boolean)
                        .join(" ") || "—"}
                    </p>
                  </div>
                  <div className="sm:col-span-2 rounded-xl border border-neutral-200 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-400">
                      Notes
                    </p>
                    <p className="mt-1 text-sm text-neutral-700 leading-relaxed">
                      {logistics || "—"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Runner Voice */}
            {f.voices_main_description && (
              <div className="mt-10">
                {/* Section header row */}
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <div>
                    <span className="text-sm font-bold tracking-tight text-neutral-900">
                      Runner Voice
                    </span>
                    <span className="ml-2 text-xs text-neutral-500">
                      Real conversations with race participants
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    {[
                      asText(f.voices_name),
                      f.voices_year_ran ? `Ran in ${f.voices_year_ran}` : "",
                      asText(f.voices_finish_time),
                      f.voices_itra_index
                        ? `ITRA ${f.voices_itra_index}`
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>

                <div className="mt-4 rounded-2xl border-2 border-neutral-800 bg-neutral-50 p-5 shadow-md">
                  {/* Main quote */}
                  <div className="mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      Summary
                    </span>
                  </div>
                  <p className="text-[1.2rem] leading-relaxed text-neutral-900 font-medium italic">
                    “{asText(f.voices_main_description)}”
                  </p>

                  {/* Structured details */}
                  <div className="mt-5 space-y-3 text-sm text-neutral-700">
                    {f.voices_technicality && (
                      <div>
                        <span className="font-semibold text-neutral-900">
                          Technicality:
                        </span>{" "}
                        {asText(f.voices_technicality)}
                      </div>
                    )}

                    {f.voices_shoes_poles_pack && (
                      <div>
                        <span className="font-semibold text-neutral-900">
                          Shoes / poles / pack:
                        </span>{" "}
                        {asText(f.voices_shoes_poles_pack)}
                      </div>
                    )}

                    {f.voices_aid_stations && (
                      <div>
                        <span className="font-semibold text-neutral-900">
                          Aid Stations:
                        </span>{" "}
                        {asText(f.voices_aid_stations)}
                      </div>
                    )}

                    {f.voices_views_and_vibes && (
                      <div>
                        <span className="font-semibold text-neutral-900">
                          Views and Vibes:
                        </span>{" "}
                        {asText(f.voices_views_and_vibes)}
                      </div>
                    )}

                    {f.voices_logistics && (
                      <div>
                        <span className="font-semibold text-neutral-900">
                          Logistics:
                        </span>{" "}
                        {asText(f.voices_logistics)}
                      </div>
                    )}

                    {f.voices_surprise && (
                      <div>
                        <span className="font-semibold text-neutral-900">
                          What surprised them:
                        </span>{" "}
                        {asText(f.voices_surprise)}
                      </div>
                    )}

                    {f.voices_tip && (
                      <div>
                        <span className="font-semibold text-neutral-900">
                          One Tip for Runners:
                        </span>{" "}
                        {asText(f.voices_tip)}
                      </div>
                    )}
                  </div>

                  {/* Footer: interview link */}
                  {f.voices_full_transcript_url && (
                    <div className="mt-5 border-t border-neutral-200 pt-4 flex justify-end">
                      <a
                        href={asText(f.voices_full_transcript_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-neutral-900 underline hover:text-neutral-600"
                      >
                        Read full interview →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Debug / provenance */}
            <div className="mt-8 text-xs text-neutral-400">
              Last checked:{" "}
              {formatDateShort(f["Last Checked "]) || "—"}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

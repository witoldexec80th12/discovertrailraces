"use client";

import { useState } from "react";
import Link from "next/link";
import { ImageIcon, ArrowUpRight } from "lucide-react";
import type React from "react";
import FavoriteButton from "@/components/FavoriteButton";

const PAGE_SIZE = 10;

type AirtableAttachment = {
  id: string;
  url: string;
  filename: string;
  width?: number;
  height?: number;
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
  LKP_featured_image?: AirtableAttachment[];
  temporary_image?: AirtableAttachment[];
  "Featured Blurb"?: string | string[];
  FINAL_blurb?: string | string[];
  "Race Slug"?: string[];
  "Distance Start Date"?: string;
};

type RaceRecord = {
  id: string;
  fields: EntryFeeFields;
};

function asText(v: unknown): string {
  if (Array.isArray(v)) return v.filter(Boolean).join(", ");
  if (v === null || v === undefined) return "";
  return String(v);
}

function RaceCard({ r }: { r: RaceRecord }) {
  const f = r.fields;
  const slug = f["Race Slug"]?.[0];
  const rawFee = f["AUTO Fee used"];
  const fee = typeof rawFee === "number" && rawFee > 0 ? rawFee : null;
  const rawEpk = f["AUTO €/km"];
  const epk = typeof rawEpk === "number" && rawEpk > 0 ? rawEpk : null;
  const country = asText(f["LKP_country"]);
  const region = asText(f["LKP_region"]);
  const location = [country, region].filter(Boolean).join(" · ");
  const startDateRaw = f["Distance Start Date"];
  const startDate =
    typeof startDateRaw === "string" && startDateRaw
      ? new Date(startDateRaw + "T00:00:00Z").toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
        })
      : "";
  const thumbUrl =
    f["LKP_featured_image"]?.[0]?.url || f.temporary_image?.[0]?.url || null;
  const blurb = asText(f["FINAL_blurb"]);
  const idText = asText(f["ID"]);
  const idParts = idText.split(/\s[–—-]\s/);
  const raceName =
    idParts.length > 1 ? idParts.slice(0, -1).join(" – ") : idText;
  const distance =
    idParts.length > 1
      ? idParts[idParts.length - 1]
      : asText(f["Distance (km)"])
        ? `${asText(f["Distance (km)"])} km`
        : "";
  const rowHref = slug ? `/races/${slug}` : null;

  const cardContent = (
    <div className="sm:flex sm:gap-5">
      <div className="flex gap-4 sm:contents">
        <div className="shrink-0 relative">
          {thumbUrl ? (
            <img
              src={thumbUrl}
              alt={raceName}
              className="w-28 h-28 sm:w-40 sm:h-[108px] rounded-lg object-cover"
            />
          ) : (
            <div className="w-28 h-28 sm:w-40 sm:h-[108px] rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-neutral-300" />
            </div>
          )}
          <div className="absolute top-1.5 right-1.5">
            <FavoriteButton entryFeeId={r.id} size="sm" />
          </div>
        </div>

        <div className="flex flex-1 min-w-0 flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0 flex-1 sm:max-w-[50%]">
            <h3 className="font-bold text-neutral-900 text-base sm:text-lg leading-snug tracking-tight">
              <span className={rowHref ? "group-hover/card:underline" : ""}>
                {raceName}
              </span>
              {rowHref && (
                <ArrowUpRight className="inline-block w-4 h-4 ml-1 text-neutral-400 opacity-0 group-hover/card:opacity-100 transition-opacity" />
              )}
            </h3>
            {location && (
              <p className="text-xs text-neutral-400 mt-1">{location}</p>
            )}
            {blurb && (
              <p className="text-[11px] sm:text-sm text-neutral-600 mt-1 sm:mt-1.5 line-clamp-2 leading-relaxed">
                {blurb}
              </p>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-8 shrink-0">
            <div className="flex flex-col items-center">
              <span className="text-2xl md:text-3xl font-bold tabular-nums text-neutral-900 tracking-tight">
                {epk !== null ? `\u20AC${epk.toFixed(2)}` : "\u2014"}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-neutral-400 mt-0.5">
                price per km
              </span>
              {fee !== null && (
                <span className="text-xs tabular-nums text-neutral-400 mt-1.5">
                  {fee.toLocaleString("en", { maximumFractionDigits: 0 })}{" "}
                  {f.Currency ?? ""}
                </span>
              )}
            </div>

            <div className="flex flex-col items-center">
              <span className="text-lg md:text-xl font-semibold tabular-nums text-neutral-900 tracking-tight underline underline-offset-4 decoration-neutral-300">
                {distance || "\u2014"}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-neutral-400 mt-1.5">
                Race Distance
              </span>
            </div>

            <div className="flex flex-col items-center">
              <div className="bg-neutral-900 text-white rounded-md px-4 py-2 text-center min-w-[110px]">
                <span className="text-sm font-semibold tracking-tight">
                  {startDate || "No 2026 Date"}
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-neutral-400 mt-1.5">
                Verified Date
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex sm:hidden items-start justify-between mt-3 pt-3 border-t border-neutral-100">
        <div className="flex flex-col items-start flex-1">
          <span className="text-base font-bold text-neutral-900">
            {startDate || "No 2026 Date"}
          </span>
          <span className="text-[8px] uppercase tracking-wider text-neutral-400 mt-0.5">
            Verified Date
          </span>
        </div>
        <div className="flex flex-col items-center flex-1">
          <span className="text-xl font-bold tabular-nums text-neutral-900 tracking-tight">
            {epk !== null ? `\u20AC${epk.toFixed(2)}` : "\u2014"}
          </span>
          <span className="text-[8px] uppercase tracking-wider text-neutral-400 mt-0.5">
            Price Per KM
          </span>
        </div>
        <div className="flex flex-col items-end flex-1">
          <span className="text-base font-semibold tabular-nums text-neutral-900">
            {distance || "\u2014"}
          </span>
          <span className="text-[8px] uppercase tracking-wider text-neutral-400 mt-0.5">
            Distance
          </span>
        </div>
      </div>
    </div>
  );

  const cardClass = `group/card rounded-xl border border-neutral-200 bg-white p-5 transition-all duration-200 ${
    rowHref
      ? "hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:scale-[1.01] hover:border-neutral-300"
      : ""
  }`;

  return rowHref ? (
    <Link href={rowHref} className={`block ${cardClass}`}>
      {cardContent}
    </Link>
  ) : (
    <div className={cardClass}>{cardContent}</div>
  );
}

export default function RaceList({
  records: initialRecords,
  totalCount,
  isFiltered,
}: {
  records: RaceRecord[];
  totalCount: number;
  isFiltered: boolean;
}) {
  const [allRecords, setAllRecords] = useState<RaceRecord[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const source = allRecords ?? initialRecords;
  const displayed = isFiltered ? source : source.slice(0, visibleCount);
  const hasMore = !isFiltered && visibleCount < totalCount;

  async function fetchAll(): Promise<RaceRecord[]> {
    if (allRecords) return allRecords;
    setIsLoading(true);
    try {
      const res = await fetch("/api/races");
      const data = await res.json();
      setAllRecords(data.records);
      return data.records as RaceRecord[];
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLoadMore() {
    const nextVisible = visibleCount + PAGE_SIZE;
    if (nextVisible > initialRecords.length && !allRecords) {
      await fetchAll();
    }
    setVisibleCount(nextVisible);
  }

  return (
    <>
      <div className="space-y-3">
        {displayed.map((r) => (
          <RaceCard key={r.id} r={r} />
        ))}
      </div>

      {isLoading && (
        <div className="mt-6 flex justify-center">
          <p className="text-sm text-neutral-400">Loading races…</p>
        </div>
      )}

      {hasMore && !isLoading && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleLoadMore}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-6 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-colors"
            >
              Load 10 more
            </button>
          </div>
          <p className="text-xs text-neutral-400">
            Showing {displayed.length} of {totalCount}
          </p>
        </div>
      )}

      {isFiltered && (
        <p className="mt-8 text-xs text-neutral-400 text-center">
          {source.length} result{source.length !== 1 ? "s" : ""} · sorted by &euro;/km
        </p>
      )}

      {!isFiltered && !hasMore && !isLoading && source.length > 0 && (
        <p className="mt-8 text-xs text-neutral-400 text-center">
          All {source.length} races shown · sorted by &euro;/km
        </p>
      )}
    </>
  );
}

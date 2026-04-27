"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ImageIcon, ArrowUpRight } from "lucide-react";

const INITIAL_VISIBLE = 10;
const PAGE_SIZE = 10;
const FUTURE_UNCONFIRMED = "Future Unconfirmed";

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
  LKP_featured_image?: AirtableAttachment[];
  temporary_image?: AirtableAttachment[];
  FINAL_blurb?: string | string[];
  "Race Slug"?: string[];
  "Distance Start Date"?: string;
  AUTO_Date_is_past?: number | boolean;
  Next_Edition_Date?: string;
};

type RaceRecord = { id: string; fields: EntryFeeFields };
type SortBy = "price" | "date";

function asText(v: unknown): string {
  if (Array.isArray(v)) return v.filter(Boolean).join(", ");
  if (v === null || v === undefined) return "";
  return String(v);
}

function getMonthLabel(r: RaceRecord): string {
  const f = r.fields;
  if (f.AUTO_Date_is_past && !f.Next_Edition_Date) return FUTURE_UNCONFIRMED;
  const d = f["Distance Start Date"];
  if (!d) return "";
  const date = new Date(d + "T00:00:00Z");
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatMonthBubble(label: string): string {
  if (label === FUTURE_UNCONFIRMED) return "TBD";
  const parts = label.split(" ");
  if (parts.length >= 2) {
    const monthAbbr = parts[0].slice(0, 3);
    const yearSuffix = parts[parts.length - 1].slice(2);
    return `${monthAbbr} '${yearSuffix}`;
  }
  return label;
}

function getDateSortKey(r: RaceRecord): string {
  const f = r.fields;
  if (f.AUTO_Date_is_past && !f.Next_Edition_Date) return "9999-99-99";
  return f["Distance Start Date"] ?? "9999-99-99";
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
  const _img = f["LKP_featured_image"]?.[0] ?? f.temporary_image?.[0] ?? null;
  const thumbUrl = _img?.thumbnails?.large?.url ?? _img?.url ?? null;
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
        <div className="shrink-0">
          {thumbUrl ? (
            <img
              src={thumbUrl}
              alt={raceName}
              decoding="async"
              className="w-28 h-28 sm:w-40 sm:h-[108px] rounded-lg object-cover"
            />
          ) : (
            <div className="w-28 h-28 sm:w-40 sm:h-[108px] rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-neutral-300" />
            </div>
          )}
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

      {/* Mobile stats row */}
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

function SortButton({
  label,
  subLabel,
  active,
  onClick,
  className = "",
}: {
  label: string;
  subLabel: string;
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 group transition-colors cursor-pointer ${className}`}
    >
      <span
        className={`text-[10px] uppercase tracking-wider font-semibold transition-colors ${
          active
            ? "text-neutral-900 underline underline-offset-2 decoration-neutral-400"
            : "text-neutral-400 group-hover:text-neutral-600"
        }`}
      >
        {label}
      </span>
      <span
        className={`text-[9px] transition-colors ${
          active ? "text-neutral-500" : "text-transparent group-hover:text-neutral-300"
        }`}
      >
        {active ? subLabel : "sort by"}
      </span>
    </button>
  );
}

export default function CostClient({ records }: { records: RaceRecord[] }) {
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>("price");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const allMonths = useMemo(() => {
    return Array.from(
      new Set(records.map(getMonthLabel).filter(Boolean)),
    ).sort((a, b) => {
      if (a === FUTURE_UNCONFIRMED) return 1;
      if (b === FUTURE_UNCONFIRMED) return -1;
      return new Date("1 " + a).getTime() - new Date("1 " + b).getTime();
    });
  }, [records]);

  function toggleMonth(m: string) {
    setSelectedMonths((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m],
    );
    setVisibleCount(INITIAL_VISIBLE);
  }

  const filtered = useMemo(() => {
    if (selectedMonths.length === 0) return records;
    return records.filter((r) => selectedMonths.includes(getMonthLabel(r)));
  }, [records, selectedMonths]);

  const sorted = useMemo(() => {
    if (sortBy === "date") {
      return [...filtered].sort((a, b) =>
        getDateSortKey(a).localeCompare(getDateSortKey(b)),
      );
    }
    return [...filtered].sort((a, b) => {
      const ea = (a.fields["AUTO €/km"] as number) ?? 9999;
      const eb = (b.fields["AUTO €/km"] as number) ?? 9999;
      return ea - eb;
    });
  }, [filtered, sortBy]);

  const isMonthFiltered = selectedMonths.length > 0;
  const displayed = sorted.slice(0, isMonthFiltered ? sorted.length : visibleCount);
  const hasMore = !isMonthFiltered && visibleCount < sorted.length;

  return (
    <>
      {/* Month bubbles */}
      <div className="flex flex-wrap gap-2 mb-5">
        {allMonths.map((m) => {
          const isSelected = selectedMonths.includes(m);
          return (
            <button
              key={m}
              onClick={() => toggleMonth(m)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-all ${
                isSelected
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-white text-neutral-600 border-neutral-300 hover:border-neutral-500 hover:text-neutral-900"
              }`}
            >
              {formatMonthBubble(m)}
            </button>
          );
        })}
        {selectedMonths.length > 0 && (
          <button
            onClick={() => {
              setSelectedMonths([]);
              setVisibleCount(INITIAL_VISIBLE);
            }}
            className="text-xs text-neutral-400 hover:text-neutral-600 underline underline-offset-2 px-1 self-center"
          >
            Clear
          </button>
        )}
      </div>

      {/* Sort header — desktop only, columns aligned with card stat columns */}
      <div className="hidden sm:flex gap-5 px-5 mb-1 items-end">
        {/* spacer matching card thumbnail w-40 */}
        <div className="w-40 shrink-0" />
        {/* mirrors card inner flex layout */}
        <div className="flex flex-1 min-w-0 flex-row items-end justify-between gap-3">
          {/* spacer matching card name/blurb area */}
          <div className="min-w-0 flex-1 sm:max-w-[50%]" />
          {/* sort buttons aligned with stat columns */}
          <div className="flex items-end gap-8 shrink-0">
            <SortButton
              label="Price per KM"
              subLabel="↑ cheapest first"
              active={sortBy === "price"}
              onClick={() => setSortBy("price")}
            />
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] uppercase tracking-wider text-neutral-300">
                Race Distance
              </span>
            </div>
            <SortButton
              label="Date"
              subLabel="↑ soonest first"
              active={sortBy === "date"}
              onClick={() => setSortBy("date")}
              className="min-w-[110px]"
            />
          </div>
        </div>
      </div>

      {/* Race cards */}
      <div className="space-y-3">
        {displayed.map((r) => (
          <RaceCard key={r.id} r={r} />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-6 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-colors"
          >
            Load 10 more
          </button>
          <p className="text-xs text-neutral-400">
            Showing {displayed.length} of {sorted.length}
          </p>
        </div>
      )}

      {/* Footer count */}
      {isMonthFiltered && (
        <p className="mt-8 text-xs text-neutral-400 text-center">
          {sorted.length} result{sorted.length !== 1 ? "s" : ""} &middot;{" "}
          {sortBy === "price" ? "sorted by \u20AC/km" : "sorted by date"}
        </p>
      )}
      {!isMonthFiltered && !hasMore && sorted.length > 0 && (
        <p className="mt-8 text-xs text-neutral-400 text-center">
          All {sorted.length} races shown &middot;{" "}
          {sortBy === "price" ? "sorted by \u20AC/km" : "sorted by date"}
        </p>
      )}
    </>
  );
}

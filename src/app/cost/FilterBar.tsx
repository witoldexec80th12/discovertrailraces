"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type Props = {
  countries: string[];
  months: string[];
  selectedCountry: string;
  selectedMonth: string;
};

export default function FilterBar({
  countries,
  months,
  selectedCountry,
  selectedMonth,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/cost?${params.toString()}#cost-index`, { scroll: false });
    },
    [router, searchParams],
  );

  const hasFilters = selectedCountry || selectedMonth;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-400">
        Filter By
      </span>

      <select
        value={selectedCountry}
        onChange={(e) => updateFilter("country", e.target.value)}
        className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 font-semibold focus:outline-none focus:ring-2 focus:ring-neutral-300 cursor-pointer"
      >
        <option value="">Country</option>
        {countries.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select
        value={selectedMonth}
        onChange={(e) => updateFilter("month", e.target.value)}
        className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 font-semibold focus:outline-none focus:ring-2 focus:ring-neutral-300 cursor-pointer"
      >
        <option value="">Month</option>
        {months.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          onClick={() => router.push("/cost#cost-index", { scroll: false })}
          className="text-xs text-neutral-400 hover:text-neutral-600 underline underline-offset-2"
        >
          Clear
        </button>
      )}
    </div>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type Props = {
  countries: string[];
  selectedCountry: string;
};

export default function FilterBar({ countries, selectedCountry }: Props) {
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

  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-400">
        Filter By
      </span>
      <select
        value={selectedCountry}
        onChange={(e) => updateFilter("country", e.target.value)}
        className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-neutral-400 cursor-pointer"
      >
        <option value="">Country</option>
        {countries.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      {selectedCountry && (
        <button
          onClick={() => updateFilter("country", "")}
          className="text-xs text-neutral-400 hover:text-neutral-600 underline underline-offset-2"
        >
          Clear
        </button>
      )}
    </div>
  );
}

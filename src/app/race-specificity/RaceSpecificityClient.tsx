"use client";

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import type { EnrichedDistance } from "./types";

const MAX_VERT = 85;
const BRAND_NAVY = "#1a2e4a";
const COUNTRY_COLOR = "#7c3d12";
const RESULTS_PER_PAGE = 6;

const ALL_TERRAIN_TYPES = [
  "Alpine",
  "High Alpine",
  "Pre-Alpine",
  "Forest",
  "Coastal",
  "Urban",
  "Volcanic",
  "Arctic / Fjell",
  "Fell / Moorland",
  "Gravel",
  "Canyon",
  "Vineyard",
  "Dolomites",
  "Fjord",
  "Winter",
];

export default function RaceSpecificityClient() {
  const [entries, setEntries] = useState<EnrichedDistance[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/race-specificity-data")
      .then((r) => {
        if (!r.ok) throw new Error(`Server error ${r.status}`);
        return r.json();
      })
      .then((d) => {
        setEntries(d.entries ?? []);
      })
      .catch((e) => setDataError(e.message ?? "Failed to load"))
      .finally(() => setDataLoading(false));
  }, []);

  const minValRef = useRef(30);
  const maxValRef = useRef(40);
  const [minVal, setMinValState] = useState(30);
  const [maxVal, setMaxValState] = useState(40);
  const setMinVal = useCallback((v: number) => { minValRef.current = v; setMinValState(v); }, []);
  const setMaxVal = useCallback((v: number) => { maxValRef.current = v; setMaxValState(v); }, []);

  // Results always shown — initialised with defaults (30–40 D+/km)
  const [appliedMin, setAppliedMin] = useState<number>(30);
  const [appliedMax, setAppliedMax] = useState<number>(40);
  const [selectedTerrain, setSelectedTerrain] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const step2Ref = useRef<HTMLDivElement>(null);

  // Auto-apply: update results 500ms after any slider/input change (no scroll, no terrain reset)
  const autoApplyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (autoApplyTimer.current) clearTimeout(autoApplyTimer.current);
    autoApplyTimer.current = setTimeout(() => {
      setAppliedMin(minValRef.current);
      setAppliedMax(maxValRef.current);
      setCurrentPage(1);
    }, 500);
    return () => { if (autoApplyTimer.current) clearTimeout(autoApplyTimer.current); };
  }, [minVal, maxVal]);

  const enrichedData = entries;

  const vertFiltered = useMemo(() => {
    return enrichedData.filter((r) => r.pctIncrease >= appliedMin && r.pctIncrease <= appliedMax);
  }, [enrichedData, appliedMin, appliedMax]);

  // Live count for the button — reflects current slider pos before debounce applies
  const pendingCount = useMemo(() => {
    return enrichedData.filter((r) => r.pctIncrease >= minVal && r.pctIncrease <= maxVal).length;
  }, [enrichedData, minVal, maxVal]);

  const allCountries = useMemo(() => {
    const seen = new Set<string>();
    enrichedData.forEach((r) => { if (r.country) seen.add(r.country); });
    return [...seen].sort();
  }, [enrichedData]);

  // Faceted counts: terrain counts respect the active country filter
  const terrainCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_TERRAIN_TYPES.forEach((t) => { counts[t] = 0; });
    const base = selectedCountry ? vertFiltered.filter((r) => r.country === selectedCountry) : vertFiltered;
    base.forEach((r) => r.terrain.forEach((t) => {
      if (counts[t] !== undefined) counts[t]++;
    }));
    return counts;
  }, [vertFiltered, selectedCountry]);

  // Faceted counts: country counts respect the active terrain filter
  const countryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allCountries.forEach((c) => { counts[c] = 0; });
    const base = selectedTerrain ? vertFiltered.filter((r) => r.terrain.includes(selectedTerrain)) : vertFiltered;
    base.forEach((r) => {
      if (r.country && counts[r.country] !== undefined) counts[r.country]++;
    });
    return counts;
  }, [vertFiltered, allCountries, selectedTerrain]);

  const allResults = useMemo(() => {
    let results = vertFiltered;
    if (selectedCountry) {
      results = results.filter((r) => r.country === selectedCountry);
    }
    if (selectedTerrain) {
      results = results.filter((r) => r.terrain.includes(selectedTerrain));
    }
    return [...results].sort((a, b) => b.pctIncrease - a.pctIncrease);
  }, [vertFiltered, selectedTerrain, selectedCountry]);

  const totalPages = Math.max(1, Math.ceil(allResults.length / RESULTS_PER_PAGE));
  const pagedResults = allResults.slice((currentPage - 1) * RESULTS_PER_PAGE, currentPage * RESULTS_PER_PAGE);

  // Manual APPLY: immediate apply + scroll to results + reset terrain
  const applyStep1 = () => {
    if (autoApplyTimer.current) clearTimeout(autoApplyTimer.current);
    setAppliedMin(minValRef.current);
    setAppliedMax(maxValRef.current);
    setSelectedTerrain(null);
    setCurrentPage(1);
    setTimeout(() => {
      step2Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleTerrainClick = (tag: string) => {
    setSelectedTerrain((prev) => prev === tag ? null : tag);
    setCurrentPage(1);
  };

  const reset = () => {
    setMinVal(30);
    setMaxVal(40);
    setSelectedTerrain(null);
    setSelectedCountry(null);
    setCurrentPage(1);
  };

  // Visual band on mountain: 170 D+/km ≈ 9% from top, 0 D+/km ≈ 67% from top
  const toTopPct = (v: number) => 9 + (1 - v / MAX_VERT) * 58;
  const bandTopPct = toTopPct(maxVal);
  const bandBottomPct = toTopPct(minVal);

  if (dataError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-neutral-500 text-sm">Could not load race data. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── DESKTOP NAV (mobile handled by MobileNav) ──────── */}
      <header className="hidden sm:flex border-b border-neutral-100 shadow-sm bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14 w-full">
          <Link href="/" className="flex items-center">
            <img
              src="/images/logo_white.svg"
              alt="DiscoverTrailRaces"
              className="h-8 w-auto"
            />
          </Link>
          <nav className="flex items-center gap-6 text-sm font-semibold text-neutral-600">
            <Link href="/cost" className="hover:text-neutral-900 transition-colors">Cost Index</Link>
            <Link href="/race-specificity" className="text-neutral-900 transition-colors">Race Finder</Link>
            <Link href="/about" className="hover:text-neutral-900 transition-colors">About</Link>
            <Link href="/favourites" className="flex items-center gap-1.5 text-teal-600 hover:text-teal-800 transition-colors">
              Calendar
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 leading-none">BETA</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <div className="px-6 sm:px-10 lg:px-16 pt-10 sm:pt-10 pb-10 bg-white">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400 mb-3">
          Race Specificity
        </p>
        <h1 className="hidden sm:block text-5xl font-black text-neutral-900 leading-tight tracking-tight max-w-3xl">
          Find your next race based on Steepness.
        </h1>
        <p className="mt-4 text-base sm:text-lg text-neutral-600 font-medium max-w-xl">
          Filter races by how much climbing they demand, then narrow by terrain type.
          D+/km is an estimate of average meters gain per KM of climb in the race.
          A low number means fast and runnable; a high number means more hiking, more vertical, and more demand on your legs.
        </p>
      </div>

      {/* ── STEP 1 — MOUNTAIN SECTION ──────────────────────── */}
      {/*
        Mobile:  panel stacked above mountain (flex-col)
        Desktop: panel as left sidebar, mountain fills rest (flex-row, fixed height)
      */}
      <div className="border-t border-neutral-200 flex flex-col sm:flex-row overflow-hidden sm:h-[760px]">

        {/* PANEL — full width on mobile (top), 300px sidebar on desktop */}
        <div className="shrink-0 flex flex-col p-6 sm:p-10 bg-white/95 backdrop-blur-sm border-b sm:border-b-0 sm:border-r border-neutral-200 z-20 sm:w-[320px]">
          <div className="inline-flex items-center gap-2 mb-4">
            <span
              className="px-2.5 h-6 rounded-full flex items-center justify-center text-xs font-black text-white"
              style={{ backgroundColor: BRAND_NAVY }}
            >Step 1</span>
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
              Vert Meter
            </span>
          </div>
          <div className="rounded-xl p-5 shadow-sm mb-5" style={{ backgroundColor: BRAND_NAVY }}>
            <p className="text-base text-white/90 leading-relaxed">
              <span className="font-black text-white text-lg">Slide Min and Max</span> to set your elevation
              gain range — 0 D+/km (flat) to 85 D+/km (hiking-steep).
              Results update automatically.
            </p>
          </div>

          {/* Min slider */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: BRAND_NAVY }}>Min D+/km</span>
              <span className="text-lg font-black" style={{ color: BRAND_NAVY }}>{minVal}</span>
            </div>
            <input
              type="range"
              min={0}
              max={MAX_VERT}
              step={5}
              value={minVal}
              onChange={(e) => {
                const v = Math.min(Number(e.target.value), maxValRef.current - 5);
                setMinVal(Math.max(0, v));
              }}
              className="range-navy w-full"
              style={{
                background: `linear-gradient(to right, ${BRAND_NAVY} 0%, ${BRAND_NAVY} ${(minVal / MAX_VERT) * 100}%, #e5e7eb ${(minVal / MAX_VERT) * 100}%, #e5e7eb 100%)`,
              }}
            />
          </div>

          {/* Max slider */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: BRAND_NAVY }}>Max D+/km</span>
              <span className="text-lg font-black" style={{ color: BRAND_NAVY }}>{maxVal}</span>
            </div>
            <input
              type="range"
              min={0}
              max={MAX_VERT}
              step={5}
              value={maxVal}
              onChange={(e) => {
                const v = Math.max(Number(e.target.value), minValRef.current + 5);
                setMaxVal(Math.min(MAX_VERT, v));
              }}
              className="range-navy w-full"
              style={{
                background: `linear-gradient(to right, ${BRAND_NAVY} 0%, ${BRAND_NAVY} ${(maxVal / MAX_VERT) * 100}%, #e5e7eb ${(maxVal / MAX_VERT) * 100}%, #e5e7eb 100%)`,
              }}
            />
          </div>

          {/* Selected Range — editable number inputs */}
          <div className="rounded-xl px-5 py-4 mb-5 border-2" style={{ borderColor: BRAND_NAVY }}>
            <span className="text-xs font-bold uppercase tracking-widest block mb-2" style={{ color: BRAND_NAVY }}>
              Selected Range
            </span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={85}
                value={minVal}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(85, Number(e.target.value) || 0));
                  setMinVal(v);
                }}
                onBlur={() => {
                  if (minVal > maxVal - 5) setMinVal(Math.max(0, maxVal - 5));
                }}
                className="w-16 text-2xl font-black text-center bg-transparent border-b-2 outline-none appearance-none"
                style={{ color: BRAND_NAVY, borderColor: BRAND_NAVY }}
              />
              <span className="text-2xl font-black" style={{ color: BRAND_NAVY }}>–</span>
              <input
                type="number"
                min={0}
                max={85}
                value={maxVal}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(85, Number(e.target.value) || 0));
                  setMaxVal(v);
                }}
                onBlur={() => {
                  if (maxVal < minVal + 5) setMaxVal(Math.min(85, minVal + 5));
                }}
                className="w-16 text-2xl font-black text-center bg-transparent border-b-2 outline-none appearance-none"
                style={{ color: BRAND_NAVY, borderColor: BRAND_NAVY }}
              />
              <span className="text-sm font-semibold ml-1" style={{ color: BRAND_NAVY, opacity: 0.6 }}>D+/km</span>
            </div>
          </div>

          {/* APPLY — scrolls to results and resets terrain */}
          <button
            onClick={applyStep1}
            disabled={dataLoading}
            className="w-full py-3 text-base font-black rounded-xl border-2 transition-all hover:opacity-80 active:scale-95 disabled:opacity-50"
            style={{ borderColor: BRAND_NAVY, color: BRAND_NAVY, backgroundColor: "white" }}
          >
            {dataLoading
              ? "Loading races…"
              : `${pendingCount} ${pendingCount === 1 ? "Race" : "Races"} Found — Scroll to Results`}
          </button>
        </div>

        {/* MOUNTAIN — decorative, with read-only visual range band */}
        <div className="flex-1 relative overflow-hidden" style={{ minHeight: 500 }}>

          {/* Mobile mountain image — contain to show more of the scene */}
          <div className="absolute inset-0 sm:hidden" style={{ backgroundColor: "#0d1b2a" }} />
          <img
            src="/images/dkm_mobile.png"
            alt="Mountain"
            draggable={false}
            className="absolute inset-0 w-full h-full select-none sm:hidden"
            style={{ objectFit: "contain", objectPosition: "center center" }}
          />
          {/* Desktop mountain image */}
          <img
            src="/images/mountain.png"
            alt="Mountain"
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover select-none hidden sm:block"
            style={{ objectPosition: "center 22%" }}
          />
          <div className="absolute inset-0 bg-black/10" />

          {/* Vertical scale line — 170 D+/km (top) → 0 D+/km (bottom) */}
          <div
            className="absolute pointer-events-none z-10"
            style={{
              left: "calc(50% - 1px)",
              top: "9%",
              bottom: "33%",
              width: 2,
              background: "linear-gradient(to bottom, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.55) 100%)",
            }}
          />

          {/* Visual range band — shows selected D+/km range on the mountain */}
          <div
            className="absolute left-0 right-0 pointer-events-none z-10"
            style={{
              top: `${bandTopPct}%`,
              bottom: `${100 - bandBottomPct}%`,
              backgroundColor: "rgba(26,46,74,0.28)",
              borderTop: "2px solid rgba(26,46,74,0.7)",
              borderBottom: "2px solid rgba(26,46,74,0.7)",
            }}
          />

          {/* Reference race labels */}
          {([
            { value: 73, label: "Tor De Géants 330 · 73 D+/km" },
            { value: 33, label: "Salomon Cappadocia Ultra · 33 D+/km" },
            { value: 19, label: "Trail Menorca Camí de Cavalls 185 · 19 D+/km" },
          ] as { value: number; label: string }[]).map(({ value, label }) => {
            const topPct = toTopPct(value);
            return (
              <div
                key={value}
                className="absolute pointer-events-none flex items-center z-20"
                style={{ top: `${topPct}%`, left: "50%", paddingLeft: 10 }}
              >
                <div className="w-3 h-px mr-2 shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.8)" }} />
                <span
                  className="text-xs font-bold leading-tight px-2 py-0.5 rounded-full"
                  style={{
                    color: "#fff",
                    backgroundColor: "rgba(0,0,0,0.55)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </span>
              </div>
            );
          })}

          {/* Anchor labels at top and bottom */}
          <div className="absolute pointer-events-none z-20" style={{ top: "7%", left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap" }}>
            <span className="text-xs font-black px-3 py-1 rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.55)", color: "#fff" }}>
              ↑ 85 D+/km (brutal)
            </span>
          </div>
          <div className="absolute pointer-events-none z-20" style={{ bottom: "35%", left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap" }}>
            <span className="text-xs font-black px-3 py-1 rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.55)", color: "#fff" }}>
              ↓ 0 D+/km (flat)
            </span>
          </div>
        </div>{/* end mountain area */}
      </div>{/* end step 1 flex row */}

      {/* ── MOBILE STATEMENT BANNER — between Step 1 and Step 2 ── */}
      <div className="sm:hidden px-6 py-10 border-t border-b border-neutral-200 bg-white">
        <h2 className="text-3xl font-black text-neutral-900 leading-tight tracking-tight">
          Specific Training is pivotal<br /> to Ultra success.
        </h2>
      </div>

      {/* ── STEP 2 + RESULTS — always visible ────────────────── */}
      {/* ── COUNTRY FILTER ──────────────────────────────────── */}
      {allCountries.length > 0 && (
        <div className="px-6 sm:px-10 lg:px-16 py-10 sm:py-14" style={{ backgroundColor: COUNTRY_COLOR }}>
          <div className="flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-16">
            <div className="shrink-0">
              <div className="inline-flex items-center gap-2 mb-3">
                <span className="px-2.5 h-6 rounded-full flex items-center justify-center text-xs font-black bg-white"
                  style={{ color: COUNTRY_COLOR }}>Country</span>
                <span className="text-xs font-bold uppercase tracking-widest text-white/60">
                  Filter
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white mb-2">
                Filter by Country
              </h2>
              <p className="text-sm text-white/70 max-w-[200px]">
                {vertFiltered.length} race{vertFiltered.length !== 1 ? "s" : ""} across {allCountries.length} countries.
                Click to filter.
              </p>
              {selectedCountry && (
                <button
                  onClick={() => { setSelectedCountry(null); setCurrentPage(1); }}
                  className="mt-3 text-xs font-semibold text-white/50 hover:text-white transition-colors underline"
                >
                  Clear country
                </button>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2">
                {allCountries.map((c) => {
                  const count = countryCounts[c] ?? 0;
                  const isSelected = selectedCountry === c;
                  const hasRaces = count > 0;
                  return (
                    <button
                      key={c}
                      onClick={() => {
                        if (!hasRaces) return;
                        setSelectedCountry((prev) => prev === c ? null : c);
                        setCurrentPage(1);
                      }}
                      className="px-4 py-2 rounded-full text-sm font-bold border-2 transition-all"
                      style={{
                        backgroundColor: isSelected ? COUNTRY_COLOR : "white",
                        color: isSelected ? "#fff" : hasRaces ? COUNTRY_COLOR : "#d1d5db",
                        borderColor: isSelected ? COUNTRY_COLOR : hasRaces ? COUNTRY_COLOR : "#e5e7eb",
                        cursor: hasRaces ? "pointer" : "default",
                        opacity: hasRaces ? 1 : 0.45,
                      }}
                    >
                      {c}
                      {hasRaces && (
                        <span className="ml-1.5 text-[10px] font-normal opacity-70">{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={step2Ref}>
        <div className="bg-white border-t border-neutral-200">

            {/* Terrain filter */}
            <div className="px-6 sm:px-10 lg:px-16 py-12 sm:py-16 border-b border-white/10" style={{ backgroundColor: BRAND_NAVY }}>
              {/* "Specific Training" statement — desktop only (mobile has its own banner above) */}
              <p className="hidden sm:block text-3xl font-black text-white/85 mb-12 tracking-tight leading-snug">
                Specific Training is pivotal<br /> to Ultra success.
              </p>
              <div className="flex flex-col sm:flex-row sm:items-start gap-8 sm:gap-16">
                <div className="shrink-0">
                  <div className="inline-flex items-center gap-2 mb-3">
                    <span className="px-2.5 h-6 rounded-full flex items-center justify-center text-xs font-black bg-white"
                      style={{ color: BRAND_NAVY }}>Step 2</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-white/60">
                      Explore TERRAIN
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white mb-2">
                    Filter by Terrain
                  </h2>
                  <p className="text-sm text-white/70 max-w-[200px]">
                    {vertFiltered.length} races match {appliedMin}–{appliedMax} D+/km.
                    Click a terrain to filter instantly.
                  </p>
                  {selectedTerrain && (
                    <button
                      onClick={() => { setSelectedTerrain(null); setCurrentPage(1); }}
                      className="mt-3 text-xs font-semibold text-white/50 hover:text-white transition-colors underline"
                    >
                      Clear terrain
                    </button>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2">
                    {ALL_TERRAIN_TYPES.map((tag) => {
                      const count = terrainCounts[tag] ?? 0;
                      const isSelected = selectedTerrain === tag;
                      const hasRaces = count > 0;
                      return (
                        <button
                          key={tag}
                          onClick={() => hasRaces && handleTerrainClick(tag)}
                          className="px-4 py-2 rounded-full text-sm font-bold border-2 transition-all"
                          style={{
                            backgroundColor: isSelected ? BRAND_NAVY : "white",
                            color: isSelected ? "#fff" : hasRaces ? BRAND_NAVY : "#d1d5db",
                            borderColor: isSelected ? BRAND_NAVY : hasRaces ? BRAND_NAVY : "#e5e7eb",
                            cursor: hasRaces ? "pointer" : "default",
                            opacity: hasRaces ? 1 : 0.5,
                          }}
                        >
                          {tag}
                          {hasRaces && (
                            <span className="ml-1.5 text-[10px] font-normal opacity-70">
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="px-6 sm:px-10 lg:px-16 py-12 sm:py-16">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <h3 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-neutral-900">
                    {allResults.length} {allResults.length === 1 ? "Race" : "Races"} Found
                  </h3>
                  <p className="text-sm text-neutral-500 mt-1">
                    {appliedMin}–{appliedMax} D+/km
                    {selectedCountry ? ` · ${selectedCountry}` : ""}
                    {selectedTerrain ? ` · ${selectedTerrain}` : ""}
                    {totalPages > 1 ? ` · Page ${currentPage} of ${totalPages}` : ""}
                  </p>
                </div>
                <button
                  onClick={reset}
                  className="text-sm font-semibold text-neutral-400 hover:text-neutral-700 transition-colors"
                >
                  Reset all
                </button>
              </div>

              {dataLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-neutral-200 bg-neutral-50 overflow-hidden animate-pulse">
                      <div className="h-40 bg-neutral-200" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-neutral-200 rounded w-3/4" />
                        <div className="h-3 bg-neutral-100 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : allResults.length === 0 ? (
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-10 text-center">
                  <p className="text-neutral-500 text-sm">
                    No races match these filters. Try widening the elevation range or selecting a different terrain.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pagedResults.map((r, i) => (
                      <ResultCard key={`${r.id}-${i}`} race={r} />
                    ))}
                  </div>

                  {totalPages > 1 && (() => {
                    const WIN = 7;
                    let winStart = Math.max(1, currentPage - Math.floor(WIN / 2));
                    let winEnd = Math.min(totalPages, winStart + WIN - 1);
                    if (winEnd - winStart + 1 < WIN) winStart = Math.max(1, winEnd - WIN + 1);
                    const pageWindow = Array.from({ length: winEnd - winStart + 1 }, (_, i) => winStart + i);
                    return (
                      <div className="mt-10 flex items-center justify-center gap-1.5">
                        {/* Prev */}
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-2 text-sm font-semibold rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          ←
                        </button>

                        {/* First page + ellipsis if window doesn't start at 1 */}
                        {winStart > 1 && (
                          <>
                            <button
                              onClick={() => setCurrentPage(1)}
                              className="w-9 h-9 text-sm font-bold rounded-lg border-2 transition-all"
                              style={{
                                backgroundColor: "white",
                                color: "#404040",
                                borderColor: "#e5e7eb",
                              }}
                            >1</button>
                            {winStart > 2 && (
                              <span className="w-9 h-9 flex items-center justify-center text-sm text-neutral-400">…</span>
                            )}
                          </>
                        )}

                        {/* Window */}
                        {pageWindow.map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className="w-9 h-9 text-sm font-bold rounded-lg border-2 transition-all"
                            style={{
                              backgroundColor: currentPage === page ? BRAND_NAVY : "white",
                              color: currentPage === page ? "#fff" : "#404040",
                              borderColor: currentPage === page ? BRAND_NAVY : "#e5e7eb",
                            }}
                          >
                            {page}
                          </button>
                        ))}

                        {/* Ellipsis + last page if window doesn't reach end */}
                        {winEnd < totalPages && (
                          <>
                            {winEnd < totalPages - 1 && (
                              <span className="w-9 h-9 flex items-center justify-center text-sm text-neutral-400">…</span>
                            )}
                            <button
                              onClick={() => setCurrentPage(totalPages)}
                              className="w-9 h-9 text-sm font-bold rounded-lg border-2 transition-all"
                              style={{
                                backgroundColor: "white",
                                color: "#404040",
                                borderColor: "#e5e7eb",
                              }}
                            >{totalPages}</button>
                          </>
                        )}

                        {/* Next */}
                        <button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 text-sm font-semibold rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          →
                        </button>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
      </div>
    </div>
  );
}

function ResultCard({ race }: { race: EnrichedDistance }) {
  const inner = (
    <div className="group rounded-xl border border-neutral-200 bg-white overflow-hidden hover:shadow-md hover:scale-[1.01] transition-all duration-200 h-full">
      <div className="aspect-[4/3] bg-neutral-100 relative overflow-hidden">
        {race.imgUrl ? (
          <img
            src={race.imgUrl}
            alt={race.raceName}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-2.5 left-2.5">
          <span className="bg-white/95 rounded-full px-2.5 py-0.5 text-xs font-bold text-neutral-900 shadow-sm">
            {Math.round(race.pctIncrease)} D+/km
          </span>
        </div>
        <div className="absolute top-2.5 right-2.5">
          <span className="bg-white/95 rounded-full px-2.5 py-0.5 text-xs font-bold text-neutral-900 shadow-sm">
            €{race.eurPerKm.toFixed(2)}/km
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-white font-bold text-sm leading-tight line-clamp-2">{race.raceName}</p>
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs text-neutral-500">
          {race.distanceName}
          {race.distanceKm ? ` · ${race.distanceKm.toFixed(0)} km` : ""}
        </p>
        {race.terrain.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {race.terrain.map((t) => (
              <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return race.slug ? (
    <Link href={`/races/${race.slug}`} className="h-full block">{inner}</Link>
  ) : inner;
}

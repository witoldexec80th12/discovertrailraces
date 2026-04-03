"use client";

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import type { RaceEventRecord, DistanceRecord } from "./types";

const MAX_VERT = 170;
const BRAND_NAVY = "#1a2e4a";
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

type EnrichedDistance = {
  raceId: string;
  raceName: string;
  slug: string;
  terrain: string[];
  imgUrl: string | null;
  distanceName: string;
  distanceKm: number;
  pctIncrease: number;
};

export default function RaceSpecificityClient({
  raceEvents,
  distances,
}: {
  raceEvents: RaceEventRecord[];
  distances: DistanceRecord[];
}) {
  const minValRef = useRef(80);
  const maxValRef = useRef(120);
  const [minVal, setMinValState] = useState(80);
  const [maxVal, setMaxValState] = useState(120);
  const setMinVal = useCallback((v: number) => { minValRef.current = v; setMinValState(v); }, []);
  const setMaxVal = useCallback((v: number) => { maxValRef.current = v; setMaxValState(v); }, []);

  const [appliedMin, setAppliedMin] = useState<number | null>(null);
  const [appliedMax, setAppliedMax] = useState<number | null>(null);
  const [step1Applied, setStep1Applied] = useState(false);
  const [selectedTerrain, setSelectedTerrain] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // mountainRef is the narrow drag column (not the full area)
  const mountainRef = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const dragging = useRef<"min" | "max" | null>(null);

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!dragging.current || !mountainRef.current) return;
      const rect = mountainRef.current.getBoundingClientRect();
      const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
      const value = Math.round((1 - y / rect.height) * MAX_VERT);
      if (dragging.current === "max") {
        setMaxVal(Math.max(value, minValRef.current + 5));
      } else {
        setMinVal(Math.min(value, maxValRef.current - 5));
      }
    };
    const handleUp = () => { dragging.current = null; };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [setMinVal, setMaxVal]);

  const enrichedData = useMemo<EnrichedDistance[]>(() => {
    const raceMap = new Map(raceEvents.map((r) => [r.id, r]));
    return distances
      .filter((d) => d.fields["AUTO% Increase"] != null && (d.fields["Race"]?.length ?? 0) > 0)
      .map((d) => {
        const raceId = d.fields["Race"]![0];
        const race = raceMap.get(raceId);
        if (!race) return null;
        const img = race.fields["Featured Image"]?.[0];
        const imgUrl = img?.thumbnails?.large?.url ?? img?.thumbnails?.full?.url ?? img?.url ?? null;
        return {
          raceId,
          raceName: race.fields["Race Name"] ?? "Unknown Race",
          slug: race.fields["Slug"] ?? "",
          terrain: race.fields["Terrain_multi"] ?? [],
          imgUrl,
          distanceName: d.fields["Distance Name"] ?? "",
          distanceKm: d.fields["Distance (km)"] ?? 0,
          pctIncrease: d.fields["AUTO% Increase"]!,
        } as EnrichedDistance;
      })
      .filter(Boolean) as EnrichedDistance[];
  }, [raceEvents, distances]);

  const vertFiltered = useMemo(() => {
    if (!step1Applied || appliedMin == null || appliedMax == null) return [];
    return enrichedData.filter((r) => r.pctIncrease >= appliedMin && r.pctIncrease <= appliedMax);
  }, [enrichedData, step1Applied, appliedMin, appliedMax]);

  const terrainCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_TERRAIN_TYPES.forEach((t) => { counts[t] = 0; });
    vertFiltered.forEach((r) => r.terrain.forEach((t) => {
      if (counts[t] !== undefined) counts[t]++;
    }));
    return counts;
  }, [vertFiltered]);

  const allResults = useMemo(() => {
    if (!step1Applied) return [];
    let results = vertFiltered;
    if (selectedTerrain) {
      results = results.filter((r) => r.terrain.includes(selectedTerrain));
    }
    return [...results].sort((a, b) => b.pctIncrease - a.pctIncrease);
  }, [vertFiltered, step1Applied, selectedTerrain]);

  const totalPages = Math.max(1, Math.ceil(allResults.length / RESULTS_PER_PAGE));
  const pagedResults = allResults.slice((currentPage - 1) * RESULTS_PER_PAGE, currentPage * RESULTS_PER_PAGE);

  const applyStep1 = () => {
    setAppliedMin(minVal);
    setAppliedMax(maxVal);
    setStep1Applied(true);
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
    setStep1Applied(false);
    setSelectedTerrain(null);
    setCurrentPage(1);
    setMinVal(80);
    setMaxVal(120);
  };

  // Positions of bars within the drag column (0% = top = 170m/km, 100% = bottom = 0m/km)
  const minPct = ((MAX_VERT - minVal) / MAX_VERT) * 100;
  const maxPct = ((MAX_VERT - maxVal) / MAX_VERT) * 100;

  // Bar height in px — used for offsetting bar center to pointer position
  const BAR_H = 44;

  return (
    <div className="min-h-screen bg-white">

      {/* ── HEADER ─────────────────────────────────────────── */}
      <div className="px-6 sm:px-10 lg:px-16 pt-14 pb-10 bg-white">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400 mb-3">
          Race Specificity
        </p>
        <h1 className="hidden sm:block text-5xl font-black text-neutral-900 leading-tight tracking-tight max-w-3xl">
          Specific Training is pivotal<br /> to Ultra success.
        </h1>
        <p className="mt-4 text-base sm:text-lg text-neutral-600 font-medium max-w-xl">
          Filter races by how much climbing they demand, then narrow by terrain type.
        </p>
      </div>

      {/* ── STEP 1 — MOUNTAIN SECTION ──────────────────────── */}
      {/*
        Mobile:  panel stacked above mountain (flex-col)
        Desktop: panel as left sidebar, mountain fills rest (flex-row, fixed height)
      */}
      <div className="border-t border-neutral-200 flex flex-col sm:flex-row overflow-hidden sm:h-[760px]">

        {/* PANEL — full width on mobile (top), 300px sidebar on desktop */}
        <div className="shrink-0 flex flex-col p-6 sm:p-10 bg-white/95 backdrop-blur-sm border-b sm:border-b-0 sm:border-r border-neutral-200 z-20 sm:w-[300px]">
          <div className="inline-flex items-center gap-2 mb-4">
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white"
              style={{ backgroundColor: BRAND_NAVY }}
            >1</span>
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
              Vert Meter
            </span>
          </div>
          <div className="rounded-xl p-5 shadow-sm mb-4" style={{ backgroundColor: BRAND_NAVY }}>
            <p className="text-sm text-white/90 leading-relaxed mb-3">
              <span className="font-semibold text-white">Drag the bars</span> up or down to set your
              elevation gain range — from flat (0 D+/km) at the treeline to
              hiking-steep (170 D+/km) at the peak.
            </p>
            <p className="text-sm text-white/90 leading-relaxed">
              <span className="font-semibold text-white">Hit Apply</span> to find matching races
              and unlock terrain filtering below.
            </p>
          </div>

          {/* Selected Range — editable inputs */}
          <div className="rounded-xl px-5 py-4 mb-4 border-2" style={{ borderColor: BRAND_NAVY }}>
            <span className="text-xs font-bold uppercase tracking-widest block mb-2" style={{ color: BRAND_NAVY }}>
              Selected Range
            </span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={170}
                value={minVal}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(170, Number(e.target.value) || 0));
                  setMinVal(v);
                }}
                onBlur={() => {
                  if (minVal > maxVal - 5) setMinVal(Math.max(0, maxVal - 5));
                }}
                className="w-16 text-2xl font-black text-center bg-transparent border-b-2 outline-none focus:border-b-2 appearance-none"
                style={{ color: BRAND_NAVY, borderColor: BRAND_NAVY }}
              />
              <span className="text-2xl font-black" style={{ color: BRAND_NAVY }}>–</span>
              <input
                type="number"
                min={0}
                max={170}
                value={maxVal}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(170, Number(e.target.value) || 0));
                  setMaxVal(v);
                }}
                onBlur={() => {
                  if (maxVal < minVal + 5) setMaxVal(Math.min(170, minVal + 5));
                }}
                className="w-16 text-2xl font-black text-center bg-transparent border-b-2 outline-none focus:border-b-2 appearance-none"
                style={{ color: BRAND_NAVY, borderColor: BRAND_NAVY }}
              />
              <span className="text-sm font-semibold ml-1" style={{ color: BRAND_NAVY, opacity: 0.6 }}>D+/km</span>
            </div>
          </div>

          {/* Desktop-only APPLY button */}
          <button
            onClick={applyStep1}
            className="hidden sm:block w-full py-3 text-base font-black rounded-xl border-2 transition-all hover:opacity-80 active:scale-95"
            style={{ borderColor: BRAND_NAVY, color: BRAND_NAVY, backgroundColor: "white" }}
          >
            APPLY
          </button>
        </div>

        {/* MOUNTAIN — centered drag column, below panel on mobile / fills right on desktop */}
        <div className="flex-1 relative overflow-hidden" style={{ minHeight: 500 }}>

          {/* Mobile mountain image */}
          <img
            src="/images/dkm_mobile.png"
            alt="Mountain"
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover select-none sm:hidden"
            style={{ objectPosition: "center center" }}
          />
          {/* Desktop mountain image */}
          <img
            src="/images/mountain.png"
            alt="Mountain"
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover select-none hidden sm:block"
            style={{ objectPosition: "center 22%" }}
          />
          <div className="absolute inset-0 bg-white/10" />

          {/* DRAG COLUMN — centered within the mountain area, anchored peak→treeline */}
          <div
            className="absolute z-10"
            style={{
              left: 0,
              right: 0,
              top: "9%",
              bottom: "33%",
            }}
          >
          {/* Inner centering wrapper */}
          <div className="relative h-full flex justify-center">

            {/* The actual drag column — mountainRef, 260px wide */}
            <div
              ref={mountainRef}
              className="relative"
              style={{
                width: 260,
                height: "100%",
                touchAction: "none",
                userSelect: "none",
                cursor: "ns-resize",
              }}
            >
              {/* Dashed center line */}
              <div
                className="absolute top-0 bottom-0 border-l-2 border-dashed pointer-events-none"
                style={{ left: "50%", borderColor: "rgba(0,0,0,0.55)" }}
              />

              {/* Range fill between bars */}
              <div
                className="absolute left-0 right-0 pointer-events-none"
                style={{
                  backgroundColor: "rgba(230,57,70,0.14)",
                  top: `calc(${maxPct}% + ${BAR_H / 2}px)`,
                  bottom: `calc(${100 - minPct}% + ${BAR_H / 2}px)`,
                }}
              />

              {/* ── MAX BAR (upper) ─────────────────────────── */}
              <div
                className="absolute left-0 right-0 flex items-center cursor-ns-resize group"
                style={{ top: `calc(${maxPct}% - ${BAR_H / 2}px)`, height: BAR_H }}
                onPointerDown={() => { dragging.current = "max"; }}
              >
                <div
                  className="flex-1 h-full flex items-center justify-between px-4 rounded-md shadow-lg select-none"
                  style={{ backgroundColor: "#111" }}
                >
                  <span className="text-xs font-black tracking-[0.2em] uppercase text-white">DRAG</span>
                  <span className="text-xs font-bold text-white/70">{maxVal} D+/km</span>
                </div>
              </div>

              {/* ── MIN BAR (lower) ─────────────────────────── */}
              <div
                className="absolute left-0 right-0 flex items-center cursor-ns-resize group"
                style={{ top: `calc(${minPct}% - ${BAR_H / 2}px)`, height: BAR_H }}
                onPointerDown={() => { dragging.current = "min"; }}
              >
                <div
                  className="flex-1 h-full flex items-center justify-between px-4 rounded-md shadow-lg select-none"
                  style={{ backgroundColor: "#111" }}
                >
                  <span className="text-xs font-black tracking-[0.2em] uppercase text-white">DRAG</span>
                  <span className="text-xs font-bold text-white/70">{minVal} D+/km</span>
                </div>
              </div>

              {/* 170 D+/km (brutal) — sits ABOVE the column */}
              <div
                className="absolute left-1/2 pointer-events-none"
                style={{ top: -48, transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap" }}
              >
                <span
                  className="text-sm font-black px-3 py-1 rounded-full shadow-sm border"
                  style={{ backgroundColor: "rgba(255,255,255,0.92)", color: "#111", borderColor: "#d1d5db" }}
                >
                  ↑ 170 D+/km (brutal)
                </span>
              </div>

              {/* Reference race labels along the dotted line */}
              {([
                { value: 145, label: "145m - Tor De Geants 330" },
                { value: 65,  label: "65m Salomon Cappadocia Ultra" },
                { value: 38,  label: "38m - Trail Menorca Camí de Cavalls 185km" },
              ] as { value: number; label: string }[]).map(({ value, label }) => {
                const pct = ((MAX_VERT - value) / MAX_VERT) * 100;
                return (
                  <div
                    key={value}
                    className="absolute pointer-events-none flex items-center"
                    style={{ top: `${pct}%`, left: "50%", paddingLeft: 10 }}
                  >
                    <div className="w-3 h-px bg-white/70 mr-2 shrink-0" />
                    <span
                      className="text-xs font-bold leading-tight"
                      style={{
                        color: "#fff",
                        textShadow: "0 1px 3px rgba(0,0,0,0.7), 0 0 6px rgba(0,0,0,0.5)",
                        maxWidth: 160,
                      }}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}

              {/* 0 D+/km (flat) — sits BELOW the column */}
              <div
                className="absolute left-1/2 pointer-events-none"
                style={{ bottom: -48, transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap" }}
              >
                <span
                  className="text-sm font-black px-3 py-1 rounded-full shadow-sm border"
                  style={{ backgroundColor: "rgba(255,255,255,0.92)", color: "#111", borderColor: "#d1d5db" }}
                >
                  ↓ 0 D+/km (flat)
                </span>
              </div>
            </div>
          </div>
        </div>

          {/* Mobile-only APPLY button — fixed at bottom of mountain image */}
          <div className="sm:hidden absolute bottom-0 left-0 right-0 z-20 p-4">
            <button
              onClick={applyStep1}
              className="w-full py-4 text-lg font-black text-white rounded-xl shadow-xl transition-all active:scale-95"
              style={{ backgroundColor: BRAND_NAVY }}
            >
              APPLY
            </button>
          </div>
        </div>{/* end mountain area */}
      </div>{/* end step 1 flex row */}

      {/* ── MOBILE STATEMENT BANNER — between Step 1 and Step 2 ── */}
      <div className="sm:hidden px-6 py-10 border-t border-b border-neutral-200 bg-white">
        <h2 className="text-3xl font-black text-neutral-900 leading-tight tracking-tight">
          Specific Training is pivotal<br /> to Ultra success.
        </h2>
      </div>

      {/* ── STEP 2 + RESULTS ─────────────────────────────────── */}
      <div ref={step2Ref}>
        {step1Applied ? (
          <div className="bg-white border-t border-neutral-200">

            {/* Terrain filter */}
            <div className="px-6 sm:px-10 lg:px-16 py-12 sm:py-16 border-b border-white/10" style={{ backgroundColor: BRAND_NAVY }}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-8 sm:gap-16">
                <div className="shrink-0">
                  <div className="inline-flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black bg-white"
                      style={{ color: BRAND_NAVY }}>2</span>
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

                <div className="flex-1">
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

              {allResults.length === 0 ? (
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-10 text-center">
                  <p className="text-neutral-500 text-sm">
                    No races match these filters. Try widening the elevation range or selecting a different terrain.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pagedResults.map((r, i) => (
                      <ResultCard key={`${r.raceId}-${i}`} race={r} />
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
        ) : (
          <div className="px-6 sm:px-10 lg:px-16 py-16 text-center border-t border-neutral-100 bg-neutral-50">
            <p className="text-sm text-neutral-400 font-medium">
              Set your elevation range above and hit{" "}
              <span className="font-bold text-neutral-600">APPLY</span> to unlock terrain filtering and see results.
            </p>
          </div>
        )}
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
        <div className="absolute top-2.5 right-2.5">
          <span className="bg-white/95 rounded-full px-2.5 py-0.5 text-xs font-bold text-neutral-900 shadow-sm">
            {Math.round(race.pctIncrease)} D+/km
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

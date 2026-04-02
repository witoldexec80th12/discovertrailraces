"use client";

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import type { RaceEventRecord, DistanceRecord } from "./types";

const MAX_VERT = 170;
const BRAND_RED = "#e63946";
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
        <h1 className="text-4xl sm:text-5xl font-black text-neutral-900 leading-tight tracking-tight max-w-3xl">
          Specific Training is pivotal<br className="hidden sm:block" /> to Ultra success.
        </h1>
        <p className="mt-4 text-base sm:text-lg text-neutral-600 font-medium max-w-xl">
          Filter races by how much climbing they demand, then narrow by terrain type.
        </p>
      </div>

      {/* ── STEP 1 — MOUNTAIN SECTION ──────────────────────── */}
      {/*
        Layout: absolute-positioned left panel (instructions + APPLY) +
        mountain image filling the rest, with a narrow centered drag column
        anchored from peak (top ~9%) to treeline (top ~67%).
      */}
      <div
        className="relative w-full border-t border-neutral-200 overflow-hidden"
        style={{ height: 760 }}
      >
        {/* Mountain image — fills the full section, zoomed to frame peak→treeline */}
        <img
          src="/images/mountain.png"
          alt="Mountain"
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover select-none"
          style={{ objectPosition: "center 22%" }}
        />
        {/* Subtle vignette to make labels readable */}
        <div className="absolute inset-0 bg-white/10" />

        {/* LEFT PANEL — white sidebar */}
        <div className="absolute left-0 top-0 bottom-0 z-20 flex flex-col justify-between p-8 sm:p-10 bg-white/95 backdrop-blur-sm border-r border-neutral-200"
          style={{ width: 300 }}>
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white"
                style={{ backgroundColor: BRAND_RED }}
              >1</span>
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                Vert Meter
              </span>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
              <p className="text-sm text-neutral-700 leading-relaxed mb-3">
                <span className="font-semibold">Drag the bars</span> up or down to set your
                elevation gain range — from flat (0 m/km) at the treeline to
                hiking-steep (170 m/km) at the peak.
              </p>
              <p className="text-sm text-neutral-700 leading-relaxed">
                <span className="font-semibold">Hit Apply</span> to find matching races
                and unlock terrain filtering below.
              </p>
              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-xs text-neutral-500">Range</span>
                <span className="text-sm font-bold text-neutral-900">
                  {minVal}–{maxVal}
                  <span className="text-xs font-normal text-neutral-500 ml-1">m/km</span>
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={applyStep1}
            className="w-full py-4 text-lg font-black text-white rounded-xl transition-all hover:opacity-90 active:scale-95 shadow-md"
            style={{ backgroundColor: BRAND_RED }}
          >
            APPLY
          </button>
        </div>

        {/* DRAG COLUMN — narrow, centered in the mountain area, anchored peak→treeline */}
        {/*
          The column sits at:
            left: 300px (after left panel) + (remaining / 2) - (col width / 2)
          Top 9% = visual peak | Bottom 33% from bottom = visual treeline
          mountainRef is on this column so pointer Y maps correctly.
        */}
        <div
          className="absolute z-10"
          style={{
            left: 300,
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
                  <span className="text-xs font-bold text-white/70">{maxVal} m/km</span>
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
                  <span className="text-xs font-bold text-white/70">{minVal} m/km</span>
                </div>
              </div>

              {/* 170 m/km label — sits ABOVE the column (arrow pointing up to peak) */}
              <div
                className="absolute left-1/2 pointer-events-none"
                style={{ top: -44, transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap" }}
              >
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full shadow-sm border"
                  style={{ backgroundColor: "rgba(255,255,255,0.92)", color: "#111", borderColor: "#d1d5db" }}
                >
                  ↑ 170 m/km — peak
                </span>
              </div>

              {/* 0 m/km label — sits BELOW the column (arrow pointing down to trees) */}
              <div
                className="absolute left-1/2 pointer-events-none"
                style={{ bottom: -44, transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap" }}
              >
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full shadow-sm border"
                  style={{ backgroundColor: "rgba(255,255,255,0.92)", color: "#111", borderColor: "#d1d5db" }}
                >
                  ↓ 0 m/km — treeline
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STEP 2 + RESULTS ─────────────────────────────────── */}
      <div ref={step2Ref}>
        {step1Applied ? (
          <div className="bg-white border-t border-neutral-200">

            {/* Terrain filter */}
            <div className="px-6 sm:px-10 lg:px-16 py-12 sm:py-16 border-b border-neutral-100">
              <div className="flex flex-col sm:flex-row sm:items-start gap-8 sm:gap-16">
                <div className="shrink-0">
                  <div className="inline-flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white"
                      style={{ backgroundColor: BRAND_RED }}>2</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                      Explore TERRAIN
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-neutral-900 mb-2">
                    Filter by Terrain
                  </h2>
                  <p className="text-sm text-neutral-500 max-w-[200px]">
                    {vertFiltered.length} races match {appliedMin}–{appliedMax} m/km.
                    Click a terrain to filter instantly.
                  </p>
                  {selectedTerrain && (
                    <button
                      onClick={() => { setSelectedTerrain(null); setCurrentPage(1); }}
                      className="mt-3 text-xs font-semibold text-neutral-400 hover:text-neutral-700 transition-colors underline"
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
                            backgroundColor: isSelected ? BRAND_RED : "white",
                            color: isSelected ? "#fff" : hasRaces ? BRAND_RED : "#d1d5db",
                            borderColor: isSelected ? BRAND_RED : hasRaces ? BRAND_RED : "#e5e7eb",
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
                    {appliedMin}–{appliedMax} m/km
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

                  {totalPages > 1 && (
                    <div className="mt-10 flex items-center justify-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-semibold rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        ← Prev
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className="w-9 h-9 text-sm font-bold rounded-lg border-2 transition-all"
                          style={{
                            backgroundColor: currentPage === page ? BRAND_RED : "white",
                            color: currentPage === page ? "#fff" : "#404040",
                            borderColor: currentPage === page ? BRAND_RED : "#e5e7eb",
                          }}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-semibold rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Next →
                      </button>
                    </div>
                  )}
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
            {Math.round(race.pctIncrease)} m/km
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

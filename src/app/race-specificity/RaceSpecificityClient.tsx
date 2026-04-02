"use client";

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import type { RaceEventRecord, DistanceRecord } from "./page";

const MAX_VERT = 170;
const BRAND_RED = "#e63946";

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
  // Drag state
  const minValRef = useRef(80);
  const maxValRef = useRef(120);
  const [minVal, setMinValState] = useState(80);
  const [maxVal, setMaxValState] = useState(120);
  const setMinVal = useCallback((v: number) => { minValRef.current = v; setMinValState(v); }, []);
  const setMaxVal = useCallback((v: number) => { maxValRef.current = v; setMaxValState(v); }, []);

  // Step state
  const [appliedMin, setAppliedMin] = useState<number | null>(null);
  const [appliedMax, setAppliedMax] = useState<number | null>(null);
  const [step1Applied, setStep1Applied] = useState(false);
  const [selectedTerrain, setSelectedTerrain] = useState<string | null>(null);
  const [step2Applied, setStep2Applied] = useState(false);

  const mountainRef = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const dragging = useRef<"min" | "max" | null>(null);

  // Global pointer handlers
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

  const availableTerrains = useMemo(() => {
    const set = new Set<string>();
    vertFiltered.forEach((r) => r.terrain.forEach((t) => set.add(t)));
    return [...set].sort();
  }, [vertFiltered]);

  const finalResults = useMemo(() => {
    if (!step1Applied) return [];
    let results = vertFiltered;
    if (step2Applied && selectedTerrain) {
      results = results.filter((r) => r.terrain.includes(selectedTerrain));
    }
    return [...results].sort((a, b) => b.pctIncrease - a.pctIncrease);
  }, [vertFiltered, step1Applied, step2Applied, selectedTerrain]);

  const applyStep1 = () => {
    setAppliedMin(minVal);
    setAppliedMax(maxVal);
    setStep1Applied(true);
    setStep2Applied(false);
    setSelectedTerrain(null);
    setTimeout(() => {
      step2Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const applyStep2 = () => {
    if (!step1Applied || !selectedTerrain) return;
    setStep2Applied(true);
  };

  const reset = () => {
    setStep1Applied(false);
    setStep2Applied(false);
    setSelectedTerrain(null);
    setMinVal(80);
    setMaxVal(120);
  };

  const minPct = ((MAX_VERT - minVal) / MAX_VERT) * 100;
  const maxPct = ((MAX_VERT - maxVal) / MAX_VERT) * 100;

  return (
    <div className="min-h-screen bg-white">

      {/* ── HEADER ─────────────────────────────────────────────── */}
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

      {/* ── STEP 1 — MOUNTAIN SECTION ──────────────────────────── */}
      <div className="relative w-full overflow-hidden border-t border-neutral-200" style={{ minHeight: 580 }}>
        {/* Mountain image */}
        <img
          src="/images/mountain.png"
          alt="Mountain"
          className="absolute inset-0 w-full h-full object-cover object-top"
          draggable={false}
        />
        {/* Brand-consistent light overlay */}
        <div className="absolute inset-0 bg-white/20" />

        <div className="relative z-10 flex" style={{ minHeight: 580 }}>

          {/* LEFT — Instructions */}
          <div className="w-80 shrink-0 flex flex-col justify-between p-8 sm:p-10">
            <div>
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white"
                  style={{ backgroundColor: BRAND_RED }}>1</span>
                <span className="text-xs font-bold uppercase tracking-widest text-neutral-600">
                  Explore the VERT METER
                </span>
              </div>

              <div className="bg-white/90 backdrop-blur-sm border border-neutral-200 rounded-xl p-5 shadow-sm">
                <p className="text-sm text-neutral-700 leading-relaxed mb-3">
                  <span className="font-semibold">Slide the bars</span> up or down to set your
                  elevation gain range. The scale runs from flat (0 m/km) at the
                  bottom to hiking-steep (170 m/km) at the top.
                </p>
                <p className="text-sm text-neutral-700 leading-relaxed">
                  <span className="font-semibold">Hit Apply</span> to find matching races
                  and unlock terrain filtering below.
                </p>
                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-xs text-neutral-500">Default: 80–120 m/km</span>
                  <span className="text-sm font-bold text-neutral-900">
                    {minVal}–{maxVal}
                    <span className="text-xs font-normal text-neutral-500 ml-1">m/km</span>
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={applyStep1}
              className="mt-6 w-full py-4 text-lg font-black text-white rounded-xl transition-all hover:opacity-90 active:scale-95 shadow-md"
              style={{ backgroundColor: BRAND_RED }}
            >
              APPLY
            </button>
          </div>

          {/* CENTER — Mountain drag area */}
          <div
            ref={mountainRef}
            className="flex-1 relative"
            style={{ touchAction: "none", userSelect: "none", cursor: "ns-resize" }}
          >
            {/* Center dotted line */}
            <div
              className="absolute top-10 bottom-10 border-l-2 border-dashed border-neutral-600/40"
              style={{ left: "50%" }}
            />

            {/* Scale labels */}
            <div className="absolute top-6 flex flex-col items-center" style={{ left: "50%", transform: "translateX(-50%)" }}>
              <span className="text-[11px] font-bold text-neutral-700 bg-white/90 rounded-full px-3 py-0.5 whitespace-nowrap shadow-sm border border-neutral-200">
                170 m/km — hiking
              </span>
              <div className="w-px h-3 bg-neutral-400/50 mt-1" />
            </div>
            <div className="absolute bottom-6 flex flex-col items-center" style={{ left: "50%", transform: "translateX(-50%)" }}>
              <div className="w-px h-3 bg-neutral-400/50 mb-1" />
              <span className="text-[11px] font-bold text-neutral-700 bg-white/90 rounded-full px-3 py-0.5 whitespace-nowrap shadow-sm border border-neutral-200">
                0 m/km — flat
              </span>
            </div>

            {/* AUTO% label */}
            <div className="absolute top-6 right-5">
              <span className="text-xs font-extrabold uppercase tracking-wide" style={{ color: BRAND_RED }}>
                AUTO% Increase
              </span>
            </div>

            {/* Range fill */}
            <div
              className="absolute left-8 right-8 pointer-events-none rounded"
              style={{
                backgroundColor: `${BRAND_RED}18`,
                top: `${maxPct}%`,
                height: `${minPct - maxPct}%`,
              }}
            />

            {/* MAX bar */}
            <div
              className="absolute left-8 right-8 h-6 flex items-center cursor-ns-resize group"
              style={{ top: `calc(${maxPct}% - 12px)` }}
              onPointerDown={() => { dragging.current = "max"; }}
            >
              <div className="w-full h-1.5 bg-neutral-900 rounded-full shadow-lg group-hover:bg-neutral-600 transition-colors" />
              <span className="absolute -left-20 bg-white/95 text-xs font-bold text-neutral-800 px-2.5 py-1 rounded-lg shadow border border-neutral-200 whitespace-nowrap">
                {maxVal} m/km
              </span>
            </div>

            {/* MIN bar */}
            <div
              className="absolute left-8 right-8 h-6 flex items-center cursor-ns-resize group"
              style={{ top: `calc(${minPct}% - 12px)` }}
              onPointerDown={() => { dragging.current = "min"; }}
            >
              <div className="w-full h-1.5 bg-neutral-900 rounded-full shadow-lg group-hover:bg-neutral-600 transition-colors" />
              <span className="absolute -left-20 bg-white/95 text-xs font-bold text-neutral-800 px-2.5 py-1 rounded-lg shadow border border-neutral-200 whitespace-nowrap">
                {minVal} m/km
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── STEP 2 — TERRAIN + RESULTS ─────────────────────────── */}
      <div ref={step2Ref}>
        {step1Applied ? (
          <div className="bg-white border-t border-neutral-200">

            {/* Step 2 terrain filter */}
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
                  <p className="text-sm text-neutral-500 max-w-xs">
                    {vertFiltered.length} races match your elevation range ({appliedMin}–{appliedMax} m/km).
                    Pick a terrain type to narrow further.
                  </p>
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-6">
                    {availableTerrains.length === 0 ? (
                      <p className="text-sm text-neutral-400 italic">No terrain data for this range.</p>
                    ) : (
                      availableTerrains.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setSelectedTerrain((prev) => prev === tag ? null : tag)}
                          className="px-4 py-2 rounded-full text-sm font-bold border-2 transition-all"
                          style={{
                            backgroundColor: selectedTerrain === tag ? BRAND_RED : "white",
                            color: selectedTerrain === tag ? "#fff" : BRAND_RED,
                            borderColor: BRAND_RED,
                          }}
                        >
                          {tag}
                        </button>
                      ))
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={applyStep2}
                      disabled={!selectedTerrain}
                      className="px-8 py-3 text-sm font-black text-white rounded-full transition-all"
                      style={{
                        backgroundColor: selectedTerrain ? BRAND_RED : "#d1d5db",
                        cursor: selectedTerrain ? "pointer" : "not-allowed",
                      }}
                    >
                      APPLY TERRAIN
                    </button>
                    {step2Applied && (
                      <button
                        onClick={() => { setStep2Applied(false); setSelectedTerrain(null); }}
                        className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors"
                      >
                        Clear terrain
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="px-6 sm:px-10 lg:px-16 py-12 sm:py-16">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <h3 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-neutral-900">
                    {finalResults.length} {finalResults.length === 1 ? "Race" : "Races"} Found
                  </h3>
                  <p className="text-sm text-neutral-500 mt-1">
                    {appliedMin}–{appliedMax} m/km elevation
                    {step2Applied && selectedTerrain ? ` · ${selectedTerrain} terrain` : ""}
                  </p>
                </div>
                <button
                  onClick={reset}
                  className="text-sm font-semibold text-neutral-400 hover:text-neutral-700 transition-colors"
                >
                  Reset all filters
                </button>
              </div>

              {finalResults.length === 0 ? (
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-10 text-center">
                  <p className="text-neutral-500 text-sm">No races match these filters. Try widening the elevation range or selecting a different terrain.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {finalResults.map((r, i) => (
                    <ResultCard key={`${r.raceId}-${i}`} race={r} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Scroll prompt — visible before Step 1 is applied */
          <div className="px-6 sm:px-10 lg:px-16 py-16 text-center border-t border-neutral-100 bg-neutral-50">
            <p className="text-sm text-neutral-400 font-medium">
              Set your elevation range above and hit <span className="font-bold text-neutral-600">APPLY</span> to unlock terrain filtering and see results.
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

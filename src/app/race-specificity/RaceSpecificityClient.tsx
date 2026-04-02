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
  const minValRef = useRef(80);
  const maxValRef = useRef(120);
  const [minVal, setMinValState] = useState(80);
  const [maxVal, setMaxValState] = useState(120);

  const setMinVal = useCallback((v: number) => {
    minValRef.current = v;
    setMinValState(v);
  }, []);
  const setMaxVal = useCallback((v: number) => {
    maxValRef.current = v;
    setMaxValState(v);
  }, []);

  const [appliedMin, setAppliedMin] = useState<number | null>(null);
  const [appliedMax, setAppliedMax] = useState<number | null>(null);
  const [step1Applied, setStep1Applied] = useState(false);
  const [selectedTerrain, setSelectedTerrain] = useState<string | null>(null);
  const [step2Applied, setStep2Applied] = useState(false);

  const mountainRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<"min" | "max" | null>(null);

  // Global pointer handlers for smooth drag even outside container
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
    const handleUp = () => {
      dragging.current = null;
    };
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
      .filter(
        (d) =>
          d.fields["AUTO% Increase"] != null &&
          (d.fields["Race"]?.length ?? 0) > 0
      )
      .map((d) => {
        const raceId = d.fields["Race"]![0];
        const race = raceMap.get(raceId);
        if (!race) return null;
        const img = race.fields["Featured Image"]?.[0];
        const imgUrl =
          img?.thumbnails?.large?.url ??
          img?.thumbnails?.full?.url ??
          img?.url ??
          null;
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
    return enrichedData.filter(
      (r) => r.pctIncrease >= appliedMin && r.pctIncrease <= appliedMax
    );
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
  };

  const applyStep2 = () => {
    if (!step1Applied || !selectedTerrain) return;
    setStep2Applied(true);
  };

  const minPct = ((MAX_VERT - minVal) / MAX_VERT) * 100;
  const maxPct = ((MAX_VERT - maxVal) / MAX_VERT) * 100;

  return (
    <div className="min-h-screen bg-white">
      {/* Title */}
      <div className="px-6 sm:px-10 lg:px-16 pt-12 pb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-black text-neutral-900 leading-tight tracking-tight">
          Specific Training is pivotal to Ultra success.
        </h1>
      </div>

      {/* Mountain filter section */}
      <div className="relative w-full" style={{ minHeight: 560 }}>
        <img
          src="/images/mountain.png"
          alt="Mountain"
          className="absolute inset-0 w-full h-full object-cover object-top"
          draggable={false}
        />
        <div className="absolute inset-0 bg-white/25" />

        <div
          className="relative z-10 flex"
          style={{ minHeight: 560 }}
        >
          {/* LEFT — Step 1 */}
          <div className="w-72 shrink-0 flex flex-col justify-between p-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">
                Step 1
              </p>
              <h2 className="text-lg font-extrabold text-neutral-900 mb-4 leading-tight">
                Explore the VERT METER
              </h2>
              <div className="bg-white/85 backdrop-blur-sm border border-neutral-200 rounded-xl p-5 text-sm text-neutral-700 space-y-3">
                <p>
                  <span className="font-semibold">1.</span> Slide the bars up or
                  down to restrict your search for races by average altitude gain
                  per km.
                </p>
                <p>
                  <span className="font-semibold">2.</span> Hit Apply. The
                  default is <span className="font-bold">80–120 m/km</span>
                </p>
                <div className="pt-2 border-t border-neutral-200">
                  <p className="text-xs text-neutral-500">
                    Current range:{" "}
                    <span className="font-bold text-neutral-800">
                      {minVal}–{maxVal} m/km
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={applyStep1}
              className="mt-6 w-full py-4 text-xl font-black text-white rounded-xl transition-transform hover:scale-[1.02] active:scale-95"
              style={{ backgroundColor: BRAND_RED }}
            >
              APPLY
            </button>
          </div>

          {/* CENTER — Mountain with draggable bars */}
          <div
            ref={mountainRef}
            className="flex-1 relative"
            style={{ touchAction: "none", userSelect: "none" }}
          >
            {/* Center dotted line */}
            <div
              className="absolute top-8 bottom-8 w-0 border-l-2 border-dashed border-neutral-500/50"
              style={{ left: "50%" }}
            />

            {/* Top scale label */}
            <div
              className="absolute top-5 flex flex-col items-center"
              style={{ left: "50%", transform: "translateX(-50%)" }}
            >
              <span className="text-xs font-bold text-neutral-700 bg-white/85 rounded px-2 py-0.5 whitespace-nowrap shadow-sm">
                170 m/km (hiking)
              </span>
              <div className="mt-1 w-px h-3 bg-neutral-500/60" />
            </div>

            {/* Bottom scale label */}
            <div
              className="absolute bottom-5 flex flex-col items-center"
              style={{ left: "50%", transform: "translateX(-50%)" }}
            >
              <div className="mb-1 w-px h-3 bg-neutral-500/60" />
              <span className="text-xs font-bold text-neutral-700 bg-white/85 rounded px-2 py-0.5 whitespace-nowrap shadow-sm">
                0 m/km (flat)
              </span>
            </div>

            {/* AUTO% Increase label */}
            <div className="absolute top-5 right-4">
              <span
                className="text-sm font-extrabold"
                style={{ color: BRAND_RED }}
              >
                AUTO% Increase
              </span>
            </div>

            {/* Shaded range */}
            <div
              className="absolute left-8 right-8 pointer-events-none bg-black/10"
              style={{
                top: `${maxPct}%`,
                height: `${minPct - maxPct}%`,
              }}
            />

            {/* MAX bar */}
            <div
              className="absolute left-8 right-8 h-5 flex items-center cursor-ns-resize"
              style={{ top: `calc(${maxPct}% - 10px)` }}
              onPointerDown={() => { dragging.current = "max"; }}
            >
              <div className="w-full h-[5px] bg-neutral-900 rounded-full shadow-lg hover:bg-neutral-700 transition-colors" />
              <span className="absolute -left-14 bg-white/90 text-xs font-bold text-neutral-800 px-2 py-0.5 rounded shadow whitespace-nowrap">
                {maxVal} m/km
              </span>
            </div>

            {/* MIN bar */}
            <div
              className="absolute left-8 right-8 h-5 flex items-center cursor-ns-resize"
              style={{ top: `calc(${minPct}% - 10px)` }}
              onPointerDown={() => { dragging.current = "min"; }}
            >
              <div className="w-full h-[5px] bg-neutral-900 rounded-full shadow-lg hover:bg-neutral-700 transition-colors" />
              <span className="absolute -left-14 bg-white/90 text-xs font-bold text-neutral-800 px-2 py-0.5 rounded shadow whitespace-nowrap">
                {minVal} m/km
              </span>
            </div>
          </div>

          {/* RIGHT — Step 2 */}
          <div
            className="w-72 shrink-0 flex flex-col justify-between p-8 transition-opacity duration-300"
            style={{ opacity: step1Applied ? 1 : 0.35 }}
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">
                Step 2
              </p>
              <h2 className="text-lg font-extrabold text-neutral-900 mb-4 leading-tight">
                Explore TERRAIN
              </h2>
              <div
                className="bg-white/85 backdrop-blur-sm border border-neutral-200 rounded-xl p-4 min-h-[160px]"
                style={{ pointerEvents: step1Applied ? "auto" : "none" }}
              >
                {!step1Applied ? (
                  <p className="text-sm text-neutral-400 italic">
                    Apply Step 1 first.
                  </p>
                ) : availableTerrains.length === 0 ? (
                  <p className="text-sm text-neutral-500">
                    No terrain data for this range.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {availableTerrains.map((tag) => (
                      <button
                        key={tag}
                        onClick={() =>
                          setSelectedTerrain((prev) =>
                            prev === tag ? null : tag
                          )
                        }
                        className="w-full text-left px-4 py-2 rounded-lg font-bold text-sm transition-all border-2"
                        style={{
                          backgroundColor:
                            selectedTerrain === tag ? BRAND_RED : "transparent",
                          color:
                            selectedTerrain === tag ? "#fff" : BRAND_RED,
                          borderColor:
                            selectedTerrain === tag
                              ? BRAND_RED
                              : "transparent",
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={applyStep2}
              disabled={!step1Applied || !selectedTerrain}
              className="mt-6 w-full py-4 text-xl font-black text-white rounded-xl transition-all"
              style={{
                backgroundColor:
                  step1Applied && selectedTerrain ? BRAND_RED : "#d1d5db",
                cursor:
                  step1Applied && selectedTerrain ? "pointer" : "not-allowed",
              }}
            >
              APPLY
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {step1Applied && (
        <div className="px-6 sm:px-10 lg:px-16 py-12 border-t border-neutral-200">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h3 className="text-2xl font-extrabold text-neutral-900">
                {finalResults.length} race
                {finalResults.length !== 1 ? "s" : ""} found
              </h3>
              <p className="text-sm text-neutral-500 mt-1">
                Elevation: {appliedMin}–{appliedMax} m/km
                {step2Applied && selectedTerrain
                  ? ` · Terrain: ${selectedTerrain}`
                  : ""}
              </p>
            </div>
            <button
              onClick={() => {
                setStep1Applied(false);
                setStep2Applied(false);
                setSelectedTerrain(null);
                setMinVal(80);
                setMaxVal(120);
              }}
              className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors"
            >
              Reset filters
            </button>
          </div>

          {finalResults.length === 0 ? (
            <p className="text-neutral-500">
              No races match these filters. Try widening the range.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {finalResults.map((r, i) => (
                <ResultCard
                  key={`${r.raceId}-${r.distanceName}-${i}`}
                  race={r}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultCard({ race }: { race: EnrichedDistance }) {
  const inner = (
    <div className="group rounded-xl border border-neutral-200 bg-white overflow-hidden hover:shadow-md transition-shadow h-full">
      <div className="aspect-[16/9] bg-neutral-100 relative overflow-hidden">
        {race.imgUrl ? (
          <img
            src={race.imgUrl}
            alt={race.raceName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300" />
        )}
        <div className="absolute top-2 right-2 bg-white/90 rounded-full px-2.5 py-0.5 text-xs font-bold text-neutral-900">
          {Math.round(race.pctIncrease)} m/km
        </div>
      </div>
      <div className="p-4">
        <p className="font-bold text-neutral-900 text-sm leading-tight line-clamp-2">
          {race.raceName}
        </p>
        <p className="text-xs text-neutral-500 mt-1">
          {race.distanceName}
          {race.distanceKm ? ` · ${race.distanceKm.toFixed(0)} km` : ""}
        </p>
        {race.terrain.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {race.terrain.map((t) => (
              <span
                key={t}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return race.slug ? (
    <Link href={`/races/${race.slug}`} className="h-full">
      {inner}
    </Link>
  ) : (
    inner
  );
}

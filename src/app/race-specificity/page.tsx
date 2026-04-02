import { Metadata } from "next";
import { airtableFetchAll } from "@/lib/airtable";
import RaceSpecificityClient from "./RaceSpecificityClient";
import type { RaceEventRecord, DistanceRecord } from "./types";

export const metadata: Metadata = {
  title: "Race Specificity — DiscoverTrailRaces",
  description:
    "Filter trail races by elevation gain per km and terrain type to match your training specificity.",
};

export default async function RaceSpecificityPage() {
  const [raceEvents, distances] = await Promise.all([
    airtableFetchAll<RaceEventRecord["fields"]>("Race Events", {}).catch(() => []),
    airtableFetchAll<DistanceRecord["fields"]>("Distances", {}).catch(() => []),
  ]);

  return (
    <main className="min-h-screen bg-white">
      <RaceSpecificityClient
        raceEvents={raceEvents as RaceEventRecord[]}
        distances={distances as DistanceRecord[]}
      />
    </main>
  );
}

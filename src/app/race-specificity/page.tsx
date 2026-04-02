import { Metadata } from "next";
import { airtableFetchAll } from "@/lib/airtable";
import RaceSpecificityClient from "./RaceSpecificityClient";

export const metadata: Metadata = {
  title: "Race Specificity — DiscoverTrailRaces",
  description:
    "Filter trail races by elevation gain per km and terrain type to match your training specificity.",
};

export type RaceEventRecord = {
  id: string;
  fields: {
    "Race Name"?: string;
    Slug?: string;
    Terrain_multi?: string[];
    "Featured Image"?: Array<{
      url: string;
      thumbnails?: Record<string, { url: string; width: number; height: number }>;
    }>;
  };
};

export type DistanceRecord = {
  id: string;
  fields: {
    "AUTO% Increase"?: number;
    Race?: string[];
    "Is Primary Distance"?: boolean;
    "Distance Name"?: string;
    "Distance (km)"?: number;
  };
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

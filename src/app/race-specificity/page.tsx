import { Metadata } from "next";
import { airtableFetchAll } from "@/lib/airtable";
import RaceSpecificityClient from "./RaceSpecificityClient";
import type { RaceEventRecord, DistanceRecord } from "./types";

export const metadata: Metadata = {
  title: "Race Specificity — DiscoverTrailRaces",
  description:
    "Filter trail races by elevation gain per km and terrain type to match your training specificity.",
};

type AirtableAttachment = {
  url: string;
  thumbnails?: Record<string, { url: string }>;
};

export default async function RaceSpecificityPage() {
  const [raceEvents, distances, entryFees] = await Promise.all([
    airtableFetchAll<RaceEventRecord["fields"]>("Race Events", {}).catch(() => []),
    airtableFetchAll<DistanceRecord["fields"]>("Distances", {}).catch(() => []),
    airtableFetchAll<Record<string, unknown>>("Entry Fees", { view: "entry_fees_public" }).catch(() => []),
  ]);

  // Build slug → image URL from Entry Fees (LKP_featured_image → temporary_image fallback)
  const slugImgMap: Record<string, string> = {};
  for (const record of entryFees as Array<{ fields: Record<string, unknown> }>) {
    const f = record.fields;
    const slugs = (f["Race Slug"] as string[] | undefined) ?? [];
    const imgs =
      (f["LKP_featured_image"] as AirtableAttachment[] | undefined) ??
      (f["temporary_image"] as AirtableAttachment[] | undefined) ??
      [];
    const img = imgs[0];
    const url = img?.thumbnails?.large?.url ?? img?.thumbnails?.full?.url ?? img?.url;
    if (url) {
      for (const slug of slugs) {
        if (slug && !slugImgMap[slug]) slugImgMap[slug] = url;
      }
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <RaceSpecificityClient
        raceEvents={raceEvents as RaceEventRecord[]}
        distances={distances as DistanceRecord[]}
        slugImgMap={slugImgMap}
      />
    </main>
  );
}

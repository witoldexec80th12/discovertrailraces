import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { airtableFetchAll } from "@/lib/airtable";

export const revalidate = 3600;

type AirtableAttachment = {
  url: string;
  thumbnails?: Record<string, { url: string }>;
};

const fetchRaceSpecificityData = unstable_cache(
  async () => {
    const [raceEvents, distances, entryFees] = await Promise.all([
      airtableFetchAll("Race Events", {}, 3600).catch(() => []),
      airtableFetchAll("Distances", {}, 3600).catch(() => []),
      airtableFetchAll("Entry Fees", { view: "entry_fees_public" }, 3600).catch(() => []),
    ]);

    const slugImgMap: Record<string, string> = {};
    const slugEntryFeeMap: Record<string, { id: string; km: number }[]> = {};
    const slugCountryMap: Record<string, string> = {};

    for (const record of entryFees as Array<{ id: string; fields: Record<string, unknown> }>) {
      const f = record.fields;
      const slugs = (f["Race Slug"] as string[] | undefined) ?? [];
      const km = (f["Distance (km)"] as number | undefined) ?? 0;

      const fee = Number(f["AUTO Fee used"] ?? 0);
      const epk = Number(f["AUTO €/km"] ?? 0);
      const hasPrce = fee > 0 && epk > 0;

      const raw = f["LKP_country"];
      const country = Array.isArray(raw) ? (raw as string[])[0] ?? "" : String(raw ?? "");

      const imgs =
        (f["LKP_featured_image"] as AirtableAttachment[] | undefined) ??
        (f["temporary_image"] as AirtableAttachment[] | undefined) ??
        [];
      const img = imgs[0];
      const url = img?.thumbnails?.large?.url ?? img?.thumbnails?.full?.url ?? img?.url;

      for (const slug of slugs) {
        if (!slug) continue;
        if (url && !slugImgMap[slug]) slugImgMap[slug] = url;
        if (country && !slugCountryMap[slug]) slugCountryMap[slug] = country;
        if (hasPrce) {
          if (!slugEntryFeeMap[slug]) slugEntryFeeMap[slug] = [];
          slugEntryFeeMap[slug].push({ id: record.id, km });
        }
      }
    }

    return { raceEvents, distances, slugImgMap, slugEntryFeeMap, slugCountryMap };
  },
  ["race-specificity-data"],
  { revalidate: 3600 }
);

export async function GET() {
  try {
    const data = await fetchRaceSpecificityData();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    console.error("[race-specificity-data]", err);
    return NextResponse.json(
      { raceEvents: [], distances: [], slugImgMap: {}, slugEntryFeeMap: {}, slugCountryMap: {}, error: "Partial data failure" },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}

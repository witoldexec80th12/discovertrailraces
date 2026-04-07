import { NextResponse } from "next/server";
import { airtableFetchAll } from "@/lib/airtable";

export const revalidate = 3600;

type AirtableAttachment = {
  url: string;
  thumbnails?: Record<string, { url: string }>;
};

export async function GET() {
  try {
    const [raceEvents, distances, entryFees] = await Promise.all([
      airtableFetchAll("Race Events", {}, 3600).catch(() => []),
      airtableFetchAll("Distances", {}, 3600).catch(() => []),
      airtableFetchAll("Entry Fees", { view: "entry_fees_public" }, 3600).catch(() => []),
    ]);

    const slugImgMap: Record<string, string> = {};
    const slugEntryFeeMap: Record<string, { id: string; km: number }[]> = {};

    for (const record of entryFees as Array<{ id: string; fields: Record<string, unknown> }>) {
      const f = record.fields;
      const slugs = (f["Race Slug"] as string[] | undefined) ?? [];
      const km = (f["Distance (km)"] as number | undefined) ?? 0;

      const imgs =
        (f["LKP_featured_image"] as AirtableAttachment[] | undefined) ??
        (f["temporary_image"] as AirtableAttachment[] | undefined) ??
        [];
      const img = imgs[0];
      const url = img?.thumbnails?.large?.url ?? img?.thumbnails?.full?.url ?? img?.url;

      for (const slug of slugs) {
        if (!slug) continue;
        if (url && !slugImgMap[slug]) slugImgMap[slug] = url;
        if (!slugEntryFeeMap[slug]) slugEntryFeeMap[slug] = [];
        slugEntryFeeMap[slug].push({ id: record.id, km });
      }
    }

    return NextResponse.json(
      { raceEvents, distances, slugImgMap, slugEntryFeeMap },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=300",
        },
      }
    );
  } catch (err) {
    console.error("[race-specificity-data]", err);
    return NextResponse.json(
      { raceEvents: [], distances: [], slugImgMap: {}, slugEntryFeeMap: {}, error: "Partial data failure" },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}

import { NextResponse } from "next/server";
import { airtableFetchAll } from "@/lib/airtable";

type AirtableAttachment = {
  url: string;
  thumbnails?: Record<string, { url: string }>;
};

export async function GET() {
  try {
    const [raceEvents, distances, entryFees] = await Promise.all([
      airtableFetchAll("Race Events", {}).catch(() => []),
      airtableFetchAll("Distances", {}).catch(() => []),
      airtableFetchAll("Entry Fees", { view: "entry_fees_public" }).catch(() => []),
    ]);

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

    return NextResponse.json(
      { raceEvents, distances, slugImgMap },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=300",
        },
      }
    );
  } catch (err) {
    console.error("[race-specificity-data]", err);
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }
}

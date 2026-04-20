import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { airtableFetchAll } from "@/lib/airtable";

export const revalidate = 3600;

type AirtableAttachment = {
  url: string;
  thumbnails?: Record<string, { url: string }>;
};

function asText(v: unknown): string {
  if (Array.isArray(v)) return v.filter(Boolean).join(", ");
  if (v === null || v === undefined) return "";
  return String(v);
}

export type EnrichedEntry = {
  id: string;
  raceName: string;
  slug: string;
  terrain: string[];
  country: string;
  imgUrl: string | null;
  distanceName: string;
  distanceKm: number;
  pctIncrease: number;
  entryFeeId: string;
};

const fetchRaceSpecificityData = unstable_cache(
  async () => {
    const entryFees = await airtableFetchAll(
      "Entry Fees",
      { view: "entry_fees_public" },
      3600,
    ).catch(() => []);

    const entries: EnrichedEntry[] = [];

    for (const record of entryFees as Array<{ id: string; fields: Record<string, unknown> }>) {
      const f = record.fields;

      const fee = Number(f["AUTO Fee used"] ?? 0);
      const epk = Number(f["AUTO €/km"] ?? 0);
      if (fee <= 0 || epk <= 0) continue;

      const pctIncrease = Number(f["LKP_auto_increase"] ?? 0);
      if (!pctIncrease) continue;

      const slugsRaw = f["Race Slug"] as string[] | undefined;
      const slug = slugsRaw?.[0] ?? "";
      if (!slug) continue;

      const raceName = asText(f["Race Event"]);
      if (!raceName) continue;

      const rawTerrain = f["LKP_terrain_multi"];
      const terrain: string[] = Array.isArray(rawTerrain)
        ? (rawTerrain as string[])
        : rawTerrain
        ? [String(rawTerrain)]
        : [];

      const rawCountry = f["LKP_country"];
      const country = Array.isArray(rawCountry)
        ? (rawCountry as string[])[0] ?? ""
        : String(rawCountry ?? "");

      const distanceKm = Number(f["Distance (km)"] ?? 0);
      const distanceName = asText(f["Distance"]);

      const imgs =
        (f["LKP_featured_image"] as AirtableAttachment[] | undefined) ??
        (f["temporary_image"] as AirtableAttachment[] | undefined) ??
        [];
      const img = imgs[0];
      const imgUrl =
        img?.thumbnails?.large?.url ??
        img?.thumbnails?.full?.url ??
        img?.url ??
        null;

      entries.push({
        id: record.id,
        raceName,
        slug,
        terrain,
        country,
        imgUrl,
        distanceName,
        distanceKm,
        pctIncrease,
        entryFeeId: record.id,
      });
    }

    return { entries };
  },
  ["race-specificity-data"],
  { revalidate: 3600 },
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
      { entries: [], error: "Failed to load data" },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}

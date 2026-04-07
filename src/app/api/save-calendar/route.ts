import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import type { FavouriteEntry } from "@/lib/favouritesTypes";

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN!;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID!;
const FAV_TABLE = "Favorites";
const FEES_TABLE = "Entry Fees";
const FAV_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(FAV_TABLE)}`;
const FEES_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(FEES_TABLE)}`;

const airtableHeaders = {
  Authorization: `Bearer ${AIRTABLE_TOKEN}`,
  "Content-Type": "application/json",
};

function asText(v: unknown): string {
  if (Array.isArray(v)) return (v as unknown[]).filter(Boolean).join(", ");
  if (v === null || v === undefined) return "";
  return String(v);
}

function parseName(idField: string): string {
  const parts = idField.split(/\s[–—-]\s/);
  return parts.length > 1 ? parts.slice(0, -1).join(" – ") : idField;
}

async function getFavEntryFeeIds(userId: string): Promise<string[]> {
  const formula = encodeURIComponent(`{clerk_user_id} = "${userId}"`);
  const res = await fetch(`${FAV_URL}?filterByFormula=${formula}`, {
    headers: airtableHeaders,
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.records ?? [])
    .map((r: { fields: { race_slug1?: string[] } }) => r.fields.race_slug1?.[0])
    .filter(Boolean) as string[];
}

async function fetchEntryFeeRecords(recordIds: string[]): Promise<FavouriteEntry[]> {
  if (recordIds.length === 0) return [];
  const formula = encodeURIComponent(
    `OR(${recordIds.map((id) => `RECORD_ID()="${id}"`).join(",")})`
  );
  const res = await fetch(`${FEES_URL}?filterByFormula=${formula}&pageSize=100`, {
    headers: airtableHeaders,
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.records ?? []).map(
    (r: {
      id: string;
      fields: {
        ID?: string | number;
        "Race Slug"?: string[];
        LKP_country?: string | string[];
        "Distance (km)"?: string | number | string[];
        "AUTO €/km"?: number;
        "Distance Start Date"?: string;
        LKP_featured_image?: { url: string }[];
        temporary_image?: { url: string }[];
      };
    }): FavouriteEntry => {
      const f = r.fields;
      const idText = asText(f.ID);
      const name = parseName(idText);
      const slug = f["Race Slug"]?.[0] ?? "";
      const country = asText(f.LKP_country) || null;
      const imageUrl =
        f.LKP_featured_image?.[0]?.url ??
        f.temporary_image?.[0]?.url ??
        null;
      const eurPerKm =
        typeof f["AUTO €/km"] === "number" && f["AUTO €/km"] > 0
          ? f["AUTO €/km"]
          : null;
      const rawKm = f["Distance (km)"];
      const distanceKm = Array.isArray(rawKm)
        ? parseFloat(String(rawKm[0])) || null
        : rawKm != null
        ? parseFloat(String(rawKm)) || null
        : null;
      const startDate = f["Distance Start Date"] ?? null;
      return { entryFeeId: r.id, slug, name, imageUrl, eurPerKm, distanceKm, startDate, country };
    }
  );
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entryFeeIds = await getFavEntryFeeIds(userId);
  const entries = await fetchEntryFeeRecords(entryFeeIds);
  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let entry_fee_ids: string[];
  try {
    const body = await req.json();
    entry_fee_ids = Array.isArray(body.entry_fee_ids) ? body.entry_fee_ids : [];
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (entry_fee_ids.length === 0) {
    return NextResponse.json({ ok: true, added: 0 });
  }

  const existing = new Set(await getFavEntryFeeIds(userId));
  const toAdd = entry_fee_ids.filter((id) => !existing.has(id));

  let added = 0;
  for (const entryFeeId of toAdd) {
    const res = await fetch(FAV_URL, {
      method: "POST",
      headers: airtableHeaders,
      body: JSON.stringify({
        fields: {
          clerk_user_id: userId,
          race_slug1: [entryFeeId],
        },
      }),
    });
    if (res.ok) added++;
    else {
      console.error("[save-calendar] Airtable write error", await res.text());
    }
  }

  return NextResponse.json({ ok: true, added });
}

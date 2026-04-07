import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN!;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID!;
const TABLE = "Favorites";
const BASE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE)}`;

const airtableHeaders = {
  Authorization: `Bearer ${AIRTABLE_TOKEN}`,
  "Content-Type": "application/json",
};

async function getExistingFavorites(userId: string): Promise<string[]> {
  const formula = encodeURIComponent(`{clerk_user_id} = "${userId}"`);
  const res = await fetch(`${BASE_URL}?filterByFormula=${formula}`, {
    headers: airtableHeaders,
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.records ?? [])
    .map((r: { fields: { race_slug1?: string[] } }) => r.fields.race_slug1?.[0])
    .filter(Boolean) as string[];
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

  const existing = new Set(await getExistingFavorites(userId));
  const toAdd = entry_fee_ids.filter((id) => !existing.has(id));

  let added = 0;
  for (const entryFeeId of toAdd) {
    const res = await fetch(BASE_URL, {
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

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN!;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID!;
const TABLE = "Favorites";
const BASE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE)}`;

const headers = {
  Authorization: `Bearer ${AIRTABLE_TOKEN}`,
  "Content-Type": "application/json",
};

type FavRecord = {
  id: string;
  fields: {
    clerk_user_id?: string;
    race_slug1?: string[];
  };
};

async function getUserFavorites(userId: string): Promise<FavRecord[]> {
  const formula = encodeURIComponent(`{clerk_user_id} = "${userId}"`);
  const res = await fetch(`${BASE_URL}?filterByFormula=${formula}`, { headers, cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.records ?? [];
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const records = await getUserFavorites(userId);
  const favorites: string[] = records
    .map((r) => r.fields.race_slug1?.[0])
    .filter(Boolean) as string[];

  return NextResponse.json({ favorites });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { entry_fee_id } = await req.json();
  if (!entry_fee_id) return NextResponse.json({ error: "entry_fee_id required" }, { status: 400 });

  const existing = await getUserFavorites(userId);
  const alreadySaved = existing.some((r) => r.fields.race_slug1?.[0] === entry_fee_id);
  if (alreadySaved) return NextResponse.json({ ok: true, message: "Already favorited" });

  const createRes = await fetch(BASE_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      fields: {
        clerk_user_id: userId,
        race_slug1: [entry_fee_id],
      },
    }),
  });

  if (!createRes.ok) {
    console.error("[favorites/POST] Airtable error", await createRes.text());
    return NextResponse.json({ error: "Failed to save favorite" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { entry_fee_id } = await req.json();
  if (!entry_fee_id) return NextResponse.json({ error: "entry_fee_id required" }, { status: 400 });

  const existing = await getUserFavorites(userId);
  const match = existing.find((r) => r.fields.race_slug1?.[0] === entry_fee_id);

  if (!match) return NextResponse.json({ ok: true, message: "Not found" });

  const delRes = await fetch(`${BASE_URL}/${match.id}`, {
    method: "DELETE",
    headers,
  });

  if (!delRes.ok) {
    console.error("[favorites/DELETE] Airtable error", await delRes.text());
    return NextResponse.json({ error: "Failed to remove favorite" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

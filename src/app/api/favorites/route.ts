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

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formula = encodeURIComponent(`{clerk_user_id} = "${userId}"`);
  const res = await fetch(`${BASE_URL}?filterByFormula=${formula}`, { headers });

  if (!res.ok) {
    console.error("[favorites/GET] Airtable error", await res.text());
    return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 });
  }

  const data = await res.json();
  const slugs: string[] = (data.records ?? []).map(
    (r: { fields: { race_slug: string } }) => r.fields.race_slug
  );

  return NextResponse.json({ favorites: slugs });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { race_slug } = await req.json();
  if (!race_slug) return NextResponse.json({ error: "race_slug required" }, { status: 400 });

  const checkFormula = encodeURIComponent(
    `AND({clerk_user_id} = "${userId}", {race_slug} = "${race_slug}")`
  );
  const checkRes = await fetch(`${BASE_URL}?filterByFormula=${checkFormula}`, { headers });
  const checkData = await checkRes.json();
  if ((checkData.records ?? []).length > 0) {
    return NextResponse.json({ ok: true, message: "Already favorited" });
  }

  const createRes = await fetch(BASE_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      fields: { clerk_user_id: userId, race_slug },
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

  const { race_slug } = await req.json();
  if (!race_slug) return NextResponse.json({ error: "race_slug required" }, { status: 400 });

  const formula = encodeURIComponent(
    `AND({clerk_user_id} = "${userId}", {race_slug} = "${race_slug}")`
  );
  const findRes = await fetch(`${BASE_URL}?filterByFormula=${formula}`, { headers });
  const findData = await findRes.json();
  const record = (findData.records ?? [])[0];

  if (!record) return NextResponse.json({ ok: true, message: "Not found" });

  const delRes = await fetch(`${BASE_URL}/${record.id}`, {
    method: "DELETE",
    headers,
  });

  if (!delRes.ok) {
    console.error("[favorites/DELETE] Airtable error", await delRes.text());
    return NextResponse.json({ error: "Failed to remove favorite" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

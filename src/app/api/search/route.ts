import { NextRequest, NextResponse } from "next/server";

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

const FIELDS = [
  "ID",
  "LKP_country",
  "AUTO €/km",
  "Distance (km)",
  "Race Slug",
  "LKP_featured_image",
  "temporary_image",
  "AUTO Price Bands",
  "Distance Start Date",
];

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!q || q.length < 2) {
    return NextResponse.json({ records: [] });
  }

  const safe = q.replace(/['"]/g, "");
  const filterByFormula = `SEARCH(LOWER("${safe}"), LOWER({ID}))`;

  const url = new URL(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Entry%20Fees`,
  );
  url.searchParams.set("view", "entry_fees_public");
  url.searchParams.set("filterByFormula", filterByFormula);
  url.searchParams.set("pageSize", "12");
  FIELDS.forEach((f) => url.searchParams.append("fields[]", f));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    return NextResponse.json({ records: [] }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json({ records: data.records ?? [] });
}

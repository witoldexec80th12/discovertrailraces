import { NextResponse } from "next/server";

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

function asText(v: unknown): string {
  if (Array.isArray(v)) return v.filter(Boolean).join(", ");
  if (v === null || v === undefined) return "";
  return String(v);
}

type EnrichedFields = {
  logistics: string | null;
  primaryAirport: string | null;
  elevationM: number | null;
  percentIncrease: number | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("ids") ?? "";
  const ids = raw.split(",").map((s) => s.trim()).filter(Boolean);

  if (!ids.length) return NextResponse.json({});
  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
    return NextResponse.json({ error: "Missing Airtable config" }, { status: 500 });
  }

  const formula = encodeURIComponent(
    `OR(${ids.map((id) => `RECORD_ID()="${id}"`).join(",")})`
  );
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Entry%20Fees?filterByFormula=${formula}&pageSize=100`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
    cache: "no-store",
  });

  if (!res.ok) return NextResponse.json({}, { status: 200 });

  const data = await res.json().catch(() => ({ records: [] }));
  const result: Record<string, EnrichedFields> = {};

  for (const r of data.records ?? []) {
    const f = r.fields as Record<string, unknown>;
    result[r.id] = {
      logistics: asText(f.LKP_logistics) || null,
      primaryAirport: asText(f.LKP_primaryairport) || null,
      elevationM: f.LKP_elevation != null ? Number(f.LKP_elevation) || null : null,
      percentIncrease: f["LKP_%increase"] != null ? Number(f["LKP_%increase"]) || null : null,
    };
  }

  return NextResponse.json(result);
}

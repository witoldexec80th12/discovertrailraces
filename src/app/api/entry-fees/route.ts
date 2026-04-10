import { NextResponse } from "next/server";

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

function asText(v: unknown): string {
  if (Array.isArray(v)) return v.filter(Boolean).join(", ");
  if (v === null || v === undefined) return "";
  return String(v);
}

function pickFirstUrl(a?: { url: string }[]): string | null {
  const url = a?.[0]?.url;
  return typeof url === "string" && url.length ? url : null;
}

type EnrichedFields = {
  imageUrl: string | null;
  terrain: string | null;
  logistics: string | null;
  primaryAirport: string | null;
  elevationM: number | null;
  percentIncrease: number | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("ids") ?? "";
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.startsWith("rec"));

  if (!ids.length) return NextResponse.json({});
  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
    return NextResponse.json({ error: "Missing Airtable config" }, { status: 500 });
  }

  const formula =
    ids.length === 1
      ? `RECORD_ID()="${ids[0]}"`
      : `OR(${ids.map((id) => `RECORD_ID()="${id}"`).join(",")})`;

  const fields = [
    "LKP_featured_image",
    "temporary_image",
    "LKP_terrain",
    "LKP_logistics",
    "LKP_primaryairport",
    "LKP_elevation",
    "LKP_%increase",
  ];

  const url = new URL(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Entry%20Fees`
  );
  url.searchParams.set("filterByFormula", formula);
  url.searchParams.set("pageSize", "100");
  fields.forEach((f) => url.searchParams.append("fields[]", f));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
    // 30-minute cache — well within Airtable's ~2hr signed URL expiry
    next: { revalidate: 1800 },
  } as RequestInit);

  if (!res.ok) return NextResponse.json({}, { status: 200 });

  const data = await res.json().catch(() => ({ records: [] }));
  const result: Record<string, EnrichedFields> = {};

  for (const r of data.records ?? []) {
    const f = r.fields as Record<string, unknown>;
    result[r.id] = {
      imageUrl:
        pickFirstUrl(f.LKP_featured_image as { url: string }[]) ??
        pickFirstUrl(f.temporary_image as { url: string }[]) ??
        null,
      terrain: asText(f.LKP_terrain) || null,
      logistics: asText(f.LKP_logistics) || null,
      primaryAirport: asText(f.LKP_primaryairport) || null,
      elevationM: f.LKP_elevation != null ? Number(f.LKP_elevation) || null : null,
      percentIncrease:
        f["LKP_%increase"] != null ? Number(f["LKP_%increase"]) || null : null,
    };
  }

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "private, max-age=1800",
    },
  });
}

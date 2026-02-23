import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!token || !baseId) {
    return NextResponse.json({ ok: false, error: "Missing env vars" }, { status: 500 });
  }

  const table = "Entry Fees";
  const view = "🌍 Entry Fees – Public"; // or your viw... if you switched
  const url = new URL(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`);
  url.searchParams.set("view", view);
  url.searchParams.set("pageSize", "3");
  url.searchParams.set("sort[0][field]", "AUTO €/km"); // we will adjust if needed
  url.searchParams.set("sort[0][direction]", "asc");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));

  return NextResponse.json(
    {
      ok: res.ok,
      status: res.status,
      url: url.toString(),
      data,
    },
    { status: 200 }
  );
}
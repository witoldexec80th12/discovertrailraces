export type AirtableRecord<T> = {
  id: string;
  fields: T;
};

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
  throw new Error("Missing AIRTABLE_TOKEN or AIRTABLE_BASE_ID in env");
}

export async function airtableFetch<TFields>(
  tableName: string,
  params: Record<string, string | number | boolean | undefined> = {},
): Promise<AirtableRecord<TFields>[]> {
  const url = new URL(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`,
  );

  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined) return;
    url.searchParams.set(k, String(v));
  });

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}) as any);

  if (!res.ok) {
    // Airtable error payload is usually { error: { type, message } }
    const msg =
      data?.error?.message ??
      (typeof data === "string" ? data : JSON.stringify(data));
    const typ = data?.error?.type ?? "HTTP_ERROR";
    throw new Error(`Airtable API error (${res.status}) ${typ}: ${msg}`);
  }

  if (data?.error) {
    throw new Error(
      `Airtable API error: ${data.error.type} — ${data.error.message}`,
    );
  }

  if (!Array.isArray(data?.records)) {
    throw new Error(`Airtable response missing records array`);
  }

  return data.records as AirtableRecord<TFields>[];
}

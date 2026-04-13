export type AirtableRecord<T> = {
  id: string;
  fields: T;
};

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
  throw new Error("Missing AIRTABLE_TOKEN or AIRTABLE_BASE_ID in env");
}

function fetchOptions(revalidate: number | false): RequestInit {
  if (revalidate === false) return { cache: "no-store" };
  return { next: { revalidate } } as RequestInit;
}

/** Sleep for `ms` milliseconds. */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch a single Airtable API URL with up to `maxRetries` retries.
 * Retries on 429 (rate-limit) and 5xx errors with exponential backoff.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
): Promise<Response> {
  let attempt = 0;
  while (true) {
    const res = await fetch(url, options);

    // Retry on rate-limit or server errors
    const shouldRetry =
      (res.status === 429 || res.status >= 500) && attempt < maxRetries;

    if (shouldRetry) {
      // Respect Retry-After header if present, otherwise exponential backoff
      const retryAfter = res.headers.get("Retry-After");
      const delayMs = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : Math.min(1000 * 2 ** attempt, 8000);

      console.warn(
        `[Airtable] ${res.status} on attempt ${attempt + 1}, retrying in ${delayMs}ms — ${url}`,
      );
      await sleep(delayMs);
      attempt++;
      continue;
    }

    return res;
  }
}

export async function airtableFetch<TFields>(
  tableName: string,
  params: Record<string, string | number | boolean | undefined> = {},
  revalidate: number | false = false,
): Promise<AirtableRecord<TFields>[]> {
  const url = new URL(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`,
  );

  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined) return;
    url.searchParams.set(k, String(v));
  });

  const res = await fetchWithRetry(url.toString(), {
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
    ...fetchOptions(revalidate),
  });

  const data = await res.json().catch(() => ({}) as any);

  if (!res.ok) {
    const msg =
      data?.error?.message ??
      (typeof data === "string" ? data : JSON.stringify(data));
    const typ = data?.error?.type ?? "HTTP_ERROR";
    console.error(`[Airtable] Error fetching ${tableName}: ${res.status} ${typ}: ${msg}`);
    throw new Error(`Airtable API error (${res.status}) ${typ}: ${msg}`);
  }

  if (data?.error) {
    console.error(`[Airtable] Error in response for ${tableName}:`, data.error);
    throw new Error(
      `Airtable API error: ${data.error.type} — ${data.error.message}`,
    );
  }

  if (!Array.isArray(data?.records)) {
    console.error(`[Airtable] Missing records array for ${tableName}, got:`, JSON.stringify(data).slice(0, 200));
    throw new Error(`Airtable response missing records array`);
  }

  return data.records as AirtableRecord<TFields>[];
}

export async function airtableFetchAll<TFields>(
  tableName: string,
  params: Record<string, string | number | boolean | undefined> = {},
  revalidate: number | false = false,
): Promise<AirtableRecord<TFields>[]> {
  const all: AirtableRecord<TFields>[] = [];
  const baseParams = { ...params, pageSize: 100 };
  let offset: string | undefined = undefined;

  while (true) {
    const url = new URL(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`,
    );

    Object.entries(baseParams).forEach(([k, v]) => {
      if (v === undefined) return;
      url.searchParams.set(k, String(v));
    });
    if (offset) url.searchParams.set("offset", offset);

    const res = await fetchWithRetry(url.toString(), {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
      ...fetchOptions(revalidate),
    });

    const data = await res.json().catch(() => ({}) as any);

    if (!res.ok) {
      const msg =
        data?.error?.message ??
        (typeof data === "string" ? data : JSON.stringify(data));
      const typ = data?.error?.type ?? "HTTP_ERROR";
      console.error(`[Airtable] Error fetching ${tableName} (page, offset=${offset ?? "start"}): ${res.status} ${typ}: ${msg}`);
      throw new Error(`Airtable API error (${res.status}) ${typ}: ${msg}`);
    }

    if (data?.error) {
      console.error(`[Airtable] Error in response for ${tableName}:`, data.error);
      throw new Error(
        `Airtable API error: ${data.error.type} — ${data.error.message}`,
      );
    }

    if (!Array.isArray(data?.records)) {
      console.error(`[Airtable] Missing records array for ${tableName}, got:`, JSON.stringify(data).slice(0, 200));
      throw new Error(`Airtable response missing records array`);
    }

    all.push(...(data.records as AirtableRecord<TFields>[]));

    if (data.offset) {
      offset = data.offset;
    } else {
      break;
    }
  }

  return all;
}

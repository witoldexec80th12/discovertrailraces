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
 * Does NOT retry 422 LIST_RECORDS_ITERATOR_NOT_AVAILABLE — that is handled
 * at the airtableFetchAll level by restarting pagination from scratch.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
): Promise<Response> {
  let attempt = 0;
  while (true) {
    const res = await fetch(url, options);

    // Retry on rate-limit or server errors (not 422 — handled separately)
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
  const baseParams = { ...params, pageSize: 100 };
  // Always fetch individual pages fresh — the page-level ISR revalidation
  // handles caching at the right layer. Passing `next: { revalidate }`
  // to paginated sub-requests risks Next.js serving a cached 422 response
  // on retries, which would make the restart logic ineffective.
  const pageRequestOptions: RequestInit = { cache: "no-store" };
  const headers = { Authorization: `Bearer ${AIRTABLE_TOKEN}` };

  // We allow up to 3 full restarts if Airtable's pagination cursor expires
  // mid-way through (LIST_RECORDS_ITERATOR_NOT_AVAILABLE / 422).
  const MAX_RESTARTS = 3;

  for (let attempt = 0; attempt <= MAX_RESTARTS; attempt++) {
    const all: AirtableRecord<TFields>[] = [];
    let offset: string | undefined = undefined;
    let cursorExpired = false;

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
        headers,
        ...pageRequestOptions,
      });

      const data = await res.json().catch(() => ({}) as any);

      // 422 LIST_RECORDS_ITERATOR_NOT_AVAILABLE — cursor expired.
      // Restart the whole fetch from page 1 after a short pause.
      if (
        res.status === 422 &&
        (data?.error?.type === "LIST_RECORDS_ITERATOR_NOT_AVAILABLE" ||
          JSON.stringify(data).includes("LIST_RECORDS_ITERATOR_NOT_AVAILABLE"))
      ) {
        console.warn(
          `[Airtable] Pagination cursor expired for ${tableName} (attempt ${attempt + 1}/${MAX_RESTARTS + 1}), restarting from page 1.`,
        );
        cursorExpired = true;
        await sleep(1000);
        break;
      }

      if (!res.ok) {
        const msg =
          data?.error?.message ??
          (typeof data === "string" ? data : JSON.stringify(data));
        const typ = data?.error?.type ?? "HTTP_ERROR";
        console.error(
          `[Airtable] Error fetching ${tableName} (offset=${offset ?? "start"}): ${res.status} ${typ}: ${msg}`,
        );
        throw new Error(`Airtable API error (${res.status}) ${typ}: ${msg}`);
      }

      if (data?.error) {
        console.error(`[Airtable] Error in response for ${tableName}:`, data.error);
        throw new Error(
          `Airtable API error: ${data.error.type} — ${data.error.message}`,
        );
      }

      if (!Array.isArray(data?.records)) {
        console.error(
          `[Airtable] Missing records array for ${tableName}, got:`,
          JSON.stringify(data).slice(0, 200),
        );
        throw new Error(`Airtable response missing records array`);
      }

      all.push(...(data.records as AirtableRecord<TFields>[]));

      if (data.offset) {
        offset = data.offset;
      } else {
        // Completed successfully
        return all;
      }
    }

    // If we broke out for any reason other than cursor expiry, stop
    if (!cursorExpired) break;
  }

  // Exhausted restarts — throw so the caller can show a graceful error
  throw new Error(
    `Airtable pagination cursor expired repeatedly for "${tableName}". Try again in a moment.`,
  );
}

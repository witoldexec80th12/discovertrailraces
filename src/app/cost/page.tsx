import { airtableFetch } from "@/lib/airtable";
import { AIRTABLE } from "@/lib/airtableConfig";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import type React from "react";
import { ImageIcon, ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Cost Per KM | Discover Trail Races",
  description:
    "Cost Per KM is our internal tool comparing prices across trail races per km run. Applied to Europe's top independent trail races.",
};

type AirtableAttachment = {
  id: string;
  url: string;
  filename: string;
  width?: number;
  height?: number;
  thumbnails?: Record<string, { url: string; width: number; height: number }>;
};

type EntryFeeFields = {
  ID?: string | number;
  "Race Event"?: string | string[];
  "Country (from Race)"?: string | string[];
  "Region (from Race)"?: string | string[];
  Distance?: string | string[];
  "Distance (km)"?: string | string[];
  Currency?: string;
  "AUTO Fee used"?: number;
  "AUTO €/km"?: number;
  "AUTO Price Bands"?: string;
  "Last Checked"?: string;
  "Featured Image"?: AirtableAttachment[];
  "Featured Blurb"?: string | string[];
  "Race Slug"?: string[];
  "Distance Start Date"?: string;
};

function asText(v: unknown): string {
  if (Array.isArray(v)) return v.filter(Boolean).join(", ");
  if (v === null || v === undefined) return "";
  return String(v);
}

const COUNTRY_CODES: Record<string, string> = {
  france: "fr",
  spain: "es",
  italy: "it",
  portugal: "pt",
  germany: "de",
  austria: "at",
  switzerland: "ch",
  "united kingdom": "gb",
  uk: "gb",
  greece: "gr",
  turkey: "tr",
  sweden: "se",
  norway: "no",
  denmark: "dk",
  finland: "fi",
  iceland: "is",
  ireland: "ie",
  belgium: "be",
  netherlands: "nl",
  "the netherlands": "nl",
  luxembourg: "lu",
  poland: "pl",
  "czech republic": "cz",
  czechia: "cz",
  slovakia: "sk",
  hungary: "hu",
  romania: "ro",
  bulgaria: "bg",
  croatia: "hr",
  slovenia: "si",
  serbia: "rs",
  montenegro: "me",
  albania: "al",
  "north macedonia": "mk",
  macedonia: "mk",
  "bosnia and herzegovina": "ba",
  bosnia: "ba",
  estonia: "ee",
  latvia: "lv",
  lithuania: "lt",
  cyprus: "cy",
  malta: "mt",
  andorra: "ad",
  monaco: "mc",
  liechtenstein: "li",
  "san marino": "sm",
  morocco: "ma",
  usa: "us",
  "united states": "us",
  canada: "ca",
  mexico: "mx",
  brazil: "br",
  argentina: "ar",
  chile: "cl",
  colombia: "co",
  japan: "jp",
  china: "cn",
  australia: "au",
  "new zealand": "nz",
  "south africa": "za",
  kenya: "ke",
  nepal: "np",
  india: "in",
};

function countryToCode(country: string): string | null {
  if (!country) return null;
  const lower = country.toLowerCase().trim();
  return COUNTRY_CODES[lower] || null;
}

function flagUrl(countryCode: string): string {
  return `https://flagcdn.com/w320/${countryCode}.png`;
}

function getBandColor(band: unknown): string {
  if (!band) return "bg-neutral-100 text-neutral-500";
  const b = String(band).toLowerCase();
  if (
    b.includes("cheap") ||
    b.includes("low") ||
    b.includes("budget") ||
    b.includes("less than 1") ||
    b.includes("0-1") ||
    b === "$"
  )
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (
    b.includes("mid") ||
    b.includes("average") ||
    b.includes("1-2") ||
    b === "$$"
  )
    return "bg-amber-50 text-amber-700 border-amber-200";
  if (
    b.includes("expensive") ||
    b.includes("high") ||
    b.includes("premium") ||
    b.includes("2-3") ||
    b.includes("3+") ||
    b === "$$$"
  )
    return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-neutral-50 text-neutral-600 border-neutral-200";
}

function formatBand(band: unknown): string {
  if (!band) return "\u2014";
  const b = String(band).toLowerCase();
  if (
    b.includes("less than 1") ||
    b.includes("under 1") ||
    b.includes("0-1") ||
    b.includes("< 1") ||
    b.includes("<1")
  )
    return "0\u20131";
  if (
    b.includes("1-2") ||
    b.includes("1 to 2") ||
    (b.includes("mid") && !b.includes("3"))
  )
    return "1\u20132";
  if (b.includes("2-3") || b.includes("2 to 3")) return "2\u20133";
  if (
    b.includes("3+") ||
    b.includes("3 to") ||
    b.includes("more than 3") ||
    b.includes("> 3") ||
    b.includes(">3") ||
    b.includes("expensive") ||
    b.includes("premium") ||
    b.includes("high")
  )
    return "3+";
  if (b.includes("cheap") || b.includes("low") || b.includes("budget"))
    return "0\u20131";
  if (b.includes("mid") || b.includes("average")) return "1\u20132";
  return String(band);
}

export default async function CostPage() {
  let records: Awaited<ReturnType<typeof airtableFetch<EntryFeeFields>>> = [];
  let error: string | null = null;

  try {
    records = await airtableFetch<EntryFeeFields>(AIRTABLE.TABLES.ENTRY_FEES, {
      view: AIRTABLE.VIEWS.ENTRY_FEES_PUBLIC,
      "sort[0][field]": "AUTO €/km", // or your cleaned field name if renamed
      "sort[0][direction]": "asc",
      pageSize: 20,
    });
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load data";
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-12">
        {/* HERO */}
        <section className="relative isolate overflow-hidden h-[69vh] sm:h-[75vh]">
          {/* Background image */}
          <div className="absolute inset-0 -z-10">
            <Image
              src="/images/hero.jpg"
              alt="Mountain ridge"
              fill
              priority
              className="object-cover"
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/20" />
          </div>

          {/* Top bar */}
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
            <div className="flex items-center justify-between">
              <Image
                src="/images/logo_white.png"
                alt="DiscoverTrailRaces.com"
                width={360}
                height={72}
                className="h-20 sm:h-28 md:h-36 lg:h-[168px] w-auto"
                priority
              />
            </div>
          </div>

          {/* Hero content */}
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-2 sm:py-8 md:py-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 sm:gap-6 md:gap-10 items-center">
              <div>
                <Image
                  src="/images/cost_per_km_white.png"
                  alt="COST-PER-KM"
                  width={900}
                  height={300}
                  className="w-full max-w-[280px] sm:max-w-[400px] md:max-w-[560px] h-auto"
                  priority
                />
              </div>

              <div className="text-white">
                <p className="text-sm sm:text-base md:text-lg text-white/85 leading-relaxed">
                  Cost Per KM compares entry fees across trail races per km run.
                  Applied to Europe&rsquo;s independent trail races, it helps
                  you plan goal races, discover new places, and compare across
                  clear price points.
                </p>
                <p className="mt-1.5 sm:mt-5 text-lg sm:text-xl md:text-2xl font-semibold tracking-tight">
                  Plan your best trail season yet.
                </p>

                <div className="mt-2.5 sm:mt-6 md:mt-8 flex flex-wrap gap-3">
                  <a
                    href="#cost-index"
                    className="inline-flex items-center rounded-full bg-white px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-neutral-900 hover:bg-white/90"
                  >
                    Explore the Cost Index
                  </a>
                  <a
                    href="#method"
                    className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-white/15"
                  >
                    How this works
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTENT */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          {/* ...keep the rest of your page content here... */}
        </div>

        <p
          id="cost-index"
          className="text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-400 mb-4"
        >
          Cost Transparency
        </p>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
            <p className="text-sm font-medium text-rose-700">{error}</p>
            <p className="mt-1 text-xs text-rose-500">
              Check that AIRTABLE_TOKEN and AIRTABLE_BASE_ID are configured
              correctly.
            </p>
          </div>
        ) : records.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center">
            <p className="text-sm text-neutral-500">No records found.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {records.map((r) => {
                const f = r.fields;
                const slug = f["Race Slug"]?.[0];
                const rawFee = f["AUTO Fee used"];
                const fee =
                  typeof rawFee === "number" && rawFee > 0 ? rawFee : null;
                const rawEpk = f["AUTO €/km"];
                const epk =
                  typeof rawEpk === "number" && rawEpk > 0 ? rawEpk : null;
                const country = asText(f["Country (from Race)"]);
                const region = asText(f["Region (from Race)"]);
                const location = [country, region].filter(Boolean).join(" · ");
                const startDateRaw = f["Distance Start Date"];
                const startDate =
                  typeof startDateRaw === "string" && startDateRaw
                    ? new Date(startDateRaw).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                      })
                    : "";
                const thumbUrl = f["Featured Image"]?.[0]?.url;
                const blurb = asText(f["Featured Blurb"]);
                const raceName = asText(f["ID"]) || asText(f["Race Event"]);
                const rowHref = slug ? `/races/${slug}` : null;

                const Wrapper = rowHref
                  ? ({
                      children,
                      className,
                    }: {
                      children: React.ReactNode;
                      className: string;
                    }) => (
                      <Link href={rowHref} className={`block ${className}`}>
                        {children}
                      </Link>
                    )
                  : ({
                      children,
                      className,
                    }: {
                      children: React.ReactNode;
                      className: string;
                    }) => <div className={className}>{children}</div>;

                return (
                  <Wrapper
                    key={r.id}
                    className={`group/card rounded-xl border border-neutral-200 bg-white p-5 transition-all duration-200 ${rowHref ? "hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:scale-[1.01] hover:border-neutral-300" : ""}`}
                  >
                    <div className="flex gap-5">
                      <div className="shrink-0">
                        {thumbUrl ? (
                          <img
                            src={thumbUrl}
                            alt={raceName}
                            className="w-32 h-[88px] sm:w-40 sm:h-[108px] rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-32 h-[88px] sm:w-40 sm:h-[108px] rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-neutral-300" />
                          </div>
                        )}
                        {startDate && (
                          <p className="sm:hidden mt-1.5 text-xs font-bold text-neutral-700 text-center">
                            {startDate}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-1 min-w-0 flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="min-w-0 flex-1 sm:max-w-[50%]">
                          <h3 className="font-bold text-neutral-900 text-base sm:text-lg leading-snug tracking-tight">
                            <span
                              className={
                                rowHref ? "group-hover/card:underline" : ""
                              }
                            >
                              {raceName}
                            </span>
                            {rowHref && (
                              <ArrowUpRight className="inline-block w-4 h-4 ml-1 text-neutral-400 opacity-0 group-hover/card:opacity-100 transition-opacity" />
                            )}
                          </h3>
                          {location && (
                            <p className="text-xs text-neutral-400 mt-1">
                              {location}
                            </p>
                          )}
                          {blurb && (
                            <p className="text-sm text-neutral-600 mt-1.5 line-clamp-2 leading-relaxed">
                              {blurb}
                            </p>
                          )}
                        </div>

                        <div className="hidden sm:flex items-center gap-8 shrink-0">
                          <div className="flex flex-col items-center">
                            <span className="text-2xl md:text-3xl font-bold tabular-nums text-neutral-900 tracking-tight">
                              {epk !== null
                                ? `\u20AC${epk.toFixed(2)}`
                                : "\u2014"}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider text-neutral-400 mt-0.5">
                              per km
                            </span>
                            <div className="flex items-center gap-2 mt-1.5">
                              {asText(f["Distance (km)"]) && (
                                <span className="text-xs tabular-nums text-neutral-400">
                                  {asText(f["Distance (km)"])} km
                                </span>
                              )}
                              {fee !== null && asText(f["Distance (km)"]) && (
                                <span className="text-neutral-300">·</span>
                              )}
                              {fee !== null && (
                                <span className="text-xs tabular-nums text-neutral-400">
                                  {fee.toLocaleString("en", {
                                    maximumFractionDigits: 0,
                                  })}{" "}
                                  {f.Currency ?? ""}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-center">
                            <div className="bg-neutral-900 text-white rounded-md px-4 py-2 text-center min-w-[110px]">
                              <span className="text-sm font-semibold tracking-tight">
                                {startDate || "No 2026 Date"}
                              </span>
                            </div>
                            <span className="text-[10px] uppercase tracking-wider text-neutral-400 mt-1.5">
                              Verified Date
                            </span>
                          </div>
                        </div>

                        <div className="flex sm:hidden items-start gap-3">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold tabular-nums text-neutral-900 tracking-tight">
                              {epk !== null
                                ? `\u20AC${epk.toFixed(2)}`
                                : "\u2014"}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider text-neutral-400">
                              per km
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {asText(f["Distance (km)"]) && (
                              <span className="text-xs tabular-nums text-neutral-400">
                                {asText(f["Distance (km)"])} km
                              </span>
                            )}
                            {fee !== null && (
                              <span className="text-xs tabular-nums text-neutral-400">
                                · {fee.toLocaleString("en", {
                                  maximumFractionDigits: 0,
                                })}{" "}
                                {f.Currency ?? ""}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Wrapper>
                );
              })}
            </div>

            <p className="mt-8 text-xs text-neutral-400 text-center">
              Showing {records.length} results · sorted by &euro;/km
            </p>
          </>
        )}
      </div>
    </main>
  );
}

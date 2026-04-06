import { airtableFetchAll } from "@/lib/airtable";
import { AIRTABLE } from "@/lib/airtableConfig";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import Script from "next/script";
import FilterBar from "./FilterBar";
import RaceList from "./RaceList";

// Cache the page for 1 hour. Increase to e.g. 86400 (24h) when data updates are very infrequent.
export const revalidate = 3600;

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
  LKP_country?: string | string[];
  LKP_region?: string | string[];
  Distance?: string | string[];
  "Distance (km)"?: string | string[];
  Currency?: string;
  "AUTO Fee used"?: number;
  "AUTO €/km"?: number;
  "AUTO Price Bands"?: string;
  "Last Checked"?: string;
  LKP_featured_image?: AirtableAttachment[];
  temporary_image?: AirtableAttachment[];
  "Featured Blurb"?: string | string[];
  FINAL_blurb?: string | string[];
  "Race Slug"?: string[];
  "Distance Start Date"?: string;
};

function asText(v: unknown): string {
  if (Array.isArray(v)) return v.filter(Boolean).join(", ");
  if (v === null || v === undefined) return "";
  return String(v);
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

export default async function CostPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string; month?: string }>;
}) {
  const { country: selectedCountry = "", month: selectedMonth = "" } =
    await searchParams;

  let records: Awaited<ReturnType<typeof airtableFetchAll<EntryFeeFields>>> = [];
  let error: string | null = null;

  try {
    records = await airtableFetchAll<EntryFeeFields>(AIRTABLE.TABLES.ENTRY_FEES, {
      view: AIRTABLE.VIEWS.ENTRY_FEES_PUBLIC,
      filterByFormula: "NOT({series_stage}=TRUE())",
      "sort[0][field]": "AUTO €/km",
      "sort[0][direction]": "asc",
    }, revalidate as number);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load data";
  }

  const allCountries = Array.from(
    new Set(
      records
        .map((r) => asText(r.fields["LKP_country"]))
        .filter(Boolean),
    ),
  ).sort();

  const allMonths = Array.from(
    new Set(
      records
        .map((r) => {
          const d = r.fields["Distance Start Date"];
          if (!d) return "";
          const date = new Date(d + "T00:00:00Z");
          if (isNaN(date.getTime())) return "";
          return date.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
        })
        .filter(Boolean),
    ),
  ).sort((a, b) => new Date("1 " + a).getTime() - new Date("1 " + b).getTime());

  const filteredRecords = records.filter((r) => {
    const f = r.fields;
    if (selectedCountry && asText(f["LKP_country"]) !== selectedCountry) return false;
    if (selectedMonth) {
      const d = f["Distance Start Date"];
      if (!d) return false;
      const date = new Date(d + "T00:00:00Z");
      const label = date.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
      if (label !== selectedMonth) return false;
    }
    return true;
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <Script
        id="crisp-chat"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.$crisp = [];
            window.CRISP_WEBSITE_ID = "7cf61847-4944-4b7a-9143-e9816411733e";
            (function() {
              var d = document;
              var s = d.createElement("script");
              s.src = "https://client.crisp.chat/l.js";
              s.async = 1;
              d.getElementsByTagName("head")[0].appendChild(s);
            })();
            $crisp.push(["on", "session:loaded", function() {
              setTimeout(function() {
                $crisp.push(["do", "message:show", ["text", "The site is in beta! Any feedback? Features or races you'd like to see?"]]);
                $crisp.push(["do", "message:show", ["text", "Things that we can fix or add that are broken? I'd love to hear it! Thanks, Danny"]]);
              }, 1000);
            }]);
          `,
        }}
      />
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
              <Link href="/" aria-label="Go to homepage">
                <Image
                  src="/images/logo_white.png"
                  alt="DiscoverTrailRaces.com"
                  width={360}
                  height={72}
                  className="h-20 sm:h-28 md:h-36 lg:h-[168px] w-auto opacity-100 hover:opacity-80 transition-opacity duration-200"
                  priority
                />
              </Link>
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
                  <Link
                    href="/how-this-works"
                    className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-white/15"
                  >
                    How this works
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTENT */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          {/* ...keep the rest of your page content here... */}
        </div>

        <div id="cost-index" className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-400">
            Cost Transparency
            <span className="ml-2 normal-case font-bold text-neutral-600 tracking-normal">
              Displaying the top 10 most affordable trail races in Europe below.
            </span>
          </p>
          <Suspense fallback={null}>
            <FilterBar
              countries={allCountries}
              months={allMonths}
              selectedCountry={selectedCountry}
              selectedMonth={selectedMonth}
            />
          </Suspense>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
            <p className="text-sm font-medium text-rose-700">{error}</p>
            <p className="mt-1 text-xs text-rose-500">
              Check that AIRTABLE_TOKEN and AIRTABLE_BASE_ID are configured
              correctly.
            </p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center">
            <p className="text-sm text-neutral-500">No races found for this filter.</p>
          </div>
        ) : (
          <RaceList
            records={
              selectedCountry || selectedMonth
                ? filteredRecords
                : filteredRecords.slice(0, 10)
            }
            totalCount={records.length}
            isFiltered={!!(selectedCountry || selectedMonth)}
          />
        )}
      </div>
    </main>
  );
}

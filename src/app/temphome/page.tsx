import { airtableFetch } from "@/lib/airtable";
import { AIRTABLE } from "@/lib/airtableConfig";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Mountain, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Discover Trail Races — Home",
  description:
    "Plan your strongest trail season yet. Transparent cost per kilometre, verified logistics, real runner insight.",
};

type AirtableAttachment = {
  id: string;
  url: string;
  filename: string;
  width?: number;
  height?: number;
  thumbnails?: Record<string, { url: string; width: number; height: number }>;
};

type FeaturedRaceEventFields = {
  "Race Name"?: string;
  Slug?: string;
  Country?: string;
  Region?: string;
  "Featured Image"?: AirtableAttachment[];
  "Type Terrain"?: string;
  Featured?: boolean;
  "Featured Order"?: number;
  "Hero Tag"?: string[];
  "Featured Blurb"?: string;
};

function asText(v: unknown): string {
  if (Array.isArray(v)) return v.filter(Boolean).join(", ");
  if (v === null || v === undefined) return "";
  return String(v);
}

type RaceRecord = { fields: FeaturedRaceEventFields };

function RaceCard({ r, index }: { r: RaceRecord; index: number }) {
  const f = r.fields;
  const slug = f.Slug;
  const name = asText(f["Race Name"]);
  const country = asText(f.Country);
  const region = asText(f.Region);
  const terrain = asText(f["Type Terrain"]);
  const imgUrl = f["Featured Image"]?.[0]?.url ?? null;

  const card = (
    <div className="group relative overflow-hidden rounded-2xl bg-neutral-900 aspect-[4/3] cursor-pointer">
      {imgUrl ? (
        <Image
          src={imgUrl}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-90"
          priority={index < 3}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-700 to-neutral-900" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      {terrain && (
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-semibold text-white/90 uppercase tracking-wide border border-white/20">
            <Mountain className="w-2.5 h-2.5" />
            {terrain}
          </span>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-base font-bold text-white leading-tight line-clamp-2">
          {name}
        </h3>
        <div className="mt-1.5 flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-white/60 shrink-0" />
          <span className="text-xs text-white/70">
            {[country, region].filter(Boolean).join(", ")}
          </span>
        </div>
      </div>
    </div>
  );

  return slug ? (
    <Link href={`/events/${slug}`}>{card}</Link>
  ) : (
    <div>{card}</div>
  );
}

function RaceGrid({ races }: { races: RaceRecord[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {races.map((r, i) => (
        <RaceCard key={i} r={r} index={i} />
      ))}
    </div>
  );
}

async function fetchView(
  view: string,
  pageSize: number,
): Promise<RaceRecord[]> {
  try {
    return await airtableFetch<FeaturedRaceEventFields>(
      AIRTABLE.TABLES.RACE_EVENTS,
      {
        view,
        pageSize,
      },
    );
  } catch {
    return [];
  }
}

export default async function TempHomePage() {
  const [featuredRaces, remoteRaces] = await Promise.all([
    fetchView(AIRTABLE.VIEWS.HOMEPAGE_FEATURED, 9),
    fetchView(AIRTABLE.VIEWS.HOMEPAGE_REMOTE_FEATURED, 3),
  ]);

  const articles = [
    {
      tag: "Training & Planning",
      title: "3 ways to collect 10 Running Stones in 2026",
    },
    {
      tag: "Inspiration & Planning",
      title:
        "Run like Kilian: A guide to fastpacking Kilian´s 2026 race schedule",
    },
    {
      tag: "Travel & Racing",
      title: "7 races you can visit by train in Europe",
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* ── HERO ───────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ minHeight: "62vh" }}
      >
        <Image
          src="/images/hero.jpg"
          alt="Trail runner in the mountains"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Nav */}
        <div className="relative z-10 flex items-center justify-between px-6 sm:px-10 lg:px-16 pt-6">
          <Link href="/cost">
            <Image
              src="/images/logo_white.png"
              alt="DiscoverTrailRaces"
              width={168}
              height={72}
              className="h-10 sm:h-12 w-auto"
              priority
            />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-white/80">
            <Link href="/cost" className="hover:text-white transition-colors">
              Cost Index
            </Link>
            <Link
              href="/how-this-works"
              className="hover:text-white transition-colors"
            >
              How This Works
            </Link>
          </nav>
        </div>

        {/* Hero text */}
        <div
          className="relative z-10 flex flex-col justify-end h-full px-6 sm:px-10 lg:px-16 pb-14 sm:pb-20"
          style={{ minHeight: "inherit" }}
        >
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.05] tracking-tight">
              Plan your strongest
              <br className="hidden sm:block" /> trail season yet.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-white/75 font-medium">
              Transparent cost per kilometre&nbsp;&middot;&nbsp;Verified
              logistics&nbsp;&middot;&nbsp;Real runner insight
            </p>
            <p className="mt-1.5 text-sm sm:text-base text-white/60">
              Everything you need to choose the right race and prepare with
              confidence.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/cost"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-neutral-900 hover:bg-white/90 transition-colors"
              >
                Explore Cost Index <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/how-this-works"
                className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
              >
                How this works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED RACES ─────────────────────────────────────── */}
      <section className="px-6 sm:px-10 lg:px-16 py-14 sm:py-20 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-8 mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight sm:shrink-0">
            Featured Races
          </h2>
          <div className="flex items-start gap-6">
            <p className="text-base text-neutral-500 leading-snug sm:text-right max-w-xl sm:max-w-sm">
              Selected trail races in Europe with an emphasis on good cost value, shorter drives from airports, and strong race culture.
            </p>
            <Link
              href="/cost"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors shrink-0"
            >
              View all races <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Main featured grid — 9 cards (homepage_featured) */}
        {featuredRaces.length > 0 ? (
          <RaceGrid races={featuredRaces} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-neutral-100 aspect-[4/3] animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Remote featured — 3 cards below (homepage_remote_featured) */}
        {remoteRaces.length > 0 && (
          <div className="mt-12 pt-10 border-t border-neutral-200">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-8 mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight sm:shrink-0">
                Remote Destinations
              </h2>
              <p className="text-base text-neutral-500 leading-snug sm:text-right max-w-xl sm:max-w-sm">
                Epic trail races, 3 hours or more from major airports.
              </p>
            </div>
            <RaceGrid races={remoteRaces} />
          </div>
        )}

        <div className="mt-6 sm:hidden">
          <Link
            href="/cost"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-900"
          >
            View all races <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── EDITORIAL SECTIONS ─────────────────────────────────── */}
      <section className="px-6 sm:px-10 lg:px-16 pb-16 sm:pb-24 bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cost Index card — dark editorial */}
          <div className="relative overflow-hidden rounded-2xl bg-neutral-900 p-8 sm:p-10 flex flex-col justify-between min-h-[320px]">
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-950" />
            <div className="relative z-10">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400 mb-3">
                Cost Transparency
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                Explore the
                <br />
                Cost Index
              </h3>
              <p className="mt-4 text-sm text-neutral-400 leading-relaxed max-w-sm">
                Compare hundreds of races by real price per kilometre. Filter by
                country, month, and price band to find the right race for your
                budget and season.
              </p>
            </div>
            <div className="relative z-10 mt-8">
              <div className="flex gap-1 mb-6">
                {["Very affordable", "Affordable", "Mid-range", "Premium"].map(
                  (label, i) => (
                    <div key={i} className="flex-1">
                      <div
                        className="rounded h-1.5 mb-1"
                        style={{
                          backgroundColor: [
                            "#34d399",
                            "#a3e635",
                            "#fbbf24",
                            "#f87171",
                          ][i],
                          opacity: 0.8,
                        }}
                      />
                      <span className="text-[9px] text-neutral-500 whitespace-nowrap">
                        {label}
                      </span>
                    </div>
                  ),
                )}
              </div>
              <Link
                href="/cost"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-neutral-900 hover:bg-neutral-100 transition-colors"
              >
                Open Cost Index <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Runner Voice card — light editorial */}
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8 sm:p-10 flex flex-col justify-between min-h-[320px]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400 mb-3">
                Runner Voice
              </p>
              <blockquote className="text-xl sm:text-2xl font-semibold text-neutral-900 leading-snug">
                &ldquo;Long climbs but incredibly runnable — bring poles for the
                descents. The scenery is flawless and the organisation is on
                another level.&rdquo;
              </blockquote>
            </div>
            <div className="mt-8 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-neutral-900">Clara M.</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Ran UTMB 2024&nbsp;&middot;&nbsp;ITRA
                  690&nbsp;&middot;&nbsp;23h 12m
                </p>
              </div>
              <span className="text-xs font-semibold text-neutral-400 italic">
                Placeholder — real voices coming soon
              </span>
            </div>
          </div>
        </div>

        {/* Articles placeholder */}
        <div className="mt-6">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400 mb-1">
                Editorial
              </p>
              <h3 className="text-2xl font-bold text-neutral-900">
                Latest Articles
              </h3>
            </div>
            <span className="hidden sm:inline text-xs text-neutral-400 italic">
              Placeholder — articles coming soon
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {articles.map((a, i) => (
              <div
                key={i}
                className="group rounded-2xl border border-neutral-200 bg-white overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="aspect-[16/9] bg-gradient-to-br from-neutral-100 to-neutral-200 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Mountain className="w-8 h-8 text-neutral-300" />
                  </div>
                </div>
                <div className="p-5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                    {a.tag}
                  </span>
                  <h4 className="mt-2 text-sm font-bold text-neutral-900 leading-snug group-hover:text-neutral-600 transition-colors">
                    {a.title}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="border-t border-neutral-100 px-6 sm:px-10 lg:px-16 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/cost">
            <Image
              src="/images/logo_white.png"
              alt="DiscoverTrailRaces"
              width={120}
              height={52}
              className="h-7 w-auto invert"
            />
          </Link>
          <p className="text-xs text-neutral-400">
            © {new Date().getFullYear()} DiscoverTrailRaces &middot;{" "}
            <Link
              href="/how-this-works"
              className="hover:text-neutral-700 underline underline-offset-2"
            >
              How This Works
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
}

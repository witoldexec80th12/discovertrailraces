import { airtableFetch } from "@/lib/airtable";
import { AIRTABLE } from "@/lib/airtableConfig";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Mountain, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Discover Trail Races — Home",
  description:
    "Find better trail races, understand what they're really like, and compare real cost per kilometer.",
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
  "Featured Price/KM"?: number | string;
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
  const priceKm =
    f["Featured Price/KM"] != null ? f["Featured Price/KM"] : null;

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
      {priceKm != null && (
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-neutral-900">
            {String(priceKm)}
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

export default async function HomePage() {
  const [featuredRaces, remoteRaces, brutalRaces] = await Promise.all([
    fetchView(AIRTABLE.VIEWS.HOMEPAGE_FEATURED, 9),
    fetchView(AIRTABLE.VIEWS.HOMEPAGE_REMOTE_FEATURED, 3),
    fetchView(AIRTABLE.VIEWS.HOMEPAGE_BRUTAL_FEATURED, 3),
  ]);

  return (
    <main className="min-h-screen bg-white">
      {/* ── STICKY HEADER ──────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center">
            <img
              src="/images/logo_white.svg"
              alt="DiscoverTrailRaces"
              className="h-8 w-auto"
            />
          </Link>
          <nav className="flex items-center gap-6 text-sm font-semibold text-neutral-600">
            <Link
              href="/cost"
              className="hover:text-neutral-900 transition-colors"
            >
              Cost Index
            </Link>
            <Link
              href="/about"
              className="hover:text-neutral-900 transition-colors"
            >
              About
            </Link>
          </nav>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ minHeight: "62vh" }}
      >
        <video
          src="/videos/dollyvideo.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

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
            <p className="mt-4 text-base sm:text-lg text-white/75 font-medium max-w-md">
              Find better ultra trail races, understand what they&rsquo;re
              really like, and compare real cost per kilometer.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/cost"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-neutral-900 hover:bg-white/90 transition-colors"
              >
                Explore Cost Index <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
              >
                About
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED RACES ─────────────────────────────────────── */}
      <section className="px-6 sm:px-10 lg:px-16 py-14 sm:py-20 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-10 mb-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-neutral-900 shrink-0">
            FEATURED
          </h2>
          <p className="text-base sm:text-lg font-semibold text-neutral-700 leading-snug max-w-[480px]">
            Selected ultras in Europe with an emphasis on good value, culture,
            and shorter drives from airports.
          </p>
        </div>

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

        <div className="mt-6 sm:hidden">
          <Link
            href="/cost"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-900"
          >
            View all races <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── COST INDEX BANNER ───────────────────────────────────── */}
      <section
        className="px-6 sm:px-10 lg:px-16 py-8 sm:py-10 text-center"
        style={{ backgroundColor: "rgb(56, 67, 82)" }}
      >
        <p className="text-white text-base sm:text-lg font-medium leading-snug">
          Compare 240+ ultra races across Europe by price, terrain, and real
          runner insight. Click on the{" "}
          <Link
            href="/cost"
            className="inline-flex items-center rounded-full px-3 py-0.5 font-bold text-white"
            style={{ backgroundColor: "#e63946", fontSize: "inherit" }}
          >
            Cost Index
          </Link>
        </p>
      </section>

      {/* ── BRUTAL SECTION ──────────────────────────────────────── */}
      {brutalRaces.length > 0 && (
        <section className="px-6 sm:px-10 lg:px-16 py-12 sm:py-16 border-t border-neutral-200 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-10 mb-8">
            <h2 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-neutral-900 shrink-0">
              Brutal
            </h2>
            <p className="text-base sm:text-lg font-semibold text-neutral-700 leading-snug max-w-[320px]">
              The hardest climbs and toughest ultras you can find.
            </p>
          </div>
          <RaceGrid races={brutalRaces} />
        </section>
      )}

      {/* ── REMOTE DESTINATIONS ─────────────────────────────────── */}
      {remoteRaces.length > 0 && (
        <section className="px-6 sm:px-10 lg:px-16 py-12 sm:py-16 border-t border-neutral-200 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-10 mb-8">
            <h2 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-neutral-900 shrink-0">
              Remote Destinations
            </h2>
            <p className="text-base sm:text-lg font-semibold text-neutral-700 leading-snug max-w-[320px]">
              Trail races off the beaten path, 3 hours or more from major
              airports.
            </p>
          </div>
          <RaceGrid races={remoteRaces} />
        </section>
      )}

      {/* ── EDITORIAL SECTIONS ─────────────────────────────────── */}
      <section className="px-6 sm:px-10 lg:px-16 pb-16 sm:pb-24 bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cost Index card */}
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

          {/* Runner Voice card */}
          <a
            href="https://discovertrailraces.com/races/bulgaria_vitosha_100_100k"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8 sm:p-10 flex flex-col justify-between min-h-[320px] hover:shadow-md transition-shadow"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400 mb-3">
                Runner Voice
              </p>
              <blockquote className="text-xl sm:text-2xl font-semibold text-neutral-900 leading-snug">
                &ldquo;Make sure to bring a wind-protection layer and if you are
                not planning to push hard in the first half — possibly some
                additional thermal layer, as it can get really cold at kilometer
                30 near the Studena Dam.&rdquo;
              </blockquote>
            </div>
            <div className="mt-8 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-neutral-900">Lambrin</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Vitosha Super Mountain Trail 100K,
                  2025&nbsp;&middot;&nbsp;ITRA 491
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400" />
            </div>
          </a>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="border-t border-neutral-100 px-6 sm:px-10 lg:px-16 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/">
            <Image
              src="/images/logo_white.svg"
              alt="DiscoverTrailRaces"
              width={120}
              height={52}
              className="h-7 w-auto"
            />
          </Link>
          <p className="text-xs text-neutral-400">
            © {new Date().getFullYear()} DiscoverTrailRaces &middot;{" "}
            <Link
              href="/about"
              className="hover:text-neutral-700 underline underline-offset-2"
            >
              About
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
}

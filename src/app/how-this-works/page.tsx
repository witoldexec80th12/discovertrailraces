import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "How This Works | Discover Trail Races",
  description:
    "Learn how we calculate the Cost Per KM metric for European ultra trail races.",
};

export default function HowThisWorksPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-neutral-900" style={{ minHeight: "38vh" }}>
        <Image
          src="/images/hero.jpg"
          alt="Trail running hero"
          fill
          className="object-cover opacity-50"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />

        {/* Logo bar */}
        <div className="relative z-10 flex items-center px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6">
          <Link href="/cost">
            <Image
              src="/images/logo_white.png"
              alt="DiscoverTrailRaces"
              width={168}
              height={72}
              className="h-12 sm:h-16 md:h-20 w-auto"
              priority
            />
          </Link>
        </div>

        {/* Hero text */}
        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
            Trail racing for everyone.
          </h1>
        </div>
      </section>

      {/* Body */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <p className="text-base sm:text-lg leading-relaxed text-neutral-700">
          Examining hundreds of ultra trail races in Europe greater than the
          marathon distance, we index them taking into account total price for
          each entry and total km in each race, to create a{" "}
          <span className="font-semibold text-neutral-900">"cost-per-km"</span>{" "}
          metric, current for each year. This can help runners choose races in
          different months, regions, and for different price points, helping
          them create their best trail season yet.
        </p>

        <p className="mt-6 text-base sm:text-lg leading-relaxed text-neutral-700">
          As time goes on, our metrics will get better, helping to include
          early bird prices, different price tiers, and other valuable
          insights.
        </p>

        {/* Back link */}
        <div className="mt-12 pt-8 border-t border-neutral-200">
          <Link
            href="/cost"
            className="inline-flex items-center text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            ← Back to Cost Index
          </Link>
        </div>
      </div>
    </main>
  );
}

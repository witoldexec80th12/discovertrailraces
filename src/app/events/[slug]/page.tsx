import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Race — DiscoverTrailRaces",
  description: "Race event page — coming soon.",
};

export default async function EventPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400 mb-4">
          Coming Soon
        </p>
        <h1 className="text-3xl font-bold text-neutral-900 mb-4">
          Race Event Page
        </h1>
        <p className="text-sm text-neutral-500 mb-8">
          Individual race event pages are under construction. Check back soon for
          full race details, distances, logistics, and runner voices.
        </p>
        <Link
          href="/temphome"
          className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>
    </main>
  );
}

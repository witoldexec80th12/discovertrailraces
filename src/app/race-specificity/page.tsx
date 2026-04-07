import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Race Specificity — DiscoverTrailRaces",
  description:
    "Filter trail races by elevation gain per km and terrain type to match your training specificity.",
};

const RaceSpecificityClient = dynamic(() => import("./RaceSpecificityClient"), {
  ssr: false,
});

export default function RaceSpecificityPage() {
  return (
    <main className="min-h-screen bg-white">
      <RaceSpecificityClient />
    </main>
  );
}

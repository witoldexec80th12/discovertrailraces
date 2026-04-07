import { Metadata } from "next";
import RaceSpecificityWrapper from "./RaceSpecificityWrapper";

export const metadata: Metadata = {
  title: "Race Specificity — DiscoverTrailRaces",
  description:
    "Filter trail races by elevation gain per km and terrain type to match your training specificity.",
};

export default function RaceSpecificityPage() {
  return (
    <main className="min-h-screen bg-white">
      <RaceSpecificityWrapper />
    </main>
  );
}

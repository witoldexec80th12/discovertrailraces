"use client";

import dynamic from "next/dynamic";

const RaceSpecificityClient = dynamic(() => import("./RaceSpecificityClient"), {
  ssr: false,
});

export default function RaceSpecificityWrapper() {
  return <RaceSpecificityClient />;
}

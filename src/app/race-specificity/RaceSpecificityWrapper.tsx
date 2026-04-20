"use client";

import dynamic from "next/dynamic";

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="hidden sm:block h-14 border-b border-neutral-100 bg-white" />
      <div className="px-6 sm:px-10 lg:px-16 pt-10 pb-10 animate-pulse">
        <div className="h-3 w-28 rounded bg-neutral-200 mb-4" />
        <div className="h-10 w-2/3 rounded bg-neutral-200 mb-3" />
        <div className="h-4 w-1/2 rounded bg-neutral-100" />
      </div>
      <div className="border-t border-neutral-200 flex flex-col sm:flex-row sm:h-[760px] animate-pulse">
        <div className="shrink-0 sm:w-[320px] p-6 sm:p-10 border-b sm:border-b-0 sm:border-r border-neutral-200 flex flex-col gap-4">
          <div className="h-6 w-24 rounded-full bg-neutral-200" />
          <div className="rounded-xl bg-neutral-200 h-24" />
          <div className="h-4 w-full rounded bg-neutral-100" />
          <div className="h-4 w-3/4 rounded bg-neutral-100" />
          <div className="h-10 rounded-xl bg-neutral-200 mt-auto" />
        </div>
        <div className="flex-1 bg-neutral-100" />
      </div>
      <div className="px-6 sm:px-10 lg:px-16 py-12 animate-pulse">
        <div className="h-8 w-40 rounded bg-neutral-200 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-xl border border-neutral-200 bg-neutral-50 overflow-hidden">
              <div className="h-40 bg-neutral-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-neutral-200 rounded w-3/4" />
                <div className="h-3 bg-neutral-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const RaceSpecificityClient = dynamic(() => import("./RaceSpecificityClient"), {
  ssr: false,
  loading: () => <LoadingSkeleton />,
});

export default function RaceSpecificityWrapper() {
  return <RaceSpecificityClient />;
}

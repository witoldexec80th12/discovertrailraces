"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser, useClerk } from "@clerk/nextjs";
import { useFavourites } from "@/lib/favouritesContext";

export default function FavouritesTray() {
  const { favourites } = useFavourites();
  const { isSignedIn, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);

  if (favourites.length === 0) return null;

  const thumbsToShow = favourites.slice(0, 4);

  const handleSaveCalendar = async () => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      openSignIn();
      return;
    }

    setSaving(true);
    setSaved(false);
    setSaveError(false);

    try {
      const res = await fetch("/api/save-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entry_fee_ids: favourites.map((f) => f.entryFeeId),
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setSaveError(true);
        setTimeout(() => setSaveError(false), 3000);
      }
    } catch {
      setSaveError(true);
      setTimeout(() => setSaveError(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 shadow-[0_-4px_24px_rgba(0,0,0,0.10)]"
      style={{ transition: "transform 0.25s ease" }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-5">
        {/* Left: heart + count */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-red-500 text-lg select-none">♥</span>
          <span className="text-sm font-bold text-neutral-800">
            {favourites.length}{" "}
            <span className="hidden sm:inline font-normal text-neutral-500">
              {favourites.length === 1 ? "race saved" : "races saved"}
            </span>
          </span>
        </div>

        {/* Thumbnails */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
          {thumbsToShow.map((f) => (
            <div
              key={f.entryFeeId}
              className="relative shrink-0 w-9 h-9 rounded-md overflow-hidden border border-neutral-200 bg-neutral-100"
              title={f.name}
            >
              {f.imageUrl ? (
                <img
                  src={f.imageUrl}
                  alt={f.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-neutral-200" />
              )}
            </div>
          ))}
          {favourites.length > 4 && (
            <span className="text-xs text-neutral-400 font-medium shrink-0 ml-1">
              +{favourites.length - 4}
            </span>
          )}
          {/* Race names — desktop only */}
          <div className="hidden lg:flex flex-col justify-center ml-2 min-w-0">
            <p className="text-xs text-neutral-500 truncate max-w-[280px]">
              {favourites
                .slice(0, 3)
                .map((f) => f.name)
                .join(" · ")}
              {favourites.length > 3 ? " …" : ""}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/favourites"
            className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 text-white px-4 py-2 text-sm font-semibold hover:bg-neutral-700 transition-colors"
          >
            Compare
          </Link>
          <button
            onClick={handleSaveCalendar}
            disabled={saving}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors
              ${saved
                ? "border-green-500 text-green-600 bg-green-50"
                : saveError
                ? "border-red-300 text-red-500 bg-red-50"
                : "border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50 hover:border-neutral-400"
              }
              ${saving ? "opacity-60 cursor-not-allowed" : ""}
            `}
          >
            {saving
              ? "Saving…"
              : saved
              ? "✓ Saved"
              : saveError
              ? "Error — retry"
              : isSignedIn
              ? "Save Calendar"
              : "Save Calendar"}
          </button>
        </div>
      </div>
    </div>
  );
}

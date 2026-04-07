"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useUser, useClerk } from "@clerk/nextjs";
import { useFavourites, type FavouriteEntry } from "@/lib/favouritesContext";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00Z");
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function SwipeableItem({
  entry,
  onRemove,
}: {
  entry: FavouriteEntry;
  onRemove: () => void;
}) {
  const [translateX, setTranslateX] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const startXRef = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setTransitioning(false);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (startXRef.current === null) return;
    const delta = e.touches[0].clientX - startXRef.current;
    if (delta < 0) setTranslateX(Math.max(delta, -120));
  };

  const onTouchEnd = () => {
    setTransitioning(true);
    if (translateX < -72) {
      setTranslateX(-400);
      setTimeout(onRemove, 200);
    } else {
      setTranslateX(0);
    }
    startXRef.current = null;
  };

  return (
    <div className="relative overflow-hidden">
      <div
        className="absolute inset-y-0 right-0 flex items-center px-4 bg-red-500"
        style={{ opacity: translateX < -20 ? Math.min(1, Math.abs(translateX) / 80) : 0 }}
      >
        <span className="text-white text-sm font-bold">Remove</span>
      </div>
      <div
        style={{
          transform: `translateX(${translateX}px)`,
          transition: transitioning ? "transform 0.2s ease" : "none",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="relative bg-white flex items-center gap-3 px-4 py-3 border-b border-neutral-100 select-none"
      >
        <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-neutral-100">
          {entry.imageUrl ? (
            <img src={entry.imageUrl} alt={entry.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-neutral-200" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <Link
            href={`/races/${entry.slug}`}
            className="font-semibold text-sm text-neutral-900 truncate block hover:underline"
          >
            {entry.name}
          </Link>
          <p className="text-xs text-neutral-400 mt-0.5">{formatDate(entry.startDate)}</p>
        </div>
        {entry.eurPerKm != null && (
          <span className="shrink-0 text-sm font-bold tabular-nums text-neutral-700">
            €{entry.eurPerKm.toFixed(2)}
          </span>
        )}
        <button
          onClick={onRemove}
          className="shrink-0 ml-1 w-6 h-6 rounded-full bg-neutral-100 hover:bg-red-50 hover:text-red-500 text-neutral-400 text-xs flex items-center justify-center transition-colors"
          aria-label="Remove"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

const PENDING_SAVE_KEY = "dtr:pendingCalendarSave";

async function doSaveCalendar(entryFeeIds: string[]) {
  const res = await fetch("/api/save-calendar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entry_fee_ids: entryFeeIds }),
  });
  return res.ok;
}

function SaveCalendarButton() {
  const { isSignedIn, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const { favourites } = useFavourites();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const autoSaveAttempted = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || autoSaveAttempted.current) return;
    const pending = typeof window !== "undefined" && localStorage.getItem(PENDING_SAVE_KEY);
    if (!pending) return;
    autoSaveAttempted.current = true;
    localStorage.removeItem(PENDING_SAVE_KEY);
    setSaving(true);
    doSaveCalendar(favourites.map((f) => f.entryFeeId))
      .then((ok) => {
        if (ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
        else { setSaveError(true); setTimeout(() => setSaveError(false), 3000); }
      })
      .catch(() => { setSaveError(true); setTimeout(() => setSaveError(false), 3000); })
      .finally(() => setSaving(false));
  }, [isLoaded, isSignedIn, favourites]);

  const handleSave = useCallback(async () => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      if (typeof window !== "undefined") localStorage.setItem(PENDING_SAVE_KEY, "1");
      openSignIn();
      return;
    }
    setSaving(true);
    setSaved(false);
    setSaveError(false);
    try {
      const ok = await doSaveCalendar(favourites.map((f) => f.entryFeeId));
      if (ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
      else { setSaveError(true); setTimeout(() => setSaveError(false), 3000); }
    } catch {
      setSaveError(true);
      setTimeout(() => setSaveError(false), 3000);
    } finally {
      setSaving(false);
    }
  }, [isLoaded, isSignedIn, openSignIn, favourites]);

  return (
    <button
      onClick={handleSave}
      disabled={saving}
      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap
        ${saved
          ? "border-green-500 text-green-600 bg-green-50"
          : saveError
          ? "border-red-300 text-red-500 bg-red-50"
          : "border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50 hover:border-neutral-400"
        }
        ${saving ? "opacity-60 cursor-not-allowed" : ""}
      `}
    >
      {saving ? "Saving…" : saved ? "✓ Saved" : saveError ? "Error" : "Save Calendar"}
    </button>
  );
}

export default function FavouritesTray() {
  const { favourites, removeFavourite } = useFavourites();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  if (favourites.length === 0) return null;

  const thumbsToShow = favourites.slice(0, 4);
  const count = favourites.length;

  return (
    <>
      {/* Mobile bottom sheet backdrop */}
      {isSheetOpen && (
        <div
          className="sm:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setIsSheetOpen(false)}
        />
      )}

      {/* Mobile bottom sheet */}
      <div
        className={`sm:hidden fixed left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out ${
          isSheetOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ bottom: 64, maxHeight: "70vh" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <span className="text-base font-bold text-neutral-900">
            {count} {count === 1 ? "race" : "races"} saved
          </span>
          <button
            onClick={() => setIsSheetOpen(false)}
            className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center text-sm hover:bg-neutral-200 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: "calc(70vh - 120px)" }}>
          {favourites.map((f) => (
            <SwipeableItem
              key={f.entryFeeId}
              entry={f}
              onRemove={() => removeFavourite(f.entryFeeId)}
            />
          ))}
        </div>
        <div className="flex items-center gap-3 px-5 py-4 border-t border-neutral-100">
          <Link
            href="/favourites"
            onClick={() => setIsSheetOpen(false)}
            className="flex-1 text-center rounded-full bg-neutral-900 text-white py-2.5 text-sm font-semibold hover:bg-neutral-700 transition-colors"
          >
            Compare races
          </Link>
          <SaveCalendarButton />
        </div>
      </div>

      {/* Desktop expand panel */}
      {isExpanded && (
        <div
          className="hidden sm:block fixed left-0 right-0 z-40 bg-white border-t border-neutral-200 shadow-[0_-4px_24px_rgba(0,0,0,0.10)]"
          style={{ bottom: 64 }}
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 max-h-[240px] overflow-y-auto">
              {favourites.map((f) => (
                <Link
                  key={f.entryFeeId}
                  href={`/races/${f.slug}`}
                  className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50 hover:bg-neutral-100 p-3 transition-colors"
                >
                  <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-neutral-200">
                    {f.imageUrl ? (
                      <img src={f.imageUrl} alt={f.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-neutral-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 truncate leading-snug">
                      {f.name}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">{formatDate(f.startDate)}</p>
                  </div>
                  {f.eurPerKm != null && (
                    <span className="shrink-0 text-sm font-bold tabular-nums text-neutral-600">
                      €{f.eurPerKm.toFixed(2)}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main bar — always visible */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 shadow-[0_-4px_24px_rgba(0,0,0,0.10)]"
        style={{ height: 64 }}
      >
        <div className="mx-auto max-w-6xl h-full px-4 sm:px-6 flex items-center gap-3 sm:gap-5">
          {/* Left: heart + count — mobile: tap to open sheet; desktop: just count */}
          <button
            className="sm:hidden flex items-center gap-2 shrink-0"
            onClick={() => setIsSheetOpen((v) => !v)}
            aria-label="Open saved races"
          >
            <span className="text-red-500 text-lg select-none">♥</span>
            <span className="text-sm font-bold text-neutral-800">{count}</span>
          </button>

          {/* Desktop: heart + count (not a button, just text) */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <span className="text-red-500 text-lg select-none">♥</span>
            <span className="text-sm font-bold text-neutral-800">
              {count}{" "}
              <span className="font-normal text-neutral-500">
                {count === 1 ? "race saved" : "races saved"}
              </span>
            </span>
          </div>

          {/* Thumbnails — desktop only */}
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            {thumbsToShow.map((f) => (
              <div
                key={f.entryFeeId}
                className="w-9 h-9 rounded-md overflow-hidden border border-neutral-200 bg-neutral-100"
                title={f.name}
              >
                {f.imageUrl ? (
                  <img src={f.imageUrl} alt={f.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-neutral-200" />
                )}
              </div>
            ))}
            {count > 4 && (
              <span className="text-xs text-neutral-400 font-medium ml-0.5">+{count - 4}</span>
            )}
          </div>

          {/* Race names — large desktop only */}
          <div className="hidden lg:flex flex-col justify-center flex-1 min-w-0">
            <p className="text-xs text-neutral-500 truncate">
              {favourites
                .slice(0, 3)
                .map((f) => f.name)
                .join(" · ")}
              {count > 3 ? " …" : ""}
            </p>
          </div>

          <div className="flex-1 sm:flex-none" />

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/favourites"
              className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 text-white px-4 py-2 text-sm font-semibold hover:bg-neutral-700 transition-colors whitespace-nowrap"
            >
              Compare
            </Link>
            <div className="hidden sm:block">
              <SaveCalendarButton />
            </div>
            {/* Desktop expand toggle */}
            <button
              className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full hover:bg-neutral-100 text-neutral-500 transition-colors text-base"
              onClick={() => setIsExpanded((v) => !v)}
              aria-label={isExpanded ? "Collapse saved races" : "Expand saved races"}
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? "▾" : "▴"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

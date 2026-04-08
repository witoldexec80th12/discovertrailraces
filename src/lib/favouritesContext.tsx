"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useUser } from "@clerk/nextjs";
import type { FavouriteEntry } from "./favouritesTypes";

export type { FavouriteEntry } from "./favouritesTypes";

const MAX_FAVOURITES = 10;

type FavouritesContextValue = {
  favourites: FavouriteEntry[];
  addFavourite: (entry: FavouriteEntry) => void;
  removeFavourite: (entryFeeId: string) => void;
  isFavourited: (entryFeeId: string) => boolean;
  clearAll: () => void;
};

const STORAGE_KEY = "dtr_favourites";

function sortByDate(entries: FavouriteEntry[]): FavouriteEntry[] {
  return [...entries].sort((a, b) => {
    if (!a.startDate && !b.startDate) return 0;
    if (!a.startDate) return 1;
    if (!b.startDate) return -1;
    return a.startDate.localeCompare(b.startDate);
  });
}

function mergeEntries(existing: FavouriteEntry[], incoming: FavouriteEntry[]): FavouriteEntry[] {
  const map = new Map(existing.map((e) => [e.entryFeeId, e]));
  for (const entry of incoming) {
    if (!map.has(entry.entryFeeId)) {
      map.set(entry.entryFeeId, entry);
    }
  }
  return sortByDate(Array.from(map.values()));
}

const FavouritesContext = createContext<FavouritesContextValue>({
  favourites: [],
  addFavourite: () => {},
  removeFavourite: () => {},
  isFavourited: () => false,
  clearAll: () => {},
});

function FavouritesSyncManager({
  onMerge,
}: {
  onMerge: (entries: FavouriteEntry[]) => void;
}) {
  const { isSignedIn, isLoaded, user } = useUser();
  const syncedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return;
    if (syncedForRef.current === user.id) return;
    syncedForRef.current = user.id;

    fetch("/api/save-calendar")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.entries && Array.isArray(d.entries)) {
          onMerge(d.entries as FavouriteEntry[]);
        }
      })
      .catch(() => {});
  }, [isLoaded, isSignedIn, user?.id, onMerge]);

  return null;
}

export function FavouritesProvider({ children }: { children: React.ReactNode }) {
  const [favourites, setFavourites] = useState<FavouriteEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as FavouriteEntry[];
        if (Array.isArray(parsed)) {
          setFavourites(sortByDate(parsed));
        }
      }
    } catch {
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favourites));
    } catch {
    }
  }, [favourites, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const stale = favourites.filter((f) => (f as Record<string, unknown>).logistics === undefined);
    if (stale.length === 0) return;
    const ids = stale.map((f) => f.entryFeeId).join(",");
    fetch(`/api/entry-fees?ids=${encodeURIComponent(ids)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setFavourites((prev) =>
          prev.map((f) =>
            (f as Record<string, unknown>).logistics === undefined && data[f.entryFeeId]
              ? { ...f, ...data[f.entryFeeId] }
              : f
          )
        );
      })
      .catch(() => {});
  }, [hydrated, favourites]);

  const addFavourite = useCallback((entry: FavouriteEntry) => {
    setFavourites((prev) => {
      if (prev.some((f) => f.entryFeeId === entry.entryFeeId)) return prev;
      if (prev.length >= MAX_FAVOURITES) return prev;
      return sortByDate([...prev, entry]);
    });
  }, []);

  const removeFavourite = useCallback((entryFeeId: string) => {
    setFavourites((prev) => prev.filter((f) => f.entryFeeId !== entryFeeId));
  }, []);

  const isFavourited = useCallback(
    (entryFeeId: string) => {
      return favourites.some((f) => f.entryFeeId === entryFeeId);
    },
    [favourites]
  );

  const clearAll = useCallback(() => {
    setFavourites([]);
  }, []);

  const handleMerge = useCallback((incoming: FavouriteEntry[]) => {
    setFavourites((prev) => mergeEntries(prev, incoming));
  }, []);

  return (
    <FavouritesContext.Provider
      value={{ favourites, addFavourite, removeFavourite, isFavourited, clearAll }}
    >
      <FavouritesSyncManager onMerge={handleMerge} />
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavourites() {
  return useContext(FavouritesContext);
}

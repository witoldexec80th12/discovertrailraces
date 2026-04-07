"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type FavouriteEntry = {
  entryFeeId: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  eurPerKm: number | null;
  distanceKm: number | null;
  startDate: string | null;
  country: string | null;
};

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

const FavouritesContext = createContext<FavouritesContextValue>({
  favourites: [],
  addFavourite: () => {},
  removeFavourite: () => {},
  isFavourited: () => false,
  clearAll: () => {},
});

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

  const addFavourite = useCallback((entry: FavouriteEntry) => {
    setFavourites((prev) => {
      if (prev.some((f) => f.entryFeeId === entry.entryFeeId)) return prev;
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

  return (
    <FavouritesContext.Provider
      value={{ favourites, addFavourite, removeFavourite, isFavourited, clearAll }}
    >
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavourites() {
  return useContext(FavouritesContext);
}

let favoritesPromise: Promise<string[]> | null = null;
let cachedUserId: string | null = null;

export function getFavorites(userId: string): Promise<string[]> {
  if (cachedUserId !== userId) {
    cachedUserId = userId;
    favoritesPromise = null;
  }
  if (!favoritesPromise) {
    favoritesPromise = fetch("/api/favorites")
      .then((r) => r.json())
      .then((d) => (Array.isArray(d.favorites) ? d.favorites : []))
      .catch(() => []);
  }
  return favoritesPromise;
}

export function invalidateFavoritesCache() {
  favoritesPromise = null;
}

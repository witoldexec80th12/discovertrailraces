export type FavouriteEntry = {
  entryFeeId: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  eurPerKm: number | null;
  distanceKm: number | null;
  startDate: string | null;
  country: string | null;
  terrain: string | null;
  logistics: string | null;
  primaryAirport: string | null;
  elevationM: number | null;
  percentIncrease: number | null;
};

export type EnrichedDistance = {
  id: string;
  raceName: string;
  slug: string;
  terrain: string[];
  country: string;
  imgUrl: string | null;
  distanceName: string;
  distanceKm: number;
  pctIncrease: number;
  startDate: string | null;
  entryFeeId: string;
};

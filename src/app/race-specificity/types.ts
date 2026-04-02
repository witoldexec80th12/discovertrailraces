export type RaceEventRecord = {
  id: string;
  fields: {
    "Race Name"?: string;
    Slug?: string;
    Terrain_multi?: string[];
    "Featured Image"?: Array<{
      url: string;
      thumbnails?: Record<string, { url: string; width: number; height: number }>;
    }>;
  };
};

export type DistanceRecord = {
  id: string;
  fields: {
    "AUTO% Increase"?: number;
    Race?: string[];
    "Is Primary Distance"?: boolean;
    "Distance Name"?: string;
    "Distance (km)"?: number;
  };
};

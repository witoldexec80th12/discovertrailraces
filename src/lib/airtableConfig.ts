export const AIRTABLE = {
  TABLES: {
    ENTRY_FEES: "Entry Fees",
    RACE_EVENTS: "Race Events", // if your table is named differently, change here
  },
  VIEWS: {
    ENTRY_FEES_PUBLIC: "entry_fees_public",
    RACE_EVENTS_PUBLIC: "race_events_public",
    HOMEPAGE_FEATURED: "homepage_featured",

    // optional explore paths
    EXPLORE_VALUE_1_1P5: "explore_value_1_1p5",
    EXPLORE_VALUE_1P5_2: "explore_value_1p5_2",
    EXPLORE_VALUE_2_2P5: "explore_value_2_2p5",
    EXPLORE_VALUE_2P5_3: "explore_value_2p5_3",
    EXPLORE_VALUE_3_UP: "explore_value_3_up",
  },
} as const;

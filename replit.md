# DiscoverTrailRaces — Cost Per KM

## Overview
DiscoverTrailRaces is a Next.js 16 application designed to help users compare the costs of European trail races. Its primary features include a "Cost Per KM" page (`/cost`) displaying a curated feed of races with cost analysis, and individual "Race Pages" (`/races/[slug]`) providing detailed information for each race. The project aims to offer a comprehensive platform for trail running enthusiasts to discover and evaluate races based on value.

## User Preferences
I prefer simple language and clear explanations. I want iterative development with frequent check-ins. Ask before making major architectural changes or introducing new dependencies. Do not make changes to files outside of the `src/` directory, specifically `public/images/hero.jpg`, `public/images/logo_white.png`, `public/images/cost_per_km_white.png`, `public/images/logo.jpg`, and `public/images/cost-per-km.png`.

## System Architecture
The application is built with Next.js 16 (App Router) and React 19, leveraging TypeScript for type safety and Tailwind CSS v4 for styling. Data is primarily sourced from Airtable via its REST API, with server-side fetching and caching strategies (no-store for `/cost`, 1-hour ISR for race pages).

**UI/UX Decisions:**
- **Typography:** Uses Geist Sans and Geist Mono fonts via `next/font`.
- **Color Scheme:** Light-mode designed with a background gradient (neutral-50 to white) and a neutral color palette.
- **Card Design:** Races are presented in `rounded-xl` cards with white backgrounds, neutral-200 borders, and interactive hover effects (shadow + scale).
- **Hero Sections:** Feature full-width layouts with background images (e.g., `hero.jpg`) and dark gradient overlays.

**Core Features & Implementations:**

- **Cost Per KM Page (`/cost`):**
    - Displays a curated feed of race cards.
    - Desktop card layout includes a thumbnail, race name, location, blurb, and three stat columns: "Price per km", "Race Distance" (underlined), and "Verified Date".
    - Mobile card layout features a square thumbnail, condensed blurb, and a full-width stats row.
    - Data from Airtable "Entry Fees" table, "entry_fees_public" view, sorted by "AUTO €/km".
    - Image priority: `LKP_featured_image` → `temporary_image` → placeholder.
    - Blurb from `FINAL_blurb`.
    - Requires fee and €/km > 0 for valid entries.

- **Race Detail Page (`/races/[slug]`):**
    - Fetches race data by slug from Entry Fees table, preferring "Is Primary Distance" row.
    - Also fetches the linked Distances record by ID (`airtableFetchRecord`) for GPX analysis data.
    - Displays secondary stats: "Since [year]" (First_year_event) and "~N starters" (Participants 2026/2025).
    - Route Profile section (shows only when Distances data is filled in): terrain breakdown bar (% uphill/flat/downhill), uphill gradient distribution by steepness band, elevation profile image (elevation_map_climbs), top climbs list, GPX download link.
    - Layout includes a hero section with race image, name, location, and distance.
    - Key stats grid (Date, Entry fee, €/km, Series).
    - Blurb, planning facts (Terrain, Elevation/% increase), and logistics (Nearest airport).
    - "Similar races" section displays up to 3 races from the same country.
    - Dynamic OpenGraph and Twitter Card metadata generated from race details.
    - Integrates a `HeartButton` for local storage-based favoriting.

- **Race Specificity Page (`/race-specificity`):**
    - Interactive page with a background image (`mountain.png`).
    - Features a vertical drag-bar range slider for `AUTO% Increase` (m/km).
    - Country and Terrain bubble-selectors with faceted counts.
    - Results displayed in a grid of race cards.
    - Data: `/api/race-specificity-data` fetches **Entry Fees only** (one table, cached 1hr). Returns `{ entries: EnrichedDistance[] }` pre-joined. Fields: `LKP_auto_increase`, `Race Event`, `Race Slug`, `LKP_terrain_multi`, `LKP_country`, `LKP_featured_image`/`temporary_image`, `Distance (km)`, `Distance`, `AUTO Fee used`, `AUTO €/km`.

- **Authentication & User Profiles (Clerk):**
    - Integrates Clerk for user authentication, protecting `/profile(.*)`.
    - Provides a unified sign-in/sign-up flow.
    - User profile page (`/profile`) displays saved races fetched from an Airtable Favorites table.
    - Favorites API (`/api/favorites`) supports GET/POST/DELETE operations.
    - GDPR compliant: Clerk stores email in EU; Airtable Favorites stores `clerk_user_id` and linked `race_slug1` (Airtable record ID), avoiding PII.

- **Race Favourites Tray (localStorage):**
    - `FavouritesContext` (localStorage-based) manages `FavouriteEntry` objects (entryFeeId, slug, name, imageUrl, eurPerKm, distanceKm, startDate, country).
    - `HeartButton` component for adding/removing favorites, used on race detail pages.
    - `FavouritesTray` (sticky bottom bar) shows saved races, count, and thumbnails.
    - "Compare" button links to a dedicated `/favourites` comparison page.
    - "Save Calendar" feature syncs local favorites to Airtable via `api/save-calendar` (Clerk-authenticated).

- **Global Components:**
    - `MobileNav`: Sticky top bar for small screens with navigation links.

## External Dependencies
- **Airtable:** Primary data source for all race information, entry fees, and user favorites. Accessed via REST API.
- **Clerk:** Authentication service for user management, sign-in/sign-up flows, and securing user-specific data.
- **Google Fonts:** Used for Geist Sans and Geist Mono typography via `next/font`.
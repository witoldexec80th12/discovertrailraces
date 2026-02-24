# DiscoverTrailRaces — Cost Per KM

## Overview
Next.js 16 application (App Router) for comparing European trail race costs. The main feature is a **Cost Per KM** page at `/cost` that fetches race data from Airtable and displays it in a premium curated feed with cost/km analysis.

## Project Architecture
- **Framework**: Next.js 16 (App Router, React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Data Source**: Airtable REST API (server-side fetch, no-store cache)
- **Port**: Application runs on port 5000, bound to 0.0.0.0
- **Fonts**: Geist Sans + Geist Mono (Google Fonts via next/font)

## Environment Secrets
- `AIRTABLE_TOKEN` — Airtable personal access token
- `AIRTABLE_BASE_ID` — Airtable base identifier
- `SESSION_SECRET` — Session secret

## Directory Structure
- `src/app/` — App Router pages and layouts
- `src/app/page.tsx` — Home page (default Next.js starter)
- `src/app/cost/page.tsx` — **Main page**: Cost Per KM trail race comparison (437 lines)
- `src/app/layout.tsx` — Root layout with Geist fonts and metadata
- `src/app/globals.css` — Global styles (Tailwind v4 imports, CSS variables)
- `src/lib/airtable.ts` — Airtable API fetch utility (generic typed fetch)
- `src/lib/airtableConfig.ts` — Airtable table/view name constants
- `public/images/` — Static image assets
- `attached_assets/` — User-uploaded source images

## Development
- Run: `npm run dev` (starts Next.js dev server on port 5000)
- Build: `npm run build`
- Start: `npm run start`

---

## REFERENCE SNAPSHOT — Feb 24, 2026

This section documents the exact configuration at checkpoint `0480b75` so we can revert if needed.

### Images Inventory

#### public/images/ (served at /images/*)
| File | Size | Description | Used in page? |
|------|------|-------------|---------------|
| `hero.jpg` | 3.3 MB | Mountain/trail hero background photo | YES — hero section background (`/images/hero.jpg`) |
| `logo_white.png` | 3.5 KB | White version of DiscoverTrailRaces logo | YES — top-left of hero (`/images/logo_white.png`, h-20 to h-32) |
| `cost_per_km_white.png` | 13 KB | White "COST-PER-KM" wordmark/title image | YES — hero left column (`/images/cost_per_km_white.png`, max-w-560px) |
| `logo.jpg` | 3.7 KB | Dark/standard version of DiscoverTrailRaces logo | NO — not currently referenced |
| `cost-per-km.png` | 2.1 MB | Dark version of Cost Per KM image | NO — not currently referenced |

#### attached_assets/ (source uploads, not directly served)
| File | Description |
|------|-------------|
| `discovertrailraces-header-logo_*.jpg` | Original logo upload (3.7 KB, same as logo.jpg) |
| `costperKMimage_*.png` | Original Cost Per KM image upload (2.1 MB, same as cost-per-km.png) |
| `Discover__*.png` | Alternative discover image (272 KB) |
| `image_*.png` | Alternative image variant (2.1 MB) |

### Cost Page Layout (src/app/cost/page.tsx)

#### Hero Section (lines 208–279)
- **Structure**: Full-width section, 69vh mobile / 75vh desktop
- **Background**: `hero.jpg` with `Image fill` + dark gradient overlay (`from-black/60 via-black/40 to-black/20`)
- **Top bar**: White logo (`logo_white.png`) at top-left, sizes h-20/h-24/h-28/h-32 responsive
- **Content area**: 2-column grid on md+
  - Left: `cost_per_km_white.png` wordmark (max-w-560px, full width)
  - Right: Description text (white) + tagline "Plan your best trail season yet."
  - Two CTA buttons: "Explore the Cost Index" (solid white) + "How this works" (ghost/outline)
- **Anchor**: `#cost-index` links down to race list

#### Race List Section (lines 281–432)
- **Label**: "Cost Transparency" — tiny uppercase tracking label above cards
- **Cards**: `space-y-3` vertical stack
- **Each card**: Rounded-xl white card with border, hover shadow + slight scale
  - Left: Race thumbnail (132×88 / 160×108) from Airtable `Featured Image`, or neutral placeholder with ImageIcon
  - Right top: Race name (bold, with hover underline + ArrowUpRight icon), location (country · region), blurb (2-line clamp)
  - Right side: €/km price (bold, large), "per km" label, price band badge (color-coded: emerald/amber/rose), distance km, fee amount
- **Wrapper**: Clickable Link if race has a slug, otherwise plain div
- **Footer**: "Showing N results · sorted by €/km"

#### Data Handling
- Fetches from Airtable "Entry Fees" table, view "entry_fees_public"
- Sorted by "AUTO €/km" ascending, pageSize 20
- Validates fee and €/km must be > 0 to display values
- Country flags available via flagcdn.com (function exists but not currently used in cards)
- Price bands: 0–1 (emerald), 1–2 (amber), 2–3/3+ (rose)

#### Airtable Fields Used
```
ID, Race Event, Country (from Race), Region (from Race),
Distance, Distance (km), Currency, AUTO Fee used,
AUTO €/km, AUTO Price Bands, Last Checked,
Featured Image, Featured Blurb, Race Slug
```

### Styling
- Background: gradient neutral-50 to white
- Card: white bg, neutral-200 border, rounded-xl, hover shadow + scale 1.01
- Typography: Geist Sans, neutral color palette
- Global CSS: light/dark mode vars (but page is light-mode designed)

### Key Functions
- `asText(v)` — Safely converts arrays/nulls to display strings
- `countryToCode(country)` — Maps country names to 2-letter ISO codes
- `flagUrl(code)` — Returns flagcdn.com URL for country flag
- `getBandColor(band)` — Returns Tailwind classes for price band badge coloring
- `formatBand(band)` — Normalizes band text to display format (0–1, 1–2, 2–3, 3+)

---

## Recent Changes
- Feb 24, 2026: Documented full reference snapshot of current configuration
- Feb 19, 2026: Added hero section with hero.jpg background, white logo, white cost-per-km wordmark
- Feb 19, 2026: Fixed Turbopack cache corruption, cleared .next directory
- Feb 19, 2026: Fixed runtime errors (band.toLowerCase crash, JSX structure)
- Feb 19, 2026: Converted from table layout to premium card-based curated feed
- Feb 19, 2026: Added data validation (fee/€km > 0), logo header, hero section
- Set up Next.js project with create-next-app (Feb 2026)
- Configured allowedDevOrigins for Replit preview

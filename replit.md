# DiscoverTrailRaces — Cost Per KM

## Overview
Next.js 16 application (App Router) for comparing European trail race costs. Features a **Cost Per KM** page at `/cost` (curated card feed) and individual **Race Pages** at `/races/[slug]` (detail view). Data sourced from Airtable.

## Project Architecture
- **Framework**: Next.js 16 (App Router, React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Data Source**: Airtable REST API (server-side fetch, no-store cache on /cost; 1-hour ISR on race pages)
- **Port**: Application runs on port 5000, bound to 0.0.0.0
- **Fonts**: Geist Sans + Geist Mono (Google Fonts via next/font)

## Environment Secrets
- `AIRTABLE_TOKEN` — Airtable personal access token
- `AIRTABLE_BASE_ID` — Airtable base identifier
- `SESSION_SECRET` — Session secret

## Directory Structure
- `src/app/` — App Router pages and layouts
- `src/app/page.tsx` — Home page (default Next.js starter)
- `src/app/cost/page.tsx` — **Cost Per KM page**: curated card feed with cost/km analysis (~429 lines)
- `src/app/races/[slug]/page.tsx` — **Race detail page**: individual race view with stats, blurb, terrain, logistics (~347 lines)
- `src/app/layout.tsx` — Root layout with Geist fonts and metadata
- `src/app/globals.css` — Global styles (Tailwind v4 imports, CSS variables)
- `src/lib/airtable.ts` — Airtable API fetch utility (generic typed fetch, no-store cache)
- `src/lib/airtableConfig.ts` — Airtable table/view name constants
- `public/images/` — Static image assets
- `attached_assets/` — User-uploaded source images

## Development
- Run: `npm run dev` (starts Next.js dev server on port 5000)
- Build: `npm run build`
- Start: `npm run start`
- User pushes to GitHub via SSH shell for production deploy

---

## REFERENCE SNAPSHOT — Feb 26, 2026

**This section documents the exact configuration as of this date. These designs are intentional and should not be changed automatically.**

### Images Inventory

#### public/images/ (served at /images/*)
| File | Description | Used? |
|------|-------------|-------|
| `hero.jpg` | Mountain/trail hero background photo | YES — hero section background |
| `logo_white.png` | White DiscoverTrailRaces logo | YES — top-left of hero |
| `cost_per_km_white.png` | White "COST-PER-KM" wordmark | YES — hero left column |
| `logo.jpg` | Dark/standard logo | NO — not referenced |
| `cost-per-km.png` | Dark version of Cost Per KM image | NO — not referenced |

### Cost Page Layout (src/app/cost/page.tsx)

#### Hero Section
- Full-width section, 69vh mobile / 75vh desktop
- Background: `hero.jpg` with `Image fill` + dark gradient overlay
- Top bar: White logo (`logo_white.png`), sizes h-20/h-28/h-36/h-[168px] responsive
- Content: 2-column grid on md+ — wordmark left, description + CTAs right
- Anchor: `#cost-index` links down to race list

#### Card Layout — Desktop (sm+)
- Thumbnail: 160×108px rounded-lg (rectangular)
- Text area: Race name (from ID field, parsed before last dash), location, blurb (sm:max-w-[50%])
- Three right-side stat columns:
  1. **Price per km** — text-2xl/3xl bold, "price per km" label, fee amount below
  2. **Race Distance** — text-lg/xl underlined, "Race Distance" label
  3. **Verified Date** — black rounded box with white text, "Verified Date" label

#### Card Layout — Mobile
- Top row: Square thumbnail (w-28 h-28, 1:1) left, title + location + blurb right
- Blurb: text-[11px], line-clamp-2
- Stats row: Full-width below, separated by border-t, three equal flex-1 columns:
  1. **Verified Date** (left-aligned) — text-base bold, "Verified Date" label
  2. **Price Per KM** (centered) — text-xl bold, "Price Per KM" label
  3. **Distance** (right-aligned) — text-base semibold, "Distance" label

#### Data Handling
- Fetches from Airtable "Entry Fees" table, view "entry_fees_public"
- Sorted by "AUTO €/km" ascending, pageSize 20
- Race name parsed from ID field: splits on ` – ` (em dash), name = everything before last part, distance = last part
- "Race Event" and "Distance" are linked record fields (return record IDs, not text) — **do not use directly for display**
- Image priority: LKP_featured_image → temporary_image → placeholder
- Blurb source: FINAL_blurb field
- Validates fee and €/km must be > 0

#### Airtable Fields Used (Cost Page)
```
ID, Race Event (linked), LKP_country, LKP_region,
Distance (linked), Distance (km), Currency, AUTO Fee used,
AUTO €/km, AUTO Price Bands, Last Checked,
LKP_featured_image, temporary_image, FINAL_blurb,
Race Slug, Distance Start Date
```

### Race Detail Page (src/app/races/[slug]/page.tsx)

#### Structure
- Fetches rows by slug using FIND formula on Race Slug field
- Prefers "Is Primary Distance" row, falls back to first
- ISR with 1-hour revalidation
- Dynamic metadata from race name

#### Layout
- Top nav: "← Back to Cost Index" + "Home" links
- Hero: Full-width rounded card with race image (240px/320px), gradient overlay, name + location + distance
- Key stats grid (2×2 mobile, 4-col desktop): Date, Entry fee, €/km, Series (UTMB/Independent)
- Blurb section: FINAL_blurb → Featured Blurb fallback
- Planning facts: Terrain, Elevation/% increase (rounded cards)
- Logistics section: Nearest airport + notes
- Footer: "Last checked" provenance

#### Airtable Fields Used (Race Page)
```
ID, Race Event (linked), LKP_country, LKP_region,
Distance (linked), Distance (km), Currency, AUTO Fee used,
AUTO €/km, AUTO Price Bands, Last Checked,
LKP_featured_image, temporary_image, Featured Blurb, FINAL_blurb,
Race Slug, Distance Start Date, Is Primary Distance (from Distance),
LKP_terrain, LKP_elevation, LKP_%increase, LKP_utmb,
LKP_logistics, LKP_primaryairport, LKP_airportcode,
LKP_lessthan30, LKP_cartransfertime
```

### Airtable Config (src/lib/airtableConfig.ts)
```
Tables: Entry Fees, Race Events
Views: entry_fees_public, race_events_public, homepage_featured,
       race_pages_primary, explore_value_* (5 price band views)
```

### Key Functions (Cost Page)
- `asText(v)` — Safely converts arrays/nulls to display strings
- `getBandColor(band)` — Returns Tailwind classes for price band badge coloring (unused in current layout)
- `formatBand(band)` — Normalizes band text (unused in current layout)

### Key Functions (Race Page)
- `asText(v)` — Same utility
- `pickFirstUrl(a)` — Gets first attachment URL or null
- `formatMoney(amount, currency)` — Formats fee with currency string
- `formatEurPerKm(epk)` — Formats €/km value
- `formatDateShort(iso)` — Formats ISO date to "Month Day, Year"
- `extractNameAndDistance(idField)` — Splits ID field into name and distance parts

### Styling
- Background: gradient neutral-50 to white
- Cards: white bg, neutral-200 border, rounded-xl, hover shadow + scale 1.01
- Typography: Geist Sans, neutral color palette
- Light-mode designed

### Important Notes
- **Turbopack fix**: Delete `.next` directory when Turbopack panics (`rm -rf .next`)
- **Fast Refresh loop**: Known non-blocking Replit preview issue
- **Linked record fields**: "Race Event" and "Distance" return Airtable record IDs — always parse from ID field instead

---

## Recent Changes
- Feb 26, 2026: Documented full reference snapshot including race detail page
- Feb 26, 2026: User added race detail page at `/races/[slug]` with terrain, logistics, stats
- Feb 26, 2026: Updated Airtable field names (LKP_country, LKP_region, LKP_featured_image, temporary_image, FINAL_blurb)
- Feb 26, 2026: Swapped blurb source from Featured Blurb to FINAL_blurb on cost page
- Feb 26, 2026: Mobile stats row: full-width with "Verified Date", "Price Per KM", "Distance" labels
- Feb 26, 2026: Mobile thumbnails changed to 1:1 square, blurb reduced ~33%
- Feb 26, 2026: Race title now parsed from ID field (Race Event returns record IDs)
- Feb 26, 2026: Added Distance column with underline + "Race Distance" label on desktop
- Feb 24, 2026: Documented full reference snapshot of previous configuration
- Feb 19, 2026: Hero section, card-based feed, data validation, Turbopack fixes
- Set up Next.js project with create-next-app (Feb 2026)

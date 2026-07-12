# Otcora

Otcora is an India-first adult OTC medicine education app. Users enter symptoms, see composition-first self-care information and a few common brand examples, while prescription information remains composition-only clinician context.

## Current Shape

- `apps/web`: Next.js web app, built first.
- `packages/core`: shared symptom, medicine, recommendation, and safety logic.
- `packages/data`: catalog import, CSV diffing, and ingestion utilities.
- `packages/ui`: shared tokens for web now and mobile later.
- `apps/mobile`: placeholder for the Android app after web v1 is stable.

## Setup

```bash
npm install
npm run dev
```

The web app runs at `http://localhost:3000`.

## Data Workflow

Place the local medicine CSV at:

```text
data/raw/seed_medicines.csv
```

Then run:

```bash
npm run data:sitemap
npm run data:import-csv
npm run data:scrape-missing
npm run data:build-core-catalog
```

`data:build-core-catalog` turns the local CSV into the generated catalog used by the app. Review data rights before using any third-party inventory in production.

## Safety Positioning

Otcora does not diagnose and does not tell users what they should take. The current self-care scope is adults aged 18-64 who are not pregnant or breastfeeding. Urgent and clinician-managed symptoms block medicine results. Prescription brands, strengths, prices, links, and dosing instructions are never returned publicly.

The medical decision path is deterministic and rule based. Do not place a general-purpose LLM in the recommendation path. An LLM may later support typo or alias recognition only when its output is constrained to Otcora's reviewed symptom IDs and no health input is retained by the provider.

Before public launch, obtain professional review of the composition rules, confirm catalog data rights, configure platform-level rate limiting, and document a correction and incident-response process.

## SEO and AdSense Readiness

The web app includes metadata, canonical URLs, legal pages, a medical disclaimer, a sitemap, robots metadata, and optional Google Analytics support. Set the public production URL before deploying so canonical links and sitemap entries point to the right domain:

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

Medicine detail pages are intentionally marked `noindex` until the catalog data rights are fully reviewed. Symptom and guide pages are the safer SEO surface for AdSense review.

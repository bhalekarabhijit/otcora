# Otcora

Otcora is an India-first OTC medicine guidance app. Users enter symptoms, see self-care eligible options first, and can also view clearly separated prescription-only medicines with safety warnings and doctor prompts.

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

Otcora does not diagnose and does not tell users what they should take. Recommendation language is intentionally cautious: medicines may help with selected symptoms, prescription medicines are separated, and red-flag symptoms direct users to medical care.

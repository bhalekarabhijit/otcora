# Otcora

Otcora is an India-first OTC medicine guidance app. Users enter symptoms, see self-care eligible options first, and can also view clearly separated prescription-only medicines with safety warnings and doctor prompts.

## Current Shape

- `apps/web`: Next.js web app, built first.
- `packages/core`: shared symptom, medicine, recommendation, and safety logic.
- `packages/data`: 1mg sitemap, CSV diffing, and scrape-planning utilities.
- `packages/ui`: shared tokens for web now and mobile later.
- `apps/mobile`: placeholder for the Android app after web v1 is stable.

## Setup

```bash
npm install
npm run dev
```

The web app runs at `http://localhost:3000`.

## Data Workflow

Place the existing 1mg CSV at:

```text
data/raw/seed_1mg_medicines.csv
```

Then run:

```bash
npm run data:sitemap
npm run data:import-csv
npm run data:scrape-missing
```

The first production ingestion pass should review 1mg's terms and use the sitemap inventory responsibly. Scraped records keep source URL, sitemap type, scrape timestamp, parser version, and confidence fields.

## Safety Positioning

Otcora does not diagnose and does not tell users what they should take. Recommendation language is intentionally cautious: medicines may help with selected symptoms, prescription medicines are separated, and red-flag symptoms direct users to medical care.

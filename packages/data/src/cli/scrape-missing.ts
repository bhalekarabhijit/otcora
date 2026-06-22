import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { findMissingMedicineUrls } from "../diff";
import type { SeedMedicineRow } from "../csv";
import type { SitemapEntry } from "../sitemaps";

const root = resolve(process.cwd(), "../..");
const sitemapPath = resolve(root, "data/generated/catalog-sitemap.json");
const seedPath = resolve(root, "data/generated/seed-medicines.json");
const outputPath = resolve(root, "data/generated/missing-catalog-urls.json");

async function main() {
  const sitemap = JSON.parse(await readFile(sitemapPath, "utf8")) as { entries: SitemapEntry[] };
  const seed = JSON.parse(await readFile(seedPath, "utf8")) as { rows: SeedMedicineRow[] };
  const missing = findMissingMedicineUrls(sitemap.entries, seed.rows);

  await mkdir(resolve(root, "data/generated"), { recursive: true });
  await writeFile(outputPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    count: missing.length,
    missing,
    nextStep: "Review these URLs in batches and store normalized records."
  }, null, 2));

  console.log(`Found ${missing.length} missing URLs. Wrote ${outputPath}`);
}

await main();

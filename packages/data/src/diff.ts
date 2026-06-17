import { medicineIdFromUrl, type SitemapEntry } from "./sitemaps";
import type { SeedMedicineRow } from "./csv";

export interface MissingMedicineUrl {
  id: string;
  url: string;
  type: SitemapEntry["type"];
  lastmod?: string;
}

export function findMissingMedicineUrls(sitemapEntries: SitemapEntry[], seedRows: SeedMedicineRow[]): MissingMedicineUrl[] {
  const known = new Set(
    seedRows.flatMap((row) => [row.id, row.sourceUrl ? medicineIdFromUrl(row.sourceUrl) : undefined]).filter(Boolean)
  );

  return sitemapEntries
    .map((entry) => ({
      id: medicineIdFromUrl(entry.url),
      url: entry.url,
      type: entry.type,
      ...(entry.lastmod ? { lastmod: entry.lastmod } : {})
    }))
    .filter((entry) => !known.has(entry.id));
}

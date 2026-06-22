import { describe, expect, it } from "vitest";
import { findMissingMedicineUrls } from "./diff";
import { parseCsv } from "./csv";
import { parseSitemapIndex, parseUrlSet } from "./sitemaps";

describe("sitemap parsing", () => {
  it("keeps English medicine sitemap types", () => {
    const result = parseSitemapIndex(`
      <sitemapindex>
        <sitemap><loc>https://catalog.example.com/sitemap_drugs_1.xml</loc></sitemap>
        <sitemap><loc>https://catalog.example.com/sitemap_hi_drugs_1.xml</loc></sitemap>
        <sitemap><loc>https://catalog.example.com/sitemap_otc_1.xml</loc></sitemap>
      </sitemapindex>
    `);
    expect(result).toEqual([
      { url: "https://catalog.example.com/sitemap_drugs_1.xml", type: "drug" },
      { url: "https://catalog.example.com/sitemap_otc_1.xml", type: "otc" }
    ]);
  });

  it("extracts URL entries", () => {
    const entries = parseUrlSet(`
      <urlset>
        <url><loc>https://catalog.example.com/drugs/demo-tablet-123</loc><lastmod>2026-05-20</lastmod></url>
      </urlset>
    `, "drug");
    expect(entries[0]?.url).toBe("https://catalog.example.com/drugs/demo-tablet-123");
  });
});

describe("csv diff", () => {
  it("finds sitemap URLs missing from the seed CSV", () => {
    const rows = parseCsv("source_url,name\nhttps://catalog.example.com/drugs/demo-tablet-123,Demo\n");
    const missing = findMissingMedicineUrls([
      { url: "https://catalog.example.com/drugs/demo-tablet-123", type: "drug" },
      { url: "https://catalog.example.com/otc/ors-sachet-otc456", type: "otc" }
    ], rows);
    expect(missing).toHaveLength(1);
    expect(missing[0]?.id).toBe("456");
  });
});

import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseSitemapIndex, parseUrlSet, type SitemapEntry } from "../sitemaps";

const root = resolve(process.cwd(), "../..");
const outputPath = resolve(root, "data/generated/1mg-sitemap.json");

async function main() {
  const indexResponse = await fetch("https://www.1mg.com/sitemap.xml");
  if (!indexResponse.ok) {
    throw new Error(`Failed to fetch sitemap index: ${indexResponse.status}`);
  }

  const sitemapRefs = parseSitemapIndex(await indexResponse.text());
  const entries: SitemapEntry[] = [];

  for (const sitemap of sitemapRefs) {
    const response = await fetch(sitemap.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${sitemap.url}: ${response.status}`);
    }
    entries.push(...parseUrlSet(await response.text(), sitemap.type));
  }

  await mkdir(resolve(root, "data/generated"), { recursive: true });
  await writeFile(outputPath, JSON.stringify({ generatedAt: new Date().toISOString(), entries }, null, 2));
  console.log(`Wrote ${entries.length} sitemap entries to ${outputPath}`);
}

await main();

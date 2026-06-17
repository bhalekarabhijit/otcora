export type SitemapType = "drug" | "otc" | "generic" | "disease" | "category";

export interface SitemapEntry {
  url: string;
  lastmod?: string;
  type: SitemapType;
}

const sitemapTypeByPattern: Array<[RegExp, SitemapType]> = [
  [/sitemap_drugs_\d+\.xml$/, "drug"],
  [/sitemap_otc_\d+\.xml$/, "otc"],
  [/sitemap_generics_\d+\.xml$/, "generic"],
  [/sitemap_diseases_\d+\.xml$/, "disease"],
  [/sitemap_categories_\d+\.xml$/, "category"]
];

export function parseSitemapIndex(xml: string): Array<{ url: string; type: SitemapType }> {
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => decodeXml(match[1] ?? ""));
  return urls
    .map((url) => {
      const type = sitemapTypeByPattern.find(([pattern]) => pattern.test(url))?.[1];
      return type ? { url, type } : undefined;
    })
    .filter((item): item is { url: string; type: SitemapType } => Boolean(item));
}

export function parseUrlSet(xml: string, type: SitemapType): SitemapEntry[] {
  const blocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => match[1] ?? "");
  return blocks
    .flatMap((block) => {
      const url = block.match(/<loc>(.*?)<\/loc>/)?.[1];
      if (!url) {
        return [];
      }
      const lastmod = block.match(/<lastmod>(.*?)<\/lastmod>/)?.[1];
      const entry: SitemapEntry = {
        url: decodeXml(url),
        type
      };
      if (lastmod) {
        entry.lastmod = lastmod;
      }
      return [entry];
    });
}

export function medicineIdFromUrl(url: string): string {
  const match = url.match(/(?:-|otc)(\d+)(?:$|[/?#])/);
  return match?.[1] ?? slugFromUrl(url);
}

function slugFromUrl(url: string): string {
  return url.split("?")[0]?.split("/").filter(Boolean).at(-1) ?? url;
}

function decodeXml(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&apos;", "'");
}

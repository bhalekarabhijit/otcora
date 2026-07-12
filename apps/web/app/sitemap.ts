import type { MetadataRoute } from "next";
import { siteUrl, symptomsForSeo } from "../lib/site";

const staticRoutes = [
  "",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/medical-disclaimer",
  "/methodology",
  "/guides/otc-vs-prescription-medicines"
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    ...staticRoutes.map((route) => ({
      url: siteUrl + route,
      lastModified: now,
      changeFrequency: route === "" ? "weekly" as const : "monthly" as const,
      priority: route === "" ? 1 : 0.7
    })),
    ...symptomsForSeo.map((symptom) => ({
      url: siteUrl + "/symptoms/" + symptom.id,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.75
    }))
  ];
}

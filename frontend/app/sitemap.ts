import type { MetadataRoute } from "next";

import { api, type AreaStatistics } from "@/lib/api";
import { siteUrl } from "@/lib/seoAreas";
import { SEO_GUIDES } from "@/lib/seoGuides";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteUrl();
  const now = new Date();
  let areas: AreaStatistics[] = [];
  try {
    areas = await api.listAreas();
  } catch {
    // The base discovery routes remain valid when the API is temporarily unavailable.
  }
  const publicDiscoveryRoutes = [
    "",
    "/check",
    "/guides",
    "/areas",
  ];

  return [
    ...publicDiscoveryRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.7,
    })),
    ...areas.filter((area) => area.area_id !== "wroclaw-city").map((area) => ({
      url: `${baseUrl}/areas/${area.area_id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
    ...SEO_GUIDES.map((guide) => ({
      url: `${baseUrl}/guides/${guide.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.82,
    })),
  ];
}

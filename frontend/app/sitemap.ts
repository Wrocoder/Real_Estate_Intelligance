import type { MetadataRoute } from "next";

import { SEO_AREAS, siteUrl } from "@/lib/seoAreas";
import { SEO_GUIDES } from "@/lib/seoGuides";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteUrl();
  const now = new Date();
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
    ...SEO_AREAS.map((area) => ({
      url: `${baseUrl}/areas/${area.slug}`,
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

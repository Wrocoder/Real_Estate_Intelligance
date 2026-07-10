import type { MetadataRoute } from "next";

import { SEO_AREAS, siteUrl } from "@/lib/seoAreas";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteUrl();
  const now = new Date();
  const staticRoutes = [
    "",
    "/areas",
    "/compare",
    "/pricing",
    "/reports",
    "/alerts",
  ];

  return [
    ...staticRoutes.map((route) => ({
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
  ];
}

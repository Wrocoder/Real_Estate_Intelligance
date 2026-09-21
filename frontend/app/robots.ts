import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/seoAreas";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/check/drafts",
        "/check?draft=",
        "/?draft=",
        "/account",
        "/admin",
        "/alerts",
        "/beta",
        "/saved",
        "/compare",
        "/developers",
        "/market",
        "/mortgage",
        "/pricing",
        "/realtors",
        "/reports",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

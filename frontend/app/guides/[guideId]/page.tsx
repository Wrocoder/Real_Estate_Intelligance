import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";

import { GuideArticleContent } from "@/components/GuideArticleContent";
import { LOCALE_COOKIE_NAME, normalizeLocale } from "@/lib/i18n";
import { siteUrl } from "@/lib/seoAreas";
import { getSeoGuide, SEO_GUIDES } from "@/lib/seoGuides";

type PageProps = {
  params: Promise<{ guideId: string }>;
};

export function generateStaticParams() {
  return SEO_GUIDES.map((guide) => ({ guideId: guide.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { guideId } = await params;
  const guide = getSeoGuide(guideId);
  if (!guide) return {};

  return {
    title: guide.title,
    description: guide.description,
    alternates: {
      canonical: `${siteUrl()}/guides/${guide.slug}`,
    },
    openGraph: {
      title: guide.title,
      description: guide.description,
      type: "article",
      url: `${siteUrl()}/guides/${guide.slug}`,
    },
  };
}

export default async function GuidePage({ params }: PageProps) {
  const { guideId } = await params;
  const guide = getSeoGuide(guideId);
  if (!guide) notFound();
  const cookieStore = await cookies();
  const initialLocale = normalizeLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    author: {
      "@type": "Organization",
      name: guide.editorial.author,
    },
    reviewedBy: {
      "@type": "Organization",
      name: guide.editorial.reviewer,
    },
    dateModified: guide.editorial.updatedAt,
    inLanguage: "pl",
    citation: guide.editorial.sources.map((source) => source.href),
    about: guide.category,
    url: `${siteUrl()}/guides/${guide.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <GuideArticleContent guide={guide} initialLocale={initialLocale} />
    </>
  );
}

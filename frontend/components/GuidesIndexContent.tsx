"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, ClipboardCheck, Languages, MapPinned } from "lucide-react";

import { GuideEditorialMeta } from "@/components/GuideEditorialMeta";
import { GUIDE_UI_COPY, guideCategory } from "@/lib/guideUiCopy";
import type { Locale } from "@/lib/i18n";
import { SEO_GUIDES } from "@/lib/seoGuides";
import { useLocalePreference } from "@/lib/useLocalePreference";

export function GuidesIndexContent({ initialLocale }: { initialLocale: Locale }) {
  const { locale } = useLocalePreference(initialLocale);
  const copy = GUIDE_UI_COPY[locale];

  return (
    <>
      <header className="page-header">
        <div>
          <h1>{copy.indexTitle}</h1>
          <p>{copy.indexIntro}</p>
          {locale !== "pl" ? (
            <p className="guide-language-notice"><Languages aria-hidden="true" size={15} /> {copy.polishNotice}</p>
          ) : null}
        </div>
        <div className="toolbar">
          <Link className="button" href="/areas">
            <MapPinned aria-hidden="true" size={16} /> {copy.areas}
          </Link>
          <Link className="button primary" href="/check?source=guides">
            <ClipboardCheck aria-hidden="true" size={16} /> {copy.check}
          </Link>
        </div>
      </header>

      <section className="seo-guide-grid">
        {SEO_GUIDES.map((guide) => (
          <article className="seo-guide-card" key={guide.slug} lang="pl">
            <div>
              <span className="status-pill info" lang={locale}>{guideCategory(guide.category, locale)}</span>
              <h2>{guide.title}</h2>
              <p>{guide.description}</p>
              <GuideEditorialMeta compact guide={guide} initialLocale={initialLocale} />
            </div>
            <ul className="section-list compact">
              {guide.keyTakeaways.slice(0, 2).map((item) => (
                <li key={item}>
                  <BookOpen aria-hidden="true" size={14} /> {item}
                </li>
              ))}
            </ul>
            <Link className="button" href={`/guides/${guide.slug}`} lang={locale}>
              {copy.read} <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </article>
        ))}
      </section>
    </>
  );
}

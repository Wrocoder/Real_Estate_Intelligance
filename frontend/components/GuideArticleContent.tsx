"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  FileText,
  Languages,
  MapPinned,
  Search,
} from "lucide-react";

import { GuideEditorialMeta } from "@/components/GuideEditorialMeta";
import { GuideRelatedAreas } from "@/components/GuideRelatedAreas";
import { GUIDE_UI_COPY, guideCategory } from "@/lib/guideUiCopy";
import type { Locale } from "@/lib/i18n";
import { SEO_GUIDES, type SeoGuide } from "@/lib/seoGuides";
import { useLocalePreference } from "@/lib/useLocalePreference";

export function GuideArticleContent({
  guide,
  initialLocale,
}: {
  guide: SeoGuide;
  initialLocale: Locale;
}) {
  const { locale } = useLocalePreference(initialLocale);
  const copy = GUIDE_UI_COPY[locale];
  const relatedGuides = [
    ...SEO_GUIDES.filter((item) => item.slug !== guide.slug && item.category === guide.category),
    ...SEO_GUIDES.filter((item) => item.slug !== guide.slug && item.category !== guide.category),
  ].slice(0, 4);
  const checkHref = `/check?source=guide&guide=${encodeURIComponent(guide.slug)}`;

  return (
    <>
      <header className="page-header guide-page-header">
        <div>
          <Link className="button" href="/guides">
            <ArrowLeft aria-hidden="true" size={16} /> {copy.back}
          </Link>
          <h1 lang="pl">{guide.title}</h1>
          <p lang="pl">{guide.heroSummary}</p>
          {locale !== "pl" ? (
            <p className="guide-language-notice">
              <Languages aria-hidden="true" size={15} /> {copy.polishNotice}
            </p>
          ) : null}
        </div>
        <div className="toolbar">
          <Link className="button primary" href={checkHref}>
            <ClipboardCheck aria-hidden="true" size={16} /> {copy.check}
          </Link>
          <Link className="button" href="/pricing?source=guide">
            <FileText aria-hidden="true" size={16} /> {copy.report}
          </Link>
        </div>
      </header>

      <GuideEditorialMeta guide={guide} initialLocale={initialLocale} />

      <div className="guide-article-layout">
        <article className="guide-content" lang="pl">
          <section className="guide-takeaways">
            <div className="guide-section-heading">
              <h2 lang={locale}>{copy.keyPoints}</h2>
              <span className="status-pill info" lang={locale}>
                {guideCategory(guide.category, locale)}
              </span>
            </div>
            <ul className="section-list">
              {guide.keyTakeaways.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>

          {guide.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
              <ul className="section-list">
                {section.bullets.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>
          ))}
        </article>

        <aside className="guide-article-aside">
          <section>
            <div className="guide-section-heading">
              <h2>{copy.nextChecks}</h2>
              <MapPinned aria-hidden="true" size={18} />
            </div>
            <div className="guide-link-grid">
              {guide.internalLinks.map((link) => (
                <Link className="button" href={link.href} key={`${link.href}-${link.label}`} lang="pl">
                  {link.label}
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2>{copy.relatedAreas}</h2>
            <GuideRelatedAreas areaSlugs={guide.relatedAreaSlugs} initialLocale={initialLocale} />
          </section>

          <section>
            <h2>{copy.moreGuides}</h2>
            <ul className="section-list compact guide-more-list">
              {relatedGuides.map((item) => (
                <li key={item.slug}>
                  <Search aria-hidden="true" size={14} />
                  <Link href={`/guides/${item.slug}`} lang="pl">{item.title}</Link>
                </li>
              ))}
            </ul>
          </section>

          <Link className="button primary guide-primary-action" href={checkHref}>
            {copy.checkSpecific} <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </aside>
      </div>
    </>
  );
}

"use client";

import { ExternalLink, Languages, ShieldCheck } from "lucide-react";

import { dateValue } from "@/lib/format";
import { GUIDE_UI_COPY } from "@/lib/guideUiCopy";
import type { Locale } from "@/lib/i18n";
import type { SeoGuide } from "@/lib/seoGuides";
import { useLocalePreference } from "@/lib/useLocalePreference";

export function GuideEditorialMeta({
  guide,
  initialLocale,
  compact = false,
}: {
  guide: SeoGuide;
  initialLocale: Locale;
  compact?: boolean;
}) {
  const { locale } = useLocalePreference(initialLocale);
  const copy = GUIDE_UI_COPY[locale];
  const editorial = guide.editorial;

  return (
    <section
      className={`guide-editorial-meta${compact ? " compact" : ""}`}
      aria-label={copy.editorialInfo}
    >
      <div className="guide-editorial-facts">
        <span><strong>{copy.author}:</strong> <span lang="pl">{editorial.author}</span></span>
        {!compact ? (
          <span><strong>{copy.reviewer}:</strong> <span lang="pl">{editorial.reviewer}</span></span>
        ) : null}
        <span>
          <strong>{copy.updated}:</strong>{" "}
          <time dateTime={editorial.updatedAt}>{dateValue(editorial.updatedAt, locale)}</time>
        </span>
        <span><Languages aria-hidden="true" size={14} /> {copy.articleLanguage}</span>
      </div>
      {!compact ? (
        <>
          <div className="guide-review-scope">
            <ShieldCheck aria-hidden="true" size={16} />
            <p><strong>{copy.reviewScope}:</strong> <span lang="pl">{editorial.reviewScope}</span></p>
          </div>
          <div className="guide-editorial-sources">
            <strong>{copy.sources}</strong>
            <ul>
              {editorial.sources.map((source) => (
                <li key={source.href}>
                  <a href={source.href} target="_blank" rel="noreferrer">
                    {source.label} <ExternalLink aria-hidden="true" size={12} />
                  </a>
                  <small><b>{copy.sourceSupports}:</b> <span lang="pl">{source.supports}</span></small>
                </li>
              ))}
            </ul>
          </div>
          <p className="guide-disclaimer">{copy.disclaimer[editorial.disclaimerKind]}</p>
        </>
      ) : null}
    </section>
  );
}

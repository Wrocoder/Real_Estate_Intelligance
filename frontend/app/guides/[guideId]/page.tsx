import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  FileText,
  MapPinned,
  Search,
} from "lucide-react";

import { money, numberValue, percent } from "@/lib/format";
import { getSeoArea, siteUrl, type SeoArea } from "@/lib/seoAreas";
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

  const relatedAreas = guide.relatedAreaSlugs
    .map((slug) => getSeoArea(slug))
    .filter((area): area is SeoArea => area !== null);
  const relatedGuides = SEO_GUIDES.filter((item) => item.slug !== guide.slug).slice(0, 4);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    author: {
      "@type": "Organization",
      name: "Domarion Analytics",
    },
    about: guide.category,
    url: `${siteUrl()}/guides/${guide.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="page-header">
        <div>
          <Link className="button" href="/guides">
            <ArrowLeft size={16} /> Гайды
          </Link>
          <h1 style={{ marginTop: 14 }}>{guide.title}</h1>
          <p>{guide.heroSummary}</p>
        </div>
        <div className="toolbar">
          <Link className="button primary" href="/check">
            <ClipboardCheck size={16} /> Проверить квартиру
          </Link>
          <Link className="button" href="/pricing">
            <FileText size={16} /> Отчет
          </Link>
        </div>
      </header>

      <section className="metric-grid">
        <div className="metric">
          <span>Категория</span>
          <strong>{guide.category}</strong>
        </div>
        <div className="metric">
          <span>Районы</span>
          <strong>{numberValue(relatedAreas.length)}</strong>
        </div>
        <div className="metric">
          <span>Internal links</span>
          <strong>{numberValue(guide.internalLinks.length)}</strong>
        </div>
        <div className="metric">
          <span>CTA</span>
          <strong>Object report</strong>
        </div>
      </section>

      <div className="detail-grid" style={{ marginTop: 16 }}>
        <section className="panel">
          <div className="panel-header">
            <h2>Главное</h2>
            <span className="status-pill info">{guide.category}</span>
          </div>
          <div className="panel-body guide-content">
            <ul className="section-list">
              {guide.keyTakeaways.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            {guide.sections.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                <p>{section.body}</p>
                <ul className="section-list">
                  {section.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </section>

        <aside className="panel">
          <div className="panel-header">
            <h2>Связанные страницы</h2>
            <MapPinned size={18} />
          </div>
          <div className="panel-body">
            <div className="guide-link-grid">
              {guide.internalLinks.map((link) => (
                <Link className="button" href={link.href} key={link.href}>
                  {link.label}
                </Link>
              ))}
            </div>

            <h2>Районы</h2>
            <ul className="section-list compact">
              {relatedAreas.map((area) => (
                <li key={area.slug}>
                  <Link href={`/areas/${area.slug}`}>{area.name}</Link>
                  <small>
                    {money(area.medianPricePerM2)}/m2 · {numberValue(area.activeListings)} obj. ·{" "}
                    {percent(area.priceChange90dPct)}
                  </small>
                </li>
              ))}
            </ul>

            <h2>Еще гайды</h2>
            <ul className="section-list compact">
              {relatedGuides.map((item) => (
                <li key={item.slug}>
                  <Search size={14} />
                  <Link href={`/guides/${item.slug}`}>{item.title}</Link>
                </li>
              ))}
            </ul>

            <Link className="button primary" href="/check">
              Проверить конкретный объект <ArrowRight size={16} />
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}

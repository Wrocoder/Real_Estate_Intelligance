import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Bell, FileText, Newspaper, Search } from "lucide-react";

import { money, numberValue, percent } from "@/lib/format";
import { getSeoArea, SEO_AREAS, siteUrl } from "@/lib/seoAreas";

type PageProps = {
  params: Promise<{ areaId: string }>;
};

export function generateStaticParams() {
  return SEO_AREAS.map((area) => ({ areaId: area.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { areaId } = await params;
  const area = getSeoArea(areaId);
  if (!area) return {};

  return {
    title: area.title,
    description: area.description,
    alternates: {
      canonical: `${siteUrl()}/areas/${area.slug}`,
    },
    openGraph: {
      title: area.title,
      description: area.description,
      type: "article",
      url: `${siteUrl()}/areas/${area.slug}`,
    },
  };
}

export default async function AreaPage({ params }: PageProps) {
  const { areaId } = await params;
  const area = getSeoArea(areaId);
  if (!area) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: `${area.name}, ${area.city}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: area.city,
      addressRegion: "Dolnośląskie",
      addressCountry: "PL",
    },
    description: area.description,
    url: `${siteUrl()}/areas/${area.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="page-header">
        <div>
          <Link className="button" href="/areas">
            <ArrowLeft size={16} /> Районы
          </Link>
          <h1 style={{ marginTop: 14 }}>{area.title}</h1>
          <p>{area.description}</p>
        </div>
        <div className="toolbar">
          <Link className="button primary" href={`/?district=${encodeURIComponent(area.name)}`}>
            <Search size={16} /> Подбор
          </Link>
          <Link className="button" href="/alerts">
            <Bell size={16} /> Alert
          </Link>
          <Link className="button" href={`/news?area_id=${encodeURIComponent(area.areaId)}`}>
            <Newspaper size={16} /> News
          </Link>
        </div>
      </header>

      <section className="metric-grid">
        <div className="metric">
          <span>Медианная цена</span>
          <strong>{money(area.medianPricePerM2)}/m2</strong>
        </div>
        <div className="metric">
          <span>Средняя цена</span>
          <strong>{money(area.averagePricePerM2)}/m2</strong>
        </div>
        <div className="metric">
          <span>Активных объявлений</span>
          <strong>{numberValue(area.activeListings)}</strong>
        </div>
        <div className="metric">
          <span>Цена за 90 дней</span>
          <strong>{percent(area.priceChange90dPct)}</strong>
        </div>
      </section>

      <div className="detail-grid" style={{ marginTop: 16 }}>
        <section className="panel">
          <div className="panel-header">
            <h2>Практический вывод</h2>
            <span className="status-pill info">{area.district}</span>
          </div>
          <div className="panel-body seo-content">
            <p>
              {area.name} нужно оценивать не только по средней цене. Для решения о покупке
              важны экспозиция объекта, история цены, инфраструктура в радиусе 500 м - 2 км
              и planned investments, которые могут изменить ликвидность улицы.
            </p>

            <h2>Кому район подходит</h2>
            <ul className="section-list">
              {area.buyerFit.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h2>Инвестиционный контекст</h2>
            <ul className="section-list">
              {area.investorFit.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h2>Риски</h2>
            <ul className="section-list">
              {area.risks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <aside className="panel">
          <div className="panel-header">
            <h2>Рыночные сигналы</h2>
            <FileText size={18} />
          </div>
          <div className="panel-body">
            <ul className="section-list">
              <li>Средняя экспозиция: {area.averageDaysOnMarket} дней.</li>
              <li>Предложение за 90 дней: {percent(area.supplyChange90dPct)}.</li>
              <li>Активных объявлений в MVP-выборке: {numberValue(area.activeListings)}.</li>
            </ul>

            <h2>Planned investments</h2>
            <ul className="section-list compact">
              {area.plannedInvestments.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h2>Дальше</h2>
            <div className="area-link-list">
              <Link className="button" href={`/news?area_id=${encodeURIComponent(area.areaId)}`}>
                Новости района
              </Link>
              {area.internalLinks.map((link) => (
                <Link className="button" key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

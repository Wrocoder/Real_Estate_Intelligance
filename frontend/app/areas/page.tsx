import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, MapPinned } from "lucide-react";

import { money, numberValue, percent } from "@/lib/format";
import { SEO_AREAS, siteUrl } from "@/lib/seoAreas";

export const metadata: Metadata = {
  title: "Районы Вроцлава: цены квартир, риски и потенциал | Domarion",
  description:
    "SEO-справочник Domarion по районам Вроцлава: цена за m2, активное предложение, динамика рынка, инфраструктура и риски покупки квартиры.",
  alternates: {
    canonical: `${siteUrl()}/areas`,
  },
};

export default function AreasPage() {
  return (
    <>
      <header className="page-header">
        <div>
          <h1>Районы Вроцлава</h1>
          <p>
            Статические SEO-страницы с рыночными метриками, рисками и практичными
            выводами для покупки квартиры.
          </p>
        </div>
        <div className="toolbar">
          <Link className="button" href="/areas/compare">
            <BarChart3 size={16} /> Сравнить
          </Link>
          <Link className="button primary" href="/">
            <MapPinned size={16} /> Открыть подбор
          </Link>
        </div>
      </header>

      <section className="seo-area-grid">
        {SEO_AREAS.map((area) => (
          <article className="seo-area-card" key={area.areaId}>
            <div>
              <span className="status-pill info">{area.city}</span>
              <h2>{area.name}</h2>
              <p>{area.description}</p>
            </div>
            <div className="area-metrics">
              <span>
                <small>Медиана</small>
                <strong>{money(area.medianPricePerM2)}/m2</strong>
              </span>
              <span>
                <small>Объявлений</small>
                <strong>{numberValue(area.activeListings)}</strong>
              </span>
              <span>
                <small>90 дней</small>
                <strong>{percent(area.priceChange90dPct)}</strong>
              </span>
            </div>
            <Link className="button" href={`/areas/${area.slug}`}>
              Подробнее <ArrowRight size={16} />
            </Link>
          </article>
        ))}
      </section>
    </>
  );
}

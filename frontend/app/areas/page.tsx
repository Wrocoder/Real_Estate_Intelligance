import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, MapPinned } from "lucide-react";

import { CoverageNotice } from "@/components/CoverageNotice";
import { AreaDynamicMetrics } from "@/components/AreaDynamicEvidence";
import type { AreaStatistics } from "@/lib/api";
import { SEO_AREAS, siteUrl } from "@/lib/seoAreas";
import { SEO_GUIDES } from "@/lib/seoGuides";

export const metadata: Metadata = {
  title: "Dzielnice Wrocławia: ceny mieszkań, ryzyka i potencjał | WartoMetr",
  description:
    "Przewodnik WartoMetr po dzielnicach Wrocławia: cena za m2, aktywna podaż, dynamika rynku, infrastruktura i ryzyka zakupu mieszkania.",
  alternates: {
    canonical: `${siteUrl()}/areas`,
  },
};

export default function AreasPage() {
  return (
    <>
      <header className="page-header">
        <div>
          <h1>Dzielnice Wrocławia</h1>
          <p>
            Porównaj dzielnice pod kątem ceny, płynności, transportu,
            infrastruktury i ryzyk przed zakupem mieszkania.
          </p>
        </div>
        <div className="toolbar">
          <Link className="button" href="/areas/compare">
            <BarChart3 size={16} /> Porównaj
          </Link>
          <Link className="button primary" href="/">
            <MapPinned size={16} /> Znajdź mieszkania
          </Link>
        </div>
      </header>

      <CoverageNotice />

      <section className="seo-area-grid">
        {SEO_AREAS.map((area) => (
          <article className="seo-area-card" key={area.areaId}>
            <div>
              <span className="status-pill info">{area.city}</span>
              <h2>{area.name}</h2>
              <p>{area.description}</p>
            </div>
            <AreaDynamicMetrics areaId={area.areaId} fallback={{ area_id: area.areaId, name: area.name, city: area.city, data_provenance: { mode: "demo", source_type: "editorial_fallback", notice_code: null }, median_price_per_m2: area.medianPricePerM2, average_price_per_m2: area.averagePricePerM2, active_listings: area.activeListings, new_listings_30d: 0, removed_listings_30d: 0, average_days_on_market: area.averageDaysOnMarket, price_change_90d_pct: area.priceChange90dPct, supply_change_90d_pct: area.supplyChange90dPct } satisfies AreaStatistics} />
            <Link className="button" href={`/areas/${area.slug}`}>
              Szczegóły <ArrowRight size={16} />
            </Link>
          </article>
        ))}
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>Przewodniki po wyborze dzielnicy</h2>
          <Link className="button" href="/guides">
            Wszystkie przewodniki
          </Link>
        </div>
        <div className="panel-body guide-related-grid">
          {SEO_GUIDES.slice(0, 4).map((guide) => (
            <Link className="guide-related-link" href={`/guides/${guide.slug}`} key={guide.slug}>
              <strong>{guide.title}</strong>
              <small>{guide.category}</small>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

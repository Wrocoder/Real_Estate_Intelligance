import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, ClipboardCheck, MapPinned } from "lucide-react";

import { SEO_GUIDES } from "@/lib/seoGuides";
import { siteUrl } from "@/lib/seoAreas";

export const metadata: Metadata = {
  title: "Przewodniki po zakupie mieszkania w Polsce | WartoMetr",
  description:
    "Praktyczne materiały WartoMetr: cena za m2, dzielnice, kredyt hipoteczny, lista kontroli, księga wieczysta i całkowity koszt zakupu.",
  alternates: {
    canonical: `${siteUrl()}/guides`,
  },
};

export default function GuidesPage() {
  return (
    <>
      <header className="page-header">
        <div>
          <h1>Przewodniki po zakupie mieszkania</h1>
          <p>
            Praktyczne materiały dla kupującego mieszkanie w Polsce: cena, dzielnica,
            dokumenty, kredyt, ryzyka i negocjacje.
          </p>
        </div>
        <div className="toolbar">
          <Link className="button" href="/areas">
            <MapPinned size={16} /> Dzielnice
          </Link>
          <Link className="button primary" href="/check">
            <ClipboardCheck size={16} /> Sprawdź mieszkanie
          </Link>
        </div>
      </header>

      <section className="seo-guide-grid">
        {SEO_GUIDES.map((guide) => (
          <article className="seo-guide-card" key={guide.slug}>
            <div>
              <span className="status-pill info">{guide.category}</span>
              <h2>{guide.title}</h2>
              <p>{guide.description}</p>
            </div>
            <ul className="section-list compact">
              {guide.keyTakeaways.slice(0, 2).map((item) => (
                <li key={item}>
                  <BookOpen size={14} /> {item}
                </li>
              ))}
            </ul>
            <Link className="button" href={`/guides/${guide.slug}`}>
              Czytaj <ArrowRight size={16} />
            </Link>
          </article>
        ))}
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, ClipboardCheck, MapPinned } from "lucide-react";

import { SEO_GUIDES } from "@/lib/seoGuides";
import { siteUrl } from "@/lib/seoAreas";

export const metadata: Metadata = {
  title: "Гайды по покупке недвижимости в Польше | Domarion",
  description:
    "SEO-гайды Domarion: цена за m2 Wrocław, районы, ипотека, checklist покупки, księga wieczysta и total purchase cost.",
  alternates: {
    canonical: `${siteUrl()}/guides`,
  },
};

export default function GuidesPage() {
  return (
    <>
      <header className="page-header">
        <div>
          <h1>Гайды по покупке недвижимости</h1>
          <p>
            Практичные SEO-страницы, которые связывают рыночную аналитику,
            районные страницы, проверку квартиры и paid reports.
          </p>
        </div>
        <div className="toolbar">
          <Link className="button" href="/areas">
            <MapPinned size={16} /> Районы
          </Link>
          <Link className="button primary" href="/check">
            <ClipboardCheck size={16} /> Проверить квартиру
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
              Читать <ArrowRight size={16} />
            </Link>
          </article>
        ))}
      </section>
    </>
  );
}
